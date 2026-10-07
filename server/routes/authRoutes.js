
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const User = require("../models/User");
const Organization = require("../models/Organization");
const OrganizationMember = require("../models/OrganizationMember");

const router = express.Router();

const allowedDomains = (process.env.ALLOWED_EMAIL_DOMAINS || "")
  .split(",")
  .map((d) => d.trim().toLowerCase())
  .filter(Boolean);

function emailAllowed(email) {
  if (!allowedDomains.length) return true;
  const domain = String(email).toLowerCase().split("@")[1];
  return !!domain && allowedDomains.includes(domain);
}

function sign(user, organizationId) {
  return jwt.sign(
    {
      id: user._id,
      name: user.name,
      role: user.role,
      organizationId: organizationId || null
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
}

function publicUser(user, organization) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    organization: organization
      ? {
          id: organization._id,
          name: organization.name,
          organizationId: organization.organizationId
        }
      : null
  };
}

async function getMemberships(user) {
  return OrganizationMember.find({
    user: user._id,
    role: user.role,
    status: "ACTIVE"
  }).populate("organization", "name organizationId active");
}

async function completeLogin(user, organizationId, requestedRole) {
  if (user.role !== requestedRole) {
    return { error: { status: 403, message: `This account is not a ${requestedRole} account.` } };
  }

  const memberships = await getMemberships(user);
  const active = memberships.filter((m) => m.organization?.active !== false);

  if (!active.length) {
    if (user.role === "technician") {
      return {
        token: sign(user, null),
        user: publicUser(user, null),
        organizations: [],
        needsOrganization: false
      };
    }
    return {
      error: {
        status: 403,
        message: "Your account is not connected to an active organisation."
      }
    };
  }

  let selected = null;

  if (organizationId) {
    selected = active.find(
      (m) => String(m.organization._id) === String(organizationId)
    );
    if (!selected) {
      return {
        error: {
          status: 403,
          message: "You do not have access to this organisation."
        }
      };
    }
  } else if (active.length === 1) {
    selected = active[0];
  }

  if (!selected) {
    return {
      needsOrganization: true,
      organizations: active.map((m) => ({
        id: m.organization._id,
        name: m.organization.name,
        organizationId: m.organization.organizationId
      })),
      selectionToken: jwt.sign(
        { id: user._id, role: user.role, purpose: "organization-selection" },
        process.env.JWT_SECRET,
        { expiresIn: "10m" }
      )
    };
  }

  return {
    token: sign(user, selected.organization._id),
    user: publicUser(user, selected.organization),
    organizations: active.map((m) => ({
      id: m.organization._id,
      name: m.organization.name,
      organizationId: m.organization.organizationId
    })),
    needsOrganization: false
  };
}

// Create an organisation + its first admin.
router.post("/register-organization", async (req, res) => {
  try {
    const { organizationName, organizationId, name, email, password } = req.body;

    if (!organizationName || !organizationId || !name || !email || !password) {
      return res.status(400).json({ message: "All organisation and admin fields are required." });
    }

    if (!emailAllowed(email)) {
      return res.status(400).json({ message: "This email domain is not allowed." });
    }

    const normalizedOrgId = String(organizationId).trim().toUpperCase();
    const normalizedEmail = String(email).trim().toLowerCase();

    const [orgExists, userExists] = await Promise.all([
      Organization.findOne({ organizationId: normalizedOrgId }),
      User.findOne({ email: normalizedEmail })
    ]);

    if (orgExists) {
      return res.status(409).json({ message: "Organisation ID already exists. Choose another one." });
    }
    if (userExists) {
      return res.status(409).json({ message: "Email already registered. Please use another email." });
    }

    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({
      name: String(name).trim(),
      email: normalizedEmail,
      password: hash,
      role: "admin"
    });

    const organization = await Organization.create({
      name: String(organizationName).trim(),
      organizationId: normalizedOrgId,
      createdBy: user._id
    });

    await OrganizationMember.create({
      organization: organization._id,
      user: user._id,
      role: "admin",
      status: "ACTIVE"
    });

    res.status(201).json({
      token: sign(user, organization._id),
      user: publicUser(user, organization),
      message: "Organisation and administrator account created successfully."
    });
  } catch (e) {
    console.error("REGISTER ORGANISATION:", e);
    res.status(500).json({ message: e.message });
  }
});

// Create a normal user account and connect it to an organisation.
router.post("/register-user", async (req, res) => {
  try {
    const { name, email, password, organizationId } = req.body;

    if (!name || !email || !password || !organizationId) {
      return res.status(400).json({ message: "Name, email, password and organisation ID are required." });
    }

    if (!emailAllowed(email)) {
      return res.status(400).json({ message: "This email domain is not allowed." });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const normalizedOrgId = String(organizationId).trim().toUpperCase();

    const [org, exists] = await Promise.all([
      Organization.findOne({ organizationId: normalizedOrgId, active: true }),
      User.findOne({ email: normalizedEmail })
    ]);

    if (!org) return res.status(404).json({ message: "Organisation not found or inactive." });
    if (exists) return res.status(409).json({ message: "Email already registered. Please login instead." });

    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({
      name: String(name).trim(),
      email: normalizedEmail,
      password: hash,
      role: "user"
    });

    await OrganizationMember.create({
      organization: org._id,
      user: user._id,
      role: "user",
      status: "ACTIVE"
    });

    res.status(201).json({
      token: sign(user, org._id),
      user: publicUser(user, org),
      message: "User account created successfully."
    });
  } catch (e) {
    console.error("REGISTER USER:", e);
    res.status(500).json({ message: e.message });
  }
});

// Technician creates a global account. Organisation access is granted by admins.
router.post("/register-technician", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email and password are required." });
    }

    if (!emailAllowed(email)) {
      return res.status(400).json({ message: "This email domain is not allowed." });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    if (await User.findOne({ email: normalizedEmail })) {
      return res.status(409).json({ message: "Email already registered. Please login instead." });
    }

    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({
      name: String(name).trim(),
      email: normalizedEmail,
      password: hash,
      role: "technician"
    });

    res.status(201).json({
      token: sign(user, null),
      user: publicUser(user, null),
      message: "Technician account created. Ask an organisation admin to add you."
    });
  } catch (e) {
    console.error("REGISTER TECHNICIAN:", e);
    res.status(500).json({ message: e.message });
  }
});

// Role-specific login. A technician with multiple organisations can select one.
router.post("/login", async (req, res) => {
  try {
    const { email, password, role, organizationId } = req.body;

    if (!email || !password || !role) {
      return res.status(400).json({ message: "Email, password and account type are required." });
    }

    const normalizedRole = String(role).toLowerCase();
    if (!["admin", "technician", "user"].includes(normalizedRole)) {
      return res.status(400).json({ message: "Invalid account type." });
    }

    const user = await User.findOne({ email: String(email).trim().toLowerCase() });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const result = await completeLogin(user, organizationId, normalizedRole);

    if (result.error) {
      return res.status(result.error.status).json({ message: result.error.message });
    }

    res.json(result);
  } catch (e) {
    console.error("LOGIN:", e);
    res.status(500).json({ message: e.message });
  }
});

router.get("/organizations/:organizationId", async (req, res) => {
  const organization = await Organization.findOne({
    organizationId: String(req.params.organizationId).trim().toUpperCase(),
    active: true
  }).select("name organizationId");

  if (!organization) {
    return res.status(404).json({ message: "Organisation not found." });
  }

  res.json(organization);
});

router.post("/select-organization", async (req, res) => {
  try {
    const { organizationId } = req.body;
    const header = req.headers.authorization || "";
    if (!header.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Selection authentication required." });
    }

    let selection;
    try {
      selection = jwt.verify(header.split(" ")[1], process.env.JWT_SECRET);
    } catch {
      return res.status(401).json({ message: "Selection session expired. Please login again." });
    }

    if (selection.purpose !== "organization-selection") {
      return res.status(401).json({ message: "Invalid selection session." });
    }

    if (!organizationId) {
      return res.status(400).json({ message: "Organisation is required." });
    }

    const user = await User.findById(selection.id);
    if (!user) return res.status(404).json({ message: "User not found." });

    const membership = await OrganizationMember.findOne({
      user: user._id,
      organization: organizationId,
      role: user.role,
      status: "ACTIVE"
    }).populate("organization", "name organizationId");

    if (!membership) {
      return res.status(403).json({ message: "You are not a member of this organisation." });
    }

    res.json({
      token: sign(user, membership.organization._id),
      user: publicUser(user, membership.organization)
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

router.post("/forgot-password", async (req, res) => {
  if (!req.body.email) return res.status(400).json({ message: "Email is required" });
  res.json({ message: "Password reset request received successfully." });
});

module.exports = router;


const express = require("express");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const OrganizationMember = require("../models/OrganizationMember");
const { auth, allowRoles } = require("../middleware/auth");

const router = express.Router();

router.get("/", auth, allowRoles("admin"), async (req, res) => {
  try {
    const members = await OrganizationMember.find({
      organization: req.user.organizationId,
      status: { $in: ["ACTIVE", "INVITED"] }
    })
      .populate("user", "name email role createdAt")
      .sort({ createdAt: -1 });

    res.json(members.map((m) => ({
      membershipId: m._id,
      _id: m.user._id,
      name: m.user.name,
      email: m.user.email,
      role: m.role,
      status: m.status,
      joinedAt: m.joinedAt
    })));
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch organisation members." });
  }
});

router.get("/technicians", auth, allowRoles("admin"), async (req, res) => {
  try {
    const members = await OrganizationMember.find({
      organization: req.user.organizationId,
      role: "technician",
      status: "ACTIVE"
    }).populate("user", "name email role");

    res.json(members.map((m) => ({
      _id: m.user._id,
      name: m.user.name,
      email: m.user.email,
      membershipId: m._id
    })));
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch technicians." });
  }
});

router.post("/members", auth, allowRoles("admin"), async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !role) {
      return res.status(400).json({ message: "Name, email and role are required." });
    }

    if (!["admin", "technician", "user"].includes(role)) {
      return res.status(400).json({ message: "Invalid role." });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    let user = await User.findOne({ email: normalizedEmail });

    if (user) {
      if (user.role !== role) {
        return res.status(400).json({
          message: `This email already belongs to a ${user.role} account. A single account cannot have a different global role.`
        });
      }

      const existingMembership = await OrganizationMember.findOne({
        organization: req.user.organizationId,
        user: user._id
      });

      if (existingMembership) {
        return res.status(409).json({ message: "This person is already a member of your organisation." });
      }
    } else {
      if (!password) {
        return res.status(400).json({ message: "Password is required for a new account." });
      }

      const hash = await bcrypt.hash(password, 10);
      user = await User.create({
        name: String(name).trim(),
        email: normalizedEmail,
        password: hash,
        role
      });
    }

    const membership = await OrganizationMember.create({
      organization: req.user.organizationId,
      user: user._id,
      role,
      status: "ACTIVE"
    });

    res.status(201).json({
      message: `${role} added to the organisation successfully.`,
      member: {
        membershipId: membership._id,
        id: user._id,
        name: user.name,
        email: user.email,
        role
      }
    });
  } catch (error) {
    console.error("ADD MEMBER:", error);
    res.status(500).json({ message: error.message });
  }
});

router.delete("/members/:membershipId", auth, allowRoles("admin"), async (req, res) => {
  try {
    const membership = await OrganizationMember.findOne({
      _id: req.params.membershipId,
      organization: req.user.organizationId
    });

    if (!membership) return res.status(404).json({ message: "Membership not found." });
    if (String(membership.user) === String(req.user.id)) {
      return res.status(400).json({ message: "You cannot remove your own organisation membership." });
    }

    await membership.deleteOne();
    res.json({ message: "Member removed from this organisation." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;

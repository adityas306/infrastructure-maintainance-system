
const jwt = require("jsonwebtoken");
const OrganizationMember = require("../models/OrganizationMember");

async function auth(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Authentication required" });
  }

  try {
    req.user = jwt.verify(header.split(" ")[1], process.env.JWT_SECRET);

    if (req.user.organizationId) {
      const membership = await OrganizationMember.findOne({
        user: req.user.id,
        organization: req.user.organizationId,
        role: req.user.role,
        status: "ACTIVE"
      });

      if (!membership) {
        return res.status(403).json({ message: "Your organisation access is inactive." });
      }
      req.membership = membership;
    }

    next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

function allowRoles(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Access denied" });
    }
    next();
  };
}

module.exports = { auth, allowRoles };


const express = require("express");
const Asset = require("../models/Asset");
const Ticket = require("../models/Ticket");
const OrganizationMember = require("../models/OrganizationMember");
const { auth } = require("../middleware/auth");

const router = express.Router();

router.get("/stats", auth, async (req, res) => {
  try {
    if (!req.user.organizationId) {
      return res.json({
        role: req.user.role,
        organizationRequired: true
      });
    }

    const org = req.user.organizationId;

    if (req.user.role === "admin") {
      const [
        assets,
        open,
        assigned,
        resolved,
        technicians,
        faultyAssets,
        admins,
        users
      ] = await Promise.all([
        Asset.countDocuments({ organization: org }),
        Ticket.countDocuments({ organization: org, status: "OPEN" }),
        Ticket.countDocuments({ organization: org, status: { $in: ["ASSIGNED", "IN_PROGRESS"] } }),
        Ticket.countDocuments({ organization: org, status: { $in: ["RESOLVED", "CLOSED"] } }),
        OrganizationMember.countDocuments({ organization: org, role: "technician", status: "ACTIVE" }),
        Asset.countDocuments({ organization: org, status: "FAULT" }),
        OrganizationMember.countDocuments({ organization: org, role: "admin", status: "ACTIVE" }),
        OrganizationMember.countDocuments({ organization: org, role: "user", status: "ACTIVE" })
      ]);

      return res.json({
        role: "admin",
        assets,
        open,
        assigned,
        resolved,
        technicians,
        faultyAssets,
        admins,
        users
      });
    }

    if (req.user.role === "user") {
      const contributions = await Ticket.countDocuments({
        organization: org,
        reportedBy: req.user.id
      });

      const openReports = await Ticket.countDocuments({
        organization: org,
        reportedBy: req.user.id,
        status: { $in: ["OPEN", "ASSIGNED", "IN_PROGRESS"] }
      });

      const resolvedReports = await Ticket.countDocuments({
        organization: org,
        reportedBy: req.user.id,
        status: { $in: ["RESOLVED", "CLOSED"] }
      });

      return res.json({ role: "user", contributions, openReports, resolvedReports });
    }

    if (req.user.role === "technician") {
      const assignedProblems = await Ticket.countDocuments({
        organization: org,
        technician: req.user.id
      });

      const pendingProblems = await Ticket.countDocuments({
        organization: org,
        technician: req.user.id,
        status: "ASSIGNED"
      });

      const inProgress = await Ticket.countDocuments({
        organization: org,
        technician: req.user.id,
        status: "IN_PROGRESS"
      });

      const resolvedProblems = await Ticket.countDocuments({
        organization: org,
        technician: req.user.id,
        status: { $in: ["RESOLVED", "CLOSED"] }
      });

      return res.json({
        role: "technician",
        assignedProblems,
        pendingProblems,
        inProgress,
        resolvedProblems
      });
    }

    res.status(403).json({ message: "Invalid user role" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;

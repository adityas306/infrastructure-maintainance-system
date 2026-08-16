const express = require("express");
const Asset = require("../models/Asset");
const Ticket = require("../models/Ticket");
const User = require("../models/User");
const { auth } = require("../middleware/auth");

const router = express.Router();

router.get("/stats", auth, async (req, res) => {
  try {
    // ADMIN DASHBOARD
    if (req.user.role === "admin") {
      const assets = await Asset.countDocuments();

      const open = await Ticket.countDocuments({
        status: "OPEN"
      });

      const assigned = await Ticket.countDocuments({
        status: {
          $in: ["ASSIGNED", "IN_PROGRESS"]
        }
      });

      const resolved = await Ticket.countDocuments({
        status: {
          $in: ["RESOLVED", "CLOSED"]
        }
      });

      const technicians = await User.countDocuments({
        role: "technician"
      });

      const faultyAssets = await Asset.countDocuments({
        status: "FAULT"
      });

      return res.json({
        role: "admin",
        assets,
        open,
        assigned,
        resolved,
        technicians,
        faultyAssets
      });
    }

    // USER DASHBOARD
    if (req.user.role === "user") {
      const contributions = await Ticket.countDocuments({
        reportedBy: req.user.id
      });

      const openReports = await Ticket.countDocuments({
        reportedBy: req.user.id,
        status: {
          $in: ["OPEN", "ASSIGNED", "IN_PROGRESS"]
        }
      });

      const resolvedReports = await Ticket.countDocuments({
        reportedBy: req.user.id,
        status: {
          $in: ["RESOLVED", "CLOSED"]
        }
      });

      return res.json({
        role: "user",
        contributions,
        openReports,
        resolvedReports
      });
    }

    // TECHNICIAN DASHBOARD
    if (req.user.role === "technician") {
      const assignedProblems = await Ticket.countDocuments({
        technician: req.user.id
      });

      const pendingProblems = await Ticket.countDocuments({
        technician: req.user.id,
        status: "ASSIGNED"
      });

      const inProgress = await Ticket.countDocuments({
        technician: req.user.id,
        status: "IN_PROGRESS"
      });

      const resolvedProblems = await Ticket.countDocuments({
        technician: req.user.id,
        status: {
          $in: ["RESOLVED", "CLOSED"]
        }
      });

      return res.json({
        role: "technician",
        assignedProblems,
        pendingProblems,
        inProgress,
        resolvedProblems
      });
    }

    return res.status(403).json({
      message: "Invalid user role"
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: error.message
    });
  }
});

module.exports = router;
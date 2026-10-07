const express = require("express");
const Ticket = require("../models/Ticket");
const Asset = require("../models/Asset");
const Maintenance = require("../models/Maintenance");
const OrganizationMember = require("../models/OrganizationMember");
const { auth, allowRoles } = require("../middleware/auth");
const upload = require("../middleware/upload");

const router = express.Router();

async function populateTicket(ticket) {
  return ticket.populate([
    { path: "asset" },
    { path: "reportedBy", select: "name email" },
    { path: "technician", select: "name email" }
  ]);
}


/* =========================================================
   GET ALL TICKETS
   ========================================================= */

router.get("/", auth, async (req, res) => {
  try {
    if (!req.user.organizationId) {
      return res.json([]);
    }

    const filter = {
      organization: req.user.organizationId
    };

    if (req.user.role === "technician") {
      filter.technician = req.user.id;
    } else if (req.user.role === "user") {
      filter.reportedBy = req.user.id;
    }

    const tickets = await Ticket.find(filter)
      .populate("asset")
      .populate("reportedBy", "name email")
      .populate("technician", "name email")
      .sort({ createdAt: -1 });

    res.json(tickets);
  } catch (e) {
    res.status(500).json({
      message: "Unable to load tickets."
    });
  }
});


/* =========================================================
   CREATE TICKET / REPORT FAULT
   ========================================================= */

router.post(
  "/",
  auth,
  allowRoles("user", "admin"),
  upload.single("image"),
  async (req, res) => {
    try {
      if (!req.user.organizationId) {
        return res.status(400).json({
          message: "Select an organisation first."
        });
      }

      const {
        assetId,
        title,
        description,
        priority
      } = req.body;

      // Fault image mandatory
      if (!req.file) {
        return res.status(400).json({
          message: "Fault image is required."
        });
      }

      const asset = await Asset.findOne({
        _id: assetId,
        organization: req.user.organizationId
      });

      if (!asset) {
        return res.status(404).json({
          message: "Asset not found in your organisation."
        });
      }

      const hours =
        priority === "CRITICAL"
          ? 2
          : priority === "HIGH"
          ? 4
          : priority === "MEDIUM"
          ? 8
          : 24;

      const deadline = new Date(
        Date.now() + hours * 60 * 60 * 1000
      );

      const ticket = await Ticket.create({
        organization: req.user.organizationId,
        asset: assetId,
        reportedBy: req.user.id,

        title,
        description,
        priority,

        // User fault image
        proofImage: req.file.path,

        // Initially same image as proof image
        beforeRepairImage: req.file.path,

        slaHours: hours,
        slaDeadline: deadline
      });

      asset.status = "FAULT";
      await asset.save();

      res.status(201).json(
        await populateTicket(ticket)
      );
    } catch (e) {
      res.status(400).json({
        message: e.message
      });
    }
  }
);


/* =========================================================
   ASSIGN TECHNICIAN
   ========================================================= */

router.put(
  "/:id/assign",
  auth,
  allowRoles("admin"),
  async (req, res) => {
    try {
      const { technicianId } = req.body;

      const member = await OrganizationMember.findOne({
        organization: req.user.organizationId,
        user: technicianId,
        role: "technician",
        status: "ACTIVE"
      });

      if (!member) {
        return res.status(404).json({
          message:
            "Technician is not an active member of this organisation."
        });
      }

      const ticket = await Ticket.findOne({
        _id: req.params.id,
        organization: req.user.organizationId
      });

      if (!ticket) {
        return res.status(404).json({
          message: "Ticket not found."
        });
      }

      ticket.technician = technicianId;

      ticket.assignmentStatus =
        ticket.assignmentStatus === "REFUSED"
          ? "REASSIGNED"
          : "PENDING";

      ticket.refusalReason = "";
      ticket.status = "ASSIGNED";

      await ticket.save();

      res.json(
        await populateTicket(ticket)
      );
    } catch (e) {
      res.status(400).json({
        message: e.message
      });
    }
  }
);


/* =========================================================
   TECHNICIAN ACCEPT / REFUSE
   ========================================================= */

router.put(
  "/:id/assignment-response",
  auth,
  allowRoles("technician"),
  async (req, res) => {
    try {
      const { action, reason } = req.body;

      const ticket = await Ticket.findOne({
        _id: req.params.id,
        organization: req.user.organizationId,
        technician: req.user.id
      });

      if (!ticket) {
        return res.status(404).json({
          message: "Assignment not found."
        });
      }

      if (ticket.status !== "ASSIGNED") {
        return res.status(400).json({
          message: "This assignment is no longer pending."
        });
      }

      if (action === "ACCEPT") {
        ticket.assignmentStatus = "ACCEPTED";
        ticket.status = "IN_PROGRESS";
        ticket.refusalReason = "";
      }

      else if (action === "REFUSE") {
        if (!reason?.trim()) {
          return res.status(400).json({
            message:
              "Please provide a reason for refusing the assignment."
          });
        }

        ticket.assignmentStatus = "REFUSED";
        ticket.status = "OPEN";
        ticket.refusalReason = reason.trim();
        ticket.technician = null;
      }

      else {
        return res.status(400).json({
          message:
            "Action must be ACCEPT or REFUSE."
        });
      }

      await ticket.save();

      res.json(
        await populateTicket(ticket)
      );
    } catch (e) {
      res.status(400).json({
        message: e.message
      });
    }
  }
);


/* =========================================================
   UPDATE STATUS
   =========================================================
   
   RESOLVED is intentionally NOT handled here.
   Technician must use /repair so that
   after-repair image is mandatory.
   ========================================================= */

router.put(
  "/:id/status",
  auth,
  async (req, res) => {
    try {
      const { status } = req.body;

      // RESOLVED is handled by /repair
      if (!["IN_PROGRESS", "CLOSED"].includes(status)) {
        return res.status(400).json({
          message:
            "Invalid status. Use the repair option to resolve a ticket."
        });
      }

      const ticket = await Ticket.findOne({
        _id: req.params.id,
        organization: req.user.organizationId
      }).populate("asset");

      if (!ticket) {
        return res.status(404).json({
          message: "Ticket not found."
        });
      }

      if (
        req.user.role === "technician" &&
        String(ticket.technician?._id || ticket.technician) !==
          String(req.user.id)
      ) {
        return res.status(403).json({
          message: "This ticket is not assigned to you."
        });
      }

      if (
        req.user.role === "technician" &&
        status === "IN_PROGRESS"
      ) {
        ticket.assignmentStatus = "ACCEPTED";
      }

      ticket.status = status;

      await ticket.save();

      res.json(
        await populateTicket(ticket)
      );
    } catch (e) {
      res.status(400).json({
        message: e.message
      });
    }
  }
);


/* =========================================================
   COMPLETE REPAIR
   =========================================================
   
   Technician must upload AFTER repair image.
   
   BEFORE image = original user fault image.
   AFTER image = technician uploaded image.
   ========================================================= */

router.put(
  "/:id/repair",
  auth,
  allowRoles("technician"),
  upload.single("afterRepairImage"),
  async (req, res) => {
    try {
      if (!req.user.organizationId) {
        return res.status(400).json({
          message: "Organisation not found."
        });
      }

      // After repair image is mandatory
      if (!req.file) {
        return res.status(400).json({
          message:
            "After-repair image is required."
        });
      }

      const {
        repairDate,
        repairNote
      } = req.body;

      const ticket = await Ticket.findOne({
        _id: req.params.id,
        organization: req.user.organizationId,
        technician: req.user.id
      }).populate("asset");

      if (!ticket) {
        return res.status(404).json({
          message:
            "Ticket not found or this ticket is not assigned to you."
        });
      }

      if (ticket.assignmentStatus !== "ACCEPTED") {
        return res.status(400).json({
          message:
            "You must accept the assignment before repairing this ticket."
        });
      }

      if (ticket.status !== "IN_PROGRESS") {
        return res.status(400).json({
          message:
            "Only an in-progress ticket can be repaired."
        });
      }

      /*
       * BEFORE REPAIR
       * Automatically use the original
       * fault-report image.
       */
      ticket.beforeRepairImage =
        ticket.proofImage;

      /*
       * AFTER REPAIR
       * Image uploaded by technician.
       */
      ticket.afterRepairImage =
        req.file.path;

      ticket.repairDate =
        repairDate
          ? new Date(repairDate)
          : new Date();

      ticket.repairNote =
        repairNote?.trim() || "";

      ticket.resolutionNote =
        ticket.repairNote ||
        "Repair completed successfully.";

      ticket.resolvedAt = new Date();

      ticket.status = "RESOLVED";

      // Asset becomes working again
      if (ticket.asset) {
        ticket.asset.status = "WORKING";
        await ticket.asset.save();
      }

      /*
       * Maintenance history record
       */
      await Maintenance.create({
        organization: req.user.organizationId,
        asset: ticket.asset._id,
        ticket: ticket._id,
        technician: req.user.id,
        action: "REPAIR",
        note:
          ticket.repairNote ||
          "Repair completed"
      });

      await ticket.save();

      res.json(
        await populateTicket(ticket)
      );
    } catch (e) {
      res.status(400).json({
        message: e.message
      });
    }
  }
);


/* =========================================================
   MAINTENANCE HISTORY
   ========================================================= */

router.get(
  "/maintenance/:assetId",
  auth,
  async (req, res) => {
    try {
      const records = await Maintenance.find({
        organization: req.user.organizationId,
        asset: req.params.assetId
      })
        .populate("technician", "name email")
        .sort({ createdAt: -1 });

      res.json(records);
    } catch (e) {
      res.status(500).json({
        message:
          "Unable to load maintenance history."
      });
    }
  }
);


module.exports = router;

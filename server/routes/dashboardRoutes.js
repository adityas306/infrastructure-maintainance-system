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

    // =====================================================
    // ADMIN DASHBOARD
    // =====================================================
    if (req.user.role === "admin") {
      const [
        assets,
        workingAssets,
        faultyAssets,
        maintenanceAssets,

        open,
        assigned,
        inProgress,
        resolved,
        closed,

        technicians,
        admins,
        users,

        priorityIssues,
        recentTickets,
        recentAssets
      ] = await Promise.all([
        // ---------------- ASSETS ----------------
        Asset.countDocuments({
          organization: org
        }),

        Asset.countDocuments({
          organization: org,
          status: "WORKING"
        }),

        Asset.countDocuments({
          organization: org,
          status: "FAULT"
        }),

        Asset.countDocuments({
          organization: org,
          status: "MAINTENANCE"
        }),

        // ---------------- TICKETS ----------------
        Ticket.countDocuments({
          organization: org,
          status: "OPEN"
        }),

        Ticket.countDocuments({
          organization: org,
          status: "ASSIGNED"
        }),

        Ticket.countDocuments({
          organization: org,
          status: "IN_PROGRESS"
        }),

        Ticket.countDocuments({
          organization: org,
          status: "RESOLVED"
        }),

        Ticket.countDocuments({
          organization: org,
          status: "CLOSED"
        }),

        // ---------------- MEMBERS ----------------
        OrganizationMember.countDocuments({
          organization: org,
          role: "technician",
          status: "ACTIVE"
        }),

        OrganizationMember.countDocuments({
          organization: org,
          role: "admin",
          status: "ACTIVE"
        }),

        OrganizationMember.countDocuments({
          organization: org,
          role: "user",
          status: "ACTIVE"
        }),

        // =================================================
        // PRIORITY ISSUES
        // =================================================
        Ticket.find({
          organization: org,
          status: {
            $in: ["OPEN", "ASSIGNED", "IN_PROGRESS"]
          },
          priority: {
            $in: ["CRITICAL", "HIGH"]
          }
        })
          .sort({
            priority: 1,
            createdAt: -1
          })
          .limit(5)
          .populate("asset", "name assetCode locationName")
          .populate("technician", "name email"),

        // =================================================
        // RECENT TICKETS
        // =================================================
        Ticket.find({
          organization: org
        })
          .sort({
            createdAt: -1
          })
          .limit(6)
          .populate("asset", "name assetCode locationName")
          .populate("technician", "name email"),

        // =================================================
        // RECENT ASSETS
        // =================================================
        Asset.find({
          organization: org
        })
          .sort({
            createdAt: -1
          })
          .limit(5)
          .select(
            "name assetCode category locationName status createdAt"
          )
      ]);

      // =====================================================
      // SLA INFORMATION
      // =====================================================

      const now = new Date();

      const overdue = await Ticket.countDocuments({
        organization: org,
        status: {
          $in: ["OPEN", "ASSIGNED", "IN_PROGRESS"]
        },
        slaDeadline: {
          $lt: now
        }
      });

      const oneHourFromNow = new Date(
        now.getTime() + 60 * 60 * 1000
      );

      const dueSoon = await Ticket.countDocuments({
        organization: org,
        status: {
          $in: ["OPEN", "ASSIGNED", "IN_PROGRESS"]
        },
        slaDeadline: {
          $gte: now,
          $lte: oneHourFromNow
        }
      });

      const activeTickets =
        open + assigned + inProgress;

      const onTrack = Math.max(
        0,
        activeTickets - overdue - dueSoon
      );

      // =====================================================
      // TECHNICIAN WORKLOAD
      // =====================================================

      const technicianWorkload =
        await Ticket.aggregate([
          {
            $match: {
              organization: org,
              technician: {
                $ne: null
              },
              status: {
                $in: [
                  "ASSIGNED",
                  "IN_PROGRESS"
                ]
              }
            }
          },

          {
            $group: {
              _id: "$technician",
              activeTickets: {
                $sum: 1
              }
            }
          },

          {
            $sort: {
              activeTickets: -1
            }
          },

          {
            $limit: 10
          }
        ]);

      // Populate technician names
      const technicianIds =
        technicianWorkload.map(
          (item) => item._id
        );

      const technicianUsers =
        technicianIds.length
          ? await require("../models/User").find({
              _id: {
                $in: technicianIds
              }
            }).select("name email")
          : [];

      const technicianMap =
        new Map(
          technicianUsers.map(
            (tech) => [
              tech._id.toString(),
              tech
            ]
          )
        );

      const formattedTechnicianWorkload =
        technicianWorkload.map((item) => {
          const technician =
            technicianMap.get(
              item._id.toString()
            );

          return {
            technicianId: item._id,
            name:
              technician?.name ||
              "Unknown Technician",
            email:
              technician?.email || "",
            activeTickets:
              item.activeTickets
          };
        });

      return res.json({
        role: "admin",

        // ---------------- ASSETS ----------------
        assets,

        workingAssets,
        faultyAssets,
        maintenanceAssets,

        // ---------------- TICKETS ----------------
        open,
        assigned,
        inProgress,
        resolved,
        closed,

        // ---------------- MEMBERS ----------------
        technicians,
        admins,
        users,

        // ---------------- PRIORITY ----------------
        priorityIssues,

        // ---------------- RECENT DATA ----------------
        recentTickets,
        recentAssets,

        // ---------------- SLA ----------------
        sla: {
          overdue,
          dueSoon,
          onTrack
        },

        // ---------------- TECHNICIAN ----------------
        technicianWorkload
          : formattedTechnicianWorkload
      });
    }

    // =====================================================
    // USER DASHBOARD
    // =====================================================
    if (req.user.role === "user") {
      const [
        contributions,
        openReports,
        resolvedReports
      ] = await Promise.all([
        Ticket.countDocuments({
          organization: org,
          reportedBy: req.user.id
        }),

        Ticket.countDocuments({
          organization: org,
          reportedBy: req.user.id,
          status: {
            $in: [
              "OPEN",
              "ASSIGNED",
              "IN_PROGRESS"
            ]
          }
        }),

        Ticket.countDocuments({
          organization: org,
          reportedBy: req.user.id,
          status: {
            $in: [
              "RESOLVED",
              "CLOSED"
            ]
          }
        })
      ]);

      return res.json({
        role: "user",
        contributions,
        openReports,
        resolvedReports
      });
    }

    // =====================================================
    // TECHNICIAN DASHBOARD
    // =====================================================
    if (req.user.role === "technician") {
      const [
        assignedProblems,
        pendingProblems,
        inProgress,
        resolvedProblems
      ] = await Promise.all([
        Ticket.countDocuments({
          organization: org,
          technician: req.user.id
        }),

        Ticket.countDocuments({
          organization: org,
          technician: req.user.id,
          status: "ASSIGNED"
        }),

        Ticket.countDocuments({
          organization: org,
          technician: req.user.id,
          status: "IN_PROGRESS"
        }),

        Ticket.countDocuments({
          organization: org,
          technician: req.user.id,
          status: {
            $in: [
              "RESOLVED",
              "CLOSED"
            ]
          }
        })
      ]);

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
    console.error(
      "Dashboard stats error:",
      error
    );

    return res.status(500).json({
      message: error.message
    });
  }
});

module.exports = router;
const mongoose = require("mongoose");

const ticketSchema = new mongoose.Schema(
  {
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true
    },

    asset: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Asset",
      required: true
    },

    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    technician: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },

    title: {
      type: String,
      required: true
    },

    description: {
      type: String,
      required: true
    },

    // User ki fault report ke time wali image
    proofImage: {
      type: String,
      required: true
    },

    // Repair ke time
    // Ye automatically proofImage ke equal rahegi
    beforeRepairImage: {
      type: String
    },

    // Technician repair ke baad ye image upload karega
    afterRepairImage: {
      type: String
    },

    repairDate: {
      type: Date
    },

    repairNote: {
      type: String
    },

    priority: {
      type: String,
      enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
      default: "MEDIUM"
    },

    status: {
      type: String,
      enum: [
        "OPEN",
        "ASSIGNED",
        "IN_PROGRESS",
        "RESOLVED",
        "CLOSED"
      ],
      default: "OPEN"
    },

    assignmentStatus: {
      type: String,
      enum: [
        "PENDING",
        "ACCEPTED",
        "REFUSED",
        "REASSIGNED"
      ],
      default: "PENDING"
    },

    refusalReason: {
      type: String
    },

    slaHours: {
      type: Number,
      default: 4
    },

    slaDeadline: {
      type: Date
    },

    resolvedAt: {
      type: Date
    },

    resolutionNote: {
      type: String
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Ticket", ticketSchema);
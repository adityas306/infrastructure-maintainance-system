const mongoose = require("mongoose");

const ticketSchema = new mongoose.Schema(
  {
    asset: { type: mongoose.Schema.Types.ObjectId, ref: "Asset", required: true },
    reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    technician: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    title: { type: String, required: true },
    description: { type: String, required: true },
    priority: {
      type: String,
      enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
      default: "MEDIUM"
    },
    status: {
      type: String,
      enum: ["OPEN", "ASSIGNED", "IN_PROGRESS", "RESOLVED", "CLOSED"],
      default: "OPEN"
    },
    slaHours: { type: Number, default: 4 },
    slaDeadline: Date,
    resolvedAt: Date,
    resolutionNote: String
  },
  { timestamps: true }
);

module.exports = mongoose.model("Ticket", ticketSchema);

const mongoose = require("mongoose");

const maintenanceSchema = new mongoose.Schema(
  {
    asset: { type: mongoose.Schema.Types.ObjectId, ref: "Asset", required: true },
    ticket: { type: mongoose.Schema.Types.ObjectId, ref: "Ticket" },
    technician: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    action: { type: String, required: true },
    note: String
  },
  { timestamps: true }
);

module.exports = mongoose.model("Maintenance", maintenanceSchema);

const express = require("express");
const Ticket = require("../models/Ticket");
const Asset = require("../models/Asset");
const Maintenance = require("../models/Maintenance");
const User = require("../models/User");
const { auth, allowRoles } = require("../middleware/auth");

const router = express.Router();

router.get("/", auth, async (req, res) => {
  const filter = req.user.role === "technician" ? { technician: req.user.id } : {};
  const tickets = await Ticket.find(filter)
    .populate("asset")
    .populate("reportedBy", "name email")
    .populate("technician", "name email")
    .sort({ createdAt: -1 });
  res.json(tickets);
});

router.post("/", auth, async (req, res) => {
  try {
    const { assetId, title, description, priority } = req.body;
    const asset = await Asset.findById(assetId);
    if (!asset) return res.status(404).json({ message: "Asset not found" });

    const hours = priority === "CRITICAL" ? 2 : priority === "HIGH" ? 4 : priority === "MEDIUM" ? 8 : 24;
    const deadline = new Date(Date.now() + hours * 60 * 60 * 1000);

    const ticket = await Ticket.create({
      asset: assetId,
      reportedBy: req.user.id,
      title,
      description,
      priority,
      slaHours: hours,
      slaDeadline: deadline
    });

    asset.status = "FAULT";
    await asset.save();

    res.status(201).json(await ticket.populate("asset"));
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

router.put("/:id/assign", auth, allowRoles("admin"), async (req, res) => {
  const { technicianId } = req.body;
  const tech = await User.findOne({ _id: technicianId, role: "technician" });
  if (!tech) return res.status(404).json({ message: "Technician not found" });

  const ticket = await Ticket.findByIdAndUpdate(
    req.params.id,
    { technician: technicianId, status: "ASSIGNED" },
    { new: true }
  ).populate("asset technician");
  res.json(ticket);
});

router.put("/:id/status", auth, async (req, res) => {
  const { status, resolutionNote } = req.body;
  const ticket = await Ticket.findById(req.params.id).populate("asset");
  if (!ticket) return res.status(404).json({ message: "Ticket not found" });

  if (req.user.role === "technician" && String(ticket.technician) !== String(req.user.id)) {
    return res.status(403).json({ message: "This ticket is not assigned to you" });
  }

  ticket.status = status;
  if (status === "RESOLVED") {
    ticket.resolvedAt = new Date();
    ticket.resolutionNote = resolutionNote || "";
    ticket.asset.status = "WORKING";
    await ticket.asset.save();

    await Maintenance.create({
      asset: ticket.asset._id,
      ticket: ticket._id,
      technician: req.user.id,
      action: "REPAIR",
      note: resolutionNote || "Issue resolved"
    });
  }

  await ticket.save();
  res.json(await ticket.populate("asset technician"));
});

router.get("/maintenance/:assetId", auth, async (req, res) => {
  const records = await Maintenance.find({ asset: req.params.assetId })
    .populate("technician", "name email")
    .sort({ createdAt: -1 });
  res.json(records);
});

module.exports = router;

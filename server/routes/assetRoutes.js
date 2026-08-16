const express = require("express");
const crypto = require("crypto");
const Asset = require("../models/Asset");
const { deleteAsset } = require("../controllers/assetController"); //For Delete Button
const { auth, allowRoles } = require("../middleware/auth");

const router = express.Router();

router.get("/", auth, async (req, res) => {
  const assets = await Asset.find().sort({ createdAt: -1 });
  res.json(assets);
});

router.get("/qr/:value", async (req, res) => {
  const asset = await Asset.findOne({ qrValue: req.params.value });
  if (!asset) return res.status(404).json({ message: "Asset not found" });
  res.json(asset);
});

router.post("/", auth, allowRoles("admin"), async (req, res) => {
  try {
    const qrValue = req.body.qrValue || `ASSET-${crypto.randomBytes(5).toString("hex")}`;
    const asset = await Asset.create({ ...req.body, qrValue });
    res.status(201).json(asset);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

router.put("/:id", auth, allowRoles("admin"), async (req, res) => {
  const asset = await Asset.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  res.json(asset);
});

router.delete("/:id", auth, allowRoles("admin"), async (req, res) => {
  await Asset.findByIdAndDelete(req.params.id);
  res.json({ message: "Asset deleted" });
});

router.delete(
  "/:id",
  auth,
  allowRoles("admin"),
  deleteAsset
);


module.exports = router;

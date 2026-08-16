const express = require("express");
const User = require("../models/User");
const { auth, allowRoles } = require("../middleware/auth");

const router = express.Router();

router.get("/technicians", auth, allowRoles("admin"), async (req, res) => {
  res.json(await User.find({ role: "technician" }).select("-password"));
});

module.exports = router;

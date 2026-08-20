const express = require("express");
const User = require("../models/User");
const { auth, allowRoles } = require("../middleware/auth");

const router = express.Router();

// ==========================================
// GET ALL USERS - ADMIN ONLY
// GET /api/users
// ==========================================

router.get(
  "/",
  auth,
  allowRoles("admin"),
  async (req, res) => {
    try {

      const users = await User.find()
        .select("-password")
        .sort({ createdAt: -1 });

      res.json(users);

    } catch (error) {

      console.error("GET USERS ERROR:", error);

      res.status(500).json({
        message: "Failed to fetch users",
        error: error.message
      });

    }
  }
);
// Get all technicians
router.get("/technicians", auth, allowRoles("admin"), async (req, res) => {
  try {
    const technicians = await User.find({ role: "technician" })
      .select("-password")
      .sort({ createdAt: -1 });

    res.json(technicians);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch technicians",
      error: error.message,
    });
  }
});


// Change user role - ADMIN ONLY
router.patch(
  "/:id/role",
  auth,
  allowRoles("admin"),
  async (req, res) => {
    try {
      console.log("Role change request:");
      console.log("Target ID:", req.params.id);
      console.log("Body:", req.body);
      console.log("Logged in user:", req.user);

      let { role } = req.body;

      // Check role exists
      if (!role) {
        return res.status(400).json({
          message: "Role is required",
        });
      }

      // Convert role to lowercase
      role = String(role).trim().toLowerCase();

      // Allowed roles
      const allowedRoles = [
        "user",
        "technician",
        "admin",
      ];

      // Validate role
      if (!allowedRoles.includes(role)) {
        return res.status(400).json({
          message: "Invalid role",
          receivedRole: role,
          allowedRoles,
        });
      }

      // Prevent admin from changing own role
      if (
        String(req.user.id) ===
        String(req.params.id)
      ) {
        return res.status(400).json({
          message: "You cannot change your own role",
        });
      }

      // Find target user
      const user = await User.findById(
        req.params.id
      );

      if (!user) {
        return res.status(404).json({
          message: "User not found",
        });
      }

      // Change role
      user.role = role;

      await user.save();

      // Return updated user without password
      const updatedUser =
        await User.findById(user._id)
          .select("-password");

      console.log(
        `Role changed: ${user.email} -> ${role}`
      );

      return res.status(200).json({
        message: `User role changed to ${role}`,
        user: updatedUser,
      });

    } catch (error) {
      console.error(
        "ROLE CHANGE ERROR:",
        error
      );

      return res.status(500).json({
        message: "Failed to change role",
        error: error.message,
      });
    }
  }
);


module.exports = router;
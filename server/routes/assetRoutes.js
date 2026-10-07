const express = require("express");
const crypto = require("crypto");

const Asset = require("../models/Asset");
const Maintenance = require("../models/Maintenance");

const { auth, allowRoles } = require("../middleware/auth");
const upload = require("../middleware/upload");

const router = express.Router();


/* =========================================================
   GET ALL ASSETS
   ========================================================= */

router.get("/", auth, async (req, res) => {
  try {
    if (!req.user.organizationId) {
      return res.json([]);
    }

    const assets = await Asset.find({
      organization: req.user.organizationId
    }).sort({ createdAt: -1 });


    const assetsWithRepairs = await Promise.all(
      assets.map(async (asset) => {

        const repairCount =
          await Maintenance.countDocuments({
            organization: req.user.organizationId,
            asset: asset._id
          });

        return {
          ...asset.toObject(),
          repairCount
        };
      })
    );


    res.json(assetsWithRepairs);

  } catch (e) {
    res.status(500).json({
      message: "Unable to load assets."
    });
  }
});


/* =========================================================
   GET ASSET BY QR
   ========================================================= */

router.get("/qr/:value", auth, async (req, res) => {
  try {

    const asset = await Asset.findOne({
      qrValue: req.params.value,
      organization: req.user.organizationId
    });

    if (!asset) {
      return res.status(404).json({
        message:
          "Asset not found in your organisation."
      });
    }

    res.json(asset);

  } catch (e) {
    res.status(500).json({
      message: "Unable to load asset."
    });
  }
});


/* =========================================================
   CREATE ASSET
   ========================================================= */

router.post(
  "/",
  auth,
  allowRoles("admin"),
  upload.single("image"),
  async (req, res) => {

    try {

      if (!req.file) {
        return res.status(400).json({
          message: "Asset image is required."
        });
      }


      const qrValue =
        req.body.qrValue ||
        `ASSET-${crypto.randomBytes(5).toString("hex")}`;


      const asset = await Asset.create({

        organization:
          req.user.organizationId,

        assetCode:
          req.body.assetCode,

        name:
          req.body.name,

        category:
          req.body.category,

        locationName:
          req.body.locationName,

        latitude:
          req.body.latitude
            ? Number(req.body.latitude)
            : undefined,

        longitude:
          req.body.longitude
            ? Number(req.body.longitude)
            : undefined,

        description:
          req.body.description,

        image:
          req.file.path,

        status:
          "WORKING",

        qrValue

      });


      res.status(201).json(asset);

    } catch (e) {

      res.status(400).json({
        message: e.message
      });

    }
  }
);


/* =========================================================
   UPDATE ASSET
   ========================================================= */

router.put(
  "/:id",
  auth,
  allowRoles("admin"),
  async (req, res) => {

    try {

      const asset =
        await Asset.findOneAndUpdate(
          {
            _id: req.params.id,
            organization:
              req.user.organizationId
          },
          req.body,
          {
            new: true,
            runValidators: true
          }
        );


      if (!asset) {
        return res.status(404).json({
          message: "Asset not found."
        });
      }


      res.json(asset);

    } catch (e) {

      res.status(400).json({
        message: e.message
      });

    }
  }
);


/* =========================================================
   DELETE ASSET
   ========================================================= */

router.delete(
  "/:id",
  auth,
  allowRoles("admin"),
  async (req, res) => {

    try {

      const asset =
        await Asset.findOneAndDelete({
          _id: req.params.id,
          organization:
            req.user.organizationId
        });


      if (!asset) {
        return res.status(404).json({
          message: "Asset not found."
        });
      }


      res.json({
        message: "Asset deleted"
      });

    } catch (e) {

      res.status(500).json({
        message: "Unable to delete asset."
      });

    }
  }
);


module.exports = router;
const mongoose = require("mongoose");

const assetSchema = new mongoose.Schema(
  {
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true
    },

    assetCode: {
      type: String,
      required: true,
      trim: true
    },

    name: {
      type: String,
      required: true
    },

    category: {
      type: String,
      required: true
    },

    locationName: {
      type: String,
      required: true
    },

    latitude: Number,

    longitude: Number,

    status: {
      type: String,
      enum: ["WORKING", "FAULT", "MAINTENANCE"],
      default: "WORKING"
    },

    description: String,

    // Original/reference image of the asset
    image: {
      type: String,
      required: true
    },

    qrValue: {
      type: String,
      unique: true
    }
  },

  { timestamps: true }
);

// Same asset code can exist in different organizations,
// but must be unique inside one organization.
assetSchema.index(
  { organization: 1, assetCode: 1 },
  { unique: true }
);

module.exports = mongoose.model("Asset", assetSchema);
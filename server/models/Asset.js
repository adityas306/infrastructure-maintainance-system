const mongoose = require("mongoose");

const assetSchema = new mongoose.Schema(
  {
    assetCode: { type: String, required: true, unique: true, trim: true },
    name: { type: String, required: true },
    category: { type: String, required: true },
    locationName: { type: String, required: true },
    latitude: Number,
    longitude: Number,
    status: {
      type: String,
      enum: ["WORKING", "FAULT", "MAINTENANCE"],
      default: "WORKING"
    },
    description: String,
    qrValue: { type: String, unique: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Asset", assetSchema);

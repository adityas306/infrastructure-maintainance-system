const Asset = require("../models/Asset");

const deleteAsset = async (req, res) => {
  try {
    const asset = await Asset.findByIdAndDelete(req.params.id);

    if (!asset) {
      return res.status(404).json({
        message: "Asset not found",
      });
    }

    res.json({
      message: "Asset deleted successfully",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Unable to delete asset",
    });
  }
};

module.exports = {
  deleteAsset,
};
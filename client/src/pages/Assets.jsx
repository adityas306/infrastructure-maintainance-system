import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api";
import MaintenanceHistory from "../components/MaintenanceHistory";
import "./Assets.css";

export default function Assets({ user }) {
  const [assets, setAssets] = useState([]);

  const [form, setForm] = useState({
    assetCode: "",
    name: "",
    category: "",
    locationName: "",
    latitude: "",
    longitude: "",
    description: "",
  });

  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");

  const [selectedAsset, setSelectedAsset] = useState(null);


  /* =========================================================
     LOAD ASSETS
     ========================================================= */

  async function load() {
    try {
      setError("");

      const { data } = await api.get("/assets");

      setAssets(data);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Unable to load assets."
      );
    }
  }

  useEffect(() => {
    load();
  }, []);


  /* =========================================================
     FORM CHANGE
     ========================================================= */

  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };


  /* =========================================================
     IMAGE UPLOAD
     ========================================================= */

  const handleImage = (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Image size should be less than 5 MB.");
      return;
    }

    setError("");

    setImage(file);
    setPreview(URL.createObjectURL(file));
  };


  /* =========================================================
     CREATE ASSET
     ========================================================= */

  async function create(e) {
    e.preventDefault();

    if (!image) {
      setError("Asset image is required.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const formData = new FormData();

      formData.append("assetCode", form.assetCode);
      formData.append("name", form.name);
      formData.append("category", form.category);
      formData.append("locationName", form.locationName);

      if (form.latitude) {
        formData.append(
          "latitude",
          Number(form.latitude)
        );
      }

      if (form.longitude) {
        formData.append(
          "longitude",
          Number(form.longitude)
        );
      }

      formData.append(
        "description",
        form.description
      );

      formData.append("image", image);

      await api.post("/assets", formData);

      setForm({
        assetCode: "",
        name: "",
        category: "",
        locationName: "",
        latitude: "",
        longitude: "",
        description: "",
      });

      setImage(null);
      setPreview("");

      await load();

    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Unable to create asset."
      );
    } finally {
      setLoading(false);
    }
  }


  /* =========================================================
     DELETE ASSET
     ========================================================= */

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this asset?"
    );

    if (!confirmDelete) return;

    try {
      await api.delete(`/assets/${id}`);

      setAssets((prev) =>
        prev.filter(
          (asset) => asset._id !== id
        )
      );

    } catch (err) {
      alert(
        err.response?.data?.message ||
        "Unable to delete asset."
      );
    }
  };


  /* =========================================================
     CATEGORY FILTER
     ========================================================= */

  const categories = [
    "ALL",
    ...new Set(
      assets
        .map((asset) => asset.category)
        .filter(Boolean)
    ),
  ];


  /* =========================================================
     SEARCH + FILTER
     ========================================================= */

  const filteredAssets = assets.filter((asset) => {
    const text = search.toLowerCase().trim();

    const matchesSearch =
      asset.name
        ?.toLowerCase()
        .includes(text) ||

      asset.assetCode
        ?.toLowerCase()
        .includes(text) ||

      asset.locationName
        ?.toLowerCase()
        .includes(text);

    const matchesCategory =
      categoryFilter === "ALL" ||
      asset.category === categoryFilter;

    return (
      matchesSearch &&
      matchesCategory
    );
  });


  /* =========================================================
     UI
     ========================================================= */

  return (
    <div className="assets-page">

      {/* =====================================================
          HEADER
          ===================================================== */}

      <div className="assets-header">

        <div>
          <h1>
            Infrastructure Assets
          </h1>

          <p>
            Manage, monitor and report
            faults for your infrastructure.
          </p>
        </div>

        <div className="asset-count">

          <strong>
            {assets.length}
          </strong>

          <span>
            Total Assets
          </span>

        </div>

      </div>


      {/* =====================================================
          ADD ASSET
          ===================================================== */}

      {user.role === "admin" && (

        <form
          className="card asset-form"
          onSubmit={create}
        >

          <div className="form-heading">

            <div>

              <h2>
                Add New Asset
              </h2>

              <p>
                Register a new infrastructure
                asset with its image.
              </p>

            </div>

          </div>


          {error && (
            <div className="error">
              {error}
            </div>
          )}


          <div className="asset-form-layout">

            {/* IMAGE */}

            <div className="image-upload">

              <label className="upload-box">

                {preview ? (

                  <img
                    src={preview}
                    alt="Asset preview"
                  />

                ) : (

                  <>
                    <span className="upload-icon">
                      📷
                    </span>

                    <strong>
                      Upload Asset Image
                    </strong>

                    <small>
                      JPG, PNG or WEBP · Max 5 MB
                    </small>
                  </>

                )}

                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImage}
                  hidden
                />

              </label>


              {image && (
                <div className="image-name">
                  {image.name}
                </div>
              )}

            </div>


            {/* FORM FIELDS */}

            <div className="asset-fields">

              <div className="two">

                <input
                  name="assetCode"
                  placeholder="Asset Code e.g. LIGHT-001"
                  value={form.assetCode}
                  onChange={handleChange}
                  required
                />

                <input
                  name="name"
                  placeholder="Asset Name"
                  value={form.name}
                  onChange={handleChange}
                  required
                />

                <input
                  name="category"
                  placeholder="Category e.g. Street Light"
                  value={form.category}
                  onChange={handleChange}
                  required
                />

                <input
                  name="locationName"
                  placeholder="Location"
                  value={form.locationName}
                  onChange={handleChange}
                  required
                />

                <input
                  name="latitude"
                  type="number"
                  step="any"
                  placeholder="Latitude"
                  value={form.latitude}
                  onChange={handleChange}
                />

                <input
                  name="longitude"
                  type="number"
                  step="any"
                  placeholder="Longitude"
                  value={form.longitude}
                  onChange={handleChange}
                />

              </div>


              <textarea
                name="description"
                placeholder="Asset Description"
                value={form.description}
                onChange={handleChange}
              />


              <button
                className="create-btn"
                type="submit"
                disabled={loading}
              >
                {loading
                  ? "Creating..."
                  : "Create Asset + QR"}
              </button>

            </div>

          </div>

        </form>

      )}


      {/* =====================================================
          SEARCH / FILTER
          ===================================================== */}

      <div className="asset-toolbar">

        <input
          className="search-input"
          placeholder="🔎 Search assets..."
          value={search}
          onChange={(e) =>
            setSearch(e.target.value)
          }
        />


        <select
          value={categoryFilter}
          onChange={(e) =>
            setCategoryFilter(
              e.target.value
            )
          }
        >

          {categories.map(
            (category) => (

              <option
                key={category}
                value={category}
              >
                {category}
              </option>

            )
          )}

        </select>

      </div>


      {/* =====================================================
          ASSET GRID
          ===================================================== */}

      <div className="grid">

        {filteredAssets.length === 0 ? (

          <div className="empty-assets">

            <div>
              📦
            </div>

            <h3>
              No assets found
            </h3>

            <p>
              Try changing your search
              or category filter.
            </p>

          </div>

        ) : (

          filteredAssets.map(
            (asset) => (

              <div
                className="card asset-card"
                key={asset._id}
              >

                {/* =================================================
                    ASSET IMAGE
                    ================================================= */}

                <div className="asset-image">

                  {asset.image ||
                  asset.imageUrl ? (

                    <img
                      src={
                        asset.image ||
                        asset.imageUrl
                      }
                      alt={asset.name}
                    />

                  ) : (

                    <div className="no-image">
                      📷
                    </div>

                  )}


                  {/* STATUS */}

                  <span
                    className={`badge ${
                      asset.status?.toLowerCase()
                    }`}
                  >
                    {asset.status}
                  </span>

                </div>


                {/* =================================================
                    ASSET CONTENT
                    ================================================= */}

                <div className="asset-content">


                  {/* NAME */}

                  <div className="asset-title">

                    <div>

                      <h3>
                        {asset.name}
                      </h3>

                      <span className="asset-code">
                        {asset.assetCode}
                      </span>

                    </div>

                  </div>


                  {/* CATEGORY */}

                  <div className="asset-info-row">

                    <span className="asset-info-label">
                      CATEGORY
                    </span>

                    <span className="asset-info-value">
                      {asset.category}
                    </span>

                  </div>


                  {/* LOCATION */}

                  <div className="asset-info-row">

                    <span className="asset-info-label">
                      LOCATION
                    </span>

                    <span className="asset-info-value">
                      📍 {asset.locationName}
                    </span>

                  </div>


                  {/* DESCRIPTION */}

                  {asset.description && (

                    <div className="asset-description-box">

                      <span className="asset-info-label">
                        DESCRIPTION
                      </span>

                      <p>
                        {asset.description}
                      </p>

                    </div>

                  )}


                  {/* REPAIR COUNT */}

                  <div className="repair-summary">

                    <span>
                      🔧 Total Repairs
                    </span>

                    <strong>
                      {asset.repairCount || 0}
                    </strong>

                  </div>


                  {/* =================================================
                      ACTIONS
                      ================================================= */}

                  <div className="actions">


                    {/* VIEW QR */}

                    <Link
                      className="button qr-button"
                      to={`/qr/${encodeURIComponent(
                        asset.qrValue
                      )}`}
                    >
                      View QR
                    </Link>


                    {/* REPORT */}

                    <Link
                      className="button report-button"
                      to={`/report?asset=${asset._id}`}
                    >
                      Report Fault
                    </Link>


                    {/* DELETE */}

                    {user.role === "admin" && (

                      <button
                        className="danger"
                        type="button"
                        onClick={() =>
                          handleDelete(
                            asset._id
                          )
                        }
                      >
                        Delete
                      </button>

                    )}


                    {/* MAINTENANCE HISTORY */}

                    <button
                      className="maintenance-btn"
                      type="button"
                      onClick={() =>
                        setSelectedAsset(
                          asset
                        )
                      }
                    >

                      <span>
                        🔧 Maintenance History
                      </span>

                      <span className="history-arrow">
                        →
                      </span>

                    </button>

                  </div>

                </div>

              </div>

            )
          )

        )}

      </div>


      {/* =====================================================
          MAINTENANCE HISTORY MODAL
          ===================================================== */}

      {selectedAsset && (

        <MaintenanceHistory
          asset={selectedAsset}
          onClose={() =>
            setSelectedAsset(null)
          }
        />

      )}

    </div>
  );
}

import React, { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { useSearchParams } from "react-router-dom";
import api from "../api";
import "./ReportFault.css";

export default function ReportFault() {
  const [params] = useSearchParams();

  const [assets, setAssets] = useState([]);
  const [assetId, setAssetId] = useState(params.get("assetId") || "");

  const [form, setForm] = useState({
    title: "",
    description: "",
    priority: "MEDIUM",
  });

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [loading, setLoading] = useState(false);

  // --------------------------------------------------
  // FAULT PROOF IMAGE
  // --------------------------------------------------

  const [proofImage, setProofImage] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [imageMenuOpen, setImageMenuOpen] = useState(false);

  // --------------------------------------------------
  // QR SCANNER
  // --------------------------------------------------

  const scannerRef = useRef(null);
  const qrFileInputRef = useRef(null);

  const mountedRef = useRef(false);
  const scannerStartedRef = useRef(false);
  const scannerInitializingRef = useRef(false);
  const qrProcessingRef = useRef(false);

  const [cameraFacing, setCameraFacing] = useState("environment");
  const [scannerRunning, setScannerRunning] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [qrFileLoading, setQrFileLoading] = useState(false);

  // --------------------------------------------------
  // MESSAGE
  // --------------------------------------------------

  const showMessage = (text, type = "success") => {
    if (!mountedRef.current) return;

    setMessage(text);
    setMessageType(type);

    setTimeout(() => {
      if (mountedRef.current) {
        setMessage("");
        setMessageType("");
      }
    }, 4000);
  };

  // --------------------------------------------------
  // LOAD ASSETS
  // --------------------------------------------------

  useEffect(() => {
    mountedRef.current = true;

    const loadAssets = async () => {
      try {
        const { data } = await api.get("/assets");

        if (mountedRef.current) {
          setAssets(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        console.error("Unable to load assets:", error);

        if (mountedRef.current) {
          showMessage("Unable to load assets.", "error");
        }
      }
    };

    loadAssets();

    return () => {
      mountedRef.current = false;
    };
  }, []);

  // --------------------------------------------------
  // CREATE SCANNER
  // --------------------------------------------------

  const getScanner = () => {
    if (!scannerRef.current) {
      scannerRef.current = new Html5Qrcode("qr-reader");
    }

    return scannerRef.current;
  };

  // --------------------------------------------------
  // QR SUCCESS
  // --------------------------------------------------

  const handleQrSuccess = async (decodedText) => {
    if (!decodedText || qrProcessingRef.current) return;

    qrProcessingRef.current = true;

    try {
      const { data } = await api.get(
        `/assets/qr/${encodeURIComponent(decodedText)}`
      );

      if (!mountedRef.current) return;

      setAssetId(data._id);

      showMessage(
        `Asset found: ${data.name} (${data.assetCode})`,
        "success"
      );

      await stopScanner();
    } catch (error) {
      console.error("QR asset lookup failed:", error);

      if (mountedRef.current) {
        showMessage(
          error.response?.data?.message ||
            "QR scanned, but asset was not found.",
          "error"
        );
      }
    } finally {
      qrProcessingRef.current = false;
    }
  };

  // --------------------------------------------------
  // STOP SCANNER
  // --------------------------------------------------

  const stopScanner = async (clearScanner = false) => {
    const scanner = scannerRef.current;

    if (!scanner) {
      scannerStartedRef.current = false;

      if (mountedRef.current) {
        setScannerRunning(false);
      }

      return;
    }

    try {
      if (scannerStartedRef.current) {
        await scanner.stop();
      }
    } catch (error) {
      console.log("Scanner stop:", error?.message || error);
    }

    scannerStartedRef.current = false;

    if (mountedRef.current) {
      setScannerRunning(false);
    }

    /*
      Give browser a small amount of time to release
      the camera before another getUserMedia() call.
    */
    await new Promise((resolve) => setTimeout(resolve, 200));

    if (clearScanner) {
      try {
        scanner.clear();
      } catch (error) {
        console.log("Scanner clear:", error?.message || error);
      }

      scannerRef.current = null;
    }
  };

  // --------------------------------------------------
  // START SCANNER
  // --------------------------------------------------

  const startScanner = async (facingMode = cameraFacing) => {
    if (!mountedRef.current) return;

    if (scannerInitializingRef.current) {
      return;
    }

    if (scannerStartedRef.current) {
      return;
    }

    scannerInitializingRef.current = true;

    try {
      setCameraLoading(true);

      const scanner = getScanner();

      /*
        Safety:
        If browser/library still considers previous scanner active,
        stop it before starting again.
      */
      try {
        if (scannerStartedRef.current) {
          await scanner.stop();
          scannerStartedRef.current = false;
          await new Promise((resolve) => setTimeout(resolve, 250));
        }
      } catch (error) {
        console.log("Previous scanner cleanup:", error?.message || error);
      }

      await scanner.start(
        {
          facingMode: facingMode,
        },
        {
          fps: 10,
          qrbox: {
            width: 220,
            height: 220,
          },
          aspectRatio: 1,
        },
        (decodedText) => {
          handleQrSuccess(decodedText);
        },
        () => {
          // Normal QR scan failures are ignored.
        }
      );

      scannerStartedRef.current = true;

      if (mountedRef.current) {
        setScannerRunning(true);
      }
    } catch (error) {
      console.error("QR scanner start failed:", error);

      scannerStartedRef.current = false;

      if (mountedRef.current) {
        setScannerRunning(false);

        let errorMessage =
          "Camera start nahi ho raha. Kindly QR image upload karein.";

        if (error?.name === "NotReadableError") {
          errorMessage =
            "Camera already in use hai. Camera ko close karke dobara try karein, ya QR image upload karein.";
        }

        showMessage(errorMessage, "error");
      }
    } finally {
      scannerInitializingRef.current = false;

      if (mountedRef.current) {
        setCameraLoading(false);
      }
    }
  };

  // --------------------------------------------------
  // INITIAL CAMERA
  // --------------------------------------------------

  useEffect(() => {
    let cancelled = false;

    const initScanner = async () => {
      /*
        Delay prevents React StrictMode from starting the
        camera while the previous development instance is
        still releasing it.
      */
      await new Promise((resolve) => setTimeout(resolve, 500));

      if (cancelled || !mountedRef.current) return;

      await startScanner("environment");
    };

    initScanner();

    return () => {
      cancelled = true;

      const cleanup = async () => {
        const scanner = scannerRef.current;

        if (!scanner) return;

        try {
          if (scannerStartedRef.current) {
            await scanner.stop();
          }
        } catch (error) {
          console.log("Cleanup stop:", error?.message || error);
        }

        scannerStartedRef.current = false;
        scannerInitializingRef.current = false;

        try {
          scanner.clear();
        } catch (error) {
          console.log("Cleanup clear:", error?.message || error);
        }

        scannerRef.current = null;
      };

      cleanup();
    };

    // Intentionally runs once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --------------------------------------------------
  // CAMERA TOGGLE
  // --------------------------------------------------

  const toggleCamera = async () => {
    if (cameraLoading) return;

    const newFacing =
      cameraFacing === "environment"
        ? "user"
        : "environment";

    try {
      setCameraLoading(true);

      await stopScanner();

      setCameraFacing(newFacing);

      await new Promise((resolve) =>
        setTimeout(resolve, 300)
      );

      if (mountedRef.current) {
        await startScanner(newFacing);
      }
    } finally {
      if (mountedRef.current) {
        setCameraLoading(false);
      }
    }
  };

  // --------------------------------------------------
  // START / STOP BUTTON
  // --------------------------------------------------

  const handleScannerToggle = async () => {
    if (cameraLoading) return;

    if (scannerRunning) {
      await stopScanner();
    } else {
      await startScanner(cameraFacing);
    }
  };

  // --------------------------------------------------
  // QR IMAGE UPLOAD
  // --------------------------------------------------

  const handleQrFileChange = async (event) => {
    const file = event.target.files?.[0];

    event.target.value = "";

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showMessage("Please select a valid QR image.", "error");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      showMessage(
        "QR image must be smaller than 10 MB.",
        "error"
      );
      return;
    }

    try {
      setQrFileLoading(true);

      /*
        Camera must be completely stopped before scanFile().
      */
      await stopScanner();

      const scanner = getScanner();

      const decodedText = await scanner.scanFile(file, true);

      await handleQrSuccess(decodedText);
    } catch (error) {
      console.error("QR image scan failed:", error);

      showMessage(
        "QR image detect nahi hua. Kindly clear QR image upload karein.",
        "error"
      );
    } finally {
      setQrFileLoading(false);
    }
  };

  // --------------------------------------------------
  // FORM INPUT
  // --------------------------------------------------

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // --------------------------------------------------
  // FAULT IMAGE
  // --------------------------------------------------

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showMessage("Please select an image file.", "error");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showMessage(
        "Proof image must be smaller than 5 MB.",
        "error"
      );
      return;
    }

    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }

    setProofImage(file);
    setImagePreview(URL.createObjectURL(file));
    setImageMenuOpen(false);
  };

  const removeImage = () => {
    setProofImage(null);

    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }

    setImagePreview("");
  };

  // --------------------------------------------------
  // SUBMIT TICKET
  // --------------------------------------------------

  const submit = async (event) => {
    event.preventDefault();

    if (!assetId) {
      showMessage(
        "Please scan/select an asset first.",
        "error"
      );
      return;
    }

    if (!form.title.trim()) {
      showMessage("Please enter issue title.", "error");
      return;
    }

    if (!form.description.trim()) {
      showMessage(
        "Please describe the problem.",
        "error"
      );
      return;
    }

    if (!proofImage) {
      showMessage(
        "Fault proof image is required.",
        "error"
      );
      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();

      formData.append("assetId", assetId);
      formData.append("title", form.title.trim());
      formData.append(
        "description",
        form.description.trim()
      );
      formData.append("priority", form.priority);

      // IMPORTANT:
      // Backend upload.single("image") expects "image".
      formData.append("image", proofImage, proofImage.name);

      /*
        Do NOT manually set Content-Type here.
        Axios/browser will automatically create:
        multipart/form-data; boundary=...
      */
      const response = await api.post(
        "/tickets",
        formData
      );

      console.log(
        "Ticket created successfully:",
        response.data
      );

      showMessage(
        "Fault reported successfully.",
        "success"
      );

      setForm({
        title: "",
        description: "",
        priority: "MEDIUM",
      });

      removeImage();
      setAssetId("");
    } catch (error) {
      console.error(
        "Ticket creation failed:",
        error
      );

      /*
        Show actual backend error.
      */
      const backendMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.response?.data;

      console.error(
        "Backend response:",
        backendMessage
      );

      showMessage(
        typeof backendMessage === "string"
          ? backendMessage
          : "Unable to report fault.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const selectedAsset = assets.find(
    (asset) => asset._id === assetId
  );

  // --------------------------------------------------
  // UI
  // --------------------------------------------------

  return (
    <div className="fault-page">
      <div className="fault-bg-circle circle-one"></div>
      <div className="fault-bg-circle circle-two"></div>

      <div className="fault-container">

        <div className="fault-heading">
          <div>
            <h1>Report Fault</h1>
            <p>
              Scan the asset QR code and report the issue.
            </p>
          </div>
        </div>

        {message && (
          <div className={`fault-message ${messageType}`}>
            {message}
          </div>
        )}

        <div className="fault-grid">

          {/* ==========================================
              QR SCANNER
          ========================================== */}

          <div className="fault-card scanner-card">

            <div className="fault-card-header">
              <div>
                <span className="section-number">01</span>
                <h2>Scan Asset QR</h2>
                <p>
                  Scan QR via Camera or Upload QR image.
                </p>
              </div>
            </div>

            <div className="scanner-wrapper">
              <div id="qr-reader"></div>

              {cameraLoading && (
                <div className="scanner-loading">
                  <div className="scanner-spinner"></div>
                  <span>Starting camera...</span>
                </div>
              )}
            </div>

            {/* QR IMAGE UPLOAD */}

            <div className="qr-file-upload">

              <input
                ref={qrFileInputRef}
                type="file"
                accept="image/*"
                onChange={handleQrFileChange}
                hidden
              />

              <button
                type="button"
                className="qr-file-btn"
                onClick={() =>
                  qrFileInputRef.current?.click()
                }
                disabled={qrFileLoading}
              >
                {qrFileLoading
                  ? "Scanning QR Image..."
                  : "🖼️ Upload QR Image"}
              </button>

              <span className="qr-upload-text">
                upload qr code if already photo is present
              </span>

            </div>

            <div className="camera-controls">

              <button
                type="button"
                className="camera-toggle-btn"
                onClick={toggleCamera}
                disabled={cameraLoading}
              >
                🔄{" "}
                {cameraFacing === "environment"
                  ? "Back Camera"
                  : "Front Camera"}
              </button>

              <button
                type="button"
                className="scanner-stop-btn"
                onClick={handleScannerToggle}
                disabled={cameraLoading}
              >
                {scannerRunning
                  ? "⏹ Stop Scanner"
                  : "▶ Start Scanner"}
              </button>

            </div>

            <div className="scanner-help">
              <span>💡</span>
              <p>
                Kindly put QR Code Inside Box.
                Asset will be selected automatically.
              </p>
            </div>

            {selectedAsset && (
              <div className="selected-asset-box">

                <div className="selected-asset-check">
                  ✓
                </div>

                <div>
                  <span>Selected Asset</span>
                  <strong>{selectedAsset.name}</strong>
                  <small>{selectedAsset.assetCode}</small>
                </div>

              </div>
            )}

          </div>

          {/* ==========================================
              FAULT FORM
          ========================================== */}

          <div className="fault-card form-card">

            <div className="fault-card-header">
              <div>
                <span className="section-number">02</span>
                <h2>Fault Details</h2>
                <p>
                  Provide details about the reported problem.
                </p>
              </div>
            </div>

            <form onSubmit={submit}>

              <div className="form-group">

                <label>Asset</label>

                <select
                  value={assetId}
                  onChange={(e) =>
                    setAssetId(e.target.value)
                  }
                >
                  <option value="">
                    Select asset
                  </option>

                  {assets.map((asset) => (
                    <option
                      key={asset._id}
                      value={asset._id}
                    >
                      {asset.name} — {asset.assetCode}
                    </option>
                  ))}
                </select>

              </div>

              <div className="form-group">

                <label>Issue Title</label>

                <input
                  type="text"
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  placeholder="e.g. Projector not working"
                />

              </div>

              <div className="form-group">

                <label>Priority</label>

                <select
                  name="priority"
                  value={form.priority}
                  onChange={handleChange}
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="CRITICAL">
                    Critical
                  </option>
                </select>

              </div>

              <div className="form-group">

                <label>Description</label>

                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="Describe the problem..."
                  rows="5"
                />

              </div>

              {/* PROOF IMAGE */}

              <div className="form-group">

                <label>
                  Fault Proof Image
                  <span className="required-star">
                    *
                  </span>
                </label>

                {!imagePreview ? (

                  <div className="fault-image-upload">

                    <button
                      type="button"
                      className="upload-proof-btn"
                      onClick={() =>
                        setImageMenuOpen(
                          (previous) => !previous
                        )
                      }
                    >
                      📷 Add Proof Image
                    </button>

                    {imageMenuOpen && (
                      <div className="fault-image-menu">

                        <label className="fault-image-option">
                          📷
                          <span>Take Photo</span>

                          <input
                            type="file"
                            accept="image/*"
                            capture="environment"
                            hidden
                            onChange={handleImageChange}
                          />
                        </label>

                        <label className="fault-image-option">
                          🖼️
                          <span>Choose Image</span>

                          <input
                            type="file"
                            accept="image/*"
                            hidden
                            onChange={handleImageChange}
                          />
                        </label>

                      </div>
                    )}

                    <small>
                      Image proof is required to report a fault.
                    </small>

                  </div>

                ) : (

                  <div className="fault-image-preview">

                    <img
                      src={imagePreview}
                      alt="Fault proof"
                    />

                    <button
                      type="button"
                      onClick={removeImage}
                      className="remove-image-btn"
                    >
                      ×
                    </button>

                  </div>

                )}

              </div>

              <button
                type="submit"
                className="submit-fault-btn"
                disabled={loading}
              >
                {loading
                  ? "Reporting..."
                  : "🚨 Report Fault"}
              </button>

            </form>

          </div>

        </div>
      </div>
    </div>
  );
}
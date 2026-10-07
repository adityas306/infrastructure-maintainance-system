import React, { useEffect, useState } from "react";
import api from "../api";
import "./Tickets.css";

export default function Tickets({ user }) {
  const [tickets, setTickets] = useState([]);
  const [techs, setTechs] = useState([]);

  const [selected, setSelected] = useState({});
  const [refusal, setRefusal] = useState({});

  const [loading, setLoading] = useState(true);

  // View Ticket modal
  const [viewTicket, setViewTicket] = useState(null);

  // Repair modal
  const [repairTicket, setRepairTicket] = useState(null);
  const [repairDate, setRepairDate] = useState("");
  const [repairNote, setRepairNote] = useState("");
  const [afterRepairImage, setAfterRepairImage] = useState(null);
  const [repairLoading, setRepairLoading] = useState(false);

  async function load() {
    try {
      setLoading(true);

      const { data } = await api.get("/tickets");
      setTickets(data);

      if (user.role === "admin") {
        const t = await api.get("/users/technicians");
        setTechs(t.data);
      }
    } catch (e) {
      alert(
        e.response?.data?.message ||
          "Unable to load tickets."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [user.role]);

  /* =====================================================
     ADMIN ASSIGN
     ===================================================== */

  async function assign(id) {
    if (!selected[id]) return;

    try {
      await api.put(`/tickets/${id}/assign`, {
        technicianId: selected[id]
      });

      await load();
    } catch (e) {
      alert(
        e.response?.data?.message ||
          "Unable to assign technician."
      );
    }
  }

  /* =====================================================
     TECHNICIAN ACCEPT / REFUSE
     ===================================================== */

  async function respond(id, action) {
    try {
      await api.put(
        `/tickets/${id}/assignment-response`,
        {
          action,
          reason: refusal[id] || ""
        }
      );

      setRefusal((old) => ({
        ...old,
        [id]: ""
      }));

      await load();
    } catch (e) {
      alert(
        e.response?.data?.message ||
          "Unable to update assignment."
      );
    }
  }

  /* =====================================================
     REPAIR MODAL
     ===================================================== */

  function openRepair(ticket) {
    setRepairTicket(ticket);

    setRepairDate(
      new Date().toISOString().split("T")[0]
    );

    setRepairNote("");
    setAfterRepairImage(null);

    setViewTicket(null);
  }

  function closeRepair() {
    if (repairLoading) return;

    setRepairTicket(null);
    setRepairDate("");
    setRepairNote("");
    setAfterRepairImage(null);
  }

  /* =====================================================
     COMPLETE REPAIR
     ===================================================== */

  async function completeRepair() {
    if (!repairTicket) return;

    if (!afterRepairImage) {
      alert(
        "After-repair image is required."
      );
      return;
    }

    try {
      setRepairLoading(true);

      const formData = new FormData();

      formData.append(
        "repairDate",
        repairDate
      );

      formData.append(
        "repairNote",
        repairNote.trim()
      );

      formData.append(
        "afterRepairImage",
        afterRepairImage
      );

      await api.put(
        `/tickets/${repairTicket._id}/repair`,
        formData
      );

      closeRepair();
      await load();

      alert(
        "Repair completed successfully."
      );
    } catch (e) {
      alert(
        e.response?.data?.message ||
          "Unable to complete repair."
      );
    } finally {
      setRepairLoading(false);
    }
  }

  /* =====================================================
     DATE FORMAT
     ===================================================== */

  function formatDate(date) {
    if (!date) return "—";

    return new Date(date).toLocaleString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      }
    );
  }

  function formatDateOnly(date) {
    if (!date) return "—";

    return new Date(date).toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric"
      }
    );
  }

  /* =====================================================
     LOADING
     ===================================================== */

  if (loading) {
    return (
      <div className="tickets-page">
        <div className="tickets-loading">
          Loading tickets...
        </div>
      </div>
    );
  }

  return (
    <div className="tickets-page">

      {/* =================================================
          HEADER
          ================================================= */}

      <div className="tickets-header">
        <div>
          <h1>Maintenance Tickets</h1>
          <p>
            Manage reported faults, assignments and
            repairs.
          </p>
        </div>

        <div className="ticket-count">
          {tickets.length}{" "}
          {tickets.length === 1
            ? "Ticket"
            : "Tickets"}
        </div>
      </div>


      {/* =================================================
          EMPTY STATE
          ================================================= */}

      {!tickets.length ? (
        <div className="ticket-empty card">
          <div className="empty-icon">🎫</div>

          <h3>No tickets found</h3>

          <p>
            There are currently no maintenance tickets
            in your organisation.
          </p>
        </div>
      ) : (

        /* =================================================
           TICKET GRID
           ================================================= */

        <div className="tickets-grid">

          {tickets.map((t) => {

            const late =
              t.slaDeadline &&
              new Date(t.slaDeadline) <
                new Date() &&
              !["RESOLVED", "CLOSED"].includes(
                t.status
              );

            return (
              <div
                className="ticket-card"
                key={t._id}
              >

                {/* TOP */}

                <div className="ticket-card-top">

                  <div>
                    <h3>{t.title}</h3>

                    <span className="ticket-id">
                      #{t._id.slice(-6).toUpperCase()}
                    </span>
                  </div>

                  <span
                    className={`ticket-priority priority-${t.priority.toLowerCase()}`}
                  >
                    {t.priority}
                  </span>

                </div>


                {/* IMAGE */}

                {t.proofImage && (
                  <div className="ticket-image">
                    <img
                      src={t.proofImage}
                      alt="Fault"
                    />
                  </div>
                )}


                {/* ASSET */}

                <div className="ticket-info">

                  <div className="ticket-info-block">
                    <span>ASSET</span>

                    <strong>
                      {t.asset?.assetCode || "—"}
                    </strong>

                    <p>
                      {t.asset?.name || "Unknown asset"}
                    </p>
                  </div>


                  {/* DESCRIPTION */}

                  <div className="ticket-description">
                    <span>DESCRIPTION</span>

                    <p>
                      {t.description}
                    </p>
                  </div>


                  {/* DETAILS */}

                  <div className="ticket-meta">

                    <div>
                      <span>TECHNICIAN</span>

                      <strong>
                        {t.technician?.name ||
                          "Not assigned"}
                      </strong>
                    </div>

                    <div>
                      <span>STATUS</span>

                      <strong
                        className={`status-${t.status.toLowerCase()}`}
                      >
                        {t.status.replace(
                          "_",
                          " "
                        )}
                      </strong>
                    </div>

                  </div>


                  {/* SLA */}

                  <div
                    className={`ticket-sla ${
                      late ? "sla-late" : ""
                    }`}
                  >
                    <span>SLA</span>

                    <strong>
                      {t.slaDeadline
                        ? formatDate(
                            t.slaDeadline
                          )
                        : "—"}
                    </strong>

                    {late && (
                      <small>
                        SLA BREACHED
                      </small>
                    )}
                  </div>


                  {/* ASSIGNMENT */}

                  {t.assignmentStatus && (
                    <div className="assignment-status">
                      <span>
                        ASSIGNMENT
                      </span>

                      <strong>
                        {t.assignmentStatus}
                      </strong>

                      {t.refusalReason && (
                        <p>
                          {t.refusalReason}
                        </p>
                      )}
                    </div>
                  )}

                </div>


                {/* ADMIN ASSIGN */}

                {user.role === "admin" &&
                  ![
                    "RESOLVED",
                    "CLOSED"
                  ].includes(t.status) && (

                    <div className="ticket-actions admin-actions">

                      <select
                        value={
                          selected[t._id] || ""
                        }
                        onChange={(e) =>
                          setSelected({
                            ...selected,
                            [t._id]:
                              e.target.value
                          })
                        }
                      >
                        <option value="">
                          Select technician
                        </option>

                        {techs.map((x) => (
                          <option
                            key={x._id}
                            value={x._id}
                          >
                            {x.name} — {x.email}
                          </option>
                        ))}
                      </select>

                      <button
                        onClick={() =>
                          assign(t._id)
                        }
                        disabled={
                          !selected[t._id]
                        }
                      >
                        {t.assignmentStatus ===
                        "REFUSED"
                          ? "Reassign"
                          : "Assign"}
                      </button>

                    </div>
                  )}


                {/* TECHNICIAN ACCEPT / REFUSE */}

                {user.role === "technician" &&
                  t.status === "ASSIGNED" &&
                  String(
                    t.technician?._id
                  ) === String(user.id) && (

                    <div className="ticket-actions technician-response">

                      <button
                        onClick={() =>
                          respond(
                            t._id,
                            "ACCEPT"
                          )
                        }
                      >
                        Accept Assignment
                      </button>

                      <input
                        placeholder="Reason for refusal"
                        value={
                          refusal[t._id] || ""
                        }
                        onChange={(e) =>
                          setRefusal({
                            ...refusal,
                            [t._id]:
                              e.target.value
                          })
                        }
                      />

                      <button
                        className="danger"
                        onClick={() =>
                          respond(
                            t._id,
                            "REFUSE"
                          )
                        }
                        disabled={
                          !refusal[
                            t._id
                          ]?.trim()
                        }
                      >
                        Refuse
                      </button>

                    </div>
                  )}


                {/* VIEW BUTTON */}

                <button
                  className="view-ticket-btn"
                  onClick={() =>
                    setViewTicket(t)
                  }
                >
                  View Ticket →
                </button>

              </div>
            );
          })}

        </div>
      )}


      {/* =================================================
          VIEW TICKET MODAL
          ================================================= */}

      {viewTicket && (

        <div
          className="ticket-modal-overlay"
          onClick={() =>
            setViewTicket(null)
          }
        >

          <div
            className="ticket-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <button
              className="ticket-modal-close"
              onClick={() =>
                setViewTicket(null)
              }
            >
              ×
            </button>


            <div className="modal-header">

              <div>
                <span className="modal-ticket-id">
                  #
                  {viewTicket._id
                    .slice(-6)
                    .toUpperCase()}
                </span>

                <h2>
                  {viewTicket.title}
                </h2>
              </div>

              <span
                className={`ticket-priority priority-${viewTicket.priority.toLowerCase()}`}
              >
                {viewTicket.priority}
              </span>

            </div>


            <div className="modal-main">

              {/* IMAGE */}

              <div className="modal-image-section">

                <h4>Fault Image</h4>

                {viewTicket.proofImage ? (
                  <img
                    src={
                      viewTicket.proofImage
                    }
                    alt="Fault"
                  />
                ) : (
                  <div className="no-image">
                    No image available
                  </div>
                )}

              </div>


              {/* DETAILS */}

              <div className="modal-details">

                <div>
                  <span>Asset</span>

                  <strong>
                    {viewTicket.asset
                      ?.assetCode || "—"}
                  </strong>

                  <p>
                    {viewTicket.asset
                      ?.name || "—"}
                  </p>
                </div>


                <div>
                  <span>Location</span>

                  <p>
                    {viewTicket.asset
                      ?.locationName || "—"}
                  </p>
                </div>


                <div>
                  <span>Reported By</span>

                  <p>
                    {viewTicket.reportedBy
                      ?.name || "—"}
                  </p>
                </div>


                <div>
                  <span>Technician</span>

                  <p>
                    {viewTicket.technician
                      ?.name ||
                      "Not assigned"}
                  </p>
                </div>


                <div>
                  <span>Status</span>

                  <strong>
                    {viewTicket.status.replace(
                      "_",
                      " "
                    )}
                  </strong>
                </div>


                <div>
                  <span>Reported On</span>

                  <p>
                    {formatDate(
                      viewTicket.createdAt
                    )}
                  </p>
                </div>

              </div>

            </div>


            {/* DESCRIPTION */}

            <div className="modal-description">

              <span>Description</span>

              <p>
                {viewTicket.description}
              </p>

            </div>


            {/* RESOLVED REPAIR DETAILS */}

            {viewTicket.status ===
              "RESOLVED" && (

              <div className="completed-repair">

                <h3>
                  Repair Completed
                </h3>

                <div className="repair-images">

                  <div>
                    <span>
                      Before Repair
                    </span>

                    <img
                      src={
                        viewTicket.beforeRepairImage ||
                        viewTicket.proofImage
                      }
                      alt="Before repair"
                    />
                  </div>


                  <div>
                    <span>
                      After Repair
                    </span>

                    {viewTicket.afterRepairImage ? (
                      <img
                        src={
                          viewTicket.afterRepairImage
                        }
                        alt="After repair"
                      />
                    ) : (
                      <div className="no-image">
                        No image
                      </div>
                    )}
                  </div>

                </div>


                <div className="repair-details">

                  <p>
                    <b>Repair Date:</b>{" "}
                    {formatDateOnly(
                      viewTicket.repairDate
                    )}
                  </p>

                  <p>
                    <b>Repair Note:</b>{" "}
                    {viewTicket.repairNote ||
                      "No repair note"}
                  </p>

                </div>

              </div>
            )}


            {/* REPAIR BUTTON */}

            {user.role === "technician" &&
              String(
                viewTicket.technician?._id
              ) === String(user.id) &&
              viewTicket.assignmentStatus ===
                "ACCEPTED" &&
              viewTicket.status ===
                "IN_PROGRESS" && (

                <div className="modal-footer">

                  <button
                    className="repair-btn"
                    onClick={() =>
                      openRepair(
                        viewTicket
                      )
                    }
                  >
                    🔧 Repair Ticket
                  </button>

                </div>
              )}

          </div>

        </div>
      )}


      {/* =================================================
          REPAIR MODAL
          ================================================= */}

      {repairTicket && (

        <div
          className="ticket-modal-overlay"
          onClick={() => {
            if (!repairLoading) {
              closeRepair();
            }
          }}
        >

          <div
            className="repair-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <button
              className="ticket-modal-close"
              onClick={closeRepair}
              disabled={repairLoading}
            >
              ×
            </button>


            <div className="modal-header">

              <div>
                <span className="modal-ticket-id">
                  Repair Ticket
                </span>

                <h2>
                  {repairTicket.title}
                </h2>
              </div>

            </div>


            {/* REPAIR DATE */}

            <div className="repair-form-group">

              <label>
                Repair Date
              </label>

              <input
                type="date"
                value={repairDate}
                onChange={(e) =>
                  setRepairDate(
                    e.target.value
                  )
                }
              />

            </div>


            {/* BEFORE / AFTER */}

            <div className="repair-image-grid">

              {/* BEFORE */}

              <div className="repair-image-box">

                <div className="repair-image-heading">
                  <span>
                    BEFORE REPAIR
                  </span>

                  <small>
                    User fault image
                  </small>
                </div>

                <div className="repair-preview">

                  {repairTicket.proofImage ? (
                    <img
                      src={
                        repairTicket.proofImage
                      }
                      alt="Before repair"
                    />
                  ) : (
                    <div className="no-image">
                      No image available
                    </div>
                  )}

                </div>

              </div>


              {/* AFTER */}

              <div className="repair-image-box">

                <div className="repair-image-heading">
                  <span>
                    AFTER REPAIR
                  </span>

                  <small>
                    Technician upload *
                  </small>
                </div>

                <div className="repair-preview after-preview">

                  {afterRepairImage ? (
                    <img
                      src={URL.createObjectURL(
                        afterRepairImage
                      )}
                      alt="After repair preview"
                    />
                  ) : (
                    <label className="after-upload">

                      <span>
                        📷
                      </span>

                      <strong>
                        Upload repaired image
                      </strong>

                      <small>
                        Image is required
                      </small>

                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) =>
                          setAfterRepairImage(
                            e.target.files?.[0] ||
                              null
                          )
                        }
                      />

                    </label>
                  )}

                </div>

                {afterRepairImage && (
                  <button
                    type="button"
                    className="remove-image-btn"
                    onClick={() =>
                      setAfterRepairImage(null)
                    }
                  >
                    Remove image
                  </button>
                )}

              </div>

            </div>


            {/* REPAIR NOTE */}

            <div className="repair-form-group">

              <label>
                Repair Note
              </label>

              <textarea
                value={repairNote}
                onChange={(e) =>
                  setRepairNote(
                    e.target.value
                  )
                }
                placeholder="Describe what was repaired..."
                rows="4"
              />

            </div>


            {/* COMPLETE */}

            <div className="repair-submit-row">

              <button
                className="repair-btn"
                onClick={completeRepair}
                disabled={
                  repairLoading ||
                  !afterRepairImage
                }
              >
                {repairLoading
                  ? "Completing Repair..."
                  : "✓ Complete Repair"}
              </button>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}
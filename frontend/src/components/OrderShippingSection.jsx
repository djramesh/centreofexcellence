import React, { useCallback, useEffect, useMemo, useState } from "react";
import { shippingApi } from "../api/admin.js";
import "./OrderShippingSection.css";

/**
 * Shipping panel on the admin order page.
 *
 * Two ways to dispatch an order:
 *   Manual     - the admin hands the parcel to any courier (Delhivery, India
 *                Post, DTDC, a local service) and records the consignment
 *                number. The server maps the courier to its public tracking
 *                page so the customer gets a working link.
 *   ShipRocket - book the shipment through the API, which fills the same
 *                fields in automatically.
 */
export default function OrderShippingSection({ order, onStatusUpdate }) {
  const [mode, setMode] = useState("manual");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [carriers, setCarriers] = useState([]);
  const [couriers, setCouriers] = useState([]);
  const [courierNotice, setCourierNotice] = useState("");
  const [selectedCourier, setSelectedCourier] = useState("");

  const [form, setForm] = useState({ courier: "", customCourier: "", trackingNumber: "", trackingUrl: "" });
  const [liveTracking, setLiveTracking] = useState(null);
  const [showEvents, setShowEvents] = useState(false);
  const [copied, setCopied] = useState(false);

  const tracking = order?.tracking ?? null;
  const isPaid = order?.payment_status === "PAID";
  const isShipRocket = order?.tracking_provider === "SHIPROCKET";

  // ── Courier list for the manual dropdown ─────────────────────────────────
  useEffect(() => {
    shippingApi
      .getCarriers()
      .then((res) => setCarriers(res.carriers || []))
      .catch(() => setCarriers([]));
  }, []);

  // ── ShipRocket serviceability, only when that tab is actually opened ─────
  useEffect(() => {
    if (mode !== "shiprocket" || !isPaid || !order?.pincode || tracking) return;

    let cancelled = false;
    setCourierNotice("");

    shippingApi
      .getAvailableCouriers({ delivery_pincode: order.pincode, weight: 0.5 })
      .then((res) => {
        if (cancelled) return;
        setCouriers(res.couriers || []);
        if (!res.couriers?.length) {
          setCourierNotice(res.message || "No couriers returned for this pincode.");
        }
      })
      .catch((err) => {
        if (cancelled) return;
        setCouriers([]);
        // Surfaced instead of only console.error'd, which is what the old
        // version did — the admin had no idea why the dropdown was empty.
        setCourierNotice(err.message);
      });

    return () => {
      cancelled = true;
    };
  }, [mode, isPaid, order?.pincode, tracking]);

  // ── Live events for a ShipRocket shipment ────────────────────────────────
  useEffect(() => {
    if (!tracking || !isShipRocket) return;
    shippingApi
      .getTracking(order.id)
      .then(setLiveTracking)
      .catch(() => setLiveTracking(null));
  }, [tracking, isShipRocket, order?.id]);

  const resetFeedback = () => {
    setError("");
    setSuccess("");
  };

  const run = useCallback(
    async (action, successMessage) => {
      setLoading(true);
      resetFeedback();
      try {
        await action();
        setSuccess(successMessage);
        onStatusUpdate?.();
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    },
    [onStatusUpdate]
  );

  const courierName = form.courier === "other" ? form.customCourier.trim() : form.courier;
  const canSaveManual = Boolean(courierName && form.trackingNumber.trim());

  const handleSaveManual = (e) => {
    e.preventDefault();
    if (!canSaveManual) return;
    run(
      () =>
        shippingApi.saveTracking(order.id, {
          courier: courierName,
          trackingNumber: form.trackingNumber.trim(),
          trackingUrl: form.trackingUrl.trim() || undefined,
        }),
      "Tracking saved. The customer can now see it on their order page."
    );
  };

  const handleCreateShipment = () =>
    run(
      () => shippingApi.createShipment(order.id, { courier_id: selectedCourier || null }),
      "Shipment booked with ShipRocket."
    );

  const handleSync = () =>
    run(() => shippingApi.updateTracking(order.id), "Tracking status refreshed.");

  const handleClear = () => {
    if (!window.confirm("Remove the tracking details from this order?")) return;
    run(() => shippingApi.clearTracking(order.id), "Tracking details cleared.");
  };

  const copyNumber = async () => {
    try {
      await navigator.clipboard.writeText(tracking.trackingNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard unavailable */
    }
  };

  const events = useMemo(() => liveTracking?.events || [], [liveTracking]);

  if (!order) return null;

  if (!isPaid) {
    return (
      <div className="oss">
        <h3 className="oss-title">Shipping &amp; delivery</h3>
        <p className="oss-locked">
          Shipping opens once payment is confirmed. This order is currently{" "}
          <strong>{order.payment_status}</strong>.
        </p>
      </div>
    );
  }

  return (
    <div className="oss">
      <h3 className="oss-title">Shipping &amp; delivery</h3>

      {error && <div className="oss-alert oss-alert-error">{error}</div>}
      {success && <div className="oss-alert oss-alert-success">{success}</div>}

      {tracking ? (
        /* ── Already dispatched ── */
        <div className="oss-current">
          <div className="oss-current-head">
            <span className="oss-truck" aria-hidden="true">🚚</span>
            <div>
              <p className="oss-current-carrier">{tracking.carrierName}</p>
              <p className="oss-current-provider">
                {isShipRocket ? "Booked via ShipRocket" : "Entered manually"}
              </p>
            </div>
            {tracking.status && <span className="oss-chip">{tracking.status}</span>}
          </div>

          <div className="oss-rows">
            <div className="oss-row">
              <span className="oss-row-label">Tracking number</span>
              <span className="oss-row-value">
                <code>{tracking.trackingNumber}</code>
                <button type="button" className="oss-mini-btn" onClick={copyNumber}>
                  {copied ? "✓ Copied" : "Copy"}
                </button>
              </span>
            </div>

            {tracking.shippedAt && (
              <div className="oss-row">
                <span className="oss-row-label">Dispatched</span>
                <span className="oss-row-value">
                  {new Date(tracking.shippedAt).toLocaleString("en-IN")}
                </span>
              </div>
            )}

            {tracking.deliveredAt && (
              <div className="oss-row">
                <span className="oss-row-label">Delivered</span>
                <span className="oss-row-value">
                  {new Date(tracking.deliveredAt).toLocaleString("en-IN")}
                </span>
              </div>
            )}

            <div className="oss-row">
              <span className="oss-row-label">Customer link</span>
              <span className="oss-row-value">
                {tracking.trackingUrl ? (
                  <a href={tracking.trackingUrl} target="_blank" rel="noopener noreferrer">
                    {tracking.trackingUrl}
                  </a>
                ) : (
                  <em>No direct link — the customer is shown the number to paste in.</em>
                )}
              </span>
            </div>
          </div>

          <div className="oss-actions">
            {isShipRocket && (
              <button
                type="button"
                className="oss-btn oss-btn-secondary"
                onClick={handleSync}
                disabled={loading}
              >
                {loading ? "Syncing…" : "Sync status"}
              </button>
            )}
            {events.length > 0 && (
              <button
                type="button"
                className="oss-btn oss-btn-secondary"
                onClick={() => setShowEvents((v) => !v)}
              >
                {showEvents ? "Hide events" : `View events (${events.length})`}
              </button>
            )}
            <button
              type="button"
              className="oss-btn oss-btn-danger"
              onClick={handleClear}
              disabled={loading}
            >
              Clear tracking
            </button>
          </div>

          {showEvents && events.length > 0 && (
            <ul className="oss-events">
              {events.map((event, idx) => (
                <li key={idx}>
                  <strong>{event.status || event.activity}</strong>
                  {event.date && (
                    <span className="oss-event-date">
                      {new Date(event.date || event.timestamp).toLocaleString("en-IN")}
                    </span>
                  )}
                  {event.location && <span className="oss-event-loc">{event.location}</span>}
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : (
        /* ── Not yet dispatched ── */
        <>
          <div className="oss-tabs" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={mode === "manual"}
              className={`oss-tab${mode === "manual" ? " oss-tab-active" : ""}`}
              onClick={() => { setMode("manual"); resetFeedback(); }}
            >
              Enter tracking manually
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === "shiprocket"}
              className={`oss-tab${mode === "shiprocket" ? " oss-tab-active" : ""}`}
              onClick={() => { setMode("shiprocket"); resetFeedback(); }}
            >
              Book with ShipRocket
            </button>
          </div>

          {mode === "manual" ? (
            <form className="oss-form" onSubmit={handleSaveManual}>
              <p className="oss-hint">
                Shipped through your own courier? Record the details here and the customer will see
                the tracking number and a link straight to that courier&apos;s tracking page.
              </p>

              <div className="oss-form-grid">
                <label className="oss-label">
                  Courier
                  <select
                    className="oss-input"
                    value={form.courier}
                    onChange={(e) => setForm((f) => ({ ...f, courier: e.target.value }))}
                    disabled={loading}
                    required
                  >
                    <option value="">Select a courier…</option>
                    {carriers.map((carrier) => (
                      <option key={carrier.code} value={carrier.code}>
                        {carrier.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="oss-label">
                  Tracking / consignment number
                  <input
                    type="text"
                    className="oss-input"
                    value={form.trackingNumber}
                    onChange={(e) => setForm((f) => ({ ...f, trackingNumber: e.target.value }))}
                    placeholder="e.g. 1234567890123"
                    disabled={loading}
                    required
                  />
                </label>
              </div>

              {form.courier === "other" && (
                <label className="oss-label">
                  Courier name
                  <input
                    type="text"
                    className="oss-input"
                    value={form.customCourier}
                    onChange={(e) => setForm((f) => ({ ...f, customCourier: e.target.value }))}
                    placeholder="Name of the courier company"
                    disabled={loading}
                    required
                  />
                </label>
              )}

              <label className="oss-label">
                Tracking URL <span className="oss-optional">(optional — we build one automatically)</span>
                <input
                  type="url"
                  className="oss-input"
                  value={form.trackingUrl}
                  onChange={(e) => setForm((f) => ({ ...f, trackingUrl: e.target.value }))}
                  placeholder="https://…"
                  disabled={loading}
                />
              </label>

              <button
                type="submit"
                className="oss-btn oss-btn-primary"
                disabled={loading || !canSaveManual}
              >
                {loading ? "Saving…" : "Save tracking & mark shipped"}
              </button>
            </form>
          ) : (
            <div className="oss-form">
              <p className="oss-hint">
                Books the shipment through ShipRocket and fills in the tracking details for you.
              </p>

              {courierNotice && <div className="oss-alert oss-alert-info">{courierNotice}</div>}

              {couriers.length > 0 && (
                <label className="oss-label">
                  Courier
                  <select
                    className="oss-input"
                    value={selectedCourier}
                    onChange={(e) => setSelectedCourier(e.target.value)}
                    disabled={loading}
                  >
                    <option value="">Auto-select the best option</option>
                    {couriers.map((courier) => (
                      <option key={courier.courier_company_id || courier.id} value={courier.courier_company_id || courier.id}>
                        {courier.courier_name || courier.name}
                        {courier.rate ? ` — ₹${courier.rate}` : ""}
                        {courier.etd ? ` · ${courier.etd}` : ""}
                      </option>
                    ))}
                  </select>
                </label>
              )}

              <button
                type="button"
                className="oss-btn oss-btn-primary"
                onClick={handleCreateShipment}
                disabled={loading}
              >
                {loading ? "Booking shipment…" : "Create shipment"}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

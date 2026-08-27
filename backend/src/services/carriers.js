/**
 * Registry of third-party couriers and their public tracking pages.
 *
 * `match` is tested against the courier name as typed by an admin *or* as
 * returned by ShipRocket, which sends service-level names like
 * "Delhivery Surface 500gm" or "Bluedart air". Matching on a loose pattern
 * rather than an exact string keeps those working.
 *
 * `url(awb)` must return a page the customer can open directly — the whole
 * point is that they never have to hunt for the courier's tracking form.
 */
const CARRIERS = [
  {
    code: "delhivery",
    name: "Delhivery",
    match: /delhivery/i,
    url: (awb) => `https://www.delhivery.com/track/package/${encodeURIComponent(awb)}`,
  },
  {
    code: "bluedart",
    name: "Blue Dart",
    match: /blue\s*dart|bluedart/i,
    url: (awb) =>
      `https://www.bluedart.com/web/guest/trackdartresult?trackFor=0&trackNo=${encodeURIComponent(awb)}`,
  },
  {
    code: "dtdc",
    name: "DTDC",
    match: /dtdc/i,
    url: (awb) => `https://www.dtdc.in/tracking/tracking_results.asp?strCnno=${encodeURIComponent(awb)}`,
  },
  {
    code: "indiapost",
    name: "India Post",
    match: /india\s*post|speed\s*post|department of post/i,
    url: () => "https://www.indiapost.gov.in/_layouts/15/DOP.Portal.Tracking/TrackConsignment.aspx",
    // India Post has no deep-link form; the customer pastes the number in.
    manualEntry: true,
  },
  {
    code: "ekart",
    name: "Ekart Logistics",
    match: /ekart/i,
    url: (awb) => `https://ekartlogistics.com/shipmenttrack/${encodeURIComponent(awb)}`,
  },
  {
    code: "xpressbees",
    name: "XpressBees",
    match: /xpress\s*bees|xpressbees/i,
    url: (awb) => `https://www.xpressbees.com/shipment/tracking?awbNo=${encodeURIComponent(awb)}`,
  },
  {
    code: "ecomexpress",
    name: "Ecom Express",
    match: /ecom\s*express|ecomexpress/i,
    url: (awb) => `https://ecomexpress.in/tracking/?awb_field=${encodeURIComponent(awb)}`,
  },
  {
    code: "shadowfax",
    name: "Shadowfax",
    match: /shadowfax/i,
    url: (awb) => `https://tracker.shadowfax.in/#/tracking/${encodeURIComponent(awb)}`,
  },
  {
    code: "amazon",
    name: "Amazon Shipping",
    match: /amazon/i,
    url: (awb) => `https://track.amazon.in/tracking/${encodeURIComponent(awb)}`,
  },
  {
    code: "fedex",
    name: "FedEx",
    match: /fedex/i,
    url: (awb) => `https://www.fedex.com/fedextrack/?trknbr=${encodeURIComponent(awb)}`,
  },
  {
    code: "dhl",
    name: "DHL",
    match: /dhl/i,
    url: (awb) =>
      `https://www.dhl.com/in-en/home/tracking/tracking-express.html?submit=1&tracking-id=${encodeURIComponent(awb)}`,
  },
  {
    code: "gati",
    name: "Gati",
    match: /gati/i,
    url: (awb) => `https://www.gati.com/single-docket-tracking/?docketNo=${encodeURIComponent(awb)}`,
  },
  {
    code: "trackon",
    name: "Trackon Couriers",
    match: /trackon/i,
    url: (awb) => `https://trackon.in/Tracking/${encodeURIComponent(awb)}`,
  },
  {
    code: "professional",
    name: "The Professional Couriers",
    match: /professional/i,
    url: (awb) => `https://www.tpcindia.com/Tracking2014.aspx?id=${encodeURIComponent(awb)}`,
  },
  {
    code: "safexpress",
    name: "Safexpress",
    match: /safexpress/i,
    url: (awb) => `https://www.safexpress.com/Tracking.aspx?wbn=${encodeURIComponent(awb)}`,
  },
  {
    code: "shiprocket",
    name: "Shiprocket",
    match: /ship\s*rocket|shiprocket/i,
    url: (awb) => `https://shiprocket.co/tracking/${encodeURIComponent(awb)}`,
  },
];

/** Options for the admin's courier dropdown, alphabetical, "Other" last. */
export function listCarriers() {
  return [
    ...CARRIERS.map(({ code, name }) => ({ code, name })).sort((a, b) =>
      a.name.localeCompare(b.name)
    ),
    { code: "other", name: "Other / not listed" },
  ];
}

function findCarrier(courier) {
  if (!courier) return null;
  const text = String(courier).trim();
  if (!text) return null;
  return (
    CARRIERS.find((c) => c.code === text.toLowerCase()) ||
    CARRIERS.find((c) => c.match.test(text)) ||
    null
  );
}

/**
 * Build the customer-facing tracking link for a shipment.
 *
 * `explicitUrl` (e.g. one ShipRocket already returned) always wins — it is more
 * specific than anything we can reconstruct. Otherwise we derive the URL from
 * the courier name. Returns null when the courier is unknown, so the UI can
 * show the tracking number on its own rather than a broken link.
 */
export function resolveTracking({ courier, trackingNumber, explicitUrl = null }) {
  const awb = trackingNumber ? String(trackingNumber).trim() : "";
  if (!awb) return null;

  const carrier = findCarrier(courier);
  const safeExplicit = isHttpUrl(explicitUrl) ? explicitUrl : null;

  return {
    trackingNumber: awb,
    carrierCode: carrier?.code ?? "other",
    carrierName: carrier?.name ?? (courier ? String(courier).trim() : "Courier"),
    trackingUrl: safeExplicit ?? (carrier ? carrier.url(awb) : null),
    // True when the courier's site cannot deep-link, so the customer has to
    // paste the number into a form themselves.
    requiresManualEntry: Boolean(carrier?.manualEntry && !safeExplicit),
  };
}

/**
 * Only http(s) URLs are ever handed to the browser — this keeps a stored
 * `javascript:` or `data:` value from becoming a clickable link in the UI.
 */
export function isHttpUrl(value) {
  if (!value || typeof value !== "string") return false;
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

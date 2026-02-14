import axios from "axios";

const SHIPROCKET_API_BASE = "https://apiv2.shiprocket.in/v1/external";
const SHIPROCKET_API_KEY = process.env.SHIPROCKET_API_KEY;
const SHIPROCKET_EMAIL = process.env.SHIPROCKET_EMAIL;
const SHIPROCKET_PASSWORD = process.env.SHIPROCKET_PASSWORD;

let authToken = null;
let tokenExpiry = null;

/**
 * Get ShipRocket auth token
 */
async function getAuthToken() {
  // Return cached token if still valid
  if (authToken && tokenExpiry && Date.now() < tokenExpiry) {
    return authToken;
  }

  // Check if credentials are configured
  if (!SHIPROCKET_EMAIL || !SHIPROCKET_PASSWORD) {
    throw new Error(
      "ShipRocket credentials not configured. Set SHIPROCKET_EMAIL and SHIPROCKET_PASSWORD in .env"
    );
  }

  try {
    const response = await axios.post(`${SHIPROCKET_API_BASE}/auth/login`, {
      email: SHIPROCKET_EMAIL,
      password: SHIPROCKET_PASSWORD,
    });

    authToken = response.data.token;
    // Token valid for 24 hours
    tokenExpiry = Date.now() + 24 * 60 * 60 * 1000;

    console.log("ShipRocket auth token obtained successfully");
    return authToken;
  } catch (error) {
    console.error(
      "ShipRocket auth error:",
      error.response?.data || error.message
    );
    throw new Error(
      "Failed to authenticate with ShipRocket: " +
        (error.response?.data?.message || error.message)
    );
  }
}

/**
 * Create order on ShipRocket
 */
export async function createShipRocketOrder(orderData) {
  try {
    const token = await getAuthToken();

    const payload = {
      order_id: orderData.order_id,
      order_date: orderData.order_date || new Date().toISOString().split("T")[0],
      pickup_location_id: orderData.pickup_location_id || 0, // Will use default
      billing_customer_name: orderData.customer_name,
      billing_last_name: "",
      billing_address: orderData.address.line1,
      billing_address_2: orderData.address.line2 || "",
      billing_isd_code: "+91",
      billing_mobile: orderData.customer_phone,
      billing_email: orderData.customer_email,
      billing_city: orderData.address.city,
      billing_pincode: orderData.address.pincode,
      billing_state: orderData.address.state,
      billing_country: orderData.address.country || "India",
      shipping_is_bill: 1,
      order_items: orderData.items.map((item) => ({
        name: item.product_name,
        sku: item.product_id,
        units: item.quantity,
        selling_price: item.price,
      })),
      payment_method: "Prepaid",
      sub_total: orderData.total_amount,
      length: 10,
      breadth: 10,
      height: 10,
      weight: 0.5,
    };

    const response = await axios.post(`${SHIPROCKET_API_BASE}/orders/create/adhoc`, payload, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    return {
      success: response.data.status_code === 1,
      shiprocket_order_id: response.data.data?.order_id,
      message: response.data.message,
      data: response.data.data,
    };
  } catch (error) {
    console.error("ShipRocket order creation error:", error.response?.data || error.message);
    return {
      success: false,
      message: error.response?.data?.message || error.message,
    };
  }
}

/**
 * Generate shipping label and create shipment
 */
export async function generateShippingLabel(orderData) {
  try {
    const token = await getAuthToken();

    const payload = {
      shipments: [
        {
          order_id: orderData.shiprocket_order_id,
          pickup_location_id: orderData.pickup_location_id || 1, // Default pickup location
          courier_id: orderData.courier_id || null, // null = auto select cheapest
          is_heavy_order: false,
        },
      ],
    };

    const response = await axios.post(`${SHIPROCKET_API_BASE}/shipments/create/adhoc`, payload, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    const shipmentData = response.data.data?.shipments?.[0];

    return {
      success: response.data.status_code === 1,
      shiprocket_shipment_id: shipmentData?.shipment_id,
      tracking_id: shipmentData?.tracking_data?.track_id,
      courier_company: shipmentData?.courier_company_name || shipmentData?.courier,
      tracking_url: shipmentData?.tracking_data?.client_tracking_url,
      label_url: response.data.data?.shipments?.[0]?.label_url,
      message: response.data.message,
      data: shipmentData,
    };
  } catch (error) {
    console.error("ShipRocket label generation error:", error.response?.data || error.message);
    return {
      success: false,
      message: error.response?.data?.message || error.message,
    };
  }
}

/**
 * Get tracking status
 */
export async function getTrackingStatus(trackingId) {
  try {
    const token = await getAuthToken();

    const response = await axios.get(
      `${SHIPROCKET_API_BASE}/tracking/id?tracking_id=${trackingId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const tracking = response.data.data?.tracking_data?.[0];

    return {
      success: response.data.status_code === 1,
      status: tracking?.status,
      status_code: tracking?.status_code,
      ship_date: tracking?.ship_date,
      delivered_date: tracking?.delivered_date,
      current_location: tracking?.current_location,
      events: tracking?.tracking_data || [],
      message: response.data.message,
    };
  } catch (error) {
    console.error("ShipRocket tracking error:", error.response?.data || error.message);
    return {
      success: false,
      status: "ERROR",
      message: error.response?.data?.message || error.message,
    };
  }
}

/**
 * Cancel shipment
 */
export async function cancelShipment(shipmentId) {
  try {
    const token = await getAuthToken();

    const response = await axios.post(
      `${SHIPROCKET_API_BASE}/shipments/${shipmentId}/cancel`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return {
      success: response.data.status_code === 1,
      message: response.data.message,
    };
  } catch (error) {
    console.error("ShipRocket cancel error:", error.response?.data || error.message);
    return {
      success: false,
      message: error.response?.data?.message || error.message,
    };
  }
}

/**
 * Get pickup locations
 */
export async function getPickupLocations() {
  try {
    const token = await getAuthToken();

    const response = await axios.get(`${SHIPROCKET_API_BASE}/companies/list/pickup_locations`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return {
      success: response.data.status_code === 1,
      locations: response.data.data || [],
    };
  } catch (error) {
    console.error("ShipRocket pickup locations error:", error.response?.data || error.message);
    return {
      success: false,
      locations: [],
    };
  }
}

/**
 * Get available couriers
 */
export async function getAvailableCouriers(pickupPostalCode, deliveryPostalCode, weight) {
  try {
    const token = await getAuthToken();

    // ShipRocket API expects pickup_postcode and delivery_postcode
    const params = {
      pickup_postcode: String(pickupPostalCode),
      delivery_postcode: String(deliveryPostalCode),
      weight: parseFloat(weight) || 0.5,
    };

    console.log("ShipRocket couriersList request:", params);

    const response = await axios.get(
      `${SHIPROCKET_API_BASE}/courier/serviceability/`,
      {
        params,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("ShipRocket couriersList response:", response.data);

    return {
      success: response.data.status_code === 1,
      data: response.data.data || [],
      couriers: response.data.data?.available_courier_companies || [],
      message: response.data.message,
    };
  } catch (error) {
    console.error(
      "ShipRocket couriers error:",
      error.response?.status,
      error.response?.data || error.message
    );
    return {
      success: false,
      data: [],
      couriers: [],
      message: error.response?.data?.message || error.message,
    };
  }
}

export default {
  createShipRocketOrder,
  generateShippingLabel,
  getTrackingStatus,
  cancelShipment,
  getPickupLocations,
  getAvailableCouriers,
};

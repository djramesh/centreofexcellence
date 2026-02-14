export const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:4000";

async function request(path, options = {}) {
  const token = localStorage.getItem("authToken");

  const headers = {
    ...(options.headers || {}),
  };

  // Only set Content-Type if not FormData and not already set
  if (!(options.body instanceof FormData) && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  // Remove Content-Type for FormData (let browser set it with boundary)
  if (options.body instanceof FormData) {
    delete headers["Content-Type"];
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  const isJson = res.headers
    .get("content-type")
    ?.includes("application/json");

  const data = isJson ? await res.json() : null;

  if (!res.ok) {
    throw { status: res.status, data };
  }

  return data;
}

export const apiClient = {
  get: (path) => request(path),
  post: (path, body, options = {}) =>
    request(path, {
      method: "POST",
      body: body instanceof FormData ? body : JSON.stringify(body || {}),
      ...options,
    }),
  put: (path, body, options = {}) =>
    request(path, {
      method: "PUT",
      body: body instanceof FormData ? body : JSON.stringify(body || {}),
      ...options,
    }),
  patch: (path, body) =>
    request(path, { method: "PATCH", body: JSON.stringify(body || {}) }),
  delete: (path) => request(path, { method: "DELETE" }),
};

export default apiClient;
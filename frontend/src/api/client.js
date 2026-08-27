export const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

export const TOKEN_KEY = "authToken";
/** Fired when the server rejects our token, so AuthContext can sign the user out. */
export const AUTH_EXPIRED_EVENT = "coe:auth-expired";

export const getToken = () => {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    // Private-mode Safari and "block site data" throw on access.
    return null;
  }
};

export const setToken = (token) => {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* nothing we can do; the session simply won't persist */
  }
};

/**
 * An API failure with a message that is safe and useful to show a user.
 * Every call site was previously reaching into `err?.data?.message ||
 * err?.message || "Failed"`; `error.message` is now always populated.
 */
export class ApiError extends Error {
  constructor(message, { status = 0, data = null, isNetworkError = false } = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
    this.isNetworkError = isNetworkError;
  }
}

function messageFor(status, data) {
  if (data?.message) return data.message;
  if (Array.isArray(data?.errors) && data.errors[0]?.msg) return data.errors[0].msg;

  switch (status) {
    case 400:
      return "Some details were not accepted. Please check and try again.";
    case 401:
      return "Your session has expired. Please sign in again.";
    case 403:
      return "You do not have permission to do that.";
    case 404:
      return "We couldn't find what you were looking for.";
    case 409:
      return "That conflicts with something that already exists.";
    case 413:
      return "That file is too large.";
    case 429:
      return "Too many requests. Please wait a moment and try again.";
    case 503:
      return "That service is temporarily unavailable. Please try again shortly.";
    default:
      return status >= 500
        ? "Something went wrong on our side. Please try again."
        : "Request failed. Please try again.";
  }
}

async function request(path, options = {}) {
  const { timeout = 20000, ...fetchOptions } = options;
  const token = getToken();
  const isFormData = fetchOptions.body instanceof FormData;

  const headers = { ...(fetchOptions.headers || {}) };

  // Let the browser set multipart Content-Type so it can add the boundary.
  if (isFormData) delete headers["Content-Type"];
  else if (!headers["Content-Type"]) headers["Content-Type"] = "application/json";

  if (token) headers.Authorization = `Bearer ${token}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  let res;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, {
      ...fetchOptions,
      headers,
      signal: controller.signal,
    });
  } catch (err) {
    throw new ApiError(
      err.name === "AbortError"
        ? "The request took too long. Please check your connection and try again."
        : "Could not reach the server. Please check your connection.",
      { isNetworkError: true }
    );
  } finally {
    clearTimeout(timer);
  }

  const isJson = res.headers.get("content-type")?.includes("application/json");
  const data = isJson ? await res.json().catch(() => null) : null;

  if (!res.ok) {
    if (res.status === 401 && token) {
      // The token we sent was rejected — drop it and let the app react once,
      // rather than every screen inventing its own expiry handling.
      setToken(null);
      window.dispatchEvent(new CustomEvent(AUTH_EXPIRED_EVENT));
    }
    throw new ApiError(messageFor(res.status, data), { status: res.status, data });
  }

  return data;
}

const withBody = (method) => (path, body, options = {}) =>
  request(path, {
    method,
    body: body instanceof FormData ? body : JSON.stringify(body ?? {}),
    ...options,
  });

export const apiClient = {
  get: (path, options) => request(path, options),
  post: withBody("POST"),
  put: withBody("PUT"),
  patch: withBody("PATCH"),
  delete: (path, options) => request(path, { method: "DELETE", ...options }),
};

/**
 * Ordered list of URLs to try for a stored image path.
 *
 * Images arrive from three places and each lives somewhere different:
 *   - Cloudinary / any absolute URL -> use as-is.
 *   - /uploads/*  -> uploaded through the admin panel, served by the API host.
 *   - /assets/*   -> seeded artwork, which ships in the SPA's public folder but
 *                    for older uploads may only exist on the API host.
 * The last case is genuinely ambiguous, so both are offered and <SmartImage>
 * falls through to the second if the first 404s.
 */
export function imageSources(url) {
  if (!url) return [];
  if (/^(https?:|data:|blob:)/.test(url)) return [url];

  // Filenames routinely contain spaces and parentheses; encode each segment.
  const encoded = `/${url
    .replace(/^\//, "")
    .split("/")
    .map(encodeURIComponent)
    .join("/")}`;

  if (encoded.startsWith("/uploads/")) return [`${API_BASE_URL}${encoded}`];
  return [encoded, `${API_BASE_URL}${encoded}`];
}

/** First candidate only, for the places that need a plain string. */
export function resolveImageUrl(url) {
  return imageSources(url)[0] ?? null;
}

export default apiClient;

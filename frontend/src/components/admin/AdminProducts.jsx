import React, { useEffect, useState, useCallback, useRef } from "react";
import { adminApi } from "../../api/admin.js";
import "./AdminProducts.css";

/* ─── Resolve image URL (handles spaces in local asset paths) ─────────────── */
function resolveImgUrl(url) {
  if (!url) return null;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  if (url.startsWith("/assets/") || url.startsWith("assets/")) {
    return url.split("/").map((seg) => encodeURIComponent(seg)).join("/");
  }
  return url;
}

/* ─── Image Lightbox ─────────────────────────────────────────────────────── */
function ImageLightbox({ src, alt, onClose }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div className="lb-backdrop" onClick={onClose}>
      <button className="lb-close" onClick={onClose} aria-label="Close">✕</button>
      <img
        src={src}
        alt={alt || "Product"}
        className="lb-img"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
}

/* ─── Product thumbnail cell ─────────────────────────────────────────────── */
function ProductThumbCell({ url, name, onExpand }) {
  const [err, setErr] = useState(false);
  const src = resolveImgUrl(url);

  if (!src || err) {
    return (
      <div className="ap-thumb-placeholder" title="No image">
        <span>🧺</span>
      </div>
    );
  }

  return (
    <div
      className="ap-thumb-wrap"
      onClick={() => onExpand(src, name)}
      title="Click to enlarge"
    >
      <img
        src={src}
        alt={name || "Product"}
        className="ap-thumb"
        onError={() => setErr(true)}
      />
      <div className="ap-thumb-overlay">🔍</div>
    </div>
  );
}

export default function AdminProducts() {
  const [products, setProducts]     = useState([]);
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0 });
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState("");
  const [modal, setModal]           = useState(null);
  const [lightbox, setLightbox]     = useState(null); // { src, alt }

  // ── Search state ──────────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState("");
  const [searchActive, setSearchActive] = useState(false); // are we showing search results?
  const [searchResults, setSearchResults] = useState([]);
  const searchDebounce = useRef(null);

  const [form, setForm] = useState({
    name: "", slug: "", description: "", price: "", stock: 0,
    category_id: "", thumbnail_url: "", thumbnail_file: null, is_active: true,
    length_cm: "", breadth_cm: "", height_cm: "",
  });
  const [saving, setSaving]             = useState(false);
  const [imagePreview, setImagePreview] = useState(null);

  // ── Lightbox helpers ──────────────────────────────────────────────────────
  const openLightbox  = useCallback((src, alt) => setLightbox({ src, alt }), []);
  const closeLightbox = useCallback(() => setLightbox(null), []);

  // ── Load paginated products ───────────────────────────────────────────────
  const loadProducts = (page = 1) => {
    setLoading(true);
    adminApi.getProducts({ page, limit: 20 })
      .then((res) => { setProducts(res.products); setPagination(res.pagination); })
      .catch((err) => setError(err?.data?.message || err?.message || "Failed to load"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadProducts();
    adminApi.getCategories().then(setCategories).catch(() => setCategories([]));
  }, []);

  // ── Search — debounced, client-side filter over loaded + fetched results ──
  const handleSearch = (q) => {
    setSearchQuery(q);
    clearTimeout(searchDebounce.current);

    if (!q.trim()) {
      setSearchActive(false);
      setSearchResults([]);
      return;
    }

    searchDebounce.current = setTimeout(() => {
      const lower = q.trim().toLowerCase();
      const isId  = /^\d+$/.test(q.trim());

      // Filter from already-loaded products first (instant)
      const filtered = products.filter((p) =>
        isId
          ? String(p.id) === q.trim()
          : p.name.toLowerCase().includes(lower)
      );
      setSearchResults(filtered);
      setSearchActive(true);

      // Also fetch all pages if we might have missed results (search across full DB)
      adminApi.getProducts({ page: 1, limit: 200 })
        .then((res) => {
          const all = res.products || [];
          const fullFiltered = all.filter((p) =>
            isId
              ? String(p.id) === q.trim()
              : p.name.toLowerCase().includes(lower)
          );
          setSearchResults(fullFiltered);
        })
        .catch(() => {/* keep client-side results */});
    }, 300);
  };

  const clearSearch = () => {
    setSearchQuery("");
    setSearchActive(false);
    setSearchResults([]);
  };

  // Displayed rows: search results or paginated list
  const displayedProducts = searchActive ? searchResults : products;

  // ── Form helpers ──────────────────────────────────────────────────────────
  const emptyForm = () => ({
    name: "", slug: "", description: "", price: "", stock: 0,
    category_id: "", thumbnail_url: "", thumbnail_file: null, is_active: true,
    length_cm: "", breadth_cm: "", height_cm: "",
  });

  const openAdd = () => {
    setModal("add");
    setForm(emptyForm());
    setImagePreview(null);
    setError("");
  };

  const openEdit = (p) => {
    setModal("edit");
    setForm({
      id: p.id,
      name: p.name,
      slug: p.slug || "",
      description: p.description || "",
      price: p.price,
      stock: p.stock,
      category_id: p.category_id || "",
      thumbnail_url: p.thumbnail_url || "",
      thumbnail_file: null,
      is_active: !!p.is_active,
      length_cm:  p.length_cm  ?? "",
      breadth_cm: p.breadth_cm ?? "",
      height_cm:  p.height_cm  ?? "",
    });
    setImagePreview(p.thumbnail_url || null);
    setError("");
  };

  const closeModal = () => setModal(null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { setError("Please select a valid image file"); return; }
    setError("");
    setForm((f) => ({ ...f, thumbnail_file: file }));
    const reader = new FileReader();
    reader.onload = (evt) => setImagePreview(evt.target?.result);
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    const payload = new FormData();
    payload.append("name",        form.name.trim());
    payload.append("description", form.description.trim() || "");
    payload.append("price",       parseFloat(form.price) || 0);
    payload.append("stock",       parseInt(form.stock, 10) || 0);
    payload.append("category_id", form.category_id ? parseInt(form.category_id, 10) : "");
    payload.append("is_active",   form.is_active);
    if (form.slug?.trim()) payload.append("slug", form.slug.trim());
    if (form.length_cm  !== "") payload.append("length_cm",  parseFloat(form.length_cm));
    if (form.breadth_cm !== "") payload.append("breadth_cm", parseFloat(form.breadth_cm));
    if (form.height_cm  !== "") payload.append("height_cm",  parseFloat(form.height_cm));
    if (form.thumbnail_file)     payload.append("thumbnail_file", form.thumbnail_file);
    else if (form.thumbnail_url) payload.append("thumbnail_url",  form.thumbnail_url);

    const promise = modal === "add"
      ? adminApi.createProduct(payload)
      : adminApi.updateProduct(form.id, payload);

    promise
      .then(() => { closeModal(); loadProducts(pagination.page); clearSearch(); })
      .catch((err) => setError(err?.data?.message || err?.message || "Failed to save"))
      .finally(() => setSaving(false));
  };

  const handleToggleActive = (p) => {
    adminApi.updateProductStatus(p.id, !p.is_active)
      .then(() => loadProducts(pagination.page))
      .catch((err) => setError(err?.data?.message || err?.message || "Failed"));
  };

  const handleStockChange = (p, val) => {
    const v = parseInt(val, 10);
    if (isNaN(v) || v < 0) return;
    adminApi.updateProductStock(p.id, v)
      .then(() => loadProducts(pagination.page))
      .catch((err) => setError(err?.data?.message || err?.message || "Failed"));
  };

  const handleDelete = (p) => {
    if (!window.confirm('Delete "' + p.name + '"?')) return;
    adminApi.deleteProduct(p.id)
      .then(() => { loadProducts(pagination.page); clearSearch(); })
      .catch((err) => setError(err?.data?.message || err?.message || "Failed"));
  };

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  return (
    <div className="admin-page admin-products">

      {/* Lightbox */}
      {lightbox && (
        <ImageLightbox src={lightbox.src} alt={lightbox.alt} onClose={closeLightbox} />
      )}

      <header className="admin-page-header admin-products-header">
        <div>
          <h1>Products</h1>
          <p>Add, edit, and manage products</p>
        </div>
        <button type="button" className="admin-btn admin-btn-primary" onClick={openAdd}>
          Add product
        </button>
      </header>

      {/* ── Search bar ── */}
      <div className="ap-search-wrap">
        <div className="ap-search-box">
          <span className="ap-search-icon">🔍</span>
          <input
            type="text"
            className="ap-search-input"
            placeholder="Search by product name or ID…"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            autoComplete="off"
          />
          {searchQuery && (
            <button className="ap-search-clear" onClick={clearSearch} aria-label="Clear search">✕</button>
          )}
        </div>
        {searchActive && (
          <p className="ap-search-meta">
            {searchResults.length === 0
              ? "No products found"
              : `${searchResults.length} result${searchResults.length !== 1 ? "s" : ""} for "${searchQuery}"`}
          </p>
        )}
      </div>

      {error && <div className="admin-error">{error}</div>}

      {loading ? (
        <div className="admin-loading">Loading products…</div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Image</th>
                <th>Name</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Dimensions (L×B×H cm)</th>
                <th>Status</th>
                <th>Category</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {displayedProducts.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: "center", padding: "2.5rem", color: "#94a3b8" }}>
                    {searchActive ? "No products match your search." : "No products yet."}
                  </td>
                </tr>
              ) : (
                displayedProducts.map((p) => (
                  <tr key={p.id}>
                    <td style={{ color: "#94a3b8", fontSize: "0.8rem", fontWeight: 600 }}>#{p.id}</td>

                    {/* ── Image column ── */}
                    <td>
                      <ProductThumbCell
                        url={p.thumbnail_url}
                        name={p.name}
                        onExpand={openLightbox}
                      />
                    </td>

                    <td>
                      <div className="admin-product-name">{p.name}</div>
                      {p.slug && <div className="admin-muted">{p.slug}</div>}
                    </td>
                    <td>₹{Number(p.price).toLocaleString("en-IN")}</td>
                    <td>
                      <input
                        type="number" min="0"
                        key={"stock-" + p.id + "-" + p.stock}
                        defaultValue={p.stock}
                        onBlur={(e) => handleStockChange(p, e.target.value)}
                        className="admin-stock-input"
                      />
                    </td>
                    <td className="admin-muted" style={{ fontSize: "0.8rem", whiteSpace: "nowrap" }}>
                      {p.length_cm || p.breadth_cm
                        ? `${p.length_cm ?? "—"} × ${p.breadth_cm ?? "—"}${p.height_cm ? ` × ${p.height_cm}` : ""}`
                        : <span style={{ opacity: 0.4 }}>Not set</span>}
                    </td>
                    <td>
                      <button
                        type="button"
                        className={"admin-badge admin-badge-toggle " + (p.is_active ? "active" : "inactive")}
                        onClick={() => handleToggleActive(p)}
                      >
                        {p.is_active ? "Active" : "Inactive"}
                      </button>
                    </td>
                    <td>{p.category_name || "—"}</td>
                    <td>
                      <div className="admin-actions-cell">
                        <button type="button" className="admin-link admin-btn-link" onClick={() => openEdit(p)}>Edit</button>
                        <button type="button" className="admin-link admin-btn-link admin-link-danger" onClick={() => handleDelete(p)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination — hide when searching */}
      {!searchActive && pagination.total > pagination.limit && (
        <div className="admin-pagination">
          <button type="button" className="admin-btn admin-btn-secondary"
            disabled={pagination.page <= 1} onClick={() => loadProducts(pagination.page - 1)}>Previous</button>
          <span className="admin-pagination-info">
            Page {pagination.page} of {Math.ceil(pagination.total / pagination.limit)}
          </span>
          <button type="button" className="admin-btn admin-btn-secondary"
            disabled={pagination.page >= Math.ceil(pagination.total / pagination.limit)}
            onClick={() => loadProducts(pagination.page + 1)}>Next</button>
        </div>
      )}

      {/* ── Add / Edit modal ── */}
      {modal && (
        <div className="admin-modal-overlay" onClick={closeModal}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <h2>{modal === "add" ? "Add product" : "Edit product"}</h2>
            {error && <div className="admin-error">{error}</div>}
            <form onSubmit={handleSubmit} className="admin-product-form">

              <label>Name *
                <input type="text" value={form.name} required className="admin-input" onChange={set("name")} />
              </label>

              <label>Slug (optional)
                <input type="text" value={form.slug} placeholder="auto from name" className="admin-input" onChange={set("slug")} />
              </label>

              <label>Description
                <textarea value={form.description} rows={3} className="admin-input" onChange={set("description")} />
              </label>

              <div className="admin-form-row">
                <label>Price *
                  <input type="number" step="0.01" min="0" value={form.price} required className="admin-input" onChange={set("price")} />
                </label>
                <label>Stock
                  <input type="number" min="0" value={form.stock} className="admin-input" onChange={set("stock")} />
                </label>
              </div>

              <div className="admin-section-divider">
                <span>📐 Dimensions (cm)</span>
                <small>Optional — leave blank to use estimated values.</small>
              </div>
              <div className="admin-form-row admin-form-row--3">
                <label>Length
                  <input type="number" step="0.1" min="0" value={form.length_cm} placeholder="e.g. 30" className="admin-input" onChange={set("length_cm")} />
                </label>
                <label>Breadth
                  <input type="number" step="0.1" min="0" value={form.breadth_cm} placeholder="e.g. 20" className="admin-input" onChange={set("breadth_cm")} />
                </label>
                <label>Height <span style={{ fontSize: "0.72rem", opacity: 0.6 }}>(optional)</span>
                  <input type="number" step="0.1" min="0" value={form.height_cm} placeholder="e.g. 10" className="admin-input" onChange={set("height_cm")} />
                </label>
              </div>

              <label>Category
                <select value={form.category_id} className="admin-input" onChange={set("category_id")}>
                  <option value="">None</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </label>

              <label>Product Image (Max 5MB)
                <div className="admin-image-upload">
                  <input type="file" accept="image/*" onChange={handleFileChange} className="admin-input" />
                  {imagePreview && (
                    <div className="admin-image-preview">
                      <img src={resolveImgUrl(imagePreview) || imagePreview} alt="Preview" />
                      <p className="admin-preview-text">
                        {form.thumbnail_file ? form.thumbnail_file.name : "Current image"}
                      </p>
                    </div>
                  )}
                </div>
              </label>

              <label>Image URL (ignored if uploading new image)
                <input type="text" value={form.thumbnail_url} placeholder="/assets/..."
                  className="admin-input" disabled={!!form.thumbnail_file} onChange={set("thumbnail_url")} />
              </label>

              <label className="admin-checkbox-label">
                <input type="checkbox" checked={form.is_active}
                  onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))} />
                Active (visible on store)
              </label>

              <div className="admin-modal-actions">
                <button type="button" className="admin-btn admin-btn-secondary" onClick={closeModal}>Cancel</button>
                <button type="submit" className="admin-btn admin-btn-primary" disabled={saving}>
                  {saving ? "Saving…" : modal === "add" ? "Add" : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
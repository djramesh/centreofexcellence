import React, { useCallback, useEffect, useRef, useState } from "react";
import { adminApi } from "../../api/admin.js";
import SmartImage from "../common/SmartImage.jsx";
import ImageLightbox from "../common/ImageLightbox.jsx";
import ProductGallery from "./ProductGallery.jsx";
import "./AdminProducts.css";

const emptyForm = () => ({
  name: "",
  slug: "",
  description: "",
  price: "",
  stock: 0,
  category_id: "",
  thumbnail_url: "",
  thumbnail_file: null,
  gallery_files: [],
  is_active: true,
  length_cm: "",
  breadth_cm: "",
  height_cm: "",
});

/* ─── Thumbnail cell ──────────────────────────────────────────────────── */
function ProductThumbCell({ product, onExpand }) {
  const count = product.images?.length ?? 0;
  return (
    <button
      type="button"
      className="ap-thumb-wrap"
      onClick={() => onExpand(product)}
      title="Click to enlarge"
    >
      <SmartImage
        src={product.thumbnail_url || product.images?.[0]?.url}
        alt={product.name}
        wrapperClassName="ap-thumb-placeholder"
      />
      <span className="ap-thumb-overlay">🔍</span>
      {count > 1 && <span className="ap-thumb-count">{count}</span>}
    </button>
  );
}

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [modal, setModal] = useState(null);
  const [lightbox, setLightbox] = useState(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);

  const searchTimer = useRef(null);
  const requestId = useRef(0);

  /* Search runs on the server, so it covers the whole catalogue rather than
     just the page currently loaded — the old version filtered the 20 rows in
     memory and separately refetched 200 more on every keystroke. */
  const load = useCallback((page = 1, search = "") => {
    setLoading(true);
    const id = ++requestId.current;

    adminApi
      .getProducts({ page, limit: 20, search: search.trim() || undefined })
      .then((res) => {
        if (id !== requestId.current) return;
        setProducts(res.products || []);
        setPagination(res.pagination);
        setError("");
      })
      .catch((err) => id === requestId.current && setError(err.message))
      .finally(() => id === requestId.current && setLoading(false));
  }, []);

  useEffect(() => {
    adminApi.getCategories().then(setCategories).catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => load(1, searchQuery), searchQuery ? 300 : 0);
    return () => clearTimeout(searchTimer.current);
  }, [searchQuery, load]);

  const flash = (message) => {
    setNotice(message);
    setTimeout(() => setNotice(""), 3000);
  };

  const refresh = () => load(pagination.page, searchQuery);

  // ── Modal ────────────────────────────────────────────────────────────────
  const openAdd = () => {
    setModal({ mode: "add" });
    setForm(emptyForm());
    setImagePreview(null);
    setError("");
  };

  const openEdit = (product) => {
    setModal({ mode: "edit", id: product.id });
    setForm({
      id: product.id,
      name: product.name,
      slug: product.slug || "",
      description: product.description || "",
      price: product.price,
      stock: product.stock,
      category_id: product.category_id || "",
      thumbnail_url: product.thumbnail_url || "",
      thumbnail_file: null,
      gallery_files: [],
      is_active: !!product.is_active,
      length_cm: product.length_cm ?? "",
      breadth_cm: product.breadth_cm ?? "",
      height_cm: product.height_cm ?? "",
    });
    setImagePreview(product.thumbnail_url || null);
    setError("");
  };

  const closeModal = () => setModal(null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file");
      return;
    }
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
    payload.append("name", form.name.trim());
    payload.append("description", form.description.trim());
    payload.append("price", parseFloat(form.price) || 0);
    payload.append("stock", parseInt(form.stock, 10) || 0);
    payload.append("is_active", form.is_active);
    if (form.category_id) payload.append("category_id", parseInt(form.category_id, 10));
    if (form.slug?.trim()) payload.append("slug", form.slug.trim());
    if (form.length_cm !== "") payload.append("length_cm", parseFloat(form.length_cm));
    if (form.breadth_cm !== "") payload.append("breadth_cm", parseFloat(form.breadth_cm));
    if (form.height_cm !== "") payload.append("height_cm", parseFloat(form.height_cm));
    if (form.thumbnail_file) payload.append("thumbnail_file", form.thumbnail_file);
    else if (form.thumbnail_url) payload.append("thumbnail_url", form.thumbnail_url);
    // Extra photos, uploaded in the same request when creating a product.
    Array.from(form.gallery_files).forEach((file) => payload.append("gallery_files", file));

    const request =
      modal.mode === "add"
        ? adminApi.createProduct(payload)
        : adminApi.updateProduct(form.id, payload);

    request
      .then(() => {
        closeModal();
        refresh();
        flash(modal.mode === "add" ? "Product added" : "Product saved");
      })
      .catch((err) => setError(err.message))
      .finally(() => setSaving(false));
  };

  const handleToggleActive = (product) => {
    adminApi
      .updateProductStatus(product.id, !product.is_active)
      .then(() => {
        refresh();
        flash(product.is_active ? "Product hidden from the store" : "Product is live");
      })
      .catch((err) => setError(err.message));
  };

  const handleStockChange = (product, value) => {
    const stock = parseInt(value, 10);
    if (Number.isNaN(stock) || stock < 0 || stock === product.stock) return;
    adminApi
      .updateProductStock(product.id, stock)
      .then(() => {
        refresh();
        flash(`Stock for ${product.name} set to ${stock}`);
      })
      .catch((err) => setError(err.message));
  };

  const handleDelete = (product) => {
    if (!window.confirm(`Delete "${product.name}"? This cannot be undone.`)) return;
    adminApi
      .deleteProduct(product.id)
      .then(() => {
        refresh();
        flash("Product deleted");
      })
      .catch((err) => {
        // A product referenced by an order is deactivated instead of deleted;
        // the server says so and the list needs to reflect the new state.
        setError(err.message);
        if (err.status === 409) refresh();
      });
  };

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const totalPages = Math.max(1, Math.ceil(pagination.total / pagination.limit));

  return (
    <div className="admin-page admin-products">
      {lightbox && (
        <ImageLightbox images={lightbox.images} startIndex={0} onClose={() => setLightbox(null)} />
      )}

      <header className="admin-page-header admin-products-header">
        <div>
          <h1>Products</h1>
          <p>Add, edit, and manage products and their photos</p>
        </div>
        <button type="button" className="admin-btn admin-btn-primary" onClick={openAdd}>
          + Add product
        </button>
      </header>

      <div className="ap-search-wrap">
        <div className="ap-search-box">
          <span className="ap-search-icon">🔍</span>
          <input
            type="search"
            className="ap-search-input"
            placeholder="Search by product name, slug or ID…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoComplete="off"
            aria-label="Search products"
          />
          {searchQuery && (
            <button className="ap-search-clear" onClick={() => setSearchQuery("")} aria-label="Clear search">
              ✕
            </button>
          )}
        </div>
        {searchQuery && !loading && (
          <p className="ap-search-meta">
            {pagination.total === 0
              ? "No products found"
              : `${pagination.total} result${pagination.total !== 1 ? "s" : ""} for "${searchQuery}"`}
          </p>
        )}
      </div>

      {error && <div className="admin-error">{error}</div>}
      {notice && <div className="admin-notice">✓ {notice}</div>}

      {loading ? (
        <div className="admin-loading">Loading products…</div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Photos</th>
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
              {products.length === 0 ? (
                <tr>
                  <td colSpan={9} className="ap-empty-row">
                    {searchQuery ? "No products match your search." : "No products yet."}
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr key={product.id}>
                    <td className="ap-id">#{product.id}</td>
                    <td>
                      <ProductThumbCell
                        product={product}
                        onExpand={(p) => {
                          const images = (
                            p.images?.length
                              ? p.images
                              : [{ url: p.thumbnail_url, alt: p.name }]
                          ).filter((img) => img.url);
                          if (images.length) setLightbox({ images });
                        }}
                      />
                    </td>
                    <td>
                      <div className="admin-product-name">{product.name}</div>
                      {product.slug && <div className="admin-muted">{product.slug}</div>}
                    </td>
                    <td>₹{Number(product.price).toLocaleString("en-IN")}</td>
                    <td>
                      <input
                        type="number"
                        min="0"
                        key={`stock-${product.id}-${product.stock}`}
                        defaultValue={product.stock}
                        onBlur={(e) => handleStockChange(product, e.target.value)}
                        className={`admin-stock-input${product.stock <= 5 ? " admin-stock-low" : ""}`}
                        aria-label={`Stock for ${product.name}`}
                      />
                    </td>
                    <td className="admin-muted ap-dims">
                      {product.length_cm || product.breadth_cm ? (
                        `${product.length_cm ?? "—"} × ${product.breadth_cm ?? "—"}${
                          product.height_cm ? ` × ${product.height_cm}` : ""
                        }`
                      ) : (
                        <span className="ap-unset">Not set</span>
                      )}
                    </td>
                    <td>
                      <button
                        type="button"
                        className={`admin-badge admin-badge-toggle ${product.is_active ? "active" : "inactive"}`}
                        onClick={() => handleToggleActive(product)}
                      >
                        {product.is_active ? "Active" : "Inactive"}
                      </button>
                    </td>
                    <td>{product.category_name || "—"}</td>
                    <td>
                      <div className="admin-actions-cell">
                        <button type="button" className="admin-link admin-btn-link" onClick={() => openEdit(product)}>
                          Edit
                        </button>
                        <button
                          type="button"
                          className="admin-link admin-btn-link admin-link-danger"
                          onClick={() => handleDelete(product)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {pagination.total > pagination.limit && (
        <div className="admin-pagination">
          <button
            type="button"
            className="admin-btn admin-btn-secondary"
            disabled={pagination.page <= 1}
            onClick={() => load(pagination.page - 1, searchQuery)}
          >
            Previous
          </button>
          <span className="admin-pagination-info">
            Page {pagination.page} of {totalPages} · {pagination.total} products
          </span>
          <button
            type="button"
            className="admin-btn admin-btn-secondary"
            disabled={pagination.page >= totalPages}
            onClick={() => load(pagination.page + 1, searchQuery)}
          >
            Next
          </button>
        </div>
      )}

      {/* ── Add / edit modal ── */}
      {modal && (
        <div className="admin-modal-overlay" onClick={closeModal} role="presentation">
          <div
            className="admin-modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label={modal.mode === "add" ? "Add product" : "Edit product"}
          >
            <h2>{modal.mode === "add" ? "Add product" : "Edit product"}</h2>
            {error && <div className="admin-error">{error}</div>}

            <form onSubmit={handleSubmit} className="admin-product-form">
              <label>
                Name *
                <input type="text" value={form.name} required className="admin-input" onChange={set("name")} />
              </label>

              <label>
                Slug (optional)
                <input
                  type="text"
                  value={form.slug}
                  placeholder="auto from name"
                  className="admin-input"
                  onChange={set("slug")}
                />
                <small className="admin-field-hint">
                  Used in the product URL: /products/{form.slug || "your-product-name"}
                </small>
              </label>

              <label>
                Description
                <textarea value={form.description} rows={3} className="admin-input" onChange={set("description")} />
              </label>

              <div className="admin-form-row">
                <label>
                  Price *
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.price}
                    required
                    className="admin-input"
                    onChange={set("price")}
                  />
                </label>
                <label>
                  Stock
                  <input type="number" min="0" value={form.stock} className="admin-input" onChange={set("stock")} />
                </label>
              </div>

              <div className="admin-section-divider">
                <span>📐 Dimensions (cm)</span>
                <small>Optional — customers see a typical size estimate when this is blank.</small>
              </div>
              <div className="admin-form-row admin-form-row--3">
                <label>
                  Length
                  <input type="number" step="0.1" min="0" value={form.length_cm} placeholder="e.g. 30" className="admin-input" onChange={set("length_cm")} />
                </label>
                <label>
                  Breadth
                  <input type="number" step="0.1" min="0" value={form.breadth_cm} placeholder="e.g. 20" className="admin-input" onChange={set("breadth_cm")} />
                </label>
                <label>
                  Height
                  <input type="number" step="0.1" min="0" value={form.height_cm} placeholder="e.g. 10" className="admin-input" onChange={set("height_cm")} />
                </label>
              </div>

              <label>
                Category
                <select value={form.category_id} className="admin-input" onChange={set("category_id")}>
                  <option value="">None</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </label>

              <div className="admin-section-divider">
                <span>🖼️ Main photo</span>
                <small>Shown on the product card in the store.</small>
              </div>

              <label>
                Upload image (max 5MB)
                <div className="admin-image-upload">
                  <input type="file" accept="image/*" onChange={handleFileChange} className="admin-input" />
                  {imagePreview && (
                    <div className="admin-image-preview">
                      <SmartImage src={imagePreview} alt="Preview" />
                      <p className="admin-preview-text">
                        {form.thumbnail_file ? form.thumbnail_file.name : "Current image"}
                      </p>
                    </div>
                  )}
                </div>
              </label>

              <label>
                Image URL (ignored if uploading a new image)
                <input
                  type="text"
                  value={form.thumbnail_url}
                  placeholder="/assets/…"
                  className="admin-input"
                  disabled={!!form.thumbnail_file}
                  onChange={set("thumbnail_url")}
                />
              </label>

              {modal.mode === "add" ? (
                <>
                  <div className="admin-section-divider">
                    <span>🖼️ Extra photos</span>
                    <small>Optional — add more angles now, or manage them after saving.</small>
                  </div>
                  <label>
                    Additional images
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="admin-input"
                      onChange={(e) => setForm((f) => ({ ...f, gallery_files: e.target.files }))}
                    />
                    {form.gallery_files?.length > 0 && (
                      <small className="admin-field-hint">
                        {form.gallery_files.length} extra photo
                        {form.gallery_files.length !== 1 ? "s" : ""} selected
                      </small>
                    )}
                  </label>
                </>
              ) : (
                <ProductGallery productId={form.id} onChanged={refresh} />
              )}

              <label className="admin-checkbox-label">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
                />
                Active (visible on store)
              </label>

              <div className="admin-modal-actions">
                <button type="button" className="admin-btn admin-btn-secondary" onClick={closeModal}>
                  Cancel
                </button>
                <button type="submit" className="admin-btn admin-btn-primary" disabled={saving}>
                  {saving ? "Saving…" : modal.mode === "add" ? "Add product" : "Save changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

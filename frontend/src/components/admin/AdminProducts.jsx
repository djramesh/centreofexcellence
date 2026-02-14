import React, { useEffect, useState } from "react";
import { adminApi } from "../../api/admin.js";
import "./AdminProducts.css";

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({
    name: "",
    slug: "",
    description: "",
    price: "",
    stock: 0,
    category_id: "",
    thumbnail_url: "",
    thumbnail_file: null,
    is_active: true,
  });
  const [saving, setSaving] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);

  const loadProducts = (page = 1) => {
    setLoading(true);
    adminApi
      .getProducts({ page, limit: 20 })
      .then((res) => {
        setProducts(res.products);
        setPagination(res.pagination);
      })
      .catch((err) => setError(err?.data?.message || err?.message || "Failed to load"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadProducts();
    adminApi.getCategories().then(setCategories).catch(() => setCategories([]));
  }, []);

  const openAdd = () => {
    setModal("add");
    setForm({
      name: "",
      slug: "",
      description: "",
      price: "",
      stock: 0,
      category_id: "",
      thumbnail_url: "",
      thumbnail_file: null,
      is_active: true,
    });
    setImagePreview(null);
    setError("");
  };

  const openEdit = (p) => {
    setModal("edit");
    setForm({
      name: p.name,
      slug: p.slug || "",
      description: p.description || "",
      price: p.price,
      stock: p.stock,
      category_id: p.category_id || "",
      thumbnail_url: p.thumbnail_url || "",
      thumbnail_file: null,
      is_active: !!p.is_active,
    });
    setForm((prev) => ({ ...prev, id: p.id }));
    setImagePreview(p.thumbnail_url || null);
    setError("");
  };

  const closeModal = () => {
    setModal(null);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 1MB = 1048576 bytes)
    const MAX_SIZE = 1048576;
    if (file.size > MAX_SIZE) {
      setError("Image size must be less than 1MB");
      return;
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file");
      return;
    }

    setError("");
    setForm((f) => ({ ...f, thumbnail_file: file }));

    // Create preview
    const reader = new FileReader();
    reader.onload = (evt) => {
      setImagePreview(evt.target?.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    const payload = new FormData();
    payload.append("name", form.name.trim());
    payload.append("description", form.description.trim() || "");
    payload.append("price", parseFloat(form.price) || 0);
    payload.append("stock", parseInt(form.stock, 10) || 0);
    payload.append("category_id", form.category_id ? parseInt(form.category_id, 10) : "");
    payload.append("is_active", form.is_active);

    if (form.slug && form.slug.trim()) {
      payload.append("slug", form.slug.trim());
    }

    if (form.thumbnail_file) {
      payload.append("thumbnail_file", form.thumbnail_file);
    } else if (form.thumbnail_url) {
      payload.append("thumbnail_url", form.thumbnail_url);
    }

    const promise =
      modal === "add"
        ? adminApi.createProduct(payload)
        : adminApi.updateProduct(form.id, payload);

    promise
      .then(() => {
        closeModal();
        loadProducts(pagination.page);
      })
      .catch((err) => setError(err?.data?.message || err?.message || "Failed to save"))
      .finally(() => setSaving(false));
  };

  const handleToggleActive = (p) => {
    adminApi
      .updateProductStatus(p.id, !p.is_active)
      .then(() => loadProducts(pagination.page))
      .catch((err) => setError(err?.data?.message || err?.message || "Failed"));
  };

  const handleStockChange = (p, val) => {
    const v = parseInt(val, 10);
    if (isNaN(v) || v < 0) return;
    adminApi
      .updateProductStock(p.id, v)
      .then(() => loadProducts(pagination.page))
      .catch((err) => setError(err?.data?.message || err?.message || "Failed"));
  };

  const handleDelete = (p) => {
    if (!window.confirm('Delete "' + p.name + '"?')) return;
    adminApi
      .deleteProduct(p.id)
      .then(() => loadProducts(pagination.page))
      .catch((err) => setError(err?.data?.message || err?.message || "Failed"));
  };

  return (
    <div className="admin-page admin-products">
      <header className="admin-page-header admin-products-header">
        <div>
          <h1>Products</h1>
          <p>Add, edit, and manage products</p>
        </div>
        <button type="button" className="admin-btn admin-btn-primary" onClick={openAdd}>
          Add product
        </button>
      </header>

      {error && <div className="admin-error">{error}</div>}
      {loading ? (
        <div className="admin-loading">Loading products…</div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Status</th>
                <th>Category</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id}>
                  <td>{p.id}</td>
                  <td>
                    <div className="admin-product-name">{p.name}</div>
                    {p.slug && <div className="admin-muted">{p.slug}</div>}
                  </td>
                  <td>₹{Number(p.price).toLocaleString("en-IN")}</td>
                  <td>
                    <input
                      type="number"
                      min="0"
                      key={"stock-" + p.id + "-" + p.stock}
                      defaultValue={p.stock}
                      onBlur={(e) => handleStockChange(p, e.target.value)}
                      className="admin-stock-input"
                    />
                  </td>
                  <td>
                    <button
                      type="button"
                      className={
                        "admin-badge admin-badge-toggle " + (p.is_active ? "active" : "inactive")
                      }
                      onClick={() => handleToggleActive(p)}
                    >
                      {p.is_active ? "Active" : "Inactive"}
                    </button>
                  </td>
                  <td>{p.category_name || "—"}</td>
                  <td>
                    <div className="admin-actions-cell">
                      <button
                        type="button"
                        className="admin-link admin-btn-link"
                        onClick={() => openEdit(p)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="admin-link admin-btn-link admin-link-danger"
                        onClick={() => handleDelete(p)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
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
            onClick={() => loadProducts(pagination.page - 1)}
          >
            Previous
          </button>
          <span className="admin-pagination-info">
            Page {pagination.page} of {Math.ceil(pagination.total / pagination.limit)}
          </span>
          <button
            type="button"
            className="admin-btn admin-btn-secondary"
            disabled={pagination.page >= Math.ceil(pagination.total / pagination.limit)}
            onClick={() => loadProducts(pagination.page + 1)}
          >
            Next
          </button>
        </div>
      )}

      {modal && (
        <div className="admin-modal-overlay" onClick={closeModal}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <h2>{modal === "add" ? "Add product" : "Edit product"}</h2>
            {error && <div className="admin-error">{error}</div>}
            <form onSubmit={handleSubmit} className="admin-product-form">
              <label>
                Name *
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  required
                  className="admin-input"
                />
              </label>
              <label>
                Slug (optional)
                <input
                  type="text"
                  value={form.slug}
                  onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                  placeholder="auto from name"
                  className="admin-input"
                />
              </label>
              <label>
                Description
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  rows={3}
                  className="admin-input"
                />
              </label>
              <div className="admin-form-row">
                <label>
                  Price *
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.price}
                    onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                    required
                    className="admin-input"
                  />
                </label>
                <label>
                  Stock
                  <input
                    type="number"
                    min="0"
                    value={form.stock}
                    onChange={(e) => setForm((f) => ({ ...f, stock: e.target.value }))}
                    className="admin-input"
                  />
                </label>
              </div>
              <label>
                Category
                <select
                  value={form.category_id}
                  onChange={(e) => setForm((f) => ({ ...f, category_id: e.target.value }))}
                  className="admin-input"
                >
                  <option value="">None</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Product Image (Max 1MB)
                <div className="admin-image-upload">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="admin-input"
                  />
                  {imagePreview && (
                    <div className="admin-image-preview">
                      <img src={imagePreview} alt="Preview" />
                      <p className="admin-preview-text">
                        {form.thumbnail_file ? form.thumbnail_file.name : "Current image"}
                      </p>
                    </div>
                  )}
                </div>
              </label>
              <label>
                Image URL (if uploading new image, this will be ignored)
                <input
                  type="text"
                  value={form.thumbnail_url}
                  onChange={(e) => setForm((f) => ({ ...f, thumbnail_url: e.target.value }))}
                  placeholder="/assets/..."
                  className="admin-input"
                  disabled={!!form.thumbnail_file}
                />
              </label>
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

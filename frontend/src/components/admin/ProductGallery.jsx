import React, { useCallback, useEffect, useRef, useState } from "react";
import { adminApi } from "../../api/admin.js";
import SmartImage from "../common/SmartImage.jsx";

const MAX_IMAGES = 8;

/**
 * Manage a product's photo gallery.
 *
 * The product_images table has existed since the first schema but nothing ever
 * read or wrote it — every product was limited to a single thumbnail. This is
 * the admin side of that: upload several photos, order them, and pick which one
 * is the card image customers see in the grid.
 */
export default function ProductGallery({ productId, onChanged }) {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const fileInput = useRef(null);

  const load = useCallback(() => {
    setLoading(true);
    adminApi
      .getProductImages(productId)
      .then((res) => setImages(res.images || []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [productId]);

  useEffect(() => {
    load();
  }, [load]);

  const apply = async (action) => {
    setBusy(true);
    setError("");
    try {
      const res = await action();
      setImages(res.images || []);
      onChanged?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const upload = (files) => {
    const list = Array.from(files || []).filter((file) => file.type.startsWith("image/"));
    if (!list.length) return;

    if (images.length + list.length > MAX_IMAGES) {
      setError(`A product can have at most ${MAX_IMAGES} images (it already has ${images.length}).`);
      return;
    }
    apply(() => adminApi.uploadProductImages(productId, list));
  };

  const move = (index, direction) => {
    const target = index + direction;
    if (target < 0 || target >= images.length) return;
    const next = [...images];
    [next[index], next[target]] = [next[target], next[index]];
    // Paint the new order immediately; the server call confirms it.
    setImages(next);
    apply(() => adminApi.reorderProductImages(productId, { order: next.map((img) => img.id) }));
  };

  const setPrimary = (imageId) =>
    apply(() => adminApi.reorderProductImages(productId, { primaryId: imageId }));

  const remove = (image) => {
    if (!window.confirm("Remove this image from the product?")) return;
    apply(() => adminApi.deleteProductImage(productId, image.id));
  };

  return (
    <div className="pg">
      <div className="pg-head">
        <span className="pg-title">Photo gallery</span>
        <span className="pg-count">
          {images.length} / {MAX_IMAGES}
        </span>
      </div>
      <p className="pg-hint">
        Customers can page through every photo here and open any of them full-screen. The
        <strong> main</strong> photo is the one shown on the product card.
      </p>

      {error && <div className="admin-error pg-error">{error}</div>}

      <div
        className={`pg-drop${dragOver ? " pg-drop-over" : ""}${busy ? " pg-drop-busy" : ""}`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          upload(e.dataTransfer.files);
        }}
        onClick={() => !busy && fileInput.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && fileInput.current?.click()}
      >
        <input
          ref={fileInput}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(e) => {
            upload(e.target.files);
            e.target.value = "";
          }}
        />
        <span className="pg-drop-icon" aria-hidden="true">🖼️</span>
        <span className="pg-drop-text">
          {busy ? "Uploading…" : "Drop photos here, or click to choose"}
        </span>
        <span className="pg-drop-sub">JPG, PNG or WebP · up to 5MB each</span>
      </div>

      {loading ? (
        <div className="pg-loading">Loading gallery…</div>
      ) : images.length === 0 ? (
        <p className="pg-empty">No extra photos yet.</p>
      ) : (
        <ul className="pg-grid">
          {images.map((image, index) => (
            <li key={image.id} className={`pg-item${image.isPrimary ? " pg-item-primary" : ""}`}>
              <div className="pg-thumb">
                <SmartImage src={image.url} alt={image.alt || ""} wrapperClassName="pg-thumb-ph" />
                {image.isPrimary && <span className="pg-primary-flag">Main</span>}
              </div>

              <div className="pg-item-actions">
                <button
                  type="button"
                  onClick={() => move(index, -1)}
                  disabled={busy || index === 0}
                  title="Move left"
                  aria-label="Move image earlier"
                >
                  ←
                </button>
                <button
                  type="button"
                  onClick={() => move(index, 1)}
                  disabled={busy || index === images.length - 1}
                  title="Move right"
                  aria-label="Move image later"
                >
                  →
                </button>
                <button
                  type="button"
                  onClick={() => setPrimary(image.id)}
                  disabled={busy || image.isPrimary}
                  title="Use as the main photo"
                  aria-label="Set as main photo"
                >
                  ★
                </button>
                <button
                  type="button"
                  className="pg-danger"
                  onClick={() => remove(image)}
                  disabled={busy}
                  title="Delete image"
                  aria-label="Delete image"
                >
                  ✕
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

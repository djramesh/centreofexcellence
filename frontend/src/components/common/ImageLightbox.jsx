import React, { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import SmartImage from "./SmartImage";
import "./ImageLightbox.css";

const ZOOM_STEP = 0.6;
const MAX_ZOOM = 4;

/**
 * Full-screen image viewer with zoom, pan and gallery navigation.
 *
 * Accessibility matters here because this is the only way a customer can
 * inspect a product closely: it is a real modal dialog with a focus trap,
 * Escape to dismiss, arrow-key navigation and focus restored to whatever
 * opened it.
 *
 * Props:
 *   images     [{ url, alt }]  the gallery to page through
 *   startIndex                 which image to open on
 *   onClose()
 */
export default function ImageLightbox({ images = [], startIndex = 0, onClose }) {
  const [index, setIndex] = useState(startIndex);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  const dialogRef = useRef(null);
  const closeRef = useRef(null);
  const openerRef = useRef(null);
  const drag = useRef(null);
  const touchStart = useRef(null);

  const count = images.length;
  const current = images[index];
  const zoomed = zoom > 1;

  const resetView = useCallback(() => {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  }, []);

  const go = useCallback(
    (delta) => {
      if (count < 2) return;
      resetView();
      setIndex((i) => (i + delta + count) % count);
    },
    [count, resetView]
  );

  const toggleZoom = useCallback(() => {
    setZoom((z) => (z > 1 ? 1 : 1 + ZOOM_STEP));
    setOffset({ x: 0, y: 0 });
  }, []);

  /* Remember what had focus, lock the page behind the dialog, and put focus
     inside it. The scrollbar is compensated so the page does not jump. */
  useEffect(() => {
    openerRef.current = document.activeElement;
    const { body } = document;
    const previousOverflow = body.style.overflow;
    const previousPadding = body.style.paddingRight;
    const scrollbar = window.innerWidth - document.documentElement.clientWidth;

    body.style.overflow = "hidden";
    if (scrollbar > 0) body.style.paddingRight = `${scrollbar}px`;
    closeRef.current?.focus();

    return () => {
      body.style.overflow = previousOverflow;
      body.style.paddingRight = previousPadding;
      if (openerRef.current instanceof HTMLElement) openerRef.current.focus();
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (event) => {
      switch (event.key) {
        case "Escape":
          event.preventDefault();
          onClose();
          break;
        case "ArrowRight":
          event.preventDefault();
          go(1);
          break;
        case "ArrowLeft":
          event.preventDefault();
          go(-1);
          break;
        case "+":
        case "=":
          event.preventDefault();
          setZoom((z) => Math.min(MAX_ZOOM, z + ZOOM_STEP));
          break;
        case "-":
          event.preventDefault();
          setZoom((z) => Math.max(1, z - ZOOM_STEP));
          break;
        case "Tab": {
          // Focus trap: keep Tab cycling inside the dialog.
          const focusable = dialogRef.current?.querySelectorAll(
            'button, [href], [tabindex]:not([tabindex="-1"])'
          );
          if (!focusable?.length) return;
          const first = focusable[0];
          const last = focusable[focusable.length - 1];
          if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
          } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
          }
          break;
        }
        default:
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [go, onClose]);

  // ── Pan while zoomed ──────────────────────────────────────────────────────
  const onPointerDown = (event) => {
    if (!zoomed) return;
    event.currentTarget.setPointerCapture?.(event.pointerId);
    drag.current = { x: event.clientX - offset.x, y: event.clientY - offset.y };
  };

  const onPointerMove = (event) => {
    if (!drag.current) return;
    setOffset({ x: event.clientX - drag.current.x, y: event.clientY - drag.current.y });
  };

  const endDrag = () => {
    drag.current = null;
  };

  const onWheel = (event) => {
    if (!event.ctrlKey && !zoomed) return;
    event.preventDefault();
    setZoom((z) => Math.min(MAX_ZOOM, Math.max(1, z - Math.sign(event.deltaY) * 0.25)));
  };

  // ── Swipe between images on touch ─────────────────────────────────────────
  const onTouchStart = (event) => {
    if (zoomed || event.touches.length !== 1) return;
    touchStart.current = { x: event.touches[0].clientX, y: event.touches[0].clientY };
  };

  const onTouchEnd = (event) => {
    if (!touchStart.current) return;
    const dx = event.changedTouches[0].clientX - touchStart.current.x;
    const dy = event.changedTouches[0].clientY - touchStart.current.y;
    // Horizontal intent only, so a vertical flick does not change image.
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) go(dx < 0 ? 1 : -1);
    touchStart.current = null;
  };

  if (!count) return null;

  return createPortal(
    <div
      className="lb-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label={current?.alt ? `Image: ${current.alt}` : "Image viewer"}
      ref={dialogRef}
      onClick={(event) => {
        // Only the backdrop itself dismisses; clicks on the image do not.
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="lb-toolbar">
        {count > 1 && (
          <span className="lb-counter" aria-live="polite">
            {index + 1} / {count}
          </span>
        )}
        <div className="lb-toolbar-actions">
          <button
            type="button"
            className="lb-icon-btn"
            onClick={() => setZoom((z) => Math.max(1, z - ZOOM_STEP))}
            disabled={zoom <= 1}
            aria-label="Zoom out"
          >
            −
          </button>
          <button
            type="button"
            className="lb-icon-btn"
            onClick={() => setZoom((z) => Math.min(MAX_ZOOM, z + ZOOM_STEP))}
            disabled={zoom >= MAX_ZOOM}
            aria-label="Zoom in"
          >
            +
          </button>
          <button
            type="button"
            className="lb-icon-btn lb-close"
            onClick={onClose}
            ref={closeRef}
            aria-label="Close image viewer"
          >
            ✕
          </button>
        </div>
      </div>

      {count > 1 && (
        <button
          type="button"
          className="lb-nav lb-nav-prev"
          onClick={() => go(-1)}
          aria-label="Previous image"
        >
          ‹
        </button>
      )}

      <figure
        className="lb-stage"
        onWheel={onWheel}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <SmartImage
          src={current?.url}
          alt={current?.alt || ""}
          eager
          className={`lb-img${zoomed ? " lb-img-zoomed" : ""}`}
          wrapperClassName="lb-placeholder"
          style={{
            transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
            cursor: zoomed ? (drag.current ? "grabbing" : "grab") : "zoom-in",
          }}
          onClick={toggleZoom}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          draggable={false}
        />
        {current?.alt && <figcaption className="lb-caption">{current.alt}</figcaption>}
      </figure>

      {count > 1 && (
        <button
          type="button"
          className="lb-nav lb-nav-next"
          onClick={() => go(1)}
          aria-label="Next image"
        >
          ›
        </button>
      )}

      {count > 1 && (
        <div className="lb-thumbs">
          {images.map((image, i) => (
            <button
              key={image.url ?? i}
              type="button"
              className={`lb-thumb${i === index ? " lb-thumb-active" : ""}`}
              onClick={() => {
                resetView();
                setIndex(i);
              }}
              aria-label={`View image ${i + 1}`}
              aria-current={i === index}
            >
              <SmartImage src={image.url} alt="" wrapperClassName="lb-thumb-placeholder" />
            </button>
          ))}
        </div>
      )}
    </div>,
    document.body
  );
}

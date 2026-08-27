import React, { useEffect, useMemo, useRef, useState } from "react";
import { imageSources } from "../../api/client";

/**
 * An <img> that knows where its picture might live.
 *
 * Stored paths are ambiguous (see imageSources): a "/assets/x.jpg" may be
 * served by the SPA or by the API host. Rather than showing a broken image on
 * the first miss, this walks the candidate list and only gives up afterwards.
 * It also fades in on load, so grids do not flash half-drawn images.
 */
export default function SmartImage({
  src,
  alt = "",
  className = "",
  wrapperClassName = "",
  placeholder = "🧺",
  placeholderLabel = "",
  eager = false,
  onClick,
  style,
  ...rest
}) {
  const candidates = useMemo(() => imageSources(src), [src]);
  const [index, setIndex] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const mounted = useRef(true);

  useEffect(() => {
    setIndex(0);
    setLoaded(false);
  }, [src]);

  useEffect(() => () => { mounted.current = false; }, []);

  const exhausted = index >= candidates.length;

  if (!candidates.length || exhausted) {
    return (
      <div className={`si-placeholder ${wrapperClassName}`} aria-label={alt || undefined} style={style}>
        <span className="si-placeholder-icon" aria-hidden="true">{placeholder}</span>
        {placeholderLabel && <span className="si-placeholder-text">{placeholderLabel}</span>}
      </div>
    );
  }

  return (
    <img
      src={candidates[index]}
      alt={alt}
      className={`si-img${loaded ? " si-loaded" : ""} ${className}`}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      onLoad={() => mounted.current && setLoaded(true)}
      onError={() => mounted.current && setIndex((i) => i + 1)}
      onClick={onClick}
      style={style}
      {...rest}
    />
  );
}

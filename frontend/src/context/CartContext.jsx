import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { productsApi } from "../api/products";

const CartContext = createContext(null);
const STORAGE_KEY = "cart";

/**
 * Keep only the fields the cart actually needs. The old cart spread the entire
 * product object into localStorage, so stale descriptions and category data
 * were persisted forever and quietly resurfaced at checkout.
 */
function normalise(product, quantity) {
  return {
    id: product.id,
    name: product.name ?? product.title ?? "Product",
    slug: product.slug ?? null,
    price: Number(product.price) || 0,
    thumbnail_url: product.thumbnail_url ?? product.imgSrc ?? null,
    stock: product.stock ?? null,
    quantity: Math.max(1, Number(quantity) || 1),
  };
}

function readStoredCart() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return [];
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) ? parsed.filter((item) => item?.id != null) : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState(readStoredCart);
  /** Server-side corrections to surface in the UI: price moves, stock drops. */
  const [notices, setNotices] = useState([]);
  const [syncing, setSyncing] = useState(false);
  const hasSynced = useRef(false);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cartItems));
    } catch {
      /* storage full or blocked - the cart still works for this session */
    }
  }, [cartItems]);

  /* Keep the cart honest across tabs: another tab adding an item should not be
     clobbered by this one's stale copy. */
  useEffect(() => {
    const onStorage = (event) => {
      if (event.key === STORAGE_KEY) setCartItems(readStoredCart());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  /**
   * Re-check every line against the server.
   *
   * Prices and stock live in localStorage and can be months old, so without
   * this the customer sees one total and the server charges another. Runs once
   * per session and on demand from the cart page.
   */
  const syncWithServer = useCallback(async () => {
    const current = readStoredCart();
    if (!current.length) return;

    setSyncing(true);
    const changes = [];

    try {
      const results = await Promise.all(
        current.map((item) =>
          productsApi.byId(item.id).catch((err) => ({ __missing: true, id: item.id, err }))
        )
      );

      const next = [];
      results.forEach((product, index) => {
        const item = current[index];

        if (product?.__missing) {
          changes.push({ type: "removed", name: item.name, reason: "no longer available" });
          return;
        }

        const price = Number(product.price) || 0;
        const stock = Number(product.stock) || 0;

        if (stock <= 0) {
          changes.push({ type: "removed", name: product.name, reason: "out of stock" });
          return;
        }

        if (price !== item.price) {
          changes.push({ type: "price", name: product.name, from: item.price, to: price });
        }

        let quantity = item.quantity;
        if (quantity > stock) {
          changes.push({ type: "quantity", name: product.name, from: quantity, to: stock });
          quantity = stock;
        }

        next.push(normalise({ ...product, price, stock }, quantity));
      });

      setCartItems(next);
      setNotices(changes);
    } catch {
      // A network blip should not empty someone's cart - leave it as-is.
    } finally {
      setSyncing(false);
    }
  }, []);

  useEffect(() => {
    if (hasSynced.current) return;
    hasSynced.current = true;
    syncWithServer();
  }, [syncWithServer]);

  const addToCart = useCallback((product, quantity = 1) => {
    setCartItems((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      const stock = product.stock ?? existing?.stock ?? null;
      const requested = (existing?.quantity ?? 0) + quantity;
      // Never let the cart exceed what is actually in stock.
      const capped = stock != null ? Math.min(requested, Math.max(stock, 0)) : requested;

      if (capped <= 0) return prev;

      if (existing) {
        return prev.map((item) =>
          item.id === product.id ? { ...item, ...normalise(product, capped) } : item
        );
      }
      return [...prev, normalise(product, capped)];
    });
  }, []);

  const removeFromCart = useCallback((productId) => {
    setCartItems((prev) => prev.filter((item) => item.id !== productId));
  }, []);

  const updateQuantity = useCallback(
    (productId, quantity) => {
      if (quantity <= 0) return removeFromCart(productId);
      setCartItems((prev) =>
        prev.map((item) =>
          item.id === productId
            ? {
                ...item,
                quantity: item.stock != null ? Math.min(quantity, item.stock) : quantity,
              }
            : item
        )
      );
    },
    [removeFromCart]
  );

  const clearCart = useCallback(() => {
    setCartItems([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }, []);

  const dismissNotices = useCallback(() => setNotices([]), []);

  const cartTotal = useMemo(
    () => cartItems.reduce((sum, item) => sum + (item.price || 0) * item.quantity, 0),
    [cartItems]
  );
  const cartCount = useMemo(
    () => cartItems.reduce((count, item) => count + item.quantity, 0),
    [cartItems]
  );

  const value = {
    cartItems,
    notices,
    syncing,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    syncWithServer,
    dismissNotices,
    cartTotal,
    cartCount,
    getItemQuantity: (id) => cartItems.find((item) => item.id === id)?.quantity ?? 0,
    // Retained so existing callers keep working.
    getCartTotal: () => cartTotal,
    getCartItemCount: () => cartCount,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}

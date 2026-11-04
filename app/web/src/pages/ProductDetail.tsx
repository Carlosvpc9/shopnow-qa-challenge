import { useEffect, useState } from "react";
import { formatMoney } from "../../../shared/money";
import { api, type Product } from "../api";
import { useCart } from "../cart";
import { Link } from "../router";

export function ProductDetail({ id }: { id: number }) {
  const cart = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    api<Product>(`/products/${id}`).then(setProduct).catch(() => setNotFound(true));
  }, [id]);

  if (notFound) return <p className="empty">This product does not exist.</p>;
  if (!product) return <p className="muted">Loading…</p>;

  const options = Array.from({ length: Math.max(0, Math.min(product.stock, 10)) }, (_, i) => i + 1);

  const addToCart = () => {
    const error = cart.add(product, quantity);
    setMessage(error ?? `Added ${quantity} × ${product.name} to your cart.`);
  };

  return (
    <section className="detail">
      <Link to="/" className="back">← Back to products</Link>
      <h1 data-testid="product-name">{product.name}</h1>
      <p className="muted">{product.category}</p>
      <p>{product.description}</p>
      <p className="price" data-testid="product-price">{formatMoney(product.price)}</p>
      <p data-testid="product-stock">Available stock: {product.stock}</p>
      {product.stock > 0 ? (
        <div className="row">
          <label>
            Quantity{" "}
            <select value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} data-testid="quantity-select">
              {options.map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </label>
          <button onClick={addToCart} data-testid="add-to-cart">Add to cart</button>
        </div>
      ) : (
        <p className="error">Out of stock</p>
      )}
      {message && <p className="notice" data-testid="detail-message">{message}</p>}
    </section>
  );
}

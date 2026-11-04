import { useEffect, useState } from "react";
import { formatMoney } from "../../../shared/money";
import { api, type Product } from "../api";
import { mergeItem, useCart } from "../cart";
import { Link } from "../router";

const CATEGORIES = ["Home", "Tech", "Clothing", "Accessories"];

export function Catalog() {
  const cart = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (category) params.set("category", category);
    api<Product[]>(`/products?${params}`).then(setProducts);
  }, [query, category]);

  const addToCart = (product: Product) => {
    cart.setItems((items) => mergeItem(items, product, 1));
    setMessage(`${product.name} was added to your cart.`);
  };

  return (
    <section>
      <h1>Products</h1>
      <div className="filters">
        <input
          type="search"
          placeholder="Search products"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          data-testid="search-input"
        />
        <select value={category} onChange={(e) => setCategory(e.target.value)} data-testid="category-select">
          <option value="">All categories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>
      {message && <p className="notice" data-testid="catalog-message">{message}</p>}
      {products.length === 0 ? (
        <p className="empty" data-testid="catalog-empty">No products match your search.</p>
      ) : (
        <div className="grid">
          {products.map((p) => (
            <article key={p.id} className="card" data-testid={`product-card-${p.id}`}>
              <Link to={`/product/${p.id}`} className="card-title" data-testid={`product-link-${p.id}`}>{p.name}</Link>
              <span className="muted">{p.category}</span>
              <strong data-testid={`product-price-${p.id}`}>{formatMoney(p.price)}</strong>
              <button onClick={() => addToCart(p)} disabled={p.stock <= 0} data-testid={`quick-add-${p.id}`}>
                {p.stock <= 0 ? "Out of stock" : "Add"}
              </button>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

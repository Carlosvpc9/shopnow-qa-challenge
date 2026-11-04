import { createRoot } from "react-dom/client";
import { AuthProvider, useAuth } from "./auth";
import { CartProvider, useCart } from "./cart";
import { Link, RouterProvider, useRouter } from "./router";
import { Catalog } from "./pages/Catalog";
import { ProductDetail } from "./pages/ProductDetail";
import { Cart } from "./pages/Cart";
import { Checkout } from "./pages/Checkout";
import { Login } from "./pages/Login";
import { Orders } from "./pages/Orders";
import { OrderDetail } from "./pages/OrderDetail";
import { Payments } from "./pages/Payments";

function Header() {
  const { user, logout } = useAuth();
  const { count } = useCart();
  const { navigate } = useRouter();

  return (
    <header className="header">
      <Link to="/" className="logo">ShopNow</Link>
      <nav className="nav">
        <Link to="/" data-testid="nav-products">Products</Link>
        {user && <Link to="/orders" data-testid="nav-orders">My orders</Link>}
        {user && <Link to="/payments" data-testid="nav-payments">My payments</Link>}
        <Link to="/cart" data-testid="nav-cart">Cart ({count})</Link>
        {user ? (
          <button
            className="link-button"
            data-testid="logout"
            onClick={async () => {
              await logout();
              navigate("/");
            }}
          >
            Log out ({user.name.split(" ")[0]})
          </button>
        ) : (
          <Link to="/login" data-testid="nav-login">Log in</Link>
        )}
      </nav>
    </header>
  );
}

function Routes() {
  const { path } = useRouter();
  const pathname = path.split("?")[0];
  let match: RegExpMatchArray | null;

  if (pathname === "/") return <Catalog />;
  if ((match = pathname.match(/^\/product\/(\d+)$/))) return <ProductDetail id={Number(match[1])} />;
  if (pathname === "/cart") return <Cart />;
  if (pathname === "/checkout") return <Checkout />;
  if (pathname === "/login") return <Login />;
  if (pathname === "/orders") return <Orders />;
  if ((match = pathname.match(/^\/orders\/(\d+)$/))) return <OrderDetail id={Number(match[1])} />;
  if (pathname === "/payments") return <Payments />;
  return <p className="empty">Page not found.</p>;
}

function App() {
  return (
    <RouterProvider>
      <AuthProvider>
        <CartProvider>
          <Header />
          <main className="main">
            <Routes />
          </main>
        </CartProvider>
      </AuthProvider>
    </RouterProvider>
  );
}

createRoot(document.getElementById("root")!).render(<App />);

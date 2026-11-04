import { useState, type FormEvent } from "react";
import { useAuth } from "../auth";
import { useRouter } from "../router";

export function Login() {
  const { login } = useAuth();
  const { path, navigate } = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const next = new URLSearchParams(path.split("?")[1] ?? "").get("next") ?? "/";

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await login(email, password);
      navigate(next);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <section className="narrow">
      <h1>Log in</h1>
      {next === "/checkout" && <p className="notice" data-testid="login-required">Log in to continue to payment.</p>}
      <form onSubmit={submit} className="form">
        <label>
          Email
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} data-testid="login-email" />
        </label>
        <label>
          Password
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} data-testid="login-password" />
        </label>
        {error && <p className="error" data-testid="login-error">{error}</p>}
        <button className="primary" type="submit" data-testid="login-submit">Log in</button>
      </form>
    </section>
  );
}

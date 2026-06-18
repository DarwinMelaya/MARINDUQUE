import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { ADMIN_TOKEN_KEY } from "../../api/client";
import { loginAdmin } from "../../api/authApi";
import PasswordField from "./PasswordField";

const ADMIN_REMEMBER_KEY = "dost_admin_login_remember_v1";

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(ADMIN_REMEMBER_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw);
      if (saved?.email) setEmail(String(saved.email));
      if (saved?.password) setPassword(String(saved.password));
      if (saved?.email || saved?.password) setRememberMe(true);
    } catch {
      localStorage.removeItem(ADMIN_REMEMBER_KEY);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const data = await loginAdmin({
        email,
        password,
      });
      localStorage.setItem(ADMIN_TOKEN_KEY, data.token);
      if (rememberMe) {
        localStorage.setItem(
          ADMIN_REMEMBER_KEY,
          JSON.stringify({
            email: String(email).trim(),
            password,
          })
        );
      } else {
        localStorage.removeItem(ADMIN_REMEMBER_KEY);
      }
      toast.success("Signed in successfully.");
      navigate("/dashboard");
    } catch (err) {
      const message =
        err.response?.data?.message ?? "Login failed. Please try again.";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950 text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(0,84,166,.35),transparent_55%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-30 [background-image:linear-gradient(to_right,rgba(99,179,237,.2)_1px,transparent_1px),linear-gradient(to_bottom,rgba(99,179,237,.15)_1px,transparent_1px)] [background-size:44px_44px]" />

      <div className="relative mx-auto flex min-h-screen max-w-lg flex-col justify-center px-4 py-12 sm:px-6">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium tracking-wide text-white/80 backdrop-blur">
            <span className="h-2 w-2 rounded-full bg-[#FDB913] shadow-[0_0_18px_rgba(253,185,19,.65)]" />
            Admin access
          </div>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white">
            Log in
          </h1>
          <p className="mt-2 text-sm text-white/60">
            Sign in to your DOST Marinduque admin account.
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 shadow-[0_0_0_1px_rgba(255,255,255,.06)_inset] backdrop-blur-sm sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="mb-1.5 block text-sm font-medium text-white/80"
              >
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none ring-[#0054A6] transition placeholder:text-white/35 focus:border-[#0054A6]/50 focus:ring-2"
                placeholder="admin@example.com"
              />
            </div>
            <PasswordField
              id="password"
              name="password"
              label="Password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <label className="flex select-none items-center gap-2 text-sm text-white/75">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 rounded border-white/20 bg-black/50 text-cyan-400 focus:ring-cyan-400/60"
              />
              Remember me
            </label>

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-xl bg-gradient-to-r from-[#0054A6] to-[#0B3B76] py-3 text-sm font-semibold text-white shadow-lg shadow-[#0054A6]/25 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Signing in…" : "Log in"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-white/55">
            Need an account?{" "}
            <Link
              to="/signup"
              className="font-medium text-cyan-300/90 underline-offset-4 hover:underline"
            >
              Sign up
            </Link>
          </p>
        </div>

        <p className="mt-8 text-center text-xs text-white/40">
          <Link to="/" className="hover:text-white/60">
            ← Back to home
          </Link>
        </p>
      </div>
    </main>
  );
};

export default Login;

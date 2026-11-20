import { useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, Lock, Mail, ShieldCheck } from "lucide-react";
import { loginWithMfa, continueMfa } from "@/lib/authMfa";
import { safeReturnTo } from "@/lib/authReturnTo";
import { inputClass } from "@/admin/ui";

// Administrator sign-in. Accounts are created by invitation only; this
// screen deliberately has no "create account" option.
export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const returnTo = safeReturnTo() || "/";

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const result = await loginWithMfa(email.trim(), password);
      if (result?.mfa_required) {
        await continueMfa(result, returnTo);
        return;
      }
      window.location.href = returnTo;
    } catch (err) {
      setError(err?.message && !/unable to sign in/i.test(err.message) ? err.message : "Incorrect email or password.");
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,#1c4d57,#0f2a30_70%)] p-4">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center text-white">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#0d9488] shadow-lg">
            <ShieldCheck className="h-8 w-8" />
          </span>
          <h1 className="mt-3 font-display text-3xl font-extrabold">KidZonics Admin</h1>
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#8fd6cf]">System Management</p>
        </div>

        <form onSubmit={submit} className="rounded-2xl bg-white p-6 shadow-2xl">
          <h2 className="font-display text-xl font-extrabold text-[#173a44]">Administrator sign in</h2>
          <p className="mb-4 text-sm font-semibold text-[#6c8a90]">For authorized school administrators only.</p>

          <label className="block">
            <span className="mb-1 block text-xs font-extrabold uppercase tracking-wide text-[#5f7f86]">Email</span>
            <span className="relative block">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8aa6ab]" />
              <input
                className={`${inputClass} pl-9`}
                type="email"
                autoComplete="username"
                required
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </span>
          </label>
          <label className="mt-3 block">
            <span className="mb-1 block text-xs font-extrabold uppercase tracking-wide text-[#5f7f86]">Password</span>
            <span className="relative block">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8aa6ab]" />
              <input
                className={`${inputClass} pl-9`}
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </span>
          </label>

          {error && <p className="mt-3 rounded-lg bg-[#fff3f0] px-3 py-2 text-sm font-bold text-[#a34c3f]">{error}</p>}

          <button
            type="submit"
            disabled={busy}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#0d9488] px-4 py-3 text-sm font-extrabold text-white transition hover:bg-[#0b827a] disabled:opacity-60"
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" />} Sign In
          </button>
          <div className="mt-4 text-center">
            <Link to="/forgot-password" className="text-sm font-bold text-[#0d6f74] hover:underline">
              Forgot password?
            </Link>
          </div>
        </form>
        <p className="mt-4 text-center text-xs font-semibold text-[#8fb3b8]">
          Administrator accounts are created by invitation. Two-step verification is supported.
        </p>
      </div>
    </div>
  );
}

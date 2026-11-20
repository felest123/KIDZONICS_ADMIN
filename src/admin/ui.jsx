import { useState } from "react";
import { AlertTriangle, CheckCircle2, CircleOff, Loader2, PauseCircle, Settings2, X } from "lucide-react";
import { cn } from "@/lib/utils";

export function when(iso, withTime = true) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString(undefined, withTime ? { dateStyle: "medium", timeStyle: "short" } : { dateStyle: "medium" });
}

export function ago(iso) {
  if (!iso) return "never";
  const s = Math.round((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return `${Math.max(s, 0)}s ago`;
  if (s < 3600) return `${Math.round(s / 60)} min ago`;
  if (s < 86400) return `${Math.round(s / 3600)} h ago`;
  return `${Math.round(s / 86400)} days ago`;
}

export function PageHeader({ title, subtitle, icon: Icon, actions }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        <h1 className="flex items-center gap-2 font-display text-2xl font-extrabold text-[#173a44] sm:text-3xl">
          {Icon && <Icon className="h-6 w-6 text-[#0d9488]" />} {title}
        </h1>
        {subtitle && <p className="mt-0.5 text-sm font-semibold text-[#5f7f86]">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Card({ title, actions, children, className = "" }) {
  return (
    <section className={cn("rounded-2xl border border-[#dce9e7] bg-white p-4 shadow-[0_1px_2px_rgba(16,54,62,0.06)] sm:p-5", className)}>
      {(title || actions) && (
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          {title && <h2 className="font-display text-lg font-extrabold text-[#173a44]">{title}</h2>}
          {actions}
        </div>
      )}
      {children}
    </section>
  );
}

export function Stat({ label, value, hint, tone = "teal", icon: Icon }) {
  const tones = {
    teal: "bg-[#e3f5f2] text-[#0d6f74]",
    blue: "bg-[#e8f1ff] text-[#1e4b8a]",
    amber: "bg-[#fff4dc] text-[#8a6a12]",
    rose: "bg-[#ffe9e5] text-[#a34c3f]",
    violet: "bg-[#f1ebff] text-[#5b3fa0]",
  };
  return (
    <div className="rounded-2xl border border-[#dce9e7] bg-white p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-extrabold uppercase tracking-wide text-[#6c8a90]">{label}</p>
        {Icon && (
          <span className={cn("flex h-9 w-9 items-center justify-center rounded-xl", tones[tone])}>
            <Icon className="h-5 w-5" />
          </span>
        )}
      </div>
      <p className="mt-1 font-display text-3xl font-extrabold text-[#173a44]">{value ?? "—"}</p>
      {hint && <p className="text-xs font-semibold text-[#7d9ba0]">{hint}</p>}
    </div>
  );
}

// The four connection states. Only shown as reported by the backend.
const STATUS = {
  connected: { label: "Connected", icon: CheckCircle2, className: "bg-[#e3f7ea] text-[#166534]" },
  disconnected: { label: "Disconnected", icon: CircleOff, className: "bg-[#ffe9e5] text-[#a34c3f]" },
  configuration_required: { label: "Configuration Required", icon: Settings2, className: "bg-[#fff4dc] text-[#8a6a12]" },
  temporarily_disabled: { label: "Temporarily Disabled", icon: PauseCircle, className: "bg-[#eef1f3] text-[#4b5d63]" },
};

export function StatusPill({ status }) {
  const s = STATUS[status] || STATUS.configuration_required;
  const Icon = s.icon;
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-extrabold", s.className)}>
      <Icon className="h-3.5 w-3.5" /> {s.label}
    </span>
  );
}

export function Chip({ children, tone = "gray" }) {
  const tones = {
    gray: "bg-[#eef3f3] text-[#4b6a72]",
    green: "bg-[#e3f7ea] text-[#166534]",
    yellow: "bg-[#fff4dc] text-[#8a6a12]",
    blue: "bg-[#e8f1ff] text-[#1e4b8a]",
    red: "bg-[#ffe9e5] text-[#a34c3f]",
    violet: "bg-[#f1ebff] text-[#5b3fa0]",
  };
  return <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-extrabold", tones[tone])}>{children}</span>;
}

export function Loading({ label = "Loading…" }) {
  return (
    <div className="flex items-center justify-center gap-2 py-10 text-sm font-bold text-[#6c8a90]">
      <Loader2 className="h-5 w-5 animate-spin text-[#0d9488]" /> {label}
    </div>
  );
}

export function ErrorBox({ message, onRetry }) {
  if (!message) return null;
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-[#f4c7bf] bg-[#fff3f0] px-4 py-3 text-sm font-bold text-[#a34c3f]">
      <AlertTriangle className="h-4 w-4 shrink-0" /> <span className="min-w-0 flex-1">{message}</span>
      {onRetry && (
        <button onClick={onRetry} className="rounded-full bg-white px-3 py-1 text-xs ring-1 ring-[#f4c7bf]">
          Try again
        </button>
      )}
    </div>
  );
}

export function Empty({ children }) {
  return <p className="rounded-xl bg-[#f6faf9] px-4 py-8 text-center text-sm font-bold text-[#7d9ba0]">{children}</p>;
}

export const inputClass =
  "w-full rounded-xl border border-[#cfe0dd] bg-white px-3 py-2.5 text-sm font-semibold text-[#173a44] outline-none transition focus:border-[#0d9488] focus:ring-2 focus:ring-[#0d9488]/20 disabled:bg-[#f3f6f6]";

export function Field({ label, hint, children, className = "" }) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-1 block text-xs font-extrabold uppercase tracking-wide text-[#5f7f86]">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs font-semibold text-[#8aa6ab]">{hint}</span>}
    </label>
  );
}

export function Button({ variant = "primary", className = "", busy = false, children, ...props }) {
  const variants = {
    primary: "bg-[#0d9488] text-white hover:bg-[#0b827a]",
    secondary: "bg-white text-[#173a44] ring-1 ring-[#cfe0dd] hover:bg-[#f3f8f7]",
    danger: "bg-[#c2410c] text-white hover:bg-[#a8380a]",
    ghost: "text-[#0d6f74] hover:bg-[#e3f5f2]",
  };
  return (
    <button
      {...props}
      disabled={busy || props.disabled}
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-extrabold transition disabled:cursor-not-allowed disabled:opacity-50",
        variants[variant],
        className
      )}
    >
      {busy && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
}

export function Modal({ title, onClose, children, wide = false }) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-[#0f2a30]/50 p-4 sm:items-center" role="dialog" aria-modal="true" aria-label={title}>
      <div className={cn("w-full rounded-2xl bg-white p-5 shadow-2xl", wide ? "max-w-3xl" : "max-w-lg")}>
        <div className="mb-4 flex items-start justify-between gap-2">
          <h2 className="font-display text-xl font-extrabold text-[#173a44]">{title}</h2>
          <button onClick={onClose} aria-label="Close" className="rounded-full p-1.5 text-[#5f7f86] hover:bg-[#eef3f3]">
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

/** Asks before a destructive or important change; optional reason text. */
export function ConfirmButton({ label, title, message, confirmLabel, variant = "danger", withReason = false, onConfirm, buttonVariant = "secondary", icon: Icon }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const go = async () => {
    setBusy(true);
    setError("");
    try {
      await onConfirm(reason);
      setOpen(false);
      setReason("");
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <>
      <Button variant={buttonVariant} onClick={() => setOpen(true)}>
        {Icon && <Icon className="h-4 w-4" />} {label}
      </Button>
      {open && (
        <Modal title={title} onClose={() => setOpen(false)}>
          <p className="text-sm font-semibold text-[#4b6a72]">{message}</p>
          {withReason && (
            <Field label="Reason (saved in the activity log)" className="mt-3">
              <input className={inputClass} value={reason} maxLength={200} onChange={(e) => setReason(e.target.value)} />
            </Field>
          )}
          <ErrorBox message={error} />
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button variant={variant} busy={busy} onClick={go}>
              {confirmLabel}
            </Button>
          </div>
        </Modal>
      )}
    </>
  );
}

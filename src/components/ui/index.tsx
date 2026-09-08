import { clsx } from "clsx";
import Link from "next/link";
import type { ReactNode, ButtonHTMLAttributes, InputHTMLAttributes } from "react";

export function Button({
  variant = "primary",
  size = "md",
  className,
  href,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md";
  href?: string;
}) {
  const cls = clsx(
    "inline-flex items-center justify-center gap-1.5 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none",
    size === "md" ? "px-4 py-2 text-sm" : "px-3 py-1.5 text-xs",
    variant === "primary" && "bg-signal text-white hover:bg-signal-dark",
    variant === "secondary" && "bg-brand text-white hover:bg-brand-dark",
    variant === "ghost" && "bg-transparent text-ink border border-line hover:bg-line-soft",
    variant === "danger" && "bg-danger text-white hover:opacity-90",
    className
  );
  if (href) {
    return (
      <Link href={href} className={cls}>
        {props.children as ReactNode}
      </Link>
    );
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return <button className={cls} {...(props as any)} />;
}

// NOTE: no default background here on purpose. Tailwind utility precedence is determined by
// each rule's position in the generated stylesheet, not by class attribute order — so mixing a
// default "bg-surface" with a caller-supplied "bg-ink" override is a real bug (whichever utility
// happens to be emitted later in the CSS wins, independent of which one appears later in the
// className string). Every call site below passes its own bg-* explicitly instead.
export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={clsx("border border-line rounded-xl", className)}>{children}</div>;
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={clsx(
        "w-full rounded-lg border border-line bg-white px-3 py-2 text-sm outline-none focus:border-brand transition-colors",
        props.className
      )}
    />
  );
}

export function Label({ children, htmlFor }: { children: ReactNode; htmlFor?: string }) {
  return (
    <label htmlFor={htmlFor} className="block text-sm font-medium text-ink mb-1.5">
      {children}
    </label>
  );
}

const statusStyles: Record<string, string> = {
  active: "bg-success-bg text-success",
  paid: "bg-success-bg text-success",
  delivered: "bg-success-bg text-success",
  confirmed: "bg-success-bg text-success",
  picked: "bg-success-bg text-success",
  packed: "bg-success-bg text-success",
  shipped: "bg-success-bg text-success",
  won: "bg-success-bg text-success",
  pending: "bg-warning-bg text-warning",
  picking: "bg-warning-bg text-warning",
  packing: "bg-warning-bg text-warning",
  partially_paid: "bg-warning-bg text-warning",
  new: "bg-warning-bg text-warning",
  contacted: "bg-warning-bg text-warning",
  qualified: "bg-warning-bg text-warning",
  overdue: "bg-danger-bg text-danger",
  cancelled: "bg-danger-bg text-danger",
  suspended: "bg-danger-bg text-danger",
  damaged: "bg-danger-bg text-danger",
  lost: "bg-danger-bg text-danger",
  missing: "bg-danger-bg text-danger",
};

export function StatusPill({ status, label }: { status: string; label?: string }) {
  return <span className={clsx("pill", statusStyles[status] ?? "bg-line-soft text-muted")}>{label ?? status}</span>;
}

export function EmptyState({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6">
      <div className="w-12 h-12 rounded-full bg-line-soft flex items-center justify-center mb-4 text-muted">—</div>
      <p className="font-display font-semibold text-ink mb-1">{title}</p>
      {description && <p className="text-sm text-muted max-w-sm">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function BinPath({ code }: { code?: string | null }) {
  if (!code) return <span className="text-muted text-xs">لم يُحدَّد موقع</span>;
  const segs = code.split("-");
  return (
    <span className="bin-path">
      {segs.map((s, i) => (
        <span key={i} className="flex items-center gap-1.5">
          <span className="seg">{s}</span>
          {i < segs.length - 1 && <span className="sep">/</span>}
        </span>
      ))}
    </span>
  );
}

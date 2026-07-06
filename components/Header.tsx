import Link from "next/link";
import { Logo } from "./Logo";
import { FMCSA_RATES } from "@/lib/constants";

export function Header() {
  return (
    <header className="border-b border-white/5 bg-navy-900/80 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-3">
          <Logo size={42} />
          <div className="leading-tight">
            <div className="font-serif text-lg tracking-wide">
              <span className="text-white">KNOW BEFORE YOU </span>
              <span className="gold-text italic">Go</span>
            </div>
            <div className="text-[11px] font-medium uppercase tracking-[0.24em] text-ink-300">
              Testing · Training · Compliance
            </div>
          </div>
        </Link>
        <nav className="flex items-center gap-2">
          <Link href="/" className="btn-ghost">
            Dashboard
          </Link>
          <Link href="/audit" className="btn-ghost">
            Audit Trail
          </Link>
          <span className="chip border-gold-800/40 text-gold-300">
            FMCSA {FMCSA_RATES.effectiveYear}: {Math.round(FMCSA_RATES.controlledSubstances * 100)}%
            drug / {Math.round(FMCSA_RATES.alcohol * 100)}% alcohol
          </span>
        </nav>
      </div>
    </header>
  );
}

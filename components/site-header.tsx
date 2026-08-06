import Link from "next/link";
import { site } from "@/config/site";
import { stateList } from "@/config/states";
import { Logo } from "./logo";

const navLinks = [
  { href: "/pricing", label: "Pricing" },
  { href: "/suites", label: "Atlanta Suites" },
  { href: "/how-it-works", label: "How It Works" },
  { href: "/faq", label: "FAQ" },
  { href: "/blog", label: "Guides" },
];

export function SiteHeader() {
  return (
    <header
      className="sticky top-0 z-40 border-b backdrop-blur"
      style={{ backgroundColor: "color-mix(in srgb, var(--bg) 92%, transparent)" }}
    >
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg shrink-0">
          <Logo />
          <span>{site.name}</span>
        </Link>

        <nav aria-label="Main" className="hidden lg:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-[var(--bg-subtle)]"
              style={{ color: "var(--text-muted)" }}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link href="/portal" className="btn btn-ghost hidden sm:inline-flex">
            Client login
          </Link>
          <Link href="/intake" className="btn btn-primary">
            Start my application
          </Link>
        </div>
      </div>

      {/* State links get their own row so they are reachable on every page, including on mobile. */}
      <div className="border-t" style={{ backgroundColor: "var(--bg-subtle)" }}>
        <div className="container-page flex h-10 items-center gap-4 overflow-x-auto text-sm">
          <span className="shrink-0 font-medium" style={{ color: "var(--text-muted)" }}>
            State guides:
          </span>
          {stateList.map((state) => (
            <Link
              key={state.code}
              href={`/states/${state.slug}`}
              className="shrink-0 font-medium underline-offset-4 hover:underline"
            >
              {state.name}
            </Link>
          ))}
        </div>
      </div>
    </header>
  );
}

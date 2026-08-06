import Link from "next/link";
import { site } from "@/config/site";
import { stateList } from "@/config/states";
import { LegalDisclaimer } from "./legal-disclaimer";
import { Logo } from "./logo";

const footerColumns = [
  {
    title: "Services",
    links: [
      { href: "/pricing", label: "Pricing" },
      { href: "/suites", label: "Atlanta Suites" },
      { href: "/how-it-works", label: "How It Works" },
      { href: "/intake", label: "Start My Application" },
    ],
  },
  {
    title: "States",
    links: stateList.map((state) => ({
      href: `/states/${state.slug}`,
      label: `${state.name} Dealer License`,
    })),
  },
  {
    title: "Company",
    links: [
      { href: "/faq", label: "FAQ" },
      { href: "/blog", label: "Guides" },
      { href: "/contact", label: "Contact" },
      { href: "/portal", label: "Client Login" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/legal/disclaimer", label: "Legal Disclaimer" },
      { href: "/legal/terms", label: "Terms of Service" },
      { href: "/legal/privacy", label: "Privacy Policy" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t" style={{ backgroundColor: "var(--bg-subtle)" }}>
      <div className="container-page py-12">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2 font-bold text-lg">
              <Logo />
              <span>{site.name}</span>
            </div>
            <p className="mt-3 text-sm" style={{ color: "var(--text-muted)" }}>
              {site.tagline}
            </p>
            <address className="mt-4 text-sm not-italic" style={{ color: "var(--text-muted)" }}>
              {site.address.street}
              <br />
              {site.address.city}, {site.address.region} {site.address.postalCode}
              <br />
              <a href={`tel:${site.contact.phoneHref}`} className="hover:underline">
                {site.contact.phone}
              </a>
              <br />
              <a href={`mailto:${site.contact.email}`} className="hover:underline">
                {site.contact.email}
              </a>
            </address>
          </div>

          {footerColumns.map((column) => (
            <nav key={column.title} aria-label={column.title}>
              <h2 className="text-sm font-semibold">{column.title}</h2>
              <ul className="mt-3 space-y-2">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm hover:underline underline-offset-4"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        {/* LEGAL GUARDRAIL: required on every page. */}
        <div className="mt-10 border-t pt-6">
          <LegalDisclaimer />
          <p className="mt-4 text-[0.8125rem]" style={{ color: "var(--text-muted)" }}>
            © {new Date().getFullYear()} {site.name}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

/**
 * Compact footer for signed-in areas (portal and admin). Carries the same
 * disclaimer, because the requirement is every page — not every marketing page.
 */
export function AppFooter() {
  return (
    <footer className="mt-16 border-t py-6">
      <div className="container-page">
        <LegalDisclaimer variant="short" />
      </div>
    </footer>
  );
}

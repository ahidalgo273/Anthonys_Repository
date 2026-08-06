import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main id="main" className="flex-1">
        <div className="container-prose py-20 text-center">
          <p className="text-sm font-semibold uppercase tracking-wider" style={{ color: "var(--accent)" }}>
            404
          </p>
          <h1 className="mt-2 text-3xl font-bold">We could not find that page.</h1>
          <p className="mt-4" style={{ color: "var(--text-muted)" }}>
            It may have moved. The pages people usually want are below.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/" className="btn btn-primary">
              Home
            </Link>
            <Link href="/pricing" className="btn btn-secondary">
              Pricing
            </Link>
            <Link href="/states" className="btn btn-secondary">
              State guides
            </Link>
            <Link href="/contact" className="btn btn-secondary">
              Contact
            </Link>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

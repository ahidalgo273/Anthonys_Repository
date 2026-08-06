import Link from "next/link";
import {
  addOns,
  effectivePriceCents,
  formatPrice,
  formatUsd,
  packages,
  priceLabel,
  type Product,
} from "@/config/pricing";

export function PackageCards({ showCta = true }: { showCta?: boolean }) {
  return (
    <div className="grid gap-6 md:grid-cols-3">
      {packages.map((product) => (
        <PackageCard key={product.id} product={product} showCta={showCta} />
      ))}
    </div>
  );
}

function PackageCard({ product, showCta }: { product: Product; showCta: boolean }) {
  const onLaunchPrice =
    product.launchPriceCents !== undefined && product.launchPriceCents < product.priceCents;

  return (
    <div
      className="card flex flex-col"
      style={product.featured ? { borderColor: "var(--accent)", borderWidth: 2 } : undefined}
    >
      {product.featured && (
        <span className="badge badge-warning mb-3 self-start">Most popular</span>
      )}
      <h3 className="text-lg font-bold">{product.name}</h3>
      <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>
        {product.summary}
      </p>

      <div className="mt-5">
        <div className="flex flex-wrap items-baseline gap-2">
          <span className="text-3xl font-bold">
            {formatUsd(effectivePriceCents(product))}
          </span>
          <span className="text-sm" style={{ color: "var(--text-muted)" }}>
            {product.period === "monthly"
              ? "/month"
              : product.period === "yearly"
                ? "/year"
                : "one-time"}
          </span>
          {onLaunchPrice && (
            <span
              className="text-sm line-through"
              style={{ color: "var(--text-muted)" }}
              aria-label={`Regular price ${formatUsd(product.priceCents)}`}
            >
              {formatUsd(product.priceCents)}
            </span>
          )}
        </div>
        {product.setupFeeCents !== undefined && (
          <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
            plus {formatUsd(product.setupFeeCents)} one-time setup
          </p>
        )}
        {onLaunchPrice && (
          <p className="mt-1 text-sm font-medium" style={{ color: "var(--accent)" }}>
            Launch price — regularly {formatUsd(product.priceCents)}
          </p>
        )}
      </div>

      <ul className="mt-5 flex-1 space-y-2 text-sm">
        {product.includes.map((item) => (
          <li key={item} className="flex gap-2">
            <CheckIcon />
            <span style={{ color: "var(--text-muted)" }}>{item}</span>
          </li>
        ))}
      </ul>

      {showCta && (
        <Link
          href={`/intake?package=${product.id}`}
          className={`btn mt-6 ${product.featured ? "btn-primary" : "btn-secondary"}`}
        >
          Get started
        </Link>
      )}
    </div>
  );
}

export function AddOnTable() {
  return (
    <div className="table-wrap">
      <table className="table">
        <caption>Add-ons — buy any of these with your package or later</caption>
        <thead>
          <tr>
            <th scope="col">Add-on</th>
            <th scope="col">What it is</th>
            <th scope="col">Price</th>
          </tr>
        </thead>
        <tbody>
          {addOns.map((product) => (
            <tr key={product.id}>
              <th scope="row" className="font-semibold">
                {product.name}
              </th>
              <td style={{ color: "var(--text-muted)" }}>{product.summary}</td>
              <td className="font-semibold whitespace-nowrap">
                {formatPrice(effectivePriceCents(product), product.period)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Compact price list used on the home page. */
export function PriceSummaryTable() {
  return (
    <div className="table-wrap">
      <table className="table">
        <caption>Everything we charge, in one place</caption>
        <thead>
          <tr>
            <th scope="col">Service</th>
            <th scope="col">Price</th>
          </tr>
        </thead>
        <tbody>
          {[...packages, ...addOns].map((product) => (
            <tr key={product.id}>
              <th scope="row" className="font-medium">
                {product.name}
              </th>
              <td className="font-semibold whitespace-nowrap">{priceLabel(product)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CheckIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      className="mt-1 shrink-0"
    >
      <path
        d="M3 8.5l3.5 3.5L13 5"
        stroke="var(--success)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

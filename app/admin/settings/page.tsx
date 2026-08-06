import { getProduct, priceLabel, products } from "@/config/pricing";
import { site } from "@/config/site";
import { stateList } from "@/config/states";
import { activeEmailDriver } from "@/lib/email";
import { activeStorageDriver } from "@/lib/storage";
import { checkoutReadiness } from "@/lib/stripe/client";

export const metadata = { title: "Settings" };

/**
 * A read-only view of how this installation is configured.
 *
 * The point is that a missing Stripe price ID or an unset CRON_SECRET is
 * visible here rather than discovered by a customer at checkout.
 */
export default async function AdminSettingsPage() {
  const readiness = checkoutReadiness();
  const emailDriver = activeEmailDriver();
  const storageDriver = activeStorageDriver();
  const hasAnthropicKey = Boolean(process.env.ANTHROPIC_API_KEY);
  const hasCronSecret = Boolean(process.env.CRON_SECRET);
  const hasWebhookSecret = Boolean(process.env.STRIPE_WEBHOOK_SECRET);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="mt-1" style={{ color: "var(--text-muted)" }}>
          How this installation is configured right now. Everything here is set with environment
          variables — see <code>.env.example</code> and the README.
        </p>
      </div>

      {/* ── Services ──────────────────────────────────────────────────────── */}
      <section className="card">
        <h2 className="text-lg font-bold">Connected services</h2>
        <dl className="mt-4 space-y-4">
          <ServiceRow
            label="Payments (Stripe)"
            ok={readiness.stripeConfigured}
            okText="Connected"
            offText="Not configured — checkout runs in demo mode and no money moves"
            detail={
              readiness.stripeConfigured
                ? hasWebhookSecret
                  ? "Webhook secret is set."
                  : "⚠ STRIPE_WEBHOOK_SECRET is not set. Payments will succeed but accounts will not be provisioned automatically."
                : "Set STRIPE_SECRET_KEY to enable real payments."
            }
          />
          <ServiceRow
            label="Email"
            ok={emailDriver !== "console"}
            okText={`Sending through ${emailDriver}`}
            offText="Console driver — emails print to the server log and are NOT delivered"
            detail={
              emailDriver === "console"
                ? "Set EMAIL_DRIVER=resend and RESEND_API_KEY to send real email. Clients will not receive sign-in links until you do."
                : "Make sure EMAIL_FROM uses a domain verified with your provider."
            }
          />
          <ServiceRow
            label="File storage"
            ok={storageDriver !== "local"}
            okText={`Using ${storageDriver}`}
            offText="Local disk"
            detail={
              storageDriver === "local"
                ? "Fine on your own server. NOT suitable for Vercel — its filesystem is wiped on every deploy, so uploaded documents would disappear."
                : undefined
            }
          />
          <ServiceRow
            label="AI assistant (Anthropic)"
            ok={hasAnthropicKey}
            okText="Connected"
            offText="No API key — the assistant falls back to static FAQ search"
            detail={
              hasAnthropicKey
                ? undefined
                : "This is a supported configuration. Every AI feature has a non-AI path, so nothing is broken without a key."
            }
          />
          <ServiceRow
            label="Scheduled reminders"
            ok={hasCronSecret}
            okText="CRON_SECRET is set"
            offText="CRON_SECRET is not set"
            detail={
              hasCronSecret
                ? "The daily job at /api/cron/reminders will accept requests carrying this secret."
                : "⚠ In production the reminder job refuses to run without this. Set it to any long random string and give the same value to your scheduler."
            }
          />
        </dl>
      </section>

      {/* ── Products ──────────────────────────────────────────────────────── */}
      <section className="card">
        <h2 className="text-lg font-bold">Products and Stripe price IDs</h2>
        <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
          A product without a price ID still displays its price on the website, but checkout for it
          falls back to the demo path.
        </p>
        <div className="mt-4 table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th scope="col">Product</th>
                <th scope="col">Published price</th>
                <th scope="col">Price ID variable</th>
                <th scope="col">Status</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => {
                const ready = readiness.ready.includes(product.id);
                return (
                  <tr key={product.id}>
                    <th scope="row" className="font-medium">
                      {product.name}
                    </th>
                    <td className="whitespace-nowrap font-semibold">{priceLabel(product)}</td>
                    <td>
                      <code className="text-sm">{product.stripePriceEnv}</code>
                      {product.stripeSetupPriceEnv && (
                        <code className="block text-sm">{product.stripeSetupPriceEnv}</code>
                      )}
                    </td>
                    <td>
                      <span className={`badge ${ready ? "badge-success" : "badge-warning"}`}>
                        {ready ? "Ready" : "Price ID missing"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── Content ───────────────────────────────────────────────────────── */}
      <section className="card">
        <h2 className="text-lg font-bold">Content and rules</h2>
        <dl className="mt-4 space-y-3 text-sm">
          <Row label="Business name" value={site.name} />
          <Row
            label="Public URL"
            value={site.url}
            warn={site.url.includes("example")}
          />
          <Row
            label="Contact email"
            value={site.contact.email}
            warn={site.contact.email.includes("example")}
          />
          <Row
            label="Address"
            value={`${site.address.street}, ${site.address.city}, ${site.address.region}`}
            warn={site.address.street.includes("Example")}
          />
          <Row label="States served" value={stateList.map((s) => s.name).join(", ")} />
          <Row
            label="Launch price active"
            value={
              getProduct("license_filing")?.launchPriceCents
                ? "Yes — License Filing Package"
                : "No"
            }
          />
        </dl>

        <div className="callout callout-warning mt-5">
          <p>
            <strong>Values marked below need replacing before launch.</strong> They live in{" "}
            <code>config/site.ts</code>. State facts marked{" "}
            <code>{"// CONTENT: verify"}</code> in <code>config/states/</code> must also be checked
            against current state rules, and an attorney should review all site copy.
          </p>
        </div>
      </section>
    </div>
  );
}

function ServiceRow({
  label,
  ok,
  okText,
  offText,
  detail,
}: {
  label: string;
  ok: boolean;
  okText: string;
  offText: string;
  detail?: string;
}) {
  return (
    <div className="border-t pt-4 first:border-t-0 first:pt-0">
      <div className="flex flex-wrap items-center gap-2">
        <dt className="font-semibold">{label}</dt>
        <span className={`badge ${ok ? "badge-success" : "badge-warning"}`}>
          {ok ? okText : offText}
        </span>
      </div>
      {detail && (
        <dd className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
          {detail}
        </dd>
      )}
    </div>
  );
}

function Row({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div className="flex flex-wrap justify-between gap-2">
      <dt style={{ color: "var(--text-muted)" }}>{label}</dt>
      <dd className="text-right font-medium">
        {value}
        {warn && <span className="badge badge-warning ml-2">Placeholder</span>}
      </dd>
    </div>
  );
}

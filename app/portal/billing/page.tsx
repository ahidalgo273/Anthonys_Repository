import { getProduct, formatPrice, formatUsd } from "@/config/pricing";
import { site } from "@/config/site";
import { requireUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { isStripeConfigured } from "@/lib/stripe/client";

export const metadata = { title: "Billing" };

export default async function BillingPage() {
  const user = await requireUser("/portal/billing");

  const [subscriptions, orders] = await Promise.all([
    db.subscription.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" } }),
    db.order.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 25 }),
  ]);

  const canOpenPortal = isStripeConfigured() && Boolean(user.stripeCustomerId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Billing</h1>
        <p className="mt-1" style={{ color: "var(--text-muted)" }}>
          Your subscriptions and payment history. Cancel any time — we do not hold deposits.
        </p>
      </div>

      <div className="card">
        <h2 className="text-lg font-bold">Subscriptions</h2>

        {subscriptions.length === 0 ? (
          <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>
            You have no active subscription.
          </p>
        ) : (
          <ul className="mt-4 space-y-4">
            {subscriptions.map((subscription) => {
              const product = getProduct(subscription.productId);
              const active = ["active", "trialing"].includes(subscription.status);
              return (
                <li key={subscription.id} className="border-t pt-4 first:border-t-0 first:pt-0">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="font-semibold">
                      {product?.name ?? subscription.productId}
                    </span>
                    <span className={`badge ${active ? "badge-success" : "badge-warning"}`}>
                      {subscription.status.replace(/_/g, " ")}
                    </span>
                  </div>
                  <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
                    {formatUsd(subscription.amountCents)}/month
                    {subscription.currentPeriodEnd && (
                      <>
                        {" · "}
                        {subscription.cancelAtPeriodEnd ? "Ends" : "Renews"}{" "}
                        {subscription.currentPeriodEnd.toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </>
                    )}
                  </p>
                </li>
              );
            })}
          </ul>
        )}

        {canOpenPortal ? (
          <form action="/api/stripe/portal" method="post" className="mt-5">
            <button type="submit" className="btn btn-primary">
              Manage billing and payment method
            </button>
            <p className="hint mt-2">
              Opens Stripe&apos;s billing portal, where you can update your card, download invoices,
              or cancel.
            </p>
          </form>
        ) : (
          <p className="mt-5 text-sm" style={{ color: "var(--text-muted)" }}>
            {isStripeConfigured()
              ? "Your billing portal becomes available after your first payment."
              : "Stripe is not configured on this installation, so there is no billing portal to open."}{" "}
            Email{" "}
            <a href={`mailto:${site.contact.email}`} className="underline underline-offset-4">
              {site.contact.email}
            </a>{" "}
            with any billing question.
          </p>
        )}
      </div>

      <div className="card">
        <h2 className="text-lg font-bold">Payment history</h2>

        {orders.length === 0 ? (
          <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>
            No payments recorded yet.
          </p>
        ) : (
          <div className="mt-4 table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th scope="col">Date</th>
                  <th scope="col">Item</th>
                  <th scope="col">Amount</th>
                  <th scope="col">Status</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => {
                  const product = getProduct(order.productId);
                  return (
                    <tr key={order.id}>
                      <td className="whitespace-nowrap">
                        {order.createdAt.toLocaleDateString("en-US")}
                      </td>
                      <th scope="row" className="font-medium">
                        {product?.name ?? order.productId}
                      </th>
                      <td className="whitespace-nowrap font-semibold">
                        {product
                          ? formatPrice(order.amountCents, product.period)
                          : formatUsd(order.amountCents)}
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            order.status === "paid"
                              ? "badge-success"
                              : order.isDemo
                                ? "badge-warning"
                                : "badge-neutral"
                          }`}
                        >
                          {order.isDemo ? "Demo — not charged" : order.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

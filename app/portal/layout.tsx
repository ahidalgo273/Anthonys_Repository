import type { Metadata } from "next";
import { AppNav } from "@/components/app-nav";
import { AppFooter } from "@/components/site-footer";
import { requireUser } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: { default: "Client Portal", template: "%s | DealerDesk Portal" },
  robots: { index: false, follow: false },
};

const links = [
  { href: "/portal", label: "Dashboard" },
  { href: "/portal/application", label: "Application details" },
  { href: "/portal/documents", label: "Documents" },
  { href: "/portal/packet", label: "Packet" },
  { href: "/portal/compliance", label: "Compliance" },
  { href: "/portal/billing", label: "Billing" },
];

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser("/portal");

  return (
    <div className="flex min-h-screen flex-col">
      <AppNav links={links} userEmail={user.email} showAdminLink={user.role === "ADMIN"} />
      <main id="main" className="flex-1">
        <div className="container-page py-8">{children}</div>
      </main>
      <AppFooter />
    </div>
  );
}

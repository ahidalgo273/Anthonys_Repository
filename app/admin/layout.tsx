import type { Metadata } from "next";
import { AppNav } from "@/components/app-nav";
import { AppFooter } from "@/components/site-footer";
import { requireAdmin } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s | DealerDesk Admin" },
  robots: { index: false, follow: false },
};

const links = [
  { href: "/admin", label: "Pipeline" },
  { href: "/admin/clients", label: "Clients" },
  { href: "/admin/metrics", label: "Metrics" },
  { href: "/admin/suites", label: "Suites" },
  { href: "/admin/deadlines", label: "Deadlines" },
  { href: "/admin/settings", label: "Settings" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdmin();

  return (
    <div className="flex min-h-screen flex-col">
      <AppNav links={links} userEmail={user.email} isAdminArea showAdminLink />
      <main id="main" className="flex-1">
        <div className="container-page py-8">{children}</div>
      </main>
      <AppFooter />
    </div>
  );
}

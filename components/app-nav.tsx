import Link from "next/link";
import { signOut } from "@/lib/auth/actions";
import { site } from "@/config/site";
import { Logo } from "./logo";

/** Header for signed-in areas (portal and admin). */
export function AppNav({
  links,
  userEmail,
  isAdminArea = false,
  showAdminLink = false,
}: {
  links: { href: string; label: string }[];
  userEmail: string;
  isAdminArea?: boolean;
  showAdminLink?: boolean;
}) {
  return (
    <header className="border-b" style={{ backgroundColor: "var(--bg-subtle)" }}>
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Link href={isAdminArea ? "/admin" : "/portal"} className="flex items-center gap-2 font-bold shrink-0">
          <Logo size={24} />
          <span>{site.name}</span>
          {isAdminArea && <span className="badge badge-warning">Admin</span>}
        </Link>

        <div className="flex items-center gap-3">
          <span className="hidden sm:inline text-sm" style={{ color: "var(--text-muted)" }}>
            {userEmail}
          </span>
          {showAdminLink && (
            <Link href={isAdminArea ? "/portal" : "/admin"} className="btn btn-ghost">
              {isAdminArea ? "Client view" : "Admin"}
            </Link>
          )}
          <form action={signOut}>
            <button type="submit" className="btn btn-ghost">
              Sign out
            </button>
          </form>
        </div>
      </div>

      <div className="border-t">
        <nav aria-label="Sections" className="container-page flex gap-1 overflow-x-auto">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="shrink-0 px-3 py-2.5 text-sm font-medium hover:bg-[var(--bg-raised)]"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}

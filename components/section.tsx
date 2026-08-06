export function Section({
  children,
  subtle = false,
  id,
}: {
  children: React.ReactNode;
  subtle?: boolean;
  id?: string;
}) {
  return (
    <section
      id={id}
      className="py-16 sm:py-20"
      style={subtle ? { backgroundColor: "var(--bg-subtle)" } : undefined}
    >
      <div className="container-page">{children}</div>
    </section>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  centered = false,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  centered?: boolean;
}) {
  return (
    <div className={`max-w-3xl ${centered ? "mx-auto text-center" : ""}`}>
      {eyebrow && (
        <p
          className="text-sm font-semibold uppercase tracking-wider"
          style={{ color: "var(--accent)" }}
        >
          {eyebrow}
        </p>
      )}
      <h2 className="mt-2 text-2xl sm:text-3xl font-bold">{title}</h2>
      {description && (
        <p className="mt-3 text-base leading-relaxed" style={{ color: "var(--text-muted)" }}>
          {description}
        </p>
      )}
    </div>
  );
}

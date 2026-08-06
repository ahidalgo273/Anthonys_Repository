import type { Metadata } from "next";
import Link from "next/link";
import { Section, SectionHeading } from "@/components/section";
import { formatPostDate, getAllPosts } from "@/lib/blog";

export const metadata: Metadata = {
  title: "Guides",
  description:
    "Plain-English guides to used-car dealer licensing in Georgia, Florida, and North Carolina — requirements, costs, office rules, and the mistakes that cost people months.",
  alternates: { canonical: "/blog" },
};

export default function BlogIndexPage() {
  const posts = getAllPosts();

  return (
    <Section>
      <SectionHeading
        eyebrow="Guides"
        title="Dealer licensing, explained without the sales pitch."
        description="Written for people who want to know what is actually required before they spend money."
      />

      {posts.length === 0 ? (
        <div className="callout callout-info mt-10">
          <p>
            No guides published yet. Add an <code>.mdx</code> file to{" "}
            <code>content/blog/</code> and it will appear here.
          </p>
        </div>
      ) : (
        <div className="mt-10 space-y-4">
          {posts.map((post) => (
            <article key={post.slug} className="card">
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <time dateTime={post.date} style={{ color: "var(--text-muted)" }}>
                  {formatPostDate(post.date)}
                </time>
                <span style={{ color: "var(--text-muted)" }}>·</span>
                <span style={{ color: "var(--text-muted)" }}>
                  {post.readingMinutes} min read
                </span>
                {post.tags.map((tag) => (
                  <span key={tag} className="badge badge-neutral">
                    {tag}
                  </span>
                ))}
              </div>
              <h2 className="mt-2 text-xl font-bold">
                <Link href={`/blog/${post.slug}`} className="hover:underline underline-offset-4">
                  {post.title}
                </Link>
              </h2>
              {post.description && (
                <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
                  {post.description}
                </p>
              )}
              <Link
                href={`/blog/${post.slug}`}
                className="mt-3 inline-block text-sm font-semibold underline underline-offset-4"
                style={{ color: "var(--info)" }}
              >
                Read the guide
              </Link>
            </article>
          ))}
        </div>
      )}
    </Section>
  );
}

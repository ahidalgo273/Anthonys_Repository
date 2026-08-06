import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import { BreadcrumbJsonLd } from "@/components/structured-data";
import { site } from "@/config/site";
import { formatPostDate, getAllPosts, getPost } from "@/lib/blog";

export function generateStaticParams() {
  return getAllPosts().map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return {};

  return {
    title: post.title,
    description: post.description,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      type: "article",
      title: `${post.title} | ${site.name}`,
      description: post.description,
      publishedTime: post.date,
    },
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  return (
    <article className="py-14 sm:py-20">
      <BreadcrumbJsonLd
        items={[
          { name: "Home", path: "/" },
          { name: "Guides", path: "/blog" },
          { name: post.title, path: `/blog/${post.slug}` },
        ]}
      />

      <div className="container-prose">
        <Link
          href="/blog"
          className="text-sm font-medium underline underline-offset-4"
          style={{ color: "var(--text-muted)" }}
        >
          ← All guides
        </Link>

        <h1 className="mt-4 text-3xl sm:text-4xl font-bold">{post.title}</h1>

        <div className="mt-3 flex flex-wrap items-center gap-3 text-sm" style={{ color: "var(--text-muted)" }}>
          <time dateTime={post.date}>{formatPostDate(post.date)}</time>
          <span>·</span>
          <span>{post.readingMinutes} min read</span>
          {post.author && (
            <>
              <span>·</span>
              <span>{post.author}</span>
            </>
          )}
        </div>

        {post.description && (
          <p className="mt-5 text-lg leading-relaxed" style={{ color: "var(--text-muted)" }}>
            {post.description}
          </p>
        )}

        <div className="prose-page mt-10">
          <MDXRemote source={post.content} />
        </div>

        <div className="callout callout-info mt-12">
          <p>
            <strong>This is general information, not legal advice.</strong> {site.disclaimerShort}{" "}
            Requirements change — verify current rules with the state before you rely on anything
            here.
          </p>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/intake" className="btn btn-primary">
            Start my application
          </Link>
          <Link href="/pricing" className="btn btn-secondary">
            See pricing
          </Link>
        </div>
      </div>
    </article>
  );
}

import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

/**
 * The blog reads .mdx files straight off disk.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * NON-DEVELOPER NOTE
 * To publish a guide: create a file in `content/blog/` named after the URL you
 * want, e.g. `georgia-dealer-license-checklist.mdx`, and start it with:
 *
 *   ---
 *   title: "Georgia Dealer License Checklist"
 *   description: "Everything you need before you file."
 *   date: "2026-08-01"
 *   ---
 *
 * Then write normally underneath. It appears on /blog automatically. A file
 * with `draft: true` in that header is hidden from the site.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export type BlogPost = {
  slug: string;
  title: string;
  description: string;
  /** ISO date string, e.g. "2026-08-01". */
  date: string;
  author?: string;
  tags: string[];
  draft: boolean;
  content: string;
  readingMinutes: number;
};

const BLOG_DIR = path.join(process.cwd(), "content", "blog");

function readPostFile(filename: string): BlogPost | null {
  const slug = filename.replace(/\.mdx?$/, "");
  const raw = fs.readFileSync(path.join(BLOG_DIR, filename), "utf8");
  const { data, content } = matter(raw);

  if (typeof data.title !== "string" || typeof data.date !== "string") {
    // A post missing its title or date is a mistake, not a page. Skip it rather
    // than publishing something broken, and say so in the build output.
    console.warn(`[blog] Skipping ${filename}: front matter needs both "title" and "date".`);
    return null;
  }

  const words = content.trim().split(/\s+/).length;

  return {
    slug,
    title: data.title,
    description: typeof data.description === "string" ? data.description : "",
    date: data.date,
    author: typeof data.author === "string" ? data.author : undefined,
    tags: Array.isArray(data.tags) ? data.tags.filter((t): t is string => typeof t === "string") : [],
    draft: data.draft === true,
    content,
    readingMinutes: Math.max(1, Math.round(words / 220)),
  };
}

/** Published posts, newest first. Drafts are excluded. */
export function getAllPosts(): BlogPost[] {
  if (!fs.existsSync(BLOG_DIR)) return [];

  return fs
    .readdirSync(BLOG_DIR)
    .filter((file) => /\.mdx?$/.test(file))
    .map(readPostFile)
    .filter((post): post is BlogPost => post !== null && !post.draft)
    .sort((a, b) => b.date.localeCompare(a.date));
}

export function getPost(slug: string): BlogPost | undefined {
  return getAllPosts().find((post) => post.slug === slug);
}

/** "August 1, 2026" — dates in front matter are plain calendar dates, so parse as UTC. */
export function formatPostDate(isoDate: string): string {
  const date = new Date(`${isoDate}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return isoDate;
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

import type { Metadata } from "next";
import Link from "next/link";
import { FaqList } from "@/components/faq-list";
import { Section, SectionHeading } from "@/components/section";
import { BreadcrumbJsonLd, FaqJsonLd } from "@/components/structured-data";
import { faqCategories, faqs } from "@/content/faq";

export const metadata: Metadata = {
  title: "FAQ",
  description:
    "Answers about dealer license pricing, timelines, office requirements, surety bonds, Atlanta suites, and why we refer legal questions to attorneys instead of answering them.",
  alternates: { canonical: "/faq" },
};

export default function FaqPage() {
  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Home", path: "/" },
          { name: "FAQ", path: "/faq" },
        ]}
      />
      <FaqJsonLd items={faqs.map((f) => ({ question: f.question, answer: f.answer }))} />

      <Section>
        <SectionHeading
          eyebrow="FAQ"
          title="Questions people actually ask."
          description="If your question is not here, email us. If it is a legal question, we will refer you to an attorney rather than guess — that is not us dodging, it is us not wanting to cost you money."
        />

        {/* In-page navigation, useful on mobile and for keyboard users. */}
        <nav aria-label="FAQ categories" className="mt-8 flex flex-wrap gap-2">
          {faqCategories.map((category) => (
            <a key={category.id} href={`#${category.id}`} className="btn btn-secondary">
              {category.label}
            </a>
          ))}
        </nav>

        <div className="mt-12 space-y-12">
          {faqCategories.map((category) => {
            const items = faqs.filter((f) => f.category === category.id);
            if (items.length === 0) return null;

            return (
              <div key={category.id} id={category.id} className="scroll-mt-32">
                <h2 className="mb-4 text-xl font-bold">{category.label}</h2>
                <FaqList items={items} />
              </div>
            );
          })}
        </div>
      </Section>

      <Section subtle>
        <div className="card">
          <h2 className="text-xl font-bold">Still have a question?</h2>
          <p className="mt-2" style={{ color: "var(--text-muted)" }}>
            Ask us directly. We answer process, pricing, and document questions. Legal questions go
            to an attorney — tell us and we will arrange the referral.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/contact" className="btn btn-primary">
              Contact us
            </Link>
            <Link href="/intake" className="btn btn-secondary">
              Start my application
            </Link>
          </div>
        </div>
      </Section>
    </>
  );
}

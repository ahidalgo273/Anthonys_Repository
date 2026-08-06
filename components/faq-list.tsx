import type { FaqItem } from "@/content/faq";

/**
 * Accessible accordion built on <details>/<summary> — keyboard operable and
 * screen-reader friendly with no JavaScript.
 */
export function FaqList({ items }: { items: FaqItem[] }) {
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <details key={item.question} className="card-flush group">
          <summary className="flex cursor-pointer items-start justify-between gap-4 p-5 font-semibold marker:content-none [&::-webkit-details-marker]:hidden">
            <span>{item.question}</span>
            <ChevronIcon />
          </summary>
          <div className="px-5 pb-5 text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
            {item.answer}
          </div>
        </details>
      ))}
    </div>
  );
}

function ChevronIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      className="mt-1 shrink-0 transition-transform group-open:rotate-180"
    >
      <path
        d="M4 6l4 4 4-4"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

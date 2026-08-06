import { absoluteUrl, site } from "@/config/site";
import { stateList } from "@/config/states";

/**
 * JSON-LD structured data.
 *
 * NOTE: this publishes the address in config/site.ts to search engines. Those
 * values are placeholders until you replace them — see the launch punch list.
 */
export function LocalBusinessJsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    "@id": absoluteUrl("/#business"),
    name: site.name,
    description: site.description,
    url: absoluteUrl("/"),
    telephone: site.contact.phone,
    email: site.contact.email,
    priceRange: "$$",
    address: {
      "@type": "PostalAddress",
      streetAddress: site.address.street,
      addressLocality: site.address.city,
      addressRegion: site.address.region,
      postalCode: site.address.postalCode,
      addressCountry: site.address.country,
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: site.address.latitude,
      longitude: site.address.longitude,
    },
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        opens: site.hours.opens,
        closes: site.hours.closes,
      },
    ],
    areaServed: stateList.map((state) => ({
      "@type": "State",
      name: state.name,
    })),
    knowsAbout: stateList.map((state) => `${state.name} ${state.licenseType}`),
  };

  return <JsonLd data={data} />;
}

export function FaqJsonLd({ items }: { items: { question: string; answer: string }[] }) {
  const data = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };
  return <JsonLd data={data} />;
}

export function BreadcrumbJsonLd({ items }: { items: { name: string; path: string }[] }) {
  const data = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
  return <JsonLd data={data} />;
}

function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      // JSON.stringify output is escaped for the one character that can break
      // out of a <script> block.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}

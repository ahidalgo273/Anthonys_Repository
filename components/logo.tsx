/**
 * DealerDesk mark: a desk/document silhouette. Deliberately simple so it reads
 * at 24px and needs no image asset.
 */
export function Logo({ size = 26 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <rect x="1" y="1" width="30" height="30" rx="7" fill="var(--brand)" />
      <path
        d="M9 9.5h9.5a4.5 4.5 0 0 1 0 9H9V9.5Z"
        stroke="var(--brand-contrast)"
        strokeWidth="2.1"
        strokeLinejoin="round"
      />
      <path
        d="M9 22.5h14"
        stroke="var(--brand-contrast)"
        strokeWidth="2.1"
        strokeLinecap="round"
      />
    </svg>
  );
}

import Image from "next/image";

/** Proof link to one of Sree's LinkedIn posts, marked with LinkedIn's official logo. */
export function LinkedInProof({ href, label, compact = false }: { href: string; label: string; compact?: boolean }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`group/li inline-flex items-center gap-2.5 rounded-full border border-line-strong bg-bg-elev pl-1.5 text-fg outline-none focus-visible:ring-2 focus-visible:ring-[#0A66C2] focus-visible:ring-offset-2 focus-visible:ring-offset-bg transition-[border-color,box-shadow,transform] duration-500 ease-[var(--ease-spring)] hover:-translate-y-0.5 hover:border-[#0A66C2] hover:shadow-[0_10px_28px_-12px_rgb(10_102_194/0.7)] ${
        compact ? "h-9 pr-3.5 text-[0.8rem]" : "h-11 pr-4 text-sm font-medium"
      }`}
    >
      <span className={`inline-flex items-center justify-center rounded-full bg-white ${compact ? "h-6 w-6" : "h-8 w-8"}`}>
        <Image src="/logos/linkedin-in.png" alt="" width={96} height={82} style={{ height: compact ? 13 : 16, width: "auto" }} aria-hidden="true" />
      </span>
      View on LinkedIn
      <span className="sr-only"> — {label}, opens in a new tab</span>
      <svg
        width="12"
        height="12"
        viewBox="0 0 12 12"
        fill="none"
        aria-hidden="true"
        className="text-fg-muted transition-[transform,color] duration-500 group-hover/li:-translate-y-0.5 group-hover/li:translate-x-0.5 group-hover/li:text-[#0A66C2]"
      >
        <path d="M4.5 2.5h5v5M9.5 2.5 3 9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </a>
  );
}

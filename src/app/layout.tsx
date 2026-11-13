import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";
import "./globals.css";
import { profile } from "@/content/profile";
import { SiteNav } from "@/components/layout/SiteNav";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { MotionRuntime } from "@/components/motion/MotionRuntime";
import { AskSreeProvider } from "@/components/ask/AskSreeProvider";
import { AskSreeLauncher } from "@/components/ask/AskSreeLauncher";
import { themeScript, viewScript } from "@/components/layout/themeScript";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

const sans = Geist({ variable: "--font-sans", subsets: ["latin"], display: "swap" });
const mono = Geist_Mono({ variable: "--font-mono", subsets: ["latin"], display: "swap" });
const serif = Instrument_Serif({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: "400",
  style: "italic",
  // "optional": the preloaded face is used when ready at first paint and never
  // swapped in later, so the hero headline can't re-wrap (layout shift).
  display: "optional",
});

/** Vercel serves the analytics scripts; skip them in local and CI builds. */
const onVercel = process.env.VERCEL === "1";

const title = "Sreevarshan Sathiyamurthy — AI, Data & Software Engineer";
const description =
  "Sreevarshan Sathiyamurthy (Sree) builds intelligent systems, data infrastructure and full-stack software in Boston. Experience at RightRev with Snowflake Cortex AI agents and MCP; M.S. Data Analytics Engineering at Northeastern.";

export const metadata: Metadata = {
  metadataBase: new URL(profile.siteUrl),
  title: { default: title, template: "%s · Sreevarshan Sathiyamurthy" },
  description,
  applicationName: "Sreevarshan Sathiyamurthy",
  authors: [{ name: profile.name, url: profile.links.github }],
  creator: profile.name,
  keywords: ["Sreevarshan Sathiyamurthy", "Sree", "SS", "AI Engineer", "Data Engineer", "Software Engineer", "Boston", "Snowflake Cortex", "LangGraph", "RAG"],
  openGraph: {
    type: "website",
    title,
    description,
    siteName: "Sreevarshan Sathiyamurthy",
    locale: "en_US",
    url: "/",
  },
  twitter: { card: "summary_large_image", title, description },
  alternates: { canonical: "/" },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#08090c" },
    { media: "(prefers-color-scheme: light)", color: "#f5f6f8" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

const personJsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: profile.name,
  alternateName: profile.displayName,
  jobTitle: profile.roles.join(" · "),
  email: `mailto:${profile.email}`,
  url: profile.siteUrl,
  address: { "@type": "PostalAddress", addressLocality: "Boston", addressRegion: "MA", addressCountry: "US" },
  alumniOf: [
    { "@type": "CollegeOrUniversity", name: "Northeastern University" },
    { "@type": "CollegeOrUniversity", name: "Anna University" },
    { "@type": "CollegeOrUniversity", name: "Sri Sairam Engineering College" },
  ],
  sameAs: [profile.links.linkedin, profile.links.github, profile.links.scholar],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      data-theme="dark"
      data-view="quick"
      suppressHydrationWarning
      className={`${sans.variable} ${mono.variable} ${serif.variable} antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <script dangerouslySetInnerHTML={{ __html: viewScript }} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }}
        />
      </head>
      <body className="grain">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-fg focus:px-4 focus:py-2 focus:text-bg"
        >
          Skip to content
        </a>
        <AskSreeProvider>
          <SiteNav />
          <main id="main" tabIndex={-1} className="outline-none">
            {children}
          </main>
          <SiteFooter />
          <AskSreeLauncher />
        </AskSreeProvider>
        <MotionRuntime />
        {onVercel && (
          <>
            <Analytics />
            <SpeedInsights />
          </>
        )}
      </body>
    </html>
  );
}

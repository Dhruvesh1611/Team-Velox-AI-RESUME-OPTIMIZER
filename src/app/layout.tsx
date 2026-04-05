import type { Metadata } from "next";
import { Inter, Fira_Code } from "next/font/google";
import "./globals.css";
import { getSiteUrl } from "../lib/site";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const firaCode = Fira_Code({
  variable: "--font-fira-code",
  subsets: ["latin"],
  display: "swap",
});

const siteUrl = getSiteUrl();
const organizationName = "HireLens";

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      name: organizationName,
      url: siteUrl,
      description:
        "AI resume optimizer and portfolio-based resume builder with ATS analysis and interview prep.",
    },
    {
      "@type": "SoftwareApplication",
      name: organizationName,
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      url: siteUrl,
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      },
      description:
        "Optimize resumes with a multi-agent AI pipeline, generate ATS-focused resumes from portfolio data, and prepare for interviews with HireLens.",
      featureList: [
        "AI resume analysis",
        "Resume enrichment before optimization",
        "ATS-oriented resume optimization",
        "Portfolio-based resume builder",
        "Mock interview preparation",
      ],
    },
    {
      "@type": "Organization",
      name: "Team Velox",
      url: siteUrl,
      owns: {
        "@type": "WebSite",
        name: organizationName,
        url: siteUrl,
      },
    },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  verification: {
    google: "xh5H5qEaoQ3aUJzHEfEVE8nnvqNa0-84HZ3JiXFqC9w",
  },
  title: {
    default: "HireLens | AI Resume Optimizer and Portfolio Resume Builder",
    template: "%s | HireLens",
  },
  description:
    "Optimize resumes with a multi-agent AI pipeline, generate ATS-focused resumes from portfolio data, and prepare for interviews with HireLens.",
  applicationName: "HireLens",
  keywords: [
    "AI resume optimizer",
    "ATS resume checker",
    "resume builder",
    "portfolio resume generator",
    "resume analysis",
    "mock interview prep",
    "job application tools",
    "HireLens",
  ],

  authors: [{ name: "Team Velox" }],
  creator: "Team Velox",
  publisher: "Team Velox",
  category: "career",
  referrer: "origin-when-cross-origin",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: siteUrl,
  },
  openGraph: {
    type: "website",
    url: siteUrl,
    title: "HireLens | AI Resume Optimizer and Portfolio Resume Builder",
    description:
      "Analyze, enrich, optimize, and review resumes with AI. Build resumes from GitHub and portfolio data, then prepare with mock interviews.",
    siteName: "HireLens",
    locale: "en_US",
    images: [
      {
        url: `${siteUrl}/opengraph-image`,
        width: 1200,
        height: 630,
        alt: "HireLens AI resume optimization platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "HireLens | AI Resume Optimizer and Portfolio Resume Builder",
    description:
      "Multi-agent AI for resume analysis, ATS optimization, portfolio-based resume building, and interview prep.",
    images: [`${siteUrl}/twitter-image`],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/favicon-16x16.png", type: "image/png", sizes: "16x16" },
      { url: "/favicon-32x32.png", type: "image/png", sizes: "32x32" },
      { url: "/icon", type: "image/png", sizes: "64x64" },
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    shortcut: [
      { url: "/favicon-32x32.png", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", type: "image/png", sizes: "180x180" },
      { url: "/apple-icon", type: "image/png", sizes: "180x180" },
      { url: "/apple-touch-icon.svg", type: "image/svg+xml" },
    ],
    other: [
      {
        rel: "mask-icon",
        url: "/safari-pinned-tab.svg",
        color: "#4f46e5",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${firaCode.variable} h-full`}
    >
      <body className="min-h-full flex flex-col bg-[#f8fafc]">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData),
          }}
        />
        {children}
      </body>
    </html>
  );
}

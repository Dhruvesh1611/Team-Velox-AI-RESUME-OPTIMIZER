import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Contact Team Velox, explore project links, and learn more about HireLens and its AI-powered resume optimization platform.",
  keywords: [
    "HireLens contact",
    "Team Velox",
    "AI resume support",
    "resume platform contact",
  ],
  alternates: {
    canonical: "/contact",
  },
  openGraph: {
    title: "Contact HireLens",
    description:
      "Get in touch with the HireLens team and access project information and support links.",
    url: "/contact",
  },
  twitter: {
    card: "summary_large_image",
    title: "Contact HireLens",
    description:
      "Get in touch with the HireLens team and access project information and support links.",
  },
};

export default function ContactLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}

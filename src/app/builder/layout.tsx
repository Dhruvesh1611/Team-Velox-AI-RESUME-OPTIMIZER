import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Resume Builder",
  description:
    "Generate ATS-friendly resumes from GitHub, LinkedIn, and portfolio data with HireLens templates and AI-assisted keyword alignment.",
  alternates: {
    canonical: "/builder",
  },
  openGraph: {
    title: "HireLens AI Resume Builder",
    description:
      "Turn portfolio and GitHub work into a polished, ATS-ready resume with tailored templates and AI enhancement.",
    url: "/builder",
  },
};

export default function BuilderLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}

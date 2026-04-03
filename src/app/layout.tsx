import type { Metadata } from "next";
import { Inter, Fira_Code } from "next/font/google";
import "./globals.css";

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

export const metadata: Metadata = {
  title: "HireLens · AI Resume Optimizer",
  description:
    "Paste your resume and let our multi-agent AI pipeline analyze, optimize, and review it instantly — powered by Groq, Gemini, and HuggingFace.",
  keywords: ["resume optimizer", "AI resume", "ATS", "career", "HireLens"],
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
      <body className="min-h-full flex flex-col bg-[#f8fafc]">{children}</body>
    </html>
  );
}

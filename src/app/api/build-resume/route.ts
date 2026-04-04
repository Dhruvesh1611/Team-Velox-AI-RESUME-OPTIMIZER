import { NextRequest, NextResponse } from "next/server";
import { callAI } from "../../../services/ai.provider";

type ResumeProjectPayload = {
  name: string;
  type: string;
  category?: string;
  dateRange?: string;
  description?: string;
  bullets: string[];
  technologies?: string;
  links?: { github?: string; live?: string; demo?: string };
};

type ResumeDataPayload = {
  name?: string;
  title?: string;
  contacts?: {
    email?: string;
    phone?: string;
    github?: string;
    linkedin?: string;
    portfolio?: string;
  };
  skills?: Record<string, string>;
  achievements?: Array<{ title?: string; award?: string; link?: string }>;
  certificates?: Array<{ name?: string; link?: string }>;
  projects?: ResumeProjectPayload[];
  education?: Array<{
    degree?: string;
    institution?: string;
    gpa?: string;
    year?: string;
    percentage?: string;
  }>;
};

// ─── Template-aware prompts ────────────────────────────────────────────────

const TEMPLATE_FORMATS: Record<string, string> = {
  classic: `Output format: Classic Two-Column (like the reference resume provided).
Structure your plain-text output EXACTLY like this:

NAME (ALL CAPS)
JOB TITLE 1 | JOB TITLE 2
Email: ... | GitHub: ... | LinkedIn: ... | Portfolio: ...
─────────────────────────────────────────────────────────

HACKATHON / ACHIEVEMENTS          PROJECTS
─────────────────────            ─────────────────────
[Achievement name]               PROJECT NAME 1 (CATEGORY)
Award / achievement              [Date Range]
                                 • Bullet point action
TECHNICAL SKILLS                 • Technologies: X, Y, Z
─────────────────────
Frontend: list                   PROJECT NAME 2 (CATEGORY)
Backend: list                    [Date Range]  
Database: list                   • Bullet point action
Tools: list                      • Technologies: X, Y, Z

CERTIFICATES                     UI/UX DESIGN
─────────────────────            ─────────────────────
• Certificate name               • Design project name
                                 
EDUCATION                        MORE PROJECTS
─────────────────────            ─────────────────────
Degree - University              • Project names
CGPA: X.X

CONTACT DETAILS
─────────────────────
Phone, Email, GitHub, LinkedIn, Portfolio`,

  modern: `Output format: Modern Single Column with clear sections.
Use: SUMMARY | EXPERIENCE/PROJECTS | TECHNICAL SKILLS (as categories) | EDUCATION | CONTACT
Add metric-focused bullet points. Start each bullet with a strong action verb.
Format dates as [Month YYYY – Month YYYY] or [Month YYYY – Present].`,

  tech: `Output format: Developer/Tech focused.
Use: HEADER (name + title + contact inline) | TECHNICAL SKILLS (by category: Languages, Frontend, Backend, Database, Tools, Cloud) | PROJECTS (repo-style with tech stack in [brackets]) | OPEN SOURCE | EDUCATION
Emphasize GitHub stats, tech stacks, and measurable impact.`,

  minimal: `Output format: Harvard minimal style.
Pure text, no decorations. Name centered bold at top. Horizontal rule separator.
Sections: SUMMARY | EXPERIENCE | PROJECTS | EDUCATION | SKILLS
Ultra clean, every line counts. No fluff. Dense but readable.`,

  creative: `Output format: Creative professional.
Left sidebar content: CONTACT | SKILLS (categorized) | EDUCATION | CERTIFICATIONS  
Main content: PROFESSIONAL SUMMARY | EXPERIENCE | PROJECTS | ACHIEVEMENTS
Use clear section markers with ══════ dividers.`,

  executive: `Output format: Executive premium structure.
Stats bar: [X years exp] | [Y projects] | [Z skills]
Sections: EXECUTIVE PROFILE | KEY COMPETENCIES | PROFESSIONAL EXPERIENCE (reverse chronological) | EDUCATION | LEADERSHIP & ACHIEVEMENTS
Use corporate language, emphasize scale and impact.`,
};

const BASE_PROMPT = `You are an expert resume writer and ATS optimization specialist.
Analyze the portfolio deeply and generate a STRUCTURED JSON resume.

CRITICAL RULES:
1. Use strong action verbs: Built, Engineered, Led, Implemented, Optimized, Deployed, Architected
2. Add measurable outcomes: "Reduced load time by 40%", "Built for 1000+ users", "Improved score by 30pts"
3. Mirror job description keywords naturally
4. Use ONLY real data from portfolio — never fabricate names, dates, or companies
5. One-page density rules (no empty-looking layout):
   - Keep only the most relevant content for a single page resume
   - Omit empty sections entirely (do not output placeholder or dummy lines)
   - Prioritize quality over quantity; avoid repeating similar clone/practice items
6. Relevance rules:
   - Map each portfolio item to required job skills from the JD
   - For highly relevant items: 3-4 concise, impact bullets
   - For less relevant items: 1-2 concise bullets max
   - Mention only verified technologies/links present in portfolio data
7. Real-world resume quality rules:
  - Output must look like a real placement-ready resume, not a toy draft
  - Prefer concise but complete sections with practical recruiter language
  - If portfolio contains multiple projects, include multiple projects (not just one)
  - If certificates/education/contact are present in source, include them
  - Keep all details truthful and source-backed

PROJECT PRIORITY (sort output in this order, most detail for high priority):
  1. type=internship → 3-4 bullets, all links, full description
  2. type=freelancing → 3-4 bullets, all links, full description
  3. type=fullstack → 3-4 bullets
  4. type=opensource → 2-3 bullets
  5. type=other → 1-2 bullets (CSS clones, practice, API integrations)

CLASSIFICATION LOGIC (important):
  - Put paid client or production client work under type=freelancing
  - Put team/company/intern projects under type=internship
  - Put contributions to public repos under type=opensource
  - Put mini clones/practice work under type=other
  - If unsure, infer from README text, repo topics, and naming patterns conservatively

MINIMUM DEPTH RULES (when source data is available):
  - projects: include 4 to 8 projects
  - top relevant projects: 3 to 4 bullets each
  - lower relevance projects: 1 to 2 bullets each
  - certificates: include up to 8 verified certificates
  - skills: include all discovered categories (frontend/backend/database/tools/languages/cloud/uiux)

RETURN ONLY this exact JSON (no markdown fences, no commentary):
{
  "resumeData": {
    "name": "FULL NAME IN CAPS",
    "title": "ROLE 1 | ROLE 2",
    "contacts": {
      "email": "",
      "phone": "",
      "github": "https://github.com/username",
      "linkedin": "https://linkedin.com/in/username",
      "portfolio": "https://yoursite.dev"
    },
    "skills": {
      "frontend": "React.js, Next.js, HTML5, CSS3, Tailwind",
      "backend": "Node.js, Express.js, REST APIs",
      "database": "MongoDB, MongoDB Atlas",
      "tools": "Git, GitHub, Postman, VS Code",
      "languages": "JavaScript, TypeScript, C++, Java",
      "uiux": "Figma, Wireframing, Prototyping",
      "cloud": "AWS S3, Vercel, Cloudinary"
    },
    "achievements": [
      { "title": "Hackathon Name - Month Year", "award": "1st Place Winner", "link": "" }
    ],
    "certificates": [
      { "name": "JavaScript (Basic)", "link": "" }
    ],
    "projects": [
      {
        "name": "Project Name",
        "type": "internship",
        "category": "FREELANCING PAID-PROJECT",
        "dateRange": "Sep 2025 - Dec 2025",
        "description": "One-sentence project summary for ATS",
        "bullets": [
          "Built X using Y, achieving Z measurable outcome",
          "Implemented feature A using technology B for purpose C"
        ],
        "technologies": "Next.js, React, MongoDB, AWS S3",
        "links": { "github": "", "live": "", "demo": "" }
      }
    ],
    "education": [
      {
        "degree": "Bachelor of Technology",
        "institution": "Rai University",
        "gpa": "9.4",
        "year": "2022-2026",
        "percentage": ""
      }
    ]
  },
  "atsScore": 0,
  "matchedKeywords": [],
  "missingKeywords": [],
  "tip": "",
  "layoutHints": {
    "primaryFirst": ["internship", "freelancing", "opensource", "fullstack", "other"],
    "onePage": true
  }
}`;

// ─── Deep GitHub Scraper ──────────────────────────────────────────────────

async function deepScrapeGitHub(username: string): Promise<string> {
  const headers = {
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "HireLens-ResumeBuilder/1.0",
  };

  try {
    // 1. Fetch user profile
    const userRes = await fetch(`https://api.github.com/users/${username}`, { headers });
    if (!userRes.ok) throw new Error(`GitHub user not found: ${username}`);
    const user = await userRes.json();

    // 2. Fetch repos across pages for broader, deeper analysis.
    const perPage = 30;
    const pageCount = 3; // up to 90 repos
    const repoPages = await Promise.all(
      Array.from({ length: pageCount }, (_, idx) =>
        fetch(
          `https://api.github.com/users/${username}/repos?sort=updated&per_page=${perPage}&type=public&page=${idx + 1}`,
          { headers }
        )
      )
    );

    const pageJson = await Promise.all(
      repoPages.map(async (res) => (res.ok ? res.json() : []))
    );
    const allRepos = pageJson.flat();

    // 3. Rank and keep strongest repos for detailed scrape.
    const sortedRepos = Array.isArray(allRepos)
      ? [...allRepos].sort((a, b) => {
          const score = (r: { stargazers_count: number; forks_count: number; updated_at: string }) =>
            r.stargazers_count * 3 + r.forks_count * 2 + (new Date(r.updated_at).getTime() / 1e12);
          return score(b) - score(a);
        }).slice(0, 15)
      : [];

    // 4. Deep-fetch each selected repo: README + languages.
    const repoDetails = await Promise.all(
      sortedRepos.map(async (repo: {
        name: string;
        description?: string;
        language?: string;
        stargazers_count?: number;
        forks_count?: number;
        topics?: string[];
        homepage?: string;
        html_url?: string;
        updated_at?: string;
      }) => {
        const [readmeRes, langsRes] = await Promise.all([
          fetch(`https://api.github.com/repos/${username}/${repo.name}/readme`, {
            headers: { ...headers, Accept: "application/vnd.github.v3.raw" },
          }),
          fetch(`https://api.github.com/repos/${username}/${repo.name}/languages`, { headers }),
        ]);

        let readme = "";
        if (readmeRes.ok) {
          const raw = await readmeRes.text();
          // Keep a compact but informative README summary.
          readme = raw
            .replace(/!\[.*?\]\(.*?\)/g, "") // remove images
            .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // links → text
            .replace(/#{1,6}\s/g, "") // remove headings #
            .replace(/\*\*/g, "").replace(/\*/g, "") // remove bold/italic
            .replace(/`{1,3}[^`]*`{1,3}/g, "") // remove code
            .replace(/\n{3,}/g, "\n\n")
            .trim()
            .slice(0, 900);
        }

        const langs = langsRes.ok ? Object.keys(await langsRes.json()).join(", ") : repo.language ?? "";

        return {
          name: repo.name,
          description: repo.description ?? "",
          languages: langs,
          stars: repo.stargazers_count ?? 0,
          forks: repo.forks_count ?? 0,
          topics: Array.isArray(repo.topics) ? repo.topics.join(", ") : "",
          homepage: repo.homepage ?? "",
          url: repo.html_url ?? `https://github.com/${username}/${repo.name}`,
          readme: readme,
          updatedAt: repo.updated_at ?? "",
        };
      })
    );

    const remainderRepos = Array.isArray(allRepos)
      ? [...allRepos].filter((r) => !sortedRepos.some((s) => s.name === r.name)).slice(0, 24)
      : [];

    // 5. Format the full portfolio content
    const repoSections = repoDetails.map((r) => {
      const lines = [
        `PROJECT: ${r.name}`,
        `  URL: ${r.url}`,
        r.homepage ? `  Live: ${r.homepage}` : "",
        `  Description: ${r.description || "No description"}`,
        `  Languages/Tech: ${r.languages}`,
        r.topics ? `  Topics: ${r.topics}` : "",
        `  Stars: ${r.stars}  |  Forks: ${r.forks}`,
        r.readme ? `  README summary:\n${r.readme.split("\n").map((l) => `    ${l}`).join("\n")}` : "",
      ].filter(Boolean);
      return lines.join("\n");
    }).join("\n\n");

    return `
GITHUB PROFILE
══════════════════════════════════════════
Name: ${user.name || username}
Username: @${username}
Bio: ${user.bio || "N/A"}
Location: ${user.location || "N/A"}
Company: ${user.company || "N/A"}
Website/Portfolio: ${user.blog || "N/A"}
Total Public Repos: ${user.public_repos}
Followers: ${user.followers} | Following: ${user.following}
GitHub URL: https://github.com/${username}

TOP REPOSITORIES (Detailed)
══════════════════════════════════════════
${repoSections}

OTHER REPOSITORIES (Context List)
══════════════════════════════════════════
${remainderRepos
  .map((r: { name: string; description?: string; language?: string; html_url?: string }) =>
    `- ${r.name} | ${r.language || "N/A"} | ${r.description || "No description"} | ${r.html_url || ""}`
  )
  .join("\n")}
`.trim();
  } catch (err) {
    throw new Error(err instanceof Error ? err.message : "GitHub scraping failed.");
  }
}

function extractGitHubUsername(url: string): string | null {
  try {
    const parsed = new URL(url.trim());
    const host = parsed.hostname.toLowerCase();
    if (host !== "github.com" && host !== "www.github.com") return null;

    const segments = parsed.pathname
      .split("/")
      .map((s) => s.trim())
      .filter(Boolean);

    if (segments.length === 0) return null;
    const candidate = segments[0];

    // Ignore common non-user paths.
    const blocked = new Set([
      "features",
      "topics",
      "collections",
      "trending",
      "events",
      "marketplace",
      "pricing",
      "login",
      "signup",
      "about",
      "explore",
      "enterprise",
      "search",
      "settings",
      "notifications",
      "orgs",
      "organizations",
      "sponsors",
      "apps",
      "pulls",
      "issues",
    ]);

    if (blocked.has(candidate.toLowerCase())) return null;
    return candidate;
  } catch {
    return null;
  }
}

// ─── Generic Portfolio Scraper ────────────────────────────────────────────

async function scrapeGenericPortfolio(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; HireLens-Resume/1.0)" },
    signal: AbortSignal.timeout(10000),
  });

  if (!res.ok) throw new Error(`Could not fetch portfolio page: ${res.status}`);

  const html = await res.text();

  const cleanHtmlToText = (rawHtml: string) =>
    rawHtml
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<nav[\s\S]*?<\/nav>/gi, "")
      .replace(/<footer[\s\S]*?<\/footer>/gi, "")
      .replace(/<header[\s\S]*?<\/header>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();

  const fetchReadableMirror = async (sourceUrl: string): Promise<string> => {
    try {
      const mirrorUrl = `https://r.jina.ai/http://${sourceUrl.replace(/^https?:\/\//i, "")}`;
      const mirrorRes = await fetch(mirrorUrl, {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; HireLens-Resume/1.0)" },
        signal: AbortSignal.timeout(12000),
      });
      if (!mirrorRes.ok) return "";
      const mirrorText = await mirrorRes.text();
      return mirrorText.replace(/\s{2,}/g, " ").trim().slice(0, 20000);
    } catch {
      return "";
    }
  };

  const extractMeta = (rawHtml: string): string => {
    const title = rawHtml.match(/<title>([\s\S]*?)<\/title>/i)?.[1]?.trim() ?? "";
    const desc =
      rawHtml.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i)?.[1]?.trim() ??
      rawHtml.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["']/i)?.[1]?.trim() ??
      "";
    const ogTitle =
      rawHtml.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i)?.[1]?.trim() ?? "";
    const ogDesc =
      rawHtml.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i)?.[1]?.trim() ?? "";

    const parts = [
      title ? `Title: ${title}` : "",
      desc ? `Description: ${desc}` : "",
      ogTitle ? `OG Title: ${ogTitle}` : "",
      ogDesc ? `OG Description: ${ogDesc}` : "",
    ].filter(Boolean);

    return parts.join("\n");
  };

  const collectJsonLdStrings = (value: unknown, out: string[]) => {
    if (!value) return;
    if (typeof value === "string") {
      const txt = value.replace(/\s+/g, " ").trim();
      if (txt.length >= 5 && txt.length <= 240) out.push(txt);
      return;
    }
    if (Array.isArray(value)) {
      value.forEach((v) => collectJsonLdStrings(v, out));
      return;
    }
    if (typeof value === "object") {
      for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
        if (/name|title|description|skills?|technology|jobTitle|worksFor|alumniOf|award|sameAs|url|email|telephone/i.test(k)) {
          collectJsonLdStrings(v, out);
        }
      }
    }
  };

  const extractJsonLd = (rawHtml: string): string => {
    const blocks = Array.from(
      rawHtml.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)
    );
    const lines: string[] = [];
    for (const block of blocks) {
      const text = (block[1] || "").trim();
      if (!text) continue;
      try {
        const parsed = JSON.parse(text);
        collectJsonLdStrings(parsed, lines);
      } catch {
        // ignore malformed json-ld blocks
      }
    }
    const unique = Array.from(new Set(lines)).filter((s) => s.length >= 8);
    return unique.slice(0, 120).join("\n");
  };

  const extractSocialLinks = (rawHtml: string, baseUrl: URL): string[] => {
    const hrefs = Array.from(rawHtml.matchAll(/href=["']([^"'#]+)["']/gi)).map((m) => m[1]);
    const links = hrefs
      .map((href) => {
        try {
          return new URL(href, baseUrl).toString();
        } catch {
          return "";
        }
      })
      .filter(Boolean)
      .filter((u) => /github\.com|linkedin\.com|x\.com|twitter\.com|medium\.com|leetcode\.com|behance\.net/i.test(u));
    return Array.from(new Set(links)).slice(0, 15);
  };

  const extractReadableTextFromBundle = (bundle: string): string => {
    const candidates = [
      ...(bundle.match(/"([^"\\]|\\.){18,}"/g) ?? []),
      ...(bundle.match(/'([^'\\]|\\.){18,}'/g) ?? []),
      ...(bundle.match(/`([^`\\]|\\.){18,}`/g) ?? []),
    ]
      .map((s) => s.slice(1, -1))
      .map((s) => s.replace(/\\n|\\r|\\t/g, " "))
      .map((s) => s.replace(/\\u[0-9a-fA-F]{4}/g, " "))
      .map((s) => s.replace(/https?:\/\/\S+/g, " "))
      .map((s) => s.replace(/\s+/g, " ").trim())
      .filter((s) => /[a-zA-Z]{4,}/.test(s))
      .filter((s) => /project|skill|experience|about|resume|developer|react|node|javascript|typescript|mongodb|frontend|backend|certificate|education|portfolio/i.test(s))
      .filter((s) => s.length <= 220);

    const unique = Array.from(new Set(candidates));
    return unique.slice(0, 140).join("\n");
  };

  const base = new URL(url);
  const hrefMatches = Array.from(html.matchAll(/href=["']([^"'#]+)["']/gi)).map((m) => m[1]);

  const relevantUrls = hrefMatches
    .map((href) => {
      try {
        return new URL(href, base).toString();
      } catch {
        return "";
      }
    })
    .filter((u) => {
      if (!u) return false;
      if (!u.startsWith(`${base.protocol}//${base.host}`)) return false;
      return /(project|work|experience|about|resume|skill|achievement|contact)/i.test(u);
    })
    .slice(0, 8);

  const sitemapUrls = (() => new URL("/sitemap.xml", base).toString())();
  let sitemapRelevantUrls: string[] = [];
  try {
    const sitemapRes = await fetch(sitemapUrls, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; HireLens-Resume/1.0)" },
      signal: AbortSignal.timeout(8000),
    });
    if (sitemapRes.ok) {
      const sitemapXml = await sitemapRes.text();
      const locs = Array.from(sitemapXml.matchAll(/<loc>([\s\S]*?)<\/loc>/gi)).map((m) => m[1].trim());
      sitemapRelevantUrls = locs
        .filter((u) => {
          try {
            const parsed = new URL(u);
            if (parsed.host !== base.host) return false;
            return /(project|work|experience|about|resume|skill|achievement|contact|education|certificate)/i.test(parsed.pathname);
          } catch {
            return false;
          }
        })
        .slice(0, 8);
    }
  } catch {
    sitemapRelevantUrls = [];
  }

  const commonPaths = [
    "/about",
    "/projects",
    "/work",
    "/experience",
    "/resume",
    "/skills",
    "/education",
    "/certificates",
    "/contact",
  ]
    .map((p) => new URL(p, base).toString())
    .filter((u) => !relevantUrls.includes(u) && !sitemapRelevantUrls.includes(u));

  const candidateSubPages = Array.from(new Set([...relevantUrls, ...sitemapRelevantUrls, ...commonPaths])).slice(0, 10);

  const subPages = await Promise.all(
    candidateSubPages.map(async (u) => {
      try {
        const pageRes = await fetch(u, {
          headers: { "User-Agent": "Mozilla/5.0 (compatible; HireLens-Resume/1.0)" },
          signal: AbortSignal.timeout(7000),
        });
        if (!pageRes.ok) return "";
        const pageHtml = await pageRes.text();
        const pageText = cleanHtmlToText(pageHtml).slice(0, 2200);
        const pageJsonLd = extractJsonLd(pageHtml);
        return `\n\nPAGE: ${u}\n${pageText}${pageJsonLd ? `\nJSON-LD:\n${pageJsonLd}` : ""}`;
      } catch {
        return "";
      }
    })
  );

  const homeText = cleanHtmlToText(html).slice(0, 5000);
  const metaText = extractMeta(html);
  const jsonLdText = extractJsonLd(html);
  const socialLinks = extractSocialLinks(html, base);

  const isLikelySpaShell =
    /<div[^>]*id=["']root["'][^>]*><\/div>/i.test(html) ||
    homeText.length < 250;

  let bundleInsight = "";
  const currentCorpusLength = [homeText, metaText, jsonLdText, ...subPages].join("\n").length;
  if (isLikelySpaShell && currentCorpusLength < 4000) {
    const scriptUrls = Array.from(
      html.matchAll(/<script[^>]+src=["']([^"']+\.js[^"']*)["'][^>]*>/gi)
    )
      .map((m) => {
        try {
          return new URL(m[1], base).toString();
        } catch {
          return "";
        }
      })
      .filter(Boolean)
      .slice(0, 3);

    const scriptContents = await Promise.all(
      scriptUrls.map(async (scriptUrl) => {
        try {
          const scriptRes = await fetch(scriptUrl, {
            headers: { "User-Agent": "Mozilla/5.0 (compatible; HireLens-Resume/1.0)" },
            signal: AbortSignal.timeout(10000),
          });
          if (!scriptRes.ok) return "";
          const code = await scriptRes.text();
          return extractReadableTextFromBundle(code);
        } catch {
          return "";
        }
      })
    );

    const mergedBundleText = scriptContents.filter(Boolean).join("\n").slice(0, 8000);
    if (mergedBundleText.trim()) {
      bundleInsight = `\n\nSPA BUNDLE TEXT (extracted):\n${mergedBundleText}`;
    }
  }

  // For JS-heavy websites, try readable mirror extraction before relying on bundle snippets.
  let mirrorText = "";
  let mirrorInsight = "";
  if (isLikelySpaShell || currentCorpusLength < 7000) {
    mirrorText = await fetchReadableMirror(url);
    if (mirrorText) {
      mirrorInsight = `\n\nREADABLE MIRROR EXTRACTION:\n${mirrorText}`;
    }
  }

  const mirrorRawUrls = mirrorText.match(/https?:\/\/\S+/g) || [];
  const mirrorSocialLinks = Array.from(new Set(mirrorRawUrls)).filter(
    (u) => /github\.com|linkedin\.com|x\.com|twitter\.com|leetcode\.com|behance\.net|medium\.com/i.test(u)
  );

  const allSocialLinks = Array.from(new Set([...socialLinks, ...mirrorSocialLinks]));

  let socialEnrichment = "";
  const githubFromSocial = allSocialLinks.find((l) => /github\.com\//i.test(l));
  const githubUserFromSocial = githubFromSocial ? extractGitHubUsername(githubFromSocial) : null;
  if (githubUserFromSocial) {
    try {
      socialEnrichment = `\n\nSOCIAL ENRICHMENT (GitHub)\n${await deepScrapeGitHub(githubUserFromSocial)}`;
    } catch {
      socialEnrichment = "";
    }
  }

  return `PORTFOLIO WEBSITE CONTENT (${url}):

HOME META:
${metaText || "N/A"}

HOME TEXT:
${homeText || "N/A"}

HOME JSON-LD:
${jsonLdText || "N/A"}

SOCIAL LINKS:
${allSocialLinks.length ? allSocialLinks.join("\n") : "N/A"}

SITE PAGES (About/Projects/Experience/...):
${subPages.filter(Boolean).join("\n") || "N/A"}
${socialEnrichment}
${mirrorInsight}
${bundleInsight}`;
}

function extractProjectCandidatesFromPortfolio(text: string): Array<{ name: string; description: string }> {
  const blocked = new Set([
    "my projects",
    "skills & expertise",
    "skills",
    "languages",
    "frontend",
    "backend",
    "coding",
    "frontend development",
    "backend development",
    "tools",
    "design",
    "education",
    "contact information",
    "certifications",
    "who am i? (still figuring out)",
    "explanation & communication",
    "get in touch",
  ]);

  const results: Array<{ name: string; description: string }> = [];

  const pushCandidate = (nameRaw: string, descriptionRaw = "") => {
    const name = nameRaw
      .replace(/^!\[[^\]]*?:\s*/i, "")
      .replace(/^image\s+\d+\s*:\s*/i, "")
      .replace(/\[[^\]]+\]/g, "")
      .replace(/\s+icon$/i, "")
      .replace(/[\[\]]/g, "")
      .replace(/\s+/g, " ")
      .trim();
    if (!name || name.length < 3 || name.length > 90) return;
    const lowered = name.toLowerCase();
    if (blocked.has(lowered)) return;
    if (/(^|\s)image\s*\d*($|\s)|icon/.test(lowered)) return;
    if (!/[a-zA-Z]/.test(name)) return;

    const tokens = lowered.split(/\s+/).filter(Boolean);
    const hasProjectHint = /(project|app|api|portal|dashboard|clone|builder|platform|system|tool|website|extension|folio|management)/i.test(name);
    if (tokens.length === 1 && !hasProjectHint) return;

    const description = descriptionRaw.replace(/\s+/g, " ").trim().slice(0, 220);
    results.push({ name, description });
  };

  // GitHub deep-scrape blocks
  for (const match of text.matchAll(/^PROJECT:\s*(.+)$/gim)) {
    pushCandidate(match[1]);
  }

  // Readable mirror markdown blocks: ### Project Name
  for (const match of text.matchAll(/###\s+([^\n]+)\n([\s\S]{0,260}?)(?:\n###\s+|\n##\s+|$)/g)) {
    const name = match[1] ?? "";
    const body = (match[2] ?? "").replace(/\[[^\]]*\]\([^)]*\)/g, " ").replace(/!\[[^\]]*\]\([^)]*\)/g, " ");
    const descLine = body
      .split("\n")
      .map((line) => line.trim())
      .find((line) => line.length >= 25 && !line.startsWith("![") && !line.startsWith("http"));
    pushCandidate(name, descLine ?? "");
  }

  // Readable mirror inline card pattern:
  // [![Image ...] ... ### Project Name Description ... ↗](https://...)
  for (const match of text.matchAll(/###\s+([^\n\]]+?)\s+([\s\S]{20,260}?)(?:↗\]\(|\]\(https?:\/\/)/g)) {
    const name = match[1] ?? "";
    const desc = (match[2] ?? "")
      .replace(/\[[^\]]*\]\([^)]*\)/g, " ")
      .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    pushCandidate(name, desc);
  }

  // Image-alt markdown pattern often includes project names:
  // Image 1: Project Name [ Category ]
  for (const match of text.matchAll(/Image\s+\d+\s*:\s*([^\[\n]+)(?:\[[^\]]+\])?/gi)) {
    pushCandidate(match[1] ?? "");
  }

  // Generic markdown links can contain useful project titles.
  for (const match of text.matchAll(/\[([^\]]{8,220})\]\((https?:\/\/[^\s)]+)\)/g)) {
    const label = (match[1] ?? "")
      .replace(/!\[[^\]]*\]/g, " ")
      .replace(/#{1,6}\s*/g, "")
      .replace(/\s+/g, " ")
      .trim();
    const url = match[2] ?? "";
    if (!url) continue;

    if (/github\.com\/[^/]+\/[^/]+/i.test(url)) {
      const repo = url.split("/").filter(Boolean).slice(-1)[0]?.replace(/[#?].*$/, "") ?? "";
      if (repo && repo.length >= 3) {
        pushCandidate(repo.replace(/[-_]+/g, " "), label);
      }
      continue;
    }

    if (/leetcode\.com|linkedin\.com|x\.com|twitter\.com|mailto:|wa\.me|simpli-web\.app\.link|forage-uploads|sololearn\.com\/certificates/i.test(url)) {
      continue;
    }

    // Keep only likely project-style labels.
    if (/project|app|api|portal|dashboard|clone|builder|platform|system|tool|website|extension/i.test(label)) {
      const cleaned = label.split("↗")[0].trim();
      pushCandidate(cleaned, "Project extracted from portfolio link metadata.");
    }
  }

  // Plain GitHub repository URLs appearing in source text.
  for (const match of text.matchAll(/https?:\/\/github\.com\/([^\s/]+)\/([^\s/#?]+)/gi)) {
    const repo = (match[2] ?? "").replace(/\.git$/i, "").trim();
    if (repo) {
      pushCandidate(repo.replace(/[-_]+/g, " "), "Project inferred from GitHub repository link.");
    }
  }

  // De-duplicate by normalized project name
  const seen = new Set<string>();
  return results.filter((item) => {
    const key = item.name.toLowerCase().replace(/[^a-z0-9]+/g, "").trim();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function enrichResumeProjectsFromSource(resumeData: ResumeDataPayload, portfolioContent: string): ResumeDataPayload {
  const projects = Array.isArray(resumeData.projects) ? [...resumeData.projects] : [];
  const candidateProjects = extractProjectCandidatesFromPortfolio(portfolioContent);

  const existingNames = new Set(
    projects
      .map((p) => p.name?.toLowerCase().replace(/[^a-z0-9]+/g, "").trim())
      .filter(Boolean) as string[]
  );

  for (const candidate of candidateProjects) {
    if (projects.length >= 8) break;
    const normalized = candidate.name.toLowerCase().replace(/[^a-z0-9]+/g, "").trim();
    if (!normalized || existingNames.has(normalized)) continue;

    const fallbackBullet = candidate.description
      ? candidate.description
      : "Built and showcased this project with practical implementation in the portfolio.";

    projects.push({
      name: candidate.name,
      type: "other",
      category: "ADDITIONAL PROJECTS",
      description: candidate.description || "Project extracted from portfolio source.",
      bullets: [fallbackBullet],
      technologies: "",
      links: {},
    });

    existingNames.add(normalized);
  }

  return {
    ...resumeData,
    projects,
  };
}

function computeAtsInsights(
  resumeData: ResumeDataPayload | null,
  jobDescription: string,
  aiMatchedKeywords: string[],
  aiMissingKeywords: string[]
): { atsScore: number; matchedKeywords: string[]; missingKeywords: string[]; tip: string } {
  if (!resumeData) {
    return {
      atsScore: 0,
      matchedKeywords: [],
      missingKeywords: [],
      tip: "Could not parse resume details. Try regenerating with a clearer portfolio URL.",
    };
  }

  const textParts = [
    resumeData.name,
    resumeData.title,
    ...(resumeData.projects ?? []).flatMap((p) => [
      p.name,
      p.category,
      p.description,
      p.technologies,
      ...(p.bullets ?? []),
    ]),
    ...(resumeData.certificates ?? []).map((c) => c.name),
    ...(resumeData.achievements ?? []).flatMap((a) => [a.title, a.award]),
    ...(resumeData.education ?? []).flatMap((e) => [e.degree, e.institution]),
    ...(resumeData.skills ? Object.values(resumeData.skills) : []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  const hasJD = jobDescription.trim().length > 0;
  const stop = new Set([
    "the", "and", "for", "with", "from", "that", "this", "you", "your", "are", "our", "will", "have", "has",
    "job", "role", "work", "team", "using", "build", "developer", "experience", "years", "year", "into", "across",
  ]);

  const jdKeywords = Array.from(
    new Set(
      jobDescription
        .toLowerCase()
        .split(/[^a-z0-9+#.]+/)
        .map((w) => w.trim())
        .filter((w) => w.length >= 3 || ["c", "c++", "c#", "go", "ui", "ux"].includes(w))
        .filter((w) => !stop.has(w))
    )
  ).slice(0, 20);

  const computedMatched = jdKeywords.filter((k) => textParts.includes(k));
  const computedMissing = jdKeywords.filter((k) => !textParts.includes(k));

  const mergedMatched = Array.from(new Set([...computedMatched, ...aiMatchedKeywords])).slice(0, 12);
  const mergedMissing = Array.from(new Set([...computedMissing, ...aiMissingKeywords]))
    .filter((k) => !mergedMatched.includes(k))
    .slice(0, 8);

  const contactsCount = Object.values(resumeData.contacts ?? {}).filter(Boolean).length;
  const skillBuckets = Object.values(resumeData.skills ?? {}).filter((v) => Boolean(v && String(v).trim())).length;
  const projects = resumeData.projects ?? [];
  const projectCount = projects.length;
  const bulletCount = projects.reduce((acc, p) => acc + (p.bullets?.filter(Boolean).length ?? 0), 0);
  const certCount = (resumeData.certificates ?? []).filter((c) => c.name?.trim()).length;
  const eduCount = (resumeData.education ?? []).filter((e) => e.degree?.trim()).length;

  const structureScore =
    Math.min(12, contactsCount * 2.4) +
    Math.min(20, skillBuckets * 3) +
    Math.min(28, projectCount * 4.5) +
    Math.min(20, bulletCount * 1.8) +
    Math.min(10, certCount * 2) +
    Math.min(10, eduCount * 5);

  const normalizedStructure = Math.min(100, Math.round(structureScore));
  const coverage = hasJD && jdKeywords.length > 0
    ? Math.round((computedMatched.length / jdKeywords.length) * 100)
    : 0;

  const atsScore = hasJD
    ? Math.max(35, Math.min(99, Math.round(normalizedStructure * 0.6 + coverage * 0.4)))
    : Math.max(35, Math.min(96, Math.round(normalizedStructure * 0.92 + Math.min(8, projectCount))));

  let tip = "Resume is balanced and ATS-friendly.";
  if (projectCount < 4) {
    tip = "Add more portfolio-backed projects for stronger ATS relevance.";
  } else if (hasJD && mergedMissing.length > 0) {
    tip = `Add missing JD terms naturally: ${mergedMissing.slice(0, 3).join(", ")}.`;
  } else if (skillBuckets < 5) {
    tip = "Expand skills by category (frontend, backend, database, tools, cloud, languages).";
  }

  return {
    atsScore,
    matchedKeywords: mergedMatched,
    missingKeywords: mergedMissing,
    tip,
  };
}

// ─── Main Route ──────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { portfolioUrl, jobDescription, templateId = "classic" } = body as {
      portfolioUrl: string;
      jobDescription?: string;
      templateId?: string;
    };

    if (!portfolioUrl?.trim()) {
      return NextResponse.json(
        { error: "Portfolio URL is required." },
        { status: 400 }
      );
    }

    if (jobDescription?.trim() && jobDescription.trim().length < 50) {
      return NextResponse.json(
        { error: "Job description must be at least 50 characters." },
        { status: 400 }
      );
    }

    const effectiveJobDescription = jobDescription?.trim()
      ? jobDescription.trim()
      : `No specific job description provided.
Build an overall placement-ready software/full-stack resume from portfolio data only.
Prioritize strongest real projects, real achievements, practical tech stack, and credibility.
Target broad roles: Full-Stack Developer, Frontend Developer, Backend Developer.
Use ATS-friendly wording and realistic impact statements without fabrication.`;

    // Deep scrape based on URL type
    let portfolioContent: string;
    const githubUsername = extractGitHubUsername(portfolioUrl);

    if (githubUsername) {
      try {
        portfolioContent = await deepScrapeGitHub(githubUsername);
      } catch {
        // Fallback for API rate-limit / throttling / temporary GitHub API issues.
        const fallback = await scrapeGenericPortfolio(portfolioUrl.trim());
        portfolioContent = `${fallback}\n\n[Note: GitHub API deep scan unavailable right now; used page-level fallback extraction.]`;
      }
    } else {
      portfolioContent = await scrapeGenericPortfolio(portfolioUrl.trim());
    }

    // Build the final prompt with template format
    const templateFormat = TEMPLATE_FORMATS[templateId] ?? TEMPLATE_FORMATS.classic;

    const prompt = `${BASE_PROMPT}

TEMPLATE FORMAT TO USE:
${templateFormat}

═══════════════════════════════════════════
PORTFOLIO DATA (deep scraped):
${portfolioContent}

═══════════════════════════════════════════
JOB DESCRIPTION:
${effectiveJobDescription}
═══════════════════════════════════════════

Now generate the perfect resume. Remember: use REAL data from the portfolio only.`;

    const raw = await callAI(prompt, { provider: "groq", temperature: 0.25 });

    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("AI returned an unexpected format. Please try again.");
    }

    // Repair JSON: walk char-by-char and escape unescaped control chars inside string values
    function repairJson(str: string): string {
      let inString = false;
      let escaped = false;
      let result = "";

      for (let i = 0; i < str.length; i++) {
        const char = str[i];
        const code = str.charCodeAt(i);

        if (escaped) {
          result += char;
          escaped = false;
          continue;
        }

        if (char === "\\" && inString) {
          result += char;
          escaped = true;
          continue;
        }

        if (char === '"') {
          inString = !inString;
          result += char;
          continue;
        }

        // Inside a JSON string: escape any raw control characters
        if (inString && code < 0x20) {
          switch (char) {
            case "\n": result += "\\n"; break;
            case "\r": result += "\\r"; break;
            case "\t": result += "\\t"; break;
            default:   result += `\\u${code.toString(16).padStart(4, "0")}`; break;
          }
          continue;
        }

        result += char;
      }
      return result;
    }

    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(jsonMatch[0]);
    } catch {
      // First parse failed — repair control chars then try again
      parsed = JSON.parse(repairJson(jsonMatch[0]));
    }


    const resumeData = typeof parsed.resumeData === "object" && parsed.resumeData
      ? enrichResumeProjectsFromSource(parsed.resumeData as ResumeDataPayload, portfolioContent)
      : null;

    const aiMatchedKeywords = Array.isArray(parsed.matchedKeywords)
      ? parsed.matchedKeywords.filter((v): v is string => typeof v === "string")
      : [];
    const aiMissingKeywords = Array.isArray(parsed.missingKeywords)
      ? parsed.missingKeywords.filter((v): v is string => typeof v === "string")
      : [];

    const insights = computeAtsInsights(
      resumeData,
      jobDescription?.trim() ?? "",
      aiMatchedKeywords,
      aiMissingKeywords
    );

    return NextResponse.json({
      resumeData,
      atsScore: insights.atsScore,
      matchedKeywords: insights.matchedKeywords,
      missingKeywords: insights.missingKeywords,
      tip: (typeof parsed.tip === "string" && parsed.tip.trim()) ? parsed.tip : insights.tip,
      templateId,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Build failed." },
      { status: 500 }
    );
  }
}

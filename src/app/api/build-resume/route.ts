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

const BASE_PROMPT = `You are an expert ATS resume optimizer and enhancer.

Task:
- Improve, expand, and optimize an existing resume using portfolio data and optional job description.
- Enhance the base resume; do not blindly rewrite.
- Fill missing depth and details while keeping all facts real.
- Ensure output is full, professional, ATS-optimized, and single-page balanced.

Input context:
1. Existing resume (base)
2. Portfolio data
3. Job description (optional)

Core expansion rules:
- If content is low:
  - Expand each project to minimum 5 bullets using only source-backed context.
  - Expand project description to 2-3 lines.
  - Add technical depth: architecture, performance, scalability, reliability.
  - Expand skills into categories and add only safe inferred skills from observed technologies.
  - Include all valid certificates from source data.
- If content is excessive:
  - Curate to strongest 3-5 projects.
  - Prioritize project types in this order: freelancing > internship > fullstack > opensource > other.
  - Remove weak, duplicate, and tutorial/clone-style projects.

Project enhancement rules:
- Keep original meaning and factual content.
- Every project must include:
  - 2-3 line description
  - minimum 5 bullets (expand to 6 if page is still underfilled)
- Bullets should follow strong ATS structure:
  [Action Verb] + [What] + [Tech] + [Impact]
- Across bullets, include coverage of:
  - feature implementation
  - architecture/system design
  - performance optimization
  - security/scalability where relevant

Impact and truthfulness rules:
- NEVER fabricate metrics or numeric outcomes.
- If no numbers are available, use qualitative impact statements.
- Every bullet must include impact (quantitative if real, otherwise qualitative).

Keyword alignment rules:
- Extract and prioritize keywords from job description.
- Target 60-80% keyword coverage across Skills + Project bullets.
- Inject keywords only when contextually relevant.
- If not relevant for bullets, place them in Skills.
- Avoid keyword stuffing and cap repeated keyword phrases.

Language quality rules:
- Never use weak phrases like "worked on" or "responsible for".
- Use strong verbs like Developed, Engineered, Designed, Implemented, Optimized, Built, Architected.
- Avoid repetitive structures and duplicate bullet meaning.

Mandatory section completeness:
- Always include: Contact, Profile/Summary, Skills (categorized), Projects, Education, Certificates/Achievements.
- Keep layout visually full and balanced for a single page without fake content.

Hard page-fill requirement:
- The resume must visually fill a full A4 page.
- If page density is low, increase project bullets up to 6 and enrich descriptions/profile depth using real context.
- Never add fake projects or fake experience.

Strict safety rules:
- Do not remove real experience.
- Do not add fake companies, fake roles, or fake technologies.
- Accuracy over optimization.

QUALITATIVE IMPACT LANGUAGE (use when no numeric evidence exists):
- optimized application performance
- enhanced user experience and responsiveness
- improved system efficiency and scalability
- streamlined workflows and reduced complexity
- increased reliability and maintainability

CLASSIFICATION LOGIC:
- Put paid client work under type=freelancing.
- Put team/company/intern work under type=internship.
- Put open-source contributions under type=opensource.
- Put practice/clone work under type=other.

MINIMUM DEPTH GUIDANCE (when source supports it):
- projects: include 3 to 5 curated projects for single page quality
- bullets per selected project: aim 3 to 5 (prefer 4+ for stronger projects)
- certificates: include all valid source-backed certificates up to practical one-page limits
- skills: include discovered categories (frontend/backend/database/tools/languages/cloud/uiux/concepts)

RETURN ONLY this exact JSON (no markdown fences, no commentary):
Return ONLY valid JSON. Do not include any text outside JSON.
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
          "Built X using Y to improve system efficiency and scalability",
          "Implemented feature A using technology B, enhancing user experience and responsiveness"
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

    const fallbackBullet = ensureImpactStatement(
      candidate.description
        ? candidate.description
        : "Built and showcased this project with practical implementation in the portfolio.",
      projects.length
    );

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

const QUALITATIVE_IMPACT_PHRASES = [
  "optimized application performance",
  "enhanced user experience and responsiveness",
  "improved system efficiency and scalability",
  "streamlined workflows and reduced complexity",
  "increased reliability and maintainability",
];

function hasNumericMetric(text: string): boolean {
  return /\b\d+(?:\.\d+)?\s*(?:%|x|k|m|b|ms|s|sec|seconds|min|mins|minutes|hours?|users?|customers?|clients?|downloads?|requests?|records?|rows?|revenue|sales|latency|throughput)\b/i.test(text);
}

function hasImpactLanguage(text: string): boolean {
  return /(impact|improv|enhanc|optimiz|streamlin|increas|reduc|accelerat|scalab|efficien|reliab|maintainab|responsiv|performan|stability|quality)/i.test(text);
}

function strengthenActionVerb(text: string, seed: number): string {
  const cleaned = text.replace(/\s+/g, " ").trim();
  if (!cleaned) return cleaned;

  const strongVerbs = ["Developed", "Engineered", "Implemented", "Optimized", "Designed"];
  const verb = strongVerbs[seed % strongVerbs.length];

  const leadingRewrites: Array<[RegExp, string]> = [
    [/^(?:[-*]\s*)?worked on\b\s*/i, `${verb} `],
    [/^(?:[-*]\s*)?was responsible for\b\s*/i, `${verb} `],
    [/^(?:[-*]\s*)?responsible for\b\s*/i, `${verb} `],
    [/^(?:[-*]\s*)?involved in\b\s*/i, `${verb} `],
  ];

  for (const [pattern, replacement] of leadingRewrites) {
    if (pattern.test(cleaned)) {
      return cleaned.replace(pattern, replacement).trim();
    }
  }

  return cleaned
    .replace(/\bworked on\b/gi, "developed")
    .replace(/\bwas responsible for\b/gi, "implemented")
    .replace(/\bresponsible for\b/gi, "implemented")
    .replace(/\binvolved in\b/gi, "engineered")
    .trim();
}

function ensureImpactStatement(bullet: string, seed: number): string {
  const cleaned = strengthenActionVerb(bullet, seed);
  if (!cleaned) {
    return `Delivered implementation outcomes that ${QUALITATIVE_IMPACT_PHRASES[seed % QUALITATIVE_IMPACT_PHRASES.length]}.`;
  }

  if (hasNumericMetric(cleaned) || hasImpactLanguage(cleaned)) {
    return cleaned;
  }

  const phrase = QUALITATIVE_IMPACT_PHRASES[seed % QUALITATIVE_IMPACT_PHRASES.length];
  return `${cleaned}, ${phrase}.`;
}

function normalizeProjectsWithImpact(resumeData: ResumeDataPayload): ResumeDataPayload {
  const projects = (resumeData.projects ?? []).map((project, idx) => {
    const sourceBullets = Array.isArray(project.bullets) ? project.bullets : [];
    const normalizedBullets = sourceBullets
      .map((bullet, bulletIdx) => ensureImpactStatement(String(bullet), idx + bulletIdx))
      .filter(Boolean);

    if (normalizedBullets.length === 0) {
      const fallback = project.description?.trim()
        ? ensureImpactStatement(project.description, idx)
        : ensureImpactStatement("Implemented core features and delivered practical outcomes.", idx);
      normalizedBullets.push(fallback);
    }

    return {
      ...project,
      bullets: normalizedBullets,
    };
  });

  return {
    ...resumeData,
    projects,
  };
}

type KeywordCategory = "skills" | "tools" | "concepts";

type KeywordCatalogItem = {
  keyword: string;
  category: KeywordCategory;
  aliases: string[];
};

type KeywordTarget = {
  keyword: string;
  category: KeywordCategory;
  aliases: string[];
  priority: number;
};

type KeywordAlignmentResult = {
  resumeData: ResumeDataPayload;
  targetKeywords: string[];
  matchedKeywords: string[];
  missingKeywords: string[];
  coverageRatio: number;
};

type ProjectScoreCard = {
  relevance: number;
  impact: number;
  complexity: number;
  uniqueness: number;
  weighted: number;
};

const DIVERSITY_VERB_ROTATION = [
  "Developed",
  "Engineered",
  "Designed",
  "Implemented",
  "Optimized",
  "Built",
  "Architected",
];

const JD_KEYWORD_CATALOG: KeywordCatalogItem[] = [
  { keyword: "React", category: "skills", aliases: ["react", "react.js", "reactjs"] },
  { keyword: "Next.js", category: "skills", aliases: ["next.js", "nextjs", "next"] },
  { keyword: "Node.js", category: "skills", aliases: ["node.js", "nodejs", "node"] },
  { keyword: "Express.js", category: "skills", aliases: ["express", "express.js"] },
  { keyword: "TypeScript", category: "skills", aliases: ["typescript", "ts"] },
  { keyword: "JavaScript", category: "skills", aliases: ["javascript", "js"] },
  { keyword: "MongoDB", category: "skills", aliases: ["mongodb", "mongo db"] },
  { keyword: "SQL", category: "skills", aliases: ["sql", "mysql", "postgres", "postgresql"] },
  { keyword: "REST APIs", category: "concepts", aliases: ["rest api", "rest apis", "api", "apis"] },
  { keyword: "API Integration", category: "concepts", aliases: ["api integration", "integrating apis", "api integrations"] },
  { keyword: "Performance Optimization", category: "concepts", aliases: ["performance optimization", "performance", "optimization", "latency"] },
  { keyword: "Scalability", category: "concepts", aliases: ["scalability", "scalable", "scale"] },
  { keyword: "Responsive Design", category: "concepts", aliases: ["responsive", "responsive design"] },
  { keyword: "System Reliability", category: "concepts", aliases: ["reliability", "stable", "maintainability"] },
  { keyword: "Git", category: "tools", aliases: ["git"] },
  { keyword: "GitHub", category: "tools", aliases: ["github"] },
  { keyword: "Docker", category: "tools", aliases: ["docker", "container", "containers"] },
  { keyword: "AWS", category: "tools", aliases: ["aws", "amazon web services"] },
  { keyword: "Vercel", category: "tools", aliases: ["vercel"] },
  { keyword: "CI/CD", category: "tools", aliases: ["ci/cd", "cicd", "continuous integration", "continuous delivery"] },
];

const DEFAULT_FULLSTACK_KEYWORDS = [
  "React",
  "Next.js",
  "Node.js",
  "Express.js",
  "MongoDB",
  "TypeScript",
  "REST APIs",
  "API Integration",
  "Performance Optimization",
  "Scalability",
  "Git",
  "Docker",
  "AWS",
];

function normalizeKeywordText(text: string): string {
  return ` ${text.toLowerCase().replace(/[^a-z0-9+#.]+/g, " ").trim()} `;
}

function countAliasOccurrences(text: string, alias: string): number {
  const normalizedText = normalizeKeywordText(text);
  const normalizedAlias = alias.toLowerCase().replace(/[^a-z0-9+#.]+/g, " ").trim();
  if (!normalizedAlias) return 0;

  let count = 0;
  let index = normalizedText.indexOf(` ${normalizedAlias} `);
  while (index !== -1) {
    count += 1;
    index = normalizedText.indexOf(` ${normalizedAlias} `, index + normalizedAlias.length + 1);
  }
  return count;
}

function containsAnyAlias(text: string, aliases: string[]): boolean {
  return aliases.some((alias) => countAliasOccurrences(text, alias) > 0);
}

function extractPrioritizedKeywords(jobDescription: string, hasUserJD: boolean): KeywordTarget[] {
  if (!hasUserJD) {
    return DEFAULT_FULLSTACK_KEYWORDS
      .map((keyword, idx) => {
        const item = JD_KEYWORD_CATALOG.find((entry) => entry.keyword === keyword);
        return item
          ? {
              keyword: item.keyword,
              category: item.category,
              aliases: item.aliases,
              priority: 100 - idx,
            }
          : null;
      })
      .filter((item): item is KeywordTarget => Boolean(item));
  }

  const ranked = JD_KEYWORD_CATALOG
    .map((entry) => {
      const frequency = entry.aliases.reduce(
        (acc, alias) => acc + countAliasOccurrences(jobDescription, alias),
        0
      );

      const categoryWeight =
        entry.category === "skills" ? 20 : entry.category === "tools" ? 15 : 10;

      return {
        keyword: entry.keyword,
        category: entry.category,
        aliases: entry.aliases,
        priority: frequency > 0 ? frequency * 100 + categoryWeight : 0,
      };
    })
    .filter((entry) => entry.priority > 0)
    .sort((a, b) => b.priority - a.priority);

  if (ranked.length === 0) {
    return extractPrioritizedKeywords(jobDescription, false);
  }

  return ranked.slice(0, 15);
}

function chooseSkillsBucket(keyword: string): string {
  const lowered = keyword.toLowerCase();

  if (/(react|next|vue|angular|tailwind|css|html|frontend|responsive)/.test(lowered)) return "frontend";
  if (/(node|express|nest|backend|graphql|api)/.test(lowered)) return "backend";
  if (/(mongo|sql|postgres|mysql|redis|database)/.test(lowered)) return "database";
  if (/(typescript|javascript|python|java|c\+\+|language)/.test(lowered)) return "languages";
  if (/(aws|azure|gcp|docker|kubernetes|vercel|cloud|ci\/cd)/.test(lowered)) return "cloud";
  if (/(performance|scalability|reliability|integration|architecture|optimization)/.test(lowered)) return "concepts";
  return "tools";
}

function appendKeywordToSkills(resumeData: ResumeDataPayload, target: KeywordTarget): boolean {
  const skills = { ...(resumeData.skills ?? {}) };
  const bucket = chooseSkillsBucket(target.keyword);
  const existing = String(skills[bucket] ?? "").trim();

  if (containsAnyAlias(existing, target.aliases)) {
    return false;
  }

  const next = existing ? `${existing}, ${target.keyword}` : target.keyword;
  skills[bucket] = next;
  resumeData.skills = skills;
  return true;
}

function projectSemanticText(project: ResumeProjectPayload): string {
  return [
    project.name,
    project.category,
    project.description,
    project.technologies,
    ...(project.bullets ?? []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function projectTechnologiesText(project: ResumeProjectPayload): string {
  return [project.technologies, ...(project.bullets ?? [])]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function computeKeywordRelevanceScore(project: ResumeProjectPayload, target: KeywordTarget): number {
  const fullText = projectSemanticText(project);
  const techText = projectTechnologiesText(project);

  const aliasInTech = target.aliases.some((alias) => countAliasOccurrences(techText, alias) > 0);
  const aliasInProject = target.aliases.some((alias) => countAliasOccurrences(fullText, alias) > 0);

  const frontendSignals = /(frontend|ui|ux|react|next|tailwind|css|html|landing|portfolio)/i.test(fullText);
  const backendSignals = /(backend|api|server|node|express|database|auth|crud|microservice)/i.test(fullText);
  const devopsSignals = /(docker|container|kubernetes|aws|cloud|deploy|ci\/cd|pipeline|infra)/i.test(fullText);
  const performanceSignals = /(performance|optimi[sz]|latency|throughput|scale|scalab|reliab|maintainab)/i.test(fullText);

  let score = 0;

  if (aliasInTech) score += 0.75;
  if (aliasInProject) score += 0.2;

  if (target.keyword === "REST APIs" || target.keyword === "API Integration") {
    if (backendSignals) score += 0.35;
  }

  if (target.keyword === "Performance Optimization" || target.keyword === "Scalability" || target.keyword === "System Reliability") {
    if (performanceSignals || backendSignals) score += 0.35;
  }

  if (target.keyword === "Docker" || target.keyword === "AWS" || target.keyword === "CI/CD") {
    if (devopsSignals || backendSignals) score += 0.35;
    if (frontendSignals && !backendSignals && !devopsSignals) score -= 0.35;
  }

  if (target.keyword === "React" || target.keyword === "Next.js" || target.keyword === "Responsive Design") {
    if (frontendSignals) score += 0.3;
  }

  return Math.max(0, Math.min(1, score));
}

function chooseRelevantProject(projects: ResumeProjectPayload[], target: KeywordTarget): { index: number; score: number } {
  if (projects.length === 0) return { index: -1, score: 0 };

  let bestIndex = -1;
  let bestScore = 0;

  for (let i = 0; i < projects.length; i += 1) {
    const score = computeKeywordRelevanceScore(projects[i], target);
    if (score > bestScore) {
      bestScore = score;
      bestIndex = i;
    }
  }

  return { index: bestIndex, score: bestScore };
}

function injectKeywordNaturally(bullet: string, target: KeywordTarget): string {
  if (containsAnyAlias(bullet, target.aliases)) {
    return bullet;
  }

  const cleaned = bullet.trim().replace(/[.\s]+$/, "");

  if (target.category === "concepts") {
    return `${cleaned}, with emphasis on ${target.keyword.toLowerCase()}.`;
  }

  if (/using\s/i.test(cleaned)) {
    return `${cleaned}, leveraging ${target.keyword} to enhance delivery outcomes.`;
  }

  return `${cleaned} using ${target.keyword} to improve system efficiency and scalability.`;
}

function countKeywordOccurrencesInResume(resumeData: ResumeDataPayload, target: KeywordTarget): number {
  const allText = [
    ...(resumeData.skills ? Object.values(resumeData.skills) : []),
    ...(resumeData.projects ?? []).flatMap((project) => [
      project.technologies,
      ...(project.bullets ?? []),
      project.description,
      project.name,
    ]),
  ]
    .filter(Boolean)
    .join(" ");

  return target.aliases.reduce(
    (acc, alias) => acc + countAliasOccurrences(allText, alias),
    0
  );
}

function hasRelevantProjectMatch(resumeData: ResumeDataPayload, target: KeywordTarget): boolean {
  const projects = resumeData.projects ?? [];

  for (const project of projects) {
    const score = computeKeywordRelevanceScore(project, target);
    if (score < 0.6) continue;

    const text = [
      project.name,
      project.category,
      project.description,
      project.technologies,
      ...(project.bullets ?? []),
    ]
      .filter(Boolean)
      .join(" ");

    if (containsAnyAlias(text, target.aliases)) {
      return true;
    }
  }

  return false;
}

function hasSkillsMatch(resumeData: ResumeDataPayload, target: KeywordTarget): boolean {
  const skillsText = Object.values(resumeData.skills ?? {}).join(" ");
  return containsAnyAlias(skillsText, target.aliases);
}

function alignResumeKeywords(
  resumeData: ResumeDataPayload,
  jobDescription: string,
  hasUserJD: boolean
): KeywordAlignmentResult {
  const aligned: ResumeDataPayload = {
    ...resumeData,
    skills: { ...(resumeData.skills ?? {}) },
    projects: (resumeData.projects ?? []).map((project) => ({
      ...project,
      bullets: Array.isArray(project.bullets) ? [...project.bullets] : [],
    })),
  };

  const targets = extractPrioritizedKeywords(jobDescription, hasUserJD).slice(0, 12);
  const targetCount = targets.length;
  const targetCoverage = 0.7; // strict midpoint of requested 60-80%

  const evaluate = () => {
    const matched = targets.filter(
      (target) => hasRelevantProjectMatch(aligned, target) || hasSkillsMatch(aligned, target)
    );
    const missing = targets.filter(
      (target) => !hasRelevantProjectMatch(aligned, target) && !hasSkillsMatch(aligned, target)
    );
    const coverage = targetCount > 0 ? matched.length / targetCount : 0;
    return { matched, missing, coverage };
  };

  let current = evaluate();

  for (const target of current.missing) {
    if (current.coverage >= targetCoverage) break;

    const occurrenceCount = countKeywordOccurrencesInResume(aligned, target);
    if (occurrenceCount >= 3) continue;

    let injected = false;

    const projects = aligned.projects ?? [];
    const candidate = chooseRelevantProject(projects, target);
    if (candidate.index >= 0 && candidate.score >= 0.6) {
      const projectIndex = candidate.index;
      const project = projects[projectIndex];
      if (!Array.isArray(project.bullets) || project.bullets.length === 0) {
        project.bullets = [
          ensureImpactStatement(
            injectKeywordNaturally("Implemented core project features", target),
            projectIndex
          ),
        ];
        injected = true;
      } else {
        const bulletIndex = 0;
        const updated = ensureImpactStatement(
          injectKeywordNaturally(project.bullets[bulletIndex], target),
          projectIndex + bulletIndex
        );

        if (updated !== project.bullets[bulletIndex]) {
          project.bullets[bulletIndex] = updated;
          injected = true;
        }
      }
    }

    if (!injected) {
      // If no project passes semantic relevance threshold, place keyword in skills only.
      injected = appendKeywordToSkills(aligned, target);
    }

    if (injected && countKeywordOccurrencesInResume(aligned, target) > 3) {
      // Keep keyword presence but avoid stuffing by not adding more than one additional instance.
      continue;
    }

    current = evaluate();
  }

  const finalEval = evaluate();
  return {
    resumeData: aligned,
    targetKeywords: targets.map((target) => target.keyword),
    matchedKeywords: finalEval.matched.map((target) => target.keyword),
    missingKeywords: finalEval.missing.map((target) => target.keyword),
    coverageRatio: finalEval.coverage,
  };
}

function replaceLeadingVerb(bullet: string, verb: string): string {
  const trimmed = bullet.trim();
  if (!trimmed) return trimmed;

  const escaped = DIVERSITY_VERB_ROTATION.join("|");
  const leadingVerbPattern = new RegExp(`^(${escaped})\\b\\s+`, "i");

  if (leadingVerbPattern.test(trimmed)) {
    return trimmed.replace(leadingVerbPattern, `${verb} `);
  }

  return `${verb} ${trimmed.charAt(0).toLowerCase()}${trimmed.slice(1)}`;
}

function normalizeMeaningSignature(text: string): Set<string> {
  const stopWords = new Set([
    "the", "and", "for", "with", "using", "through", "into", "from", "that", "this", "a", "an",
    "to", "of", "on", "in", "by", "as", "is", "are", "was", "were", "be", "being", "been",
    "improved", "improve", "enhanced", "enhance", "optimized", "optimize", "implemented", "developed",
    "engineered", "designed", "built", "architected", "resulting", "delivered", "project", "feature",
  ]);

  const tokens = text
    .toLowerCase()
    .replace(/[^a-z0-9+#. ]+/g, " ")
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length > 2 && !stopWords.has(token));

  return new Set(tokens);
}

function jaccardSimilarity(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;

  let intersection = 0;
  for (const token of a) {
    if (b.has(token)) intersection += 1;
  }

  const union = a.size + b.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

function diversifySentenceStructure(bullet: string, bulletIndex: number): string {
  const cleaned = bullet.trim().replace(/\s+/g, " ");
  if (!cleaned) return cleaned;

  const pattern = /^(\w+)\s+(.+?)\s+using\s+(.+?)\s+to\s+(.+?)([.!]?)$/i;
  const match = cleaned.match(pattern);
  if (!match) return cleaned;

  const verb = match[1];
  const feature = match[2];
  const tech = match[3];
  const impact = match[4];

  if (bulletIndex % 3 === 1) {
    return `${verb} ${feature} to ${impact} using ${tech}.`;
  }

  if (bulletIndex % 3 === 2) {
    return `${verb} ${feature}; using ${tech}, this improved ${impact}.`;
  }

  return `${verb} ${feature} using ${tech} to ${impact}.`;
}

function diversifyKeywordPhrasing(
  bullet: string,
  phraseCount: Map<string, number>,
  bulletSeed: number
): string {
  let updated = bullet;

  const patterns = [
    /(using\s+[^,.;]+?)(?=\s+to\b|,|\.|;|$)/i,
    /(leveraging\s+[^,.;]+?)(?=\s+to\b|,|\.|;|$)/i,
    /(with emphasis on\s+[^,.;]+?)(?=\s+to\b|,|\.|;|$)/i,
  ];

  for (const pattern of patterns) {
    const match = updated.match(pattern);
    if (!match) continue;

    const phrase = match[1].trim();
    const phraseKey = phrase.toLowerCase();
    const nextCount = (phraseCount.get(phraseKey) ?? 0) + 1;
    phraseCount.set(phraseKey, nextCount);

    if (nextCount <= 2) continue;

    const phraseBody = phrase
      .replace(/^using\s+/i, "")
      .replace(/^leveraging\s+/i, "")
      .replace(/^with emphasis on\s+/i, "")
      .trim();

    const replacements = [
      `with ${phraseBody}`,
      `powered by ${phraseBody}`,
      `through ${phraseBody}`,
    ];
    const replacement = replacements[bulletSeed % replacements.length];
    updated = updated.replace(phrase, replacement);
  }

  return updated;
}

function applyBulletDiversityAndAntiRepetition(resumeData: ResumeDataPayload): ResumeDataPayload {
  const globalPhraseCount = new Map<string, number>();

  const projects = (resumeData.projects ?? []).map((project, projectIndex) => {
    const sourceBullets = (project.bullets ?? []).map((b) => String(b).trim()).filter(Boolean);
    const diversified: string[] = [];
    const seenSignatures: Set<string>[] = [];
    const verbUsage = new Map<string, number>();

    for (let bulletIndex = 0; bulletIndex < sourceBullets.length; bulletIndex += 1) {
      const seed = projectIndex * 10 + bulletIndex;
      let bullet = diversifySentenceStructure(sourceBullets[bulletIndex], bulletIndex);

      const desiredVerb = DIVERSITY_VERB_ROTATION[(projectIndex + bulletIndex) % DIVERSITY_VERB_ROTATION.length];
      const desiredCount = verbUsage.get(desiredVerb.toLowerCase()) ?? 0;

      if (desiredCount < 2) {
        bullet = replaceLeadingVerb(bullet, desiredVerb);
      } else {
        const fallbackVerb = DIVERSITY_VERB_ROTATION.find(
          (verb) => (verbUsage.get(verb.toLowerCase()) ?? 0) < 2
        );
        if (fallbackVerb) {
          bullet = replaceLeadingVerb(bullet, fallbackVerb);
        }
      }

      bullet = diversifyKeywordPhrasing(bullet, globalPhraseCount, seed);
      bullet = ensureImpactStatement(bullet, seed);

      const signature = normalizeMeaningSignature(bullet);
      const isDuplicateMeaning = seenSignatures.some(
        (existing) => jaccardSimilarity(existing, signature) >= 0.72
      );

      if (isDuplicateMeaning) {
        continue;
      }

      const leadingVerb = bullet.match(/^(\w+)\b/)?.[1]?.toLowerCase();
      if (leadingVerb) {
        verbUsage.set(leadingVerb, (verbUsage.get(leadingVerb) ?? 0) + 1);
      }

      diversified.push(bullet);
      seenSignatures.push(signature);
    }

    if (diversified.length === 0) {
      diversified.push(
        ensureImpactStatement(
          replaceLeadingVerb(
            project.description?.trim() || "Implemented core project capabilities for measurable outcomes.",
            DIVERSITY_VERB_ROTATION[projectIndex % DIVERSITY_VERB_ROTATION.length]
          ),
          projectIndex
        )
      );
    }

    return {
      ...project,
      bullets: diversified,
    };
  });

  return {
    ...resumeData,
    projects,
  };
}

function tokenizeProjectSemantics(project: ResumeProjectPayload): Set<string> {
  const text = [
    project.name,
    project.category,
    project.description,
    project.technologies,
    ...(project.bullets ?? []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  const stop = new Set([
    "the", "and", "for", "with", "using", "from", "that", "this", "into", "through", "project",
    "built", "build", "developed", "implemented", "designed", "engineered", "optimized", "feature",
    "application", "app", "system", "platform", "solution", "result", "results",
  ]);

  const tokens = text
    .replace(/[^a-z0-9+#. ]+/g, " ")
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length > 2 && !stop.has(token));

  return new Set(tokens);
}

function countTechnologies(project: ResumeProjectPayload): number {
  const techTokens = String(project.technologies ?? "")
    .split(/[|,/]/)
    .map((token) => token.trim())
    .filter(Boolean);

  const inferred = JD_KEYWORD_CATALOG
    .map((entry) => entry.keyword)
    .filter((keyword) => containsAnyAlias(projectSemanticText(project), [keyword.toLowerCase(), keyword]));

  const merged = new Set([...techTokens, ...inferred]);
  return merged.size;
}

function detectProjectArchetype(project: ResumeProjectPayload): string {
  const text = projectSemanticText(project);
  if (/(crud|todo|notes|basic management)/i.test(text)) return "crud";
  if (/(dashboard|analytics|admin)/i.test(text)) return "dashboard";
  if (/(ecommerce|cart|payment|checkout)/i.test(text)) return "ecommerce";
  if (/(api|backend|microservice|server)/i.test(text)) return "backend";
  if (/(ui|ux|landing|portfolio|design)/i.test(text)) return "frontend";
  if (/(chat|realtime|socket|collaboration)/i.test(text)) return "realtime";
  if (/(automation|workflow|pipeline|devops|deployment)/i.test(text)) return "automation";
  return "general";
}

function isWeakOrCloneProject(project: ResumeProjectPayload): boolean {
  const text = [project.name, project.description, ...(project.bullets ?? [])].filter(Boolean).join(" ").toLowerCase();
  const weakDescription = !project.description || project.description.trim().length < 24;
  const cloneSignals = /(clone|tutorial|practice|basic demo|sample project|learning project)/i.test(text);
  const veryLowSignalBullets = (project.bullets ?? []).filter((bullet) => bullet.trim().length >= 22).length < 2;

  return weakDescription || cloneSignals || veryLowSignalBullets;
}

function typePriorityScore(projectType?: string): number {
  const normalized = String(projectType ?? "other").toLowerCase();
  if (normalized === "freelancing") return 1;
  if (normalized === "internship") return 0.9;
  if (normalized === "fullstack") return 0.8;
  if (normalized === "opensource") return 0.7;
  return 0.5;
}

function computeProjectScore(
  project: ResumeProjectPayload,
  allProjects: ResumeProjectPayload[],
  keywordTargets: KeywordTarget[]
): ProjectScoreCard {
  const projectText = projectSemanticText(project);

  const relevanceMatches = keywordTargets.filter((target) => containsAnyAlias(projectText, target.aliases)).length;
  const relevance = keywordTargets.length > 0
    ? Math.min(1, relevanceMatches / keywordTargets.length)
    : 0.5;

  const strongBullets = (project.bullets ?? []).filter((bullet) => hasNumericMetric(bullet) || hasImpactLanguage(bullet)).length;
  const impact = Math.min(1, strongBullets / 3);

  const techCount = countTechnologies(project);
  const complexitySignals = /(architecture|auth|authorization|realtime|websocket|microservice|pipeline|caching|queue|scalab|performance)/i.test(projectText)
    ? 0.2
    : 0;
  const complexity = Math.max(0, Math.min(1, Math.min(techCount, 8) / 8 + complexitySignals));

  const thisTokens = tokenizeProjectSemantics(project);
  let maxSimilarity = 0;
  for (const peer of allProjects) {
    if (peer === project) continue;
    const peerTokens = tokenizeProjectSemantics(peer);
    maxSimilarity = Math.max(maxSimilarity, jaccardSimilarity(thisTokens, peerTokens));
  }
  const uniqueness = Math.max(0, 1 - maxSimilarity);

  const weightedCore =
    relevance * 0.4 +
    impact * 0.25 +
    complexity * 0.2 +
    uniqueness * 0.15;
  const weighted = Math.round(Math.min(1, weightedCore) * 100);

  return {
    relevance,
    impact,
    complexity,
    uniqueness,
    weighted,
  };
}

function ensureProjectQuality(project: ResumeProjectPayload, seed: number): ResumeProjectPayload | null {
  if (isWeakOrCloneProject(project)) {
    return null;
  }

  const bullets = (project.bullets ?? [])
    .map((bullet, index) => ensureImpactStatement(String(bullet), seed + index))
    .filter(Boolean);

  if (bullets.length < 2) {
    const fallbackBullet = ensureImpactStatement(
      project.description?.trim()
        ? `Implemented ${project.description.trim()}`
        : "Implemented key product capabilities with practical outcomes",
      seed + bullets.length + 1
    );
    bullets.push(fallbackBullet);
  }

  const qualityBullets = bullets.filter((bullet) => hasNumericMetric(bullet) || hasImpactLanguage(bullet));
  if (qualityBullets.length < 2) {
    return null;
  }

  const technologies = String(project.technologies ?? "").trim();
  if (!technologies) {
    return null;
  }

  return {
    ...project,
    bullets,
    technologies,
  };
}

function curateAndSelectProjects(
  resumeData: ResumeDataPayload,
  keywordTargets: KeywordTarget[]
): ResumeDataPayload {
  const projects = (resumeData.projects ?? []).map((project) => ({
    ...project,
    bullets: Array.isArray(project.bullets) ? [...project.bullets] : [],
  }));

  const scored = projects
    .map((project, idx) => {
      const qualified = ensureProjectQuality(project, idx * 7);
      if (!qualified) return null;
      const score = computeProjectScore(qualified, projects, keywordTargets);
      return { project: qualified, score };
    })
    .filter((item): item is { project: ResumeProjectPayload; score: ProjectScoreCard } => Boolean(item))
    .sort((a, b) => {
      if (b.score.weighted !== a.score.weighted) {
        return b.score.weighted - a.score.weighted;
      }
      return typePriorityScore(b.project.type) - typePriorityScore(a.project.type);
    });

  if (scored.length === 0) {
    return {
      ...resumeData,
      projects: [],
    };
  }

  const selected: Array<{ project: ResumeProjectPayload; score: ProjectScoreCard }> = [];
  const archetypes = new Set<string>();

  for (const candidate of scored) {
    if (selected.length >= 5) break;

    const archetype = detectProjectArchetype(candidate.project);
    const duplicateArchetypePenalty = archetypes.has(archetype) && selected.length >= 3;

    const tooSimilar = selected.some((picked) => {
      const a = tokenizeProjectSemantics(candidate.project);
      const b = tokenizeProjectSemantics(picked.project);
      return jaccardSimilarity(a, b) >= 0.7;
    });

    if (tooSimilar) continue;
    if (duplicateArchetypePenalty && candidate.score.weighted < 78) continue;
    if (candidate.score.weighted < 55) continue;

    selected.push(candidate);
    archetypes.add(archetype);
  }

  const minTarget = Math.min(3, scored.length);
  if (selected.length < minTarget) {
    for (const candidate of scored) {
      if (selected.length >= minTarget) break;
      if (selected.some((item) => item.project.name === candidate.project.name)) continue;
      if (candidate.score.weighted < 45) continue;
      selected.push(candidate);
    }
  }

  const finalProjects = selected
    .slice(0, 5)
    .map((item) => {
      const techItems = item.project.technologies
        ?.split(/[|,/]/)
        .map((token) => token.trim())
        .filter(Boolean)
        .slice(0, 8)
        .join(", ");

      return {
        ...item.project,
        technologies: techItems ?? item.project.technologies,
      };
    });

  return {
    ...resumeData,
    projects: finalProjects,
  };
}

function splitTechList(value: string): string[] {
  return value
    .split(/[|,/]/)
    .map((token) => token.trim())
    .filter(Boolean);
}

function inferSkillsFromProjects(resumeData: ResumeDataPayload): ResumeDataPayload {
  const inferredByBucket: Record<string, Set<string>> = {
    frontend: new Set(),
    backend: new Set(),
    database: new Set(),
    tools: new Set(),
    cloud: new Set(),
    languages: new Set(),
    concepts: new Set(),
  };

  for (const project of resumeData.projects ?? []) {
    const technologies = splitTechList(String(project.technologies ?? ""));
    for (const tech of technologies) {
      const bucket = chooseSkillsBucket(tech);
      inferredByBucket[bucket]?.add(tech);
    }

    const text = projectSemanticText(project);
    if (/architecture|system design|modular/i.test(text)) inferredByBucket.concepts.add("Architecture");
    if (/performance|latency|optimization/i.test(text)) inferredByBucket.concepts.add("Performance Optimization");
    if (/scalab|reliab|maintainab/i.test(text)) inferredByBucket.concepts.add("Scalability & Reliability");
  }

  const skills = { ...(resumeData.skills ?? {}) };
  for (const [bucket, values] of Object.entries(inferredByBucket)) {
    if (values.size === 0) continue;
    const existing = splitTechList(String(skills[bucket] ?? ""));
    const existingSet = new Set(existing.map((s) => s.toLowerCase()));
    const inferredCandidates = Array.from(values).filter((item) => !existingSet.has(item.toLowerCase()));
    const addLimit = bucket === "concepts" ? 2 : 2;
    const additions = inferredCandidates.slice(0, addLimit);
    const merged = Array.from(new Set([...existing, ...additions])).slice(0, bucket === "concepts" ? 6 : 12);
    skills[bucket] = merged.join(", ");
  }

  return {
    ...resumeData,
    skills,
  };
}

function ensureMandatorySections(resumeData: ResumeDataPayload, portfolioUrl: string): ResumeDataPayload {
  const contacts = { ...(resumeData.contacts ?? {}) };
  if (!contacts.portfolio && portfolioUrl.trim()) {
    contacts.portfolio = portfolioUrl.trim();
  }

  const achievements = Array.isArray(resumeData.achievements) ? [...resumeData.achievements] : [];
  if (achievements.length === 0 && (resumeData.projects?.length ?? 0) > 0) {
    achievements.push({
      title: `Portfolio projects delivered: ${resumeData.projects?.length ?? 0}+`,
      award: "Hands-on implementation across production-oriented use cases",
      link: "",
    });
  }

  return {
    ...resumeData,
    contacts,
    achievements,
    certificates: Array.isArray(resumeData.certificates) ? [...resumeData.certificates] : [],
    education: Array.isArray(resumeData.education) ? [...resumeData.education] : [],
    projects: Array.isArray(resumeData.projects) ? [...resumeData.projects] : [],
  };
}

function expandProjectDescription(project: ResumeProjectPayload): string {
  const base = String(project.description ?? "").trim();
  const tech = splitTechList(String(project.technologies ?? "")).slice(0, 4).join(", ");
  const sentences = base
    .split(/(?<=[.!?])\s+/)
    .map((part) => part.trim())
    .filter(Boolean);

  const additions: string[] = [];
  if (tech) additions.push(`Technical stack included ${tech} with modular implementation choices.`);
  if (!/architect/i.test(base)) additions.push("Architecture emphasized maintainable components and clean integration boundaries.");
  if (!/perform|scalab|reliab|efficien/i.test(base)) additions.push("Implementation focused on performance, scalability, and reliable user-facing behavior.");

  const merged = [...sentences, ...additions].slice(0, 3);
  return merged.join(" ").trim();
}

function expandProjectBulletsForLowContent(project: ResumeProjectPayload, seed: number): ResumeProjectPayload {
  const bullets = (project.bullets ?? []).map((bullet, idx) => ensureImpactStatement(String(bullet), seed + idx));
  const tech = splitTechList(String(project.technologies ?? "")).slice(0, 4);

  const supplements = [
    tech.length > 0
      ? `Designed service boundaries and integration flow using ${tech.join(", ")} to streamline workflows and reduce complexity.`
      : "Designed architecture decisions to streamline workflows and reduce complexity.",
    "Implemented scalability-minded patterns to improve system efficiency and maintainability under growing usage.",
    "Optimized reliability through structured error handling and resilient integration behavior for better responsiveness.",
  ].map((line, idx) => ensureImpactStatement(line, seed + 20 + idx));

  const merged = Array.from(new Set([...bullets, ...supplements])).slice(0, 5);

  return {
    ...project,
    description: expandProjectDescription(project),
    bullets: merged,
  };
}

function ensureMinimumProjectDepth(
  project: ResumeProjectPayload,
  seed: number,
  minimumBullets: number
): ResumeProjectPayload {
  const targetBullets = Math.max(5, Math.min(6, minimumBullets));

  const baseBullets = (project.bullets ?? [])
    .map((bullet, idx) => ensureImpactStatement(String(bullet), seed + idx))
    .filter(Boolean);

  const tech = splitTechList(String(project.technologies ?? "")).slice(0, 5);
  const techLine = tech.length > 0 ? ` using ${tech.join(", ")}` : "";

  const projectText = [project.description, ...(project.bullets ?? []), project.technologies].filter(Boolean).join(" ").toLowerCase();
  const hasArchitecture = /architect|system design|module|component/i.test(projectText);
  const hasPerformance = /perform|latency|optimi[sz]|responsiv/i.test(projectText);
  const hasScalability = /scalab|reliab|maintainab/i.test(projectText);
  const hasApiDepth = /api|integration|endpoint|request|response/i.test(projectText);

  const selectiveExpansions: string[] = [];
  if (!hasArchitecture) {
    selectiveExpansions.push(`Designed system architecture and module boundaries${techLine} to improve maintainability and long-term scalability.`);
  }
  if (!hasApiDepth) {
    selectiveExpansions.push(`Implemented API integration and data flow orchestration${techLine} to streamline workflows and reduce operational complexity.`);
  }
  if (!hasPerformance) {
    selectiveExpansions.push(`Optimized runtime behavior and request handling${techLine} to enhance user experience and responsiveness under load.`);
  }
  if (!hasScalability) {
    selectiveExpansions.push(`Engineered scalable service patterns and reusable components${techLine} to improve system efficiency and reliability.`);
  }

  // Keep one fallback only when required to hit target bullet count.
  selectiveExpansions.push(`Developed resilient error handling and fallback strategies${techLine} to increase reliability and maintainability across core features.`);

  const expansionPool = selectiveExpansions
    .map((line, idx) => ensureImpactStatement(line, seed + 30 + idx));

  const merged: string[] = [];
  const seen = new Set<string>();
  for (const bullet of [...baseBullets, ...expansionPool]) {
    const key = bullet.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    merged.push(bullet);
    if (merged.length >= targetBullets) break;
  }

  const normalizedDescription = (() => {
    const expanded = expandProjectDescription(project);
    const segments = expanded
      .split(/(?<=[.!?])\s+/)
      .map((part) => part.trim())
      .filter(Boolean);

    const ensured = [...segments];
    if (!/problem|challenge|need/i.test(expanded)) {
      ensured.unshift("Addressed a practical product need by structuring requirements into a reliable technical implementation.");
    }
    if (!/solution|architecture|approach|design/i.test(expanded)) {
      ensured.push("Solution approach emphasized modular architecture and integration-safe design decisions.");
    }
    if (!/result|impact|improv|enhanc|optimiz|scalab|reliab/i.test(expanded)) {
      ensured.push("Result improved usability, scalability, and maintainability for production-like usage scenarios.");
    }

    return ensured.slice(0, 3).join(" ").trim();
  })();

  return {
    ...project,
    description: normalizedDescription,
    bullets: merged.slice(0, targetBullets),
  };
}

function estimateSinglePageLoad(resumeData: ResumeDataPayload): number {
  const projectCount = (resumeData.projects ?? []).length;
  const bulletCount = (resumeData.projects ?? []).reduce(
    (acc, project) => acc + (project.bullets?.filter(Boolean).length ?? 0),
    0
  );
  const descWords = (resumeData.projects ?? []).reduce(
    (acc, project) => acc + String(project.description ?? "").split(/\s+/).filter(Boolean).length,
    0
  );
  const skillTokens = Object.values(resumeData.skills ?? {}).join(",").split(/[,/|]/).map((t) => t.trim()).filter(Boolean).length;
  const certCount = (resumeData.certificates ?? []).filter((c) => c.name?.trim()).length;
  const achieveCount = (resumeData.achievements ?? []).filter((a) => a.title?.trim()).length;
  const eduCount = (resumeData.education ?? []).filter((e) => e.degree?.trim() || e.institution?.trim()).length;

  const load =
    projectCount * 9 +
    bulletCount * 3.5 +
    descWords * 0.18 +
    skillTokens * 0.9 +
    certCount * 2 +
    achieveCount * 1.5 +
    eduCount * 2;

  return Math.round(load);
}

function trimForSinglePage(resumeData: ResumeDataPayload): ResumeDataPayload {
  const projects = (resumeData.projects ?? [])
    .map((project) => ({
      ...project,
      bullets: (project.bullets ?? []).slice(0, 3),
      technologies: splitTechList(String(project.technologies ?? "")).slice(0, 6).join(", "),
    }))
    .slice(0, 5);

  return {
    ...resumeData,
    projects,
    certificates: (resumeData.certificates ?? []).slice(0, 8),
    achievements: (resumeData.achievements ?? []).slice(0, 6),
  };
}

function balanceResumeForSinglePage(
  resumeData: ResumeDataPayload,
  keywordTargets: KeywordTarget[],
  portfolioUrl: string
): ResumeDataPayload {
  let balanced = ensureMandatorySections(inferSkillsFromProjects(resumeData), portfolioUrl);

  // Hard requirement: each project should carry strong depth for dense one-page quality.
  balanced = {
    ...balanced,
    projects: (balanced.projects ?? []).map((project, idx) => ensureMinimumProjectDepth(project, idx * 17, 5)),
  };

  let load = estimateSinglePageLoad(balanced);
  const lowThreshold = 96;
  const highThreshold = 132;

  if (load < lowThreshold) {
    balanced = {
      ...balanced,
      projects: (balanced.projects ?? []).map((project, idx) => ensureMinimumProjectDepth(
        expandProjectBulletsForLowContent(project, idx * 13),
        idx * 19,
        6
      )),
      certificates: balanced.certificates ?? [],
    };
  }

  load = estimateSinglePageLoad(balanced);
  if (load > highThreshold) {
    balanced = trimForSinglePage(balanced);
  }

  // Final curation pass keeps 3-5 strongest projects and preserves JD relevance.
  balanced = curateAndSelectProjects(balanced, keywordTargets);

  // Re-apply minimum depth after curation so selected projects remain expanded.
  balanced = {
    ...balanced,
    projects: (balanced.projects ?? []).map((project, idx) => ensureMinimumProjectDepth(project, idx * 23, 5)),
  };

  return balanced;
}

function computeAtsInsights(
  resumeData: ResumeDataPayload | null,
  hasUserJD: boolean,
  keywordAlignment: KeywordAlignmentResult | null,
  _aiMatchedKeywords: string[],
  _aiMissingKeywords: string[]
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

  const alignedMatched = keywordAlignment?.matchedKeywords ?? [];
  const alignedMissing = keywordAlignment?.missingKeywords ?? [];
  const alignedCoverage = keywordAlignment?.coverageRatio ?? 0;

  const mergedMatched = Array.from(new Set([...alignedMatched]))
    .filter((keyword) => Boolean(keyword && keyword.trim()))
    .slice(0, 14);
  const mergedMissing = Array.from(new Set([...alignedMissing]))
    .filter((k) => !mergedMatched.includes(k))
    .slice(0, 10);

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
  const keywordCoverageScore = Math.round(alignedCoverage * 100);

  const atsScore = hasUserJD
    ? Math.max(
        40,
        Math.min(
          99,
          Math.round(
            normalizedStructure * 0.45 +
              keywordCoverageScore * 0.5 +
              Math.min(5, mergedMatched.length)
          )
        )
      )
    : Math.max(
        38,
        Math.min(
          97,
          Math.round(
            normalizedStructure * 0.5 +
              keywordCoverageScore * 0.4 +
              Math.min(7, projectCount)
          )
        )
      );

  let tip = "Resume is balanced and ATS-friendly.";
  if (projectCount < 4) {
    tip = "Add more portfolio-backed projects for stronger ATS relevance.";
  } else if (mergedMissing.length > 0) {
    tip = `Add missing JD terms naturally: ${mergedMissing.slice(0, 3).join(", ")}.`;
  } else if (skillBuckets < 5) {
    tip = "Expand skills by category (frontend, backend, database, tools, cloud, languages).";
  } else if (keywordCoverageScore < 70) {
    tip = "Increase keyword alignment in skills and project bullets while keeping statements factual.";
  }

  return {
    atsScore,
    matchedKeywords: mergedMatched,
    missingKeywords: mergedMissing,
    tip,
  };
}

function stripCodeFences(value: string): string {
  return value
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

function extractBalancedJsonObject(raw: string): string | null {
  const text = stripCodeFences(raw);
  const firstBrace = text.indexOf("{");
  if (firstBrace === -1) return null;

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = firstBrace; i < text.length; i += 1) {
    const ch = text[i];

    if (escaped) {
      escaped = false;
      continue;
    }

    if (inString) {
      if (ch === "\\") {
        escaped = true;
      } else if (ch === '"') {
        inString = false;
      }
      continue;
    }

    if (ch === '"') {
      inString = true;
      continue;
    }

    if (ch === "{") depth += 1;
    if (ch === "}") depth -= 1;

    if (depth === 0) {
      return text.slice(firstBrace, i + 1);
    }
  }

  return null;
}

function extractJsonWithRegex(raw: string): string | null {
  const text = stripCodeFences(raw);
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  return jsonMatch?.[0] ?? null;
}

function validateAndNormalizeResumeShape(value: unknown): ResumeDataPayload | null {
  if (!value || typeof value !== "object") return null;

  const source = value as ResumeDataPayload;
  const hasProfile = Boolean(source.name?.trim() || source.title?.trim());

  // Required rendering sections for safe UI hydration.
  if (!hasProfile) return null;

  return {
    ...source,
    contacts: source.contacts ?? {},
    skills: source.skills ?? {},
    projects: Array.isArray(source.projects) ? source.projects : [],
    education: Array.isArray(source.education) ? source.education : [],
    certificates: Array.isArray(source.certificates) ? source.certificates : [],
    achievements: Array.isArray(source.achievements) ? source.achievements : [],
  };
}

async function coerceModelOutputToJson(raw: string): Promise<string | null> {
  const repairPrompt = `Convert the following content into STRICT valid JSON only.
Rules:
- Return only a single JSON object.
- No markdown fences.
- No commentary.
- Preserve original facts; do not add new facts.

Content:
"""
${raw.slice(0, 12000)}
"""`;

  const repaired = await callAI(repairPrompt, {
    provider: "groq",
    temperature: 0,
  });

  return extractBalancedJsonObject(repaired);
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

  EXISTING RESUME (base):
  Use ONLY if implicitly available from provided source text. Do not invent missing details.

═══════════════════════════════════════════
PORTFOLIO DATA (deep scraped):
${portfolioContent}

═══════════════════════════════════════════
JOB DESCRIPTION:
${effectiveJobDescription}
═══════════════════════════════════════════

Now generate the perfect resume. Remember: use REAL data from the portfolio only.`;

    const raw = await callAI(prompt, { provider: "groq", temperature: 0.25 });

    let jsonCandidate = extractBalancedJsonObject(raw);
    if (!jsonCandidate) {
      jsonCandidate = await coerceModelOutputToJson(raw);
    }
    if (!jsonCandidate) {
      jsonCandidate = extractJsonWithRegex(raw);
    }

    if (!jsonCandidate) {
      console.error("[build-resume] Unable to isolate JSON from AI response", {
        preview: raw.slice(0, 1500),
      });
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
      parsed = JSON.parse(jsonCandidate);
    } catch {
      try {
        // First parse failed — repair control chars then try again
        parsed = JSON.parse(repairJson(jsonCandidate));
      } catch {
        const regexFallback = extractJsonWithRegex(raw);
        if (!regexFallback) {
          console.error("[build-resume] JSON.parse failed and regex fallback not found", {
            preview: raw.slice(0, 1500),
          });
          throw new Error("AI response parsing failed. Please retry.");
        }

        try {
          parsed = JSON.parse(regexFallback);
        } catch {
          console.error("[build-resume] JSON.parse failed for regex fallback", {
            preview: raw.slice(0, 1500),
          });
          throw new Error("AI response parsing failed. Please retry.");
        }
      }
    }


    const hasUserJD = Boolean(jobDescription?.trim());

    const validResumeData = validateAndNormalizeResumeShape(parsed.resumeData);
    if (!validResumeData) {
      console.error("[build-resume] Parsed JSON missing required resume sections", {
        keys: parsed.resumeData && typeof parsed.resumeData === "object"
          ? Object.keys(parsed.resumeData as Record<string, unknown>)
          : [],
      });
      throw new Error("AI response is missing required resume sections. Please retry.");
    }

    const parsedResumeData = normalizeProjectsWithImpact(
      enrichResumeProjectsFromSource(validResumeData, portfolioContent)
    );

    const initialKeywordAlignment = parsedResumeData
      ? alignResumeKeywords(parsedResumeData, effectiveJobDescription, hasUserJD)
      : null;

    const keywordTargets = extractPrioritizedKeywords(effectiveJobDescription, hasUserJD);

    const curatedResumeData = initialKeywordAlignment?.resumeData
      ? curateAndSelectProjects(
          applyBulletDiversityAndAntiRepetition(initialKeywordAlignment.resumeData),
          keywordTargets
        )
      : parsedResumeData;

    const balancedResumeData = curatedResumeData
      ? balanceResumeForSinglePage(curatedResumeData, keywordTargets, portfolioUrl)
      : null;

    const keywordAlignment = balancedResumeData
      ? alignResumeKeywords(balancedResumeData, effectiveJobDescription, hasUserJD)
      : null;

    const resumeData = keywordAlignment?.resumeData
      ? applyBulletDiversityAndAntiRepetition(keywordAlignment.resumeData)
      : balancedResumeData;

    const aiMatchedKeywords = Array.isArray(parsed.matchedKeywords)
      ? parsed.matchedKeywords.filter((v): v is string => typeof v === "string")
      : [];
    const aiMissingKeywords = Array.isArray(parsed.missingKeywords)
      ? parsed.missingKeywords.filter((v): v is string => typeof v === "string")
      : [];

    const insights = computeAtsInsights(
      resumeData,
      hasUserJD,
      keywordAlignment,
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

import { NextRequest, NextResponse } from "next/server";
import { callAI } from "../../../services/ai.provider";

const GITHUB_LIST_LIMIT = 28;
const GITHUB_DEEP_DETAIL_LIMIT = 8;
const README_CHAR_LIMIT = 320;

type JobTrack = "frontend" | "backend" | "fullstack" | "general";
const PAGE_TEXT_LIMIT = 1800;
const JSON_SNIPPET_LIMIT = 500;
const JSON_SNIPPET_COUNT = 3;
const IMPORTANT_LINK_LIMIT = 10;
const INTERNAL_PAGE_LIMIT = 5;
const PORTFOLIO_CONTENT_LIMIT = 9000;

type ResumeData = {
  name: string;
  title: string;
  contacts: {
    email: string;
    phone: string;
    github: string;
    linkedin: string;
    portfolio: string;
  };
  skills: {
    frontend: string;
    backend: string;
    database: string;
    tools: string;
    languages: string;
    uiux: string;
    cloud: string;
  };
  achievements: Array<{ title: string; award: string; link: string }>;
  certificates: Array<{ name: string; link: string }>;
  projects: Array<{
    name: string;
    type: string;
    category: string;
    dateRange: string;
    description: string;
    bullets: string[];
    technologies: string;
    links: { github: string; live: string; demo: string };
  }>;
  education: Array<{
    degree: string;
    institution: string;
    gpa: string;
    year: string;
    percentage: string;
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
5. Page-filling rules:
   - If few projects: write 4-5 detailed bullets per project expanding what was built and WHY
   - If many projects: write 3-4 strong bullets for top projects, 2 for others
6. USE ALL SCRAPED SOURCES TOGETHER:
   - combine GitHub + portfolio website + LinkedIn URL into one resume
   - do not ignore GitHub repos when a portfolio site is also present
   - LinkedIn is mainly for contacts unless the scraped meta clearly exposes headline text
7. Prefer CONCRETE project/repo names over generic labels:
   - good: "Jobmentum", "MernFolio", "Campus-Hub"
   - bad: "Portfolio Website", "Task Repository", "Experimental Project"
   - if a generic portfolio card and a concrete GitHub repo describe the same work, use the concrete repo/project name
8. When evidence exists for many projects, include at least 5 distinct projects in resumeData.projects. Do not collapse multiple repos into 2-3 generic entries.

PROJECT type MUST be one of: internship | freelancing | fullstack | frontend | backend | opensource | other
Use "frontend" for UI/React/CSS-heavy work; "backend" for APIs/services/data; "fullstack" when both are substantial.

JOB-DRIVEN PROJECT SELECTION (from JOB ALIGNMENT line below):
- frontend: Include mostly frontend + fullstack projects from scraped data; omit or minimize pure backend-only repos.
- backend: Include mostly backend + fullstack projects; omit or minimize pure frontend-only landing pages.
- fullstack: Balance frontend, backend, and fullstack projects.
- general: Use normal priority below.

PROJECT PRIORITY (sort output in this order, most detail for high priority):
  1. type=internship → 4-5 bullets, all links, full description
  2. type=freelancing → 4-5 bullets, all links, full description
  3. type=fullstack → 3-4 bullets
  4. type=frontend or type=backend → 3-4 bullets when they match JOB ALIGNMENT
  5. type=opensource → 2-3 bullets
  6. type=other → 2 bullets (CSS clones, practice, API integrations)

SELECTION RULES:
- Deduplicate obvious duplicates across sources, but keep distinct projects separate.
- Prefer entries that have concrete technologies, repo URLs, live URLs, README summaries, or portfolio descriptions.
- If GitHub repos provide better names/details than the website, use the GitHub-derived names/details.
- Preserve every user-supplied contact URL exactly in contacts.

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
        "type": "fullstack",
        "category": "FULLSTACK PROJECT",
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
  "tip": ""
}`;

// ─── Job track + GitHub repo alignment ─────────────────────────────────────

function inferJobTrack(jobDescription: string): JobTrack {
  const t = jobDescription.toLowerCase();
  const fs =
    /\b(full[\s-]?stack|fullstack|mern|mean|mevn|t-?shaped)\b/.test(t) ||
    (/\bfrontend\b|\bfront[\s-]?end\b/.test(t) && /\bbackend\b|\bback[\s-]?end\b/.test(t));

  const fe =
    /\b(frontend|front[\s-]?end|react|vue\.?js|angular|svelte|next\.?js|nuxt|css|sass|tailwind|ui\/ux|user interface|web designer|typescript\s*\(?\s*for\s+ui)\b/.test(
      t
    );
  const be =
    /\b(backend|back[\s-]?end|api\s+developer|microservices|django|flask|fastapi|spring\s+boot|express\.?js|graphql\s+api|kafka|kubernetes|systems?\s+engineer|devops\s+engineer)\b/.test(
      t
    );

  if (fs) return "fullstack";
  if (fe && !be) return "frontend";
  if (be && !fe) return "backend";
  if (fe && be) return "fullstack";
  return "general";
}

type GitHubRepoListItem = {
  name: string;
  description?: string;
  language?: string;
  stargazers_count?: number;
  forks_count?: number;
  topics?: string[];
  homepage?: string;
  html_url?: string;
  updated_at?: string;
};

function repoActivityScore(r: GitHubRepoListItem): number {
  return (
    (r.stargazers_count ?? 0) * 3 +
    (r.forks_count ?? 0) * 2 +
    new Date(r.updated_at ?? 0).getTime() / 1e12
  );
}

function quickClassifyRepo(repo: GitHubRepoListItem): "frontend" | "backend" | "fullstack" | "other" {
  const blob = [
    repo.name ?? "",
    repo.description ?? "",
    repo.language ?? "",
    ...(Array.isArray(repo.topics) ? repo.topics : []),
  ]
    .join(" ")
    .toLowerCase();

  const feHints =
    /react|vue|angular|svelte|next\.?js|nuxt|gatsby|tailwind|webpack|vite|framer|css|html5|sass|scss|redux|zustand|chakra|mui|material-?ui|shadcn|frontend|ui\b|component library|three\.js|d3\.js/.test(
      blob
    );
  const beHints =
    /django|flask|fastapi|spring|laravel|rails|express|nestjs|graphql|microservice|kafka|redis|postgres|mongodb|prisma|sequelize|typeorm|kubernetes|terraform|aws lambda|serverless|grpc|rest api|backend/.test(
      blob
    );

  const lang = (repo.language ?? "").trim();
  const feLang = /^(JavaScript|TypeScript|HTML|CSS|Vue)$/i.test(lang);
  const beLang = /^(Python|Go|Java|Rust|PHP|Ruby|C\+\+|C#|Kotlin|Scala|Swift)$/i.test(lang);

  if (feHints && beHints) return "fullstack";
  if (feHints) return feLang || !beLang ? "frontend" : "fullstack";
  if (beHints) return "backend";
  if (feLang && !beLang) return "frontend";
  if (beLang && !feLang) return "backend";
  if (lang && /TypeScript|JavaScript/i.test(lang) && !beHints && !feHints) return "other";
  return "other";
}

function selectReposForTrack(
  repos: GitHubRepoListItem[],
  track: JobTrack
): GitHubRepoListItem[] {
  const sorted = [...repos].sort((a, b) => repoActivityScore(b) - repoActivityScore(a));
  const classified = sorted.map((r) => ({
    repo: r,
    segment: quickClassifyRepo(r),
  }));

  const matchesTrack = (segment: string) => {
    if (track === "general") return true;
    if (track === "fullstack") return true;
    if (track === "frontend") return segment === "frontend" || segment === "fullstack";
    if (track === "backend") return segment === "backend" || segment === "fullstack";
    return true;
  };

  const primary = classified.filter((c) => matchesTrack(c.segment)).map((c) => c.repo);
  let picked = primary.slice(0, GITHUB_DEEP_DETAIL_LIMIT);

  if (picked.length < 3) {
    const primarySet = new Set(picked.map((p) => p.name));
    const fallback = sorted.filter((r) => !primarySet.has(r.name));
    picked = [...picked, ...fallback].slice(0, GITHUB_DEEP_DETAIL_LIMIT);
  }

  return picked;
}

function parseGithubUsername(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  try {
    const u = new URL(trimmed.startsWith("http") ? trimmed : `https://${trimmed}`);
    if (u.hostname.replace(/^www\./, "") !== "github.com") return null;
    const parts = u.pathname.replace(/^\/+|\/+$/g, "").split("/").filter(Boolean);
    if (parts.length === 0) return null;
    const first = parts[0];
    const reserved = new Set([
      "settings",
      "topics",
      "explore",
      "marketplace",
      "orgs",
      "sponsors",
      "login",
      "signup",
    ]);
    if (reserved.has(first.toLowerCase())) return null;
    return first;
  } catch {
    return null;
  }
}

function normalizeHttpUrl(raw: string): string {
  const t = raw.trim();
  if (!t) return t;
  if (/^https?:\/\//i.test(t)) return t;
  return `https://${t}`;
}

// ─── Deep GitHub Scraper ──────────────────────────────────────────────────

async function deepScrapeGitHub(username: string, jobTrack: JobTrack): Promise<string> {
  const headers = {
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "HireLens-ResumeBuilder/1.0",
  };

  try {
    // 1. Fetch user profile
    const userRes = await fetch(`https://api.github.com/users/${username}`, { headers });
    if (!userRes.ok) throw new Error(`GitHub user not found: ${username}`);
    const user = await userRes.json();

    // 2. Fetch repos (single page), rank, then filter by job description track
    const reposRes = await fetch(
      `https://api.github.com/users/${username}/repos?sort=updated&per_page=30&type=public`,
      { headers }
    );
    const allRepos = reposRes.ok ? await reposRes.json() : [];

    const sortedRepos = Array.isArray(allRepos)
      ? [...allRepos].sort((a, b) => repoActivityScore(b) - repoActivityScore(a)).slice(0, GITHUB_LIST_LIMIT)
      : [];

    const selectedRepos = selectReposForTrack(sortedRepos, jobTrack);

    const trackNote =
      jobTrack === "frontend"
        ? "Repos below were prioritized for FRONTEND / FULL-STACK fit vs the job description."
        : jobTrack === "backend"
          ? "Repos below were prioritized for BACKEND / FULL-STACK fit vs the job description."
          : jobTrack === "fullstack"
            ? "Repos emphasize full-stack or mixed stacks vs the job description."
            : "Repos are ranked by activity; no strict FE/BE filter.";

    // 3. Deep-fetch each selected repo: README + languages
    const repoDetails = await Promise.all(
      selectedRepos.map(async (repo: GitHubRepoListItem) => {
        const [readmeRes, langsRes] = await Promise.all([
          fetch(`https://api.github.com/repos/${username}/${repo.name}/readme`, {
            headers: { ...headers, Accept: "application/vnd.github.v3.raw" },
          }),
          fetch(`https://api.github.com/repos/${username}/${repo.name}/languages`, { headers }),
        ]);

        let readme = "";
        if (readmeRes.ok) {
          const raw = await readmeRes.text();
          // Keep README context short enough for the request budget.
          readme = raw
            .replace(/!\[.*?\]\(.*?\)/g, "") // remove images
            .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // links → text
            .replace(/#{1,6}\s/g, "") // remove headings #
            .replace(/\*\*/g, "").replace(/\*/g, "") // remove bold/italic
            .replace(/`{1,3}[^`]*`{1,3}/g, "") // remove code
            .replace(/\n{3,}/g, "\n\n")
            .trim()
            .slice(0, README_CHAR_LIMIT);
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

    // 4. Format the full portfolio content
    const repoSections = repoDetails.map((r) => {
      const seg = quickClassifyRepo({
        name: r.name,
        description: r.description,
        language: r.languages.split(",")[0]?.trim(),
        topics: r.topics ? r.topics.split(/,\s*/) : [],
      });
      const lines = [
        `PROJECT: ${r.name}`,
        `  HireLens segment: ${seg} (use for job alignment)`,
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

JOB ALIGNMENT NOTE: ${trackNote}

TOP REPOSITORIES (Detailed, filtered for this role where possible)
══════════════════════════════════════════
${repoSections}
`.trim();
  } catch (err) {
    throw new Error(err instanceof Error ? err.message : "GitHub scraping failed.");
  }
}

// ─── Generic Portfolio Scraper ────────────────────────────────────────────

async function fetchPortfolioPage(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; HireLens-Resume/1.0)" },
    signal: AbortSignal.timeout(10000),
  });

  if (!res.ok) throw new Error(`Could not fetch portfolio page: ${res.status}`);

  return res.text();
}

function pickMetaValue(html: string, pattern: RegExp): string {
  return html.match(pattern)?.[1]?.trim() ?? "";
}

function stripHtmlToText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<svg[\s\S]*?<\/svg>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function extractJsonSnippets(html: string): string {
  const scriptBlocks = [
    ...Array.from(
      html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)
    ),
    ...Array.from(
      html.matchAll(/<script[^>]+id=["']__NEXT_DATA__["'][^>]*>([\s\S]*?)<\/script>/gi)
    ),
    ...Array.from(
      html.matchAll(/<script[^>]+type=["']application\/json["'][^>]*>([\s\S]*?)<\/script>/gi)
    ),
  ];

  return scriptBlocks
    .map(([, raw]) => raw.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .slice(0, JSON_SNIPPET_COUNT)
    .map((snippet, index) => `JSON ${index + 1}: ${snippet.slice(0, JSON_SNIPPET_LIMIT)}`)
    .join("\n");
}

function extractImportantLinks(html: string, baseUrl: URL): string[] {
  const seen = new Set<string>();
  const links = Array.from(
    html.matchAll(/href=["']([^"'#\s]+)["']/gi)
  )
    .map(([, href]) => href.trim())
    .filter(Boolean)
    .map((href) => {
      try {
        return new URL(href, baseUrl).toString();
      } catch {
        return "";
      }
    })
    .filter(Boolean)
    .filter((href) => {
      if (seen.has(href)) return false;
      seen.add(href);
      return true;
    });

  return links;
}

function extractPriorityInternalLinks(html: string, baseUrl: URL): string[] {
  const keywords = [
    "project",
    "work",
    "experience",
    "about",
    "resume",
    "cv",
    "skills",
    "contact",
    "education",
    "achievement",
    "certification",
  ];

  return extractImportantLinks(html, baseUrl)
    .filter((href) => {
      try {
        const candidate = new URL(href);
        return candidate.origin === baseUrl.origin;
      } catch {
        return false;
      }
    })
    .filter((href) => keywords.some((keyword) => href.toLowerCase().includes(keyword)))
    .slice(0, INTERNAL_PAGE_LIMIT);
}

function summarizePage(html: string, url: string): string {
  const title = pickMetaValue(html, /<title[^>]*>([\s\S]*?)<\/title>/i);
  const description =
    pickMetaValue(html, /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i) ||
    pickMetaValue(html, /<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i);
  const ogTitle = pickMetaValue(html, /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i);
  const keywords = pickMetaValue(html, /<meta[^>]+name=["']keywords["'][^>]+content=["']([^"']+)["']/i);
  const jsonSnippets = extractJsonSnippets(html);
  const importantLinks = extractImportantLinks(html, new URL(url))
    .filter((href) =>
      /github\.com|linkedin\.com|mailto:|resume|cv|project|portfolio|vercel\.app|netlify\.app/i.test(href)
    )
    .slice(0, IMPORTANT_LINK_LIMIT)
    .join("\n");
  const text = stripHtmlToText(html).slice(0, PAGE_TEXT_LIMIT);

  return [
    `PAGE: ${url}`,
    title ? `Title: ${title}` : "",
    ogTitle ? `OpenGraph Title: ${ogTitle}` : "",
    description ? `Description: ${description}` : "",
    keywords ? `Keywords: ${keywords}` : "",
    importantLinks ? `Important Links:\n${importantLinks}` : "",
    jsonSnippets ? `Hydration/Structured JSON:\n${jsonSnippets}` : "",
    text ? `Visible Text:\n${text}` : "",
  ]
    .filter(Boolean)
    .join("\n\n");
}

async function scrapeGenericPortfolio(url: string): Promise<string> {
  const rootUrl = new URL(url);
  const homepageHtml = await fetchPortfolioPage(rootUrl.toString());
  const internalLinks = extractPriorityInternalLinks(homepageHtml, rootUrl);
  const pageSummaries = [summarizePage(homepageHtml, rootUrl.toString())];

  for (const link of internalLinks) {
    try {
      const html = await fetchPortfolioPage(link);
      pageSummaries.push(summarizePage(html, link));
    } catch {
      // Ignore individual page fetch failures and continue with the rest.
    }
  }

  return [
    `PORTFOLIO WEBSITE CONTENT (${url}):`,
    `Crawled Pages: ${1 + internalLinks.length}`,
    ...pageSummaries,
  ]
    .filter(Boolean)
    .join("\n\n")
    .slice(0, PORTFOLIO_CONTENT_LIMIT);
}

async function scrapeLinkedInProfileHint(url: string): Promise<string> {
  const normalized = normalizeHttpUrl(url);
  try {
    const res = await fetch(normalized, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; HireLens-Resume/1.0)" },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) {
      return [
        "LINKEDIN PROFILE",
        `URL (use exactly in contacts.linkedin): ${normalized}`,
        `(Live preview unavailable: HTTP ${res.status}. Do not invent profile details.)`,
      ].join("\n");
    }
    const html = await res.text();
    const title =
      pickMetaValue(html, /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i) ||
      pickMetaValue(html, /<title[^>]*>([\s\S]*?)<\/title>/i);
    const desc =
      pickMetaValue(html, /<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i) ||
      pickMetaValue(html, /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i);
    return [
      "LINKEDIN PROFILE (public meta only)",
      `URL (use exactly in contacts.linkedin): ${normalized}`,
      title ? `Title: ${title}` : "",
      desc ? `Summary: ${desc}` : "",
      "Do not fabricate employers, dates, or skills not evidenced elsewhere in scraped data.",
    ]
      .filter(Boolean)
      .join("\n");
  } catch {
    return [
      "LINKEDIN PROFILE",
      `URL (use exactly in contacts.linkedin): ${normalized}`,
      "(Could not fetch preview; still include URL in resume contacts.)",
    ].join("\n");
  }
}

function isValidOptionalUrl(val: string): boolean {
  if (!val.trim()) return true;
  try {
    const u = new URL(normalizeHttpUrl(val));
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

async function assembleScrapedPortfolioContent(params: {
  portfolioUrl: string;
  githubUrl: string;
  linkedinUrl: string;
  jobTrack: JobTrack;
}): Promise<string> {
  const blocks: string[] = [];
  const seenGh = new Set<string>();

  const explicitUser = parseGithubUsername(params.githubUrl);
  if (explicitUser) {
    blocks.push(await deepScrapeGitHub(explicitUser, params.jobTrack));
    seenGh.add(explicitUser.toLowerCase());
  }

  if (params.portfolioUrl.trim()) {
    const portfolioNorm = normalizeHttpUrl(params.portfolioUrl.trim());
    const portfolioUser = parseGithubUsername(portfolioNorm);
    if (portfolioUser) {
      if (!seenGh.has(portfolioUser.toLowerCase())) {
        blocks.push(await deepScrapeGitHub(portfolioUser, params.jobTrack));
        seenGh.add(portfolioUser.toLowerCase());
      }
    } else {
      blocks.push(await scrapeGenericPortfolio(portfolioNorm));
    }
  }

  if (params.linkedinUrl.trim()) {
    blocks.push(await scrapeLinkedInProfileHint(params.linkedinUrl.trim()));
  }

  return blocks.join("\n\n═══════════════ NEXT SOURCE ═══════════════\n\n");
}

function mergeContactsFromUserInput(
  data: ResumeData | null,
  urls: { portfolioUrl: string; githubUrl: string; linkedinUrl: string }
): ResumeData | null {
  if (!data) return null;
  if (urls.githubUrl.trim()) {
    data.contacts.github = normalizeHttpUrl(urls.githubUrl.trim());
  }
  if (urls.linkedinUrl.trim()) {
    data.contacts.linkedin = normalizeHttpUrl(urls.linkedinUrl.trim());
  }
  if (urls.portfolioUrl.trim()) {
    data.contacts.portfolio = normalizeHttpUrl(urls.portfolioUrl.trim());
  }
  return data;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function asString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter(Boolean);
}

function normalizeResumeData(value: unknown): ResumeData | null {
  const record = asRecord(value);
  if (!record) return null;

  const contacts = asRecord(record.contacts);
  const skills = asRecord(record.skills);

  return {
    name: asString(record.name),
    title: asString(record.title),
    contacts: {
      email: asString(contacts?.email),
      phone: asString(contacts?.phone),
      github: asString(contacts?.github),
      linkedin: asString(contacts?.linkedin),
      portfolio: asString(contacts?.portfolio),
    },
    skills: {
      frontend: asString(skills?.frontend),
      backend: asString(skills?.backend),
      database: asString(skills?.database),
      tools: asString(skills?.tools),
      languages: asString(skills?.languages),
      uiux: asString(skills?.uiux),
      cloud: asString(skills?.cloud),
    },
    achievements: Array.isArray(record.achievements)
      ? record.achievements
          .map((item) => {
            const achievement = asRecord(item);
            if (!achievement) return null;
            const title = asString(achievement.title);
            if (!title) return null;
            return {
              title,
              award: asString(achievement.award),
              link: asString(achievement.link),
            };
          })
          .filter((item): item is ResumeData["achievements"][number] => Boolean(item))
      : [],
    certificates: Array.isArray(record.certificates)
      ? record.certificates
          .map((item) => {
            const certificate = asRecord(item);
            if (!certificate) return null;
            const name = asString(certificate.name);
            if (!name) return null;
            return {
              name,
              link: asString(certificate.link),
            };
          })
          .filter((item): item is ResumeData["certificates"][number] => Boolean(item))
      : [],
    projects: Array.isArray(record.projects)
      ? record.projects
          .map((item) => {
            const project = asRecord(item);
            if (!project) return null;
            const links = asRecord(project.links);
            const name = asString(project.name);
            if (!name) return null;
            return {
              name,
              type: asString(project.type) || "other",
              category: asString(project.category),
              dateRange: asString(project.dateRange),
              description: asString(project.description),
              bullets: asStringArray(project.bullets),
              technologies: asString(project.technologies),
              links: {
                github: asString(links?.github),
                live: asString(links?.live),
                demo: asString(links?.demo),
              },
            };
          })
          .filter((item): item is ResumeData["projects"][number] => Boolean(item))
      : [],
    education: Array.isArray(record.education)
      ? record.education
          .map((item) => {
            const education = asRecord(item);
            if (!education) return null;
            const degree = asString(education.degree);
            const institution = asString(education.institution);
            if (!degree && !institution) return null;
            return {
              degree,
              institution,
              gpa: asString(education.gpa),
              year: asString(education.year),
              percentage: asString(education.percentage),
            };
          })
          .filter((item): item is ResumeData["education"][number] => Boolean(item))
      : [],
  };
}

// ─── Main Route ──────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      portfolioUrl = "",
      githubUrl = "",
      linkedinUrl = "",
      jobDescription,
      templateId = "classic",
    } = body as {
      portfolioUrl?: string;
      githubUrl?: string;
      linkedinUrl?: string;
      jobDescription: string;
      templateId?: string;
    };

    const portfolioTrim = (portfolioUrl ?? "").trim();
    const githubTrim = (githubUrl ?? "").trim();
    const linkedinTrim = (linkedinUrl ?? "").trim();

    if (!portfolioTrim && !githubTrim) {
      return NextResponse.json(
        {
          error:
            "Provide a portfolio website URL and/or a GitHub profile URL (at least one is required).",
        },
        { status: 400 }
      );
    }

    if (!jobDescription?.trim()) {
      return NextResponse.json(
        { error: "Job description is required." },
        { status: 400 }
      );
    }

    if (jobDescription.trim().length < 50) {
      return NextResponse.json(
        { error: "Job description must be at least 50 characters." },
        { status: 400 }
      );
    }

    for (const [label, u] of [
      ["Portfolio", portfolioTrim],
      ["GitHub", githubTrim],
      ["LinkedIn", linkedinTrim],
    ] as const) {
      if (u && !isValidOptionalUrl(u)) {
        return NextResponse.json({ error: `${label} URL is not valid.` }, { status: 400 });
      }
    }

    if (linkedinTrim && !/linkedin\.com\/(in|company|pub)\//i.test(normalizeHttpUrl(linkedinTrim))) {
      return NextResponse.json(
        { error: "LinkedIn URL should be a profile link on linkedin.com (e.g. …/in/username)." },
        { status: 400 }
      );
    }

    const jobTrack = inferJobTrack(jobDescription.trim());

    const portfolioContent = await assembleScrapedPortfolioContent({
      portfolioUrl: portfolioTrim,
      githubUrl: githubTrim,
      linkedinUrl: linkedinTrim,
      jobTrack,
    });

    const ghDisplay = githubTrim ? normalizeHttpUrl(githubTrim) : "not provided";
    const liDisplay = linkedinTrim ? normalizeHttpUrl(linkedinTrim) : "not provided";
    const pfDisplay = portfolioTrim ? normalizeHttpUrl(portfolioTrim) : "not provided";

    // Build the final prompt with template format
    const templateFormat = TEMPLATE_FORMATS[templateId] ?? TEMPLATE_FORMATS.classic;

    const prompt = `${BASE_PROMPT}

TEMPLATE FORMAT TO USE:
${templateFormat}

═══════════════════════════════════════════
JOB ALIGNMENT (derived from job description): ${jobTrack.toUpperCase()}
═══════════════════════════════════════════

USER-SUPPLIED PROFILE URLS — copy EXACTLY into resumeData.contacts (do not drop):
- contacts.portfolio: ${pfDisplay}
- contacts.github: ${ghDisplay}
- contacts.linkedin: ${liDisplay}
(Use empty string "" only if that line says "not provided".)

═══════════════════════════════════════════
PORTFOLIO DATA (scraped — may include multiple sections):
${portfolioContent}

═══════════════════════════════════════════
JOB DESCRIPTION:
${jobDescription.trim()}
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


    const normalized = normalizeResumeData(parsed.resumeData);
    const resumeData = mergeContactsFromUserInput(normalized, {
      portfolioUrl: portfolioTrim,
      githubUrl: githubTrim,
      linkedinUrl: linkedinTrim,
    });

    return NextResponse.json({
      resumeData,
      atsScore: Math.min(100, Math.max(0, Number(parsed.atsScore) || 70)),
      matchedKeywords: Array.isArray(parsed.matchedKeywords) ? parsed.matchedKeywords.slice(0, 12) : [],
      missingKeywords: Array.isArray(parsed.missingKeywords) ? parsed.missingKeywords.slice(0, 8) : [],
      tip: asString(parsed.tip),
      templateId,
      jobAlignment: jobTrack,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Build failed." },
      { status: 500 }
    );
  }
}

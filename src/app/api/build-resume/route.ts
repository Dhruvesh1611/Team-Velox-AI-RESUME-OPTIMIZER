import { NextRequest, NextResponse } from "next/server";
import { callAI } from "../../../services/ai.provider";

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

PROJECT PRIORITY (sort output in this order, most detail for high priority):
  1. type=internship → 4-5 bullets, all links, full description
  2. type=freelancing → 4-5 bullets, all links, full description
  3. type=fullstack → 3-4 bullets
  4. type=opensource → 2-3 bullets
  5. type=other → 2 bullets (CSS clones, practice, API integrations)

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
  "tip": ""
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

    // 2. Fetch all repos (up to 30, sorted by updated)
    const reposRes = await fetch(
      `https://api.github.com/users/${username}/repos?sort=updated&per_page=30&type=public`,
      { headers }
    );
    const allRepos = reposRes.ok ? await reposRes.json() : [];

    // 3. Get top 8 repos (pinned first if we can detect them, then by stars + recent)
    const sortedRepos = Array.isArray(allRepos)
      ? [...allRepos].sort((a, b) => {
          const score = (r: { stargazers_count: number; forks_count: number; updated_at: string }) =>
            r.stargazers_count * 3 + r.forks_count * 2 + (new Date(r.updated_at).getTime() / 1e12);
          return score(b) - score(a);
        }).slice(0, 8)
      : [];

    // 4. Deep-fetch each top repo: README + languages
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
          // Extract the first 600 chars of README (most meaningful part)
          readme = raw
            .replace(/!\[.*?\]\(.*?\)/g, "") // remove images
            .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // links → text
            .replace(/#{1,6}\s/g, "") // remove headings #
            .replace(/\*\*/g, "").replace(/\*/g, "") // remove bold/italic
            .replace(/`{1,3}[^`]*`{1,3}/g, "") // remove code
            .replace(/\n{3,}/g, "\n\n")
            .trim()
            .slice(0, 600);
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
`.trim();
  } catch (err) {
    throw new Error(err instanceof Error ? err.message : "GitHub scraping failed.");
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

  const text = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<nav[\s\S]*?<\/nav>/gi, "")
    .replace(/<footer[\s\S]*?<\/footer>/gi, "")
    .replace(/<header[\s\S]*?<\/header>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 5000);

  return `PORTFOLIO WEBSITE CONTENT (${url}):\n\n${text}`;
}

// ─── Main Route ──────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { portfolioUrl, jobDescription, templateId = "classic" } = body as {
      portfolioUrl: string;
      jobDescription: string;
      templateId?: string;
    };

    if (!portfolioUrl?.trim() || !jobDescription?.trim()) {
      return NextResponse.json(
        { error: "Both portfolio URL and job description are required." },
        { status: 400 }
      );
    }

    if (jobDescription.trim().length < 50) {
      return NextResponse.json(
        { error: "Job description must be at least 50 characters." },
        { status: 400 }
      );
    }

    // Deep scrape based on URL type
    let portfolioContent: string;
    const githubMatch = portfolioUrl.trim().match(/github\.com\/([^\/\?#]+)\/?$/);

    if (githubMatch) {
      portfolioContent = await deepScrapeGitHub(githubMatch[1]);
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


    return NextResponse.json({
      resumeData: parsed.resumeData ?? null,
      atsScore: Math.min(100, Math.max(0, Number(parsed.atsScore) || 70)),
      matchedKeywords: Array.isArray(parsed.matchedKeywords) ? parsed.matchedKeywords.slice(0, 12) : [],
      missingKeywords: Array.isArray(parsed.missingKeywords) ? parsed.missingKeywords.slice(0, 8) : [],
      tip: parsed.tip ?? "",
      templateId,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Build failed." },
      { status: 500 }
    );
  }
}

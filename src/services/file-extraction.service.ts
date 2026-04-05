import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import mammoth from "mammoth";

// Polyfill missing DOM classes for pdf-parse in headless Node environments
// Try to load @napi-rs/canvas if available, otherwise use minimal stubs
try {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const canvas = require("@napi-rs/canvas") as any;
  if (typeof globalThis.DOMMatrix === "undefined") {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).DOMMatrix = canvas.DOMMatrix;
  }
  if (typeof globalThis.ImageData === "undefined") {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).ImageData = canvas.ImageData;
  }
  if (typeof globalThis.Path2D === "undefined") {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).Path2D = canvas.Path2D;
  }
} catch {
  // Canvas not available on Vercel; pdf-parse will work with native text extraction
  // but may not render fonts. That's okay—we only need text, not rendering.
}

const execFileAsync = promisify(execFile);

type ParsedDataUrl = {
  mimeType: string;
  buffer: Buffer;
};

function inferMimeTypeFromFileName(fileName?: string): string {
  const lower = fileName?.toLowerCase() ?? "";
  if (lower.endsWith(".pdf")) return "application/pdf";
  if (lower.endsWith(".docx")) {
    return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  }
  if (lower.endsWith(".doc")) return "application/msword";
  if (lower.endsWith(".txt")) return "text/plain";
  return "application/octet-stream";
}

function parseDataUrl(dataUrl: string, fileName?: string): ParsedDataUrl {
  const match = dataUrl.match(/^data:([^;,]+)?(?:;charset=[^;,]+)?;base64,(.+)$/);

  if (!match) {
    throw new Error("Unsupported upload format. Expected a base64 data URL.");
  }

  const declaredMimeType = (match[1] ?? "").toLowerCase();
  const inferredMimeType = inferMimeTypeFromFileName(fileName);

  return {
    mimeType:
      !declaredMimeType ||
      declaredMimeType === "application/octet-stream" ||
      declaredMimeType === "binary/octet-stream"
        ? inferredMimeType
        : declaredMimeType,
    buffer: Buffer.from(match[2], "base64"),
  };
}

function normalizeExtractedText(text: string): string {
  return text
    .replace(/\0/g, " ")
    .replace(/\r/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[^\S\n]{2,}/g, " ")
    .trim();
}

function looksLikeBinaryPdfPayload(text: string): boolean {
  const sample = text.slice(0, 1200);
  if (!sample) return false;

  return (
    sample.includes("%PDF-") ||
    /\/Type\s*\/Page/.test(sample) ||
    /endobj/.test(sample) ||
    /stream[\s\S]*endstream/.test(sample)
  );
}

async function writeTempFile(buffer: Buffer, extension: string): Promise<string> {
  const tempPath = join(tmpdir(), `hirelens-${randomUUID()}${extension}`);
  await fs.writeFile(tempPath, buffer);
  return tempPath;
}

async function extractWithTextutil(filePath: string): Promise<string> {
  const { stdout } = await execFileAsync("/usr/bin/textutil", [
    "-convert",
    "txt",
    "-stdout",
    filePath,
  ]);

  return normalizeExtractedText(stdout);
}

async function extractPdfText(buffer: Buffer): Promise<string> {
  const require = createRequire(import.meta.url);

  // Suppress pdfjs-dist warnings in Vercel environment
  const originalWarn = console.warn;
  const originalError = console.error;
  const suppressedWarnings: string[] = [];

  try {
    // Temporarily suppress warnings about missing canvas during pdf-parse
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    console.warn = (...args: any[]) => {
      const msg = args.join(" ");
      if (!msg.includes("Cannot load") && !msg.includes("Cannot polyfill")) {
        originalWarn(...args);
      } else {
        suppressedWarnings.push(msg);
      }
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    console.error = (...args: any[]) => {
      const msg = args.join(" ");
      if (!msg.includes("Cannot load") && !msg.includes("Cannot polyfill")) {
        originalError(...args);
      } else {
        suppressedWarnings.push(msg);
      }
    };

    const { PDFParse } = require("pdf-parse") as {
      PDFParse: new (options: { data: Buffer | Uint8Array }) => {
        getText: () => Promise<{ text?: string }>;
        destroy: () => Promise<void>;
      };
    };

    let parser: InstanceType<typeof PDFParse> | null = null;

    try {
      parser = new PDFParse({ data: buffer });
      const parsed = await parser.getText();
      const normalized = normalizeExtractedText(parsed.text ?? "");
      if (normalized && !looksLikeBinaryPdfPayload(normalized)) {
        return normalized;
      }
    } finally {
      await parser?.destroy().catch(() => undefined);
    }
  } catch (err) {
    console.error("pdf-parse extraction error:", err instanceof Error ? err.message : String(err));
  } finally {
    console.warn = originalWarn;
    console.error = originalError;
  }

  // macOS-specific fallback
  if (process.platform === "darwin") {
    const filePath = await writeTempFile(buffer, ".pdf");
    try {
      const { stdout } = await execFileAsync("/usr/bin/mdls", [
        "-raw",
        "-name",
        "kMDItemTextContent",
        filePath,
      ]);
      const normalized = normalizeExtractedText(
        stdout.replace(/^\(null\)$/i, "").trim()
      );
      if (normalized && !looksLikeBinaryPdfPayload(normalized)) {
        return normalized;
      }
    } catch {
      // fall through
    } finally {
      await fs.unlink(filePath).catch(() => undefined);
    }
  }

  throw new Error("Could not extract readable text from this PDF.");
}

async function extractDocxText(buffer: Buffer): Promise<string> {
  const result = await mammoth.extractRawText({ buffer });
  const text = normalizeExtractedText(result.value ?? "");
  if (!text) {
    throw new Error("The uploaded document could not be converted into readable text.");
  }
  return text;
}

function extensionForMimeType(mimeType: string): string {
  if (mimeType === "application/pdf") return ".pdf";
  if (mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") return ".docx";
  if (mimeType === "application/msword") return ".doc";
  if (mimeType === "text/plain") return ".txt";
  return ".bin";
}

export async function extractTextFromUpload(dataUrl: string, fileName?: string): Promise<string> {
  const { mimeType, buffer } = parseDataUrl(dataUrl, fileName);

  if (mimeType === "text/plain") {
    const text = normalizeExtractedText(buffer.toString("utf8"));
    if (!text) {
      throw new Error("The uploaded document could not be converted into readable text.");
    }
    return text;
  }

  if (mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
    return extractDocxText(buffer);
  }

  if (mimeType === "application/pdf") {
    const text = await extractPdfText(buffer);
    if (!text || looksLikeBinaryPdfPayload(text)) {
      throw new Error("Could not extract readable text from this PDF.");
    }
    return text;
  }

  if (mimeType === "application/msword") {
    if (process.platform === "darwin") {
      const tempPath = await writeTempFile(buffer, extensionForMimeType(mimeType));
      try {
        const text = await extractWithTextutil(tempPath);
        if (!text) {
          throw new Error("The uploaded document could not be converted into readable text.");
        }
        return text;
      } finally {
        await fs.unlink(tempPath).catch(() => undefined);
      }
    }
    throw new Error(
      "Legacy .doc files are not supported on this server. Please save as PDF or DOCX and upload again."
    );
  }

  throw new Error(`Unsupported file type: ${mimeType}`);
}

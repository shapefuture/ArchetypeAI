import { marked } from 'marked';
import DOMPurify from 'dompurify';

/**
 * Normalises the AI-written 8-section analysis into proper markdown before
 * handing it to `marked`. Two safety nets are applied:
 *
 *   1. NUMBERED-SECTION FALLBACK. The AI is told to use '## Title' and
 *      '### Subtitle' headings, but some models still emit raw numbered
 *      sections like "1. Dimensional profile" / "1.1 Subtitle". We rewrite
 *      those to markdown headings so the report always renders with visual
 *      hierarchy, regardless of AI compliance.
 *
 *      Sub-section patterns ("1.1 Subtitle") are converted FIRST so the
 *      top-level regex ("1. Title") doesn't greedily match the leading "1."
 *      of a sub-section.
 *
 *   2. STRIP AUTO-GENERATED HEADING IDS. `marked` adds `id="..."` attributes
 *      to its rendered headings. We strip them so the sanitiser doesn't
 *      produce noisy attributes in the rendered HTML.
 *
 * The result is sanitised via DOMPurify before being returned.
 */
/** Only text formatting survives in a report: no attributes, forms, inputs, styles or frames. */
const REPORT_HTML = {
  ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'b', 'i', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'hr', 'code', 'pre'],
  ALLOWED_ATTR: [] as string[],
};

export function parseReportMarkdown(content: string): string {
  if (!content) return '';

  let normalised = content;

  // If the content already uses markdown headings, trust the AI and skip the
  // numbered-section fallback entirely.
  const hasMarkdownHeadings = /^\s*#{1,6}\s+/m.test(normalised);

  if (!hasMarkdownHeadings) {
    // Pass 1: "N.M Subtitle" (sub-section) → "### N.M Subtitle"
    normalised = normalised.replace(
      /^(\s*)(\d{1,2}\.\d{1,2})\.?\s+([^\n]+)$/gm,
      (_m, indent: string, num: string, title: string) =>
        `${indent}### ${num} ${title.trim()}`,
    );

    // Pass 2: "N. Title" (top-level) → "## N. Title"
    normalised = normalised.replace(
      /^(\s*)(\d{1,2})\.\s+([^\n]+)$/gm,
      (_m, indent: string, num: string, title: string) =>
        `${indent}## ${num}. ${title.trim()}`,
    );
  }

  try {
    const html = marked.parse(normalised, { async: false }) as string;
    const cleaned = html.replace(/(<h[1-6][^>]*)\s+id="[^"]*"/g, '$1');
    return DOMPurify.sanitize(cleaned, REPORT_HTML);
  } catch {
    return DOMPurify.sanitize(normalised, REPORT_HTML);
  }
}

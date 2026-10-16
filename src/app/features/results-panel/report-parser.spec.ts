import { parseReportMarkdown } from '../../../shared/features/results-panel/report-parser';

describe('parseReportMarkdown()', () => {
  // The user reported the AI-written 8-section analysis was rendered as a
  // wall of text. Two safety nets are in place:
  //   1. The AI prompt now REQUIRES markdown headings (## for sections,
  //      ### for sub-sections).
  //   2. parseReportMarkdown() rewrites numbered sections ("1. Title",
  //      "1.1 Subtitle") to markdown headings when the AI doesn't comply.
  //
  // These tests pin both the markdown passthrough and the numbered-section
  // fallback behaviour.

  it('returns empty string for empty input', () => {
    expect(parseReportMarkdown('')).toBe('');
  });

  it('renders markdown headings as <h2> when AI uses them', () => {
    const input = `## 1. Dimensional profile\nYour agency is at -0.5.`;
    const html = parseReportMarkdown(input);
    expect(html).toContain('<h2>');
    expect(html).toContain('Dimensional profile');
    expect(html).toContain('Your agency is at -0.5.');
  });

  it('renders sub-section headings as <h3> when AI uses them', () => {
    const input = `## 3. Regulation\n### 3.1 How you handle emotions\nSome text.`;
    const html = parseReportMarkdown(input);
    expect(html).toContain('<h3>');
    expect(html).toContain('How you handle emotions');
  });

  it('rewrites top-level numbered sections to <h2> when AI omits markdown', () => {
    // AI sometimes returns the legacy flat format. The parser must still
    // produce structured HTML.
    const input = `1.1. Your agency is in the range of -0.5.\n2. Core behavioural patterns.`;
    const html = parseReportMarkdown(input);
    // "1.1." should become an h3 (sub-section), "2." should become an h2
    expect(html).toMatch(/<h[23][^>]*>[^<]*1\.1[^<]*<\/h[23]>/);
    expect(html).toMatch(/<h2[^>]*>2\. Core behavioural patterns\.<\/h2>/);
  });

  it('rewrites sub-section numbered patterns (1.1, 3.2) to <h3>', () => {
    const input = `3. Regulation, boundaries, narrative coherence.\n3.1. How you handle emotions.\n3.2. Boundaries with other people.`;
    const html = parseReportMarkdown(input);
    expect(html).toMatch(/<h2[^>]*>3\. Regulation/);
    expect(html).toMatch(/<h3[^>]*>3\.1 How you handle emotions\.<\/h3>/);
    expect(html).toMatch(/<h3[^>]*>3\.2 Boundaries with other people\.<\/h3>/);
  });

  it('does not double-convert if the AI already used markdown headings', () => {
    // If the input has "## 1. Title" we trust the AI; we don't re-rewrite
    // the heading. The output should be exactly one <h2> for that section.
    const input = `## 1. Title\nBody.`;
    const html = parseReportMarkdown(input);
    const h2Count = (html.match(/<h2/g) || []).length;
    expect(h2Count).toBe(1);
  });

  it('strips auto-generated id="..." attributes from rendered headings', () => {
    const input = `## 1. Title`;
    const html = parseReportMarkdown(input);
    expect(html).not.toMatch(/<h[1-6][^>]*\sid="[^"]*"/);
  });

  it('does not inject <script> or other XSS vectors (DOMPurify pass)', () => {
    const input = `## 1. Title\n<script>alert('xss')</script>\nSome text.`;
    const html = parseReportMarkdown(input);
    expect(html).not.toContain('<script>');
  });
});

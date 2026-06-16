import type { AppSettings, GenKind, Tone } from '../types';
import type { StreamConfig } from '../hooks/useGenerator';
import { streamGenerate } from '../services/api';

/** One output section: a result key plus the Markdown `## header` used when streaming. */
export interface SectionDef {
  key: string;
  header: string;
}

/** Ordered sections per kind. Headers MUST match backend STREAM_HEADERS. */
export const SECTIONS: Record<GenKind, SectionDef[]> = {
  summary: [
    { key: 'summary', header: 'Summary' },
    { key: 'action_items', header: 'Action Items' },
    { key: 'risks', header: 'Risks & Blockers' },
    { key: 'dependencies', header: 'Dependencies' },
    { key: 'next_steps', header: 'Next Steps' },
  ],
  email: [
    { key: 'subject', header: 'Subject' },
    { key: 'email', header: 'Email' },
  ],
  daily: [
    { key: 'completed', header: 'Completed' },
    { key: 'in_progress', header: 'In Progress' },
    { key: 'upcoming', header: 'Upcoming' },
  ],
  weekly: [
    { key: 'accomplishments', header: 'Accomplishments' },
    { key: 'challenges', header: 'Challenges' },
    { key: 'pending', header: 'Pending' },
    { key: 'next_week_priorities', header: 'Next Week Priorities' },
  ],
};

/** Human-friendly title per kind (used in exports and history). */
export const KIND_TITLES: Record<GenKind, string> = {
  summary: 'Meeting Summary',
  email: 'Email Draft',
  daily: 'Daily Status Report',
  weekly: 'Weekly Report',
};

const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

function matchHeaderToKey(defs: SectionDef[], headerText: string): string | null {
  const norm = normalize(headerText);
  if (!norm) return null;
  for (const d of defs) {
    if (normalize(d.header) === norm) return d.key;
  }
  // Tolerant fallback: substring match in either direction.
  for (const d of defs) {
    const dn = normalize(d.header);
    if (norm.includes(dn) || dn.includes(norm)) return d.key;
  }
  return null;
}

/**
 * Split streamed Markdown back into the per-kind result fields by `##` headers.
 * Tolerant of heading level and minor header wording differences.
 */
export function parseSections(
  kind: GenKind,
  markdown: string,
): Record<string, string> {
  const defs = SECTIONS[kind];
  const result: Record<string, string> = {};
  for (const d of defs) result[d.key] = '';
  if (!markdown) return result;

  const headerRe = /^\s{0,3}#{1,4}\s+(.+?)\s*$/;
  let currentKey: string | null = null;
  let buf: string[] = [];

  const flush = () => {
    if (currentKey) result[currentKey] = buf.join('\n').trim();
    buf = [];
  };

  for (const line of markdown.replace(/\r\n/g, '\n').split('\n')) {
    const m = line.match(headerRe);
    if (m) {
      const key = matchHeaderToKey(defs, m[1]);
      if (key) {
        flush();
        currentKey = key;
        continue;
      }
    }
    if (currentKey) buf.push(line);
  }
  flush();

  // Treat the explicit empty-section placeholder as empty.
  for (const k of Object.keys(result)) {
    if (result[k].trim() === '_None_') result[k] = '';
  }
  return result;
}

/** Assemble a single Markdown document from a result (for copy-all / export). */
export function buildMarkdown(kind: GenKind, result: unknown): string {
  const defs = SECTIONS[kind];
  const obj = (result ?? {}) as Record<string, unknown>;
  let out = `# ${KIND_TITLES[kind]}\n\n`;
  for (const d of defs) {
    const raw = obj[d.key];
    const val = typeof raw === 'string' ? raw.trim() : '';
    if (kind === 'email' && d.key === 'subject') {
      out += `**Subject:** ${val || '—'}\n\n`;
      continue;
    }
    out += `## ${d.header}\n\n${val || '_None_'}\n\n`;
  }
  return out.trim() + '\n';
}

/** Build a streaming strategy for {@link useGenerator}. */
export function makeStream<T>(
  kind: GenKind,
  s: AppSettings,
  tone?: Tone,
): StreamConfig<T> {
  return {
    start: (text, h) => streamGenerate({ kind, text, tone }, s, h),
    parse: (full) => parseSections(kind, full) as unknown as T,
  };
}

/** Derive a short title for a history entry from the raw input. */
export function titleFromInput(input: string): string {
  const firstLine = input.trim().split('\n')[0]?.trim() ?? '';
  if (!firstLine) return 'Untitled';
  return firstLine.length > 64 ? `${firstLine.slice(0, 64)}…` : firstLine;
}

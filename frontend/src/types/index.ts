export type Provider = 'groq' | 'openai' | 'gemini' | 'claude';
export type Tone = 'professional' | 'friendly' | 'executive' | 'concise';
export type ViewId = 'summary' | 'email' | 'daily' | 'weekly' | 'settings';

/** The four generator kinds (a subset of ViewId, sharing the same ids). */
export type GenKind = 'summary' | 'email' | 'daily' | 'weekly';

export interface AppSettings {
  provider: Provider;
  apiKey: string;
  model: string;
  /** Stream responses live (token-by-token) when supported. */
  stream: boolean;
}

export interface SummaryResult {
  summary: string;
  action_items: string;
  risks: string;
  dependencies: string;
  next_steps: string;
}

export interface EmailResult {
  subject: string;
  email: string;
}

export interface DailyReportResult {
  completed: string;
  in_progress: string;
  upcoming: string;
}

export interface WeeklyReportResult {
  accomplishments: string;
  challenges: string;
  pending: string;
  next_week_priorities: string;
}

export interface ApiErrorShape {
  error: string;
  detail?: string;
  code?: string;
}

/** Generic descriptor used to render output cards from a result object. */
export interface OutputField {
  key: string;
  label: string;
  icon?: string;
  value: string;
}

/** Result of a credential check (never throws — failure is an `ok: false`). */
export interface ValidateResult {
  ok: boolean;
  provider?: string;
  model?: string;
  message: string;
}

/** A saved generation, persisted to localStorage for the History panel. */
export interface HistoryEntry {
  id: string;
  kind: GenKind;
  title: string;
  createdAt: number;
  input: string;
  tone?: Tone;
  /** The typed result object (SummaryResult | EmailResult | …). */
  result: unknown;
}

export type NewHistoryEntry = Omit<HistoryEntry, 'id' | 'createdAt'>;

/** Props shared by the four generator pages. */
export interface GeneratorPageProps {
  settings: AppSettings;
  onOpenSettings: () => void;
  onSaveHistory: (entry: NewHistoryEntry) => void;
  restore: HistoryEntry | null;
  onConsumeRestore: () => void;
}

export class ApiError extends Error {
  status?: number;
  code?: string;
  detail?: string;

  constructor(
    message: string,
    opts?: { status?: number; code?: string; detail?: string },
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = opts?.status;
    this.code = opts?.code;
    this.detail = opts?.detail;
    // Restore prototype chain for instanceof checks after transpilation.
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

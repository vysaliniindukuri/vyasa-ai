import {
  ApiError,
  type AppSettings,
  type DailyReportResult,
  type EmailResult,
  type GenKind,
  type SummaryResult,
  type Tone,
  type ValidateResult,
  type WeeklyReportResult,
} from '../types';

export const API_BASE =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

/** Shape of the JSON error body returned by the backend. */
interface ErrorBody {
  error?: string;
  detail?: string;
  code?: string;
}

/**
 * POST a JSON body to the backend and return the parsed JSON response.
 * Normalizes network and HTTP errors into {@link ApiError}.
 */
async function postJSON<T>(path: string, body: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch {
    throw new ApiError(
      'Could not reach the server. Make sure the backend is running.',
      { status: 0, code: 'network' },
    );
  }

  if (!res.ok) {
    let detail: ErrorBody = {};
    try {
      detail = (await res.json()) as ErrorBody;
    } catch {
      detail = {};
    }
    throw new ApiError(detail.detail || detail.error || 'Request failed', {
      status: res.status,
      code: detail.code,
      detail: detail.detail,
    });
  }

  return (await res.json()) as T;
}

/** Merge user settings into the request body, omitting empty optional fields. */
function withSettings(
  body: Record<string, unknown>,
  s: AppSettings,
): Record<string, unknown> {
  return {
    ...body,
    provider: s.provider,
    api_key: s.apiKey || undefined,
    model: s.model || undefined,
  };
}

export function generateSummary(
  text: string,
  s: AppSettings,
): Promise<SummaryResult> {
  return postJSON<SummaryResult>(
    '/generate-summary',
    withSettings({ text }, s),
  );
}

export function generateEmail(
  text: string,
  tone: Tone,
  s: AppSettings,
): Promise<EmailResult> {
  return postJSON<EmailResult>(
    '/generate-email',
    withSettings({ text, tone }, s),
  );
}

export function generateDailyReport(
  text: string,
  s: AppSettings,
): Promise<DailyReportResult> {
  return postJSON<DailyReportResult>(
    '/generate-daily-report',
    withSettings({ text }, s),
  );
}

export function generateWeeklyReport(
  text: string,
  s: AppSettings,
): Promise<WeeklyReportResult> {
  return postJSON<WeeklyReportResult>(
    '/generate-weekly-report',
    withSettings({ text }, s),
  );
}

/** Best-effort fetch of available providers for the Settings UI. */
export async function fetchProviders(): Promise<
  Array<{ id: string; default_model: string; supports_json_mode: boolean }>
> {
  try {
    const res = await fetch(`${API_BASE}/providers`);
    if (!res.ok) return [];
    return (await res.json()) as Array<{
      id: string;
      default_model: string;
      supports_json_mode: boolean;
    }>;
  } catch {
    return [];
  }
}

/**
 * Validate the configured provider/key with a zero-cost check on the backend.
 * Never throws — failures are returned as `{ ok: false, message }`.
 */
export async function validateKey(s: AppSettings): Promise<ValidateResult> {
  try {
    const res = await postJSON<{
      ok: boolean;
      provider: string;
      model: string;
      detail: string;
    }>('/validate-key', {
      provider: s.provider,
      api_key: s.apiKey || undefined,
      model: s.model || undefined,
    });
    return {
      ok: res.ok,
      provider: res.provider,
      model: res.model,
      message: res.detail || 'Connection successful.',
    };
  } catch (e) {
    if (e instanceof ApiError) {
      return { ok: false, message: e.message };
    }
    return { ok: false, message: 'Could not validate the connection.' };
  }
}

/**
 * Stream a generation as Server-Sent Events, invoking `onDelta` for each chunk.
 * Resolves with the full accumulated text. Throws {@link ApiError} on failure
 * (and re-throws an AbortError if the caller aborts).
 */
export async function streamGenerate(
  args: { kind: GenKind; text: string; tone?: Tone },
  s: AppSettings,
  handlers: { onDelta: (chunk: string) => void; signal?: AbortSignal },
): Promise<string> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}/generate/stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(
        withSettings(
          { kind: args.kind, text: args.text, tone: args.tone ?? 'professional' },
          s,
        ),
      ),
      signal: handlers.signal,
    });
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') throw e;
    throw new ApiError(
      'Could not reach the server. Make sure the backend is running.',
      { status: 0, code: 'network' },
    );
  }

  if (!res.ok || !res.body) {
    let detail: ErrorBody = {};
    try {
      detail = (await res.json()) as ErrorBody;
    } catch {
      detail = {};
    }
    throw new ApiError(detail.detail || detail.error || 'Request failed', {
      status: res.status,
      code: detail.code,
      detail: detail.detail,
    });
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let full = '';

  // Parse the SSE byte stream frame-by-frame (frames separated by a blank line).
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let sep: number;
    while ((sep = buffer.indexOf('\n\n')) !== -1) {
      const frame = buffer.slice(0, sep);
      buffer = buffer.slice(sep + 2);

      let event = 'message';
      let dataStr = '';
      for (const line of frame.split('\n')) {
        if (line.startsWith('event:')) event = line.slice(6).trim();
        else if (line.startsWith('data:')) dataStr += line.slice(5).trim();
      }

      if (event === 'error') {
        let payload: ErrorBody = {};
        try {
          payload = JSON.parse(dataStr) as ErrorBody;
        } catch {
          payload = {};
        }
        throw new ApiError(payload.detail || payload.error || 'Generation failed', {
          code: payload.code,
        });
      }

      if (dataStr === '[DONE]') return full;
      if (!dataStr) continue;

      try {
        const obj = JSON.parse(dataStr) as { delta?: string };
        if (obj.delta) {
          full += obj.delta;
          handlers.onDelta(obj.delta);
        }
      } catch {
        // Ignore malformed frames.
      }
    }
  }

  return full;
}

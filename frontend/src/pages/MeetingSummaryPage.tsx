import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  CheckSquare,
  FileText,
  Link2,
  Sparkles,
} from 'lucide-react';

import { EmptyState } from '../components/EmptyState';
import { KeyNotice } from '../components/KeyNotice';
import { OutputCard } from '../components/OutputCard';
import { OutputGrid } from '../components/OutputGrid';
import { ResultToolbar } from '../components/ResultToolbar';
import { Workspace } from '../components/Workspace';
import { useGenerator } from '../hooks/useGenerator';
import { generateSummary } from '../services/api';
import { buildMarkdown, makeStream, titleFromInput } from '../lib/sections';
import type { GeneratorPageProps, SummaryResult } from '../types';

/** A realistic meeting note to let users try the app instantly. */
const SAMPLE_NOTE = `IAM Migration Sync — June 12, 2026
Attendees: Priya (Eng Lead), Marcus (Security), Dana (PM), Wei (Platform)

Notes:
- Dana opened by recapping that the legacy auth service must be decommissioned before the Q3 SOC 2 audit.
- Priya reported the new OIDC provider is deployed to staging; ~70% of services migrated. Billing and the reporting API still use the old session cookies.
- Marcus flagged that the legacy service stores refresh tokens unencrypted at rest — this is a hard blocker for the audit and needs remediation regardless of migration timeline.
- Wei said the platform team can finish the billing service cutover by June 26 but needs the reporting API team to confirm their token-refresh changes first; that team is currently understaffed.
- Open question: do we force a global re-login on cutover, or run dual sessions for two weeks? Marcus prefers forced re-login for a cleaner audit story; Dana worried about user friction during month-end close.
- Dependency: the new provider's rate limits need to be raised before we move billing (high traffic). Wei to file the support ticket.
- Action: Priya to draft the migration runbook. Marcus to write up the refresh-token remediation plan. Dana to socialize the re-login decision with support.
- Next sync: June 19, same time. Goal: lock the cutover date and re-login decision.`;

export function MeetingSummaryPage({
  settings,
  onOpenSettings,
  onSaveHistory,
  restore,
  onConsumeRestore,
}: GeneratorPageProps) {
  const [text, setText] = useState('');
  const generate = useCallback((t: string) => generateSummary(t, settings), [settings]);
  const stream = useMemo(() => makeStream<SummaryResult>('summary', settings), [settings]);

  const g = useGenerator<SummaryResult>(generate, {
    stream,
    streaming: settings.stream,
    onSuccess: (data, input) =>
      onSaveHistory({ kind: 'summary', title: titleFromInput(input), input, result: data }),
  });

  useEffect(() => {
    if (restore && restore.kind === 'summary') {
      setText(restore.input);
      g.setData(restore.result as SummaryResult);
      onConsumeRestore();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restore]);

  const handleGenerate = useCallback(() => {
    void g.run(text);
  }, [g, text]);

  const handleClear = useCallback(() => {
    setText('');
    g.reset();
  }, [g]);

  const handleLoadSample = useCallback(() => setText(SAMPLE_NOTE), []);

  const data = g.data;
  const markdown = data ? buildMarkdown('summary', data) : '';

  return (
    <Workspace
      title="Meeting Summary"
      subtitle="Turn messy meeting notes into a crisp executive summary with action items, risks, dependencies, and next steps."
      icon={<FileText className="h-6 w-6" />}
      value={text}
      onChange={setText}
      placeholder="Paste your raw meeting notes here — attendees, discussion points, decisions, and anything that was mentioned…"
      onGenerate={handleGenerate}
      onClear={handleClear}
      generateLabel="Generate Meeting Summary"
      loading={g.loading}
      error={g.error}
      partial={g.partial}
      loaderLabel="Crafting your meeting summary…"
      hasResult={!!data}
      notice={!settings.apiKey ? <KeyNotice onOpenSettings={onOpenSettings} /> : undefined}
      resultToolbar={
        data ? (
          <ResultToolbar
            markdown={markdown}
            filename="meeting-summary"
            onRegenerate={() => void g.regenerate()}
            loading={g.loading}
          />
        ) : undefined
      }
      toolbar={
        <button
          type="button"
          onClick={handleLoadSample}
          className="group inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white/70 backdrop-blur-xl transition-colors hover:border-white/20 hover:bg-white/10 hover:text-white"
          aria-label="Load a sample meeting note"
        >
          <Sparkles className="h-4 w-4 text-accent-indigo transition-transform group-hover:scale-110" />
          Load sample
        </button>
      }
    >
      {data ? (
        <OutputGrid>
          <OutputCard
            title="Summary"
            icon={<FileText className="h-5 w-5" />}
            content={data.summary}
            index={0}
            accent="from-accent-blue to-accent-indigo"
          />
          <OutputCard
            title="Action Items"
            icon={<CheckSquare className="h-5 w-5" />}
            content={data.action_items}
            index={1}
            accent="from-accent-indigo to-accent-purple"
          />
          <OutputCard
            title="Risks & Blockers"
            icon={<AlertTriangle className="h-5 w-5" />}
            content={data.risks}
            index={2}
            accent="from-accent-purple to-accent-pink"
          />
          <OutputCard
            title="Dependencies"
            icon={<Link2 className="h-5 w-5" />}
            content={data.dependencies}
            index={3}
            accent="from-accent-blue to-accent-purple"
          />
          <OutputCard
            title="Next Steps"
            icon={<ArrowRight className="h-5 w-5" />}
            content={data.next_steps}
            index={4}
            accent="from-accent-indigo to-accent-blue"
          />
        </OutputGrid>
      ) : (
        <EmptyState
          icon={<FileText className="h-7 w-7" />}
          title="Your summary will appear here"
          subtitle="Paste your meeting notes above, or load the sample, then generate a structured summary."
        />
      )}
    </Workspace>
  );
}

import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CalendarDays, ListTodo, Target, Trophy } from 'lucide-react';

import { EmptyState } from '../components/EmptyState';
import { KeyNotice } from '../components/KeyNotice';
import { OutputCard } from '../components/OutputCard';
import { OutputGrid } from '../components/OutputGrid';
import { ResultToolbar } from '../components/ResultToolbar';
import { Workspace } from '../components/Workspace';
import { useGenerator } from '../hooks/useGenerator';
import { generateWeeklyReport } from '../services/api';
import { buildMarkdown, makeStream, titleFromInput } from '../lib/sections';
import type { GeneratorPageProps, WeeklyReportResult } from '../types';

export function WeeklyReportsPage({
  settings,
  onOpenSettings,
  onSaveHistory,
  restore,
  onConsumeRestore,
}: GeneratorPageProps) {
  const [text, setText] = useState('');
  const generate = useCallback(
    (t: string) => generateWeeklyReport(t, settings),
    [settings],
  );
  const stream = useMemo(
    () => makeStream<WeeklyReportResult>('weekly', settings),
    [settings],
  );

  const g = useGenerator<WeeklyReportResult>(generate, {
    stream,
    streaming: settings.stream,
    onSuccess: (data, input) =>
      onSaveHistory({ kind: 'weekly', title: titleFromInput(input), input, result: data }),
  });

  useEffect(() => {
    if (restore && restore.kind === 'weekly') {
      setText(restore.input);
      g.setData(restore.result as WeeklyReportResult);
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

  const data = g.data;
  const markdown = data ? buildMarkdown('weekly', data) : '';

  return (
    <Workspace
      title="Weekly Reports"
      subtitle="Summarize your week into a stakeholder-ready update: accomplishments, challenges, pending items, and next week's priorities."
      icon={<CalendarDays className="h-6 w-6" />}
      value={text}
      onChange={setText}
      placeholder="Paste your notes from the week — what shipped, what slipped, what's still open, and what's planned next…"
      onGenerate={handleGenerate}
      onClear={handleClear}
      generateLabel="Generate Weekly Report"
      loading={g.loading}
      error={g.error}
      partial={g.partial}
      loaderLabel="Crafting your weekly report…"
      hasResult={!!data}
      notice={!settings.apiKey ? <KeyNotice onOpenSettings={onOpenSettings} /> : undefined}
      resultToolbar={
        data ? (
          <ResultToolbar
            markdown={markdown}
            filename="weekly-report"
            onRegenerate={() => void g.regenerate()}
            loading={g.loading}
          />
        ) : undefined
      }
    >
      {data ? (
        <OutputGrid>
          <OutputCard
            title="Accomplishments"
            icon={<Trophy className="h-5 w-5" />}
            content={data.accomplishments}
            index={0}
            accent="from-accent-blue to-accent-indigo"
          />
          <OutputCard
            title="Challenges"
            icon={<AlertTriangle className="h-5 w-5" />}
            content={data.challenges}
            index={1}
            accent="from-accent-purple to-accent-pink"
          />
          <OutputCard
            title="Pending Items"
            icon={<ListTodo className="h-5 w-5" />}
            content={data.pending}
            index={2}
            accent="from-accent-indigo to-accent-purple"
          />
          <OutputCard
            title="Next Week Priorities"
            icon={<Target className="h-5 w-5" />}
            content={data.next_week_priorities}
            index={3}
            accent="from-accent-blue to-accent-purple"
          />
        </OutputGrid>
      ) : (
        <EmptyState
          icon={<CalendarDays className="h-7 w-7" />}
          title="Your weekly report will appear here"
          subtitle="Paste your notes from the week above, then generate a stakeholder-ready update."
        />
      )}
    </Workspace>
  );
}

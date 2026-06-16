import { useCallback, useEffect, useMemo, useState } from 'react';
import { CalendarClock, CheckCircle2, Clock, ClipboardList } from 'lucide-react';

import { EmptyState } from '../components/EmptyState';
import { KeyNotice } from '../components/KeyNotice';
import { OutputCard } from '../components/OutputCard';
import { OutputGrid } from '../components/OutputGrid';
import { ResultToolbar } from '../components/ResultToolbar';
import { Workspace } from '../components/Workspace';
import { useGenerator } from '../hooks/useGenerator';
import { generateDailyReport } from '../services/api';
import { buildMarkdown, makeStream, titleFromInput } from '../lib/sections';
import type { DailyReportResult, GeneratorPageProps } from '../types';

export function StatusReportsPage({
  settings,
  onOpenSettings,
  onSaveHistory,
  restore,
  onConsumeRestore,
}: GeneratorPageProps) {
  const [text, setText] = useState('');
  const generate = useCallback(
    (t: string) => generateDailyReport(t, settings),
    [settings],
  );
  const stream = useMemo(
    () => makeStream<DailyReportResult>('daily', settings),
    [settings],
  );

  const g = useGenerator<DailyReportResult>(generate, {
    stream,
    streaming: settings.stream,
    onSuccess: (data, input) =>
      onSaveHistory({ kind: 'daily', title: titleFromInput(input), input, result: data }),
  });

  useEffect(() => {
    if (restore && restore.kind === 'daily') {
      setText(restore.input);
      g.setData(restore.result as DailyReportResult);
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
  const markdown = data ? buildMarkdown('daily', data) : '';

  return (
    <Workspace
      title="Status Reports"
      subtitle="Drop a brain-dump of what you did today and get a clean daily status: completed, in progress, and what's coming up."
      icon={<ClipboardList className="h-6 w-6" />}
      value={text}
      onChange={setText}
      placeholder="What did you work on today? List the tasks, tickets, blockers, and anything planned for tomorrow…"
      onGenerate={handleGenerate}
      onClear={handleClear}
      generateLabel="Generate Daily Report"
      loading={g.loading}
      error={g.error}
      partial={g.partial}
      loaderLabel="Crafting your daily report…"
      hasResult={!!data}
      notice={!settings.apiKey ? <KeyNotice onOpenSettings={onOpenSettings} /> : undefined}
      resultToolbar={
        data ? (
          <ResultToolbar
            markdown={markdown}
            filename="daily-status-report"
            onRegenerate={() => void g.regenerate()}
            loading={g.loading}
          />
        ) : undefined
      }
    >
      {data ? (
        <OutputGrid>
          <OutputCard
            title="Completed Activities"
            icon={<CheckCircle2 className="h-5 w-5" />}
            content={data.completed}
            index={0}
            accent="from-accent-blue to-accent-indigo"
          />
          <OutputCard
            title="In Progress"
            icon={<Clock className="h-5 w-5" />}
            content={data.in_progress}
            index={1}
            accent="from-accent-indigo to-accent-purple"
          />
          <OutputCard
            title="Upcoming Tasks"
            icon={<CalendarClock className="h-5 w-5" />}
            content={data.upcoming}
            index={2}
            accent="from-accent-purple to-accent-pink"
          />
        </OutputGrid>
      ) : (
        <EmptyState
          icon={<ClipboardList className="h-7 w-7" />}
          title="Your daily report will appear here"
          subtitle="Paste a quick brain-dump of your day above, then generate a polished status report."
        />
      )}
    </Workspace>
  );
}

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Mail } from 'lucide-react';

import { EmptyState } from '../components/EmptyState';
import { KeyNotice } from '../components/KeyNotice';
import { OutputCard } from '../components/OutputCard';
import { OutputGrid } from '../components/OutputGrid';
import { ResultToolbar } from '../components/ResultToolbar';
import { ToneSelector } from '../components/ToneSelector';
import { Workspace } from '../components/Workspace';
import { useGenerator } from '../hooks/useGenerator';
import { generateEmail } from '../services/api';
import { buildMarkdown, makeStream, titleFromInput } from '../lib/sections';
import type { EmailResult, GeneratorPageProps, Tone } from '../types';

export function EmailGeneratorPage({
  settings,
  onOpenSettings,
  onSaveHistory,
  restore,
  onConsumeRestore,
}: GeneratorPageProps) {
  const [text, setText] = useState('');
  const [tone, setTone] = useState<Tone>('professional');

  const generate = useCallback(
    (t: string) => generateEmail(t, tone, settings),
    [tone, settings],
  );
  const stream = useMemo(
    () => makeStream<EmailResult>('email', settings, tone),
    [settings, tone],
  );

  const g = useGenerator<EmailResult>(generate, {
    stream,
    streaming: settings.stream,
    onSuccess: (data, input) =>
      onSaveHistory({ kind: 'email', title: titleFromInput(input), input, tone, result: data }),
  });

  useEffect(() => {
    if (restore && restore.kind === 'email') {
      setText(restore.input);
      setTone(restore.tone ?? 'professional');
      g.setData(restore.result as EmailResult);
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
  const emailContent = data
    ? `**Subject:** ${data.subject || '—'}\n\n${data.email || ''}`
    : '';
  const markdown = data ? buildMarkdown('email', data) : '';

  return (
    <Workspace
      title="Email Generator"
      subtitle="Describe what you want to say and pick a tone — get a polished, ready-to-send email draft with a subject line."
      icon={<Mail className="h-6 w-6" />}
      value={text}
      onChange={setText}
      placeholder="Describe the email you need — who it's for, the key points, and the outcome you want (e.g. follow up after the IAM sync and confirm the cutover date)…"
      onGenerate={handleGenerate}
      onClear={handleClear}
      generateLabel="Generate Email"
      loading={g.loading}
      error={g.error}
      partial={g.partial}
      loaderLabel="Crafting your email…"
      hasResult={!!data}
      notice={!settings.apiKey ? <KeyNotice onOpenSettings={onOpenSettings} /> : undefined}
      toolbar={<ToneSelector value={tone} onChange={setTone} />}
      resultToolbar={
        data ? (
          <ResultToolbar
            markdown={markdown}
            filename="email-draft"
            onRegenerate={() => void g.regenerate()}
            loading={g.loading}
          />
        ) : undefined
      }
    >
      {data ? (
        <OutputGrid>
          <OutputCard
            title="Email Draft"
            icon={<Mail className="h-5 w-5" />}
            content={emailContent}
            index={0}
            accent="from-accent-blue to-accent-purple"
          />
        </OutputGrid>
      ) : (
        <EmptyState
          icon={<Mail className="h-7 w-7" />}
          title="Your email draft will appear here"
          subtitle="Describe your message above, choose a tone, then generate a polished draft."
        />
      )}
    </Workspace>
  );
}

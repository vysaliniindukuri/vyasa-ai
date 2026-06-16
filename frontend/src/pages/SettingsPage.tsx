import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Check,
  ExternalLink,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Lock,
  PlugZap,
  Save,
  Settings as SettingsIcon,
  Sparkles,
  X,
  Zap,
} from 'lucide-react';
import clsx from 'clsx';

import { GlassCard } from '../components/GlassCard';
import { GradientButton } from '../components/GradientButton';
import { fadeInUp, staggerContainer } from '../lib/motion';
import { validateKey } from '../services/api';
import type { AppSettings, Provider, ValidateResult } from '../types';

interface SettingsPageProps {
  settings: AppSettings;
  onChange: (s: AppSettings) => void;
}

interface ProviderMeta {
  id: Provider;
  name: string;
  defaultModel: string;
  blurb: string;
}

/** Static provider catalog mirroring the backend PROVIDERS registry. */
const PROVIDERS: ProviderMeta[] = [
  {
    id: 'groq',
    name: 'Groq',
    defaultModel: 'llama-3.3-70b-versatile',
    blurb: 'Blazing-fast Llama 3.3 — free to start.',
  },
  {
    id: 'openai',
    name: 'OpenAI',
    defaultModel: 'gpt-4o-mini',
    blurb: 'GPT-4o mini — reliable and well-rounded.',
  },
  {
    id: 'gemini',
    name: 'Gemini',
    defaultModel: 'gemini-2.0-flash',
    blurb: 'Google Gemini 2.0 Flash — fast and capable.',
  },
  {
    id: 'claude',
    name: 'Claude',
    defaultModel: 'claude-sonnet-4-6',
    blurb: 'Anthropic Claude Sonnet — nuanced writing.',
  },
];

export function SettingsPage({ settings, onChange }: SettingsPageProps) {
  const [draft, setDraft] = useState<AppSettings>(settings);
  const [showKey, setShowKey] = useState(false);
  const [saved, setSaved] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<ValidateResult | null>(null);

  // Keep the local draft in sync if settings change externally (e.g. reset).
  useEffect(() => {
    setDraft(settings);
  }, [settings]);

  // Clear transient confirmations whenever the user edits again.
  useEffect(() => {
    setSaved(false);
    setTestResult(null);
  }, [draft.provider, draft.apiKey, draft.model, draft.stream]);

  const activeMeta = useMemo(
    () => PROVIDERS.find((p) => p.id === draft.provider) ?? PROVIDERS[0],
    [draft.provider],
  );

  const handleSave = () => {
    onChange(draft);
    setSaved(true);
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    const result = await validateKey(draft);
    setTestResult(result);
    setTesting(false);
  };

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="show"
      className="mx-auto w-full max-w-3xl"
    >
      <motion.header variants={fadeInUp} className="mb-8">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-accent-blue to-accent-purple text-white shadow-glow">
            <SettingsIcon className="h-6 w-6" />
          </span>
          <h1 className="bg-gradient-to-r from-accent-blue via-accent-indigo to-accent-purple bg-clip-text text-3xl font-semibold tracking-tight text-transparent">
            Settings
          </h1>
        </div>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-white/60">
          Choose your AI provider and add an API key. Everything stays in your
          browser — keys are sent only to the provider you select.
        </p>
      </motion.header>

      <motion.div variants={fadeInUp}>
        <GlassCard className="p-6 sm:p-8">
          {/* Provider selection */}
          <fieldset>
            <legend className="mb-3 flex items-center gap-2 text-sm font-medium uppercase tracking-wide text-white/50">
              <Sparkles className="h-4 w-4 text-accent-indigo" />
              Provider
            </legend>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {PROVIDERS.map((p) => {
                const active = draft.provider === p.id;
                return (
                  <motion.button
                    key={p.id}
                    type="button"
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setDraft((d) => ({ ...d, provider: p.id }))}
                    aria-pressed={active}
                    className={clsx(
                      'relative flex flex-col items-start gap-1 rounded-2xl border p-4 text-left transition-colors',
                      active
                        ? 'border-accent-indigo/50 bg-white/10'
                        : 'border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/5',
                    )}
                  >
                    {active && (
                      <motion.span
                        layoutId="providerGlow"
                        className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-inset ring-accent-indigo/40 shadow-glow"
                        transition={{ type: 'spring', stiffness: 300, damping: 26 }}
                      />
                    )}
                    <span className="relative z-10 flex w-full items-center justify-between">
                      <span className="text-base font-semibold text-white">
                        {p.name}
                      </span>
                      <span
                        className={clsx(
                          'flex h-5 w-5 items-center justify-center rounded-full border transition-colors',
                          active
                            ? 'border-accent-indigo bg-accent-indigo text-white'
                            : 'border-white/20 text-transparent',
                        )}
                      >
                        <Check className="h-3 w-3" />
                      </span>
                    </span>
                    <span className="relative z-10 text-sm text-white/55">
                      {p.blurb}
                    </span>
                    <span className="relative z-10 mt-1 font-mono text-xs text-white/35">
                      {p.defaultModel}
                    </span>
                  </motion.button>
                );
              })}
            </div>
          </fieldset>

          {/* API key */}
          <div className="mt-8">
            <label
              htmlFor="settings-api-key"
              className="mb-2 flex items-center gap-2 text-sm font-medium uppercase tracking-wide text-white/50"
            >
              <KeyRound className="h-4 w-4 text-accent-indigo" />
              API Key
            </label>
            <div className="relative">
              <input
                id="settings-api-key"
                type={showKey ? 'text' : 'password'}
                value={draft.apiKey}
                onChange={(e) => setDraft((d) => ({ ...d, apiKey: e.target.value }))}
                placeholder={`Paste your ${activeMeta.name} API key…`}
                autoComplete="off"
                spellCheck={false}
                className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 pr-12 font-mono text-sm text-white placeholder:text-white/30 outline-none transition-colors focus:border-accent-indigo/50 focus:bg-white/[0.06] focus:ring-2 focus:ring-accent-indigo/30"
              />
              <button
                type="button"
                onClick={() => setShowKey((v) => !v)}
                aria-label={showKey ? 'Hide API key' : 'Show API key'}
                className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-xl text-white/50 transition-colors hover:bg-white/10 hover:text-white"
              >
                {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {draft.provider === 'groq' && (
              <a
                href="https://console.groq.com/keys"
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-flex items-center gap-1.5 text-sm text-accent-blue transition-colors hover:text-accent-indigo"
              >
                Get a free Groq key
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}
          </div>

          {/* Model override */}
          <div className="mt-8">
            <label
              htmlFor="settings-model"
              className="mb-2 flex items-center gap-2 text-sm font-medium uppercase tracking-wide text-white/50"
            >
              <Sparkles className="h-4 w-4 text-accent-indigo" />
              Model
              <span className="ml-1 normal-case tracking-normal text-white/30">
                (optional)
              </span>
            </label>
            <input
              id="settings-model"
              type="text"
              value={draft.model}
              onChange={(e) => setDraft((d) => ({ ...d, model: e.target.value }))}
              placeholder={activeMeta.defaultModel}
              autoComplete="off"
              spellCheck={false}
              className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 font-mono text-sm text-white placeholder:text-white/30 outline-none transition-colors focus:border-accent-indigo/50 focus:bg-white/[0.06] focus:ring-2 focus:ring-accent-indigo/30"
            />
            <p className="mt-2 text-sm text-white/40">
              Leave blank to use{' '}
              <span className="font-mono text-white/55">{activeMeta.defaultModel}</span>
              , the {activeMeta.name} default.
            </p>
          </div>

          {/* Streaming toggle */}
          <div className="mt-8 flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div className="flex items-start gap-3">
              <Zap className="mt-0.5 h-5 w-5 shrink-0 text-accent-indigo" />
              <div>
                <p className="text-sm font-medium text-white">Stream responses</p>
                <p className="mt-0.5 text-sm text-white/50">
                  Watch the output appear live, token by token, as it's written.
                </p>
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={draft.stream}
              aria-label="Toggle streaming responses"
              onClick={() => setDraft((d) => ({ ...d, stream: !d.stream }))}
              className={clsx(
                'relative h-7 w-12 shrink-0 rounded-full border transition-colors',
                draft.stream
                  ? 'border-accent-indigo/50 bg-gradient-to-r from-accent-blue to-accent-purple'
                  : 'border-white/15 bg-white/10',
              )}
            >
              <motion.span
                layout
                transition={{ type: 'spring', stiffness: 500, damping: 32 }}
                className={clsx(
                  'absolute top-1/2 h-5 w-5 -translate-y-1/2 rounded-full bg-white shadow',
                  draft.stream ? 'right-1' : 'left-1',
                )}
              />
            </button>
          </div>

          {/* Privacy reassurance */}
          <div className="mt-6 flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <Lock className="mt-0.5 h-5 w-5 shrink-0 text-accent-blue" />
            <p className="text-sm leading-relaxed text-white/55">
              Your key is stored locally in your browser and never sent anywhere
              except your chosen provider. Clear it any time by emptying this field
              and saving.
            </p>
          </div>

          {/* Actions */}
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <GradientButton
              variant="primary"
              onClick={handleSave}
              icon={<Save className="h-4 w-4" />}
            >
              Save Settings
            </GradientButton>

            <GradientButton
              variant="ghost"
              onClick={handleTest}
              loading={testing}
              icon={<PlugZap className="h-4 w-4" />}
            >
              Test Connection
            </GradientButton>

            <AnimatePresence>
              {saved && (
                <motion.span
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ duration: 0.3 }}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-300"
                  role="status"
                >
                  <Check className="h-4 w-4" />
                  Saved
                </motion.span>
              )}
            </AnimatePresence>
          </div>

          {/* Test result */}
          <AnimatePresence>
            {(testing || testResult) && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.3 }}
                className={clsx(
                  'mt-4 flex items-start gap-2.5 rounded-2xl border p-3.5 text-sm',
                  testing
                    ? 'border-white/10 bg-white/[0.03] text-white/60'
                    : testResult?.ok
                      ? 'border-emerald-400/25 bg-emerald-500/[0.07] text-emerald-100'
                      : 'border-red-400/25 bg-red-500/[0.07] text-red-100',
                )}
                role="status"
              >
                {testing ? (
                  <>
                    <Loader2 className="mt-0.5 h-4 w-4 shrink-0 animate-spin" />
                    <span>Checking your connection…</span>
                  </>
                ) : testResult?.ok ? (
                  <>
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
                    <span>
                      Connected to{' '}
                      <span className="font-semibold capitalize">
                        {testResult.provider}
                      </span>
                      {testResult.model ? (
                        <>
                          {' '}
                          ·{' '}
                          <span className="font-mono text-emerald-200">
                            {testResult.model}
                          </span>
                        </>
                      ) : null}
                      . You're all set.
                    </span>
                  </>
                ) : (
                  <>
                    <X className="mt-0.5 h-4 w-4 shrink-0 text-red-300" />
                    <span>{testResult?.message}</span>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </GlassCard>
      </motion.div>
    </motion.div>
  );
}

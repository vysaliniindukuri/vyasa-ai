import { useCallback, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import type { HistoryEntry, ViewId } from './types';
import { useSettings } from './hooks/useSettings';
import { useHistory } from './hooks/useHistory';
import { ToastProvider } from './hooks/useToast';
import { Layout } from './components/Layout';
import { HistoryPanel } from './components/HistoryPanel';
import { MeetingSummaryPage } from './pages/MeetingSummaryPage';
import { EmailGeneratorPage } from './pages/EmailGeneratorPage';
import { StatusReportsPage } from './pages/StatusReportsPage';
import { WeeklyReportsPage } from './pages/WeeklyReportsPage';
import { SettingsPage } from './pages/SettingsPage';

export function App() {
  const { settings, setSettings } = useSettings();
  const history = useHistory();

  const [view, setView] = useState<ViewId>('summary');
  const [historyOpen, setHistoryOpen] = useState(false);
  const [restore, setRestore] = useState<HistoryEntry | null>(null);

  const openSettings = useCallback(() => setView('settings'), []);
  const consumeRestore = useCallback(() => setRestore(null), []);

  const handleRestore = useCallback((entry: HistoryEntry) => {
    setView(entry.kind); // GenKind ids are a subset of ViewId
    setRestore(entry);
    setHistoryOpen(false);
  }, []);

  const pageProps = {
    settings,
    onOpenSettings: openSettings,
    onSaveHistory: history.add,
    restore,
    onConsumeRestore: consumeRestore,
  };

  return (
    <ToastProvider>
      <Layout
        active={view}
        onSelect={setView}
        onOpenHistory={() => setHistoryOpen(true)}
      >
        <AnimatePresence mode="wait">
          {view === 'summary' && (
            <MeetingSummaryPage key="summary" {...pageProps} />
          )}
          {view === 'email' && (
            <EmailGeneratorPage key="email" {...pageProps} />
          )}
          {view === 'daily' && (
            <StatusReportsPage key="daily" {...pageProps} />
          )}
          {view === 'weekly' && (
            <WeeklyReportsPage key="weekly" {...pageProps} />
          )}
          {view === 'settings' && (
            <SettingsPage
              key="settings"
              settings={settings}
              onChange={setSettings}
            />
          )}
        </AnimatePresence>
      </Layout>

      <HistoryPanel
        open={historyOpen}
        items={history.items}
        onClose={() => setHistoryOpen(false)}
        onRestore={handleRestore}
        onRemove={history.remove}
        onClear={history.clear}
      />
    </ToastProvider>
  );
}

export default App;

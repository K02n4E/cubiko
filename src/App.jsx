import { useEffect, useRef } from 'react';
import Sidebar from './components/Sidebar';
import Toast from './components/Toast';
import { RaceProvider } from './hooks/useRace';
import { SettingsProvider } from './hooks/useSettings';
import { SolvesProvider } from './hooks/useSolves';
import { ToastProvider } from './hooks/useToast';
import { useHashRoute } from './hooks/useHashRoute';
import TimerPage from './pages/TimerPage';
import RacePage from './pages/RacePage';
import TrainerPage from './pages/TrainerPage';
import StatisticsPage from './pages/StatisticsPage';
import SettingsPage from './pages/SettingsPage';

const PAGES = { timer: TimerPage, race: RacePage, trainer: TrainerPage, statistics: StatisticsPage, prefs: SettingsPage };

function Shell() {
  const page = useHashRoute();
  const main = useRef(null);
  useEffect(() => { if (main.current) main.current.scrollTop = 0; }, [page]);
  const Page = PAGES[page];
  return (
    <>
      <Sidebar page={page} />
      <main className="main" id="main" ref={main}><Page /></main>
      <Toast />
    </>
  );
}

export default function App() {
  return (
    <SettingsProvider>
      <ToastProvider>
        <SolvesProvider>
          <RaceProvider>
            <Shell />
          </RaceProvider>
        </SolvesProvider>
      </ToastProvider>
    </SettingsProvider>
  );
}

import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { NavigationLoader } from './components/NavigationLoader';
import { PageTransition } from './components/PageTransition';
import { useTradingStore } from './context/TradingContext';

// Lazy load views for better performance
const MainDashboard = lazy(() => import('./views/MainDashboard'));
const AIBrainView = lazy(() => import('./views/AIBrainView'));

const LogsView = lazy(() => import('./views/LogsView'));
const SettingsView = lazy(() => import('./views/SettingsView'));
const StrategiesView = lazy(() => import('./views/StrategiesView'));
const OverviewView = lazy(() => import('./views/OverviewView'));
const UnifiedDashboard = lazy(() => import('./views/UnifiedDashboard'));

interface AppRouterProps {
  onCommand?: (cmd: string) => void;
}

export const AppRouter: React.FC<AppRouterProps> = ({ onCommand }) => {
  const { tradingMode } = useTradingStore();
  const location = useLocation();
  const navigate = useNavigate();

  // Sync navigation when trading mode changes
  React.useEffect(() => {
    const isDashboardPath = 
      location.pathname === '/' || 
      location.pathname === '/dashboard' || 
      location.pathname === '/portfolio' || 
      location.pathname === '/paper-trading';

    if (isDashboardPath) {
      if (tradingMode === 'paper' && (location.pathname === '/live' || location.pathname === '/live-trading')) {
        navigate('/portfolio', { replace: true });
      }
    }
  }, [tradingMode, navigate, location.pathname]);

  return (
    <Suspense fallback={<NavigationLoader />}>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          {/* Main Dashboard - Default Route */}
          <Route path="/" element={<Navigate to="/ai-brain" replace />} />

          {/* Dashboard alias */}
          <Route 
            path="/dashboard" 
            element={
              <PageTransition>
                <MainDashboard onCommand={onCommand} />
              </PageTransition>
            } 
          />

          {/* AI Brain */}
          <Route 
            path="/ai-brain" 
            element={
              <PageTransition>
                <AIBrainView onCommand={onCommand} />
              </PageTransition>
            } 
          />
          <Route 
            path="/neural-core" 
            element={
              <PageTransition>
                <AIBrainView onCommand={onCommand} />
              </PageTransition>
            } 
          />

          {/* Portfolio Views */}
          <Route 
            path="/portfolio" 
            element={
              <PageTransition>
                <MainDashboard onCommand={onCommand} />
              </PageTransition>
            } 
          />
          <Route 
            path="/paper-trading" 
            element={
              <PageTransition>
                <MainDashboard onCommand={onCommand} />
              </PageTransition>
            } 
          />

          {/* System Logs */}
          <Route 
            path="/logs" 
            element={
              <PageTransition>
                <LogsView />
              </PageTransition>
            } 
          />
          <Route 
            path="/system-logs" 
            element={
              <PageTransition>
                <LogsView />
              </PageTransition>
            } 
          />

          {/* Settings */}
          <Route 
            path="/settings" 
            element={
              <PageTransition>
                <SettingsView onCommand={onCommand} />
              </PageTransition>
            } 
          />

          {/* Additional Views */}
          <Route 
            path="/strategies" 
            element={
              <PageTransition>
                <StrategiesView />
              </PageTransition>
            } 
          />
          <Route 
            path="/overview" 
            element={
              <PageTransition>
                <OverviewView />
              </PageTransition>
            } 
          />
          <Route 
            path="/unified" 
            element={
              <PageTransition>
                <UnifiedDashboard onCommand={onCommand} />
              </PageTransition>
            } 
          />

          {/* Catch-all redirect to dashboard */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AnimatePresence>
    </Suspense>
  );
};

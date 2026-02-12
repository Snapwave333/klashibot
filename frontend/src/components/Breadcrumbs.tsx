import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { motion } from 'framer-motion';
// import { cn } from '../utils/cn';

interface BreadcrumbItem {
  label: string;
  path: string;
}

export const Breadcrumbs: React.FC = () => {
  const location = useLocation();
  const pathSegments = location.pathname.split('/').filter(Boolean);

  // Map path segments to readable labels
  const breadcrumbMap: Record<string, string> = {
    'dashboard': 'Dashboard',
    'ai-brain': 'Neural Core',
    'neural-core': 'Neural Core',
    'portfolio': 'Portfolio',
    'paper-trading': 'Paper Trading',
    'live-trading': 'Live Trading',
    'risk': 'Risk Protection',
    'risk-protection': 'Risk Protection',
    'logs': 'System Logs',
    'system-logs': 'System Logs',
    'settings': 'Settings',
    'strategies': 'Strategies',
    'overview': 'Overview',
    'unified': 'Unified Dashboard',
  };

  // Build breadcrumb items
  const breadcrumbs: BreadcrumbItem[] = [];
  let currentPath = '';

  pathSegments.forEach((segment) => {
    currentPath += `/${segment}`;
    breadcrumbs.push({
      label: breadcrumbMap[segment] || segment.charAt(0).toUpperCase() + segment.slice(1),
      path: currentPath,
    });
  });

  // Don't show breadcrumbs if we're on the home page
  if (breadcrumbs.length === 0) {
    return null;
  }

  return (
    <nav
      className="flex items-center gap-2 px-6 py-3 border-white/5 border-b text-sm"
      aria-label="Breadcrumb"
    >
      {/* Home Link */}
      <Link
        to="/"
        className="group flex items-center gap-1 text-gray-400 hover:text-neon-cyan transition-colors"
        aria-label="Home"
      >
        <Home className="w-4 h-4" />
        <span className="hidden sm:inline">Dashboard</span>
      </Link>

      {/* Breadcrumb Items */}
      {breadcrumbs.map((item, idx) => {
        const isLast = idx === breadcrumbs.length - 1;

        return (
          <React.Fragment key={item.path}>
            <ChevronRight className="w-4 h-4 text-gray-600" />

            {isLast ? (
              // Current page - not a link
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="font-medium text-neon-cyan"
                aria-current="page"
              >
                {item.label}
              </motion.span>
            ) : (
              // Intermediate pages - clickable links
              <Link
                to={item.path}
                className="text-gray-400 hover:text-neon-cyan transition-colors"
              >
                {item.label}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};


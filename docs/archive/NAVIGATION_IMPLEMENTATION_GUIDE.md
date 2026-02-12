# Navigation Implementation Guide - Kalshi Trading Dashboard

## 🚀 Quick Start

This guide provides step-by-step instructions for integrating the new navigation enhancements into your Kalshi trading dashboard.

---

## 📦 New Files Created

### 1. Components
- **`/frontend/src/components/CommandPalette.tsx`** - Cmd+K command palette
- **`/frontend/src/components/QuickActionMenu.tsx`** - Floating quick actions button
- **`/frontend/src/components/layout/MobileNav.tsx`** - Mobile bottom nav + hamburger menu

### 2. Hooks
- **`/frontend/src/hooks/useKeyboardShortcuts.ts`** - Global keyboard shortcuts

### 3. Documentation
- **`NAVIGATION_OPTIMIZATION.md`** - Comprehensive optimization plan
- **`NAVIGATION_IMPLEMENTATION_GUIDE.md`** - This file

---

## 🔧 Step-by-Step Integration

### Step 1: Update TradingContext (Zustand Store)

Add favorite views and recent views tracking to your store:

**File:** `frontend/src/context/TradingContext.tsx`

```typescript
interface TradingState {
  // ... existing state ...

  // NEW: Navigation enhancements
  favoriteViews: string[];
  recentViews: string[];
  addFavorite: (viewId: string) => void;
  removeFavorite: (viewId: string) => void;
  addRecentView: (viewId: string) => void;
}

export const useTradingStore = create<TradingState>((set, get) => ({
  // ... existing state ...

  // NEW: Navigation state
  favoriteViews: [],
  recentViews: [],

  addFavorite: (viewId: string) =>
    set((state) => ({
      favoriteViews: state.favoriteViews.includes(viewId)
        ? state.favoriteViews
        : [...state.favoriteViews, viewId],
    })),

  removeFavorite: (viewId: string) =>
    set((state) => ({
      favoriteViews: state.favoriteViews.filter((id) => id !== viewId),
    })),

  addRecentView: (viewId: string) =>
    set((state) => {
      const filtered = state.recentViews.filter((id) => id !== viewId);
      return {
        recentViews: [viewId, ...filtered].slice(0, 10), // Keep last 10
      };
    }),

  // MODIFY: setCurrentView to track recent views
  setCurrentView: (view: string) =>
    set((state) => {
      // Add to recent views
      const filtered = state.recentViews.filter((id) => id !== view);
      return {
        currentView: view,
        recentViews: [view, ...filtered].slice(0, 10),
      };
    }),
}));
```

---

### Step 2: Integrate Command Palette

**File:** `frontend/src/App.tsx`

```typescript
import { CommandPalette } from './components/CommandPalette';

function App() {
  // ... existing code ...

  return (
    <div className="...">
      {/* ... existing components ... */}

      {/* ADD: Command Palette */}
      <CommandPalette onNavigate={handleNavigate} onCommand={handleSendCommand} />

      {/* ... rest of app ... */}
    </div>
  );
}
```

**Note:** The command palette is already set up to listen for `Cmd+K` globally.

---

### Step 3: Integrate Keyboard Shortcuts

**File:** `frontend/src/App.tsx`

```typescript
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';

function App() {
  // ... existing code ...

  // ADD: Keyboard shortcuts
  useKeyboardShortcuts({
    onNavigate: (viewId) => {
      // Handle navigation
      useTradingStore.getState().setCurrentView(viewId);
    },
    onCommand: handleSendCommand,
  });

  // ... rest of component ...
}
```

---

### Step 4: Integrate Quick Action Menu

**File:** `frontend/src/App.tsx`

```typescript
import { QuickActionMenu } from './components/QuickActionMenu';

function App() {
  // ... existing code ...

  return (
    <div className="...">
      {/* ... existing components ... */}

      {/* ADD: Quick Action Menu (bottom-right floating button) */}
      <QuickActionMenu onCommand={handleSendCommand} />

      {/* ... rest of app ... */}
    </div>
  );
}
```

---

### Step 5: Integrate Mobile Navigation

**File:** `frontend/src/App.tsx`

```typescript
import { MobileHeader, MobileBottomNav } from './components/layout/MobileNav';

function App() {
  // ... existing code ...

  return (
    <div className="...">
      {/* ADD: Mobile Header (shows on mobile, hidden on desktop) */}
      <MobileHeader onCommand={handleSendCommand} />

      {/* Existing TopBar (hidden on mobile with lg:flex) */}
      <TopBar onCommand={handleSendCommand} onOpenSettings={() => setShowSettings(true)} />

      {/* Main content */}
      <div className="relative flex flex-1 overflow-hidden">
        {/* ... existing content ... */}
      </div>

      {/* ADD: Mobile Bottom Navigation */}
      <MobileBottomNav />

      {/* ... rest of app ... */}
    </div>
  );
}
```

**Update TopBar visibility:**

```typescript
// In TopBar.tsx or App.tsx
<TopBar className="hidden lg:flex" ... />
```

---

### Step 6: Update Default View to Dashboard

**Important:** Make sure the dashboard is the main/default view.

**File:** `frontend/src/context/TradingContext.tsx`

```typescript
export const useTradingStore = create<TradingState>((set, get) => ({
  // CHANGE: Default view from 'ai-brain' to 'dashboard'
  currentView: 'dashboard', // Was: 'ai-brain'

  // ... rest of state ...
}));
```

**File:** `frontend/src/components/layout/LeftRail.tsx`

Update nav items to include dashboard:

```typescript
const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: Grid }, // ADD THIS FIRST
  { id: 'ai-brain', label: 'Neural Core', icon: Brain },
  { id: 'paper-trading', label: 'Portfolio View', icon: LayoutDashboard, mode: 'paper' },
  { id: 'live-trading', label: 'Live Trading', icon: Zap, mode: 'live' },
  { id: 'risk', label: 'Risk Protection', icon: AlertTriangle },
  { id: 'logs', label: 'System Logs', icon: ScrollText },
  { id: 'settings', label: 'System Settings', icon: Settings },
];
```

---

### Step 7: Add Tailwind Safe Area Classes (Mobile)

**File:** `tailwind.config.js`

Add safe area utilities for mobile notches:

```javascript
module.exports = {
  theme: {
    extend: {
      // ... existing config ...
    },
  },
  plugins: [
    // ADD: Safe area plugin for mobile
    function ({ addUtilities }) {
      addUtilities({
        '.safe-area-top': {
          'padding-top': 'env(safe-area-inset-top)',
        },
        '.safe-area-bottom': {
          'padding-bottom': 'env(safe-area-inset-bottom)',
        },
        '.safe-area-left': {
          'padding-left': 'env(safe-area-inset-left)',
        },
        '.safe-area-right': {
          'padding-right': 'env(safe-area-inset-right)',
        },
      });
    },
  ],
};
```

---

### Step 8: Update Main Content Padding (Mobile)

Ensure main content doesn't hide under mobile bottom nav:

**File:** `frontend/src/App.tsx`

```typescript
<div className="relative flex flex-1 overflow-hidden pb-16 lg:pb-0">
  {/*                                          ^^^^^^^^^^^^
                                          Add padding for mobile bottom nav */}
  {/* ... main content ... */}
</div>
```

---

## 🎨 Styling Adjustments

### Hide Desktop Sidebar on Mobile

**File:** `frontend/src/components/layout/LeftRail.tsx`

```typescript
export const LeftRail: React.FC<LeftRailProps> = ({ onCommand }) => {
  // ... existing code ...

  return (
    <motion.div
      className="hidden lg:flex flex-col bg-glass-bg backdrop-blur-glass border-glass-border border-r h-full"
      //       ^^^^^^^^^^^^^^ Add this to hide on mobile
      animate={{ width: sidebarCollapsed ? 80 : 240 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
    >
      {/* ... rest of component ... */}
    </motion.div>
  );
};
```

---

## ⌨️ Keyboard Shortcuts Reference

### Navigation
- `Cmd+1` → Dashboard
- `Cmd+2` → Portfolio
- `Cmd+3` → Risk Protection
- `Cmd+4` → System Logs
- `Cmd+,` → Settings

### Bot Controls
- `Cmd+P` → Start Bot
- `Cmd+Shift+P` → Pause Bot
- `Cmd+S` → Stop Bot

### UI Controls
- `Cmd+K` → Open Command Palette
- `Cmd+B` → Toggle Sidebar
- `Cmd+L` → Cycle Layout
- `Cmd+/` → Show Keyboard Shortcuts
- `Esc` → Close Modal/Dialog

### Quick Actions
- `Cmd+R` → Refresh Data
- `Cmd+D` → Export Logs
- `Cmd+Shift+N` → New Position

### Layouts
- `Cmd+Shift+D` → Default Layout
- `Cmd+Shift+F` → Focus Layout
- `Cmd+Shift+C` → Cinema Layout

---

## 📱 Mobile-Specific Features

### Bottom Tab Bar
- **Visible:** < 1024px (below `lg` breakpoint)
- **Position:** Fixed bottom
- **Height:** 64px (h-16)
- **Items:** Dashboard, AI, Portfolio, Risk, Logs

### Hamburger Menu
- **Trigger:** Menu icon in top-left of mobile header
- **Animation:** Slide-in from left
- **Width:** 288px (w-72)
- **Backdrop:** Blur overlay

### Mobile Header
- **Visible:** < 1024px
- **Height:** 64px (h-16)
- **Features:** Menu button, logo, bot status

---

## 🧪 Testing Checklist

### Desktop Tests
- [ ] Command palette opens with `Cmd+K`
- [ ] All keyboard shortcuts work
- [ ] Quick action menu opens/closes smoothly
- [ ] Sidebar collapses with `Cmd+B`
- [ ] Layout presets switch correctly
- [ ] TopBar visible on desktop

### Mobile Tests
- [ ] Bottom tab bar visible on mobile
- [ ] Hamburger menu slides in/out
- [ ] Mobile header shows correct status
- [ ] Main content has bottom padding
- [ ] Touch targets are 48px+ for accessibility
- [ ] Safe areas respected on notched devices

### Cross-Browser Tests
- [ ] Chrome/Edge
- [ ] Firefox
- [ ] Safari (Mac/iOS)

---

## 🐛 Common Issues & Solutions

### Issue 1: Command Palette Not Opening

**Problem:** Pressing `Cmd+K` doesn't open the palette.

**Solution:**
1. Ensure `CommandPalette` is rendered in `App.tsx`
2. Check browser console for errors
3. Verify `useEffect` is running (no SSR issues)

```typescript
// Debug: Add console log
useEffect(() => {
  console.log('Command palette mounted');
  // ... existing code ...
}, []);
```

---

### Issue 2: Mobile Bottom Nav Hidden

**Problem:** Bottom navigation doesn't appear on mobile.

**Solution:**
1. Check `MobileBottomNav` is rendered
2. Verify Tailwind classes: `lg:hidden` (hide on desktop)
3. Test at mobile viewport width (< 1024px)

```typescript
// Debug: Force visible
<MobileBottomNav className="!flex" />
```

---

### Issue 3: Keyboard Shortcuts Conflict

**Problem:** Shortcuts don't work in text fields.

**Solution:** Already handled! The hook ignores shortcuts when typing:

```typescript
const isInputField =
  e.target instanceof HTMLInputElement ||
  e.target instanceof HTMLTextAreaElement ||
  (e.target instanceof HTMLElement && e.target.isContentEditable);

if (isInputField && e.key !== 'Escape') return;
```

---

### Issue 4: Quick Action Menu Behind Other Elements

**Problem:** Floating button is hidden.

**Solution:** Ensure high z-index:

```typescript
<QuickActionMenu className="z-[60]" />
```

Check `z-index` hierarchy:
- Command Palette: `z-[100]` (backdrop), `z-[101]` (content)
- Mobile Menu: `z-[60]` (backdrop), `z-[70]` (content)
- Quick Actions: `z-50`

---

## 🎯 Performance Optimization Tips

### 1. Lazy Load Views

```typescript
const AIBrainView = React.lazy(() => import('./views/AIBrainView'));
const RiskView = React.lazy(() => import('./views/RiskView'));

<Suspense fallback={<LoadingSpinner />}>
  <AIBrainView />
</Suspense>
```

### 2. Memoize Command Items

Already implemented in `CommandPalette.tsx`:

```typescript
const commands = useMemo(() => [...], [deps]);
const filteredCommands = useMemo(() => {...}, [query, commands]);
```

### 3. Debounce Search Input

For future enhancement:

```typescript
import { useDebouncedValue } from './hooks/useDebouncedValue';

const debouncedQuery = useDebouncedValue(query, 200);
```

---

## 📊 Analytics Tracking (Optional)

Track navigation usage for insights:

```typescript
// In navigation handlers
const trackNavigation = (viewId: string, method: 'click' | 'keyboard' | 'command-palette') => {
  // Send to analytics
  console.log('Navigation:', { viewId, method, timestamp: Date.now() });
};

// Example usage
setCurrentView('ai-brain');
trackNavigation('ai-brain', 'keyboard');
```

---

## 🔄 Migration Guide (Existing Users)

If you have users with saved preferences:

### localStorage Keys Used
- `dashboard_layout_preset` → Layout preference
- `sidebar_collapsed` → Sidebar state (if you add persistence)
- `favorite_views` → Favorited navigation items (future)

### Preserve User Preferences

```typescript
// On mount, restore favorites
useEffect(() => {
  const savedFavorites = localStorage.getItem('favorite_views');
  if (savedFavorites) {
    try {
      const favorites = JSON.parse(savedFavorites);
      favorites.forEach((viewId: string) => addFavorite(viewId));
    } catch (e) {
      console.error('Failed to restore favorites:', e);
    }
  }
}, []);

// On change, save favorites
useEffect(() => {
  localStorage.setItem('favorite_views', JSON.stringify(favoriteViews));
}, [favoriteViews]);
```

---

## 🚀 Advanced Features (Future Enhancements)

### Phase 2: React Router

```bash
npm install react-router-dom
```

```typescript
import { BrowserRouter, Routes, Route } from 'react-router-dom';

<BrowserRouter>
  <Routes>
    <Route path="/" element={<MainDashboard />} />
    <Route path="/ai-brain" element={<AIBrainView />} />
    <Route path="/portfolio" element={<PortfolioView />} />
    {/* ... more routes ... */}
  </Routes>
</BrowserRouter>
```

### Phase 3: Breadcrumbs

```typescript
import { Breadcrumbs } from './components/Breadcrumbs';

<Breadcrumbs />
// Renders: Dashboard > Portfolio > Active Positions
```

### Phase 4: Voice Commands

```typescript
import { useVoiceCommands } from './hooks/useVoiceCommands';

useVoiceCommands({
  'open dashboard': () => setCurrentView('dashboard'),
  'start bot': () => setBotState('RUNNING'),
});
```

---

## 📚 Additional Resources

### Documentation
- **Full Optimization Plan:** `NAVIGATION_OPTIMIZATION.md`
- **Keyboard Shortcuts:** See `useKeyboardShortcuts.ts` export `KEYBOARD_SHORTCUTS`

### Design Reference
- **Color Palette:** See `tailwind.config.js`
- **Typography:** Existing design system
- **Spacing:** Tailwind spacing scale (4px increments)

### Support
- **Issues:** Report bugs or suggestions
- **Testing:** Run test suite before deploying

---

## ✅ Post-Integration Checklist

- [ ] All new files imported correctly
- [ ] TradingContext updated with new state
- [ ] Command palette opens with `Cmd+K`
- [ ] Keyboard shortcuts work
- [ ] Quick actions menu appears
- [ ] Mobile bottom nav visible on mobile
- [ ] Mobile hamburger menu works
- [ ] Dashboard is default view
- [ ] No console errors
- [ ] Tested on desktop (Chrome, Firefox, Safari)
- [ ] Tested on mobile (iOS Safari, Android Chrome)
- [ ] Accessibility: Keyboard navigation works
- [ ] Accessibility: Screen reader friendly
- [ ] Performance: No lag or jank

---

## 🎉 You're Done!

Your Kalshi trading dashboard now has:
- ✅ Command palette (Cmd+K)
- ✅ Global keyboard shortcuts
- ✅ Quick action floating menu
- ✅ Mobile-responsive navigation
- ✅ Dashboard as default view

**Next Steps:**
1. Test thoroughly on all devices
2. Gather user feedback
3. Consider implementing React Router (Phase 2)
4. Add breadcrumbs for nested navigation (Phase 3)

---

**Document Version:** 1.0
**Last Updated:** 2026-01-22
**Status:** Ready for Integration

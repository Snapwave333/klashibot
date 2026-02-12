# Brand Identity: "AURA"

## 1. Brand Concept
**Name**: AURA (Autonomous Universal Reasoning Agent)
**Tagline**: "Clarity in Chaos"
**Core Values**: Precision, Speed, Transparency, Autonomy.

## 2. The Mascot: "Aura"
Aura is not a cartoon; she is a high-fidelity, holographic representation of the AI's cognitive state.
*   **Visual Form**: A glowing, geometric sphere that morphs into different shapes based on system state. It is surrounded by orbiting data rings.
*   **Personality**: Professional, hyper-intelligent, calm, yet alert.
*   **States**:
    *   **Idle**: A slow-pulsing blue sphere.
    *   **Thinking/Processing**: Rapidly spinning rings, color shifts to cyan/white.
    *   **Action/Trade**: Bursts into a geometric star shape (Neon Green).
    *   **Warning/Risk**: Turns amber, jagged edges.
    *   **Critical/Error**: Turns red, unstable vibration.

## 3. Brand Guidelines

### Color Palette (The "Neon Horizon")
*   **Primary**: `Neon Cyan` (`var(--primary-500)`) - Represents Intelligence & Data.
*   **Secondary**: `Void Black` (`var(--bg-app)`) - Represents the Market Depth.
*   **Accent**: `Quantum Green` (`var(--color-success)`) - Represents Profit & Execution.
*   **Alert**: `Plasma Red` (`var(--color-danger)`) - Represents Risk & Stop Loss.
*   **Warning**: `Solar Amber` (`var(--color-warning)`) - Represents Caution & Limits.

### Typography
*   **Headings**: `Inter` (Bold, Uppercase, Tracking-Wide) - Clean, authoritative.
*   **Data/Code**: `JetBrains Mono` - Precise, technical.
*   **Scale**: Fluid typography using `clamp()` logic (`--text-xs` to `--text-4xl`).

### UI Styling "Glass & Light"
*   **Glassmorphism**: High-blur backdrops (`backdrop-blur-xl`), thin white borders.
*   **Glow Effects**: Subtle box-shadows to indicate activity/focus.
*   **Micro-Interactions**: Smooth, physics-based transitions (spring animations).
*   **Touch Targets**: Minimum 44x44px for all interactive elements.

## 4. Usage in UI
*   **Top Bar**: Aura sits in the center or left, acting as the "System Status" indicator.
*   **AI Insight Panel**: Aura "speaks" here. The visualizer pulses when TTS is active.
*   **Loading States**: Aura spins or morphs instead of a generic spinner.
*   **Trade Notifications**: A "flash" of Aura accompanies every executed trade.

## 5. Component Library
The UI is built on a set of atomic primitives found in `src/components/ui`:
*   **Button**: Polymorphic, accessible button with variants (Neon, Ghost, Destructive).
*   **Input**: Standardized form fields with validation states.
*   **Badge**: Semantic status indicators.
*   **GlassCard**: The fundamental container for all widgets and panels.
*   **AuraMascot**: The stateful brand identity component.

## 6. Style Guide
A live, interactive Style Guide is available within the application at `/style-guide`. It allows developers to:
*   Copy color tokens.
*   Test component states.
*   Visualize mascot animations.

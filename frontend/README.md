# Kalashi Frontend

The React-based dashboard for the Kalashi Trading Agent, featuring the **AURA Design System**.

## 🚀 Quick Start

1.  **Install Dependencies**:
    ```bash
    npm install
    ```

2.  **Start Development Server**:
    ```bash
    npm start
    ```
    Access the app at `http://localhost:3000`.

## 🎨 AURA Design System

The UI is built on the "AURA" design language, emphasizing clarity, speed, and autonomy.

### Key Features
*   **Theme Aware**: Full Dark/Light mode support via CSS variables.
*   **Responsive**: Fluid typography and layout that adapts from Mobile to Cinema displays.
*   **Accessible**: WCAG 2.2 compliant contrast and touch targets.

### Core Components (`src/components/ui`)
*   **`Button`**: The primary interaction element.
*   **`GlassCard`**: The standard container for widgets.
*   **`AuraMascot`**: Visualizes the AI agent's state (Thinking, Idle, Warning).

### Style Guide
A live style guide is available at `/style-guide` (accessible via the sidebar). Use this to explore the component library and copy design tokens.

## 📁 Project Structure

*   `src/components/layout`: Global layout shells (Sidebar, TopBar).
*   `src/components/ui`: Atomic design primitives.
*   `src/components/widgets`: Business-logic rich dashboard widgets.
*   `src/views`: Top-level page components.
*   `src/context`: React Context providers (Theme, Trading Data).
*   `src/hooks`: Custom React hooks.

## 🔧 Configuration

*   **Tailwind**: Configured in `tailwind.config.js` to map to AURA CSS variables.
*   **Theming**: Defined in `src/index.css` (root variables).

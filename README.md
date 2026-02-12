# ⚡ Kalshi AI Trading Agent

<div align="center">

![Python](https://img.shields.io/badge/Python-3.10%2B-blue?style=for-the-badge&logo=python&logoColor=white)
![Platform](https://img.shields.io/badge/Platform-Kalshi-green?style=for-the-badge&logo=chart-line)
![Status](https://img.shields.io/badge/Status-Active-success?style=for-the-badge)
![License](https://img.shields.io/badge/License-Proprietary-red?style=for-the-badge)

**An autonomous, high-performance trading engine designed for the Kalshi prediction market.**

[Features](#-key-features) • [Architecture](#-system-architecture) • [Installation](#-installation--setup) • [Monitoring](#-performance--monitoring)

</div>

---

## 🚀 Overview

The **Kalshi AI Trading Agent** is a cutting-edge, modular system engineered for capital efficiency and high-speed execution. By leveraging a **Multi-MCP Ecosystem** and an automated **"Ralph" Loop**, this agent systematically observes, plans, and executes trades with deterministic precision.

## ✨ Key Features

### 🧠 Intelligent Core
- **"Ralph" Loop**: A continuous Observer-Plan-Build cycle ensuring disciplined execution.
- **"Brian" Interface**: A professional, persona-driven output system offering transparent insights into every decision.
- **Multi-Strategy Engine**: Orchestrates Fundamental, Sentiment, and Technical analysis concurrently.

### 🛡️ Robust Infrastructure
- **Hardened Security**: 
  - **Self-Healing**: Reactive container and deployment restarts.
  - **Thermal Safety**: Automatic inference shutdown if GPU temp > 85°C.
- **High-Performance DB**: SQLite in WAL mode for high-concurrency access.
- **Kubernetes Scaling**: Orchestration via `kubectl` for enterprise-grade scalability.

### 🌐 Multi-MCP Ecosystem
Integrated registry of parallel tool servers:
- **Kalshi MCP**: Direct market data and order execution.
- **System MCP**: GPU Telemetry (RTX 4070), Git/Docker management.
- **Browser MCP**: Playwright-powered market context extraction.

### 🎨 "AURA" UI
A modern, glassmorphism-inspired design system featuring a reactive mascot for real-time system status visualization.

---

## 📂 System Architecture

The codebase is structured for modularity and ease of extension:

| Module | Description |
| :--- | :--- |
| `trading_engine.py` | Central orchestrator managing the event loop. |
| `strategies/` | Contains logic for `manager`, `fundamental` (math edge), and `sentiment` analysis. |
| `risk/` | Centralized risk control for sizing, limits, and portfolio safety. |
| `dev_suite/` | Comprehensive testing and benchmarking tools. |
| `execution/` | *(Planned)* Advanced order routing algorithms. |

---

## 🛠️ Installation & Setup

### Prerequisites
- **Python 3.10+**
- **Kalshi Account** & API Keys
- **MCP Server** (for API connectivity)

### Quick Start

1.  **Clone the Repository**
    ```bash
    git clone https://github.com/Snapwave333/klashibot.git
    cd klashibot
    ```

2.  **Install Dependencies**
    ```bash
    pip install -r requirements.txt
    ```

3.  **Configure Environment**
    Set up your `.env` file with necessary API keys and configuration settings.

4.  **Launch the Agent**
    Start the full stack (Dashboard + Bridge + MCP Servers):
    ```bash
    python launcher.py
    ```

5.  **Verify System Health**
    ```bash
    python verify_mcp_servers.py
    ```

---

## 📊 Performance & Monitoring

The agent provides real-time transparency via the **"Brian"** persona:

- **📈 Live Metrics**: Win Rate, PnL, Sharpe Ratio.
- **⚡ Execution Details**: Granular logs of every trade.
- **🔔 Risk Alerts**: Immediate notifications for portfolio advisories.

---

<div align="center">

**Proprietary Software** • All Rights Reserved

</div>


# Kalshi Development Suite

This suite provides comprehensive testing, debugging, and benchmarking tools for the Kalshi project.

## Components

### 1. Testing (`dev_suite/tests`)
Unit and integration tests using `pytest`.
- Run all tests: `python dev_suite/run_suite.py`
- Run specific test: `pytest dev_suite/tests/test_trading_engine.py`

### 2. Benchmarking (`dev_suite/benchmarks`)
Performance benchmarks using `pytest-benchmark`.
- Reports are generated in `dev_suite/reports/benchmark.json`.

### 3. Debugging (`dev_suite/debug`)
A configured debugger wrapper.
Usage:
```python
from dev_suite.debug.debugger import debugger
debugger.log("Message")
debugger.breakpoint()
```

### 4. Configuration (`dev_suite/config`)
`suite_config.yaml` controls test parameters and thresholds.

## Modular Architecture
The system has been refactored into:
- `strategies/`: Trading logic (Fundamental, Sentiment).
- `risk/`: Risk management (Kelly, VaR, Limits).
- `execution/`: Execution algorithms.
- `models.py`: Shared data structures.

## Usage

Run the full suite:
```bash
$env:PYTHONPATH = "."
python dev_suite/run_suite.py
```

## Reports
- HTML Coverage: `dev_suite/reports/coverage/index.html`
- Benchmark JSON: `dev_suite/reports/benchmark.json`

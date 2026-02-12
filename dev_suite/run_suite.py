
import subprocess
import sys
import yaml
from pathlib import Path
from rich.console import Console
from rich.panel import Panel

console = Console()

def load_config():
    config_path = Path("dev_suite/config/suite_config.yaml")
    if config_path.exists():
        with open(config_path) as f:
            return yaml.safe_load(f)
    return {}

def run_tests(config):
    console.print(Panel("Running Test Suite...", style="bold blue"))
    
    args = [
        sys.executable, "-m", "pytest",
        "dev_suite/tests",
        "--cov=.", 
        "--cov-report=term-missing",
        "--cov-report=html:dev_suite/reports/coverage"
    ]
    
    if config.get('testing', {}).get('parallel'):
        # args.append("-n", str(config['testing']['num_workers']))
        pass # pytest-xdist not installed, skipping parallel flag for now

    result = subprocess.run(args)
    return result.returncode

def run_benchmarks(config):
    console.print(Panel("Running Benchmarks...", style="bold green"))
    
    args = [
        sys.executable, "-m", "pytest",
        "dev_suite/benchmarks",
        "--benchmark-only",
        "--benchmark-json=dev_suite/reports/benchmark.json"
    ]
    
    result = subprocess.run(args)
    return result.returncode

def main():
    config = load_config()
    
    # Create reports dir
    Path("dev_suite/reports").mkdir(exist_ok=True)
    
    # Run Tests
    test_code = run_tests(config)
    
    if test_code == 0:
        console.print("[bold green]Tests Passed![/bold green]")
    else:
        console.print("[bold red]Tests Failed![/bold red]")
        # We might want to continue to benchmarks even if tests fail, 
        # or stop. Let's continue for now.
        
    # Run Benchmarks
    bench_code = run_benchmarks(config)
    
    if bench_code == 0:
        console.print("[bold green]Benchmarks Completed![/bold green]")
    else:
        console.print("[bold red]Benchmarks Failed![/bold red]")

    # Summary
    console.print(Panel(f"Report generated at dev_suite/reports", title="Execution Complete"))

if __name__ == "__main__":
    main()

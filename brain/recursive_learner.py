import json
import os
from datetime import datetime
from typing import Dict, List, Any, Optional

class RecursiveLearner:
    """
    A persistent learning engine that tracks trade outcomes and optimizes strategy weights.
    It provides a 'Recursive Context' to the AI agent based on historical performance.
    """
    def __init__(self, data_path: str = "data/brain.json"):
        self.data_path = data_path
        self.brain_data = {
            "strategy_weights": {
                "FundamentalStrategy": 1.0,
                "SentimentStrategy": 1.0,
                "Ensemble": 1.0
            },
            "strategy_params": {
                "FundamentalStrategy": {"min_edge": 0.1},
                "SentimentStrategy": {"sentiment_threshold": 0.3}
            },
            "performance_history": [],
            "lessons_learned": [
                "Avoid markets with extremely low liquidity even if edge seems high.",
                "Be cautious of sentiment-driven trades during major economic releases."
            ],
            "last_updated": datetime.now().isoformat()
        }
        self.load()

    def load(self):
        """Load brain data from disk."""
        if os.path.exists(self.data_path):
            try:
                with open(self.data_path, "r") as f:
                    data = json.load(f)
                    # Merge existing data to preserve structure
                    self.brain_data.update(data)
            except Exception as e:
                print(f"⚠️ Brain Load Error: {e}")

    def save(self):
        """Save brain data to disk."""
        os.makedirs(os.path.dirname(self.data_path), exist_ok=True)
        try:
            with open(self.data_path, "w") as f:
                json.dump(self.brain_data, f, indent=2)
        except Exception as e:
            print(f"⚠️ Brain Save Error: {e}")

    def update_performance(self, ticker: str, strategy: str, outcome: float, reasoning: str):
        """
        Record a trade outcome and recursively update weights.
        outcome: Positive for win, negative for loss.
        """
        entry = {
            "timestamp": datetime.now().isoformat(),
            "ticker": ticker,
            "strategy": strategy,
            "outcome": outcome,
            "reasoning": reasoning
        }
        self.brain_data["performance_history"].append(entry)
        
        # Keep last 100 history items
        if len(self.brain_data["performance_history"]) > 100:
            self.brain_data["performance_history"] = self.brain_data["performance_history"][-100:]

        # Update weights (Recursive learning step)
        learning_rate = 0.05
        current_weight = self.brain_data["strategy_weights"].get(strategy, 1.0)
        
        if outcome > 0:
            new_weight = current_weight * (1 + learning_rate)
        else:
            new_weight = current_weight * (1 - learning_rate)
            
        self.brain_data["strategy_weights"][strategy] = max(0.1, min(2.0, new_weight))
        
        # Recursively optimize params (Simple heuristic: increase threshold if losing)
        if outcome < 0:
            params = self.get_strategy_params(strategy)
            if strategy == "FundamentalStrategy":
                params["min_edge"] = min(5.0, params.get("min_edge", 0.1) + 0.1)
            elif strategy == "SentimentStrategy":
                params["sentiment_threshold"] = min(0.9, params.get("sentiment_threshold", 0.3) + 0.05)
            self.update_strategy_params(strategy, params)

        self.brain_data["last_updated"] = datetime.now().isoformat()
        self.save()

    def get_strategy_weight(self, strategy_name: str) -> float:
        return self.brain_data["strategy_weights"].get(strategy_name, 1.0)

    def get_strategy_params(self, strategy_name: str) -> Dict[str, Any]:
        return self.brain_data.get("strategy_params", {}).get(strategy_name, {})

    def update_strategy_params(self, strategy_name: str, params: Dict[str, Any]):
        if "strategy_params" not in self.brain_data:
            self.brain_data["strategy_params"] = {}
        if strategy_name not in self.brain_data["strategy_params"]:
            self.brain_data["strategy_params"][strategy_name] = {}
        self.brain_data["strategy_params"][strategy_name].update(params)
        self.save()

    def get_recursive_context(self) -> str:
        weights_str = ", ".join([f"{k}: {v:.2f}" for k, v in self.brain_data["strategy_weights"].items()])
        lessons = "\n".join([f"- {l}" for l in self.brain_data["lessons_learned"][-5:]])
        
        return (
            f"\n### RECURSIVE BRAIN FEEDBACK ###\n"
            f"Current Strategy Confidence Weights: {weights_str}\n"
            f"Key Historical Lessons:\n{lessons}\n"
            f"Performance over last 10 trades: {self._get_recent_performance_summary()}\n"
        )

    def _get_recent_performance_summary(self) -> str:
        recent = self.brain_data["performance_history"][-10:]
        if not recent:
            return "No data yet."
        wins = sum(1 for x in recent if x["outcome"] > 0)
        return f"{wins} Wins / {len(recent) - wins} Losses"

    def add_lesson(self, lesson: str):
        if lesson not in self.brain_data["lessons_learned"]:
            self.brain_data["lessons_learned"].append(lesson)
            if len(self.brain_data["lessons_learned"]) > 20:
                self.brain_data["lessons_learned"] = self.brain_data["lessons_learned"][-20:]
            self.save()

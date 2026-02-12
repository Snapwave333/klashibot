#!/usr/bin/env python3
"""
Highly Optimized Trading Engine for Kalshi AI Agent
Production-ready with async patterns, intelligent caching, and circuit breakers
"""

import asyncio
import json
import sys
import os
import time
import random
import hashlib
import logging
from contextlib import asynccontextmanager
from dataclasses import asdict
from typing import List, Dict, Optional, Tuple, Any, Set
from datetime import datetime, timedelta
from collections import deque, defaultdict
from functools import lru_cache

logger = logging.getLogger(__name__)

# Performance imports with graceful fallbacks
try:
    import orjson

    USE_ORJSON = True
    json_loads = orjson.loads
    json_dumps = orjson.dumps
except ImportError:
    USE_ORJSON = False
    json_loads = json.loads
    json_dumps = lambda x: json.dumps(x).encode()

aioredis = None
HAS_REDIS = False
try:
    import redis.asyncio as aioredis

    HAS_REDIS = True
except ImportError:
    pass

try:
    import aiohttp

    HAS_AIOHTTP = True
except ImportError:
    HAS_AIOHTTP = False

from models import MarketOpportunity, TradePerformance
from strategies.manager import StrategyManager
from risk.manager import RiskManager, RiskConfig
from brain.recursive_learner import RecursiveLearner


class CircuitBreaker:
    """Circuit breaker pattern for fault tolerance"""

    def __init__(self, failure_threshold: int = 5, recovery_timeout: int = 30):
        self.failure_threshold = failure_threshold
        self.recovery_timeout = recovery_timeout
        self.failure_count = 0
        self.last_failure_time = None
        self.state = "closed"  # closed, open, half-open
        self._lock = asyncio.Lock()

    async def call(self, func, *args, **kwargs):
        async with self._lock:
            if self.state == "open":
                if (
                    self.last_failure_time
                    and time.time() - self.last_failure_time > self.recovery_timeout
                ):
                    self.state = "half-open"
                else:
                    raise CircuitBreakerOpen("Circuit breaker is open")

        try:
            result = await func(*args, **kwargs)
            async with self._lock:
                if self.state == "half-open":
                    self.state = "closed"
                    self.failure_count = 0
            return result
        except Exception as e:
            async with self._lock:
                self.failure_count += 1
                self.last_failure_time = time.time()
                if self.failure_count >= self.failure_threshold:
                    self.state = "open"
            raise


class CircuitBreakerOpen(Exception):
    pass


class AsyncCache:
    """High-performance async cache with Redis and local fallback"""

    def __init__(self, redis_client=None, default_ttl: int = 60):
        self.redis = redis_client
        self.local_cache = {}
        self.local_ttl = {}
        self.default_ttl = default_ttl
        self._lock = asyncio.Lock()
        self._local_max_size = 500
        self._hits = 0
        self._misses = 0

    async def get(self, key: str) -> Optional[Any]:
        # Try Redis first
        if self.redis:
            try:
                data = await self.redis.get(key)
                if data:
                    self._hits += 1
                    return json_loads(data)
            except Exception as e:
                logger.debug(f"Redis get error: {e}")

        # Fall back to local cache
        async with self._lock:
            if key in self.local_cache:
                if datetime.now() < self.local_ttl.get(key, datetime.min):
                    self._hits += 1
                    return self.local_cache[key]
                else:
                    del self.local_cache[key]
                    del self.local_ttl[key]

        self._misses += 1
        return None

    async def set(self, key: str, value: Any, ttl: Optional[int] = None):
        ttl = ttl or self.default_ttl

        # Try Redis first
        if self.redis:
            try:
                await self.redis.setex(key, ttl, json_dumps(value))
                return
            except Exception as e:
                logger.debug(f"Redis set error: {e}")

        # Fall back to local cache
        async with self._lock:
            self.local_cache[key] = value
            self.local_ttl[key] = datetime.now() + timedelta(seconds=ttl)

            # Evict oldest entries if cache too large
            if len(self.local_cache) > self._local_max_size:
                oldest_key = min(self.local_ttl.items(), key=lambda x: x[1])[0]
                self.local_cache.pop(oldest_key, None)
                self.local_ttl.pop(oldest_key, None)

    async def delete(self, key: str):
        if self.redis:
            try:
                await self.redis.delete(key)
            except Exception as e:
                logger.debug(f"Redis delete error: {e}")

        async with self._lock:
            self.local_cache.pop(key, None)
            self.local_ttl.pop(key, None)

    async def get_many(self, keys: List[str]) -> Dict[str, Any]:
        """Batch get for efficiency"""
        results = {}
        if self.redis:
            try:
                values = await self.redis.mget(keys)
                for key, value in zip(keys, values):
                    if value:
                        results[key] = json_loads(value)
            except Exception as e:
                logger.debug(f"Redis mget error: {e}")

        # Get remaining from local cache
        remaining = set(keys) - set(results.keys())
        async with self._lock:
            for key in remaining:
                if key in self.local_cache and datetime.now() < self.local_ttl.get(
                    key, datetime.min
                ):
                    results[key] = self.local_cache[key]

        return results

    @property
    def hit_rate(self) -> float:
        total = self._hits + self._misses
        return self._hits / total if total > 0 else 0.0


class MetricsCollector:
    """Collect and aggregate performance metrics"""

    def __init__(self, window_size: int = 1000):
        self.window_size = window_size
        self.metrics = defaultdict(lambda: deque(maxlen=window_size))
        self.counters = defaultdict(int)
        self.timers = {}

    def record(self, metric_name: str, value: float):
        self.metrics[metric_name].append((time.time(), value))

    def increment(self, counter_name: str, value: int = 1):
        self.counters[counter_name] += value

    @asynccontextmanager
    async def time_operation(self, operation_name: str):
        start = time.time()
        try:
            yield
        finally:
            elapsed = time.time() - start
            self.record(f"{operation_name}_latency", elapsed)

    def get_stats(self, metric_name: str) -> Dict[str, float]:
        values = [v for _, v in self.metrics[metric_name]]
        if not values:
            return {}

        sorted_values = sorted(values)
        n = len(sorted_values)

        return {
            "count": n,
            "mean": sum(values) / n,
            "min": sorted_values[0],
            "max": sorted_values[-1],
            "p50": sorted_values[n // 2],
            "p95": sorted_values[int(n * 0.95)],
            "p99": sorted_values[int(n * 0.99)],
        }

    def get_summary(self) -> Dict[str, Any]:
        return {
            "counters": dict(self.counters),
            "stats": {name: self.get_stats(name) for name in self.metrics.keys()},
        }


class ConnectionPool:
    """Manage MCP session connections with pooling"""

    def __init__(self, session_provider, max_connections: int = 5):
        self.session_provider = session_provider
        self.max_connections = max_connections
        self.pool = asyncio.Queue(maxsize=max_connections)
        self.active_connections = 0
        self._lock = asyncio.Lock()

    async def acquire(self):
        async with self._lock:
            if not self.pool.empty():
                return await self.pool.get()
            elif self.active_connections < self.max_connections:
                self.active_connections += 1
                return self.session_provider()

        # Wait for available connection
        return await self.pool.get()

    async def release(self, session):
        await self.pool.put(session)


class TradingEngine:
    """
    Production-grade trading engine with:
    - Intelligent caching
    - Circuit breaker pattern
    - Rate limiting
    - Metrics collection
    - Async optimization
    """

    def __init__(
        self,
        mcp_session,
        portfolio_callback=None,
        paper_mode=False,
        config: Optional[Dict] = None,
    ):
        self.config = config or {}

        # Session handling
        if callable(mcp_session):
            self._session_provider = mcp_session
        else:
            self._session_provider = lambda: mcp_session

        self.portfolio_callback = portfolio_callback
        self.paper_mode = paper_mode

        # Performance tracking
        self.performance = TradePerformance()
        self.trade_history = deque(maxlen=1000)

        # Initialize Managers
        self.risk_manager = RiskManager()
        self.strategy_manager = StrategyManager()
        self.learner = RecursiveLearner()

        # Strategy state
        self.active_strategy = "Ensemble"
        self.strategy_performance = {}

        # Portfolio State
        self.portfolio = {"balance": 100.0, "active_value": 0.0}

        # Redis Setup
        self.redis = None
        self.cache = None
        self._init_redis()

        # Rate limiting
        self.rate_limiter = asyncio.Semaphore(
            self.config.get("max_concurrent_requests", 10)
        )
        self.request_timestamps = deque(maxlen=100)
        self.min_request_interval = self.config.get("min_request_interval", 0.1)

        # Circuit breakers
        self.market_scan_breaker = CircuitBreaker(
            failure_threshold=3, recovery_timeout=60
        )
        self.trade_execution_breaker = CircuitBreaker(
            failure_threshold=5, recovery_timeout=30
        )

        # Metrics
        self.metrics = MetricsCollector()

        # Scan Optimization
        self.scan_cooldown = self.config.get("scan_cooldown", 15)
        self.last_scan_time = datetime.min
        self.global_market_cache = []

        # Execution Metrics
        self.execution_metrics = {
            "total_orders": 0,
            "filled_orders": 0,
            "avg_slippage": 0.0,
            "slippage_samples": deque(maxlen=1000),
            "order_latency_ms": deque(maxlen=1000),
        }

        self.last_fill_times = {}
        self.price_impact_history = defaultdict(lambda: deque(maxlen=50))

        # Connection pool
        self.connection_pool = ConnectionPool(self._session_provider, max_connections=5)

        # Predefined market series for scanning
        self.target_series = ["FED", "KXECON", "KXINX", "KXCRYPTO", "INX", "BTC", "ETH"]

        logger.info("Trading Engine initialized")

    def _init_redis(self):
        """Initialize Redis connection with fallback"""
        self.redis = None
        if HAS_REDIS and aioredis is not None:
            try:
                redis_host = os.getenv("REDIS_HOST", "localhost")
                redis_port = int(os.getenv("REDIS_PORT", 6379))
                redis_db = int(os.getenv("REDIS_DB", 0))

                self.redis = aioredis.Redis(
                    host=redis_host,
                    port=redis_port,
                    db=redis_db,
                    decode_responses=True,
                    socket_connect_timeout=5,
                    socket_keepalive=True,
                    health_check_interval=30,
                )

                self.cache = AsyncCache(self.redis, default_ttl=60)
                logger.info(f"Redis connected: {redis_host}:{redis_port}")
            except Exception as e:
                logger.warning(f"Redis connection failed: {e}. Using local cache.")
                self.redis = None
                self.cache = AsyncCache(default_ttl=60)
        else:
            self.cache = AsyncCache(default_ttl=60)

    @property
    def mcp_session(self):
        return self._session_provider()

    async def _rate_limited_call(self, func, *args, **kwargs):
        """Execute call with rate limiting"""
        async with self.rate_limiter:
            # Enforce minimum interval between requests
            if self.request_timestamps:
                elapsed = time.time() - self.request_timestamps[-1]
                if elapsed < self.min_request_interval:
                    await asyncio.sleep(self.min_request_interval - elapsed)

            self.request_timestamps.append(time.time())
            return await func(*args, **kwargs)

    async def check_health(self) -> Dict[str, Any]:
        """Check connection health for Redis and cache"""
        health = {
            "redis": {"status": "n/a", "latency_ms": 0, "message": "Not configured"},
            "cache": {"status": "ok", "hit_rate": 0.0, "message": "Local cache active"},
            "circuit_breakers": {
                "market_scan": self.market_scan_breaker.state,
                "trade_execution": self.trade_execution_breaker.state,
            },
            "metrics": self.metrics.get_summary(),
        }

        redis_client = self.redis
        if redis_client is not None:
            try:
                t0 = time.time()
                await redis_client.ping()
                latency = int((time.time() - t0) * 1000)
                health["redis"] = {
                    "status": "ok",
                    "latency_ms": latency,
                    "message": f"Connected ({latency}ms)",
                }
            except Exception as e:
                health["redis"] = {
                    "status": "error",
                    "latency_ms": 0,
                    "message": str(e),
                }

        cache = self.cache
        if cache is not None:
            health["cache"]["hit_rate"] = cache.hit_rate

        return health

    async def scan_markets_parallel(self, limit: int = 50) -> List[Dict]:
        """
        Optimized market scanning with:
        - Intelligent caching
        - Parallel requests with semaphore control
        - Exponential backoff
        - Circuit breaker protection
        """
        now = datetime.now()

        # Check cache first
        cached_markets = await self.cache.get("global_market_cache")
        if cached_markets:
            self.metrics.increment("cache_hits_market_scan")
            return cached_markets

        self.metrics.increment("cache_misses_market_scan")

        try:
            markets = []

            async def fetch_series(series: str) -> List[Dict]:
                """Fetch markets for a single series with retry logic"""
                for attempt in range(3):
                    try:
                        async with self.metrics.time_operation("fetch_series"):
                            result = await self._rate_limited_call(
                                self.mcp_session.call_tool,
                                "get_markets",
                                {
                                    "limit": 15,
                                    "series_ticker": series,
                                    "status": "open",
                                },
                            )

                        if hasattr(result, "content") and result.content:
                            data = json_loads(result.content[0].text)
                            return data.get("markets", [])

                        await asyncio.sleep(0.5 * (2**attempt))  # Exponential backoff

                    except Exception as e:
                        if "429" in str(e):
                            logger.warning(
                                f"Rate limit hit for {series}, backing off..."
                            )
                            await asyncio.sleep(2**attempt)
                        elif attempt == 2:
                            logger.error(
                                f"Failed to fetch {series} after 3 attempts: {e}"
                            )
                        else:
                            await asyncio.sleep(0.5 * (2**attempt))

                return []

            # Fetch all series in parallel with concurrency limit
            semaphore = asyncio.Semaphore(3)  # Max 3 concurrent series fetches

            async def bounded_fetch(series):
                async with semaphore:
                    return await fetch_series(series)

            results = await asyncio.gather(
                *[bounded_fetch(series) for series in self.target_series]
            )

            for series_markets in results:
                markets.extend(series_markets)

            # Generic fallback if still low on markets
            if len(markets) < 10:
                try:
                    result = await self._rate_limited_call(
                        self.mcp_session.call_tool,
                        "get_markets",
                        {"limit": 30, "status": "open"},
                    )
                    if hasattr(result, "content") and result.content:
                        data = json_loads(result.content[0].text)
                        markets.extend(data.get("markets", []))
                except Exception as e:
                    logger.warning(f"Fallback market fetch failed: {e}")

            # Filter and deduplicate with list comprehension
            seen_tickers: Set[str] = set()
            filtered_markets = []

            for m in markets:
                ticker = m.get("ticker")
                if ticker and ticker not in seen_tickers:
                    seen_tickers.add(ticker)
                    status = str(m.get("status", "")).lower()
                    if status in ["active", "open", "initialized"]:
                        # Enrich in-place
                        m["probability"] = (
                            m.get("yes_bid", 50) + m.get("yes_ask", 50)
                        ) / 200
                        m["liquidity_score"] = min(
                            max(m.get("volume", 0), 100) / 1000, 1.0
                        )
                        filtered_markets.append(m)

            # Store in cache
            await self.cache.set(
                "global_market_cache", filtered_markets, ttl=self.scan_cooldown
            )
            self.last_scan_time = now

            self.metrics.increment("successful_market_scans")
            logger.info(f"Market Scan: {len(filtered_markets)} quality markets indexed")

            return filtered_markets

        except Exception as e:
            self.metrics.increment("failed_market_scans")
            logger.error(f"Market scan failure: {e}")
            return []

    async def analyze_market_fast(self, ticker: str) -> Optional[MarketOpportunity]:
        """
        Fast market analysis with intelligent caching and parallel data fetching
        """
        cache_key = f"opp_{ticker}"

        try:
            # Check cache
            cached_opp = await self.cache.get(cache_key)
            if cached_opp:
                self.metrics.increment("cache_hits_analysis")
                if "timestamp" in cached_opp and isinstance(
                    cached_opp["timestamp"], str
                ):
                    del cached_opp["timestamp"]
                return MarketOpportunity(**cached_opp)

            self.metrics.increment("cache_misses_analysis")

            # Fetch market and orderbook in parallel
            async with self.metrics.time_operation("market_analysis"):
                market_task = self._rate_limited_call(
                    self.mcp_session.call_tool, "get_market", {"ticker": ticker}
                )
                orderbook_task = self._rate_limited_call(
                    self.mcp_session.call_tool, "get_orderbook", {"ticker": ticker}
                )

                market_result, orderbook_result = await asyncio.gather(
                    market_task, orderbook_task, return_exceptions=True
                )

            # Parse results
            def parse_res(res):
                if (
                    not res
                    or not hasattr(res, "content")
                    or not res.content
                    or not res.content[0].text
                ):
                    return None
                try:
                    return json_loads(res.content[0].text)
                except Exception:
                    return None

            market_data = parse_res(market_result) or {}
            orderbook_data = parse_res(orderbook_result) or {}

            # Unwrap nested responses
            market_data = market_data.get("market", market_data)
            orderbook_data = orderbook_data.get("orderbook", orderbook_data)

            if not market_data:
                return None

            # Analyze with strategies
            opportunities = await self.strategy_manager.analyze_market(
                market_data, orderbook_data, self.mcp_session, learner=self.learner
            )

            opportunity = None
            if opportunities:
                opportunity = max(opportunities, key=lambda x: x.edge * x.confidence)

            # Calculate mid price
            mid_price = self._calculate_mid_price(orderbook_data)

            # Create default opportunity if none found
            if not opportunity:
                opportunity = MarketOpportunity(
                    ticker=ticker,
                    market_title=market_data.get("title", ""),
                    edge=0,
                    confidence=0,
                    side="yes",
                    entry_price=mid_price * 100,
                    suggested_size=0,
                    reasoning="Pulse",
                    liquidity_score=0.5,
                    probability=mid_price,
                )
            else:
                opportunity.probability = mid_price

            # Cache result
            await self.cache.set(
                cache_key,
                asdict(opportunity),
                ttl=self.config.get("analysis_cache_ttl", 30),
            )

            return opportunity

        except Exception as e:
            self.metrics.increment("analysis_errors")
            logger.error(f"Analysis error for {ticker}: {e}")
            return None

    def _calculate_mid_price(self, orderbook_data: Dict) -> float:
        """Calculate mid price from orderbook"""
        if not orderbook_data:
            return 0.5

        yes_data = orderbook_data.get("yes") or {}
        yes_bids = yes_data.get("bids", [])
        yes_asks = yes_data.get("asks", [])

        best_bid = yes_bids[0]["price"] if yes_bids else 0
        best_ask = yes_asks[0]["price"] if yes_asks else 100

        return (best_bid + best_ask) / 200.0

    async def execute_trade_fast(self, opportunity: MarketOpportunity) -> bool:
        """
        Execute trade with circuit breaker protection and comprehensive metrics
        """
        try:
            async with self.metrics.time_operation("trade_execution"):
                logger.info(
                    f"EXECUTE: {opportunity.ticker} | Edge: {opportunity.edge:.1f}%"
                )

                # Adjust price for market impact
                adjusted_price = self._adjust_price_for_impact(
                    opportunity.ticker, opportunity.entry_price
                )

                # Execute with circuit breaker
                order_result = await self.trade_execution_breaker.call(
                    self._rate_limited_call,
                    self.mcp_session.call_tool,
                    "create_order",
                    {
                        "ticker": opportunity.ticker,
                        "action": "buy",
                        "side": opportunity.side,
                        "type": "limit",
                        f"{opportunity.side}_price": int(adjusted_price),
                        "count": opportunity.suggested_size,
                        "client_order_id": f"kalashi_{int(time.time())}_{random.randint(1000, 9999)}",
                    },
                )

                self.execution_metrics["total_orders"] += 1

                if (
                    order_result
                    and hasattr(order_result, "content")
                    and order_result.content
                ):
                    data = json_loads(order_result.content[0].text)
                    logger.info(f"Order placed: {data.get('order_id', 'id')}")
                    self.execution_metrics["filled_orders"] += 1
                    self.metrics.increment("successful_trades")
                    return True

                return False

        except CircuitBreakerOpen:
            logger.warning(
                f"Trade execution circuit breaker open for {opportunity.ticker}"
            )
            return False
        except Exception as e:
            self.metrics.increment("failed_trades")
            logger.error(f"Trade execution failed: {e}")
            return False

    def _adjust_price_for_impact(self, ticker: str, price: float) -> float:
        """Adjust price based on historical market impact"""
        history = self.price_impact_history.get(ticker, deque(maxlen=50))

        if len(history) > 5:
            # If we've traded this ticker recently, adjust for expected impact
            return min(99.0, price + 1.0)

        return price

    async def find_best_opportunities(self, top_n: int = 3) -> List[MarketOpportunity]:
        """
        Find best trading opportunities with optimized filtering and ranking
        """
        try:
            markets = await self.scan_markets_parallel()
            if not markets:
                return []

            # Smart sampling: prioritize high-volume markets
            markets.sort(key=lambda m: m.get("volume", 0), reverse=True)

            # Analyze top markets in parallel with concurrency control
            analysis_limit = min(
                len(markets), self.config.get("max_parallel_analysis", 20)
            )
            top_markets = markets[:analysis_limit]

            semaphore = asyncio.Semaphore(self.config.get("max_concurrent_analysis", 5))

            async def bounded_analysis(market):
                async with semaphore:
                    return await self.analyze_market_fast(market["ticker"])

            results = await asyncio.gather(*[bounded_analysis(m) for m in top_markets])

            # Filter and apply risk management
            valid_opps = [
                o
                for o in results
                if o and isinstance(o, MarketOpportunity) and o.edge > 0
            ]

            # Apply risk sizing
            final_opps = []
            for opp in valid_opps:
                size = self.risk_manager.check_trade_risk(opp, self.portfolio)
                if size > 0:
                    opp.suggested_size = size
                    final_opps.append(opp)

            # Sort by edge and return top N
            final_opps.sort(key=lambda x: x.edge * x.confidence, reverse=True)

            return final_opps[:top_n]

        except Exception as e:
            logger.error(f"Opportunity ranking error: {e}")
            return []

    async def optimize_portfolio(self, current_positions: List[Dict]) -> Dict:
        """Portfolio optimization placeholder"""
        return {"action": "hold", "reason": "Stable"}

    async def force_test_trade(self) -> bool:
        """Pipeline sanity check with proper error handling"""
        try:
            markets = await self.scan_markets_parallel()
            if not markets:
                logger.warning("No markets available for test trade")
                return False

            target = markets[0]
            test_opp = MarketOpportunity(
                ticker=target.get("ticker", "TEST"),
                market_title="TEST",
                edge=99.0,
                confidence=1.0,
                side="yes",
                entry_price=target.get("yes_ask", 10) or 10,
                suggested_size=1,
                reasoning="Health Check",
                liquidity_score=1.0,
                probability=0.5,
            )

            return await self.execute_trade_fast(test_opp)

        except Exception as e:
            logger.error(f"Test trade failed: {e}")
            return False

    async def get_performance_report(self) -> Dict[str, Any]:
        """Generate comprehensive performance report"""
        return {
            "performance": {
                "wins": self.performance.wins,
                "losses": self.performance.losses,
                "win_rate": self.performance.win_rate,
                "total_pnl": self.performance.total_pnl,
                "avg_pnl_per_trade": self.performance.avg_pnl_per_trade,
            },
            "execution": {
                "total_orders": self.execution_metrics["total_orders"],
                "filled_orders": self.execution_metrics["filled_orders"],
                "fill_rate": (
                    self.execution_metrics["filled_orders"]
                    / self.execution_metrics["total_orders"]
                    if self.execution_metrics["total_orders"] > 0
                    else 0
                ),
            },
            "cache": {"hit_rate": self.cache.hit_rate if self.cache else 0},
            "metrics": self.metrics.get_summary(),
            "health": await self.check_health(),
        }


# Backwards compatibility
class OptimizedTradingEngine(TradingEngine):
    """Alias for TradingEngine for backwards compatibility"""

    pass

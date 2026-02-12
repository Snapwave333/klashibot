# Deployment Diagram

> **Last Updated:** 2026-01-26 | **Version:** 4.3.0

## Docker Compose Stack

```mermaid
graph TB
    subgraph "Docker Network: kalashi-net"
        subgraph "Frontend Container"
            React["React App<br/>nginx:alpine<br/>Port 3002"]
        end

        subgraph "Backend Container"
            Python["Python Backend<br/>python:3.11-slim<br/>Port 8766"]
            WS["WebSocket Server"]
            TE["Trading Engine"]
        end

        subgraph "MCP Containers"
            MCP1["mcp-server-kalshi"]
            MCP2["mcp-server-system"]
            MCP3["mcp-server-browser"]
            MCP4["mcp-server-orchestration"]
        end

        subgraph "Infrastructure"
            Redis["Redis<br/>redis:7-alpine<br/>Port 6379"]
            DB["SQLite Volume<br/>/data/kalashi.db"]
        end

        subgraph "Self-Healing"
            Healer["self-healing-worker<br/>python:3.11-slim<br/>Port 8080"]
        end
    end

    subgraph "External"
        Kalshi["Kalshi API"]
        GPU["Host GPU"]
    end

    React -->|WebSocket| Python
    Python --> Redis
    Python --> DB
    Python --> MCP1
    Python --> MCP2
    Python --> MCP3
    Python --> MCP4
    MCP1 --> Kalshi
    MCP2 --> GPU
    Healer --> Redis
    Healer --> Python
```

## Docker Compose Services

```yaml
services:
  frontend:
    build: ./frontend
    ports: ["3002:80"]
    depends_on: [backend]

  backend:
    build:
      dockerfile: Dockerfile.backend
    ports: ["8766:8766"]
    environment:
      - REDIS_HOST=redis
      - REDIS_PORT=6379
    volumes:
      - ./data:/app/data
      - ./config:/app/config
    depends_on: [redis]

  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]
    volumes:
      - ./data/redis:/data

  self-healing-worker:
    build: ./self_healing_worker
    ports: ["8080:8080"]
    depends_on: [backend, redis]
```

## Kubernetes Deployment

```mermaid
graph TB
    subgraph "Kubernetes Cluster"
        subgraph "Namespace: kalashi"
            subgraph "Deployments"
                FE["frontend<br/>replicas: 2"]
                BE["backend<br/>replicas: 1"]
                Heal["self-healing<br/>replicas: 1"]
            end

            subgraph "StatefulSets"
                Redis["redis<br/>replicas: 1"]
            end

            subgraph "Services"
                FESvc["frontend-svc<br/>ClusterIP"]
                BESvc["backend-svc<br/>ClusterIP"]
                RedisSvc["redis-svc<br/>ClusterIP"]
            end

            subgraph "Ingress"
                Ingress["kalashi-ingress<br/>nginx"]
            end

            subgraph "ConfigMaps & Secrets"
                CM["kalashi-config"]
                Secret["kalashi-secrets"]
            end

            subgraph "PersistentVolumes"
                PV1["data-pvc<br/>10Gi"]
                PV2["redis-pvc<br/>5Gi"]
            end
        end
    end

    Ingress --> FESvc
    Ingress --> BESvc
    FESvc --> FE
    BESvc --> BE
    BE --> RedisSvc
    RedisSvc --> Redis
    BE --> PV1
    Redis --> PV2
    BE --> CM
    BE --> Secret
```

## Local Development Setup

```mermaid
flowchart TD
    subgraph "Development Machine"
        subgraph "Terminal 1"
            T1[python launcher.py]
        end

        subgraph "Terminal 2"
            T2[cd frontend && npm start]
        end

        subgraph "Terminal 3"
            T3[redis-server]
        end

        subgraph "Services Started by Launcher"
            WS[WebSocket Bridge :8766]
            MCP1[MCP Kalshi]
            MCP2[MCP System]
        end
    end

    T1 --> WS
    WS --> MCP1
    WS --> MCP2
    T2 --> |http://localhost:3002| Browser
    T3 --> |:6379| Redis
    WS --> Redis
```

## Port Assignments

| Service | Port | Protocol |
|---------|------|----------|
| React Dashboard | 3002 | HTTP |
| WebSocket Bridge | 8766 | WebSocket |
| Redis | 6379 | TCP |
| Self-Healing API | 8080 | HTTP |

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `REDIS_HOST` | Redis hostname | localhost |
| `REDIS_PORT` | Redis port | 6379 |
| `KALSHI_API_KEY` | Kalshi API key | - |
| `KALSHI_PRIVATE_KEY_PATH` | Path to RSA key | config/kalshi_private.pem |
| `PAPER_MODE` | Enable paper trading | true |

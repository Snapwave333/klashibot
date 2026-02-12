# Kalashi System Diagrams

> **Last Updated:** 2026-01-26 | **Version:** 4.3.0

This directory contains all architectural and technical diagrams for the Kalashi Trading System. All diagrams use Mermaid syntax for version control compatibility.

## Diagram Index

| Diagram | File | Description |
|---------|------|-------------|
| **System Architecture** | [system-architecture.md](system-architecture.md) | High-level system overview showing all components |
| **Trading Loop Sequence** | [trading-loop-sequence.md](trading-loop-sequence.md) | Detailed sequence diagram of the AI trading loop |
| **MCP Ecosystem** | [mcp-ecosystem.md](mcp-ecosystem.md) | Multi-MCP server architecture and tool registry |
| **Class Diagram** | [class-diagram.md](class-diagram.md) | UML class diagram of core Python classes |
| **Deployment Diagram** | [deployment-diagram.md](deployment-diagram.md) | Docker Compose and Kubernetes deployment |
| **Data Flow Diagram** | [data-flow-diagram.md](data-flow-diagram.md) | End-to-end data flow through the system |
| **Risk Management Flow** | [risk-management-flow.md](risk-management-flow.md) | Risk assessment pipeline and circuit breakers |
| **Frontend Architecture** | [frontend-architecture.md](frontend-architecture.md) | React component hierarchy and AURA design system |

## Viewing Diagrams

### Option 1: VS Code Extension
Install the "Markdown Preview Mermaid Support" extension to view diagrams directly in VS Code.

### Option 2: GitHub
GitHub natively renders Mermaid diagrams in Markdown files.

### Option 3: Mermaid Live Editor
Copy diagram code to [mermaid.live](https://mermaid.live) for interactive editing and export.

### Option 4: Export to PNG/SVG
Use the Mermaid CLI to generate static images:
```bash
npm install -g @mermaid-js/mermaid-cli
mmdc -i system-architecture.md -o system-architecture.png
```

## Diagram Standards

### Color Palette
- Primary (Indigo): `#6366F1`
- Success (Green): `#10B981`
- Warning (Orange): `#F59E0B`
- Error (Red): `#EF4444`
- Info (Blue): `#3B82F6`

### Styling Guidelines
- Use consistent node shapes (rectangles for services, diamonds for decisions)
- Include component names and ports where applicable
- Add brief descriptions in node labels
- Use subgraphs to group related components

### Version Control
- Update `Last Updated` date when modifying diagrams
- Increment version number for significant changes
- Keep ASCII art in legacy documents for backward compatibility

## Related Documentation

- [ARCHITECTURE.md](../ARCHITECTURE.md) - Technical architecture overview
- [MCP_ARCHITECTURE.md](../MCP_ARCHITECTURE.md) - MCP server details
- [API_REFERENCE.md](../API_REFERENCE.md) - API documentation

# Cyber Nova Hackathon Project

This repository is organized as an npm monorepo. Applications live under `apps/`; the first workspace is [Study Hub](apps/study-hub/README.md).

## Workspaces

| Workspace | Description |
| --- | --- |
| [`apps/study-hub`](apps/study-hub/) | Local-first student dashboard and Windows desktop app |

## Getting Started

Install the workspace dependencies from the repository root:

```bash
npm install
```

Run Study Hub:

```bash
npm run dev
```

Build, type-check, and test the workspace from the root:

```bash
npm run build
npm run lint
npm test
```

On Windows, package the desktop application with:

```bash
npm run build:exe
```

See the [Study Hub README](apps/study-hub/README.md) for app-specific setup and offline/desktop instructions, and the [Study Hub PRD](apps/study-hub/PRD.md) for product requirements.

## Team

- Andrea Kaye Nieves
- Jan Jefferson C. Mesina
- Jasper Angelo B. Cariño
- John Jeffrey M. Cacho

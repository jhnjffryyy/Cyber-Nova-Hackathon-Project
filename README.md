# Cyber Nova Hackathon Project — Study Hub

Welcome to the **Cyber Nova Hackathon Project**, an npm monorepo for Study Hub, a local-first student workspace. Study Hub brings class schedules, academic tasks, study notes, practice exams, and study sessions together in an installable Progressive Web App (PWA).

---

## 🏛️ Repository Architecture (Monorepo)

This repository uses npm workspaces. Each application lives under `apps/`; Study Hub is the first application workspace.

```text
Cyber-Nova-Hackathon-Project/
├── apps/
│   └── study-hub/                # Study Hub web app and PWA
│       ├── public/               # PWA icons, web manifest, service worker
│       ├── scripts/              # Feature and pipeline tests
│       ├── src/                  # React application and shared logic
│       ├── tests/                # Test fixtures
│       ├── PRD.md                # Product requirements document
│       └── package.json          # Study Hub dependencies and scripts
├── .gitignore                    # Shared ignores, including .env and build output
├── package.json                  # npm workspace configuration and root commands
├── package-lock.json             # Root workspace dependency lockfile
└── README.md                     # Repository documentation
```

Generated `dist/` build output is ignored by Git. Build the web app locally when needed; no desktop executable or launcher scripts are required.

---

## 🚀 Tech Stack

### Study Hub

- **UI:** React 19
- **Language:** TypeScript
- **Build and development server:** Vite 8
- **Styling:** Tailwind CSS v4
- **Icons:** `lucide-react`
- **Installable app:** Progressive Web App manifest and service worker
- **Tests:** TypeScript test scripts run with `tsx`
- **Local study assistance:** In-browser and local-model workflows, with optional external integrations where configured

---

## 💻 Local Development Setup

### 1. Prerequisites

- [Node.js](https://nodejs.org/) 22.12 or newer (required by the Vite build toolchain)
- [Git](https://git-scm.com/)
- npm (included with Node.js)

### 2. Clone the Repository

```bash
git clone https://github.com/jhnjffryyy/Cyber-Nova-Hackathon-Project.git
cd Cyber-Nova-Hackathon-Project
```

### 3. Install Dependencies

Install from the repository root so npm can resolve the workspaces:

```bash
npm install
```

### 4. Start Study Hub

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

To install Study Hub as a PWA, run `npm run build` followed by `npm run preview`, then open `http://localhost:4173` in Edge or Chrome. Use the app's **Run in VS Code** panel or the browser menu to install it. For full instructions, see [apps/study-hub/README.md](apps/study-hub/README.md).

---

## 🛠️ Available Scripts

Run these commands from the repository root:

| Command | Description |
| --- | --- |
| `npm run dev` | Starts the Study Hub development server at `http://localhost:3000` |
| `npm run build` | Builds the Study Hub production web bundle |
| `npm run lint` | Runs the Study Hub TypeScript check |
| `npm test` | Runs the Study Hub test scripts |
| `npm run preview` | Previews the production PWA at `http://localhost:4173` |

---

## 📚 Product Documentation

See the [Study Hub PRD](apps/study-hub/PRD.md) for the product goals, user scenarios, requirements, and success criteria.

---

## 🤝 Team

- Andrea Kaye Nieves
- Jan Jefferson C. Mesina
- Jasper Angelo B. Cariño
- John Jeffrey M. Cacho

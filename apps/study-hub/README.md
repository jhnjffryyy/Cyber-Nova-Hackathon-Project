# Study Hub

Study Hub is a local-first student workspace for class schedules, academic tasks, study notes, practice exams, and focused study sessions. It can be installed from a supported browser as a Progressive Web App (PWA).

## Download the Project

Download the latest project source as a ZIP from the repository's `main` branch:

https://github.com/jhnjffryyy/Cyber-Nova-Hackathon-Project/archive/refs/heads/main.zip

Extract the ZIP, then open the repository root (the folder containing the root `package.json`) in VS Code.

## Run in VS Code

Use Node.js 22.12 or newer. In the VS Code integrated terminal, at the repository root:

```bash
npm install
npm run dev
```

Open http://localhost:3000 to use the development app.

## Install as a PWA

To install the production app locally, build and preview it from the repository root:

```bash
npm run build
npm run preview
```

Open http://localhost:4173 in Edge or Chrome. Select **Install Study Hub** in the app's Run in VS Code panel, or choose **Install app** from the browser menu. After installation, open the app once while online so the service worker can cache its app shell and assets before using it offline.

Public hosting must use HTTPS for PWA installation. Localhost is also supported for development and preview. When running the local PWA, the preview server must be running. Offline availability applies to the cached app shell and assets; AI models and external services may need their own downloads or an internet connection.

## Root Workspace Commands

| Command | Description |
| --- | --- |
| `npm run dev` | Starts the development server |
| `npm run build` | Builds the production web app |
| `npm run preview` | Previews the production build at `http://localhost:4173` |
| `npm run lint` | Runs the TypeScript check |
| `npm test` | Runs the Study Hub test scripts |

See [PRD.md](PRD.md) for product goals, scenarios, and requirements.

## Qwen 2.5 3B Offline Intelligence Modes

1. **Instant embedded engine (default)**: Runs directly on the device without downloading large model weights.
2. **In-browser WebGPU mode**: Choose **Qwen 2.5 3B** in the sidebar and download/cache the `Qwen2.5-3B-Instruct-q4f16_1-MLC` model. It then runs locally using the device GPU.
3. **Local Ollama / llama.cpp server**: Run `ollama run qwen2.5:3b` on port `11434`; Study Hub can use the local server.

## Key Features

- **Schedule and COR parser**: Extract subjects, faculty, and room codes from university COR certificates into a weekly timetable.
- **To-do list**: Filter tasks by status and priority and link them to courses.
- **Clutch Notes**: Upload lecture PDFs, text, or images to create focused review notes.
- **Exam simulator**: Take multiple-choice, true/false, and identification practice exams with grading and explanations.
- **Installable PWA**: Install Study Hub from a supported browser and use cached app assets offline.

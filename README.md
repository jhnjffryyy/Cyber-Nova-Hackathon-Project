# StudyFlow AI - Offline Student Dashboard & Windows .EXE Implementation

An all-in-one offline academic workspace powered by **Qwen 2.5 3B**. Parse Certificate of Registration (COR) schedules, extract study notes from uploaded PDFs/documents, generate high-yield cheatsheets, manage class timetables and to-do tasks, and run interactive practice exam simulations.

---

## 💻 How to Run 100% Offline in VS Code on your Laptop

### Step 1: Open in VS Code
1. Copy or extract this project folder to your laptop (for example: `C:\Projects\StudyFlow`).
2. Open **VS Code**.
3. Click **File > Open Folder...** and select the project directory.

### Step 2: One-Time Setup (While Connected to Internet)
1. In VS Code, open the integrated terminal by pressing:
   `Ctrl + ` ` (backtick) or go to **Terminal > New Terminal**.
2. Run:
   ```bash
   npm install
   ```
   *(Or simply double-click `setup-offline.bat` in the project root)*.
   This caches all packages, Vite, and Qwen offline modules into your local `node_modules/`.

### Step 3: Run 100% Offline (Turn Off Wi-Fi!)
You can now disconnect from the internet completely! To launch:
- **Option A (Keyboard Shortcut)**: Just press **`F5`** in VS Code! We have preconfigured `.vscode/launch.json` to boot the dev server and launch the window automatically.
- **Option B (Terminal)**: Run:
   ```bash
   npm run dev
   ```
   Then open `http://localhost:3000` in Edge, Chrome, or Brave.
- **Option C (Desktop Launcher)**: Double-click `Start-StudyFlow.bat` in File Explorer.

---

## 🚀 How to Build as a Standalone Windows .EXE on your Laptop

StudyFlow AI is preconfigured to run and compile as a standalone Windows executable.

### Method 1: Instant Windows Standalone App Window (Zero Compilation)
Double-click `Start-StudyFlow.bat` in the project folder:
```cmd
Start-StudyFlow.bat
```
- Starts the local Vite engine silently in the background.
- Opens StudyFlow in native standalone application mode (`--app=http://localhost:3000`) without browser navigation bars or tabs.
- Full offline persistence via LocalStorage / IndexedDB.

### Method 2: Compile to Genuine Windows `Study Hub.exe` (Electron Builder)
We have preconfigured `electron/main.cjs` and the build settings in `package.json`. Electron and electron-builder are already dev dependencies.

1. Open your terminal in this directory and install dependencies:
   ```bash
   npm install
   ```

2. Run the build command:
   ```bash
   npm run build:exe
   ```
   *Or simply double-click:* `build-exe.bat`

3. Your standalone executables will be created in `dist-electron/`:
   ```
   dist-electron/Study-Hub-Setup-<version>.exe     (installer)
   dist-electron/Study-Hub-Portable-<version>.exe  (portable)
   dist-electron/win-unpacked/Study Hub.exe        (unpacked)
   ```

### Method 3: Convert `Start-StudyFlow.bat` to `StudyFlow.exe`
1. Download any standard Windows tool like **Bat To Exe Converter** (by Fatih Kodak) or **Inno Setup**.
2. Select `Start-StudyFlow.bat` as the source file.
3. Choose `public/icon.svg` (or convert to `.ico`) as the application icon.
4. Click **Compile** to generate a single standalone `StudyFlow.exe`.

---

## 💻 How to Run in VS Code / Local Terminal

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start Development Server**:
   ```bash
   npm run dev
   ```

3. Open **`http://localhost:3000`** in your browser (Google Chrome, Microsoft Edge, Brave, etc.).

---

## 🧠 Qwen 2.5 3B Offline Intelligence Modes

1. **Instant Embedded Engine (Default - 0 MB Download)**:
   - Zero-delay extraction, exam question generation, and formula synthesis.
   - Runs directly on any device without waiting for large weights.

2. **In-Browser WebGPU Mode (Full Local Weights)**:
   - Click the **Qwen 2.5 3B** button in the sidebar.
   - Click **"Download & Cache Model"** to store `Qwen2.5-3B-Instruct-q4f16_1-MLC` in your browser cache.
   - Runs 100% offline using your GPU.

3. **Local Ollama / llama.cpp Server**:
   - Run `ollama run qwen2.5:3b` on port `11434`.
   - StudyFlow will stream responses directly from your local Ollama daemon.

---

## 📁 Key Features
- **My Schedule & COR Parser**: Extract subjects, faculty, and room codes from university COR certificates into a clean weekly timetable.
- **To-Do List**: Filter by status and priority, link tasks to courses.
- **Cheatsheet Generator**: Upload lecture PDFs, text, or images to distill high-yield study notes and formulas.
- **Exam Sim**: Interactive exams with Multiple Choice, True/False, and Identification questions with live grading and explanations.
- **Windows .EXE Studio**: Direct download scripts and guides for executable deployment.

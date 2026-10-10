# Product Requirements Document: Study Hub

**Created**: 2026-10-10

**Product name**: Study Hub
**Team members**: Andrea Kaye Nieves, Jan Jefferson C. Mesina, Jasper Angelo B. Cariño, John Jeffrey M. Cacho

## Short Description

Study Hub is a local-first student workspace for organizing classes and tasks, turning course materials into review notes and practice exams, and tracking study sessions. It can be installed as a Progressive Web App (PWA), with cached app-shell access available offline.

## Problem

Students often keep schedules, assignments, study materials, practice tests, and study timers in separate tools. This makes it harder to plan study time and revisit learning progress, especially when internet access is limited.

## Product Goals

1. Give students one place to organize their academic workload and see what needs attention.
2. Help students turn their own course materials into focused review content and practice.
3. Make essential study workflows available on the user's device, including offline use where supported.
4. Make the application straightforward to download, run locally in VS Code, and install as a PWA.

## Intended Users

- Students who need to manage a weekly class schedule and academic tasks.
- Students who want to review their own notes and practice for exams.
- Students who need a local or offline-friendly study tool.

## Scope Baseline

- **Discovery method**: Review of the project README, application navigation, project metadata, and existing feature descriptions.
- **Items discovered**: Eight primary application areas: Overview, Schedule, To-do list, Clutch Notes, Exam Simulator, History, Pomodoro, and the Run in VS Code/PWA guide.
- **Items in scope**: All eight areas, as they form the current Study Hub product experience.

## User Scenarios

### P1 — Plan classes and assignments

As a student, I want to keep my class timetable and tasks together so I can understand what is coming up and plan my work.

**Acceptance scenarios**

1. **Given** I have added classes, **when** I open the Schedule or Overview, **then** I can see the relevant timetable and today's classes.
2. **Given** I have created tasks with due dates or priorities, **when** I open the to-do list or Overview, **then** I can identify and filter the work that needs attention.
3. **Given** I need to add a class, **when** I describe it in plain language or enter it manually, **then** it is added to my weekly timetable.

### P1 — Create and use study materials

As a student, I want to make concise review notes from my course materials so I can study key information efficiently.

**Acceptance scenarios**

1. **Given** I have a supported document, image, or text source, **when** I create Clutch Notes from it, **then** I can review and save the generated study material.
2. **Given** I have saved Clutch Notes, **when** I search or browse my library, **then** I can find and reopen a saved item.
3. **Given** my study material is stored on this device, **when** I use the local study workflow, **then** the application communicates whether content is processed locally or requires a connection.

### P1 — Practice and review exams

As a student, I want to generate and take practice exams from my own material so I can check my understanding.

**Acceptance scenarios**

1. **Given** I have uploaded or pasted notes, or saved Clutch Notes, **when** I configure a practice exam, **then** the exam uses the selected material as its source.
2. **Given** I submit an exam, **when** grading completes, **then** I can see my score and question feedback.
3. **Given** I have completed practice exams, **when** I open History, **then** I can review saved exams and past attempts.

### P2 — Maintain a focused study routine

As a student, I want a Pomodoro timer and progress overview so I can structure study sessions and see my recent activity.

**Acceptance scenarios**

1. **Given** I start a Pomodoro session, **when** its configured interval completes, **then** the application indicates the session state and lets me continue my routine.
2. **Given** I have completed study or exam activity, **when** I open Overview or History, **then** I can see available recent activity and progress summaries.

### P2 — Download, run, and install Study Hub

As a student, I want to download the source, run Study Hub in VS Code, and install it as a PWA from a supported browser.

**Acceptance scenarios**

1. **Given** I use the project download link, **when** the download completes, **then** I can extract the source and open the project in VS Code.
2. **Given** I follow the setup instructions, **when** dependencies are installed and the preview server is running, **then** I can open Study Hub locally.
3. **Given** I use a supported browser over HTTPS or localhost, **when** I install Study Hub, **then** it opens in a standalone app window and its cached app shell is available offline.

## Functional Requirements

- **REQ-001**: The product MUST provide an Overview of relevant classes, tasks, study progress, recent exams, and recent Clutch Notes when those records exist.
- **REQ-002**: The product MUST let students create, view, and manage a weekly class timetable, including manual entry and the described schedule-assistance workflow.
- **REQ-003**: The product MUST let students create and organize academic tasks, and filter the task list by supported status and priority.
- **REQ-004**: The product MUST let students create, browse, search, and manage Clutch Notes from supported course-material inputs.
- **REQ-005**: The product MUST let students create practice exams using their selected notes or saved Clutch Notes as source material.
- **REQ-006**: The product MUST provide exam submission, scoring, and review feedback, and make completed attempts available in History.
- **REQ-007**: The product MUST provide a Pomodoro timer for structuring study sessions.
- **REQ-008**: The product MUST provide a History area for past exam attempts, saved exams, and Clutch Notes.
- **REQ-009**: The product MUST provide a source download and clear instructions for opening and running the project in VS Code.
- **REQ-010**: The product MUST provide an installable PWA experience with a valid manifest, application icons, a service worker, and offline access to the cached app shell.
- **REQ-011**: The product MUST communicate relevant local processing, offline limitations, and external connectivity requirements to the user.
- **REQ-012**: The product MUST provide user-facing errors when a supported operation cannot complete, rather than presenting a failed operation as successful.

## Non-Functional Requirements

- **REQ-013**: The product SHOULD keep core study records available on the device and avoid uploading user content unless a feature explicitly requires an external service and the user is informed.
- **REQ-014**: The primary study workflows SHOULD remain usable without an internet connection after any required dependencies or local model assets have been prepared.
- **REQ-015**: The main navigation and primary actions SHOULD be understandable without requiring users to consult developer documentation.
- **REQ-016**: User data and progress SHOULD remain available across normal application restarts on the same device.

## Key Entities

- **Class**: A scheduled course session with timetable details such as course, day, time, faculty, or room.
- **Task**: An academic action with supported status, priority, due-date, and course associations.
- **Source Material**: Text, document, or image content selected for study-note or exam generation.
- **Clutch Note**: A saved review resource derived from or organized around course material.
- **Practice Exam**: A set of questions created from selected source material.
- **Exam Attempt**: A submitted practice exam with answers, score, and review information.
- **Study Session**: A timed focus interval tracked through the Pomodoro workflow.

## Success Criteria

- **SC-001**: A student can locate today's classes and open tasks from the Overview in under one minute after adding sample records.
- **SC-002**: A student can create and reopen a Clutch Note from supported sample material without losing the saved result after restarting the app.
- **SC-003**: A student can complete a practice exam and locate its score and feedback in History.
- **SC-004**: A user can download the project source, run the production preview, and install the PWA in a supported browser.
- **SC-005**: At least 90% of first-time test users can complete the core flow—add a class, add a task, create a study resource, and start a practice exam—without external assistance.
- **SC-006**: In a prepared offline environment, users can access local schedule, task, saved-study-material, history, and timer workflows without an internet connection.

## Assumptions and Boundaries

- The product description and user problem statement are based on the current Study Hub features and should be confirmed by the team.
- The team list is reproduced as supplied.
- Existing app features define the initial product scope; this PRD does not introduce new integrations, user accounts, cloud synchronization, or cross-device data sharing.
- Offline availability depends on the cached app shell, required local model assets, and the particular feature being used. This PRD does not claim every AI or external-service feature works fully offline.
- The repository uses an npm workspace with the Study Hub application under `apps/study-hub/`.

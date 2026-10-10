import React, { useState, useEffect } from 'react';
import { AnimatePresence, MotionConfig, motion } from 'motion/react';
import { X } from 'lucide-react';
import { Course, Exam, ExamAttempt, Cheatsheet, Task } from './types';
import {
  getStoredCourses,
  saveStoredCourses,
  getStoredExams,
  saveStoredExams,
  getStoredAttempts,
  saveStoredAttempts,
  getStoredCheatsheets,
  saveStoredCheatsheets,
  getStoredTasks,
  saveStoredTasks,
  getStoredStudentProfile,
  saveStoredStudentProfile,
  DATA_STORAGE_KEYS,
} from './lib/storage';
import { usePomodoro } from './lib/usePomodoro';
import { useHashTab } from './lib/useHashTab';
import { IconButton } from './components/ui';
import { Sidebar } from './components/Sidebar';
import { TopNavbar } from './components/TopNavbar';
import { OverviewView } from './components/OverviewView';
import { ScheduleView } from './components/ScheduleView';
import { TodoListView } from './components/TodoListView';
import { CheatsheetGeneratorView } from './components/CheatsheetGeneratorView';
import { ExamSimView } from './components/ExamSimView';
import { HistoryView } from './components/HistoryView';
import { PomodoroView } from './components/PomodoroView';
import { DesktopExeView } from './components/DesktopExeView';
import { BackupModal } from './components/BackupModal';
import { ProfileModal } from './components/ProfileModal';

export default function App() {
  const [activeTab, setActiveTab] = useHashTab();
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // Stored application state (lazy init avoids an empty-state flash)
  const [courses, setCourses] = useState<Course[]>(getStoredCourses);
  const [exams, setExams] = useState<Exam[]>(getStoredExams);
  const [attempts, setAttempts] = useState<ExamAttempt[]>(getStoredAttempts);
  const [cheatsheets, setCheatsheets] = useState<Cheatsheet[]>(getStoredCheatsheets);
  const [tasks, setTasks] = useState<Task[]>(getStoredTasks);
  const [{ name: studentName, program: programName }, setProfile] = useState<{
    name: string;
    program: string;
  }>(getStoredStudentProfile);

  // Pomodoro timer (single instance so it survives tab switches)
  const pomodoro = usePomodoro();

  // Modals state
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Cross-screen focus requests
  const [focusSheetId, setFocusSheetId] = useState<string | null>(null);
  const [retakeExam, setRetakeExam] = useState<Exam | null>(null);
  const [historyAttemptId, setHistoryAttemptId] = useState<string | null>(null);

  const openCheatsheet = (id: string) => {
    setFocusSheetId(id);
    setActiveTab('cheatsheets');
  };

  const retake = (exam: Exam) => {
    setRetakeExam(exam);
    setActiveTab('exam');
  };

  const openAttempt = (id: string) => {
    setHistoryAttemptId(id);
    setActiveTab('history');
  };

  // Auto-dismiss the pomodoro toast
  useEffect(() => {
    if (!pomodoro.toast) return;
    const t = setTimeout(() => pomodoro.dismissToast(), 6000);
    return () => clearTimeout(t);
  }, [pomodoro.toast]);

  const handleUpdateProfile = (name: string, program: string) => {
    setProfile({ name, program });
    saveStoredStudentProfile(name, program);
  };

  // Handlers for data updates (updater form: save inside the setter)
  const handleAddCourse = (course: Course) => {
    setCourses((prev) => {
      const next = [...prev, course];
      saveStoredCourses(next);
      return next;
    });
  };

  const handleDeleteCourse = (id: string) => {
    setCourses((prev) => {
      const next = prev.filter((c) => c.id !== id);
      saveStoredCourses(next);
      return next;
    });
  };

  const handleAddTask = (task: Task) => {
    setTasks((prev) => {
      const next = [task, ...prev];
      saveStoredTasks(next);
      return next;
    });
  };

  const handleUpdateTask = (task: Task) => {
    setTasks((prev) => {
      const next = prev.map((t) => (t.id === task.id ? task : t));
      saveStoredTasks(next);
      return next;
    });
  };

  const handleToggleTask = (id: string) => {
    setTasks((prev) => {
      const next = prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t));
      saveStoredTasks(next);
      return next;
    });
  };

  const handleDeleteTask = (id: string) => {
    setTasks((prev) => {
      const next = prev.filter((t) => t.id !== id);
      saveStoredTasks(next);
      return next;
    });
  };

  const handleSaveCheatsheet = (sheet: Cheatsheet) => {
    setCheatsheets((prev) => {
      const next = [sheet, ...prev.filter((s) => s.id !== sheet.id)];
      saveStoredCheatsheets(next);
      return next;
    });
  };

  const handleDeleteCheatsheet = (id: string) => {
    setCheatsheets((prev) => {
      const next = prev.filter((s) => s.id !== id);
      saveStoredCheatsheets(next);
      return next;
    });
  };

  const handleSaveExam = (exam: Exam) => {
    setExams((prev) => {
      const next = [exam, ...prev.filter((e) => e.id !== exam.id)];
      saveStoredExams(next);
      return next;
    });
  };

  const handleSaveAttempt = (attempt: ExamAttempt) => {
    setAttempts((prev) => {
      const next = [...prev, attempt];
      saveStoredAttempts(next);
      return next;
    });
  };

  const handleRefreshAllData = () => {
    setCourses(getStoredCourses());
    setExams(getStoredExams());
    setAttempts(getStoredAttempts());
    setCheatsheets(getStoredCheatsheets());
    setTasks(getStoredTasks());
    setProfile(getStoredStudentProfile());
  };

  // Refresh data when another window/tab writes to storage.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === null || DATA_STORAGE_KEYS.includes(e.key)) {
        handleRefreshAllData();
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-dvh bg-canvas text-ink flex flex-col font-sans">
        <a
          href={'#/' + activeTab}
          onClick={(e) => {
            e.preventDefault();
            document.getElementById('main')?.focus();
          }}
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[60] focus:bg-surface focus:text-ink focus:px-3 focus:py-2 focus:rounded-control focus:border focus:border-line focus:shadow-pop"
        >
          Skip to content
        </a>

        {/* Main Container */}
        <div className="flex-1 flex min-w-0">
          <Sidebar
            activeTab={activeTab}
            onNavigate={setActiveTab}
            studentName={studentName}
            programName={programName}
            onOpenProfileModal={() => setIsProfileModalOpen(true)}
            onOpenBackupModal={() => setIsBackupModalOpen(true)}
            mobileOpen={mobileNavOpen}
            onCloseMobile={() => setMobileNavOpen(false)}
          />

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col min-w-0">
            <TopNavbar
              activeTab={activeTab}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              onOpenMenu={() => setMobileNavOpen(true)}
            />

            <main id="main" tabIndex={-1} className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6 lg:py-8 flex-1 focus:outline-none">
              <div key={activeTab} className="view-enter">
                {activeTab === 'overview' && (
                  <OverviewView
                    courses={courses}
                    tasks={tasks}
                    cheatsheets={cheatsheets}
                    exams={exams}
                    attempts={attempts}
                    studentName={studentName}
                    searchQuery={searchQuery}
                    onNavigateTab={setActiveTab}
                    onToggleTask={handleToggleTask}
                    onOpenCheatsheet={openCheatsheet}
                    onOpenAttempt={openAttempt}
                    pomodoro={pomodoro}
                  />
                )}

                {activeTab === 'schedule' && (
                  <ScheduleView
                    courses={courses}
                    onAddCourse={handleAddCourse}
                    onDeleteCourse={handleDeleteCourse}
                    searchQuery={searchQuery}
                  />
                )}

                {activeTab === 'tasks' && (
                  <TodoListView
                    tasks={tasks}
                    courses={courses}
                    onAddTask={handleAddTask}
                    onUpdateTask={handleUpdateTask}
                    onToggleTask={handleToggleTask}
                    onDeleteTask={handleDeleteTask}
                    searchQuery={searchQuery}
                  />
                )}

                {activeTab === 'cheatsheets' && (
                  <CheatsheetGeneratorView
                    courses={courses}
                    cheatsheets={cheatsheets}
                    onSaveCheatsheet={handleSaveCheatsheet}
                    onDeleteCheatsheet={handleDeleteCheatsheet}
                    searchQuery={searchQuery}
                    focusSheetId={focusSheetId}
                    onFocusSheetHandled={() => setFocusSheetId(null)}
                  />
                )}

                {activeTab === 'exam' && (
                  <ExamSimView
                    courses={courses}
                    cheatsheets={cheatsheets}
                    exams={exams}
                    attempts={attempts}
                    onSaveExam={handleSaveExam}
                    onSaveAttempt={handleSaveAttempt}
                    searchQuery={searchQuery}
                    retakeExam={retakeExam}
                    onRetakeHandled={() => setRetakeExam(null)}
                    onNavigateTab={setActiveTab}
                    onOpenAttempt={openAttempt}
                  />
                )}

                {activeTab === 'history' && (
                  <HistoryView
                    attempts={attempts}
                    exams={exams}
                    cheatsheets={cheatsheets}
                    searchQuery={searchQuery}
                    historyAttemptId={historyAttemptId}
                    onHistoryAttemptHandled={() => setHistoryAttemptId(null)}
                    onRetake={retake}
                    onOpenCheatsheet={openCheatsheet}
                    onNavigateTab={setActiveTab}
                  />
                )}

                {activeTab === 'pomodoro' && <PomodoroView pomodoro={pomodoro} />}

                {activeTab === 'desktop' && (
                  <DesktopExeView />
                )}
              </div>
            </main>
          </div>
        </div>

        {/* Pomodoro toast (visible on every page) */}
        <AnimatePresence>
          {pomodoro.toast && (
            <motion.div
              key={pomodoro.toast.id}
              role="status"
              aria-live="polite"
              className="fixed top-3 right-3 left-3 sm:left-auto sm:w-96 z-50"
              initial={{ opacity: 0, transform: 'translateY(-8px)' }}
              animate={{ opacity: 1, transform: 'translateY(0px)' }}
              exit={{ opacity: 0, transform: 'translateY(-8px)' }}
              transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
            >
              <div className="bg-surface border border-line rounded-card shadow-pop px-4 py-3 flex items-center gap-3">
                <span className="text-sm text-ink font-medium flex-1">
                  {pomodoro.toast.message}
                </span>
                <IconButton
                  icon={X}
                  label="Dismiss"
                  size="sm"
                  onClick={pomodoro.dismissToast}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Data Backup Modal */}
        <BackupModal
          isOpen={isBackupModalOpen}
          onClose={() => setIsBackupModalOpen(false)}
          onRefreshData={handleRefreshAllData}
        />

        {/* Profile Edit Modal */}
        <ProfileModal
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
          studentName={studentName}
          programName={programName}
          onUpdateProfile={handleUpdateProfile}
        />
      </div>
    </MotionConfig>
  );
}

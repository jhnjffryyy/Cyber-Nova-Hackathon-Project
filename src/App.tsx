import React, { useState, useEffect } from 'react';
import { Minus, Square, X } from 'lucide-react';
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
  getStoredDesktopFrame,
  saveStoredDesktopFrame,
  getStoredStudentProfile,
  saveStoredStudentProfile,
} from './lib/storage';
import { usePomodoro } from './lib/usePomodoro';
import { Sidebar } from './components/Sidebar';
import { TopNavbar } from './components/TopNavbar';
import { OverviewView } from './components/OverviewView';
import { ScheduleView } from './components/ScheduleView';
import { TodoListView } from './components/TodoListView';
import { CheatsheetGeneratorView } from './components/CheatsheetGeneratorView';
import { ExamSimView } from './components/ExamSimView';
import { PomodoroView } from './components/PomodoroView';
import { DesktopExeView } from './components/DesktopExeView';
import { DesktopExeModal } from './components/DesktopExeModal';
import { BackupModal } from './components/BackupModal';
import { ProfileModal } from './components/ProfileModal';

type TabId = 'overview' | 'schedule' | 'tasks' | 'cheatsheets' | 'exam' | 'pomodoro' | 'desktop';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [searchQuery, setSearchQuery] = useState('');

  // Stored application state (Starts clean - zero dummy data)
  const [courses, setCourses] = useState<Course[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [attempts, setAttempts] = useState<ExamAttempt[]>([]);
  const [cheatsheets, setCheatsheets] = useState<Cheatsheet[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);

  // Student Profile
  const [studentName, setStudentName] = useState<string>('Student');
  const [programName, setProgramName] = useState<string>('College Program');

  // Desktop Windows title bar simulation
  const [isDesktopFrame, setIsDesktopFrame] = useState<boolean>(false);

  // Pomodoro timer (single instance so it survives tab switches)
  const pomodoro = usePomodoro();

  // Modals state
  const [isDesktopModalOpen, setIsDesktopModalOpen] = useState(false);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  useEffect(() => {
    setCourses(getStoredCourses());
    setExams(getStoredExams());
    setAttempts(getStoredAttempts());
    setCheatsheets(getStoredCheatsheets());
    setTasks(getStoredTasks());
    setIsDesktopFrame(getStoredDesktopFrame());

    const profile = getStoredStudentProfile();
    setStudentName(profile.name);
    setProgramName(profile.program);
  }, []);

  // Auto-dismiss the pomodoro toast
  useEffect(() => {
    if (!pomodoro.toast) return;
    const t = setTimeout(() => pomodoro.dismissToast(), 6000);
    return () => clearTimeout(t);
  }, [pomodoro.toast]);

  const handleToggleDesktopFrame = (enabled: boolean) => {
    setIsDesktopFrame(enabled);
    saveStoredDesktopFrame(enabled);
  };

  const handleUpdateProfile = (name: string, program: string) => {
    setStudentName(name);
    setProgramName(program);
    saveStoredStudentProfile(name, program);
  };

  // Handlers for data updates
  const handleAddCourse = (course: Course) => {
    const updated = [...courses, course];
    setCourses(updated);
    saveStoredCourses(updated);
  };

  const handleDeleteCourse = (id: string) => {
    const updated = courses.filter((c) => c.id !== id);
    setCourses(updated);
    saveStoredCourses(updated);
  };

  const handleAddTask = (task: Task) => {
    const updated = [task, ...tasks];
    setTasks(updated);
    saveStoredTasks(updated);
  };

  const handleToggleTask = (id: string) => {
    const updated = tasks.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t));
    setTasks(updated);
    saveStoredTasks(updated);
  };

  const handleDeleteTask = (id: string) => {
    const updated = tasks.filter((t) => t.id !== id);
    setTasks(updated);
    saveStoredTasks(updated);
  };

  const handleSaveCheatsheet = (sheet: Cheatsheet) => {
    const updated = [sheet, ...cheatsheets.filter((s) => s.id !== sheet.id)];
    setCheatsheets(updated);
    saveStoredCheatsheets(updated);
  };

  const handleDeleteCheatsheet = (id: string) => {
    const updated = cheatsheets.filter((s) => s.id !== id);
    setCheatsheets(updated);
    saveStoredCheatsheets(updated);
  };

  const handleSaveExam = (exam: Exam) => {
    const updated = [exam, ...exams.filter((e) => e.id !== exam.id)];
    setExams(updated);
    saveStoredExams(updated);
  };

  const handleSaveAttempt = (attempt: ExamAttempt) => {
    const updated = [...attempts, attempt];
    setAttempts(updated);
    saveStoredAttempts(updated);
  };

  const handleRefreshAllData = () => {
    setCourses(getStoredCourses());
    setExams(getStoredExams());
    setAttempts(getStoredAttempts());
    setCheatsheets(getStoredCheatsheets());
    setTasks(getStoredTasks());
    const profile = getStoredStudentProfile();
    setStudentName(profile.name);
    setProgramName(profile.program);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-900 selection:bg-emerald-500/20 antialiased">
      {/* Optional Simulated Native Windows 11 Title Bar */}
      {isDesktopFrame && (
        <div className="h-8 bg-slate-950 text-slate-300 flex items-center justify-between px-3 text-xs border-b border-slate-800 select-none z-50">
          <div className="flex items-center gap-2">
            <img src="/icon.svg" alt="App Icon" className="w-4 h-4" />
            <span className="font-semibold text-slate-200">
              StudyFlow AI — Windows Standalone Desktop Edition
            </span>
          </div>
          <div className="flex items-center">
            <button
              onClick={() => alert('Simulated Windows Minimize: In actual .EXE this minimizes to taskbar')}
              className="w-10 h-8 flex items-center justify-center hover:bg-slate-800 transition-colors text-slate-400 hover:text-slate-200"
              title="Minimize"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => alert('Simulated Windows Maximize: In actual .EXE this toggles fullscreen')}
              className="w-10 h-8 flex items-center justify-center hover:bg-slate-800 transition-colors text-slate-400 hover:text-slate-200"
              title="Maximize"
            >
              <Square className="w-3 h-3" />
            </button>
            <button
              onClick={() => handleToggleDesktopFrame(false)}
              className="w-10 h-8 flex items-center justify-center hover:bg-rose-600 transition-colors text-slate-400 hover:text-white"
              title="Hide Desktop Title Bar"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Main Container */}
      <div className="flex-1 flex min-w-0">
        {/* Left Sidebar */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          studentName={studentName}
          programName={programName}
          onOpenProfileModal={() => setIsProfileModalOpen(true)}
        />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          <TopNavbar
            activeTab={activeTab}
            searchQuery={searchQuery}
            studentName={studentName}
            setSearchQuery={setSearchQuery}
            onOpenDesktopModal={() => setIsDesktopModalOpen(true)}
          />

          <main className="p-6 md:p-8 max-w-7xl w-full mx-auto flex-1">
            {activeTab === 'overview' && (
              <OverviewView
                courses={courses}
                tasks={tasks}
                cheatsheetsCount={cheatsheets.length}
                studentName={studentName}
                searchQuery={searchQuery}
                onNavigateTab={(tab) => setActiveTab(tab)}
                onToggleTask={handleToggleTask}
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
              />
            )}

            {activeTab === 'pomodoro' && <PomodoroView pomodoro={pomodoro} />}

            {activeTab === 'desktop' && (
              <DesktopExeView
                isDesktopFrame={isDesktopFrame}
                setIsDesktopFrame={handleToggleDesktopFrame}
                onOpenModelModal={() => {}}
              />
            )}
          </main>
        </div>
      </div>

      {/* Pomodoro toast (visible on every page) */}
      {pomodoro.toast && (
        <div className="fixed top-4 right-4 z-50 bg-white border border-gray-200 rounded-xl shadow-lg px-4 py-3 flex items-center gap-3 text-xs animate-in fade-in">
          <span className="text-gray-800 font-medium">{pomodoro.toast.message}</span>
          <button
            onClick={pomodoro.dismissToast}
            className="p-1 text-gray-400 hover:text-gray-600 rounded"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Windows .EXE / Desktop Launcher Modal */}
      <DesktopExeModal
        isOpen={isDesktopModalOpen}
        onClose={() => setIsDesktopModalOpen(false)}
        isDesktopFrame={isDesktopFrame}
        setIsDesktopFrame={handleToggleDesktopFrame}
      />

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
  );
}

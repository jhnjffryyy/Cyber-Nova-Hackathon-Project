import { Course, Exam, ExamAttempt, Cheatsheet, Task, LLMMode } from '../types';
import { SAMPLE_COURSES, SAMPLE_EXAMS, SAMPLE_CHEATSHEETS, SAMPLE_TASKS } from './sample-data';
import { PomodoroSettings, DEFAULT_POMODORO_SETTINGS, clampSettings } from './pomodoro';

const STORAGE_KEYS = {
  COURSES: 'studyflow_courses_v4_clean',
  EXAMS: 'studyflow_exams_v4_clean',
  ATTEMPTS: 'studyflow_attempts_v4_clean',
  CHEATSHEETS: 'studyflow_cheatsheets_v4_clean',
  TASKS: 'studyflow_tasks_v4_clean',
  LLM_MODE: 'studyflow_llm_mode_v4',
  GGUF_ENDPOINT: 'studyflow_gguf_endpoint_v4',
  DESKTOP_FRAME: 'studyflow_desktop_frame_v4',
  STUDENT_NAME: 'studyflow_student_name_v4',
  PROGRAM_NAME: 'studyflow_program_name_v4',
  POMODORO_SETTINGS: 'studyflow_pomodoro_settings_v1',
};

// No dummy data by default - clean slate for user's own courses
export const getStoredCourses = (): Course[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.COURSES);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const saveStoredCourses = (courses: Course[]): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.COURSES, JSON.stringify(courses));
  } catch (e) {
    console.error('Failed to save courses', e);
  }
};

export const getStoredExams = (): Exam[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.EXAMS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const saveStoredExams = (exams: Exam[]): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.EXAMS, JSON.stringify(exams));
  } catch (e) {
    console.error('Failed to save exams', e);
  }
};

export const getStoredAttempts = (): ExamAttempt[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ATTEMPTS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const saveStoredAttempts = (attempts: ExamAttempt[]): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.ATTEMPTS, JSON.stringify(attempts));
  } catch (e) {
    console.error('Failed to save attempts', e);
  }
};

export const getStoredCheatsheets = (): Cheatsheet[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CHEATSHEETS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const saveStoredCheatsheets = (sheets: Cheatsheet[]): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.CHEATSHEETS, JSON.stringify(sheets));
  } catch (e) {
    console.error('Failed to save cheatsheets', e);
  }
};

export const getStoredTasks = (): Task[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TASKS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const saveStoredTasks = (tasks: Task[]): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
  } catch (e) {
    console.error('Failed to save tasks', e);
  }
};

export const getStoredStudentProfile = (): { name: string; program: string } => {
  try {
    const name = localStorage.getItem(STORAGE_KEYS.STUDENT_NAME) || 'Student';
    const program = localStorage.getItem(STORAGE_KEYS.PROGRAM_NAME) || 'College Program';
    return { name, program };
  } catch {
    return { name: 'Student', program: 'College Program' };
  }
};

export const saveStoredStudentProfile = (name: string, program: string): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.STUDENT_NAME, name);
    localStorage.setItem(STORAGE_KEYS.PROGRAM_NAME, program);
  } catch {}
};

export const getStoredLLMMode = (): LLMMode => {
  try {
    const mode = localStorage.getItem(STORAGE_KEYS.LLM_MODE) as LLMMode;
    if (mode && ['webllm', 'local_gguf', 'embedded'].includes(mode)) {
      return mode;
    }
  } catch {}
  return 'embedded';
};

export const saveStoredLLMMode = (mode: LLMMode): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.LLM_MODE, mode);
  } catch {}
};

export const getStoredGGUFEndpoint = (): string => {
  try {
    return localStorage.getItem(STORAGE_KEYS.GGUF_ENDPOINT) || 'http://localhost:11434';
  } catch {
    return 'http://localhost:11434';
  }
};

export const saveStoredGGUFEndpoint = (endpoint: string): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.GGUF_ENDPOINT, endpoint);
  } catch {}
};

export const getStoredDesktopFrame = (): boolean => {
  try {
    return localStorage.getItem(STORAGE_KEYS.DESKTOP_FRAME) === 'true';
  } catch {
    return false;
  }
};

export const saveStoredDesktopFrame = (enabled: boolean): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.DESKTOP_FRAME, String(enabled));
  } catch {}
};

export const getStoredPomodoroSettings = (): PomodoroSettings => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.POMODORO_SETTINGS);
    if (raw) return clampSettings(JSON.parse(raw));
  } catch {}
  return { ...DEFAULT_POMODORO_SETTINGS };
};

export const saveStoredPomodoroSettings = (settings: PomodoroSettings): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.POMODORO_SETTINGS, JSON.stringify(clampSettings(settings)));
  } catch {}
};

export const clearAllData = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEYS.COURSES);
    localStorage.removeItem(STORAGE_KEYS.EXAMS);
    localStorage.removeItem(STORAGE_KEYS.ATTEMPTS);
    localStorage.removeItem(STORAGE_KEYS.CHEATSHEETS);
    localStorage.removeItem(STORAGE_KEYS.TASKS);
  } catch {}
};

export const resetAllDataToDefault = (): void => {
  clearAllData();
};

export const loadDemoDataIfRequested = (): void => {
  saveStoredCourses(SAMPLE_COURSES);
  saveStoredExams(SAMPLE_EXAMS);
  saveStoredCheatsheets(SAMPLE_CHEATSHEETS);
  saveStoredTasks(SAMPLE_TASKS);
};

export const exportAllDataJSON = (): string => {
  const profile = getStoredStudentProfile();
  const backup = {
    version: '4.0',
    exportDate: new Date().toISOString(),
    profile,
    courses: getStoredCourses(),
    exams: getStoredExams(),
    attempts: getStoredAttempts(),
    cheatsheets: getStoredCheatsheets(),
    tasks: getStoredTasks(),
  };
  return JSON.stringify(backup, null, 2);
};

export const importAllDataJSON = (jsonString: string): boolean => {
  try {
    const data = JSON.parse(jsonString);
    if (data.courses && Array.isArray(data.courses)) saveStoredCourses(data.courses);
    if (data.exams && Array.isArray(data.exams)) saveStoredExams(data.exams);
    if (data.attempts && Array.isArray(data.attempts)) saveStoredAttempts(data.attempts);
    if (data.cheatsheets && Array.isArray(data.cheatsheets)) saveStoredCheatsheets(data.cheatsheets);
    if (data.tasks && Array.isArray(data.tasks)) saveStoredTasks(data.tasks);
    if (data.profile?.name) saveStoredStudentProfile(data.profile.name, data.profile.program || 'College Program');
    return true;
  } catch (e) {
    console.error('Failed to import data', e);
    return false;
  }
};

import React, { useEffect, useRef, useState } from 'react';
import {
  Calendar,
  Plus,
  X,
  Send,
  Sparkles,
} from 'lucide-react';
import { Course } from '../types';
import { handleScheduleMessage, PendingState } from '../lib/schedule-assistant';
import { WeekCalendar } from './WeekCalendar';

interface ScheduleViewProps {
  courses: Course[];
  onAddCourse: (course: Course) => void;
  onDeleteCourse: (id: string) => void;
  searchQuery?: string;
}

interface ChatMessage {
  id: number;
  role: 'user' | 'assistant';
  text: string;
  addedCourseId?: string;
  addedTitle?: string;
}

const EXAMPLE_CHIPS = [
  'Add Web Development every Monday at 8 AM',
  'Add Calculus every Tuesday and Thursday from 1:30 to 3pm',
  'Add Thesis meeting on October 20 at 10am',
];

export const ScheduleView: React.FC<ScheduleViewProps> = ({
  courses,
  onAddCourse,
  onDeleteCourse,
  searchQuery = '',
}) => {
  // AI Schedule Assistant state
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 0,
      role: 'assistant',
      text: 'Hi! Tell me what to add to your schedule. For example: "Add Web Development every Monday at 8 AM".',
    },
  ]);
  const [pending, setPending] = useState<PendingState | null>(null);
  const [input, setInput] = useState('');
  const msgIdRef = useRef(1);
  const listRef = useRef<HTMLDivElement>(null);

  // Add class modal
  const [isAddClassOpen, setIsAddClassOpen] = useState(false);
  const [className, setClassName] = useState('');
  const [classCode, setClassCode] = useState('');
  const [classDays, setClassDays] = useState<string[]>(['Mon', 'Wed']);
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('09:30');
  const [room, setRoom] = useState('Room 101');
  const [instructor, setInstructor] = useState('Faculty');
  const [units, setUnits] = useState(3);
  const [color, setColor] = useState('#3B82F6');
  const [classStartDate, setClassStartDate] = useState('');
  const [classEndDate, setClassEndDate] = useState('');
  const [dateRangeError, setDateRangeError] = useState('');

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages]);

  const filteredCourses = searchQuery.trim()
    ? courses.filter(
        (c) =>
          c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.code.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : courses;

  const postAssistant = (text: string, extra?: Partial<ChatMessage>) => {
    setMessages((prev) => [
      ...prev,
      { id: msgIdRef.current++, role: 'assistant', text, ...extra },
    ]);
  };

  const handleSend = () => {
    const text = input.trim();
    if (!text) return;
    setInput('');
    setMessages((prev) => [...prev, { id: msgIdRef.current++, role: 'user', text }]);
    const result = handleScheduleMessage(text, pending, courses, new Date());
    if (result.kind === 'ask') {
      setPending(result.pending);
      postAssistant(result.message);
    } else if (result.kind === 'add') {
      setPending(null);
      onAddCourse(result.course);
      postAssistant(result.message, {
        addedCourseId: result.course.id,
        addedTitle: result.course.title,
      });
    } else {
      setPending(null);
      postAssistant(result.message);
    }
  };

  const handleUndo = (msg: ChatMessage) => {
    if (!msg.addedCourseId) return;
    onDeleteCourse(msg.addedCourseId);
    postAssistant(`Removed ${msg.addedTitle || 'the course'}.`);
    setMessages((prev) =>
      prev.map((m) => (m.id === msg.id ? { ...m, addedCourseId: undefined } : m))
    );
  };

  const handleCreateClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!className.trim()) return;
    if (classStartDate && classEndDate && classEndDate < classStartDate) {
      setDateRangeError('End date must be on or after the start date.');
      return;
    }
    setDateRangeError('');
    onAddCourse({
      id: `course-${Date.now()}`,
      code: classCode.trim() || className.slice(0, 7).toUpperCase(),
      title: className.trim(),
      units: Number(units) || 3,
      days: classDays,
      startTime,
      endTime,
      room,
      instructor,
      color,
      startDate: classStartDate || undefined,
      endDate: classEndDate || undefined,
    });
    setIsAddClassOpen(false);
    setClassName('');
    setClassCode('');
    setClassStartDate('');
    setClassEndDate('');
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-black text-gray-900 tracking-tight">
          My schedule
        </h1>
        <p className="text-xs text-gray-500 mt-1">
          Weekly class timetable with an AI assistant that adds classes from plain text
        </p>
      </div>

      {/* AI Schedule Assistant */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-emerald-600" />
          <div>
            <h2 className="font-black text-sm text-gray-900">AI Schedule Assistant</h2>
            <p className="text-[11px] text-gray-500">
              Type what you want to add. It runs on the local engine on your device.
            </p>
          </div>
        </div>

        <div
          ref={listRef}
          className="max-h-72 overflow-y-auto space-y-2 pr-1"
        >
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] px-3.5 py-2 rounded-xl text-xs leading-relaxed ${
                  m.role === 'user'
                    ? 'bg-emerald-800 text-white'
                    : 'bg-gray-50 border border-gray-200 text-gray-800'
                }`}
              >
                <p>{m.text}</p>
                {m.addedCourseId && (
                  <button
                    onClick={() => handleUndo(m)}
                    className="mt-1.5 text-[10px] font-bold text-rose-600 hover:text-rose-700 underline"
                  >
                    Undo
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-1.5">
          {EXAMPLE_CHIPS.map((chip) => (
            <button
              key={chip}
              onClick={() => setInput(chip)}
              className="px-2.5 py-1 rounded-full bg-gray-100 hover:bg-gray-200 text-[10px] font-semibold text-gray-600 transition-colors"
            >
              {chip}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSend();
            }}
            placeholder="e.g. Add Web Development every Monday at 8 AM"
            className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-gray-800 focus:outline-none focus:bg-white focus:border-emerald-500"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className="px-4 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <Send className="w-3.5 h-3.5" />
            Send
          </button>
        </div>
      </div>

      {/* Weekly schedule Card */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-emerald-600" />
            <h2 className="font-black text-sm text-gray-900">Weekly schedule</h2>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-semibold">
              {filteredCourses.length} Enrolled {filteredCourses.length === 1 ? 'Subject' : 'Subjects'}
            </span>
          </div>
          <button
            onClick={() => setIsAddClassOpen(true)}
            className="px-3 py-1.5 rounded-lg bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1 shadow-sm transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Add class
          </button>
        </div>

        <WeekCalendar courses={filteredCourses} onDeleteCourse={onDeleteCourse} />

        {/* Empty state */}
        {courses.length === 0 && (
          <div className="p-6 text-center border-t border-gray-100 bg-gray-50/50 rounded-xl space-y-2">
            <Calendar className="w-6 h-6 text-gray-300 mx-auto" />
            <p className="text-xs font-bold text-gray-700">Your timetable is currently empty</p>
            <p className="text-[11px] text-gray-500 max-w-md mx-auto">
              Type a class into the AI Schedule Assistant above, or click <strong>"Add class"</strong> to add a subject manually.
            </p>
          </div>
        )}
      </div>

      {/* Add Class Modal */}
      {isAddClassOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-gray-200">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <h3 className="text-base font-black text-gray-900">Add Subject to Timetable</h3>
              <button onClick={() => setIsAddClassOpen(false)}>
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <form onSubmit={handleCreateClass} className="space-y-3">
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Code</label>
                  <input
                    type="text"
                    placeholder="e.g. CS 101"
                    value={classCode}
                    onChange={(e) => setClassCode(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-bold text-gray-700 block mb-1">Subject Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Mathematics, Operating Systems..."
                    value={className}
                    onChange={(e) => setClassName(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Days</label>
                <div className="flex gap-1.5">
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => {
                        if (classDays.includes(d)) setClassDays(classDays.filter((x) => x !== d));
                        else setClassDays([...classDays, d]);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                        classDays.includes(d) ? 'bg-emerald-800 text-white' : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Start Time</label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">End Time</label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Room</label>
                  <input
                    type="text"
                    placeholder="e.g. Room 101, Lab 2"
                    value={room}
                    onChange={(e) => setRoom(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Instructor</label>
                  <input
                    type="text"
                    placeholder="e.g. Dr. Davies"
                    value={instructor}
                    onChange={(e) => setInstructor(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Start Date (optional)</label>
                  <input
                    type="date"
                    value={classStartDate}
                    onChange={(e) => setClassStartDate(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">End Date (optional)</label>
                  <input
                    type="date"
                    value={classEndDate}
                    onChange={(e) => setClassEndDate(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs"
                  />
                </div>
              </div>
              {dateRangeError && (
                <p className="text-[11px] text-rose-600 font-medium">{dateRangeError}</p>
              )}

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Color Theme</label>
                <div className="flex gap-2">
                  {['#3B82F6', '#06B6D4', '#F59E0B', '#8B5CF6', '#10B981', '#EC4899', '#EF4444'].map(
                    (c) => (
                      <button
                        type="button"
                        key={c}
                        onClick={() => setColor(c)}
                        className={`w-6 h-6 rounded-full transition-transform ${
                          color === c ? 'scale-125 ring-2 ring-emerald-800' : ''
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    )
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsAddClassOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-gray-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl"
                >
                  Save Subject
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

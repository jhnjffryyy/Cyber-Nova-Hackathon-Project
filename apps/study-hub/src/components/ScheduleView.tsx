import React, { useEffect, useId, useRef, useState } from 'react';
import { CalendarDays, Plus, Send, Sparkles, Undo2 } from 'lucide-react';
import { Course } from '../types';
import { handleScheduleMessage, PendingState } from '../lib/schedule-assistant';
import { WeekCalendar } from './WeekCalendar';
import { cn } from '../lib/cn';
import {
  Button,
  Card,
  CardHeader,
  EmptyState,
  Field,
  IconButton,
  Input,
  Modal,
  PageHeader,
} from './ui';

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

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const COLORS = ['#3B82F6', '#06B6D4', '#F59E0B', '#8B5CF6', '#10B981', '#EC4899', '#EF4444'];

export const ScheduleView: React.FC<ScheduleViewProps> = ({
  courses,
  onAddCourse,
  onDeleteCourse,
  searchQuery = '',
}) => {
  const formId = useId();

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
  const [color, setColor] = useState('#3B82F6');
  const [classStartDate, setClassStartDate] = useState('');
  const [classEndDate, setClassEndDate] = useState('');
  const [dateRangeError, setDateRangeError] = useState('');
  const [daysError, setDaysError] = useState('');

  // Remove-class confirm
  const [removeCourse, setRemoveCourse] = useState<Course | null>(null);

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

  const openAddClass = () => {
    setDaysError('');
    setDateRangeError('');
    setIsAddClassOpen(true);
  };

  const handleCreateClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!className.trim()) return;
    if (classDays.length === 0) {
      setDaysError('Pick at least one day.');
      return;
    }
    setDaysError('');
    if (classStartDate && classEndDate && classEndDate < classStartDate) {
      setDateRangeError('End date must be on or after the start date.');
      return;
    }
    setDateRangeError('');
    onAddCourse({
      id: `course-${Date.now()}`,
      code: classCode.trim() || className.slice(0, 7).toUpperCase(),
      title: className.trim(),
      units: 3,
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
    setClassDays(['Mon', 'Wed']);
    setClassStartDate('');
    setClassEndDate('');
  };

  return (
    <div>
      <PageHeader
        title="Schedule"
        description="Your weekly timetable. Add classes manually or describe them in plain language."
        actions={
          <Button icon={Plus} onClick={openAddClass}>
            Add class
          </Button>
        }
      />

      <div className="space-y-6">
        {/* Week card */}
        <Card>
          {courses.length === 0 ? (
            <EmptyState
              icon={CalendarDays}
              title="Your timetable is empty"
              description="Describe a class to the assistant or add one manually."
              action={
                <Button size="sm" icon={Plus} onClick={openAddClass}>
                  Add class
                </Button>
              }
            />
          ) : (
            <WeekCalendar
              courses={filteredCourses}
              subjectCount={filteredCourses.length}
              onRequestDelete={setRemoveCourse}
            />
          )}
        </Card>

        {/* Assistant card */}
        <Card>
          <CardHeader
            title="Schedule assistant"
            icon={Sparkles}
            description="Runs locally on your device."
          />
          <div className="grid lg:grid-cols-[minmax(0,1fr)_280px] gap-4">
            <div>
              <div
                ref={listRef}
                aria-live="polite"
                className="max-h-80 overflow-y-auto space-y-2 mb-3"
              >
                {messages.map((m) => (
                  <div key={m.id} className={m.role === 'user' ? 'flex' : 'flex'}>
                    <div
                      className={
                        m.role === 'user'
                          ? 'ml-auto w-fit max-w-[85%] bg-accent text-on-accent rounded-2xl rounded-br-md px-3.5 py-2 text-sm'
                          : 'w-fit max-w-[85%] bg-subtle text-ink rounded-2xl rounded-bl-md px-3.5 py-2 text-sm'
                      }
                    >
                      <p>{m.text}</p>
                      {m.addedCourseId && (
                        <Button
                          variant="danger-soft"
                          size="sm"
                          icon={Undo2}
                          className="mt-1.5"
                          onClick={() => handleUndo(m)}
                        >
                          Undo
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <Input
                  type="text"
                  aria-label="Message the schedule assistant"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSend();
                  }}
                  placeholder="e.g. Add Web Development every Monday at 8 AM"
                />
                <Button icon={Send} onClick={handleSend} disabled={!input.trim()}>
                  Send
                </Button>
              </div>
            </div>

            <div>
              <div className="text-xs font-medium text-ink-3 mb-1.5">Try</div>
              <div className="flex flex-col items-start gap-1.5">
                {EXAMPLE_CHIPS.map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => setInput(chip)}
                    className="h-7 px-3 rounded-full border border-line bg-surface text-xs text-ink-2 hover:bg-subtle transition-[background-color] duration-150"
                  >
                    {chip}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Remove class confirm */}
      <Modal
        open={removeCourse !== null}
        onClose={() => setRemoveCourse(null)}
        title={removeCourse ? `Remove ${removeCourse.title}?` : 'Remove class?'}
        description="This removes the class from every week."
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setRemoveCourse(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                if (removeCourse) onDeleteCourse(removeCourse.id);
                setRemoveCourse(null);
              }}
            >
              Remove
            </Button>
          </>
        }
      >
        <div />
      </Modal>

      {/* Add class modal */}
      <Modal
        open={isAddClassOpen}
        onClose={() => setIsAddClassOpen(false)}
        title="Add class"
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsAddClassOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" form={formId}>
              Save class
            </Button>
          </>
        }
      >
        <form id={formId} onSubmit={handleCreateClass} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Field label="Code" htmlFor={`${formId}-code`}>
              <Input
                id={`${formId}-code`}
                placeholder="e.g. CS 101"
                value={classCode}
                onChange={(e) => setClassCode(e.target.value)}
              />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Subject name" htmlFor={`${formId}-name`}>
                <Input
                  id={`${formId}-name`}
                  required
                  placeholder="e.g. Mathematics"
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                />
              </Field>
            </div>
          </div>

          <Field label="Days" htmlFor={`${formId}-days`} error={daysError || undefined}>
            <div className="flex flex-wrap gap-1.5">
              {DAY_NAMES.map((d) => {
                const active = classDays.includes(d);
                return (
                  <button
                    key={d}
                    type="button"
                    aria-pressed={active}
                    onClick={() => {
                      setDaysError('');
                      setClassDays(
                        active ? classDays.filter((x) => x !== d) : [...classDays, d]
                      );
                    }}
                    className={cn(
                      'h-9 min-w-11 rounded-control text-[13px] font-medium transition-[background-color,color] duration-150',
                      active ? 'bg-accent text-on-accent' : 'bg-subtle text-ink-2 hover:text-ink'
                    )}
                  >
                    {d}
                  </button>
                );
              })}
            </div>
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Start time" htmlFor={`${formId}-start`}>
              <Input
                id={`${formId}-start`}
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </Field>
            <Field label="End time" htmlFor={`${formId}-end`}>
              <Input
                id={`${formId}-end`}
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </Field>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Room" htmlFor={`${formId}-room`}>
              <Input
                id={`${formId}-room`}
                placeholder="e.g. Room 101"
                value={room}
                onChange={(e) => setRoom(e.target.value)}
              />
            </Field>
            <Field label="Instructor" htmlFor={`${formId}-instructor`}>
              <Input
                id={`${formId}-instructor`}
                placeholder="e.g. Dr. Davies"
                value={instructor}
                onChange={(e) => setInstructor(e.target.value)}
              />
            </Field>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Start date (optional)" htmlFor={`${formId}-sd`}>
              <Input
                id={`${formId}-sd`}
                type="date"
                value={classStartDate}
                onChange={(e) => setClassStartDate(e.target.value)}
              />
            </Field>
            <Field
              label="End date (optional)"
              htmlFor={`${formId}-ed`}
              error={dateRangeError || undefined}
            >
              <Input
                id={`${formId}-ed`}
                type="date"
                value={classEndDate}
                onChange={(e) => setClassEndDate(e.target.value)}
              />
            </Field>
          </div>

          <Field label="Color" htmlFor={`${formId}-color`}>
            <div className="flex gap-2">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  aria-label={`Color ${c}`}
                  aria-pressed={color === c}
                  onClick={() => setColor(c)}
                  className={cn(
                    'h-7 w-7 rounded-full',
                    color === c && 'ring-2 ring-accent ring-offset-2 ring-offset-surface'
                  )}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </Field>
        </form>
      </Modal>
    </div>
  );
};

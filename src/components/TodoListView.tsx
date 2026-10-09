import React, { useId, useMemo, useState } from 'react';
import { Plus, Trash2, CalendarDays, Pencil, ChevronDown, ListChecks } from 'lucide-react';
import { Task, Course } from '../types';
import { PRIORITY_LABELS } from '../lib/priority';
import { toISODate } from '../lib/dates';
import { useToday } from '../lib/useToday';
import { formatDueLabel } from '../lib/format';
import { cn } from '../lib/cn';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Field,
  IconButton,
  Input,
  Modal,
  PageHeader,
  SegmentedControl,
  Select,
  TaskCheck,
  Textarea,
} from './ui';

interface TodoListViewProps {
  tasks: Task[];
  courses: Course[];
  onAddTask: (task: Task) => void;
  onUpdateTask?: (task: Task) => void;
  onToggleTask: (id: string) => void;
  onDeleteTask: (id: string) => void;
  searchQuery?: string;
}

type StatusFilter = 'all' | 'active' | 'overdue' | 'done';
type SortMode = 'due' | 'priority' | 'recent';

const PRIORITY_RANK: Record<Task['priority'], number> = { High: 0, Medium: 1, Low: 2 };
const PRIORITY_TONE: Record<Task['priority'], 'danger' | 'warning' | 'neutral'> = {
  High: 'danger',
  Medium: 'warning',
  Low: 'neutral',
};
const DUE_TONE_CLASS = {
  danger: 'text-danger-ink',
  warning: 'text-warning-ink',
  neutral: 'text-ink-3',
} as const;

export const TodoListView: React.FC<TodoListViewProps> = ({
  tasks,
  courses,
  onAddTask,
  onUpdateTask,
  onToggleTask,
  onDeleteTask,
  searchQuery = '',
}) => {
  const today = useToday();
  const todayIso = toISODate(today);
  const formId = useId();

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [sortMode, setSortMode] = useState<SortMode>('due');
  const [doneOpen, setDoneOpen] = useState(true);

  // Add/Edit modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [title, setTitle] = useState('');
  const [courseSelect, setCourseSelect] = useState('');
  const [otherCourse, setOtherCourse] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState<'Low' | 'Medium' | 'High'>('Medium');
  const [category, setCategory] = useState('');
  const [notes, setNotes] = useState('');

  // Delete confirm state
  const [deleteTask, setDeleteTask] = useState<Task | null>(null);

  const searched = useMemo(
    () =>
      tasks.filter((t) => {
        if (searchQuery.trim() && !t.title.toLowerCase().includes(searchQuery.toLowerCase()))
          return false;
        return true;
      }),
    [tasks, searchQuery]
  );

  const filtered = useMemo(
    () =>
      searched.filter((t) => {
        if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false;
        if (statusFilter === 'active' && t.completed) return false;
        if (statusFilter === 'done' && !t.completed) return false;
        if (statusFilter === 'overdue' && (t.completed || !t.dueDate || t.dueDate >= todayIso))
          return false;
        return true;
      }),
    [searched, priorityFilter, statusFilter, todayIso]
  );

  const sorted = useMemo(() => {
    const list = [...filtered];
    if (sortMode === 'due') {
      list.sort((a, b) => (a.dueDate || '9999').localeCompare(b.dueDate || '9999'));
    } else if (sortMode === 'priority') {
      list.sort(
        (a, b) =>
          PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] ||
          (a.dueDate || '9999').localeCompare(b.dueDate || '9999')
      );
    }
    // 'recent' keeps array order
    return list;
  }, [filtered, sortMode]);

  const activeRows = sorted.filter((t) => !t.completed);
  const doneRows = sorted.filter((t) => t.completed);

  // Counts for the status segmented control (after search + priority filters)
  const baseForCounts = searched.filter(
    (t) => priorityFilter === 'all' || t.priority === priorityFilter
  );
  const counts = {
    all: baseForCounts.length,
    active: baseForCounts.filter((t) => !t.completed).length,
    overdue: baseForCounts.filter((t) => !t.completed && t.dueDate && t.dueDate < todayIso).length,
    done: baseForCounts.filter((t) => t.completed).length,
  };

  const openAddModal = () => {
    setEditingTask(null);
    setTitle('');
    setCourseSelect('');
    setOtherCourse('');
    setDueDate(toISODate(new Date()));
    setPriority('Medium');
    setCategory('');
    setNotes('');
    setModalOpen(true);
  };

  const openEditModal = (task: Task) => {
    setEditingTask(task);
    setTitle(task.title);
    const match = task.courseId && courses.some((c) => c.id === task.courseId);
    if (match) {
      setCourseSelect(task.courseId!);
      setOtherCourse('');
    } else if (task.courseName) {
      setCourseSelect('__other');
      setOtherCourse(task.courseName);
    } else {
      setCourseSelect('');
      setOtherCourse('');
    }
    setDueDate(task.dueDate || '');
    setPriority(task.priority);
    setCategory(task.category || '');
    setNotes(task.notes || '');
    setModalOpen(true);
  };

  const resolveCourse = (): { courseId?: string; courseName?: string } => {
    if (courses.length === 0) {
      return { courseId: undefined, courseName: otherCourse.trim() || undefined };
    }
    if (courseSelect === '__other') {
      return { courseId: undefined, courseName: otherCourse.trim() || undefined };
    }
    const c = courses.find((c) => c.id === courseSelect);
    if (c) return { courseId: c.id, courseName: c.title };
    return { courseId: undefined, courseName: undefined };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    const { courseId, courseName } = resolveCourse();
    if (editingTask) {
      onUpdateTask?.({
        ...editingTask,
        title: title.trim(),
        courseId,
        courseName,
        dueDate,
        priority,
        category,
        notes: notes.trim() || undefined,
      });
    } else {
      onAddTask({
        id: `task-${Date.now()}`,
        title: title.trim(),
        courseId,
        courseName,
        dueDate,
        priority,
        category,
        completed: false,
        notes: notes.trim() || undefined,
      });
    }
    setModalOpen(false);
  };

  const renderTask = (task: Task) => {
    const due = formatDueLabel(task.dueDate, todayIso);
    return (
      <div key={task.id} className="flex gap-3 px-4 sm:px-5 py-3.5">
        <TaskCheck
          checked={task.completed}
          label={`Mark ${task.title} ${task.completed ? 'incomplete' : 'complete'}`}
          onToggle={() => onToggleTask(task.id)}
        />
        <div className="flex-1 min-w-0">
          <span
            className={cn(
              'text-sm font-medium block',
              task.completed ? 'line-through text-ink-3' : 'text-ink'
            )}
          >
            {task.title}
          </span>
          {task.notes && (
            <p className="text-[13px] text-ink-2 line-clamp-2 mt-0.5">{task.notes}</p>
          )}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-[13px]">
            <span
              className={cn(
                'inline-flex items-center gap-1.5',
                task.completed ? 'text-ink-3' : DUE_TONE_CLASS[due.tone]
              )}
            >
              <CalendarDays className="w-3.5 h-3.5" aria-hidden />
              {due.label}
            </span>
            {task.courseName && <span className="text-ink-2">{task.courseName}</span>}
            {task.category && <Badge tone="neutral">{task.category}</Badge>}
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Badge tone={PRIORITY_TONE[task.priority]} dot>
            {PRIORITY_LABELS[task.priority]}
          </Badge>
          <IconButton
            icon={Pencil}
            label="Edit task"
            size="sm"
            onClick={() => openEditModal(task)}
          />
          <IconButton
            icon={Trash2}
            label="Delete task"
            size="sm"
            onClick={() => setDeleteTask(task)}
          />
        </div>
      </div>
    );
  };

  return (
    <div>
      <PageHeader
        title="To-do list"
        description="Coursework deadlines, problem sets and review milestones."
        actions={
          <Button icon={Plus} onClick={openAddModal}>
            Add task
          </Button>
        }
      />

      {/* Toolbar */}
      <div className="flex flex-wrap gap-3 items-center justify-between mb-4">
        <SegmentedControl
          ariaLabel="Filter tasks by status"
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { value: 'all', label: 'All', count: counts.all },
            { value: 'active', label: 'Active', count: counts.active },
            { value: 'overdue', label: 'Overdue', count: counts.overdue },
            { value: 'done', label: 'Done', count: counts.done },
          ]}
        />
        <div className="flex items-center gap-2">
          <Select
            aria-label="Filter by priority"
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="w-auto"
          >
            <option value="all">All priorities</option>
            <option value="High">{PRIORITY_LABELS.High}</option>
            <option value="Medium">{PRIORITY_LABELS.Medium}</option>
            <option value="Low">{PRIORITY_LABELS.Low}</option>
          </Select>
          <Select
            aria-label="Sort tasks"
            value={sortMode}
            onChange={(e) => setSortMode(e.target.value as SortMode)}
            className="w-auto"
          >
            <option value="due">Due date</option>
            <option value="priority">Priority</option>
            <option value="recent">Recently added</option>
          </Select>
        </div>
      </div>

      {/* List */}
      {tasks.length === 0 ? (
        <EmptyState
          icon={ListChecks}
          title="No tasks yet"
          description="Add coursework, deadlines and reminders to keep track of them."
          action={
            <Button icon={Plus} onClick={openAddModal}>
              Add task
            </Button>
          }
        />
      ) : sorted.length === 0 ? (
        <EmptyState
          icon={ListChecks}
          title={
            searchQuery.trim()
              ? `No tasks match these filters · Search: “${searchQuery.trim()}”`
              : 'No tasks match these filters'
          }
          action={
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setStatusFilter('all');
                setPriorityFilter('all');
              }}
            >
              Clear filters
            </Button>
          }
        />
      ) : (
        <Card padding="none" className="divide-y divide-line">
          {statusFilter === 'all' && (
            <>
              {activeRows.map(renderTask)}
              {doneRows.length > 0 && (
                <div>
                  <button
                    type="button"
                    aria-expanded={doneOpen}
                    onClick={() => setDoneOpen((v) => !v)}
                    className="w-full flex items-center gap-2 px-4 sm:px-5 py-3 text-[13px] font-medium text-ink-2 hover:bg-subtle transition-[background-color] duration-150"
                  >
                    <ChevronDown
                      className={cn(
                        'w-4 h-4 transition-transform duration-200 ease-out',
                        !doneOpen && '-rotate-90'
                      )}
                      aria-hidden
                    />
                    Done ({doneRows.length})
                  </button>
                  {doneOpen && (
                    <div className="divide-y divide-line">{doneRows.map(renderTask)}</div>
                  )}
                </div>
              )}
            </>
          )}
          {(statusFilter === 'active' || statusFilter === 'overdue') && sorted.map(renderTask)}
          {statusFilter === 'done' && doneRows.map(renderTask)}
        </Card>
      )}

      {/* Delete confirm */}
      <Modal
        open={deleteTask !== null}
        onClose={() => setDeleteTask(null)}
        title="Delete task?"
        description={
          deleteTask ? `“${deleteTask.title}” will be permanently removed.` : undefined
        }
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleteTask(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                if (deleteTask) onDeleteTask(deleteTask.id);
                setDeleteTask(null);
              }}
            >
              Delete
            </Button>
          </>
        }
      >
        <div />
      </Modal>

      {/* Add / Edit task */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingTask ? 'Edit task' : 'Add task'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" form={formId}>
              {editingTask ? 'Save changes' : 'Add task'}
            </Button>
          </>
        }
      >
        <form id={formId} onSubmit={handleSubmit} className="space-y-4">
          <Field label="Title" htmlFor={`${formId}-title`}>
            <Input
              id={`${formId}-title`}
              required
              autoFocus
              data-autofocus
              placeholder="e.g. Finish physics lab report"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </Field>

          {courses.length > 0 ? (
            <Field label="Course" htmlFor={`${formId}-course`}>
              <Select
                id={`${formId}-course`}
                value={courseSelect}
                onChange={(e) => setCourseSelect(e.target.value)}
              >
                <option value="">No course</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.code ? `${c.code} — ${c.title}` : c.title}
                  </option>
                ))}
                <option value="__other">Other…</option>
              </Select>
              {courseSelect === '__other' && (
                <Input
                  className="mt-2"
                  aria-label="Course name"
                  placeholder="Course name"
                  value={otherCourse}
                  onChange={(e) => setOtherCourse(e.target.value)}
                />
              )}
            </Field>
          ) : (
            <Field label="Course" htmlFor={`${formId}-course`}>
              <Input
                id={`${formId}-course`}
                placeholder="Course name (optional)"
                value={otherCourse}
                onChange={(e) => setOtherCourse(e.target.value)}
              />
            </Field>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Category" htmlFor={`${formId}-category`}>
              <Input
                id={`${formId}-category`}
                placeholder="e.g. Homework"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              />
            </Field>
            <Field label="Due date" htmlFor={`${formId}-due`}>
              <Input
                id={`${formId}-due`}
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </Field>
          </div>

          <Field label="Priority" htmlFor={`${formId}-priority`}>
            <SegmentedControl
              ariaLabel="Priority"
              value={priority}
              onChange={setPriority}
              options={(['High', 'Medium', 'Low'] as const).map((p) => ({
                value: p,
                label: PRIORITY_LABELS[p],
              }))}
            />
          </Field>

          <Field label="Notes" htmlFor={`${formId}-notes`}>
            <Textarea
              id={`${formId}-notes`}
              rows={3}
              placeholder="Key instructions or reminders"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </Field>
        </form>
      </Modal>
    </div>
  );
};

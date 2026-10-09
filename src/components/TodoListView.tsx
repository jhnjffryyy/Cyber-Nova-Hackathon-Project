import React, { useState } from 'react';
import {
  CheckSquare,
  Plus,
  Check,
  Trash2,
  Calendar,
  X,
  Filter,
} from 'lucide-react';
import { Task, Course } from '../types';
import { PRIORITY_LABELS } from '../lib/priority';
import { toISODate } from '../lib/dates';

interface TodoListViewProps {
  tasks: Task[];
  courses: Course[];
  onAddTask: (task: Task) => void;
  onToggleTask: (id: string) => void;
  onDeleteTask: (id: string) => void;
  searchQuery?: string;
}

export const TodoListView: React.FC<TodoListViewProps> = ({
  tasks,
  courses,
  onAddTask,
  onToggleTask,
  onDeleteTask,
  searchQuery = '',
}) => {
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [courseName, setCourseName] = useState('');
  const [dueDate, setDueDate] = useState(toISODate(new Date()));
  const [priority, setPriority] = useState<'Low' | 'Medium' | 'High'>('Medium');
  const [category, setCategory] = useState<string>('');
  const [notes, setNotes] = useState('');

  const filteredTasks = tasks.filter((t) => {
    if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false;
    if (searchQuery.trim() && !t.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });
  const activeTasks = filteredTasks.filter((t) => !t.completed);
  const doneTasks = filteredTasks.filter((t) => t.completed);

  const renderTask = (task: Task) => (
    <div
      key={task.id}
      className="py-3 flex items-center justify-between gap-4 text-xs group hover:bg-gray-50/50 px-2 rounded-xl transition-colors"
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <button
          onClick={() => onToggleTask(task.id)}
          className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
            task.completed
              ? 'bg-emerald-600 border-emerald-600 text-white'
              : 'border-gray-300 hover:border-emerald-500'
          }`}
        >
          {task.completed && <Check className="w-3 h-3" />}
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span
              className={`font-semibold block truncate ${
                task.completed ? 'line-through text-gray-400' : 'text-gray-800'
              }`}
            >
              {task.title}
            </span>
            {task.category && (
              <span className="text-[10px] px-1.5 py-0.2 bg-gray-100 text-gray-600 rounded font-medium">
                {task.category}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 text-[10px] text-gray-400 mt-0.5">
            {task.courseName && <span>{task.courseName}</span>}
            {task.dueDate && (
              <span className="flex items-center gap-1">
                <Calendar className="w-2.5 h-2.5" />
                Due {task.dueDate}
              </span>
            )}
          </div>
          {task.notes && (
            <p className="text-[11px] text-gray-500 mt-1 italic">{task.notes}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <span
          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
            task.priority === 'High'
              ? 'bg-rose-50 text-rose-600 border border-rose-200'
              : task.priority === 'Medium'
              ? 'bg-amber-50 text-amber-600 border border-amber-200'
              : 'bg-gray-100 text-gray-600'
          }`}
        >
          {PRIORITY_LABELS[task.priority]}
        </span>
        <button
          onClick={() => onDeleteTask(task.id)}
          className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-rose-500 rounded transition-opacity"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onAddTask({
      id: `task-${Date.now()}`,
      title: title.trim(),
      courseName: courseName.trim() || undefined,
      dueDate,
      priority,
      category,
      completed: false,
      notes: notes.trim() || undefined,
    });
    setTitle('');
    setCategory('');
    setNotes('');
    setIsAddModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">
            To-do list
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Track coursework deadlines, problem sets, and review milestones
          </p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-3.5 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Add task
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
        {/* Filter bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-gray-50 p-1 rounded-xl border border-gray-200 text-xs">
              {(['all', 'High', 'Medium', 'Low'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setPriorityFilter(p)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                    priorityFilter === p
                      ? 'bg-white text-gray-900 shadow-2xs font-bold'
                      : 'text-gray-500 hover:text-gray-800'
                  }`}
                >
                  {p === 'all' ? 'All Priorities' : PRIORITY_LABELS[p]}
                </button>
              ))}
            </div>
          </div>

          <span className="text-xs text-gray-500 font-medium">
            {filteredTasks.length} task{filteredTasks.length === 1 ? '' : 's'} shown
          </span>
        </div>

        {/* Active Tasks */}
        <div className="divide-y divide-gray-100 space-y-1">
          {activeTasks.map(renderTask)}
          {activeTasks.length === 0 && (
            <div className="py-8 text-center text-xs text-gray-400">
              {filteredTasks.length === 0
                ? 'No tasks found for the current filters.'
                : 'All tasks are done. Nice work.'}
            </div>
          )}
        </div>

        {/* Completed Tasks */}
        {doneTasks.length > 0 && (
          <div className="pt-4 border-t border-gray-100 space-y-1">
            <h3 className="text-[11px] font-black text-gray-500 uppercase tracking-wider px-2 pb-1">
              Done ({doneTasks.length})
            </h3>
            <div className="divide-y divide-gray-100 space-y-1">
              {doneTasks.map(renderTask)}
            </div>
          </div>
        )}

      </div>

      {/* Add Task Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-gray-200">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <h3 className="text-base font-black text-gray-900">Add Study Task</h3>
              <button onClick={() => setIsAddModalOpen(false)}>
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <form onSubmit={handleCreateTask} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Task Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Finish physics lab report #3..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Course</label>
                  <input
                    type="text"
                    placeholder="Enter course name"
                    value={courseName}
                    onChange={(e) => setCourseName(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Category</label>
                  <input
                    type="text"
                    placeholder="Enter category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Due Date</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Priority</label>
                <div className="flex gap-2">
                  {(['High', 'Medium', 'Low'] as const).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPriority(p)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold ${
                        priority === p ? 'bg-emerald-800 text-white' : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {PRIORITY_LABELS[p]}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Notes (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="Key instructions or reminders..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-gray-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl"
                >
                  Save Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

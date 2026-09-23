import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Task, PriorityLevel } from '../../types';
import { TaskKanban } from './TaskKanban';
import { TaskCalendar } from './TaskCalendar';
import { TaskListView } from './TaskListView';
import {
  CheckSquare,
  Plus,
  Search,
  Kanban,
  Calendar,
  List,
  Sparkles,
  Eye,
} from 'lucide-react';

export const TasksView: React.FC = () => {
  const {
    tasks,
    projects,
    clients,
    highlightedTaskId,
    setHighlightedTaskId,
    setIsTaskModalOpen,
    setSelectedTaskForEdit,
    setIsAiModalOpen,
  } = useApp();

  const [viewType, setViewType] = useState<'kanban' | 'calendar' | 'list'>('kanban');
  const [search, setSearch] = useState('');
  const [projectFilter, setProjectFilter] = useState<string>('all');
  const [clientFilter, setClientFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | PriorityLevel>('all');

  // Clear highlighted task when navigating away from this view so returning shows all tasks
  useEffect(() => {
    return () => {
      setHighlightedTaskId(null);
    };
  }, [setHighlightedTaskId]);

  // Reset search and filters when highlight is cleared
  useEffect(() => {
    if (!highlightedTaskId) {
      setSearch('');
      setProjectFilter('all');
      setClientFilter('all');
      setPriorityFilter('all');
    }
  }, [highlightedTaskId]);

  // Auto-focus and point to task if navigated from search
  useEffect(() => {
    if (highlightedTaskId) {
      const target = tasks.find(t => t.id === highlightedTaskId);
      if (target) {
        setProjectFilter('all');
        setClientFilter('all');
        setPriorityFilter('all');
        setSearch(target.title);

        const timer = setTimeout(() => {
          const el =
            document.getElementById(`task-card-${highlightedTaskId}`) ||
            document.getElementById(`task-row-${highlightedTaskId}`) ||
            document.getElementById(`task-mobile-${highlightedTaskId}`);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 150);
        return () => clearTimeout(timer);
      }
    }
  }, [highlightedTaskId, tasks]);

  const filteredTasks = tasks.filter(task => {
    if (!task) return false;
    const q = (search || '').toLowerCase().trim();
    const title = (task.title || '').toLowerCase();
    const desc = (task.description || '').toLowerCase();
    const tagsMatch =
      Array.isArray(task.tags) &&
      task.tags.some(t => typeof t === 'string' && t.toLowerCase().includes(q));
    const matchesSearch = !q || title.includes(q) || desc.includes(q) || tagsMatch;

    const matchesProject = projectFilter === 'all' || task.projectId === projectFilter;
    const matchesClient = clientFilter === 'all' || task.clientId === clientFilter;
    const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;

    return matchesSearch && matchesProject && matchesClient && matchesPriority;
  });

  const handleEditTask = (task: Task) => {
    setSelectedTaskForEdit(task);
    setIsTaskModalOpen(true);
  };

  const pendingTasksCount = tasks.filter(t => t.status !== 'done').length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Task Deliverables
            </h1>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
              {pendingTasksCount} Pending / {tasks.length} Total
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Organize deliverables across Kanban boards, interactive calendars, and dense lists.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            onClick={() => setIsAiModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-sm font-bold hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-colors cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span>Ask AI</span>
          </button>

          <button
            onClick={() => {
              setSelectedTaskForEdit(null);
              setIsTaskModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-whatsapp-teal hover:from-emerald-700 hover:to-whatsapp-dark text-white text-sm font-bold shadow-md shadow-emerald-700/25 active:scale-95 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Task</span>
          </button>
        </div>
      </div>

      {/* Pointed Task Active Banner */}
      {highlightedTaskId && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs sm:text-sm font-semibold text-emerald-900 dark:text-emerald-200 animate-fade-in shadow-xs">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-600"></span>
            </span>
            <span>
              Pointing to matched task: <strong className="text-emerald-700 dark:text-emerald-300 font-black">{tasks.find(t => t.id === highlightedTaskId)?.title}</strong>
            </span>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              type="button"
              onClick={() => {
                const target = tasks.find(t => t.id === highlightedTaskId);
                if (target) handleEditTask(target);
              }}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer inline-flex items-center gap-1.5"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Edit Details</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setHighlightedTaskId(null);
                setSearch('');
              }}
              className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-emerald-300 dark:border-emerald-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 font-bold text-xs transition-colors cursor-pointer"
            >
              Show All Tasks
            </button>
          </div>
        </div>
      )}

      {/* Control & Filter Toolbar */}
      <div className="p-3 sm:p-4 rounded-2xl bg-white dark:bg-slate-900 border border-primary-400/70 dark:border-slate-800/80 shadow-sm flex flex-col xl:flex-row xl:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <input
            type="text"
            value={search}
            onChange={e => {
              setSearch(e.target.value);
              if (highlightedTaskId && e.target.value !== tasks.find(t => t.id === highlightedTaskId)?.title) {
                setHighlightedTaskId(null);
              }
            }}
            placeholder="Search tasks, descriptions, or tags..."
            className="w-full pl-3.5 pr-9 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs md:text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 w-full xl:w-auto">
          <select
            value={clientFilter}
            onChange={e => setClientFilter(e.target.value)}
            className="flex-1 sm:flex-none min-w-[110px] px-2.5 sm:px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">All Clients</option>
            {clients.map(c => (
              <option key={c.id} value={c.id}>
                {c.company}
              </option>
            ))}
          </select>

          <select
            value={projectFilter}
            onChange={e => setProjectFilter(e.target.value)}
            className="flex-1 sm:flex-none min-w-[110px] px-2.5 sm:px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">All Projects</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>

          <select
            value={priorityFilter}
            onChange={e => setPriorityFilter(e.target.value as any)}
            className="flex-1 sm:flex-none min-w-[110px] px-2.5 sm:px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">All Priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          {/* View Type Switcher */}
          <div className="flex items-center justify-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-600 dark:text-slate-300 w-full sm:w-auto mt-1 sm:mt-0">
            <button
              onClick={() => setViewType('kanban')}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewType === 'kanban'
                  ? 'bg-white dark:bg-slate-700 text-emerald-800 dark:text-emerald-300 shadow-sm'
                  : 'hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Kanban className="w-3.5 h-3.5" />
              <span>Kanban</span>
            </button>

            <button
              onClick={() => setViewType('calendar')}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewType === 'calendar'
                  ? 'bg-white dark:bg-slate-700 text-emerald-800 dark:text-emerald-300 shadow-sm'
                  : 'hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Calendar</span>
            </button>

            <button
              onClick={() => setViewType('list')}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewType === 'list'
                  ? 'bg-white dark:bg-slate-700 text-emerald-800 dark:text-emerald-300 shadow-sm'
                  : 'hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>List</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main View Content */}
      <div>
        {viewType === 'kanban' && (
          <TaskKanban filteredTasks={filteredTasks} onEditTask={handleEditTask} highlightedTaskId={highlightedTaskId} />
        )}
        {viewType === 'calendar' && (
          <TaskCalendar filteredTasks={filteredTasks} onEditTask={handleEditTask} />
        )}
        {viewType === 'list' && (
          <TaskListView filteredTasks={filteredTasks} onEditTask={handleEditTask} highlightedTaskId={highlightedTaskId} />
        )}
      </div>
    </div>
  );
};

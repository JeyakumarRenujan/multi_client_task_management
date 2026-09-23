import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Search,
  Users,
  FolderKanban,
  CheckSquare,
  FileText,
  Clock,
  Settings,
  Plus,
  ArrowRight,
  Sparkles,
  X,
} from 'lucide-react';

export const CommandPalette: React.FC = () => {
  const {
    isCommandPaletteOpen,
    setIsCommandPaletteOpen,
    clients,
    projects,
    tasks,
    invoices,
    setActiveTab,
    setIsClientModalOpen,
    setIsProjectModalOpen,
    setIsTaskModalOpen,
    setIsInvoiceModalOpen,
    setIsTimeLogModalOpen,
    setIsAiModalOpen,
  } = useApp();

  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isCommandPaletteOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
    }
  }, [isCommandPaletteOpen]);

  // Handle keyboard shortcuts (Esc to close)
  useEffect(() => {
    if (!isCommandPaletteOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        setIsCommandPaletteOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [isCommandPaletteOpen, setIsCommandPaletteOpen]);

  if (!isCommandPaletteOpen) return null;

  const filteredClients = clients.filter(
    c =>
      c.name.toLowerCase().includes(query.toLowerCase()) ||
      c.company.toLowerCase().includes(query.toLowerCase())
  );

  const filteredProjects = projects.filter(
    p =>
      p.title.toLowerCase().includes(query.toLowerCase()) ||
      p.tags.some(t => t.toLowerCase().includes(query.toLowerCase()))
  );

  const filteredTasks = tasks.filter(t =>
    t.title.toLowerCase().includes(query.toLowerCase())
  );

  const filteredInvoices = invoices.filter(
    i =>
      i.invoiceNumber.toLowerCase().includes(query.toLowerCase()) ||
      i.clientName.toLowerCase().includes(query.toLowerCase())
  );

  const handleSelectTab = (tab: string) => {
    setActiveTab(tab);
    setIsCommandPaletteOpen(false);
  };

  const handleAction = (action: () => void) => {
    action();
    setIsCommandPaletteOpen(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-8 sm:pt-20 px-2.5 sm:px-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in cursor-default"
      onClick={() => setIsCommandPaletteOpen(false)}
    >
      <div
        className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[85vh] sm:max-h-[75vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Search Header */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Escape') {
                e.preventDefault();
                setIsCommandPaletteOpen(false);
              }
            }}
            placeholder="Search clients, projects, tasks, invoices, or type a command..."
            className="flex-1 bg-transparent border-none text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none text-base md:text-lg font-semibold"
          />
          <Search className="w-5 h-5 text-emerald-600 shrink-0" />
          <button
            type="button"
            onClick={() => setIsCommandPaletteOpen(false)}
            title="Press Esc to close"
            className="hidden sm:inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 bg-slate-200/70 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 px-2 py-0.5 rounded border border-slate-300 dark:border-slate-700 transition-colors cursor-pointer"
          >
            ESC
          </button>
          <button
            onClick={() => setIsCommandPaletteOpen(false)}
            title="Close"
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results Body */}
        <div className="flex-1 overflow-y-auto p-3.5 space-y-4">
          {/* Quick Actions */}
          {!query && (
            <div>
              <div className="text-xs font-extrabold tracking-wider text-slate-400 dark:text-slate-500 uppercase px-2 mb-2">
                Quick Actions
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                <button
                  onClick={() => handleAction(() => setIsTaskModalOpen(true))}
                  className="flex items-center gap-2.5 px-3.5 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 hover:text-emerald-700 dark:hover:text-emerald-400 rounded-xl transition-colors text-left cursor-pointer"
                >
                  <Plus className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Create New Task</span>
                </button>
                <button
                  onClick={() => handleAction(() => setIsProjectModalOpen(true))}
                  className="flex items-center gap-2.5 px-3.5 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 hover:text-emerald-700 dark:hover:text-emerald-400 rounded-xl transition-colors text-left cursor-pointer"
                >
                  <FolderKanban className="w-4 h-4 text-teal-600 shrink-0" />
                  <span>Add New Project</span>
                </button>
                <button
                  onClick={() => handleAction(() => setIsClientModalOpen(true))}
                  className="flex items-center gap-2.5 px-3.5 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 hover:text-emerald-700 dark:hover:text-emerald-400 rounded-xl transition-colors text-left cursor-pointer"
                >
                  <Users className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>Add New Client</span>
                </button>
                <button
                  onClick={() => handleAction(() => setIsAiModalOpen(true))}
                  className="flex items-center gap-2.5 px-3.5 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-purple-50 dark:hover:bg-purple-950/50 hover:text-purple-600 dark:hover:text-purple-400 rounded-xl transition-colors text-left cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-purple-600 shrink-0" />
                  <span>Open Me Plus AI Copilot</span>
                </button>
                <button
                  onClick={() => handleAction(() => setIsInvoiceModalOpen(true))}
                  className="flex items-center gap-2.5 px-3.5 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-amber-50 dark:hover:bg-amber-950/50 hover:text-amber-600 dark:hover:text-amber-400 rounded-xl transition-colors text-left cursor-pointer"
                >
                  <FileText className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Generate Invoice</span>
                </button>
              </div>
            </div>
          )}

          {/* Navigation Links */}
          {!query && (
            <div>
              <div className="text-xs font-extrabold tracking-wider text-slate-400 dark:text-slate-500 uppercase px-2 mb-2">
                Navigation
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                {[
                  { tab: 'dashboard', label: 'Dashboard', icon: FolderKanban },
                  { tab: 'clients', label: 'Clients', icon: Users },
                  { tab: 'projects', label: 'Projects', icon: FolderKanban },
                  { tab: 'tasks', label: 'Tasks (Kanban)', icon: CheckSquare },
                  { tab: 'time', label: 'Time Logs', icon: Clock },
                  { tab: 'invoices', label: 'Invoices', icon: FileText },
                  { tab: 'settings', label: 'Settings', icon: Settings },
                ].map(nav => (
                  <button
                    key={nav.tab}
                    onClick={() => handleSelectTab(nav.tab)}
                    className="flex items-center gap-2.5 px-3 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-slate-800 hover:text-emerald-700 dark:hover:text-emerald-400 rounded-xl transition-colors cursor-pointer"
                  >
                    <nav.icon className="w-4 h-4 text-slate-400" />
                    <span>{nav.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Tasks Results */}
          {filteredTasks.length > 0 && (
            <div>
              <div className="text-xs font-extrabold tracking-wider text-slate-400 dark:text-slate-500 uppercase px-2 mb-1.5">
                Tasks ({filteredTasks.length})
              </div>
              {filteredTasks.slice(0, 4).map(task => (
                <div
                  key={task.id}
                  onClick={() => handleSelectTab('tasks')}
                  className="flex items-center justify-between p-2.5 hover:bg-emerald-50/60 dark:hover:bg-slate-800/70 rounded-xl cursor-pointer transition-colors group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <CheckSquare className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="text-sm sm:text-[15px] font-bold text-slate-800 dark:text-slate-200 truncate">
                      {task.title}
                    </span>
                    <span className="text-[11px] uppercase font-extrabold px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 tracking-wide">
                      {task.status}
                    </span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-2" />
                </div>
              ))}
            </div>
          )}

          {/* Projects Results */}
          {filteredProjects.length > 0 && (
            <div>
              <div className="text-xs font-extrabold tracking-wider text-slate-400 dark:text-slate-500 uppercase px-2 mb-1.5">
                Projects ({filteredProjects.length})
              </div>
              {filteredProjects.slice(0, 3).map(p => (
                <div
                  key={p.id}
                  onClick={() => handleSelectTab('projects')}
                  className="flex items-center justify-between p-2.5 hover:bg-emerald-50/60 dark:hover:bg-slate-800/70 rounded-xl cursor-pointer transition-colors group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <FolderKanban className="w-4 h-4 text-teal-600 shrink-0" />
                    <span className="text-sm sm:text-[15px] font-bold text-slate-800 dark:text-slate-200 truncate">
                      {p.title}
                    </span>
                    <span className="text-xs sm:text-sm font-semibold text-slate-400">({p.progress}%)</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-2" />
                </div>
              ))}
            </div>
          )}

          {/* Clients Results */}
          {filteredClients.length > 0 && (
            <div>
              <div className="text-xs font-extrabold tracking-wider text-slate-400 dark:text-slate-500 uppercase px-2 mb-1.5">
                Clients ({filteredClients.length})
              </div>
              {filteredClients.slice(0, 3).map(c => (
                <div
                  key={c.id}
                  onClick={() => handleSelectTab('clients')}
                  className="flex items-center justify-between p-2.5 hover:bg-emerald-50/60 dark:hover:bg-slate-800/70 rounded-xl cursor-pointer transition-colors group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Users className="w-4 h-4 text-blue-600 shrink-0" />
                    <span className="text-sm sm:text-[15px] font-bold text-slate-800 dark:text-slate-200 truncate">
                      {c.name} — <span className="text-slate-500 dark:text-slate-400 font-medium">{c.company}</span>
                    </span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-2" />
                </div>
              ))}
            </div>
          )}

          {/* Invoices Results */}
          {filteredInvoices.length > 0 && (
            <div>
              <div className="text-xs font-extrabold tracking-wider text-slate-400 dark:text-slate-500 uppercase px-2 mb-1.5">
                Invoices ({filteredInvoices.length})
              </div>
              {filteredInvoices.slice(0, 3).map(inv => (
                <div
                  key={inv.id}
                  onClick={() => handleSelectTab('invoices')}
                  className="flex items-center justify-between p-2.5 hover:bg-emerald-50/60 dark:hover:bg-slate-800/70 rounded-xl cursor-pointer transition-colors group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <FileText className="w-4 h-4 text-amber-600 shrink-0" />
                    <span className="text-sm sm:text-[15px] font-bold text-slate-800 dark:text-slate-200 truncate">
                      {inv.invoiceNumber} — {inv.clientCompany || inv.clientName || 'Client'} (${((inv.total ?? (inv as any).totalAmount) ?? 0).toLocaleString()})
                    </span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-2" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-900/80 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span>Navigation: <kbd className="font-mono font-bold bg-slate-200 dark:bg-slate-800 px-1.5 py-0.5 rounded">↑</kbd> <kbd className="font-mono font-bold bg-slate-200 dark:bg-slate-800 px-1.5 py-0.5 rounded">↓</kbd></span>
            <span>Select: <kbd className="font-mono font-bold bg-slate-200 dark:bg-slate-800 px-1.5 py-0.5 rounded">↵</kbd></span>
          </div>
          <span className="font-semibold">Me Plus Omnibar</span>
        </div>
      </div>
    </div>
  );
};

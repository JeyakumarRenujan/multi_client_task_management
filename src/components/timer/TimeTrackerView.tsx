import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Clock,
  Play,
  Pause,
  Square,
  Plus,
  FolderKanban,
  Download,
  Trash2,
  Calendar,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';

export const TimeTrackerView: React.FC = () => {
  const {
    activeTimer,
    startTimer,
    pauseTimer,
    resumeTimer,
    stopTimer,
    updateTimerDescription,
    timeEntries,
    deleteTimeEntry,
    confirmAction,
    projects,
    clients,
    user,
    setIsTimeLogModalOpen,
  } = useApp();

  const [selectedProjectId, setSelectedProjectId] = useState<string>(projects[0]?.id || '');
  const [description, setDescription] = useState<string>('');

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs
      .toString()
      .padStart(2, '0')}`;
  };

  const handleStartTimer = () => {
    if (!selectedProjectId) return;
    const project = projects.find(p => p.id === selectedProjectId);
    startTimer(
      selectedProjectId,
      project ? project.clientId : clients[0]?.id || '',
      undefined,
      description || 'Working on project task'
    );
  };

  // Simple, intuitive work metrics
  const totalSeconds = timeEntries.reduce((acc, curr) => acc + (curr.durationSeconds || 0), 0);
  const totalHours = (totalSeconds / 3600).toFixed(1);
  const uniqueProjectsCount = new Set(timeEntries.map(e => e.projectId).filter(Boolean)).size;

  const handleExportCSV = () => {
    const headers = ['ID,Date,Client,Project,Work Description,Duration (Hours)'];
    const rows = timeEntries.map(e => {
      const client = clients.find(c => c.id === e.clientId);
      const project = projects.find(p => p.id === e.projectId);
      const durationHours = (e.durationSeconds / 3600).toFixed(2);
      return `"${e.id}","${e.date}","${client?.name || 'Client'}","${project?.title || 'Project'}","${e.description.replace(/"/g, '""')}","${durationHours}"`;
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `MePlus_TimeLogs_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Time Tracker &amp; Logs
            </h1>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
              {totalHours} hrs Total
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Track your work hours easily with the live stopwatch or add manual entries.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => setIsTimeLogModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-whatsapp-teal hover:from-emerald-700 hover:to-whatsapp-dark text-white text-xs font-bold shadow-md shadow-emerald-700/25 active:scale-95 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Manual Entry</span>
          </button>
        </div>
      </div>

      {/* Hero Stopwatch Tracker Card */}
      <div className="p-6 md:p-8 rounded-3xl bg-gradient-to-br from-whatsapp-dark via-whatsapp-teal to-slate-900 text-white shadow-xl border border-emerald-500/30">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Controls */}
          <div className="space-y-4 flex-1">
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-200 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Live Project Stopwatch
            </span>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-xl">
              <div>
                <label className="block text-[11px] font-semibold text-emerald-100 mb-1">
                  Select Project
                </label>
                <select
                  value={activeTimer.isRunning || activeTimer.elapsedSeconds > 0 ? activeTimer.projectId : selectedProjectId}
                  onChange={e => setSelectedProjectId(e.target.value)}
                  disabled={activeTimer.isRunning}
                  className="w-full px-3 py-2.5 bg-slate-900/80 border border-emerald-500/40 rounded-xl text-xs font-semibold text-white focus:outline-none focus:ring-2 focus:ring-emerald-400"
                >
                  {projects.map(p => {
                    const client = clients.find(c => c.id === p.clientId);
                    return (
                      <option key={p.id} value={p.id}>
                        {p.title} ({client?.name || 'Client'})
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-emerald-100 mb-1">
                  Task Note (Optional)
                </label>
                <input
                  type="text"
                  value={activeTimer.isRunning || activeTimer.elapsedSeconds > 0 ? activeTimer.description : description}
                  onChange={e => {
                    if (activeTimer.isRunning || activeTimer.elapsedSeconds > 0) {
                      updateTimerDescription(e.target.value);
                    } else {
                      setDescription(e.target.value);
                    }
                  }}
                  placeholder="What are you working on right now?"
                  className="w-full px-3 py-2.5 bg-slate-900/80 border border-emerald-500/40 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                />
              </div>
            </div>
          </div>

          {/* Big Live Digital Clock Display */}
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="text-center sm:text-right">
              <div className="font-mono text-4xl sm:text-5xl md:text-6xl font-black tracking-wider text-white drop-shadow-md">
                {formatTime(activeTimer.elapsedSeconds)}
              </div>
              <div className="text-xs font-semibold text-emerald-200 mt-1">
                {activeTimer.isRunning ? '● RECORDING LIVE TIME' : activeTimer.elapsedSeconds > 0 ? 'PAUSED' : 'READY TO START'}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {!activeTimer.isRunning && activeTimer.elapsedSeconds === 0 && (
                <button
                  onClick={handleStartTimer}
                  className="px-6 py-4 rounded-2xl bg-whatsapp-light hover:brightness-110 text-slate-950 font-black text-sm shadow-xl shadow-black/20 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Play className="w-5 h-5 fill-slate-950" />
                  <span>Start Tracking</span>
                </button>
              )}

              {activeTimer.isRunning && (
                <button
                  onClick={pauseTimer}
                  className="px-5 py-4 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm shadow-lg active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Pause className="w-5 h-5 fill-slate-950" />
                  <span>Pause</span>
                </button>
              )}

              {!activeTimer.isRunning && activeTimer.elapsedSeconds > 0 && (
                <button
                  onClick={resumeTimer}
                  className="px-5 py-4 rounded-2xl bg-whatsapp-light hover:brightness-110 text-slate-950 font-bold text-sm shadow-lg active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Play className="w-5 h-5 fill-slate-950" />
                  <span>Resume</span>
                </button>
              )}

              {activeTimer.elapsedSeconds > 0 && (
                <button
                  onClick={stopTimer}
                  className="px-5 py-4 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm shadow-lg active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Square className="w-5 h-5 fill-white" />
                  <span>Stop &amp; Log</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Simple Work Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-sm flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase">Total Hours Logged</span>
            <div className="text-xl font-black text-slate-900 dark:text-white mt-0.5">
              {totalHours} hrs
            </div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-sm flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-400">
            <FolderKanban className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase">Projects Worked On</span>
            <div className="text-xl font-black text-teal-700 dark:text-teal-400 mt-0.5">
              {uniqueProjectsCount} {uniqueProjectsCount === 1 ? 'Project' : 'Projects'}
            </div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-sm flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase">Recorded Sessions</span>
            <div className="text-xl font-black text-slate-900 dark:text-white mt-0.5">
              {timeEntries.length} {timeEntries.length === 1 ? 'Session' : 'Sessions'}
            </div>
          </div>
        </div>
      </div>

      {/* Time Entries Table */}
      <div className="overflow-x-auto rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 shadow-sm">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">
            Time Entries History ({timeEntries.length})
          </h3>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Sorted by most recent
          </span>
        </div>

        {timeEntries.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            No time entries recorded yet. Start the stopwatch above or add a manual log.
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Client &amp; Project</th>
                <th className="py-3 px-4">Work Description</th>
                <th className="py-3 px-4">Duration</th>
                <th className="py-3 px-4 text-right">Delete</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {timeEntries.map(entry => {
                const client = clients.find(c => c.id === entry.clientId);
                const project = projects.find(p => p.id === entry.projectId);
                const secs = entry.durationSeconds || 0;
                const hoursNum = (secs / 3600).toFixed(2);

                return (
                  <tr key={entry.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                      {entry.date}
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 dark:text-white">
                        {client?.name || 'Client'}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate max-w-[180px]">
                        {project?.title || 'Project'}
                      </div>
                    </td>

                    <td className="py-3 px-4 text-slate-700 dark:text-slate-300 max-w-md">
                      {entry.description}
                    </td>

                    <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">
                      {hoursNum} hrs
                    </td>

                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() =>
                          confirmAction({
                            title: 'Delete Time Entry?',
                            message: `Are you sure you want to delete this ${hoursNum} hr logged entry for "${project?.title || 'Unknown Project'}"? This action cannot be undone.`,
                            confirmText: 'Delete Entry',
                            danger: true,
                            itemType: 'time',
                            onConfirm: () => deleteTimeEntry(entry.id),
                          })
                        }
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                        title="Delete log"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

import React from 'react';
import { useApp } from '../../context/AppContext';
import { Client } from '../../types';
import {
  Mail,
  Phone,
  FolderKanban,
  FileText,
  Clock,
  Plus,
  Edit2,
  Trash2,
  X,
} from 'lucide-react';

interface ClientDetailModalProps {
  client: Client | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (client: Client) => void;
}

export const ClientDetailModal: React.FC<ClientDetailModalProps> = ({
  client,
  isOpen,
  onClose,
  onEdit,
}) => {
  const {
    projects,
    tasks,
    timeEntries,
    deleteClient,
    confirmAction,
    setIsProjectModalOpen,
    setSelectedProjectForEdit,
  } = useApp();

  if (!isOpen || !client) return null;

  const clientProjects = projects.filter(p => p.clientId === client.id);
  const clientTasks = tasks.filter(t => t.clientId === client.id);
  const clientTimeEntries = timeEntries.filter(t => t.clientId === client.id);

  const totalSeconds = clientTimeEntries.reduce((acc, curr) => acc + curr.durationSeconds, 0);
  const totalHours = (totalSeconds / 3600).toFixed(1);

  const handleDelete = () => {
    confirmAction({
      title: 'Delete Client?',
      message: `Are you sure you want to delete "${client.name}" (${client.company})? This will permanently remove all associated projects, tasks, and time entries.`,
      confirmText: 'Delete Client',
      danger: true,
      itemType: 'client',
      onConfirm: () => {
        deleteClient(client.id);
        onClose();
      },
    });
  };

  const handleCreateProjectForClient = () => {
    setSelectedProjectForEdit(null);
    setIsProjectModalOpen(true);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh] overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-start justify-between">
          <div className="flex items-center gap-4">
            {/* Clean Initial Letter Avatar */}
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl text-white shadow-sm shrink-0"
              style={{ backgroundColor: client.color || '#128C7E' }}
            >
              {client.name ? client.name.charAt(0).toUpperCase() : 'C'}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                  {client.name}
                </h2>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                    client.status === 'active'
                      ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                      : client.status === 'lead'
                      ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {client.status}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {client.email}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onEdit(client);
                onClose();
              }}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Edit Client"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={handleDelete}
              className="p-2 rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/60 transition-colors"
              title="Delete Client"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 text-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Active Projects
              </span>
              <div className="text-lg font-black text-slate-900 dark:text-white mt-1">
                {clientProjects.length}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 text-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Tasks Pending
              </span>
              <div className="text-lg font-black text-slate-900 dark:text-white mt-1">
                {clientTasks.filter(t => t.status !== 'done').length}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 text-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Hours Tracked
              </span>
              <div className="text-lg font-black text-slate-900 dark:text-white mt-1">
                {totalHours}h
              </div>
            </div>
          </div>

          {/* Contact Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
              <h4 className="font-bold text-slate-900 dark:text-slate-100 uppercase text-[11px] tracking-wider text-slate-400 mb-2">
                Contact Information
              </h4>
              <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                <Mail className="w-4 h-4 text-emerald-600 shrink-0" />
                <a href={`mailto:${client.email}`} className="hover:underline truncate">
                  {client.email}
                </a>
              </div>
              {client.phone && (
                <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                  <Phone className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{client.phone}</span>
                </div>
              )}
            </div>

            {/* Notes */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1 text-xs">
              <h4 className="font-bold text-slate-900 dark:text-slate-100 uppercase text-[11px] tracking-wider text-slate-400 mb-2">
                Notes &amp; Preferences
              </h4>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed italic">
                {client.notes || 'No special notes recorded.'}
              </p>
            </div>
          </div>

          {/* Projects Associated with Client */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                Client Projects ({clientProjects.length})
              </h4>
              <button
                onClick={handleCreateProjectForClient}
                className="text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Project</span>
              </button>
            </div>

            {clientProjects.length === 0 ? (
              <div className="p-6 text-center border border-dashed rounded-2xl border-slate-200 dark:border-slate-800 text-xs text-slate-400">
                No active projects for this client.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {clientProjects.map(p => (
                  <div
                    key={p.id}
                    className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between"
                  >
                    <div>
                      <h5 className="text-xs font-bold text-slate-900 dark:text-white">
                        {p.title}
                      </h5>
                      <span className="text-[10px] text-slate-400">
                        Deadline: {p.deadline} &bull; {p.progress}% completed
                      </span>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 uppercase">
                      {p.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-bold hover:bg-slate-300"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

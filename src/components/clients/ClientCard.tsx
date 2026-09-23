import React from 'react';
import { useApp } from '../../context/AppContext';
import { Client } from '../../types';
import {
  Mail,
  Phone,
  Edit2,
  Trash2,
  Eye,
  Sparkles,
} from 'lucide-react';

interface ClientCardProps {
  client: Client;
  onView: (client: Client) => void;
  onEdit: (client: Client) => void;
  isHighlighted?: boolean;
}

export const ClientCard: React.FC<ClientCardProps> = ({ client, onView, onEdit, isHighlighted }) => {
  const { projects, tasks, deleteClient, confirmAction } = useApp();

  const clientProjects = projects.filter(p => p.clientId === client.id && p.status !== 'archived');
  const clientTasks = tasks.filter(t => t.clientId === client.id);
  const pendingTasks = clientTasks.filter(t => t.status !== 'done').length;

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    confirmAction({
      title: 'Delete Client?',
      message: `Are you sure you want to delete "${client.name}" (${client.company})? This action cannot be undone and will remove all associated projects and tasks.`,
      confirmText: 'Delete Client',
      danger: true,
      itemType: 'client',
      onConfirm: () => deleteClient(client.id),
    });
  };

  return (
    <div
      id={`client-card-${client.id}`}
      onClick={() => onView(client)}
      className={`p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border shadow-sm hover:shadow-md hover:border-primary-500 dark:hover:border-emerald-600 transition-all duration-300 flex flex-col justify-between cursor-pointer group relative ${
        isHighlighted
          ? 'border-emerald-500 dark:border-emerald-500 ring-4 ring-emerald-500/50 dark:ring-emerald-400/50 shadow-2xl scale-[1.02] bg-emerald-50/20 dark:bg-emerald-950/20'
          : 'border-primary-400/70 dark:border-slate-800/80'
      }`}
    >
      <div>
        {/* Pointed Client Indicator Badge */}
        {isHighlighted && (
          <div className="mb-3 -mt-1 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-600 text-white text-xs font-black shadow-md animate-bounce self-start">
            <Sparkles className="w-3.5 h-3.5 fill-white" />
            <span>Pointed Client &bull; Matched Search</span>
          </div>
        )}
        {/* Top Header */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3 min-w-0">
            {/* Clean Initial Letter Avatar */}
            <div
              className="w-11 h-11 rounded-2xl flex items-center justify-center font-black text-base text-white shadow-xs shrink-0"
              style={{ backgroundColor: client.color || '#128C7E' }}
            >
              {client.name ? client.name.charAt(0).toUpperCase() : 'C'}
            </div>

            <div className="min-w-0">
              <h3 className="font-bold text-base text-slate-900 dark:text-white truncate">
                {client.name}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                {client.email}
              </p>
            </div>
          </div>

          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase shrink-0 ${
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

        {/* Contact info snippets */}
        <div className="space-y-1.5 text-xs text-slate-500 dark:text-slate-400 mb-4">
          <div className="flex items-center gap-2 truncate">
            <Mail className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span className="truncate">{client.email}</span>
          </div>
          {client.phone && (
            <div className="flex items-center gap-2 truncate">
              <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span className="truncate">{client.phone}</span>
            </div>
          )}
        </div>
      </div>

      {/* Metrics Footer */}
      <div>
        <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
          <div className="p-2 rounded-lg bg-emerald-50/50 dark:bg-slate-800/50">
            <span className="text-[10px] text-slate-400 font-semibold block">Projects</span>
            <span className="font-bold text-slate-800 dark:text-slate-200">
              {clientProjects.length} Active
            </span>
          </div>

          <div className="p-2 rounded-lg bg-emerald-50/50 dark:bg-slate-800/50">
            <span className="text-[10px] text-slate-400 font-semibold block">Tasks</span>
            <span className="font-bold text-slate-800 dark:text-slate-200">
              {pendingTasks} Pending
            </span>
          </div>
        </div>

        {/* Actions bar */}
        <div className="flex items-center justify-between mt-3 pt-2">
          <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 group-hover:underline flex items-center gap-1">
            <Eye className="w-3.5 h-3.5" />
            <span>View Details</span>
          </span>

          <div className="flex items-center gap-1">
            <button
              onClick={e => {
                e.stopPropagation();
                onEdit(client);
              }}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Edit"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleDelete}
              className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
              title="Delete"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

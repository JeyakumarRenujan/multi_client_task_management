import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Client, ClientStatus } from '../../types';
import { ClientCard } from './ClientCard';
import { ClientDetailModal } from './ClientDetailModal';
import {
  Users,
  Plus,
  Search,
  LayoutGrid,
  List,
  Edit2,
  Trash2,
} from 'lucide-react';

export const ClientListView: React.FC = () => {
  const {
    clients,
    setIsClientModalOpen,
    setSelectedClientForEdit,
    deleteClient,
    confirmAction,
    projects,
  } = useApp();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | ClientStatus>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [inspectedClient, setInspectedClient] = useState<Client | null>(null);

  const filteredClients = clients.filter(client => {
    const matchesSearch =
      client.name.toLowerCase().includes(search.toLowerCase()) ||
      client.email.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || client.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleEdit = (client: Client) => {
    setSelectedClientForEdit(client);
    setIsClientModalOpen(true);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Client Directory
            </h1>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
              {clients.length} Clients
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage your client roster, contact channels, and agreed hourly rates.
          </p>
        </div>

        <button
          onClick={() => {
            setSelectedClientForEdit(null);
            setIsClientModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-whatsapp-teal hover:from-emerald-700 hover:to-whatsapp-dark text-white text-sm font-bold shadow-md shadow-emerald-700/25 active:scale-95 transition-all self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Client</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-primary-400/70 dark:border-slate-800/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search clients by name or email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-3.5 pr-9 py-2 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-xs"
          />
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
        </div>

        {/* Status Filter & View Toggle */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap justify-between w-full md:w-auto">
          <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-semibold overflow-x-auto max-w-full custom-scrollbar">
            {(['all', 'active', 'lead', 'inactive'] as const).map(st => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg capitalize whitespace-nowrap transition-all ${
                  statusFilter === st
                    ? 'bg-white dark:bg-slate-700 text-emerald-800 dark:text-emerald-300 shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-500">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-400 shadow-sm'
                  : 'hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-400 shadow-sm'
                  : 'hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Clients Display */}
      {filteredClients.length === 0 ? (
        <div className="py-16 text-center rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 p-6">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-3">
            <Users className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
            {clients.length === 0 ? 'No Clients Added Yet' : 'No Matching Clients Found'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            {clients.length === 0
              ? 'Add your first client profile with custom hourly rates, contact channels, and billing notes to start tracking projects.'
              : 'Try resetting your search query or filter to see your client profiles.'}
          </p>
          {clients.length === 0 ? (
            <button
              onClick={() => {
                setSelectedClientForEdit(null);
                setIsClientModalOpen(true);
              }}
              className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-whatsapp-teal text-white text-xs font-bold shadow-lg shadow-emerald-700/25 active:scale-95 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Your First Client</span>
            </button>
          ) : (
            <button
              onClick={() => {
                setSearch('');
                setStatusFilter('all');
              }}
              className="mt-4 px-4 py-2 rounded-xl text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 cursor-pointer"
            >
              Clear Filters
            </button>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredClients.map(client => (
            <ClientCard
              key={client.id}
              client={client}
              onView={c => setInspectedClient(c)}
              onEdit={handleEdit}
            />
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 shadow-sm">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Client Name</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Contact</th>
                <th className="py-3.5 px-4">Hourly Rate</th>
                <th className="py-3.5 px-4">Projects</th>
                <th className="py-3.5 px-4">Total Billed</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filteredClients.map(client => {
                const clientProjects = projects.filter(p => p.clientId === client.id);
                return (
                  <tr
                    key={client.id}
                    onClick={() => setInspectedClient(client)}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer transition-colors"
                  >
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm text-white shadow-xs shrink-0"
                          style={{ backgroundColor: client.color || '#128C7E' }}
                        >
                          {client.name ? client.name.charAt(0).toUpperCase() : 'C'}
                        </div>
                        <div className="font-bold text-slate-900 dark:text-white">
                          {client.name}
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
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
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="text-slate-700 dark:text-slate-300">{client.email}</div>
                      <div className="text-[11px] text-slate-400">{client.phone || '—'}</div>
                    </td>

                    <td className="py-3.5 px-4 font-bold text-slate-800 dark:text-slate-200">
                      {client.currency}{client.hourlyRate}/hr
                    </td>

                    <td className="py-3.5 px-4 font-semibold text-slate-600 dark:text-slate-300">
                      {clientProjects.length} projects
                    </td>

                    <td className="py-3.5 px-4 font-bold text-emerald-700 dark:text-emerald-400">
                      {client.currency}{client.totalBilled.toLocaleString()}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => handleEdit(client)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={e => {
                            e.stopPropagation();
                            confirmAction({
                              title: 'Delete Client?',
                              message: `Are you sure you want to delete "${client.name}" (${client.company})? This action cannot be undone and will remove all associated projects and tasks.`,
                              confirmText: 'Delete Client',
                              danger: true,
                              itemType: 'client',
                              onConfirm: () => deleteClient(client.id),
                            });
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                          title="Delete client"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modals */}
      <ClientDetailModal
        client={inspectedClient}
        isOpen={!!inspectedClient}
        onClose={() => setInspectedClient(null)}
        onEdit={handleEdit}
      />
    </div>
  );
};

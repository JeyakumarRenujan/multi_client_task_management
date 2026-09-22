import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Project, ProjectStatus } from '../../types';
import { ProjectCard } from './ProjectCard';
import { ProjectDetailModal } from './ProjectDetailModal';
import {
  FolderKanban,
  Plus,
  Search,
  Filter,
  LayoutGrid,
  List,
  Calendar,
  DollarSign,
  Edit2,
  Trash2,
  Play,
  Archive,
  RotateCcw,
} from 'lucide-react';

export const ProjectListView: React.FC = () => {
  const {
    projects,
    clients,
    tasks,
    setIsProjectModalOpen,
    setSelectedProjectForEdit,
    deleteProject,
    archiveProject,
    restoreProject,
    confirmAction,
    startTimer,
  } = useApp();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | ProjectStatus>('all');
  const [clientFilter, setClientFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [inspectedProject, setInspectedProject] = useState<Project | null>(null);

  const activeProjectsCount = projects.filter(p => p.status !== 'archived').length;
  const archivedProjectsCount = projects.filter(p => p.status === 'archived').length;

  const filteredProjects = projects.filter(project => {
    const matchesSearch =
      project.title.toLowerCase().includes(search.toLowerCase()) ||
      project.tags.some(t => t.toLowerCase().includes(search.toLowerCase()));
    const matchesStatus =
      statusFilter === 'all'
        ? project.status !== 'archived'
        : project.status === statusFilter;
    const matchesClient = clientFilter === 'all' || project.clientId === clientFilter;
    return matchesSearch && matchesStatus && matchesClient;
  });

  const handleEdit = (project: Project) => {
    setSelectedProjectForEdit(project);
    setIsProjectModalOpen(true);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Project Hub
            </h1>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
              {activeProjectsCount} Active
            </span>
            {archivedProjectsCount > 0 && (
              <button
                type="button"
                onClick={() => setStatusFilter(statusFilter === 'archived' ? 'all' : 'archived')}
                className={`text-xs font-bold px-2.5 py-0.5 rounded-full border transition-all flex items-center gap-1.5 cursor-pointer ${
                  statusFilter === 'archived'
                    ? 'bg-slate-800 text-white border-slate-700 dark:bg-slate-100 dark:text-slate-900 shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-slate-400'
                }`}
                title="View archived projects"
              >
                <Archive className="w-3 h-3" />
                <span>{archivedProjectsCount} Archived</span>
              </button>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Organize multi-client deliverables, budgets, and milestone progress.
          </p>
        </div>

        <button
          onClick={() => {
            setSelectedProjectForEdit(null);
            setIsProjectModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-whatsapp-teal hover:from-emerald-700 hover:to-whatsapp-dark text-white text-xs font-bold shadow-md shadow-emerald-700/25 active:scale-95 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Project</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search projects by title or tech tag..."
            className="w-full pl-3.5 pr-9 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs md:text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
        </div>

        {/* Client & Status Filters */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <select
            value={clientFilter}
            onChange={e => setClientFilter(e.target.value)}
            className="flex-1 sm:flex-none px-2.5 sm:px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">All Clients ({clients.length})</option>
            {clients.map(c => (
              <option key={c.id} value={c.id}>
                {c.company}
              </option>
            ))}
          </select>

          <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-semibold overflow-x-auto max-w-full custom-scrollbar">
            {(['all', 'in-progress', 'planning', 'completed'] as const).map(st => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 sm:px-3 py-1.5 rounded-lg capitalize whitespace-nowrap transition-all cursor-pointer ${
                  statusFilter === st
                    ? 'bg-white dark:bg-slate-700 text-emerald-800 dark:text-emerald-300 shadow-sm font-bold'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {st === 'all' ? 'All Active' : st.replace('-', ' ')}
              </button>
            ))}
            <button
              onClick={() => setStatusFilter('archived')}
              className={`px-2.5 sm:px-3 py-1.5 rounded-lg capitalize whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                statusFilter === 'archived'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm font-bold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Archive className="w-3.5 h-3.5" />
              <span>Archived</span>
              {archivedProjectsCount > 0 && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    statusFilter === 'archived'
                      ? 'bg-slate-200 dark:bg-slate-600 text-slate-800 dark:text-slate-100'
                      : 'bg-slate-200/80 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {archivedProjectsCount}
                </span>
              )}
            </button>
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

      {/* Projects Display */}
      {filteredProjects.length === 0 ? (
        <div className="py-16 text-center rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 p-6">
          <div className="w-14 h-14 rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center mx-auto mb-3">
            {statusFilter === 'archived' ? (
              <Archive className="w-7 h-7 text-slate-500" />
            ) : (
              <FolderKanban className="w-7 h-7" />
            )}
          </div>
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
            {statusFilter === 'archived'
              ? 'No Archived Projects'
              : projects.length === 0
              ? 'No Projects Created Yet'
              : 'No Matching Projects Found'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            {statusFilter === 'archived'
              ? 'Completed or inactive projects you archive from your workspace will be securely stored here.'
              : projects.length === 0
              ? 'Launch your first freelance project, set milestones, track budget, and assign client tasks.'
              : 'Try adjusting your search terms or filters to view your projects.'}
          </p>
          {statusFilter === 'archived' ? (
            <button
              onClick={() => setStatusFilter('all')}
              className="mt-4 px-4 py-2 rounded-xl text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 cursor-pointer"
            >
              Back to Active Projects
            </button>
          ) : projects.length === 0 ? (
            <button
              onClick={() => {
                setSelectedProjectForEdit(null);
                setIsProjectModalOpen(true);
              }}
              className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 text-white text-xs font-bold shadow-lg shadow-teal-700/25 active:scale-95 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create Your First Project</span>
            </button>
          ) : (
            <button
              onClick={() => {
                setSearch('');
                setStatusFilter('all');
                setClientFilter('all');
              }}
              className="mt-4 px-4 py-2 rounded-xl text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 cursor-pointer"
            >
              Clear Filters
            </button>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProjects.map(project => (
            <ProjectCard
              key={project.id}
              project={project}
              onView={p => setInspectedProject(p)}
              onEdit={handleEdit}
            />
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 shadow-sm">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Project Title</th>
                <th className="py-3.5 px-4">Client</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Progress</th>
                <th className="py-3.5 px-4">Deadline</th>
                <th className="py-3.5 px-4">Budget</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filteredProjects.map(project => {
                const client = clients.find(c => c.id === project.clientId);
                const isArchived = project.status === 'archived';
                return (
                  <tr
                    key={project.id}
                    onClick={() => setInspectedProject(project)}
                    className={`cursor-pointer transition-colors ${
                      isArchived
                        ? 'bg-slate-50/60 dark:bg-slate-900/40 hover:bg-slate-100/70 dark:hover:bg-slate-800/50 opacity-90'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        {isArchived && <Archive className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
                        <span>{project.title}</span>
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {project.tags.join(', ')}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-semibold text-slate-700 dark:text-slate-300">
                      {client?.company || 'Direct'}
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase inline-flex items-center gap-1 ${
                          project.status === 'archived'
                            ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                            : project.status === 'completed'
                            ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                            : project.status === 'in-progress'
                            ? 'bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300'
                            : 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300'
                        }`}
                      >
                        {isArchived && <Archive className="w-3 h-3 text-slate-400" />}
                        {project.status.replace('-', ' ')}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              isArchived ? 'bg-slate-400 dark:bg-slate-600' : 'bg-emerald-600'
                            }`}
                            style={{ width: `${project.progress}%` }}
                          />
                        </div>
                        <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                          {project.progress}%
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400">
                      {project.deadline}
                    </td>

                    <td className="py-3.5 px-4 font-bold text-slate-800 dark:text-slate-200">
                      ${project.budget.toLocaleString()}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5" onClick={e => e.stopPropagation()}>
                        {isArchived ? (
                          <button
                            type="button"
                            onClick={() => restoreProject(project.id)}
                            className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                            title="Restore Project"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => startTimer(project.id, project.clientId, undefined, `Working on ${project.title}`)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                              title="Start Timer"
                            >
                              <Play className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => archiveProject(project.id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40"
                              title="Archive Project"
                            >
                              <Archive className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        <button
                          type="button"
                          onClick={() => handleEdit(project)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={e => {
                            e.stopPropagation();
                            confirmAction({
                              title: 'Delete Project?',
                              message: `Are you sure you want to delete "${project.title}"? This action cannot be undone and will remove all associated tasks and time logs.`,
                              confirmText: 'Delete Project',
                              danger: true,
                              itemType: 'project',
                              onConfirm: () => deleteProject(project.id),
                            });
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                          title="Delete project"
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
      <ProjectDetailModal
        project={inspectedProject}
        isOpen={!!inspectedProject}
        onClose={() => setInspectedProject(null)}
        onEdit={handleEdit}
      />
    </div>
  );
};

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Invoice, InvoiceStatus } from '../../types';
import { downloadInvoicePdf } from './pdfGenerator';
import confetti from 'canvas-confetti';
import {
  FileText,
  Plus,
  Search,
  Download,
  CheckCircle2,
  Clock,
  Edit2,
  Trash2,
  FolderKanban,
} from 'lucide-react';

export const InvoiceListView: React.FC = () => {
  const {
    invoices,
    projects,
    setIsInvoiceModalOpen,
    setSelectedInvoiceForEdit,
    updateInvoiceStatus,
    deleteInvoice,
    confirmAction,
    showToast,
    user,
  } = useApp();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | InvoiceStatus>('all');

  const getInvTotal = (i: Invoice) => (i.total ?? (i as any).totalAmount ?? 0);

  // Revenue Metrics
  const totalInvoiced = invoices.reduce((acc, curr) => acc + getInvTotal(curr), 0);
  const paidInvoices = invoices.filter(i => i.status === 'paid');
  const totalPaid = paidInvoices.reduce((acc, curr) => acc + getInvTotal(curr), 0);
  const pendingInvoices = invoices.filter(i => i.status === 'sent' || i.status === 'overdue');
  const totalPending = pendingInvoices.reduce((acc, curr) => acc + getInvTotal(curr), 0);

  const filteredInvoices = invoices.filter(inv => {
    const invNum = inv.invoiceNumber || '';
    const comp = inv.clientCompany || '';
    const cName = inv.clientName || '';
    const desc = inv.items?.[0]?.description || '';
    const q = search.toLowerCase();

    const matchesSearch =
      invNum.toLowerCase().includes(q) ||
      comp.toLowerCase().includes(q) ||
      cName.toLowerCase().includes(q) ||
      desc.toLowerCase().includes(q);

    const matchesStatus = statusFilter === 'all' || inv.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleEdit = (inv: Invoice) => {
    setSelectedInvoiceForEdit(inv);
    setIsInvoiceModalOpen(true);
  };

  const handleDownloadPdf = (e: React.MouseEvent, inv: Invoice) => {
    e.stopPropagation();
    downloadInvoicePdf(inv, user);
    showToast({
      title: 'PDF Downloaded',
      message: `Invoice #${inv.invoiceNumber}.pdf downloaded successfully.`,
      type: 'success',
    });
  };

  const handleMarkAsPaid = (e: React.MouseEvent, inv: Invoice) => {
    e.stopPropagation();
    updateInvoiceStatus(inv.id, 'paid');

    confetti({
      particleCount: 75,
      spread: 60,
      origin: { y: 0.6 },
      colors: ['#10B981', '#059669', '#34D399', '#F59E0B'],
    });

    showToast({
      title: 'Payment Received! 🎉',
      message: `Invoice #${inv.invoiceNumber} (${user?.currency || '$'}${getInvTotal(inv).toLocaleString()}) moved to Paid Revenue.`,
      type: 'success',
    });
  };

  const getStatusBadge = (status: InvoiceStatus) => {
    switch (status) {
      case 'paid':
        return 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800';
      case 'sent':
        return 'bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800';
      case 'overdue':
        return 'bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-400 border-rose-300 dark:border-rose-800';
      default:
        return 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-700';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Invoices &amp; Revenue Tracking
            </h1>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              {invoices.length} Invoices
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Fixed project budget billing, 1-click payment tracking, and PDF download.
          </p>
        </div>

        <button
          onClick={() => {
            setSelectedInvoiceForEdit(null);
            setIsInvoiceModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-whatsapp-teal hover:from-emerald-700 hover:to-whatsapp-dark text-white text-xs font-bold shadow-md shadow-emerald-700/25 active:scale-95 transition-all self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Create Invoice</span>
        </button>
      </div>

      {/* Revenue & Receivables Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
        {/* Total Invoiced */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">
              Total Invoiced
            </span>
            <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">
              {user?.currency || '$'}{totalInvoiced.toLocaleString()}
            </div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 block">
              {invoices.length} total invoices billed
            </span>
          </div>
          <div className="p-2.5 sm:p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
            <FileText className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
        </div>

        {/* Paid Revenue */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-emerald-200/60 dark:border-emerald-900/40 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] sm:text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
              Paid Revenue
            </span>
            <div className="text-xl sm:text-2xl font-black text-emerald-700 dark:text-emerald-400 mt-1">
              {user?.currency || '$'}{totalPaid.toLocaleString()}
            </div>
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-0.5 block font-medium">
              {paidInvoices.length} payments received in bank
            </span>
          </div>
          <div className="p-2.5 sm:p-3 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
        </div>

        {/* Pending Receivables */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-amber-200/60 dark:border-amber-900/40 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] sm:text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
              Pending Receivables
            </span>
            <div className="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">
              {user?.currency || '$'}{totalPending.toLocaleString()}
            </div>
            <span className="text-[11px] text-amber-600 dark:text-amber-400 mt-0.5 block font-medium">
              {pendingInvoices.length} awaiting payment / overdue
            </span>
          </div>
          <div className="p-2.5 sm:p-3 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <Clock className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-3 sm:p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search invoice number, client, project, or description..."
            className="w-full pl-3.5 pr-9 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs md:text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-semibold overflow-x-auto max-w-full custom-scrollbar">
          {(
            [
              { id: 'all', label: 'All Invoices' },
              { id: 'paid', label: `Paid (${paidInvoices.length})` },
              { id: 'sent', label: `Sent (${invoices.filter(i => i.status === 'sent').length})` },
              { id: 'overdue', label: `Overdue (${invoices.filter(i => i.status === 'overdue').length})` },
              { id: 'draft', label: 'Drafts' },
            ] as const
          ).map(tab => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all cursor-pointer ${
                statusFilter === tab.id
                  ? 'bg-white dark:bg-slate-700 text-emerald-800 dark:text-emerald-300 shadow-sm font-bold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Invoice Content */}
      {filteredInvoices.length === 0 ? (
        <div className="py-16 text-center rounded-2xl sm:rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
          <FileText className="w-12 h-12 mx-auto text-slate-400 mb-3 opacity-50" />
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
            No invoices found
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {search || statusFilter !== 'all'
              ? 'Try changing your search query or status filter.'
              : 'Create an invoice to bill clients for project deliverables.'}
          </p>
          <button
            onClick={() => {
              setSelectedInvoiceForEdit(null);
              setIsInvoiceModalOpen(true);
            }}
            className="mt-4 px-4 py-2 rounded-xl text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 transition-colors cursor-pointer"
          >
            Create Invoice
          </button>
        </div>
      ) : (
        <div className="rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
          {/* Mobile Invoice Card View (< md) */}
          <div className="block md:hidden divide-y divide-slate-100 dark:divide-slate-800">
            {filteredInvoices.map(inv => {
              const linkedProject = projects.find(p => p.id === inv.projectId);
              const isPaid = inv.status === 'paid';

              return (
                <div
                  key={inv.id}
                  onClick={() => handleEdit(inv)}
                  className="p-3.5 space-y-2.5 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs text-slate-900 dark:text-white">
                          {inv.invoiceNumber}
                        </span>
                        <select
                          value={inv.status}
                          onClick={e => e.stopPropagation()}
                          onChange={e => updateInvoiceStatus(inv.id, e.target.value as InvoiceStatus)}
                          className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded uppercase border focus:outline-none cursor-pointer ${getStatusBadge(
                            inv.status
                          )}`}
                        >
                          <option value="draft">Draft</option>
                          <option value="sent">Sent</option>
                          <option value="paid">Paid</option>
                          <option value="overdue">Overdue</option>
                        </select>
                      </div>
                      <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-1 truncate">
                        {inv.clientCompany}
                      </h4>
                      <p className="text-[10px] text-slate-400 truncate">
                        {inv.clientName} {linkedProject ? `• ${linkedProject.title}` : ''}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="font-mono font-black text-sm text-slate-900 dark:text-white">
                        {inv.currency || '$'}{getInvTotal(inv).toLocaleString()}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        Due: {inv.dueDate}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800/80 text-xs">
                    <div>
                      {!isPaid && (
                        <button
                          type="button"
                          onClick={e => handleMarkAsPaid(e, inv)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] font-bold shadow-xs active:scale-95 transition-all cursor-pointer"
                          title="Mark as Paid"
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Mark Paid</span>
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                      <button
                        onClick={e => handleDownloadPdf(e, inv)}
                        className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 transition-colors"
                      >
                        <Download className="w-3 h-3" />
                        <span>PDF</span>
                      </button>
                      <button
                        onClick={() => handleEdit(inv)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 dark:hover:text-blue-400"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          confirmAction({
                            title: 'Delete Invoice?',
                            message: `Are you sure you want to delete invoice "${inv.invoiceNumber}" (${user?.currency || '$'}${getInvTotal(inv).toLocaleString()})?`,
                            confirmText: 'Delete Invoice',
                            danger: true,
                            itemType: 'invoice',
                            onConfirm: () => deleteInvoice(inv.id),
                          });
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop/Tablet Table View (hidden on mobile) */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Invoice #</th>
                <th className="py-3.5 px-4">Client &amp; Project</th>
                <th className="py-3.5 px-4">Service / Scope</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Due Date</th>
                <th className="py-3.5 px-4 font-mono text-right">Project Budget</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filteredInvoices.map(inv => {
                const linkedProject = projects.find(p => p.id === inv.projectId);
                const firstDescription = inv.items?.[0]?.description || 'Project Deliverables';
                const isPaid = inv.status === 'paid';

                return (
                  <tr
                    key={inv.id}
                    onClick={() => handleEdit(inv)}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 cursor-pointer transition-colors"
                  >
                    {/* Invoice Number */}
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900 dark:text-white">
                      {inv.invoiceNumber}
                    </td>

                    {/* Client & Project */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-800 dark:text-slate-200">
                        {inv.clientCompany}
                      </div>
                      <div className="text-[11px] text-slate-400">{inv.clientName}</div>
                      {linkedProject && (
                        <div className="inline-flex items-center gap-1 mt-1 px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] font-medium text-slate-600 dark:text-slate-300">
                          <FolderKanban className="w-3 h-3 text-emerald-600" />
                          <span>{linkedProject.title}</span>
                        </div>
                      )}
                    </td>

                    {/* Deliverable / Scope */}
                    <td className="py-3.5 px-4 max-w-[200px]">
                      <div className="truncate font-medium text-slate-700 dark:text-slate-300">
                        {firstDescription}
                      </div>
                    </td>

                    {/* Status & 1-Click "Mark as Paid" */}
                    <td className="py-3.5 px-4" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center gap-2">
                        <select
                          value={inv.status}
                          onChange={e => updateInvoiceStatus(inv.id, e.target.value as InvoiceStatus)}
                          className={`text-[10px] font-extrabold px-2 py-1 rounded-lg uppercase border focus:outline-none cursor-pointer ${getStatusBadge(
                            inv.status
                          )}`}
                        >
                          <option value="draft">Draft</option>
                          <option value="sent">Sent</option>
                          <option value="paid">Paid</option>
                          <option value="overdue">Overdue</option>
                        </select>

                        {!isPaid && (
                          <button
                            type="button"
                            onClick={e => handleMarkAsPaid(e, inv)}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] font-bold shadow-xs active:scale-95 transition-all cursor-pointer"
                            title="1-Click: Mark this invoice as Paid"
                          >
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Mark Paid</span>
                          </button>
                        )}
                      </div>
                    </td>

                    {/* Due Date */}
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                      {inv.dueDate}
                    </td>

                    {/* Amount / Budget */}
                    <td className="py-3.5 px-4 font-mono font-black text-slate-900 dark:text-white text-sm text-right whitespace-nowrap">
                      {inv.currency || '$'}{getInvTotal(inv).toLocaleString()}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div
                        className="flex items-center justify-end gap-1.5"
                        onClick={e => e.stopPropagation()}
                      >
                        {/* Download PDF Button */}
                        <button
                          onClick={e => handleDownloadPdf(e, inv)}
                          className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-colors cursor-pointer"
                          title="Download Invoice as PDF"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">PDF</span>
                        </button>

                        <button
                          onClick={() => handleEdit(inv)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/60 transition-colors cursor-pointer"
                          title="Edit Invoice"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            confirmAction({
                              title: 'Delete Invoice?',
                              message: `Are you sure you want to delete invoice "${inv.invoiceNumber}" (${user?.currency || '$'}${getInvTotal(inv).toLocaleString()})?`,
                              confirmText: 'Delete Invoice',
                              danger: true,
                              itemType: 'invoice',
                              onConfirm: () => deleteInvoice(inv.id),
                            });
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                          title="Delete Invoice"
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
      </div>
      )}
    </div>
  );
};

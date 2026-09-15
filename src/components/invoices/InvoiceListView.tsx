import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Invoice, InvoiceStatus } from '../../types';
import {
  FileText,
  Plus,
  Search,
  Download,
  Printer,
  DollarSign,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Edit2,
  Trash2,
  Eye,
} from 'lucide-react';

export const InvoiceListView: React.FC = () => {
  const {
    invoices,
    clients,
    setIsInvoiceModalOpen,
    setSelectedInvoiceForEdit,
    updateInvoiceStatus,
    deleteInvoice,
    confirmAction,
    user,
  } = useApp();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | InvoiceStatus>('all');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  const filteredInvoices = invoices.filter(inv => {
    const invNum = inv.invoiceNumber || '';
    const comp = inv.clientCompany || '';
    const cName = inv.clientName || '';
    const q = search.toLowerCase();

    const matchesSearch =
      invNum.toLowerCase().includes(q) ||
      comp.toLowerCase().includes(q) ||
      cName.toLowerCase().includes(q);

    const matchesStatus = statusFilter === 'all' || inv.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getInvTotal = (i: Invoice) => (i.total ?? (i as any).totalAmount ?? 0);

  const totalInvoiced = invoices.reduce((acc, curr) => acc + getInvTotal(curr), 0);
  const paidInvoices = invoices.filter(i => i.status === 'paid');
  const totalPaid = paidInvoices.reduce((acc, curr) => acc + getInvTotal(curr), 0);
  const pendingInvoices = invoices.filter(i => i.status === 'sent' || i.status === 'overdue');
  const totalPending = pendingInvoices.reduce((acc, curr) => acc + getInvTotal(curr), 0);

  const handleEdit = (inv: Invoice) => {
    setSelectedInvoiceForEdit(inv);
    setIsInvoiceModalOpen(true);
  };

  const getStatusBadge = (status: InvoiceStatus) => {
    switch (status) {
      case 'paid':
        return 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300';
      case 'sent':
        return 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300';
      case 'overdue':
        return 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-400';
      default:
        return 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Invoices &amp; Client Billing
            </h1>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
              {invoices.length} Invoices
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Generate itemized client slips, track receivables, and export printable PDFs.
          </p>
        </div>

        <button
          onClick={() => {
            setSelectedInvoiceForEdit(null);
            setIsInvoiceModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-[#128C7E] hover:from-emerald-700 hover:to-[#075E54] text-white text-xs font-bold shadow-md shadow-emerald-700/25 active:scale-95 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Create Invoice</span>
        </button>
      </div>

      {/* Financial Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Total Invoiced
            </span>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
              {user?.currency || '$'}{totalInvoiced.toLocaleString()}
            </div>
            <span className="text-[10px] text-slate-500 mt-0.5 block">{invoices.length} invoices issued</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
            <FileText className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
              Paid Revenue
            </span>
            <div className="text-2xl font-black text-emerald-700 dark:text-emerald-400 mt-1">
              {user?.currency || '$'}{totalPaid.toLocaleString()}
            </div>
            <span className="text-[10px] text-emerald-600 mt-0.5 block">{paidInvoices.length} settled payments</span>
          </div>
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
              Pending Receivables
            </span>
            <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">
              {user?.currency || '$'}{totalPending.toLocaleString()}
            </div>
            <span className="text-[10px] text-amber-600 mt-0.5 block">{pendingInvoices.length} pending / overdue</span>
          </div>
          <div className="p-3 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <Clock className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search invoice number, client, or company..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs md:text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-semibold">
          {(['all', 'draft', 'sent', 'paid', 'overdue'] as const).map(st => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg capitalize transition-all ${
                statusFilter === st
                  ? 'bg-white dark:bg-slate-700 text-emerald-800 dark:text-emerald-300 shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Invoice Table */}
      {filteredInvoices.length === 0 ? (
        <div className="py-16 text-center rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
          <FileText className="w-12 h-12 mx-auto text-slate-400 mb-3 opacity-50" />
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
            No invoices found
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Create an invoice to bill clients for completed deliverables.
          </p>
          <button
            onClick={() => {
              setSelectedInvoiceForEdit(null);
              setIsInvoiceModalOpen(true);
            }}
            className="mt-4 px-4 py-2 rounded-xl text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100"
          >
            Create First Invoice
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 shadow-sm">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Invoice #</th>
                <th className="py-3.5 px-4">Client / Company</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Issue Date</th>
                <th className="py-3.5 px-4">Due Date</th>
                <th className="py-3.5 px-4 font-mono">Amount</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filteredInvoices.map(inv => (
                <tr
                  key={inv.id}
                  onClick={() => handleEdit(inv)}
                  className="hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer transition-colors"
                >
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-900 dark:text-white">
                    {inv.invoiceNumber}
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="font-bold text-slate-800 dark:text-slate-200">
                      {inv.clientCompany}
                    </div>
                    <div className="text-[11px] text-slate-400">{inv.clientName}</div>
                  </td>

                  <td className="py-3.5 px-4" onClick={e => e.stopPropagation()}>
                    <select
                      value={inv.status}
                      onChange={e => updateInvoiceStatus(inv.id, e.target.value as InvoiceStatus)}
                      className={`text-[10px] font-bold px-2 py-1 rounded-lg uppercase border focus:outline-none ${getStatusBadge(
                        inv.status
                      )}`}
                    >
                      <option value="draft">Draft</option>
                      <option value="sent">Sent</option>
                      <option value="paid">Paid</option>
                      <option value="overdue">Overdue</option>
                    </select>
                  </td>

                  <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400">{inv.issueDate}</td>

                  <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400">{inv.dueDate}</td>

                  <td className="py-3.5 px-4 font-mono font-black text-slate-900 dark:text-white text-sm">
                    {inv.currency || '$'}{getInvTotal(inv).toLocaleString()}
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5" onClick={e => e.stopPropagation()}>
                      <button
                        onClick={() => handleEdit(inv)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/60"
                        title="Edit / Print Preview"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          confirmAction({
                            title: 'Delete Invoice?',
                            message: `Are you sure you want to delete invoice "${inv.invoiceNumber}" for ${inv.clientName || 'Client'} (${user?.currency || '$'}${inv.total.toLocaleString()})? This action cannot be undone.`,
                            confirmText: 'Delete Invoice',
                            danger: true,
                            itemType: 'invoice',
                            onConfirm: () => deleteInvoice(inv.id),
                          });
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                        title="Delete invoice"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

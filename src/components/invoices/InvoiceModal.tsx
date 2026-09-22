import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Invoice, InvoiceItem, InvoiceStatus } from '../../types';
import { downloadInvoicePdf } from './pdfGenerator';
import {
  FileText,
  Download,
  X,
} from 'lucide-react';

export const InvoiceModal: React.FC = () => {
  const {
    isInvoiceModalOpen,
    setIsInvoiceModalOpen,
    selectedInvoiceForEdit,
    setSelectedInvoiceForEdit,
    addInvoice,
    updateInvoice,
    clients,
    projects,
    showToast,
    user,
  } = useApp();

  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [clientId, setClientId] = useState('');
  const [projectId, setProjectId] = useState('');
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');
  const [status, setStatus] = useState<InvoiceStatus>('sent');
  const [serviceDescription, setServiceDescription] = useState('');
  const [amount, setAmount] = useState<number | string>(500);
  const [error, setError] = useState('');

  useEffect(() => {
    if (selectedInvoiceForEdit) {
      setInvoiceNumber(selectedInvoiceForEdit.invoiceNumber);
      setClientId(selectedInvoiceForEdit.clientId);
      setProjectId(selectedInvoiceForEdit.projectId || '');
      setIssueDate(selectedInvoiceForEdit.issueDate);
      setDueDate(selectedInvoiceForEdit.dueDate);
      setStatus(selectedInvoiceForEdit.status);

      const firstItem = selectedInvoiceForEdit.items?.[0];
      setServiceDescription(firstItem?.description || 'Project Deliverables');
      setAmount(selectedInvoiceForEdit.total || firstItem?.amount || 0);
    } else {
      const randNum = Math.floor(100 + Math.random() * 900);
      setInvoiceNumber(`INV-2026-${randNum}`);

      const initialClient = clients[0]?.id || '';
      setClientId(initialClient);

      const matchingProjects = projects.filter(p => !initialClient || p.clientId === initialClient);
      const initialProj = matchingProjects[0] || projects[0];

      if (initialProj) {
        setProjectId(initialProj.id);
        setServiceDescription(initialProj.title);
        setAmount(initialProj.budget && initialProj.budget > 0 ? initialProj.budget : 500);
      } else {
        setProjectId('');
        setServiceDescription('Freelance Project Deliverables');
        setAmount(500);
      }

      setIssueDate(new Date().toISOString().split('T')[0]);
      const due = new Date();
      due.setDate(due.getDate() + 14);
      setDueDate(due.toISOString().split('T')[0]);
      setStatus('sent');
    }
    setError('');
  }, [selectedInvoiceForEdit, isInvoiceModalOpen, clients, projects]);

  if (!isInvoiceModalOpen) return null;

  // Auto-fill budget and description from project
  const handleProjectSelect = (projId: string) => {
    setProjectId(projId);
    if (!projId) return;

    const proj = projects.find(p => p.id === projId);
    if (proj) {
      if (proj.clientId && (!clientId || clientId !== proj.clientId)) {
        setClientId(proj.clientId);
      }
      if (proj.budget && proj.budget > 0) {
        setAmount(proj.budget);
      }
      if (!serviceDescription || serviceDescription === 'Freelance Project Deliverables' || serviceDescription === 'Project Deliverables') {
        setServiceDescription(proj.title);
      }
    }
  };

  const handleClientSelect = (cId: string) => {
    setClientId(cId);
    if (projectId) {
      const currentProj = projects.find(p => p.id === projectId);
      if (currentProj && currentProj.clientId && currentProj.clientId !== cId) {
        const clientProjects = projects.filter(p => p.clientId === cId);
        if (clientProjects.length > 0) {
          handleProjectSelect(clientProjects[0].id);
        } else {
          setProjectId('');
        }
      }
    }
  };

  const selectedClient = clients.find(c => c.id === clientId) || clients[0];
  const finalAmount = Math.max(0, Number(amount) || 0);

  const getPayload = () => {
    const items: InvoiceItem[] = [
      {
        id: `item-${Date.now()}-1`,
        description: serviceDescription.trim() || 'Project Deliverables',
        quantity: 1,
        rate: finalAmount,
        amount: finalAmount,
      },
    ];

    return {
      invoiceNumber,
      clientId,
      projectId: projectId || undefined,
      issueDate,
      dueDate,
      status,
      items,
      subtotal: finalAmount,
      taxRate: 0,
      taxAmount: 0,
      discount: 0,
      total: finalAmount,
      currency: user?.currency || '$',
      notes: '',
      clientName: selectedClient?.name || 'Client',
      clientCompany: selectedClient?.company || 'Organization',
      clientEmail: selectedClient?.email || 'client@domain.com',
    };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!invoiceNumber.trim()) {
      setError('Invoice number is required.');
      return;
    }
    if (!clientId) {
      setError('Please select a client.');
      return;
    }
    if (!dueDate) {
      setError('Please set an invoice due date.');
      return;
    }
    if (!serviceDescription.trim()) {
      setError('Please enter a service or project description.');
      return;
    }
    if (finalAmount <= 0) {
      setError('Please enter a valid project budget.');
      return;
    }

    const payload = getPayload();

    if (selectedInvoiceForEdit) {
      updateInvoice(selectedInvoiceForEdit.id, payload);
    } else {
      addInvoice(payload);
    }

    setIsInvoiceModalOpen(false);
    setSelectedInvoiceForEdit(null);
  };

  const handleDownloadPdf = () => {
    const payload = getPayload();
    const invoiceToDownload: Invoice = {
      ...payload,
      id: selectedInvoiceForEdit?.id || `inv-${Date.now()}`,
      createdAt: selectedInvoiceForEdit?.createdAt || new Date().toISOString().split('T')[0],
    };

    downloadInvoicePdf(invoiceToDownload, user);
    showToast({
      title: 'PDF Downloaded',
      message: `Invoice #${invoiceNumber}.pdf downloaded successfully.`,
      type: 'success',
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[92vh] overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-600 text-white shadow-md shadow-emerald-700/20">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  {selectedInvoiceForEdit ? 'Edit Invoice' : 'Create Invoice'}
                </h2>
                <span className="text-[10px] font-mono font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                  {invoiceNumber}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              setIsInvoiceModalOpen(false);
              setSelectedInvoiceForEdit(null);
            }}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="m-5 mb-0 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 text-xs font-semibold">
            {error}
          </div>
        )}

        {/* Clean Invoice Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 md:p-6 space-y-4">
          {/* Row 1: Invoice Number & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Invoice Number *
              </label>
              <input
                type="text"
                value={invoiceNumber}
                onChange={e => setInvoiceNumber(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs md:text-sm text-slate-900 dark:text-slate-100 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Payment Status *
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => setStatus('sent')}
                  className={`py-2 px-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                    status === 'sent'
                      ? 'bg-amber-500 text-white border-amber-600 shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                  }`}
                >
                  Sent
                </button>
                <button
                  type="button"
                  onClick={() => setStatus('paid')}
                  className={`py-2 px-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                    status === 'paid'
                      ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                  }`}
                >
                  Paid ✓
                </button>
                <button
                  type="button"
                  onClick={() => setStatus('draft')}
                  className={`py-2 px-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                    status === 'draft'
                      ? 'bg-slate-700 text-white border-slate-800 shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                  }`}
                >
                  Draft
                </button>
              </div>
            </div>
          </div>

          {/* Row 2: Client & Project */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Client *
              </label>
              <select
                value={clientId}
                onChange={e => handleClientSelect(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs md:text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold cursor-pointer"
                required
              >
                <option value="">-- Choose Client --</option>
                {clients.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.company} ({c.name})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Project (Optional)
              </label>
              <select
                value={projectId}
                onChange={e => handleProjectSelect(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs md:text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold cursor-pointer"
              >
                <option value="">-- None / Direct Billing --</option>
                {projects
                  .filter(p => !clientId || p.clientId === clientId)
                  .map(p => (
                    <option key={p.id} value={p.id}>
                      {p.title} {p.budget ? `(${user?.currency || '$'}${p.budget})` : ''}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          {/* Service Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Service / Deliverable *
            </label>
            <input
              type="text"
              value={serviceDescription}
              onChange={e => setServiceDescription(e.target.value)}
              placeholder="e.g. Brand Identity Design, Website Redesign, Mobile App MVP"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs md:text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
              required
            />
          </div>

          {/* Project Budget Amount */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Project Budget ($) *
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-2 text-slate-400 font-bold text-sm">
                {user?.currency || '$'}
              </span>
              <input
                type="number"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                min="1"
                step="1"
                placeholder="500"
                className="w-full pl-8 pr-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-base font-mono font-black text-slate-900 dark:text-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>
          </div>

          {/* Row 4: Issue Date & Due Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Issue Date
              </label>
              <input
                type="date"
                value={issueDate}
                onChange={e => setIssueDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Due Date *
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>
          </div>

          {/* Total Amount Display */}
          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">
              Total Amount
            </span>
            <div className="text-2xl font-black font-mono text-emerald-700 dark:text-emerald-300">
              {user?.currency || '$'}{finalAmount.toLocaleString()}
            </div>
          </div>
        </form>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 flex items-center justify-between">
          <button
            type="button"
            onClick={handleDownloadPdf}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            <span>Download PDF</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setIsInvoiceModalOpen(false);
                setSelectedInvoiceForEdit(null);
              }}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-whatsapp-teal hover:from-emerald-700 hover:to-whatsapp-dark text-white text-xs font-bold shadow-md shadow-emerald-700/25 active:scale-95 transition-all cursor-pointer"
            >
              {selectedInvoiceForEdit ? 'Save Changes' : 'Generate Invoice'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

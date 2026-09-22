import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Invoice, InvoiceItem, InvoiceStatus } from '../../types';
import {
  FileText,
  Plus,
  Trash2,
  DollarSign,
  Calendar,
  Building,
  Printer,
  X,
  Sparkles,
  CheckCircle2,
  FolderKanban,
  Layers,
  ChevronDown,
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
    user,
  } = useApp();

  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [clientId, setClientId] = useState('');
  const [projectId, setProjectId] = useState('');
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');
  const [status, setStatus] = useState<InvoiceStatus>('sent');

  // Simple Mode (Default)
  const [billingMode, setBillingMode] = useState<'simple' | 'itemized'>('simple');
  const [serviceDescription, setServiceDescription] = useState('');
  const [amount, setAmount] = useState<number | string>(500);

  // Itemized Mode (Optional)
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [taxRate, setTaxRate] = useState<number>(0);
  const [discount, setDiscount] = useState<number>(0);

  const [error, setError] = useState('');
  const [showPrintPreview, setShowPrintPreview] = useState(false);

  useEffect(() => {
    if (selectedInvoiceForEdit) {
      setInvoiceNumber(selectedInvoiceForEdit.invoiceNumber);
      setClientId(selectedInvoiceForEdit.clientId);
      setProjectId(selectedInvoiceForEdit.projectId || '');
      setIssueDate(selectedInvoiceForEdit.issueDate);
      setDueDate(selectedInvoiceForEdit.dueDate);
      setStatus(selectedInvoiceForEdit.status);

      const isMultiItem = (selectedInvoiceForEdit.items || []).length > 1;
      if (isMultiItem) {
        setBillingMode('itemized');
        setItems(selectedInvoiceForEdit.items || []);
        setTaxRate(selectedInvoiceForEdit.taxRate || 0);
        setDiscount(selectedInvoiceForEdit.discount || 0);
      } else {
        setBillingMode('simple');
        const firstItem = selectedInvoiceForEdit.items?.[0];
        setServiceDescription(firstItem?.description || 'Project Deliverables');
        setAmount(selectedInvoiceForEdit.total || firstItem?.amount || 0);
        setItems(selectedInvoiceForEdit.items || []);
        setTaxRate(0);
        setDiscount(0);
      }
    } else {
      const randNum = Math.floor(100 + Math.random() * 900);
      setInvoiceNumber(`INV-2026-${randNum}`);

      const initialClient = clients[0]?.id || '';
      setClientId(initialClient);

      // Find projects for initial client if any
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
      setBillingMode('simple');
      setItems([
        {
          id: `item-${Date.now()}-1`,
          description: initialProj?.title || 'Project Deliverables',
          quantity: 1,
          rate: initialProj?.budget || 500,
          amount: initialProj?.budget || 500,
        },
      ]);
      setTaxRate(0);
      setDiscount(0);
    }
    setError('');
    setShowPrintPreview(false);
  }, [selectedInvoiceForEdit, isInvoiceModalOpen, clients, projects]);

  if (!isInvoiceModalOpen) return null;

  // Handle Project Selection & Auto-fill budget and description
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

  // Handle Client Selection
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

  // Line item helpers for itemized mode
  const handleAddItem = () => {
    const newItem: InvoiceItem = {
      id: `item-${Date.now()}`,
      description: 'Consulting / Design Deliverables',
      quantity: 1,
      rate: 100,
      amount: 100,
    };
    setItems([...items, newItem]);
  };

  const handleUpdateItem = (id: string, field: keyof InvoiceItem, val: any) => {
    setItems(
      items.map(item => {
        if (item.id === id) {
          const updated = { ...item, [field]: val };
          if (field === 'quantity' || field === 'rate') {
            updated.amount = Number(updated.quantity) * Number(updated.rate);
          }
          return updated;
        }
        return item;
      })
    );
  };

  const handleRemoveItem = (id: string) => {
    if (items.length === 1) {
      setError('Invoice must have at least one line item.');
      return;
    }
    setItems(items.filter(i => i.id !== id));
  };

  // Calculations
  const simpleTotal = Math.max(0, Number(amount) || 0);
  const itemizedSubtotal = items.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  const itemizedTax = Math.round((itemizedSubtotal * (Number(taxRate) || 0)) / 100);
  const itemizedDiscount = Number(discount) || 0;
  const itemizedTotal = Math.max(0, itemizedSubtotal + itemizedTax - itemizedDiscount);

  const finalTotal = billingMode === 'simple' ? simpleTotal : itemizedTotal;
  const selectedClient = clients.find(c => c.id === clientId) || clients[0];
  const selectedProj = projects.find(p => p.id === projectId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!invoiceNumber.trim()) {
      setError('Invoice number is required.');
      return;
    }
    if (!clientId) {
      setError('Please select a client to bill.');
      return;
    }
    if (!dueDate) {
      setError('Please set an invoice due date.');
      return;
    }

    if (billingMode === 'simple') {
      if (!serviceDescription.trim()) {
        setError('Please enter a service or project description.');
        return;
      }
      if (Number(amount) <= 0) {
        setError('Please enter a valid project budget / invoice amount.');
        return;
      }
    } else {
      if (items.length === 0) {
        setError('Add at least one line item in itemized mode.');
        return;
      }
    }

    const finalAmount = Number(amount) || 0;
    const finalItems: InvoiceItem[] =
      billingMode === 'itemized' && items.length > 0
        ? items
        : [
            {
              id: `item-${Date.now()}-1`,
              description: serviceDescription.trim() || selectedProj?.title || 'Agreed Project Deliverables',
              quantity: 1,
              rate: finalAmount,
              amount: finalAmount,
            },
          ];

    const subtotal = billingMode === 'itemized' ? itemizedSubtotal : finalAmount;
    const taxAmt = billingMode === 'itemized' ? itemizedTax : 0;
    const discAmt = billingMode === 'itemized' ? itemizedDiscount : 0;

    const payload = {
      invoiceNumber,
      clientId,
      projectId: projectId || undefined,
      issueDate,
      dueDate,
      status,
      items: finalItems,
      subtotal,
      taxRate: billingMode === 'itemized' ? Number(taxRate) : 0,
      taxAmount: taxAmt,
      discount: discAmt,
      total: finalTotal,
      currency: user?.currency || '$',
      notes: '',
      clientName: selectedClient?.name || 'Client',
      clientCompany: selectedClient?.company || 'Organization',
      clientEmail: selectedClient?.email || 'client@domain.com',
    };

    if (selectedInvoiceForEdit) {
      updateInvoice(selectedInvoiceForEdit.id, payload);
    } else {
      addInvoice(payload);
    }

    setIsInvoiceModalOpen(false);
    setSelectedInvoiceForEdit(null);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[92vh] overflow-hidden"
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
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Simple project budget invoicing for all freelancers
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowPrintPreview(!showPrintPreview)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 transition-colors"
            >
              <Printer className="w-3.5 h-3.5 text-emerald-600" />
              <span>{showPrintPreview ? 'Edit Form' : 'Print Preview'}</span>
            </button>
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
        </div>

        {error && (
          <div className="m-5 mb-0 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 text-xs font-semibold">
            {error}
          </div>
        )}

        {/* Modal Body: Either Printable Preview or Clean Form */}
        {showPrintPreview ? (
          <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 bg-white text-slate-900 printable-area">
            {/* Top Invoice Header */}
            <div className="flex justify-between items-start border-b pb-5">
              <div>
                <h1 className="text-3xl font-black text-emerald-700 tracking-tight">INVOICE</h1>
                <p className="text-xs font-mono font-bold text-slate-500 mt-1">{invoiceNumber}</p>
                <div className="mt-2 flex items-center gap-2">
                  <span
                    className={`inline-block text-[11px] font-extrabold uppercase px-2.5 py-0.5 rounded-full ${
                      status === 'paid'
                        ? 'bg-emerald-100 text-emerald-800'
                        : status === 'sent'
                        ? 'bg-amber-100 text-amber-800'
                        : status === 'overdue'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    Payment Status: {status.toUpperCase()}
                  </span>
                  {status === 'paid' && (
                    <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Paid in Full
                    </span>
                  )}
                </div>
              </div>

              <div className="text-right text-xs space-y-1">
                <div className="font-extrabold text-sm text-slate-900">{user?.name || 'Freelancer'}</div>
                <div className="text-slate-500">{user?.title || 'Independent Professional'}</div>
                <div className="text-slate-500">{user?.email}</div>
              </div>
            </div>

            {/* Billed To & Dates */}
            <div className="grid grid-cols-2 gap-6 text-xs">
              <div>
                <span className="font-bold text-slate-400 uppercase text-[10px] block mb-1">
                  Billed To Client:
                </span>
                <div className="font-black text-slate-900 text-sm">{selectedClient?.company || 'Client Organization'}</div>
                <div className="text-slate-600 font-medium">Attn: {selectedClient?.name || 'Client Contact'}</div>
                <div className="text-slate-500">{selectedClient?.email}</div>
                {selectedClient?.phone && <div className="text-slate-500">{selectedClient.phone}</div>}
              </div>

              <div className="text-right space-y-1.5">
                <div>
                  <span className="text-slate-400 font-semibold">Issue Date: </span>
                  <span className="font-bold">{issueDate}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold">Payment Due: </span>
                  <span className="font-bold text-slate-900">{dueDate}</span>
                </div>
                {selectedProj && (
                  <div>
                    <span className="text-slate-400 font-semibold">Project: </span>
                    <span className="font-bold text-emerald-700">{selectedProj.title}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Service & Deliverables Section */}
            {billingMode === 'simple' ? (
              <div className="rounded-2xl border border-slate-200 overflow-hidden">
                <div className="bg-slate-100 px-4 py-2.5 text-slate-700 font-bold text-xs uppercase flex justify-between">
                  <span>Project Deliverables &amp; Scope</span>
                  <span>Agreed Fee</span>
                </div>
                <div className="p-4 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-slate-900 text-sm">
                      {serviceDescription || selectedProj?.title || 'Agreed Project Scope'}
                    </div>
                    {selectedProj && (
                      <div className="text-slate-500 mt-0.5">
                        Project Scope: {selectedProj.description || selectedProj.title || 'Freelance Services'}
                      </div>
                    )}
                  </div>
                  <div className="font-mono font-black text-base text-slate-900">
                    {user?.currency || '$'}{Number(amount).toLocaleString()}
                  </div>
                </div>
              </div>
            ) : (
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100 border-y text-slate-600 font-bold uppercase">
                  <tr>
                    <th className="py-2.5 px-3">Description</th>
                    <th className="py-2.5 px-3 text-center">Hours / Qty</th>
                    <th className="py-2.5 px-3 text-right">Rate</th>
                    <th className="py-2.5 px-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map(item => (
                    <tr key={item.id}>
                      <td className="py-3 px-3 font-medium text-slate-800">{item.description}</td>
                      <td className="py-3 px-3 text-center font-mono">{item.quantity}</td>
                      <td className="py-3 px-3 text-right font-mono">${item.rate}</td>
                      <td className="py-3 px-3 text-right font-mono font-bold">${item.amount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* Total Calculation */}
            <div className="flex justify-end pt-2 border-t">
              <div className="w-64 space-y-1.5 text-xs text-right">
                {billingMode === 'itemized' && taxRate > 0 && (
                  <div className="flex justify-between text-slate-500">
                    <span>Tax ({taxRate}%):</span>
                    <span className="font-mono">+${itemizedTax.toLocaleString()}</span>
                  </div>
                )}
                {billingMode === 'itemized' && discount > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Discount:</span>
                    <span className="font-mono">-${itemizedDiscount.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-black text-slate-900 pt-2 border-t">
                  <span>Total Due:</span>
                  <span className="font-mono text-emerald-700">
                    {user?.currency || '$'}{finalTotal.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* If Paid, show stamp */}
            {status === 'paid' && (
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-center text-xs font-bold text-emerald-800 flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>PAID IN FULL &bull; Thank you for your partnership!</span>
              </div>
            )}
          </div>
        ) : (
          /* Form Mode */
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 md:p-6 space-y-4">
            {/* Mode Switcher Pill */}
            <div className="flex items-center justify-between p-2 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setBillingMode('simple')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    billingMode === 'simple'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Project Budget Mode (Simple)
                </button>
                <button
                  type="button"
                  onClick={() => setBillingMode('itemized')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    billingMode === 'itemized'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Itemized (Hours &times; Rate)
                </button>
              </div>

              <span className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:inline pr-2">
                {billingMode === 'simple' ? 'No hourly math needed' : 'Multi-line deliverables'}
              </span>
            </div>

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
                    className={`py-2 px-2 text-xs font-bold rounded-xl border transition-all ${
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
                    className={`py-2 px-2 text-xs font-bold rounded-xl border transition-all ${
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
                    className={`py-2 px-2 text-xs font-bold rounded-xl border transition-all ${
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

            {/* Row 2: Client & Project (Auto-fills Budget) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Select Client *
                </label>
                <select
                  value={clientId}
                  onChange={e => handleClientSelect(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs md:text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
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
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Select Project (Optional)
                  </label>
                  <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold">
                    ⚡ Auto-fills budget
                  </span>
                </div>
                <select
                  value={projectId}
                  onChange={e => handleProjectSelect(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs md:text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
                >
                  <option value="">-- None / Standalone Service --</option>
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

            {/* Simple Budget Mode Inputs */}
            {billingMode === 'simple' ? (
              <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-slate-800/50 border border-emerald-100 dark:border-slate-700 space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Service / Deliverable Description *
                  </label>
                  <input
                    type="text"
                    value={serviceDescription}
                    onChange={e => setServiceDescription(e.target.value)}
                    placeholder="e.g. Brand Identity Design, Website Redesign, Mobile App MVP"
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs md:text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                    required
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Project Budget / Total Invoice Amount *
                    </label>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      Direct fixed fee (no hours calculation)
                    </span>
                  </div>
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
                      className="w-full pl-8 pr-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-base font-mono font-black text-slate-900 dark:text-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      required
                    />
                  </div>
                </div>
              </div>
            ) : (
              /* Itemized Mode */
              <div className="space-y-3 pt-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Line Items ({items.length})
                  </label>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Line Item</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {items.map(item => (
                    <div
                      key={item.id}
                      className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 grid grid-cols-1 sm:grid-cols-12 gap-2 items-center"
                    >
                      <div className="sm:col-span-6">
                        <input
                          type="text"
                          value={item.description}
                          onChange={e => handleUpdateItem(item.id, 'description', e.target.value)}
                          placeholder="Deliverable description"
                          className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100"
                          required
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={e => handleUpdateItem(item.id, 'quantity', Number(e.target.value))}
                          placeholder="Qty"
                          min="1"
                          step="1"
                          className="w-full px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 text-center font-mono"
                          required
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <input
                          type="number"
                          value={item.rate}
                          onChange={e => handleUpdateItem(item.id, 'rate', Number(e.target.value))}
                          placeholder="Rate ($)"
                          min="0"
                          step="10"
                          className="w-full px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 text-right font-mono"
                          required
                        />
                      </div>

                      <div className="sm:col-span-2 flex items-center justify-between gap-1 pl-2">
                        <span className="font-mono font-bold text-xs text-slate-900 dark:text-slate-100">
                          ${item.amount}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(item.id)}
                          className="text-slate-400 hover:text-rose-500 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Tax and Discount */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-[11px] text-slate-500 font-semibold mb-1">
                      Tax Rate (%)
                    </label>
                    <input
                      type="number"
                      value={taxRate}
                      onChange={e => setTaxRate(Number(e.target.value))}
                      min="0"
                      max="100"
                      className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg font-mono text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-500 font-semibold mb-1">
                      Discount ($)
                    </label>
                    <input
                      type="number"
                      value={discount}
                      onChange={e => setDiscount(Number(e.target.value))}
                      min="0"
                      className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg font-mono text-xs"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Row 3: Issue Date & Due Date */}
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
                  Payment Due Date *
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

            {/* Total Highlight Summary */}
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider block">
                  Total Invoiced Amount
                </span>
                <span className="text-[11px] text-emerald-700 dark:text-emerald-400">
                  {status === 'paid'
                    ? 'Marked as Paid — will be counted in Paid Revenue'
                    : 'Marked as Sent — will be counted in Pending Receivables'}
                </span>
              </div>
              <div className="text-2xl font-black font-mono text-emerald-700 dark:text-emerald-300">
                {user?.currency || '$'}{finalTotal.toLocaleString()}
              </div>
            </div>
          </form>
        )}

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 flex items-center justify-between">
          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 transition-colors"
          >
            <Printer className="w-3.5 h-3.5 text-emerald-600" />
            <span>Print Slip</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setIsInvoiceModalOpen(false);
                setSelectedInvoiceForEdit(null);
              }}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-whatsapp-teal hover:from-emerald-700 hover:to-whatsapp-dark text-white text-xs font-bold shadow-md shadow-emerald-700/25 active:scale-95 transition-all"
            >
              {selectedInvoiceForEdit ? 'Save Changes' : 'Generate Invoice'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

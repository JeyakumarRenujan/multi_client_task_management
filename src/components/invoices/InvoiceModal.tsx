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
  const [status, setStatus] = useState<InvoiceStatus>('draft');
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [taxRate, setTaxRate] = useState<number>(0);
  const [discount, setDiscount] = useState<number>(0);
  const [notes, setNotes] = useState('Payment due within 14 days. Thank you for your business!');
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
      setItems(selectedInvoiceForEdit.items || []);
      setTaxRate(selectedInvoiceForEdit.taxRate);
      setDiscount(selectedInvoiceForEdit.discount);
      setNotes(selectedInvoiceForEdit.notes);
    } else {
      const randNum = Math.floor(100 + Math.random() * 900);
      setInvoiceNumber(`INV-2026-${randNum}`);
      setClientId(clients[0]?.id || '');
      setProjectId(projects[0]?.id || '');
      setIssueDate(new Date().toISOString().split('T')[0]);
      const due = new Date();
      due.setDate(due.getDate() + 14);
      setDueDate(due.toISOString().split('T')[0]);
      setStatus('draft');
      setItems([
        {
          id: `item-${Date.now()}-1`,
          description: 'Milestone 1 Deliverables: UI/UX & Frontend Integration',
          quantity: 20,
          rate: 75,
          amount: 1500,
        },
      ]);
      setTaxRate(0);
      setDiscount(0);
      setNotes('Net 14 payment terms. Please remit payment via Bank Transfer or Stripe.');
    }
    setError('');
    setShowPrintPreview(false);
  }, [selectedInvoiceForEdit, isInvoiceModalOpen, clients, projects]);

  if (!isInvoiceModalOpen) return null;

  const handleAddItem = () => {
    const newItem: InvoiceItem = {
      id: `item-${Date.now()}`,
      description: 'Consulting & Development Hours',
      quantity: 10,
      rate: 75,
      amount: 750,
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
  const subtotal = items.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  const taxAmount = Math.round((subtotal * (Number(taxRate) || 0)) / 100);
  const discountAmount = Number(discount) || 0;
  const total = Math.max(0, subtotal + taxAmount - discountAmount);

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
      setError('Please select a client.');
      return;
    }
    if (!dueDate) {
      setError('Please set an invoice due date.');
      return;
    }
    if (items.length === 0) {
      setError('Add at least one line item.');
      return;
    }

    const payload = {
      invoiceNumber,
      clientId,
      projectId: projectId || undefined,
      issueDate,
      dueDate,
      status,
      items,
      subtotal,
      taxRate: Number(taxRate),
      taxAmount,
      discount: Number(discount),
      total,
      currency: user?.currency || '$',
      notes,
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
        className="w-full max-w-3xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[92vh] overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-600 text-white shadow-md shadow-emerald-700/20">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  {selectedInvoiceForEdit ? 'Edit Invoice' : 'Create Client Invoice'}
                </h2>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                  {invoiceNumber}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Itemized deliverables, taxes, discounts, and printable slip
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
              <span>{showPrintPreview ? 'Edit Mode' : 'Print Preview'}</span>
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

        {/* Modal Body: Either Printable Preview or Form */}
        {showPrintPreview ? (
          <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-6 bg-white text-slate-900 printable-area">
            {/* Invoice Printable View */}
            <div className="flex justify-between items-start border-b pb-6">
              <div>
                <h1 className="text-2xl font-black text-emerald-700 tracking-tight">INVOICE</h1>
                <p className="text-xs font-mono font-bold text-slate-500 mt-1">{invoiceNumber}</p>
                <span className="inline-block mt-2 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                  Status: {status}
                </span>
              </div>

              <div className="text-right text-xs space-y-1">
                <div className="font-extrabold text-sm text-slate-900">{user?.name || 'Freelancer'}</div>
                <div className="text-slate-500">{user?.title}</div>
                <div className="text-slate-500">{user?.email}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 text-xs">
              <div>
                <span className="font-bold text-slate-400 uppercase text-[10px] block mb-1">
                  Billed To:
                </span>
                <div className="font-bold text-slate-900 text-sm">{selectedClient?.company}</div>
                <div className="text-slate-600">Attn: {selectedClient?.name}</div>
                <div className="text-slate-600">{selectedClient?.email}</div>
              </div>

              <div className="text-right space-y-1">
                <div>
                  <span className="text-slate-400 font-semibold">Issue Date: </span>
                  <span className="font-bold">{issueDate}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold">Due Date: </span>
                  <span className="font-bold text-rose-600">{dueDate}</span>
                </div>
                {selectedProj && (
                  <div>
                    <span className="text-slate-400 font-semibold">Project: </span>
                    <span className="font-bold">{selectedProj.title}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Line Items Table */}
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

            {/* Total Calculation breakdown */}
            <div className="flex justify-end pt-4 border-t">
              <div className="w-64 space-y-1.5 text-xs text-right">
                <div className="flex justify-between text-slate-500">
                  <span>Subtotal:</span>
                  <span className="font-mono font-bold">${subtotal.toLocaleString()}</span>
                </div>
                {taxRate > 0 && (
                  <div className="flex justify-between text-slate-500">
                    <span>Tax ({taxRate}%):</span>
                    <span className="font-mono">+${taxAmount.toLocaleString()}</span>
                  </div>
                )}
                {discount > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Discount:</span>
                    <span className="font-mono">-${discount.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-black text-slate-900 pt-2 border-t">
                  <span>Total Due:</span>
                  <span className="font-mono text-emerald-700">${total.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Payment instructions */}
            <div className="p-4 rounded-xl bg-slate-50 border text-xs text-slate-600 space-y-1">
              <span className="font-bold text-slate-700 block">Payment Notes &amp; Terms:</span>
              <p>{notes}</p>
            </div>
          </div>
        ) : (
          /* Form Mode */
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 md:p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  Client *
                </label>
                <select
                  value={clientId}
                  onChange={e => setClientId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs md:text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
                  required
                >
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.company} ({c.name})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Status
                </label>
                <select
                  value={status}
                  onChange={e => setStatus(e.target.value as InvoiceStatus)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs md:text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
                >
                  <option value="draft">Draft</option>
                  <option value="sent">Sent</option>
                  <option value="paid">Paid</option>
                  <option value="overdue">Overdue</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

            {/* Line Items Builder */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Deliverable Line Items ({items.length})
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
                {items.map((item, idx) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 grid grid-cols-1 sm:grid-cols-12 gap-2 items-center"
                  >
                    <div className="sm:col-span-6">
                      <input
                        type="text"
                        value={item.description}
                        onChange={e => handleUpdateItem(item.id, 'description', e.target.value)}
                        placeholder="Item description"
                        className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100"
                        required
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={e => handleUpdateItem(item.id, 'quantity', Number(e.target.value))}
                        placeholder="Qty / Hrs"
                        min="0.5"
                        step="0.5"
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
                        step="5"
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
            </div>

            {/* Calculations Panel */}
            <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-slate-800/60 border border-emerald-100 dark:border-slate-700/60 space-y-2">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
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

                <div className="col-span-2 flex items-center justify-end gap-3 text-right">
                  <div>
                    <span className="text-[11px] text-slate-400 font-semibold block">
                      Total Invoice Amount
                    </span>
                    <span className="font-mono text-emerald-700 dark:text-emerald-400 text-base font-black">
                      ${total.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Payment Notes &amp; Bank Details
              </label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </form>
        )}

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between">
          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300"
          >
            <Printer className="w-3.5 h-3.5 text-emerald-600" />
            <span>Print Invoice</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setIsInvoiceModalOpen(false);
                setSelectedInvoiceForEdit(null);
              }}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800"
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

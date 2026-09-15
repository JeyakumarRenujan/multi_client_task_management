import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Client, ClientStatus } from '../../types';
import {
  Users,
  Mail,
  Phone,
  X,
} from 'lucide-react';

export const ClientModal: React.FC = () => {
  const {
    isClientModalOpen,
    setIsClientModalOpen,
    selectedClientForEdit,
    setSelectedClientForEdit,
    addClient,
    updateClient,
    user,
  } = useApp();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState<ClientStatus>('active');
  const [notes, setNotes] = useState('');
  const [color, setColor] = useState('#128C7E');
  const [error, setError] = useState('');

  const colorPalette = [
    '#128C7E', // WhatsApp teal green
    '#25D366', // WhatsApp vibrant green
    '#059669', // emerald
    '#0d9488', // teal
    '#f59e0b', // amber
    '#3b82f6', // blue
  ];

  useEffect(() => {
    if (selectedClientForEdit) {
      setName(selectedClientForEdit.name);
      setEmail(selectedClientForEdit.email);
      setPhone(selectedClientForEdit.phone);
      setStatus(selectedClientForEdit.status);
      setNotes(selectedClientForEdit.notes);
      setColor(selectedClientForEdit.color);
    } else {
      setName('');
      setEmail('');
      setPhone('');
      setStatus('active');
      setNotes('');
      setColor(colorPalette[0]);
    }
    setError('');
  }, [selectedClientForEdit, isClientModalOpen]);

  if (!isClientModalOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Please enter the client name.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address (e.g. name@gmail.com).');
      return;
    }

    const defaultRate = selectedClientForEdit?.hourlyRate || user?.hourlyRate || 65;
    const defaultCurrency = selectedClientForEdit?.currency || user?.currency || '$';

    if (selectedClientForEdit) {
      updateClient(selectedClientForEdit.id, {
        name,
        company: name,
        email,
        phone,
        status,
        hourlyRate: defaultRate,
        currency: defaultCurrency,
        notes,
        color,
      });
    } else {
      addClient({
        name,
        company: name,
        email,
        phone,
        status,
        hourlyRate: defaultRate,
        currency: defaultCurrency,
        notes,
        color,
      });
    }

    setIsClientModalOpen(false);
    setSelectedClientForEdit(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh] overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-600 text-white shadow-md shadow-emerald-700/20">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                {selectedClientForEdit ? 'Edit Client' : 'Add New Client'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Simple client contact details and status
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              setIsClientModalOpen(false);
              setSelectedClientForEdit(null);
            }}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error notification */}
        {error && (
          <div className="m-5 mb-0 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 text-xs font-semibold">
            {error}
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 md:p-6 space-y-4">
          {/* Client Avatar Preview */}
          <div className="flex items-center gap-3.5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg text-white shadow-sm shrink-0 transition-colors"
              style={{ backgroundColor: color }}
            >
              {name.trim() ? name.trim().charAt(0).toUpperCase() : 'C'}
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                {name.trim() || 'Client Name'}
              </div>
              <div className="text-[11px] text-slate-400">
                {email.trim() || 'client@gmail.com'}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Client Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Sarah Jenkins"
              className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs md:text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Email Address *
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="sarah@gmail.com"
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs md:text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Phone Number (Optional)
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="+1 (555) 019-2834"
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs md:text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Client Status
              </label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as ClientStatus)}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs md:text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
              >
                <option value="active">Active Client</option>
                <option value="lead">Lead / Prospect</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Color Tag
              </label>
              <div className="flex items-center gap-2 pt-1">
                {colorPalette.map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`w-7 h-7 rounded-full transition-transform ${
                      color === c ? 'scale-125 ring-2 ring-emerald-500 ring-offset-2' : 'hover:scale-110'
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Notes &amp; Preferences (Optional)
            </label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={2}
              placeholder="e.g. Prefers email updates on Friday, flexible delivery."
              className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs md:text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </form>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={() => {
              setIsClientModalOpen(false);
              setSelectedClientForEdit(null);
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
            {selectedClientForEdit ? 'Save Changes' : 'Save Client'}
          </button>
        </div>
      </div>
    </div>
  );
};

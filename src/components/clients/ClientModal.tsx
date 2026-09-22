import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Client, ClientStatus } from '../../types';
import {
  Users,
  Mail,
  Phone,
  X,
  ChevronDown,
} from 'lucide-react';

export const COUNTRY_DIAL_CODES = [
  { code: '+94', flag: '🇱🇰', name: 'Sri Lanka (+94)', placeholder: '+94 (77) 123-4567' },
  { code: '+1', flag: '🇺🇸', name: 'United States (+1)', placeholder: '+1 (555) 019-2834' },
  { code: '+44', flag: '🇬🇧', name: 'United Kingdom (+44)', placeholder: '+44 7911 123456' },
  { code: '+91', flag: '🇮🇳', name: 'India (+91)', placeholder: '+91 98765 43210' },
  { code: '+61', flag: '🇦🇺', name: 'Australia (+61)', placeholder: '+61 412 345 678' },
  { code: '+971', flag: '🇦🇪', name: 'UAE (+971)', placeholder: '+971 50 123 4567' },
  { code: '+65', flag: '🇸🇬', name: 'Singapore (+65)', placeholder: '+65 9123 4567' },
  { code: '+49', flag: '🇩🇪', name: 'Germany (+49)', placeholder: '+49 151 23456789' },
  { code: '+33', flag: '🇫🇷', name: 'France (+33)', placeholder: '+33 6 12 34 56 78' },
  { code: '+81', flag: '🇯🇵', name: 'Japan (+81)', placeholder: '+81 90 1234 5678' },
  { code: '+60', flag: '🇲🇾', name: 'Malaysia (+60)', placeholder: '+60 12-345 6789' },
  { code: '+966', flag: '🇸🇦', name: 'Saudi Arabia (+966)', placeholder: '+966 50 123 4567' },
  { code: '+974', flag: '🇶🇦', name: 'Qatar (+974)', placeholder: '+974 3312 3456' },
  { code: '+64', flag: '🇳🇿', name: 'New Zealand (+64)', placeholder: '+64 21 123 4567' },
];

export const formatSriLankanPhone = (input: string): string => {
  const cleaned = input.trim();
  if (!cleaned) return '';

  // Already properly formatted
  if (/^\+94\s*\(\d{2}\)\s*\d{3}-\d{4}$/.test(cleaned)) {
    return cleaned;
  }

  // Extract all digits
  const digits = cleaned.replace(/\D/g, '');

  // 10 digits starting with 0 (e.g., 0771305450, 0771234567)
  if (digits.length === 10 && digits.startsWith('0')) {
    const operator = digits.substring(1, 3);
    const part1 = digits.substring(3, 6);
    const part2 = digits.substring(6, 10);
    return `+94 (${operator}) ${part1}-${part2}`;
  }

  // 11 digits starting with 94 (e.g., 94771305450, 94771234567)
  if (digits.length === 11 && digits.startsWith('94')) {
    const operator = digits.substring(2, 4);
    const part1 = digits.substring(4, 7);
    const part2 = digits.substring(7, 11);
    return `+94 (${operator}) ${part1}-${part2}`;
  }

  // 9 digits without leading 0 (e.g., 771305450, 771234567)
  if (digits.length === 9 && digits.startsWith('7')) {
    const operator = digits.substring(0, 2);
    const part1 = digits.substring(2, 5);
    const part2 = digits.substring(5, 9);
    return `+94 (${operator}) ${part1}-${part2}`;
  }

  return cleaned;
};

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
  const [countryCode, setCountryCode] = useState('+94');
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
      if (selectedClientForEdit.phone) {
        const matched = COUNTRY_DIAL_CODES.find(c => selectedClientForEdit.phone.startsWith(c.code));
        if (matched) setCountryCode(matched.code);
      }
      setStatus(selectedClientForEdit.status);
      setNotes(selectedClientForEdit.notes);
      setColor(selectedClientForEdit.color);
    } else {
      setName('');
      setEmail('');
      setPhone('');
      setCountryCode('+94');
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
    const finalPhone = countryCode === '+94' ? formatSriLankanPhone(phone) : phone.trim();

    if (selectedClientForEdit) {
      updateClient(selectedClientForEdit.id, {
        name,
        company: name,
        email,
        phone: finalPhone,
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
        phone: finalPhone,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[92vh] sm:max-h-[90vh] overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="p-2 sm:p-2.5 rounded-xl bg-emerald-600 text-white shadow-md shadow-emerald-700/20 shrink-0">
              <Users className="w-4 h-4 sm:w-5 sm:h-5" />
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
          <div className="m-4 sm:m-5 mb-0 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 text-xs font-semibold">
            {error}
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3.5 sm:space-y-4">
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

            <div className="flex rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 focus-within:ring-2 focus-within:ring-emerald-500 overflow-hidden transition-all shadow-2xs">
              {/* Country Code Dropdown */}
              <div className="relative flex items-center bg-slate-100/90 dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 px-2.5 shrink-0">
                <select
                  value={countryCode}
                  onChange={e => setCountryCode(e.target.value)}
                  className="bg-transparent text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer pr-3.5 py-2.5 appearance-none"
                  title="Country Calling Code"
                >
                  {COUNTRY_DIAL_CODES.map(c => (
                    <option key={c.code} value={c.code} className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200">
                      {c.flag} {c.code}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3 h-3 text-slate-400 pointer-events-none -ml-2.5" />
              </div>

              {/* Phone Input with Exact Placeholder */}
              <div className="relative flex-1 flex items-center">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  onBlur={() => {
                    if (countryCode === '+94' || phone.startsWith('07') || phone.startsWith('94') || phone.startsWith('+94')) {
                      setPhone(formatSriLankanPhone(phone));
                    }
                  }}
                  placeholder={countryCode === '+94' ? '+94 (77) 123-4567' : (COUNTRY_DIAL_CODES.find(c => c.code === countryCode)?.placeholder || '+94 (77) 123-4567')}
                  className="w-full pl-9 pr-3 py-2.5 bg-transparent text-xs md:text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none"
                />
              </div>
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

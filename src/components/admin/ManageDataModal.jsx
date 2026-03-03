'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Trash2, UserPlus } from 'lucide-react';
import { SALES_STAGES } from './SALES_STAGES';

function parsePrice(val) {
  if (val == null || val === '') return null;
  const s = String(val).trim().toUpperCase().replace(/,/g, '');
  const num = parseFloat(s.replace(/[KM]$/, ''));
  if (Number.isNaN(num)) return null;
  if (s.endsWith('M')) return num * 1_000_000;
  if (s.endsWith('K')) return num * 1_000;
  return num;
}

function formatPrice(num) {
  if (num == null || num === '') return '';
  const n = Number(num);
  if (Number.isNaN(n)) return '';
  if (n >= 1_000_000) return `${n / 1_000_000}M`;
  if (n >= 1_000) return `${n / 1_000}K`;
  return String(n);
}

function getInitialForm(data, type) {
  if (!data) {
    return {
      first_name: '',
      last_name: '',
      name: '',
      email: '',
      phone: '',
      subject: 'General',
      event: '',
      message: '',
      status: 'HOT',
      job_title: '',
      employer: '',
      property_interests: '',
      notes: '',
      client_folder_link: '',
      nationality: '',
      date_of_birth: '',
      home_address: '',
      sales_stage: 'New Inquiry',
      project_name: '',
      price: '',
      type: '',
      intent: '',
    };
  }
  const name = data.name || '';
  const [first = '', ...rest] = name.split(' ');
  const last = rest.join(' ') || '';
  return {
    first_name: data.first_name ?? first,
    last_name: data.last_name ?? last,
    name: data.name ?? '',
    email: data.email ?? '',
    phone: data.phone ?? '',
    subject: data.subject ?? '',
    event: data.event ?? '',
    message: data.message ?? '',
    status: data.status ?? 'HOT',
    job_title: data.job_title ?? '',
    employer: data.employer ?? '',
    property_interests: data.property_interests ?? '',
    notes: data.notes ?? '',
    client_folder_link: data.client_folder_link ?? '',
    nationality: data.nationality ?? '',
    date_of_birth: data.date_of_birth ? String(data.date_of_birth).slice(0, 10) : '',
    home_address: data.home_address ?? '',
    sales_stage: data.sales_stage ?? 'New Inquiry',
    project_name: data.project_name ?? '',
    price: formatPrice(data.price) || '',
    type: data.type ?? '',
    intent: data.intent ?? '',
  };
}

export default function ManageDataModal({
  show,
  data,
  type,
  mode,
  onClose,
  onSave,
  onDelete,
  onMoveToLeads,
  loading,
  salesStages = SALES_STAGES,
}) {
  const isEnquiry = type === 'enquiry';
  const isLead = type === 'lead';
  const isEdit = mode === 'edit';
  const isCreate = mode === 'create';

  const [conversionOpen, setConversionOpen] = useState(false);
  const [form, setForm] = useState(() => getInitialForm(data, type));

  const update = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isEnquiry) {
      const payload = {
        first_name: form.first_name,
        last_name: form.last_name,
        email: form.email,
        phone: form.phone,
        subject: form.subject,
        event: form.event,
        message: form.message,
        status: form.status,
        job_title: form.job_title,
        employer: form.employer,
        property_interests: form.property_interests,
        notes: form.notes,
        client_folder_link: form.client_folder_link,
        nationality: form.nationality,
        date_of_birth: form.date_of_birth || null,
        home_address: form.home_address,
      };
      onSave?.(data?.id ?? null, payload);
    } else {
      const payload = {
        name: form.name || `${form.first_name} ${form.last_name}`.trim() || '—',
        email: form.email,
        phone: form.phone,
        status: form.status,
        sales_stage: form.sales_stage,
        project_name: form.project_name,
        price: parsePrice(form.price),
        type: form.type,
        intent: form.intent,
        event: form.event,
        job_title: form.job_title,
        employer: form.employer,
        property_interests: form.property_interests,
        notes: form.notes,
        client_folder_link: form.client_folder_link,
        nationality: form.nationality,
        date_of_birth: form.date_of_birth || null,
        home_address: form.home_address,
      };
      onSave?.(data?.id ?? null, payload);
    }
  };

  const handleMoveToLeads = () => {
    const enquiryName = [form.first_name, form.last_name].filter(Boolean).join(' ') || form.email || 'Unknown';
    const moveData = {
      projectName: form.project_name,
      intent: form.intent,
      budget: form.price,
      unitType: form.type,
    };
    const formDataSnapshot = {
      first_name: form.first_name,
      last_name: form.last_name,
      email: form.email,
      phone: form.phone,
      job_title: form.job_title,
      employer: form.employer,
      property_interests: form.property_interests,
      notes: form.notes,
      client_folder_link: form.client_folder_link,
      nationality: form.nationality,
      date_of_birth: form.date_of_birth,
      home_address: form.home_address,
      event: form.event,
    };
    onMoveToLeads?.(data?.id, { enquiryName, moveData, formDataSnapshot });
  };

  if (!show) return null;

  const title = isCreate ? (isEnquiry ? 'New Enquiry' : 'New Lead') : isEnquiry ? 'Edit Enquiry' : 'Edit Lead';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div
        className="relative bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="shrink-0 px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-secondary">{title}</h2>
          <button type="button" onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500" aria-label="Close">
            <span className="text-xl leading-none">&times;</span>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {isEnquiry && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First name</label>
                  <input type="text" value={form.first_name} onChange={(e) => update('first_name', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last name</label>
                  <input type="text" value={form.last_name} onChange={(e) => update('last_name', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary" />
                </div>
              </div>
            )}
            {isLead && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input type="text" value={form.name} onChange={(e) => update('name', e.target.value)} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary" />
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input type="email" value={form.email} onChange={(e) => update('email', e.target.value)} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                <input type="tel" value={form.phone} onChange={(e) => update('phone', e.target.value)} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary" />
              </div>
            </div>
            {isEnquiry && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subject *</label>
                  <input type="text" value={form.subject} onChange={(e) => update('subject', e.target.value)} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Message *</label>
                  <textarea value={form.message} onChange={(e) => update('message', e.target.value)} required rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select value={form.status} onChange={(e) => update('status', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary">
                    <option value="HOT">HOT</option>
                    <option value="WARM">WARM</option>
                    <option value="COLD">COLD</option>
                  </select>
                </div>
              </>
            )}
            {isLead && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select value={form.status} onChange={(e) => update('status', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary">
                      <option value="HOT">HOT</option>
                      <option value="WARM">WARM</option>
                      <option value="COLD">COLD</option>
                      <option value="LOST">LOST</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sales stage</label>
                    <select value={form.sales_stage} onChange={(e) => update('sales_stage', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary">
                      {salesStages.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Project name</label>
                    <input type="text" value={form.project_name} onChange={(e) => update('project_name', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Price (e.g. 1.5M or 500K)</label>
                    <input type="text" value={form.price} onChange={(e) => update('price', e.target.value)} placeholder="1.5M" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary" />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                    <input type="text" value={form.type} onChange={(e) => update('type', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Intent</label>
                    <input type="text" value={form.intent} onChange={(e) => update('intent', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary" />
                  </div>
                </div>
              </>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Event</label>
              <input type="text" value={form.event} onChange={(e) => update('event', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Job title</label>
                <input type="text" value={form.job_title} onChange={(e) => update('job_title', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Employer</label>
                <input type="text" value={form.employer} onChange={(e) => update('employer', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Property interests</label>
              <textarea value={form.property_interests} onChange={(e) => update('property_interests', e.target.value)} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nationality</label>
                <input type="text" value={form.nationality} onChange={(e) => update('nationality', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date of birth</label>
                <input type="date" value={form.date_of_birth} onChange={(e) => update('date_of_birth', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Home address</label>
              <textarea value={form.home_address} onChange={(e) => update('home_address', e.target.value)} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea value={form.notes} onChange={(e) => update('notes', e.target.value)} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Client folder link</label>
              <input type="url" value={form.client_folder_link} onChange={(e) => update('client_folder_link', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary" placeholder="https://..." />
            </div>

            {isEnquiry && isEdit && (
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => setConversionOpen((o) => !o)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 text-left font-medium text-gray-800"
                >
                  <span className="flex items-center gap-2"><UserPlus className="w-4 h-4" /> Lead conversion</span>
                  {conversionOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                {conversionOpen && (
                  <div className="p-4 border-t border-gray-200 space-y-3">
                    <p className="text-sm text-gray-600">Convert this enquiry into a lead. Fill project and budget above if needed, then click Move to Lead.</p>
                    <button
                      type="button"
                      onClick={handleMoveToLeads}
                      disabled={loading}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg font-medium hover:opacity-90 disabled:opacity-50"
                    >
                      <UserPlus className="w-4 h-4" /> Move to Lead
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="shrink-0 px-6 py-4 border-t border-gray-200 flex flex-wrap items-center justify-between gap-3 bg-gray-50">
            <div>
              {isEdit && onDelete && (
                <button
                  type="button"
                  onClick={() => window.confirm('Delete this record?') && onDelete(data?.id)}
                  disabled={loading}
                  className="inline-flex items-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg font-medium disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" /> Delete
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 font-medium">
                Cancel
              </button>
              <button type="submit" disabled={loading} className="px-4 py-2 rounded-lg bg-primary text-white font-medium hover:opacity-90 disabled:opacity-50">
                {loading ? 'Saving…' : isCreate ? 'Create' : 'Save'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

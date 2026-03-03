'use client';

import { useState, useEffect } from 'react';
import { X, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';

const SALES_STAGES = [
  'New Inquiry', 'Contacted', 'Requirements Captured', 'Qualified Lead',
  'Property Shared', 'Shortlisted', 'Site Visit Scheduled', 'Site Visit Done',
  'Negotiation', 'Offer Made', 'Offer Accepted', 'Booking / Reservation',
  'SPA Issued', 'SPA Signed', 'Mortgage Approved',
  'Oqood Registered / Title Deed Issued', 'Deal Closed – Won', 'Deal Lost',
  'Post-Sale Follow-up',
];

const STATUS_OPTIONS = ['HOT', 'WARM', 'COLD', 'LOST'];

function parsePrice(val) {
  if (val === '' || val == null) return null;
  const s = String(val).trim().toUpperCase();
  const num = parseFloat(s.replace(/[KM,\s]/g, '')) || 0;
  if (s.endsWith('K')) return num * 1000;
  if (s.endsWith('M')) return num * 1000000;
  return num;
}

function formatPrice(num) {
  if (num == null) return '';
  if (num >= 1000000) return `${num / 1000000}M`;
  if (num >= 1000) return `${num / 1000}K`;
  return String(num);
}

const emptyEnquiry = {
  first_name: '', last_name: '', email: '', phone: '', subject: '', event: '', message: '',
  status: 'HOT', job_title: '', employer: '', property_interests: '', notes: '', client_folder_link: '',
  nationality: '', date_of_birth: '', home_address: '',
};

const emptyLead = {
  name: '', phone: '', email: '', project_name: '', type: '', price: '', status: 'HOT', sales_stage: 'New Inquiry',
  job_title: '', employer: '', property_interests: '', notes: '', client_folder_link: '',
  nationality: '', date_of_birth: '', home_address: '', intent: '', event: '',
};

export default function ManageDataModal({
  show,
  data,
  type,
  mode,
  onClose,
  onSave,
  onDelete,
  onMoveToLeads,
  loading = false,
  salesStages = SALES_STAGES,
}) {
  const [form, setForm] = useState(type === 'enquiry' ? { ...emptyEnquiry } : { ...emptyLead });
  const [conversionOpen, setConversionOpen] = useState(false);
  const [moveData, setMoveData] = useState({ projectName: '', intent: '', price: '', type: '' });

  useEffect(() => {
    if (!show) return;
    const run = () => {
      if (data && mode === 'edit') {
        if (type === 'enquiry') {
          setForm({
            first_name: data.first_name ?? '',
            last_name: data.last_name ?? '',
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
            date_of_birth: data.date_of_birth ? (data.date_of_birth.toString?.()?.slice(0, 10) || '') : '',
            home_address: data.home_address ?? '',
          });
        } else {
          setForm({
            name: data.name ?? '',
            phone: data.phone ?? '',
            email: data.email ?? '',
            project_name: data.project_name ?? '',
            type: data.type ?? '',
            price: formatPrice(data.price),
            status: data.status ?? 'HOT',
            sales_stage: data.sales_stage ?? 'New Inquiry',
            job_title: data.job_title ?? '',
            employer: data.employer ?? '',
            property_interests: data.property_interests ?? '',
            notes: data.notes ?? '',
            client_folder_link: data.client_folder_link ?? '',
            nationality: data.nationality ?? '',
            date_of_birth: data.date_of_birth ? (data.date_of_birth.toString?.()?.slice(0, 10) || '') : '',
            home_address: data.home_address ?? '',
            intent: data.intent ?? '',
            event: data.event ?? '',
          });
        }
        setMoveData({
          projectName: data.project_name ?? '',
          intent: data.intent ?? '',
          price: formatPrice(data.price),
          type: data.type ?? '',
        });
      } else {
        setForm(type === 'enquiry' ? { ...emptyEnquiry } : { ...emptyLead });
        setMoveData({ projectName: '', intent: '', price: '', type: '' });
      }
    };
    const id = setTimeout(run, 0);
    return () => clearTimeout(id);
  }, [show, data, type, mode]);

  const update = (key, value) => setForm((p) => ({ ...p, [key]: value }));
  const updateMove = (key, value) => setMoveData((p) => ({ ...p, [key]: value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (type === 'enquiry') {
      const payload = { ...form };
      if (mode === 'edit' && data?.id) payload.id = data.id;
      onSave?.(mode === 'edit' ? data?.id : null, payload);
    } else {
      const payload = { ...form, price: parsePrice(form.price) };
      if (mode === 'edit' && data?.id) payload.id = data.id;
      onSave?.(mode === 'edit' ? data?.id : null, payload);
    }
  };

  const handleMoveToLeads = () => {
    const enquiryName = [form.first_name, form.last_name].filter(Boolean).join(' ') || form.email || 'Lead';
    onMoveToLeads?.(data?.id, {
      enquiryName,
      moveData: { ...moveData, price: parsePrice(moveData.price) },
      formDataSnapshot: { ...form },
    });
  };

  if (!show) return null;

  const isEnquiry = type === 'enquiry';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50/50">
          <h2 className="text-lg font-display font-semibold text-secondary">
            {mode === 'create' ? (isEnquiry ? 'New Enquiry' : 'New Lead') : (isEnquiry ? 'Edit Enquiry' : 'Edit Lead')}
          </h2>
          <button type="button" onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 text-gray-600">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            {isEnquiry ? (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">First name</label>
                    <input type="text" value={form.first_name} onChange={(e) => update('first_name', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Last name</label>
                    <input type="text" value={form.last_name} onChange={(e) => update('last_name', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <input type="email" value={form.email} onChange={(e) => update('email', e.target.value)} required className="w-full border border-gray-300 rounded-lg px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                  <input type="text" value={form.phone} onChange={(e) => update('phone', e.target.value)} required className="w-full border border-gray-300 rounded-lg px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subject *</label>
                  <input type="text" value={form.subject} onChange={(e) => update('subject', e.target.value)} required className="w-full border border-gray-300 rounded-lg px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Message *</label>
                  <textarea value={form.message} onChange={(e) => update('message', e.target.value)} required rows={3} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Event</label>
                  <input type="text" value={form.event} onChange={(e) => update('event', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select value={form.status} onChange={(e) => update('status', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2">
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                  <input type="text" value={form.name} onChange={(e) => update('name', e.target.value)} required className="w-full border border-gray-300 rounded-lg px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                  <input type="text" value={form.phone} onChange={(e) => update('phone', e.target.value)} required className="w-full border border-gray-300 rounded-lg px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input type="email" value={form.email} onChange={(e) => update('email', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select value={form.status} onChange={(e) => update('status', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2">
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sales stage</label>
                    <select value={form.sales_stage} onChange={(e) => update('sales_stage', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2">
                      {salesStages.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Project name</label>
                  <input type="text" value={form.project_name} onChange={(e) => update('project_name', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Price (e.g. 1.5M, 500K)</label>
                    <input type="text" value={form.price} onChange={(e) => update('price', e.target.value)} placeholder="1.5M" className="w-full border border-gray-300 rounded-lg px-3 py-2" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                    <input type="text" value={form.type} onChange={(e) => update('type', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Intent</label>
                  <input type="text" value={form.intent} onChange={(e) => update('intent', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Event</label>
                  <input type="text" value={form.event} onChange={(e) => update('event', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
                </div>
              </>
            )}

            {/* Common fields */}
            <div className="border-t pt-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Job title</label>
                  <input type="text" value={isEnquiry ? form.job_title : form.job_title} onChange={(e) => update('job_title', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Employer</label>
                  <input type="text" value={isEnquiry ? form.employer : form.employer} onChange={(e) => update('employer', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Property interests</label>
                <input type="text" value={isEnquiry ? form.property_interests : form.property_interests} onChange={(e) => update('property_interests', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
              </div>
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nationality</label>
                  <input type="text" value={isEnquiry ? form.nationality : form.nationality} onChange={(e) => update('nationality', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date of birth</label>
                  <input type="date" value={isEnquiry ? form.date_of_birth : form.date_of_birth} onChange={(e) => update('date_of_birth', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Home address</label>
                <input type="text" value={isEnquiry ? form.home_address : form.home_address} onChange={(e) => update('home_address', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea value={isEnquiry ? form.notes : form.notes} onChange={(e) => update('notes', e.target.value)} rows={2} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Client folder link</label>
                <input type="text" value={isEnquiry ? form.client_folder_link : form.client_folder_link} onChange={(e) => update('client_folder_link', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
              </div>
            </div>

            {isEnquiry && mode === 'edit' && (
              <div className="border-t pt-4 mt-4">
                <button
                  type="button"
                  onClick={() => setConversionOpen(!conversionOpen)}
                  className="flex items-center gap-2 text-primary font-semibold"
                >
                  {conversionOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  Lead conversion
                </button>
                {conversionOpen && (
                  <div className="mt-3 p-4 bg-primary/5 border border-primary/20 rounded-xl space-y-3">
                    <input type="text" placeholder="Project name" value={moveData.projectName} onChange={(e) => updateMove('projectName', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
                    <input type="text" placeholder="Intent" value={moveData.intent} onChange={(e) => updateMove('intent', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
                    <input type="text" placeholder="Budget (e.g. 1.5M)" value={moveData.price} onChange={(e) => updateMove('price', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
                    <input type="text" placeholder="Unit type" value={moveData.type} onChange={(e) => updateMove('type', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
                    <button
                      type="button"
                      onClick={handleMoveToLeads}
                      disabled={loading}
                      className="w-full bg-secondary text-white py-2.5 rounded-xl font-semibold hover:bg-secondary/90 disabled:opacity-50 transition-colors"
                    >
                      Move to Lead
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
            <div>
              {mode === 'edit' && (
                <button
                  type="button"
                  onClick={() => onDelete?.(data?.id)}
                  disabled={loading}
                  className="flex items-center gap-2 text-red-600 hover:text-red-700 font-medium"
                >
                  <Trash2 size={18} /> Delete
                </button>
              )}
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-200 rounded-xl hover:bg-gray-100 font-medium transition-colors">
                Cancel
              </button>
              <button type="submit" disabled={loading} className="px-5 py-2 bg-secondary text-white rounded-xl hover:bg-secondary/90 disabled:opacity-50 font-semibold transition-colors">
                {loading ? 'Saving...' : (mode === 'create' ? 'Create' : 'Save')}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

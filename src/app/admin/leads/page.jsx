'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import { useAuth } from '@/context/AuthContext';
import ManageDataModal from '@/components/admin/ManageDataModal';
import SuccessPopup from '@/components/admin/SuccessPopup';

const SALES_STAGES = [
  'New Inquiry', 'Contacted', 'Requirements Captured', 'Qualified Lead',
  'Property Shared', 'Shortlisted', 'Site Visit Scheduled', 'Site Visit Done',
  'Negotiation', 'Offer Made', 'Offer Accepted', 'Booking / Reservation',
  'SPA Issued', 'SPA Signed', 'Mortgage Approved',
  'Oqood Registered / Title Deed Issued', 'Deal Closed – Won', 'Deal Lost',
  'Post-Sale Follow-up',
];

function getToken() {
  return Cookies.get('admin_token');
}

export default function AdminLeadsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [leads, setLeads] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 10, total: 0, totalPages: 0 });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalShow, setModalShow] = useState(false);
  const [modalData, setModalData] = useState(null);
  const [modalMode, setModalMode] = useState('edit');
  const [saveLoading, setSaveLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);

  useEffect(() => {
    if (!authLoading && !user) router.replace('/admin/login');
  }, [user, authLoading, router]);

  const fetchLeads = async () => {
    const token = getToken();
    if (!token) return;
    setLoading(true);
    const params = new URLSearchParams({ page: pagination.page, pageSize: pagination.pageSize });
    if (statusFilter) params.set('status', statusFilter);
    if (search) params.set('search', search);
    const res = await fetch(`/api/admin/leads?${params}`, { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) {
      const data = await res.json();
      setLeads(data.leads || []);
      setPagination(data.pagination || pagination);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!user) return;
    fetchLeads();
  }, [user, pagination.page, statusFilter, search]);

  const openEdit = (lead) => {
    setModalData(lead);
    setModalMode('edit');
    setModalShow(true);
  };

  const handleSave = async (id, formData) => {
    const token = getToken();
    if (!token) return;
    setSaveLoading(true);
    try {
      await fetch('/api/admin/leads', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id, ...formData }),
      });
      setSuccessMsg('Lead updated');
      setModalShow(false);
      setModalData(null);
      await fetchLeads();
    } catch (e) {
      console.error(e);
    } finally {
      setSaveLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this lead?')) return;
    const token = getToken();
    if (!token) return;
    await fetch(`/api/admin/leads?id=${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    setSuccessMsg('Lead deleted');
    setModalShow(false);
    setModalData(null);
    await fetchLeads();
  };

  useEffect(() => {
    if (successMsg) {
      const t = setTimeout(() => setSuccessMsg(null), 3000);
      return () => clearTimeout(t);
    }
  }, [successMsg]);

  if (authLoading || !user) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-secondary">Leads</h1>
        <p className="text-gray-500 text-sm mt-1">Track and manage your sales pipeline</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex flex-wrap items-center gap-4">
          <input
            type="text"
            placeholder="Search leads..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border border-gray-200 rounded-xl px-4 py-2.5 w-52 focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
          />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors">
            <option value="">All statuses</option>
            <option value="HOT">HOT</option>
            <option value="WARM">WARM</option>
            <option value="COLD">COLD</option>
            <option value="LOST">LOST</option>
          </select>
        </div>
        {loading ? (
          <div className="p-12 text-center text-gray-500 flex items-center justify-center gap-2">
            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            Loading...
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50/80">
                  <tr>
                    <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Phone</th>
                    <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Stage</th>
                    <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Project</th>
                    <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {leads.map((lead) => (
                    <tr key={lead.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-3.5 text-sm font-medium text-secondary">{lead.name}</td>
                      <td className="px-6 py-3.5 text-sm text-gray-600">{lead.email || '—'}</td>
                      <td className="px-6 py-3.5 text-sm text-gray-600">{lead.phone || '—'}</td>
                      <td className="px-6 py-3.5"><span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${lead.status === 'HOT' ? 'bg-red-100 text-red-800' : lead.status === 'WARM' ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-700'}`}>{lead.status}</span></td>
                      <td className="px-6 py-3.5 text-sm text-gray-600">{lead.sales_stage || '—'}</td>
                      <td className="px-6 py-3.5 text-sm text-gray-600">{lead.project_name || '—'}</td>
                      <td className="px-6 py-3.5">
                        <button type="button" onClick={() => openEdit(lead)} className="text-primary hover:text-primary/80 font-semibold text-sm">Edit</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {pagination.totalPages > 1 && (
              <div className="px-6 py-3.5 border-t border-gray-100 flex items-center justify-between bg-gray-50/30">
                <p className="text-sm text-gray-500">Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)</p>
                <div className="flex gap-2">
                  <button type="button" disabled={pagination.page <= 1} onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))} className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50 disabled:opacity-50 transition-colors">Previous</button>
                  <button type="button" disabled={pagination.page >= pagination.totalPages} onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))} className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50 disabled:opacity-50 transition-colors">Next</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <ManageDataModal
        show={modalShow}
        data={modalData}
        type="lead"
        mode={modalMode}
        onClose={() => { setModalShow(false); setModalData(null); }}
        onSave={handleSave}
        onDelete={handleDelete}
        loading={saveLoading}
        salesStages={SALES_STAGES}
      />
      {successMsg && <SuccessPopup message={successMsg} onClose={() => setSuccessMsg(null)} />}
    </div>
  );
}

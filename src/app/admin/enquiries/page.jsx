'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Cookies from 'js-cookie';
import { Search, Plus, Pencil, Trash2, UserPlus, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import ManageDataModal from '@/components/admin/ManageDataModal';
import SuccessPopup from '@/components/admin/SuccessPopup';
import { SALES_STAGES } from '@/components/admin/SALES_STAGES';

function parsePrice(val) {
  if (val == null || val === '') return null;
  const s = String(val).trim().toUpperCase().replace(/,/g, '');
  const num = parseFloat(s.replace(/[KM]$/, ''));
  if (Number.isNaN(num)) return null;
  if (s.endsWith('M')) return num * 1_000_000;
  if (s.endsWith('K')) return num * 1_000;
  return num;
}

export default function AdminEnquiriesPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [enquiries, setEnquiries] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 10, total: 0, totalPages: 0 });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalData, setModalData] = useState(null);
  const [modalMode, setModalMode] = useState('create');
  const [modalOpen, setModalOpen] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);

  useEffect(() => {
    if (!authLoading && !user) router.replace('/admin/login');
  }, [user, authLoading, router]);

  const fetchEnquiries = useCallback(async (page = 1) => {
    if (!user) return;
    const token = Cookies.get('admin_token');
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: '10' });
      if (search) params.set('search', search);
      if (statusFilter) params.set('status', statusFilter);
      const res = await fetch(`/api/admin/enquiries?${params}`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const d = await res.json();
        setEnquiries(d.enquiries || []);
        setPagination(d.pagination || { page: 1, pageSize: 10, total: 0, totalPages: 0 });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [user, search, statusFilter]);

  useEffect(() => {
    if (!user) return;
    fetchEnquiries(pagination.page);
  }, [user, pagination.page, fetchEnquiries]);

  const handleSearch = (e) => {
    e?.preventDefault();
    fetchEnquiries(1);
  };

  const handleSave = async (id, payload) => {
    const token = Cookies.get('admin_token');
    setSaveLoading(true);
    try {
      if (id) {
        const res = await fetch('/api/admin/enquiries', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ id, ...payload }),
        });
        if (!res.ok) throw new Error('Update failed');
        setSuccessMsg('Enquiry updated');
      } else {
        const res = await fetch('/api/admin/enquiries', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error('Create failed');
        setSuccessMsg('Enquiry created');
      }
      setModalOpen(false);
      setModalData(null);
      fetchEnquiries(pagination.page);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (e) {
      console.error(e);
    } finally {
      setSaveLoading(false);
    }
  };

  const handleDelete = async (id) => {
    const token = Cookies.get('admin_token');
    try {
      const res = await fetch('/api/admin/enquiries', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error('Delete failed');
      setSuccessMsg('Enquiry deleted');
      setModalOpen(false);
      setModalData(null);
      fetchEnquiries(pagination.page);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (e) {
      console.error(e);
    }
  };

  const handleMoveToLeads = async (enquiryId, { enquiryName, moveData, formDataSnapshot }) => {
    const token = Cookies.get('admin_token');
    setSaveLoading(true);
    try {
      const leadData = {
        name: enquiryName,
        email: formDataSnapshot.email,
        phone: formDataSnapshot.phone,
        projectName: moveData?.projectName ?? '',
        price: parsePrice(moveData?.budget),
        type: moveData?.unitType ?? '',
        intent: moveData?.intent ?? '',
        status: 'HOT',
        salesStage: 'New Inquiry',
        job_title: formDataSnapshot.job_title,
        employer: formDataSnapshot.employer,
        property_interests: formDataSnapshot.property_interests,
        notes: formDataSnapshot.notes,
        client_folder_link: formDataSnapshot.client_folder_link,
        nationality: formDataSnapshot.nationality,
        date_of_birth: formDataSnapshot.date_of_birth || null,
        home_address: formDataSnapshot.home_address,
        event: formDataSnapshot.event,
      };
      const res = await fetch('/api/admin/move-to-leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ sourceId: enquiryId, sourceType: 'enquiry', leadData }),
      });
      if (!res.ok) throw new Error('Move failed');
      setSuccessMsg('Converted to lead');
      setModalOpen(false);
      setModalData(null);
      fetchEnquiries(pagination.page);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (e) {
      console.error(e);
    } finally {
      setSaveLoading(false);
    }
  };

  if (authLoading || !user) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold text-secondary">Enquiries</h1>
          <p className="text-gray-500 mt-1">Manage and convert enquiries to leads</p>
        </div>
        <button
          type="button"
          onClick={() => { setModalData(null); setModalMode('create'); setModalOpen(true); }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl font-medium hover:opacity-90"
        >
          <Plus className="w-4 h-4" /> Add enquiry
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <form onSubmit={handleSearch} className="flex-1 flex gap-2">
          <span className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search enquiries..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary"
            />
          </span>
          <button type="submit" className="px-4 py-3 bg-gray-800 text-white rounded-xl font-medium hover:bg-gray-700">
            Search
          </button>
        </form>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); fetchEnquiries(1); }}
          className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary"
        >
          <option value="">All statuses</option>
          <option value="HOT">HOT</option>
          <option value="WARM">WARM</option>
          <option value="COLD">COLD</option>
        </select>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 text-left text-sm text-gray-600">
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium hidden sm:table-cell">Email / Phone</th>
                <th className="px-4 py-3 font-medium">Subject</th>
                <th className="px-4 py-3 font-medium hidden md:table-cell">Status</th>
                <th className="px-4 py-3 font-medium w-32">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr><td colSpan={5} className="px-4 py-12 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" /></td></tr>
              ) : (
                (enquiries || []).map((enq) => (
                  <tr key={enq.id} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3 font-medium text-secondary">
                      {[enq.first_name, enq.last_name].filter(Boolean).join(' ') || enq.email || '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-600 hidden sm:table-cell">
                      <span className="block truncate max-w-[180px]">{enq.email}</span>
                      <span className="text-xs text-gray-400">{enq.phone}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 truncate max-w-[140px]">{enq.subject || '—'}</td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                        enq.status === 'HOT' ? 'bg-red-100 text-red-700' :
                        enq.status === 'WARM' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'
                      }`}>{enq.status || '—'}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => { setModalData(enq); setModalMode('edit'); setModalOpen(true); }}
                          className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => { setModalData(enq); setModalMode('edit'); setModalOpen(true); }}
                          className="p-2 rounded-lg hover:bg-primary/10 text-primary"
                          title="Convert to lead"
                        >
                          <UserPlus className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => window.confirm('Delete this enquiry?') && handleDelete(enq.id)}
                          className="p-2 rounded-lg hover:bg-red-50 text-red-600"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {!loading && pagination.totalPages > 1 && (
          <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={pagination.page <= 1}
                onClick={() => fetchEnquiries(pagination.page - 1)}
                className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 hover:bg-gray-50"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => fetchEnquiries(pagination.page + 1)}
                className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 hover:bg-gray-50"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      <ManageDataModal
        key={modalOpen ? `enquiry-${modalData?.id ?? 'new'}` : 'closed'}
        show={modalOpen}
        data={modalData}
        type="enquiry"
        mode={modalMode}
        onClose={() => { setModalOpen(false); setModalData(null); }}
        onSave={handleSave}
        onDelete={handleDelete}
        onMoveToLeads={handleMoveToLeads}
        loading={saveLoading}
        salesStages={SALES_STAGES}
      />
      {successMsg && <SuccessPopup message={successMsg} onClose={() => setSuccessMsg(null)} />}
    </div>
  );
}

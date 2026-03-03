'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Cookies from 'js-cookie';
import { Search, Plus, Pencil, Trash2, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import ManageDataModal from '@/components/admin/ManageDataModal';
import SuccessPopup from '@/components/admin/SuccessPopup';
import { SALES_STAGES } from '@/components/admin/SALES_STAGES';

export default function AdminLeadsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [leads, setLeads] = useState([]);
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

  const fetchLeads = useCallback(async (page = 1) => {
    if (!user) return;
    const token = Cookies.get('admin_token');
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: '10' });
      if (search) params.set('search', search);
      if (statusFilter) params.set('status', statusFilter);
      const res = await fetch(`/api/admin/leads?${params}`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const d = await res.json();
        setLeads(d.leads || []);
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
    fetchLeads(pagination.page);
  }, [user, pagination.page, fetchLeads]);

  const handleSearch = (e) => {
    e?.preventDefault();
    fetchLeads(1);
  };

  const handleSave = async (id, payload) => {
    const token = Cookies.get('admin_token');
    setSaveLoading(true);
    try {
      if (id) {
        const res = await fetch('/api/admin/leads', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ id, ...payload }),
        });
        if (!res.ok) throw new Error('Update failed');
        setSuccessMsg('Lead updated');
      } else {
        const res = await fetch('/api/admin/leads', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error('Create failed');
        setSuccessMsg('Lead created');
      }
      setModalOpen(false);
      setModalData(null);
      fetchLeads(pagination.page);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (e) {
      console.error(e);
      setSuccessMsg('Failed to save');
      setTimeout(() => setSuccessMsg(null), 3000);
    } finally {
      setSaveLoading(false);
    }
  };

  const handleCreate = () => {
    setModalData(null);
    setModalMode('create');
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    const token = Cookies.get('admin_token');
    try {
      const res = await fetch(`/api/admin/leads?id=${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Delete failed');
      setSuccessMsg('Lead deleted');
      setModalOpen(false);
      setModalData(null);
      fetchLeads(pagination.page);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (e) {
      console.error(e);
    }
  };

  if (authLoading || !user) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold text-secondary">Leads</h1>
          <p className="text-gray-500 mt-1">Manage leads and pipeline</p>
        </div>
        <button
          type="button"
          onClick={handleCreate}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl font-medium hover:opacity-90"
        >
          <Plus className="w-4 h-4" /> Add lead
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <form onSubmit={handleSearch} className="flex-1 flex gap-2">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search leads..."
            className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary"
          />
          <button type="submit" className="px-4 py-3 bg-gray-800 text-white rounded-xl font-medium hover:bg-gray-700">
            Search
          </button>
        </form>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); fetchLeads(1); }}
          className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary"
        >
          <option value="">All statuses</option>
          <option value="HOT">HOT</option>
          <option value="WARM">WARM</option>
          <option value="COLD">COLD</option>
          <option value="LOST">LOST</option>
        </select>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 text-left text-sm text-gray-600">
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium hidden sm:table-cell">Contact</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium hidden md:table-cell">Stage</th>
                <th className="px-4 py-3 font-medium hidden lg:table-cell">Project</th>
                <th className="px-4 py-3 font-medium w-24">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr><td colSpan={6} className="px-4 py-12 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" /></td></tr>
              ) : (
                (leads || []).map((lead) => (
                  <tr key={lead.id} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3 font-medium text-secondary">{lead.name || '—'}</td>
                    <td className="px-4 py-3 text-gray-600 hidden sm:table-cell">
                      <span className="block truncate max-w-[160px]">{lead.email}</span>
                      <span className="text-xs text-gray-400">{lead.phone}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                        lead.status === 'HOT' ? 'bg-red-100 text-red-700' :
                        lead.status === 'WARM' ? 'bg-amber-100 text-amber-700' :
                        lead.status === 'LOST' ? 'bg-gray-200 text-gray-700' : 'bg-gray-100 text-gray-600'
                      }`}>{lead.status || '—'}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 hidden md:table-cell truncate max-w-[160px]">{lead.sales_stage || '—'}</td>
                    <td className="px-4 py-3 text-gray-600 hidden lg:table-cell truncate max-w-[140px]">{lead.project_name || '—'}</td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => { setModalData(lead); setModalMode('edit'); setModalOpen(true); }}
                        className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"
                        title="Edit"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => window.confirm('Delete this lead?') && handleDelete(lead.id)}
                        className="p-2 rounded-lg hover:bg-red-50 text-red-600 ml-1"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
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
                onClick={() => fetchLeads(pagination.page - 1)}
                className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 hover:bg-gray-50"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => fetchLeads(pagination.page + 1)}
                className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 hover:bg-gray-50"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      <ManageDataModal
        key={modalOpen ? `lead-${modalMode === 'create' ? 'new' : modalData?.id}` : 'closed'}
        show={modalOpen}
        data={modalMode === 'create' ? null : modalData}
        type="lead"
        mode={modalMode}
        onClose={() => { setModalOpen(false); setModalData(null); }}
        onSave={handleSave}
        onDelete={handleDelete}
        loading={saveLoading}
        salesStages={SALES_STAGES}
      />
      {successMsg && <SuccessPopup message={successMsg} onClose={() => setSuccessMsg(null)} />}
    </div>
  );
}

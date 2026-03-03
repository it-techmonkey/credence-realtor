'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import { useAuth } from '@/context/AuthContext';
import { TrendingUp, Users, Mail, Percent } from 'lucide-react';
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

export default function AdminDashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentLeads, setRecentLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [leads, setLeads] = useState([]);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 10, total: 0, totalPages: 0 });
  const [modalShow, setModalShow] = useState(false);
  const [modalData, setModalData] = useState(null);
  const [saveLoading, setSaveLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);

  useEffect(() => {
    if (!authLoading && !user) router.replace('/admin/login');
  }, [user, authLoading, router]);

  const fetchStats = async () => {
    const token = getToken();
    if (!token) return;
    const res = await fetch('/api/admin/stats', { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) {
      const data = await res.json();
      setStats(data.stats);
      setRecentLeads(data.recentLeads || []);
    }
  };

  const fetchLeads = async () => {
    const token = getToken();
    if (!token) return;
    const params = new URLSearchParams({ page, pageSize: 10 });
    if (statusFilter) params.set('status', statusFilter);
    if (search) params.set('search', search);
    const res = await fetch(`/api/admin/leads?${params}`, { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) {
      const data = await res.json();
      setLeads(data.leads || []);
      setPagination(data.pagination || { page: 1, pageSize: 10, total: 0, totalPages: 0 });
    }
  };

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      await fetchStats();
      setLoading(false);
    })();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    fetchLeads();
  }, [user, statusFilter, search, page]);

  const openEdit = (lead) => {
    setModalData(lead);
    setModalShow(true);
  };

  const handleSave = async (id, formData) => {
    const token = getToken();
    if (!token) return;
    setSaveLoading(true);
    try {
      if (id) {
        await fetch('/api/admin/leads', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ id, ...formData }),
        });
        setSuccessMsg('Lead updated');
      }
      setModalShow(false);
      setModalData(null);
      await fetchStats();
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
    await fetchStats();
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
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-display font-bold text-secondary">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Overview of leads and enquiries</p>
      </div>

      {loading ? (
        <div className="flex items-center gap-3 text-gray-500">
          <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span>Loading stats...</span>
        </div>
      ) : stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 hover:border-primary/20 transition-colors">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center">
                <Users className="text-primary" size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Total leads</p>
                <p className="text-2xl font-display font-bold text-secondary">{stats.total}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 hover:border-primary/20 transition-colors">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center">
                <TrendingUp className="text-red-600" size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Hot</p>
                <p className="text-2xl font-display font-bold text-secondary">{stats.hot}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 hover:border-primary/20 transition-colors">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Mail className="text-primary" size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Enquiries</p>
                <p className="text-2xl font-display font-bold text-secondary">{stats.enquiries}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 hover:border-primary/20 transition-colors">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center">
                <Percent className="text-primary" size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Conversion rate</p>
                <p className="text-2xl font-display font-bold text-secondary">{stats.conversionRate}%</p>
              </div>
            </div>
          </div>
        </div>
      )}

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
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50/80">
              <tr>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Stage</th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {leads.map((lead) => (
                <tr key={lead.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-3.5 text-sm font-medium text-secondary">{lead.name}</td>
                  <td className="px-6 py-3.5 text-sm text-gray-600">{lead.email || '—'}</td>
                  <td className="px-6 py-3.5"><span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${lead.status === 'HOT' ? 'bg-red-100 text-red-800' : lead.status === 'WARM' ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-700'}`}>{lead.status}</span></td>
                  <td className="px-6 py-3.5 text-sm text-gray-600">{lead.sales_stage || '—'}</td>
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
            <p className="text-sm text-gray-500">Page {page} of {pagination.totalPages}</p>
            <div className="flex gap-2">
              <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50 disabled:opacity-50 transition-colors">Previous</button>
              <button type="button" disabled={page >= pagination.totalPages} onClick={() => setPage((p) => p + 1)} className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50 disabled:opacity-50 transition-colors">Next</button>
            </div>
          </div>
        )}
      </div>

      <ManageDataModal
        show={modalShow}
        data={modalData}
        type="lead"
        mode={modalData ? 'edit' : 'create'}
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

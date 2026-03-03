'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Cookies from 'js-cookie';
import Link from 'next/link';
import { Users, MessageSquare, TrendingUp, TrendingDown, ArrowRight, Loader2 } from 'lucide-react';
import ManageDataModal from '@/components/admin/ManageDataModal';
import SuccessPopup from '@/components/admin/SuccessPopup';
import { SALES_STAGES } from '@/components/admin/SALES_STAGES';

export default function AdminDashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState(null);
  const [recentLeads, setRecentLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalLead, setModalLead] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);

  useEffect(() => {
    if (!authLoading && !user) router.replace('/admin/login');
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;
    const token = Cookies.get('admin_token');
    const fetchData = async () => {
      setLoading(true);
      try {
        const [statsRes, leadsRes] = await Promise.all([
          fetch('/api/admin/stats', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('/api/admin/leads?pageSize=10', { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        if (statsRes.ok) {
          const d = await statsRes.json();
          setStats(d.stats);
          setRecentLeads(d.recentLeads || []);
        }
        if (leadsRes.ok && !statsRes.ok) {
          const d = await leadsRes.json();
          setRecentLeads(d.leads || []);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const handleSaveLead = async (id, payload) => {
    const token = Cookies.get('admin_token');
    setSaveLoading(true);
    try {
      const res = await fetch('/api/admin/leads', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id, ...payload }),
      });
      if (!res.ok) throw new Error('Failed to update');
      setSuccessMsg('Lead updated');
      setModalOpen(false);
      setModalLead(null);
      const [statsRes, leadsRes] = await Promise.all([
        fetch('/api/admin/stats', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/admin/leads?pageSize=10', { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      if (statsRes.ok) {
        const d = await statsRes.json();
        setStats(d.stats);
        setRecentLeads(d.recentLeads || []);
      }
      if (leadsRes.ok) {
        const d = await leadsRes.json();
        setRecentLeads(d.leads || []);
      }
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (e) {
      console.error(e);
    } finally {
      setSaveLoading(false);
    }
  };

  if (authLoading || !user) return null;

  const cards = [
    { label: 'Total leads', value: stats?.total ?? '—', icon: Users, color: 'bg-primary/10 text-primary' },
    { label: 'Hot', value: stats?.hot ?? '—', icon: TrendingUp, color: 'bg-red-100 text-red-700' },
    { label: 'Warm', value: stats?.warm ?? '—', icon: MessageSquare, color: 'bg-amber-100 text-amber-700' },
    { label: 'Enquiries', value: stats?.enquiries ?? '—', icon: MessageSquare, color: 'bg-blue-100 text-blue-700' },
    { label: 'Conversion %', value: stats != null ? `${stats.conversionRate}%` : '—', icon: TrendingUp, color: 'bg-emerald-100 text-emerald-700' },
    { label: 'Lost %', value: stats != null ? `${stats.lostRate}%` : '—', icon: TrendingDown, color: 'bg-gray-100 text-gray-700' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-display font-bold text-secondary">Dashboard</h1>
        <p className="text-gray-500 mt-1">Overview of leads and enquiries</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {cards.map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                <div className={`inline-flex p-2 rounded-lg ${color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <p className="text-2xl font-bold text-secondary mt-2">{value}</p>
                <p className="text-sm text-gray-500">{label}</p>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between flex-wrap gap-2">
              <h2 className="text-lg font-semibold text-secondary">Recent leads</h2>
              <Link href="/admin/leads" className="text-sm font-medium text-primary hover:underline flex items-center gap-1">
                View all <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 text-left text-sm text-gray-600">
                    <th className="px-6 py-3 font-medium">Name</th>
                    <th className="px-6 py-3 font-medium hidden sm:table-cell">Email</th>
                    <th className="px-6 py-3 font-medium">Status</th>
                    <th className="px-6 py-3 font-medium hidden md:table-cell">Stage</th>
                    <th className="px-6 py-3 font-medium w-24">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {(recentLeads.length ? recentLeads : []).map((lead) => (
                    <tr key={lead.id} className="hover:bg-gray-50/50">
                      <td className="px-6 py-3 font-medium text-secondary">{lead.name || '—'}</td>
                      <td className="px-6 py-3 text-gray-600 hidden sm:table-cell truncate max-w-[180px]">{lead.email || '—'}</td>
                      <td className="px-6 py-3">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                          lead.status === 'HOT' ? 'bg-red-100 text-red-700' :
                          lead.status === 'WARM' ? 'bg-amber-100 text-amber-700' :
                          lead.status === 'LOST' ? 'bg-gray-200 text-gray-700' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {lead.status || '—'}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-gray-600 hidden md:table-cell truncate max-w-[160px]">{lead.sales_stage || '—'}</td>
                      <td className="px-6 py-3">
                        <button
                          type="button"
                          onClick={() => { setModalLead(lead); setModalOpen(true); }}
                          className="text-primary text-sm font-medium hover:underline"
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!loading && !recentLeads.length && (
                <p className="px-6 py-8 text-center text-gray-500">No leads yet</p>
              )}
            </div>
          </div>
        </>
      )}

      <ManageDataModal
        key={modalOpen ? `lead-${modalLead?.id ?? 'new'}` : 'closed'}
        show={modalOpen}
        data={modalLead}
        type="lead"
        mode="edit"
        onClose={() => { setModalOpen(false); setModalLead(null); }}
        onSave={handleSaveLead}
        loading={saveLoading}
        salesStages={SALES_STAGES}
      />
      {successMsg && <SuccessPopup message={successMsg} onClose={() => setSuccessMsg(null)} />}
    </div>
  );
}

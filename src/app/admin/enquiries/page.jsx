'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import { useAuth } from '@/context/AuthContext';
import ManageDataModal from '@/components/admin/ManageDataModal';
import SuccessPopup from '@/components/admin/SuccessPopup';

function getToken() {
  return Cookies.get('admin_token');
}

export default function AdminEnquiriesPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [enquiries, setEnquiries] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 10, total: 0, totalPages: 0 });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalShow, setModalShow] = useState(false);
  const [modalData, setModalData] = useState(null);
  const [modalMode, setModalMode] = useState('create');
  const [saveLoading, setSaveLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);

  useEffect(() => {
    if (!authLoading && !user) router.replace('/admin/login');
  }, [user, authLoading, router]);

  const fetchEnquiries = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    setLoading(true);
    const params = new URLSearchParams({ page: pagination.page, pageSize: pagination.pageSize });
    if (statusFilter) params.set('status', statusFilter);
    if (search) params.set('search', search);
    const res = await fetch(`/api/admin/enquiries?${params}`, { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) {
      const data = await res.json();
      setEnquiries(data.enquiries || []);
      setPagination((prev) => data.pagination || prev);
    }
    setLoading(false);
  }, [pagination.page, pagination.pageSize, statusFilter, search]);

  useEffect(() => {
    if (!user) return;
    fetchEnquiries();
  }, [user, fetchEnquiries]);

  const openCreate = () => {
    setModalData(null);
    setModalMode('create');
    setModalShow(true);
  };

  const openEdit = (enq) => {
    setModalData(enq);
    setModalMode('edit');
    setModalShow(true);
  };

  const handleSave = async (id, formData) => {
    const token = getToken();
    if (!token) return;
    setSaveLoading(true);
    try {
      if (id) {
        await fetch('/api/admin/enquiries', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ id, ...formData }),
        });
        setSuccessMsg('Enquiry updated');
      } else {
        await fetch('/api/admin/enquiries', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(formData),
        });
        setSuccessMsg('Enquiry created');
      }
      setModalShow(false);
      setModalData(null);
      await fetchEnquiries();
    } catch (e) {
      console.error(e);
    } finally {
      setSaveLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this enquiry?')) return;
    const token = getToken();
    if (!token) return;
    await fetch('/api/admin/enquiries', { method: 'DELETE', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ id }) });
    setSuccessMsg('Enquiry deleted');
    setModalShow(false);
    setModalData(null);
    await fetchEnquiries();
  };

  const handleMoveToLeads = async (enquiryId, { enquiryName, moveData, formDataSnapshot }) => {
    const token = getToken();
    if (!token) return;
    setSaveLoading(true);
    try {
      const leadData = {
        name: enquiryName,
        email: formDataSnapshot.email,
        phone: formDataSnapshot.phone,
        projectName: moveData.projectName,
        intent: moveData.intent,
        price: moveData.price,
        type: moveData.type,
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
      await fetch('/api/admin/move-to-leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ sourceId: enquiryId, sourceType: 'enquiry', leadData }),
      });
      setSuccessMsg('Moved to leads');
      setModalShow(false);
      setModalData(null);
      await fetchEnquiries();
    } catch (e) {
      console.error(e);
    } finally {
      setSaveLoading(false);
    }
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-secondary">Enquiries</h1>
          <p className="text-gray-500 text-sm mt-1">Manage and convert enquiries to leads</p>
        </div>
        <button type="button" onClick={openCreate} className="bg-secondary text-white px-5 py-2.5 rounded-full font-semibold hover:bg-secondary/90 focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-all">
          Add enquiry
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex flex-wrap items-center gap-4">
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border border-gray-200 rounded-xl px-4 py-2.5 w-52 focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
          />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors">
            <option value="">All statuses</option>
            <option value="HOT">HOT</option>
            <option value="WARM">WARM</option>
            <option value="COLD">COLD</option>
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
                    <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Subject</th>
                    <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {enquiries.map((enq) => (
                    <tr key={enq.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-3.5 text-sm font-medium text-secondary">{[enq.first_name, enq.last_name].filter(Boolean).join(' ') || '—'}</td>
                      <td className="px-6 py-3.5 text-sm text-gray-600">{enq.email}</td>
                      <td className="px-6 py-3.5 text-sm text-gray-600">{enq.subject || '—'}</td>
                      <td className="px-6 py-3.5"><span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${enq.status === 'HOT' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-700'}`}>{enq.status || '—'}</span></td>
                      <td className="px-6 py-3.5 text-sm text-gray-500">{enq.created_at ? new Date(enq.created_at).toLocaleDateString() : '—'}</td>
                      <td className="px-6 py-3.5">
                        <button type="button" onClick={() => openEdit(enq)} className="text-primary hover:text-primary/80 font-semibold text-sm">Edit / Move to lead</button>
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
        type="enquiry"
        mode={modalMode}
        onClose={() => { setModalShow(false); setModalData(null); }}
        onSave={handleSave}
        onDelete={handleDelete}
        onMoveToLeads={handleMoveToLeads}
        loading={saveLoading}
      />
      {successMsg && <SuccessPopup message={successMsg} onClose={() => setSuccessMsg(null)} />}
    </div>
  );
}

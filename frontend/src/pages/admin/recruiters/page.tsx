import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiService } from '../../../services/api';

interface Recruiter {
  id: number;
  email: string;
  full_name: string;
  phone?: string;
  company_name: string;
  company_website?: string;
  company_size?: string;
  industry?: string;
  designation?: string;
  is_email_verified: boolean;
  is_approved: boolean;
  status: string;
  created_at: string;
}

export default function AdminRecruiters() {
  const navigate = useNavigate();
  const [recruiters, setRecruiters] = useState<Recruiter[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('');
  const [rejectId, setRejectId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) { navigate('/admin/login'); return; }
    load();
  }, [filter]);

  const load = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('admin_token');
      const qs = filter ? `?status=${filter}` : '';
      const res = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:8000/api'}/admin/recruiters${qs}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) throw new Error('Failed to fetch');
      setRecruiters(await res.json());
    } catch { navigate('/admin/login'); }
    setLoading(false);
  };

  const approve = async (id: number) => {
    try {
      const token = localStorage.getItem('admin_token');
      const res = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:8000/api'}/admin/recruiters/${id}/approve`,
        { method: 'POST', headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) throw new Error('Failed');
      load();
    } catch (err: any) { alert(err.message); }
  };

  const reject = async () => {
    if (!rejectId) return;
    try {
      const token = localStorage.getItem('admin_token');
      const res = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:8000/api'}/admin/recruiters/${rejectId}/reject`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ reason: rejectReason }),
        }
      );
      if (!res.ok) throw new Error('Failed');
      setRejectId(null);
      setRejectReason('');
      load();
    } catch (err: any) { alert(err.message); }
  };

  const statusColors: Record<string, string> = {
    pending_verification: 'bg-gray-500/10 text-gray-400',
    pending_approval: 'bg-yellow-500/10 text-yellow-400',
    approved: 'bg-green-500/10 text-green-400',
    rejected: 'bg-red-500/10 text-red-400',
  };

  return (
    <div className="min-h-screen bg-gray-900">
      <nav className="border-b border-gray-800 bg-gray-900/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/admin/colleges" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center">
              <i className="ri-shield-keyhole-fill text-white text-sm" />
            </div>
            <span className="text-lg font-bold text-white">PickCV Admin</span>
          </Link>
          <div className="flex items-center gap-6">
            <Link to="/admin/colleges" className="text-gray-400 hover:text-white text-sm">Colleges</Link>
            <Link to="/admin/recruiters" className="text-white text-sm font-medium">Recruiters</Link>
            <Link to="/admin/payments" className="text-gray-400 hover:text-white text-sm">Payments</Link>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-white">Recruiter Accounts</h1>
          <span className="text-gray-400 text-sm">{recruiters.length} total</span>
        </div>

        <div className="flex gap-2 mb-6">
          {['', 'pending_approval', 'approved', 'rejected', 'pending_verification'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-4 py-2 text-sm rounded-lg transition-all ${filter === f
                ? 'bg-teal-500/20 text-teal-400 border border-teal-500/30'
                : 'bg-gray-800 text-gray-400 border border-gray-700 hover:text-white'}`}>
              {f ? f.replace('_', ' ') : 'All'}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-20"><i className="ri-loader-4-line animate-spin text-teal-400 text-2xl" /></div>
        ) : recruiters.length === 0 ? (
          <div className="text-center py-20 bg-gray-800/30 rounded-2xl border border-gray-700/50">
            <i className="ri-building-line text-gray-600 text-5xl mb-4" />
            <p className="text-gray-400">No recruiters found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recruiters.map(rec => (
              <div key={rec.id} className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-5 hover:border-gray-600 transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center">
                      <span className="text-blue-400 font-semibold">{rec.full_name[0].toUpperCase()}</span>
                    </div>
                    <div>
                      <p className="text-white font-medium">{rec.full_name}</p>
                      <p className="text-gray-400 text-sm">{rec.email}</p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                        <span><i className="ri-building-line mr-1" />{rec.company_name}</span>
                        {rec.industry && <span>{rec.industry}</span>}
                        {rec.company_size && <span>{rec.company_size} employees</span>}
                        {rec.designation && <span>{rec.designation}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 text-xs font-medium rounded-full ${statusColors[rec.status]}`}>
                      {rec.status.replace('_', ' ')}
                    </span>
                    {rec.status === 'pending_approval' && (
                      <>
                        <button onClick={() => approve(rec.id)}
                          className="px-4 py-2 text-sm bg-green-500/10 text-green-400 border border-green-500/20 rounded-lg hover:bg-green-500/20 transition-all">
                          <i className="ri-check-line mr-1" />Approve
                        </button>
                        <button onClick={() => setRejectId(rec.id)}
                          className="px-4 py-2 text-sm bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg hover:bg-red-500/20 transition-all">
                          <i className="ri-close-line mr-1" />Reject
                        </button>
                      </>
                    )}
                    <span className="text-gray-600 text-xs">
                      {new Date(rec.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                {rec.company_website && (
                  <div className="mt-2 ml-16">
                    <a href={rec.company_website} target="_blank" rel="noopener noreferrer" className="text-blue-400 text-xs hover:underline">
                      <i className="ri-external-link-line mr-1" />{rec.company_website}
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reject Modal */}
      {rejectId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-800 border border-gray-700 rounded-2xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-white mb-4">Reject Recruiter</h2>
            <div>
              <label className="block text-sm text-gray-300 mb-1">Reason</label>
              <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} rows={3}
                className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl text-white text-sm" placeholder="Reason for rejection..." />
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={() => { setRejectId(null); setRejectReason(''); }}
                className="flex-1 py-2.5 border border-gray-600 text-gray-300 rounded-xl">Cancel</button>
              <button onClick={reject}
                className="flex-1 py-2.5 bg-red-500 text-white rounded-xl hover:bg-red-600">Reject</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

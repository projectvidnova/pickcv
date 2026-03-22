import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { recruiterApi, InterviewerMember } from '../../../services/recruiterService';

export default function InterviewersPage() {
  const navigate = useNavigate();
  const [interviewers, setInterviewers] = useState<InterviewerMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [form, setForm] = useState({ email: '', full_name: '', designation: '', phone: '' });
  const [inviting, setInviting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!recruiterApi.isLoggedIn()) { navigate('/login'); return; }
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const data = await recruiterApi.listInterviewers();
      setInterviewers(data);
    } catch { navigate('/login'); }
    setLoading(false);
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email || !form.full_name) { setError('Email and name are required'); return; }
    setError('');
    setInviting(true);
    try {
      await recruiterApi.inviteInterviewer({
        email: form.email, full_name: form.full_name,
        designation: form.designation || undefined, phone: form.phone || undefined,
      });
      setShowInvite(false);
      setForm({ email: '', full_name: '', designation: '', phone: '' });
      load();
    } catch (err: any) { setError(err.message); }
    setInviting(false);
  };

  const handleRemove = async (id: number) => {
    if (!confirm('Remove this interviewer?')) return;
    try { await recruiterApi.removeInterviewer(id); load(); }
    catch (err: any) { alert(err.message); }
  };

  const statusColors: Record<string, string> = {
    invited: 'bg-blue-500/10 text-blue-400',
    accepted: 'bg-green-500/10 text-green-400',
    declined: 'bg-red-500/10 text-red-400',
  };

  return (
    <div className="min-h-screen bg-gray-900">
      <nav className="border-b border-gray-800 bg-gray-900/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
              <i className="ri-building-2-fill text-white text-sm" />
            </div>
            <span className="text-lg font-bold text-white">PickCV Recruiter</span>
          </Link>
          <div className="flex items-center gap-6">
            <Link to="/dashboard" className="text-gray-400 hover:text-white text-sm">Dashboard</Link>
            <Link to="/jobs" className="text-gray-400 hover:text-white text-sm">Jobs</Link>
            <Link to="/interviewers" className="text-white text-sm font-medium">Interviewers</Link>
            <Link to="/offers" className="text-gray-400 hover:text-white text-sm">Offers</Link>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Interview Team</h1>
            <p className="text-gray-400 text-sm mt-1">{interviewers.length} members</p>
          </div>
          <button onClick={() => setShowInvite(true)}
            className="px-5 py-2.5 bg-gradient-to-r from-purple-500 to-indigo-500 text-white text-sm font-medium rounded-xl hover:from-purple-600 hover:to-indigo-600 transition-all">
            <i className="ri-user-add-line mr-1" /> Invite Member
          </button>
        </div>

        {loading ? (
          <div className="text-center py-20"><i className="ri-loader-4-line animate-spin text-blue-400 text-2xl" /></div>
        ) : interviewers.length === 0 ? (
          <div className="text-center py-20 bg-gray-800/30 rounded-2xl border border-gray-700/50">
            <i className="ri-team-line text-gray-600 text-5xl mb-4" />
            <p className="text-gray-400 mb-4">No interviewers yet</p>
            <button onClick={() => setShowInvite(true)}
              className="px-6 py-2.5 bg-purple-500 text-white text-sm rounded-xl hover:bg-purple-600">Invite Your First Member</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {interviewers.map(iv => (
              <div key={iv.id} className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-5 hover:border-gray-600 transition-all">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center">
                      <span className="text-purple-400 font-semibold">{iv.full_name[0].toUpperCase()}</span>
                    </div>
                    <div>
                      <p className="text-white font-medium">{iv.full_name}</p>
                      <p className="text-gray-400 text-sm">{iv.email}</p>
                      {iv.designation && <p className="text-gray-500 text-xs mt-0.5">{iv.designation}</p>}
                    </div>
                  </div>
                  <span className={`px-2.5 py-0.5 text-xs rounded-full ${statusColors[iv.status]}`}>{iv.status}</span>
                </div>
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-700/50">
                  <div className="flex gap-4 text-xs text-gray-400">
                    <span><i className="ri-vidicon-line mr-1" />{iv.interview_count || 0} interviews</span>
                    {iv.accepted_at && <span>Joined: {new Date(iv.accepted_at).toLocaleDateString()}</span>}
                  </div>
                  <button onClick={() => handleRemove(iv.id)} className="text-red-400 hover:text-red-300 text-sm"><i className="ri-delete-bin-line" /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Invite Modal */}
      {showInvite && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-800 border border-gray-700 rounded-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-white">Invite Interviewer</h2>
              <button onClick={() => setShowInvite(false)} className="text-gray-400 hover:text-white"><i className="ri-close-line text-xl" /></button>
            </div>
            {error && <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-4"><p className="text-red-300 text-sm">{error}</p></div>}
            <form onSubmit={handleInvite} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-300 mb-1">Full Name *</label>
                <input type="text" value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl text-white text-sm" placeholder="John Doe" required />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Email *</label>
                <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl text-white text-sm" placeholder="john@company.com" required />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Designation</label>
                <input type="text" value={form.designation} onChange={e => setForm({ ...form, designation: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl text-white text-sm" placeholder="Engineering Lead" />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Phone</label>
                <input type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl text-white text-sm" placeholder="+91..." />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowInvite(false)} className="flex-1 py-2.5 border border-gray-600 text-gray-300 rounded-xl">Cancel</button>
                <button type="submit" disabled={inviting}
                  className="flex-1 py-2.5 bg-purple-500 text-white rounded-xl hover:bg-purple-600 disabled:opacity-50">
                  {inviting ? 'Inviting...' : 'Send Invite'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

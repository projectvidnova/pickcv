import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { recruiterApi, RecruiterStats, Recruiter } from '../../../services/recruiterService';

export default function RecruiterDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<RecruiterStats | null>(null);
  const [recruiter, setRecruiter] = useState<Recruiter | null>(recruiterApi.getProfile());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!recruiterApi.isLoggedIn()) { navigate('/recruiter/login'); return; }
    Promise.all([recruiterApi.fetchProfile(), recruiterApi.getStats()])
      .then(([profile, s]) => { setRecruiter(profile); setStats(s); })
      .catch(() => { recruiterApi.logout(); navigate('/recruiter/login'); })
      .finally(() => setLoading(false));
  }, [navigate]);

  const handleLogout = () => { recruiterApi.logout(); navigate('/recruiter/login'); };

  if (loading) return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <i className="ri-loader-4-line animate-spin text-blue-400 text-3xl" />
    </div>
  );

  const statCards = [
    { label: 'Open Jobs', value: stats?.open_jobs ?? 0, icon: 'ri-briefcase-line', color: 'from-blue-500 to-blue-600', link: '/recruiter/jobs' },
    { label: 'Applications', value: stats?.total_applications ?? 0, icon: 'ri-file-list-3-line', color: 'from-emerald-500 to-emerald-600', link: '/recruiter/jobs' },
    { label: 'Shortlisted', value: stats?.shortlisted ?? 0, icon: 'ri-user-star-line', color: 'from-amber-500 to-amber-600', link: '/recruiter/jobs' },
    { label: 'Interviews', value: stats?.pending_interviews ?? 0, icon: 'ri-vidicon-line', color: 'from-purple-500 to-purple-600', link: '/recruiter/jobs' },
    { label: 'Offers Sent', value: stats?.offered ?? 0, icon: 'ri-mail-send-line', color: 'from-pink-500 to-pink-600', link: '/recruiter/offers' },
    { label: 'Hired', value: stats?.hired ?? 0, icon: 'ri-user-follow-line', color: 'from-green-500 to-green-600', link: '/recruiter/offers' },
    { label: 'Interviewers', value: stats?.total_interviewers ?? 0, icon: 'ri-team-line', color: 'from-indigo-500 to-indigo-600', link: '/recruiter/interviewers' },
    { label: 'Paused Jobs', value: stats?.paused_jobs ?? 0, icon: 'ri-pause-circle-line', color: 'from-gray-500 to-gray-600', link: '/recruiter/jobs' },
  ];

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Top Nav */}
      <nav className="border-b border-gray-800 bg-gray-900/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/recruiter/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
              <i className="ri-building-2-fill text-white text-sm" />
            </div>
            <span className="text-lg font-bold text-white">PickCV Recruiter</span>
          </Link>
          <div className="flex items-center gap-6">
            <Link to="/recruiter/jobs" className="text-gray-400 hover:text-white text-sm transition-colors">Jobs</Link>
            <Link to="/recruiter/interviewers" className="text-gray-400 hover:text-white text-sm transition-colors">Interviewers</Link>
            <Link to="/recruiter/offer-templates" className="text-gray-400 hover:text-white text-sm transition-colors">Templates</Link>
            <Link to="/recruiter/offers" className="text-gray-400 hover:text-white text-sm transition-colors">Offers</Link>
            <div className="flex items-center gap-3 pl-6 border-l border-gray-700">
              <div className="text-right">
                <p className="text-white text-sm font-medium">{recruiter?.full_name}</p>
                <p className="text-gray-500 text-xs">{recruiter?.company_name}</p>
              </div>
              <button onClick={handleLogout} className="text-gray-400 hover:text-red-400 transition-colors" title="Logout">
                <i className="ri-logout-box-r-line text-lg" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Dashboard</h1>
            <p className="text-gray-400 text-sm mt-1">Welcome back, {recruiter?.full_name}</p>
          </div>
          <Link to="/recruiter/jobs/new"
            className="px-5 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-sm font-medium rounded-xl hover:from-blue-600 hover:to-indigo-600 transition-all shadow-lg shadow-blue-500/25">
            <i className="ri-add-line mr-1" /> Post New Job
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {statCards.map(card => (
            <Link key={card.label} to={card.link}
              className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-5 hover:border-gray-600 transition-all group">
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-r ${card.color} flex items-center justify-center`}>
                  <i className={`${card.icon} text-white text-lg`} />
                </div>
                <i className="ri-arrow-right-up-line text-gray-600 group-hover:text-gray-400 transition-colors" />
              </div>
              <p className="text-2xl font-bold text-white">{card.value}</p>
              <p className="text-gray-400 text-sm mt-1">{card.label}</p>
            </Link>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link to="/recruiter/jobs/new"
            className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-6 hover:border-blue-500/50 transition-all group">
            <i className="ri-add-circle-line text-blue-400 text-2xl mb-3" />
            <h3 className="text-white font-semibold mb-1">Post a Job</h3>
            <p className="text-gray-400 text-sm">Create a new job listing and start receiving applications</p>
          </Link>
          <Link to="/recruiter/interviewers"
            className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-6 hover:border-purple-500/50 transition-all group">
            <i className="ri-user-add-line text-purple-400 text-2xl mb-3" />
            <h3 className="text-white font-semibold mb-1">Invite Interviewer</h3>
            <p className="text-gray-400 text-sm">Add team members to help interview candidates</p>
          </Link>
          <Link to="/recruiter/offer-templates"
            className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-6 hover:border-emerald-500/50 transition-all group">
            <i className="ri-draft-line text-emerald-400 text-2xl mb-3" />
            <h3 className="text-white font-semibold mb-1">Create Offer Template</h3>
            <p className="text-gray-400 text-sm">Design reusable offer letter templates with variables</p>
          </Link>
        </div>
      </div>
    </div>
  );
}

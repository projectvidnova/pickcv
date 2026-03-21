import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { recruiterApi, RecruiterJob } from '../../../services/recruiterService';

export default function RecruiterJobs() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<RecruiterJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('');

  useEffect(() => {
    if (!recruiterApi.isLoggedIn()) { navigate('/recruiter/login'); return; }
    loadJobs();
  }, [filter]);

  const loadJobs = async () => {
    setLoading(true);
    try {
      const data = await recruiterApi.listJobs(filter || undefined);
      setJobs(data);
    } catch { navigate('/recruiter/login'); }
    setLoading(false);
  };

  const handleStatusChange = async (jobId: number, status: string) => {
    try {
      await recruiterApi.updateJobStatus(jobId, status);
      loadJobs();
    } catch (err: any) { alert(err.message); }
  };

  const handleDelete = async (jobId: number) => {
    if (!confirm('Delete this job? This cannot be undone.')) return;
    try {
      await recruiterApi.deleteJob(jobId);
      loadJobs();
    } catch (err: any) { alert(err.message); }
  };

  const statusColors: Record<string, string> = {
    open: 'bg-green-500/10 text-green-400 border-green-500/20',
    paused: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    closed: 'bg-red-500/10 text-red-400 border-red-500/20',
  };

  return (
    <div className="min-h-screen bg-gray-900">
      <nav className="border-b border-gray-800 bg-gray-900/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/recruiter/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
              <i className="ri-building-2-fill text-white text-sm" />
            </div>
            <span className="text-lg font-bold text-white">PickCV Recruiter</span>
          </Link>
          <div className="flex items-center gap-6">
            <Link to="/recruiter/dashboard" className="text-gray-400 hover:text-white text-sm">Dashboard</Link>
            <Link to="/recruiter/jobs" className="text-white text-sm font-medium">Jobs</Link>
            <Link to="/recruiter/interviewers" className="text-gray-400 hover:text-white text-sm">Interviewers</Link>
            <Link to="/recruiter/offers" className="text-gray-400 hover:text-white text-sm">Offers</Link>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Job Listings</h1>
            <p className="text-gray-400 text-sm mt-1">{jobs.length} total jobs</p>
          </div>
          <Link to="/recruiter/jobs/new"
            className="px-5 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-sm font-medium rounded-xl hover:from-blue-600 hover:to-indigo-600 transition-all">
            <i className="ri-add-line mr-1" /> Post New Job
          </Link>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-6">
          {['', 'open', 'paused', 'closed'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-4 py-2 text-sm rounded-lg transition-all ${filter === f
                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                : 'bg-gray-800 text-gray-400 border border-gray-700 hover:text-white'}`}>
              {f || 'All'}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-20"><i className="ri-loader-4-line animate-spin text-blue-400 text-2xl" /></div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-20 bg-gray-800/30 rounded-2xl border border-gray-700/50">
            <i className="ri-briefcase-line text-gray-600 text-5xl mb-4" />
            <p className="text-gray-400 mb-4">No jobs found</p>
            <Link to="/recruiter/jobs/new"
              className="px-6 py-2.5 bg-blue-500 text-white text-sm rounded-xl hover:bg-blue-600 transition-all">
              Post Your First Job
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {jobs.map(job => (
              <div key={job.id} className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-6 hover:border-gray-600 transition-all">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Link to={`/recruiter/jobs/${job.id}`} className="text-lg font-semibold text-white hover:text-blue-400 transition-colors">
                        {job.title}
                      </Link>
                      <span className={`px-2.5 py-0.5 text-xs font-medium rounded-full border ${statusColors[job.status] || 'bg-gray-500/10 text-gray-400'}`}>
                        {job.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-gray-400 text-sm">
                      <span><i className="ri-map-pin-line mr-1" />{job.location}</span>
                      <span><i className="ri-briefcase-4-line mr-1" />{job.job_type}</span>
                      <span><i className="ri-bar-chart-line mr-1" />{job.experience_level}</span>
                      {job.remote_policy && <span><i className="ri-home-wifi-line mr-1" />{job.remote_policy}</span>}
                    </div>
                    <div className="flex items-center gap-6 mt-3 text-sm">
                      <Link to={`/recruiter/jobs/${job.id}`} className="text-blue-400 hover:text-blue-300">
                        <i className="ri-eye-line mr-1" />{job.application_count || 0} Applications
                      </Link>
                      <span className="text-gray-500"><i className="ri-eye-line mr-1" />{job.view_count || 0} Views</span>
                      {job.pause_date && <span className="text-yellow-400 text-xs"><i className="ri-time-line mr-1" />Auto-pause: {new Date(job.pause_date).toLocaleDateString()}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {job.status === 'open' && (
                      <button onClick={() => handleStatusChange(job.id, 'paused')}
                        className="px-3 py-1.5 text-xs bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 rounded-lg hover:bg-yellow-500/20 transition-all">
                        <i className="ri-pause-line mr-1" />Pause
                      </button>
                    )}
                    {job.status === 'paused' && (
                      <button onClick={() => handleStatusChange(job.id, 'open')}
                        className="px-3 py-1.5 text-xs bg-green-500/10 text-green-400 border border-green-500/20 rounded-lg hover:bg-green-500/20 transition-all">
                        <i className="ri-play-line mr-1" />Resume
                      </button>
                    )}
                    {job.status !== 'closed' && (
                      <button onClick={() => handleStatusChange(job.id, 'closed')}
                        className="px-3 py-1.5 text-xs bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg hover:bg-red-500/20 transition-all">
                        <i className="ri-close-circle-line mr-1" />Close
                      </button>
                    )}
                    <Link to={`/recruiter/jobs/${job.id}/edit`}
                      className="px-3 py-1.5 text-xs bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-all">
                      <i className="ri-pencil-line" />
                    </Link>
                    <button onClick={() => handleDelete(job.id)}
                      className="px-3 py-1.5 text-xs text-red-400 hover:bg-red-500/10 rounded-lg transition-all">
                      <i className="ri-delete-bin-line" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

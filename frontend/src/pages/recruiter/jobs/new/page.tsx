import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { recruiterApi } from '../../../../services/recruiterService';

const JOB_TYPES = ['Full-time', 'Part-time', 'Contract', 'Internship', 'Freelance'];
const EXP_LEVELS = ['Entry', 'Mid', 'Senior', 'Lead', 'Executive'];
const REMOTE = ['On-site', 'Remote', 'Hybrid'];

export default function NewJob() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const jobId = Number(id);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEdit);
  const [form, setForm] = useState({
    title: '', description: '', requirements: '', responsibilities: '', benefits: '',
    job_type: 'Full-time', experience_level: 'Mid', location: '', remote_policy: 'On-site',
    salary_min: '', salary_max: '', currency: 'INR',
    required_skills: '', preferred_skills: '', pause_date: '',
  });

  useEffect(() => {
    if (!isEdit) return;
    (async () => {
      try {
        const job = await recruiterApi.getJob(jobId);
        setForm({
          title: job.title || '',
          description: job.description || '',
          requirements: job.requirements || '',
          responsibilities: job.responsibilities || '',
          benefits: job.benefits || '',
          job_type: job.job_type || 'Full-time',
          experience_level: job.experience_level || 'Mid',
          location: job.location || '',
          remote_policy: job.remote_policy || 'On-site',
          salary_min: job.salary_min != null ? String(job.salary_min) : '',
          salary_max: job.salary_max != null ? String(job.salary_max) : '',
          currency: job.currency || 'INR',
          required_skills: (job.required_skills || []).join(', '),
          preferred_skills: (job.preferred_skills || []).join(', '),
          pause_date: job.pause_date ? job.pause_date.substring(0, 10) : '',
        });
      } catch (err: any) {
        setError(err.message || 'Failed to load job');
      }
      setFetching(false);
    })();
  }, [isEdit, jobId]);

  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.description || !form.location) { setError('Title, description and location are required'); return; }
    setError('');
    setLoading(true);
    try {
      const payload = {
        title: form.title, description: form.description,
        requirements: form.requirements || undefined,
        responsibilities: form.responsibilities || undefined,
        benefits: form.benefits || undefined,
        job_type: form.job_type, experience_level: form.experience_level,
        location: form.location, remote_policy: form.remote_policy,
        salary_min: form.salary_min ? Number(form.salary_min) : undefined,
        salary_max: form.salary_max ? Number(form.salary_max) : undefined,
        currency: form.currency,
        required_skills: form.required_skills ? form.required_skills.split(',').map(s => s.trim()).filter(Boolean) : [],
        preferred_skills: form.preferred_skills ? form.preferred_skills.split(',').map(s => s.trim()).filter(Boolean) : [],
        pause_date: form.pause_date || undefined,
      };
      if (isEdit) {
        await recruiterApi.updateJob(jobId, payload);
      } else {
        await recruiterApi.createJob(payload);
      }
      navigate('/jobs');
    } catch (err: any) { setError(err.message || (isEdit ? 'Failed to update job' : 'Failed to create job')); }
    setLoading(false);
  };

  if (fetching) return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <i className="ri-loader-4-line animate-spin text-blue-400 text-3xl" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-900">
      <nav className="border-b border-gray-800 bg-gray-900/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-4">
          <Link to="/jobs" className="text-gray-400 hover:text-white"><i className="ri-arrow-left-line text-lg" /></Link>
          <span className="text-lg font-bold text-white">{isEdit ? 'Edit Job' : 'Post New Job'}</span>
        </div>
      </nav>
      <div className="max-w-3xl mx-auto px-6 py-8">
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6">
            <p className="text-red-300 text-sm"><i className="ri-error-warning-line mr-1" />{error}</p>
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-6 space-y-4">
            <h2 className="text-lg font-semibold text-white mb-2">Job Details</h2>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Job Title *</label>
              <input type="text" value={form.title} onChange={e => set('title', e.target.value)}
                className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50" placeholder="Senior Software Engineer" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Description *</label>
              <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={5}
                className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50" placeholder="Describe the role..." required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Requirements</label>
              <textarea value={form.requirements} onChange={e => set('requirements', e.target.value)} rows={3}
                className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50" placeholder="List requirements..." />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Responsibilities</label>
              <textarea value={form.responsibilities} onChange={e => set('responsibilities', e.target.value)} rows={3}
                className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50" placeholder="List responsibilities..." />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Benefits</label>
              <textarea value={form.benefits} onChange={e => set('benefits', e.target.value)} rows={2}
                className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50" placeholder="What do you offer?" />
            </div>
          </div>

          <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-6 space-y-4">
            <h2 className="text-lg font-semibold text-white mb-2">Job Configuration</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Job Type</label>
                <select value={form.job_type} onChange={e => set('job_type', e.target.value)}
                  className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50">
                  {JOB_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Experience Level</label>
                <select value={form.experience_level} onChange={e => set('experience_level', e.target.value)}
                  className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50">
                  {EXP_LEVELS.map(l => <option key={l}>{l}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Location *</label>
                <input type="text" value={form.location} onChange={e => set('location', e.target.value)}
                  className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50" placeholder="Bangalore, India" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Remote Policy</label>
                <select value={form.remote_policy} onChange={e => set('remote_policy', e.target.value)}
                  className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50">
                  {REMOTE.map(r => <option key={r}>{r}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Min Salary</label>
                <input type="number" value={form.salary_min} onChange={e => set('salary_min', e.target.value)}
                  className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50" placeholder="500000" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Max Salary</label>
                <input type="number" value={form.salary_max} onChange={e => set('salary_max', e.target.value)}
                  className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50" placeholder="1200000" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Currency</label>
                <select value={form.currency} onChange={e => set('currency', e.target.value)}
                  className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50">
                  <option>INR</option><option>USD</option><option>EUR</option><option>GBP</option>
                </select>
              </div>
            </div>
          </div>

          <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-6 space-y-4">
            <h2 className="text-lg font-semibold text-white mb-2">Skills & Rules</h2>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Required Skills (comma-separated)</label>
              <input type="text" value={form.required_skills} onChange={e => set('required_skills', e.target.value)}
                className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50" placeholder="Python, React, AWS" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Preferred Skills (comma-separated)</label>
              <input type="text" value={form.preferred_skills} onChange={e => set('preferred_skills', e.target.value)}
                className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50" placeholder="Docker, Kubernetes" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Auto-Pause Date</label>
              <input type="date" value={form.pause_date} onChange={e => set('pause_date', e.target.value)}
                className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50" />
              <p className="text-gray-500 text-xs mt-1">Job will automatically pause on this date</p>
            </div>
          </div>

          <div className="flex gap-3">
            <Link to="/jobs" className="flex-1 py-3 text-center border border-gray-600 text-gray-300 rounded-xl hover:bg-gray-800 transition-all">Cancel</Link>
            <button type="submit" disabled={loading}
              className="flex-1 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-indigo-600 transition-all disabled:opacity-50">
              {loading ? <span><i className="ri-loader-4-line animate-spin mr-1" />{isEdit ? 'Saving...' : 'Publishing...'}</span> : (isEdit ? 'Save Changes' : 'Publish Job')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

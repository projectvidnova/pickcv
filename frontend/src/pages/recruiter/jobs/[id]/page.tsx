import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { recruiterApi, RecruiterJob, Application, Interview, InterviewerMember } from '../../../../services/recruiterService';

export default function JobDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const jobId = Number(id);

  const [job, setJob] = useState<RecruiterJob | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [interviewers, setInterviewers] = useState<InterviewerMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<string>('all');
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [showInterviewModal, setShowInterviewModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState<Interview | null>(null);

  useEffect(() => {
    if (!recruiterApi.isLoggedIn()) { navigate('/recruiter/login'); return; }
    loadData();
  }, [jobId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [j, apps, ivs] = await Promise.all([
        recruiterApi.getJob(jobId),
        recruiterApi.listApplications(jobId),
        recruiterApi.listInterviewers(),
      ]);
      setJob(j); setApplications(apps); setInterviewers(ivs);
    } catch { navigate('/recruiter/jobs'); }
    setLoading(false);
  };

  const handleStatusChange = async (appId: number, status: string) => {
    try {
      await recruiterApi.updateApplicationStatus(appId, status);
      const updated = await recruiterApi.listApplications(jobId);
      setApplications(updated);
    } catch (err: any) { alert(err.message); }
  };

  const openInterviewPlanner = async (app: Application) => {
    setSelectedApp(app);
    const ivs = await recruiterApi.listInterviews(app.id);
    setInterviews(ivs);
    setShowInterviewModal(true);
  };

  const filtered = tab === 'all' ? applications : applications.filter(a => a.status === tab);
  const statusColors: Record<string, string> = {
    applied: 'bg-blue-500/10 text-blue-400',
    in_review: 'bg-purple-500/10 text-purple-400',
    shortlisted: 'bg-amber-500/10 text-amber-400',
    interviewing: 'bg-indigo-500/10 text-indigo-400',
    offered: 'bg-green-500/10 text-green-400',
    hired: 'bg-emerald-500/10 text-emerald-400',
    rejected: 'bg-red-500/10 text-red-400',
  };

  if (loading) return <div className="min-h-screen bg-gray-900 flex items-center justify-center"><i className="ri-loader-4-line animate-spin text-blue-400 text-3xl" /></div>;

  return (
    <div className="min-h-screen bg-gray-900">
      <nav className="border-b border-gray-800 bg-gray-900/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-4">
          <Link to="/recruiter/jobs" className="text-gray-400 hover:text-white"><i className="ri-arrow-left-line text-lg" /></Link>
          <span className="text-lg font-bold text-white">{job?.title}</span>
          <span className={`ml-2 px-2.5 py-0.5 text-xs rounded-full ${statusColors[job?.status || ''] || 'bg-gray-700 text-gray-300'}`}>{job?.status}</span>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Job Summary */}
        <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-6 mb-6">
          <div className="grid grid-cols-4 gap-4">
            <div><span className="text-gray-400 text-sm">Location</span><p className="text-white font-medium">{job?.location}</p></div>
            <div><span className="text-gray-400 text-sm">Type</span><p className="text-white font-medium">{job?.job_type}</p></div>
            <div><span className="text-gray-400 text-sm">Applications</span><p className="text-white font-medium">{applications.length}</p></div>
            <div><span className="text-gray-400 text-sm">Views</span><p className="text-white font-medium">{job?.view_count || 0}</p></div>
          </div>
        </div>

        {/* Application Tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {['all', 'applied', 'in_review', 'shortlisted', 'interviewing', 'offered', 'hired', 'rejected'].map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-3 py-1.5 text-xs rounded-lg transition-all ${tab === t ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'bg-gray-800 text-gray-400 border border-gray-700'}`}>
              {t === 'all' ? 'All' : t.replace('_', ' ')} ({t === 'all' ? applications.length : applications.filter(a => a.status === t).length})
            </button>
          ))}
        </div>

        {/* Applications List */}
        {filtered.length === 0 ? (
          <div className="text-center py-16 bg-gray-800/30 rounded-2xl border border-gray-700/50">
            <i className="ri-user-line text-gray-600 text-4xl mb-3" />
            <p className="text-gray-400">No applications in this category</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(app => (
              <div key={app.id} className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-5 hover:border-gray-600 transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                        <span className="text-blue-400 font-semibold text-sm">{(app.candidate_name || 'U')[0].toUpperCase()}</span>
                      </div>
                      <div>
                        <p className="text-white font-medium">{app.candidate_name || 'Unknown'}</p>
                        <p className="text-gray-400 text-sm">{app.candidate_email}</p>
                      </div>
                      <span className={`px-2 py-0.5 text-xs rounded-full ${statusColors[app.status] || 'bg-gray-700 text-gray-300'}`}>
                        {app.status.replace('_', ' ')}
                      </span>
                      {app.match_score && <span className="text-xs text-amber-400"><i className="ri-star-line mr-1" />{app.match_score}%</span>}
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      <span>Applied: {new Date(app.applied_at || app.created_at).toLocaleDateString()}</span>
                      {app.resume_title && <span><i className="ri-file-text-line mr-1" />{app.resume_title}</span>}
                      {app.resume_ats_score && <span>ATS: {app.resume_ats_score}%</span>}
                      {app.total_rounds > 0 && <span>Interviews: {app.completed_rounds}/{app.total_rounds}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {app.status === 'applied' && (
                      <>
                        <button onClick={() => handleStatusChange(app.id, 'shortlisted')}
                          className="px-3 py-1.5 text-xs bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-lg hover:bg-amber-500/20">
                          <i className="ri-star-line mr-1" />Shortlist
                        </button>
                        <button onClick={() => handleStatusChange(app.id, 'rejected')}
                          className="px-3 py-1.5 text-xs text-red-400 hover:bg-red-500/10 rounded-lg">Reject</button>
                      </>
                    )}
                    {app.status === 'shortlisted' && (
                      <button onClick={() => openInterviewPlanner(app)}
                        className="px-3 py-1.5 text-xs bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-lg hover:bg-indigo-500/20">
                        <i className="ri-vidicon-line mr-1" />Plan Interview
                      </button>
                    )}
                    {app.status === 'interviewing' && (
                      <>
                        <button onClick={() => openInterviewPlanner(app)}
                          className="px-3 py-1.5 text-xs bg-indigo-500/10 text-indigo-400 rounded-lg">
                          <i className="ri-vidicon-line mr-1" />Interviews
                        </button>
                        <button onClick={() => handleStatusChange(app.id, 'offered')}
                          className="px-3 py-1.5 text-xs bg-green-500/10 text-green-400 rounded-lg">
                          Send Offer
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Interview Planning Modal */}
      {showInterviewModal && selectedApp && (
        <InterviewPlanModal
          app={selectedApp} interviews={interviews} interviewers={interviewers}
          onClose={() => { setShowInterviewModal(false); loadData(); }}
          onFeedback={(iv) => { setShowFeedbackModal(iv); setShowInterviewModal(false); }}
        />
      )}

      {/* Feedback Modal */}
      {showFeedbackModal && (
        <FeedbackModal interview={showFeedbackModal}
          onClose={() => { setShowFeedbackModal(null); loadData(); }}
        />
      )}
    </div>
  );
}

/* ─── Interview Plan Modal Component ───────────── */
function InterviewPlanModal({ app, interviews, interviewers, onClose, onFeedback }: {
  app: Application; interviews: Interview[]; interviewers: InterviewerMember[];
  onClose: () => void; onFeedback: (iv: Interview) => void;
}) {
  const [mode, setMode] = useState<'sequential' | 'bulk'>('sequential');
  const [rounds, setRounds] = useState([{ round_number: 1, round_title: 'Round 1', interview_type: 'video', interviewer_id: 0, scheduled_at: '', duration_minutes: 45 }]);
  const [saving, setSaving] = useState(false);

  const addRound = () => {
    const next = rounds.length + 1;
    setRounds([...rounds, { round_number: next, round_title: `Round ${next}`, interview_type: 'video', interviewer_id: 0, scheduled_at: '', duration_minutes: 45 }]);
  };

  const updateRound = (idx: number, field: string, value: any) => {
    const updated = [...rounds];
    (updated[idx] as any)[field] = value;
    setRounds(updated);
  };

  const handlePlan = async () => {
    const valid = rounds.filter(r => r.scheduled_at);
    if (valid.length === 0) { alert('Set at least one interview date'); return; }
    setSaving(true);
    try {
      await recruiterApi.planInterviews(app.id, rounds.map(r => ({
        round_number: r.round_number,
        round_title: r.round_title,
        interview_type: r.interview_type,
        interviewer_id: r.interviewer_id || undefined,
        scheduled_at: r.scheduled_at || undefined,
        duration_minutes: r.duration_minutes,
      })), mode);
      onClose();
    } catch (err: any) { alert(err.message); }
    setSaving(false);
  };

  const statusIcon: Record<string, string> = {
    pending: 'ri-time-line text-gray-400',
    scheduled: 'ri-calendar-check-line text-blue-400',
    completed: 'ri-check-line text-green-400',
    qualified: 'ri-checkbox-circle-line text-green-400',
    not_qualified: 'ri-close-circle-line text-red-400',
    no_show: 'ri-user-unfollow-line text-yellow-400',
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-800 border border-gray-700 rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Interview Plan — {app.candidate_name}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><i className="ri-close-line text-xl" /></button>
        </div>

        {/* Existing interviews */}
        {interviews.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-400 mb-3">Current Rounds</h3>
            <div className="space-y-2">
              {interviews.map(iv => (
                <div key={iv.id} className="flex items-center justify-between bg-gray-700/50 rounded-lg p-3">
                  <div className="flex items-center gap-3">
                    <i className={statusIcon[iv.status] || 'ri-question-line text-gray-400'} />
                    <div>
                      <p className="text-white text-sm font-medium">{iv.round_title || `Round ${iv.round_number}`}</p>
                      <p className="text-gray-400 text-xs">
                        {iv.scheduled_at ? new Date(iv.scheduled_at).toLocaleString() : 'Not scheduled'}
                        {iv.interviewer_name && ` • ${iv.interviewer_name}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <span className={`px-2 py-0.5 text-xs rounded ${statusIcon[iv.status] ? '' : 'text-gray-400'}`}>{iv.status}</span>
                    {['scheduled', 'completed'].includes(iv.status) && (
                      <button onClick={() => onFeedback(iv)} className="px-2 py-0.5 text-xs bg-blue-500/10 text-blue-400 rounded hover:bg-blue-500/20">
                        Feedback
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* New round planning */}
        {interviews.length === 0 && (
          <>
            <div className="flex gap-3 mb-4">
              <button onClick={() => setMode('sequential')}
                className={`flex-1 py-2 text-sm rounded-lg border ${mode === 'sequential' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' : 'border-gray-600 text-gray-400'}`}>
                Sequential
              </button>
              <button onClick={() => setMode('bulk')}
                className={`flex-1 py-2 text-sm rounded-lg border ${mode === 'bulk' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' : 'border-gray-600 text-gray-400'}`}>
                Bulk
              </button>
            </div>
            <p className="text-gray-500 text-xs mb-4">
              {mode === 'sequential' ? 'Next round invite is sent only after the current round is marked as qualified.' : 'All interview invites are sent at once.'}
            </p>

            <div className="space-y-3 mb-4">
              {rounds.map((r, i) => (
                <div key={i} className="bg-gray-700/30 rounded-lg p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="text-white font-medium text-sm">Round {r.round_number}</span>
                    <input type="text" value={r.round_title} onChange={e => updateRound(i, 'round_title', e.target.value)}
                      className="flex-1 px-3 py-1.5 bg-gray-700/50 border border-gray-600 rounded-lg text-white text-sm" placeholder="Round title" />
                    {i > 0 && <button onClick={() => setRounds(rounds.filter((_, j) => j !== i))} className="text-red-400 hover:text-red-300"><i className="ri-delete-bin-line" /></button>}
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Type</label>
                      <select value={r.interview_type} onChange={e => updateRound(i, 'interview_type', e.target.value)}
                        className="w-full px-3 py-1.5 bg-gray-700/50 border border-gray-600 rounded-lg text-white text-sm">
                        <option value="video">Video</option><option value="phone">Phone</option><option value="in_person">In-Person</option><option value="technical">Technical</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Date & Time</label>
                      <input type="datetime-local" value={r.scheduled_at} onChange={e => updateRound(i, 'scheduled_at', e.target.value)}
                        className="w-full px-3 py-1.5 bg-gray-700/50 border border-gray-600 rounded-lg text-white text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Interviewer</label>
                      <select value={r.interviewer_id} onChange={e => updateRound(i, 'interviewer_id', Number(e.target.value))}
                        className="w-full px-3 py-1.5 bg-gray-700/50 border border-gray-600 rounded-lg text-white text-sm">
                        <option value={0}>Select...</option>
                        {interviewers.filter(iv => iv.status === 'accepted').map(iv => (
                          <option key={iv.id} value={iv.id}>{iv.full_name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button onClick={addRound} className="w-full py-2 border border-dashed border-gray-600 text-gray-400 text-sm rounded-lg hover:border-gray-500 hover:text-white mb-4">
              <i className="ri-add-line mr-1" /> Add Round
            </button>

            <button onClick={handlePlan} disabled={saving}
              className="w-full py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-indigo-600 disabled:opacity-50">
              {saving ? 'Planning...' : 'Create Interview Plan'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

/* ─── Feedback Modal ───────────────────────────── */
function FeedbackModal({ interview, onClose }: { interview: Interview; onClose: () => void }) {
  const [feedback, setFeedback] = useState(interview.feedback || '');
  const [rating, setRating] = useState(interview.rating || 3);
  const [qualified, setQualified] = useState(interview.is_qualified ?? true);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!feedback.trim()) { alert('Please enter feedback'); return; }
    setSaving(true);
    try {
      await recruiterApi.submitFeedback(interview.id, feedback, rating, qualified);
      onClose();
    } catch (err: any) { alert(err.message); }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-800 border border-gray-700 rounded-2xl w-full max-w-md p-6">
        <h2 className="text-lg font-bold text-white mb-4">Interview Feedback — {interview.round_title || `Round ${interview.round_number}`}</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-300 mb-1">Rating (1-5)</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map(n => (
                <button key={n} onClick={() => setRating(n)}
                  className={`w-10 h-10 rounded-lg border text-sm font-medium transition-all ${rating >= n ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' : 'border-gray-600 text-gray-400'}`}>
                  {n}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1">Feedback</label>
            <textarea value={feedback} onChange={e => setFeedback(e.target.value)} rows={4}
              className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl text-white text-sm" placeholder="Share your assessment..." />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-2">Qualified for next round?</label>
            <div className="flex gap-3">
              <button onClick={() => setQualified(true)}
                className={`flex-1 py-2 text-sm rounded-lg border ${qualified ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'border-gray-600 text-gray-400'}`}>
                <i className="ri-check-line mr-1" />Yes
              </button>
              <button onClick={() => setQualified(false)}
                className={`flex-1 py-2 text-sm rounded-lg border ${!qualified ? 'bg-red-500/20 text-red-400 border-red-500/30' : 'border-gray-600 text-gray-400'}`}>
                <i className="ri-close-line mr-1" />No
              </button>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-2.5 border border-gray-600 text-gray-300 rounded-xl">Cancel</button>
            <button onClick={handleSubmit} disabled={saving}
              className="flex-1 py-2.5 bg-blue-500 text-white rounded-xl hover:bg-blue-600 disabled:opacity-50">
              {saving ? 'Saving...' : 'Submit Feedback'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

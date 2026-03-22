import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/feature/Navbar';
import ProfileHeader from './components/ProfileHeader';
import ProfileEditModal from './components/ProfileEditModal';
import { apiService } from '../../services/api';

interface SkillEntry {
  name: string;
  years: number;
}

interface ProfileData {
  name: string;
  email: string;
  phone: string;
  linkedin: string;
  location: string;
  targetRole: string;
  preferredLocations: string[];
  experienceLevel: string;
  workMode: string;
  skills: SkillEntry[];
}

interface ResumeEntry {
  id: number;
  title: string;
  template_name: string | null;
  original_filename: string | null;
  ats_score: number | null;
  is_optimized: boolean;
  file_format: string | null;
  created_at: string;
  updated_at: string | null;
}

interface ApplicationEntry {
  id: number;
  job_id: number;
  status: string;
  applied_at: string;
  job_title?: string;
  company_name?: string;
  company_logo_url?: string;
  job_location?: string;
  job_type?: string;
  experience_level?: string;
  salary_min?: number;
  salary_max?: number;
  currency?: string;
  remote_policy?: string;
  job_status?: string;
}

const expLevelLabels: Record<string, { label: string; icon: string; color: string }> = {
  entry: { label: 'Entry Level', icon: 'ri-seedling-line', color: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
  mid:   { label: 'Mid Level',   icon: 'ri-plant-line',    color: 'text-teal-600 bg-teal-50 border-teal-100' },
  senior:{ label: 'Senior',      icon: 'ri-tree-line',     color: 'text-amber-600 bg-amber-50 border-amber-100' },
  lead:  { label: 'Lead / Manager', icon: 'ri-award-line', color: 'text-rose-600 bg-rose-50 border-rose-100' },
};

const workModeLabels: Record<string, { label: string; icon: string }> = {
  remote: { label: 'Remote',  icon: 'ri-home-wifi-line' },
  hybrid: { label: 'Hybrid',  icon: 'ri-building-2-line' },
  onsite: { label: 'On-site', icon: 'ri-map-pin-2-line' },
};

const expYearLabels = ['< 1 yr','1 yr','2 yrs','3 yrs','4 yrs','5 yrs','6 yrs','7 yrs','8 yrs','9 yrs','10+ yrs'];

const EMPTY_PROFILE: ProfileData = {
  name: '', email: '', phone: '', linkedin: '', location: '',
  targetRole: '', preferredLocations: [], experienceLevel: '', workMode: '', skills: [],
};

type TabKey = 'resumes' | 'applications' | 'profile';

const templateColors: Record<string, string> = {
  modern: 'from-teal-500 to-emerald-500', minimal: 'from-violet-500 to-purple-500',
  executive: 'from-rose-500 to-pink-500', classic: 'from-amber-500 to-orange-500',
  creative: 'from-cyan-500 to-blue-500', ats: 'from-slate-500 to-zinc-500',
  compact: 'from-indigo-500 to-violet-500', bold: 'from-red-500 to-orange-500',
  elegant: 'from-emerald-500 to-teal-500', professional: 'from-blue-500 to-indigo-500',
};

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '\u2014';
  try { return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); }
  catch { return '\u2014'; }
}

/* Profile Completion */
function ProfileCompletionBar({ data }: { data: ProfileData }) {
  const checks = [
    !!data.name, !!data.email, !!data.phone, !!data.linkedin, !!data.location,
    !!data.targetRole, data.preferredLocations.length > 0,
    !!data.experienceLevel, !!data.workMode, data.skills.length >= 3,
  ];
  const filled = checks.filter(Boolean).length;
  const pct = Math.round((filled / checks.length) * 100);
  return (
    <div className="glass-card rounded-2xl p-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 flex items-center justify-center"><i className="ri-bar-chart-grouped-line text-teal-500 text-base" /></div>
          <span className="text-sm font-bold text-slate-800">Profile Completion</span>
        </div>
        <span className={`text-sm font-extrabold ${pct === 100 ? 'text-emerald-500' : 'text-teal-600'}`}>{pct}%</span>
      </div>
      <div className="h-2 rounded-full overflow-hidden mb-3" style={{ background: 'rgba(255,255,255,0.45)', backdropFilter: 'blur(4px)' }}>
        <div className={`h-full rounded-full transition-all duration-700 ${pct === 100 ? 'bg-emerald-500' : 'bg-gradient-to-r from-teal-500 to-emerald-400'}`} style={{ width: `${pct}%` }} />
      </div>
      <p className="text-xs text-slate-400">
        {pct === 100
          ? "\ud83c\udf89 Your profile is 100% complete \u2014 you're getting the best job matches!"
          : `Complete your profile to unlock better job matches. ${checks.length - filled} item${checks.length - filled !== 1 ? 's' : ''} remaining.`}
      </p>
    </div>
  );
}

function InfoCard({ title, icon, children, onEdit }: { title: string; icon: string; children: React.ReactNode; onEdit: () => void }) {
  return (
    <div className="glass-card rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/40">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-teal-50 flex items-center justify-center"><i className={`${icon} text-teal-500 text-base`} /></div>
          <span className="text-sm font-extrabold text-slate-800">{title}</span>
        </div>
        <button onClick={onEdit} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-500 hover:text-teal-600 hover:bg-teal-50/60 transition-all cursor-pointer whitespace-nowrap">
          <i className="ri-edit-2-line text-xs" />Edit
        </button>
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  );
}

/* Loading Skeleton */
function ProfileSkeleton() {
  return (
    <div className="min-h-screen mesh-bg">
      <Navbar />
      <div className="pt-28 pb-16 px-4 max-w-5xl mx-auto">
        <div className="mb-6 animate-pulse">
          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
            <div className="h-28 bg-gradient-to-r from-teal-200 to-emerald-200" />
            <div className="px-8 pb-7">
              <div className="flex items-end justify-between -mt-10 mb-5">
                <div className="w-20 h-20 rounded-2xl bg-slate-200 border-4 border-white" />
                <div className="w-28 h-10 rounded-xl bg-slate-200" />
              </div>
              <div className="h-6 w-48 bg-slate-200 rounded mb-2" />
              <div className="h-4 w-32 bg-slate-100 rounded" />
            </div>
          </div>
        </div>
        <div className="h-14 glass-card rounded-2xl mb-6 animate-pulse" />
        <div className="grid grid-cols-3 gap-6 animate-pulse">
          <div className="col-span-1 space-y-5">
            <div className="glass-card rounded-2xl h-32" />
            <div className="glass-card rounded-2xl h-48" />
          </div>
          <div className="col-span-2 space-y-5">
            <div className="glass-card rounded-2xl h-40" />
            <div className="glass-card rounded-2xl h-40" />
          </div>
        </div>
      </div>
    </div>
  );
}

/* Auth Wall */
function AuthWall() {
  return (
    <div className="min-h-screen mesh-bg">
      <Navbar />
      <div className="pt-28 pb-16 px-4 max-w-xl mx-auto text-center">
        <div className="glass-card rounded-2xl p-12">
          <div className="w-16 h-16 rounded-2xl bg-teal-50 flex items-center justify-center mx-auto mb-5">
            <i className="ri-lock-line text-3xl text-teal-500" />
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 mb-2">Sign in to view your profile</h2>
          <p className="text-sm text-slate-400 mb-6">Log in or create an account to access your profile, resumes, and job applications.</p>
          <Link to="/auth/login" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 text-white text-sm font-bold hover:from-teal-600 hover:to-emerald-600 transition-all shadow-sm shadow-teal-200">
            <i className="ri-login-box-line text-base" />Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}

/* Resumes Tab */
function ResumesTab({ resumes, loading, onDelete }: { resumes: ResumeEntry[]; loading: boolean; onDelete: (id: number) => void }) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-4 animate-pulse">
        {[1,2,3,4].map(i => (<div key={i} className="glass-card rounded-2xl h-64" />))}
      </div>
    );
  }
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-bold text-slate-700">{resumes.length} resume{resumes.length !== 1 ? 's' : ''} created</p>
          <p className="text-xs text-slate-400 mt-0.5">AI-tailored resumes for each application</p>
        </div>
        <Link to="/resume-builder" className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 text-white text-sm font-bold hover:from-teal-600 hover:to-emerald-600 transition-all cursor-pointer shadow-sm shadow-teal-200 whitespace-nowrap">
          <div className="w-4 h-4 flex items-center justify-center"><i className="ri-add-line text-sm" /></div>New Resume
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {resumes.map((resume) => {
          const tpl = (resume.template_name || 'modern').toLowerCase();
          const color = templateColors[tpl] || 'from-teal-500 to-emerald-500';
          return (
            <div key={resume.id} className="glass-card rounded-2xl overflow-hidden hover:shadow-md transition-all group">
              <div className={`h-24 bg-gradient-to-br ${color} relative flex items-center justify-center`}>
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 18px, rgba(255,255,255,0.3) 18px, rgba(255,255,255,0.3) 19px), repeating-linear-gradient(90deg, transparent, transparent 60px, rgba(255,255,255,0.15) 60px, rgba(255,255,255,0.15) 61px)' }} />
                <div className="bg-white/20 backdrop-blur-sm rounded-xl px-5 py-3 text-center">
                  <p className="text-white font-extrabold text-sm capitalize">{resume.template_name || 'Resume'}</p>
                  <p className="text-white/70 text-[10px] font-semibold">{resume.file_format?.toUpperCase() || 'Template'}</p>
                </div>
                {resume.ats_score != null && (
                  <div className="absolute top-3 right-3 bg-white rounded-lg px-2.5 py-1 shadow-sm">
                    <span className="text-xs font-extrabold text-emerald-600">{Math.round(resume.ats_score)}% ATS</span>
                  </div>
                )}
              </div>
              <div className="p-5">
                <p className="text-sm font-extrabold text-slate-900 mb-0.5 truncate">{resume.title}</p>
                {resume.original_filename && <p className="text-xs text-slate-500 font-semibold truncate mb-3">{resume.original_filename}</p>}
                <div className="flex items-center gap-3 text-[11px] text-slate-400 mb-4">
                  <span className="flex items-center gap-1"><i className="ri-calendar-line text-xs" />Created {formatDate(resume.created_at)}</span>
                  {resume.updated_at && <span className="flex items-center gap-1"><i className="ri-edit-line text-xs" />Edited {formatDate(resume.updated_at)}</span>}
                </div>
                <div className="flex items-center gap-2">
                  <Link to={`/optimized-resume?resumeId=${resume.id}`} className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-700 transition-all cursor-pointer whitespace-nowrap">
                    <i className="ri-eye-line text-xs" />View
                  </Link>
                  <button onClick={() => onDelete(resume.id)} className="w-8 h-8 flex items-center justify-center rounded-xl glass text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all cursor-pointer">
                    <i className="ri-delete-bin-line text-sm" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        <Link to="/resume-builder" className="glass-card rounded-2xl border-2 border-dashed border-slate-200 hover:border-teal-300 hover:bg-teal-50/30 transition-all cursor-pointer flex flex-col items-center justify-center gap-3 p-8 min-h-[220px] group">
          <div className="w-12 h-12 rounded-2xl bg-teal-50 group-hover:bg-teal-100 flex items-center justify-center transition-all">
            <i className="ri-add-line text-2xl text-teal-500" />
          </div>
          <div className="text-center">
            <p className="text-sm font-bold text-slate-600 group-hover:text-teal-700 transition-colors">Create New Resume</p>
            <p className="text-xs text-slate-400 mt-0.5">AI-tailored for any job</p>
          </div>
        </Link>
      </div>
    </div>
  );
}

/* Applications Tab */
const statusConfig: Record<string, { label: string; color: string; icon: string }> = {
  applied:      { label: 'Applied',      color: 'bg-blue-50 text-blue-700 border-blue-100',     icon: 'ri-send-plane-fill' },
  in_review:    { label: 'In Review',    color: 'bg-amber-50 text-amber-700 border-amber-100',  icon: 'ri-eye-line' },
  shortlisted:  { label: 'Shortlisted',  color: 'bg-purple-50 text-purple-700 border-purple-100', icon: 'ri-star-line' },
  interviewing: { label: 'Interviewing', color: 'bg-indigo-50 text-indigo-700 border-indigo-100', icon: 'ri-video-chat-line' },
  offered:      { label: 'Offered',      color: 'bg-emerald-50 text-emerald-700 border-emerald-100', icon: 'ri-gift-line' },
  hired:        { label: 'Hired',        color: 'bg-green-50 text-green-700 border-green-100',  icon: 'ri-checkbox-circle-fill' },
  rejected:     { label: 'Rejected',     color: 'bg-red-50 text-red-700 border-red-100',        icon: 'ri-close-circle-line' },
};

function ApplicationsTab({ applications, loading }: { applications: ApplicationEntry[]; loading: boolean }) {
  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        {[1,2,3].map(i => (<div key={i} className="glass-card rounded-2xl h-32" />))}
      </div>
    );
  }

  if (applications.length === 0) {
    return (
      <div className="glass-card rounded-2xl p-12 text-center">
        <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
          <i className="ri-briefcase-line text-3xl text-slate-300" />
        </div>
        <h3 className="text-lg font-extrabold text-slate-800 mb-2">No applications yet</h3>
        <p className="text-sm text-slate-400 mb-6">Browse open positions and apply to start tracking your progress.</p>
        <Link to="/jobs" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 text-white text-sm font-bold hover:from-teal-600 hover:to-emerald-600 transition-all shadow-sm shadow-teal-200">
          <i className="ri-search-line text-base" />Browse Jobs
        </Link>
      </div>
    );
  }

  const formatSalary = (app: ApplicationEntry) => {
    const sym = app.currency === 'INR' ? '₹' : app.currency === 'EUR' ? '€' : app.currency === 'GBP' ? '£' : '$';
    const fmt = (n: number) => app.currency === 'INR' ? `${(n / 100000).toFixed(1)}L` : `${(n / 1000).toFixed(0)}k`;
    if (app.salary_min && app.salary_max) return `${sym}${fmt(app.salary_min)} - ${sym}${fmt(app.salary_max)}`;
    if (app.salary_min) return `${sym}${fmt(app.salary_min)}+`;
    if (app.salary_max) return `Up to ${sym}${fmt(app.salary_max)}`;
    return null;
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-bold text-slate-700">{applications.length} application{applications.length !== 1 ? 's' : ''}</p>
          <p className="text-xs text-slate-400 mt-0.5">Track your job application status</p>
        </div>
        <Link to="/jobs" className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 text-white text-sm font-bold hover:from-teal-600 hover:to-emerald-600 transition-all cursor-pointer shadow-sm shadow-teal-200 whitespace-nowrap">
          <div className="w-4 h-4 flex items-center justify-center"><i className="ri-search-line text-sm" /></div>Browse Jobs
        </Link>
      </div>

      <div className="space-y-3">
        {applications.map((app) => {
          const st = statusConfig[app.status] || statusConfig.applied;
          const salary = formatSalary(app);
          return (
            <Link
              key={app.id}
              to={`/jobs/${app.job_id}`}
              className="glass-card rounded-2xl p-5 hover:shadow-md transition-all block group"
            >
              <div className="flex items-start gap-4">
                {/* Company Logo */}
                <div className="w-14 h-14 flex-shrink-0">
                  {app.company_logo_url ? (
                    <img src={app.company_logo_url} alt={app.company_name || ''} className="w-full h-full object-cover rounded-xl" />
                  ) : (
                    <div className="w-full h-full rounded-xl bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center">
                      <span className="text-white font-bold text-xl">{(app.company_name || 'C')[0].toUpperCase()}</span>
                    </div>
                  )}
                </div>

                {/* Job Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="text-sm font-extrabold text-slate-900 group-hover:text-teal-700 transition-colors truncate">
                        {app.job_title || 'Untitled Position'}
                      </h3>
                      <p className="text-xs font-semibold text-slate-500 mt-0.5">{app.company_name}</p>
                    </div>
                    {/* Status Badge */}
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border flex-shrink-0 ${st.color}`}>
                      <i className={`${st.icon} text-xs`} />
                      {st.label}
                    </span>
                  </div>

                  {/* Meta */}
                  <div className="flex flex-wrap items-center gap-3 mt-2.5 text-xs text-slate-400">
                    {app.job_location && (
                      <span className="flex items-center gap-1">
                        <i className="ri-map-pin-line text-xs" />{app.job_location}
                      </span>
                    )}
                    {app.job_type && (
                      <span className="flex items-center gap-1">
                        <i className="ri-briefcase-line text-xs" />{app.job_type}
                      </span>
                    )}
                    {salary && (
                      <span className="flex items-center gap-1">
                        <i className="ri-money-dollar-circle-line text-xs" />{salary}
                      </span>
                    )}
                    {app.remote_policy && (
                      <span className="flex items-center gap-1">
                        <i className="ri-home-wifi-line text-xs" />{app.remote_policy}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <i className="ri-calendar-line text-xs" />Applied {formatDate(app.applied_at)}
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<ProfileData>(EMPTY_PROFILE);
  const [resumes, setResumes] = useState<ResumeEntry[]>([]);
  const [applications, setApplications] = useState<ApplicationEntry[]>([]);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [savedBanner, setSavedBanner] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>('profile');
  const [loading, setLoading] = useState(true);
  const [resumesLoading, setResumesLoading] = useState(true);
  const [applicationsLoading, setApplicationsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const isLoggedIn = apiService.isAuthenticated();

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiService.getProfile();
      if (result.success && result.profile) {
        const p = result.profile;
        setProfile({
          name: p.full_name || '',
          email: p.email || '',
          phone: p.phone || '',
          linkedin: p.linkedin_url || '',
          location: p.location || '',
          targetRole: p.target_role || '',
          preferredLocations: p.preferred_locations || [],
          experienceLevel: p.experience_level || '',
          workMode: p.work_mode || '',
          skills: (p.skills || []).map((s: any) => ({ name: s.name, years: s.years || 0 })),
        });
      } else {
        setError(result.error || 'Failed to load profile');
      }
    } catch {
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchResumes = useCallback(async () => {
    setResumesLoading(true);
    try {
      const result = await apiService.listResumes();
      if (result.success && result.resumes) setResumes(result.resumes);
    } catch { /* silent */ }
    finally { setResumesLoading(false); }
  }, []);

  const fetchApplications = useCallback(async () => {
    setApplicationsLoading(true);
    try {
      const result = await apiService.getMyRecruiterApplications();
      if (result.success && result.applications) setApplications(result.applications);
    } catch { /* silent */ }
    finally { setApplicationsLoading(false); }
  }, []);

  useEffect(() => {
    if (!isLoggedIn) return;
    fetchProfile();
    fetchResumes();
    fetchApplications();
  }, [isLoggedIn, fetchProfile, fetchResumes, fetchApplications]);

  const handleSave = async (updated: ProfileData) => {
    setSaving(true);
    try {
      const result = await apiService.updateProfile({
        full_name: updated.name,
        phone: updated.phone,
        location: updated.location,
        linkedin_url: updated.linkedin,
        target_role: updated.targetRole,
        experience_level: updated.experienceLevel,
        work_mode: updated.workMode,
        preferred_locations: updated.preferredLocations,
        skills: updated.skills.map(s => ({ name: s.name, years: s.years })),
      });
      if (result.success) {
        setProfile(updated);
        setIsEditOpen(false);
        setSavedBanner(true);
        setTimeout(() => setSavedBanner(false), 3000);
      } else {
        alert(result.error || 'Failed to save profile');
      }
    } catch {
      alert('Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteResume = async (resumeId: number) => {
    if (!confirm('Delete this resume? This cannot be undone.')) return;
    const result = await apiService.deleteResume(resumeId);
    if (result.success) setResumes(prev => prev.filter(r => r.id !== resumeId));
  };

  if (!isLoggedIn) return <AuthWall />;
  if (loading) return <ProfileSkeleton />;

  if (error) {
    return (
      <div className="min-h-screen mesh-bg">
        <Navbar />
        <div className="pt-28 pb-16 px-4 max-w-xl mx-auto text-center">
          <div className="glass-card rounded-2xl p-12">
            <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-5">
              <i className="ri-error-warning-line text-3xl text-red-400" />
            </div>
            <h2 className="text-xl font-extrabold text-slate-900 mb-2">Couldn't load profile</h2>
            <p className="text-sm text-slate-400 mb-6">{error}</p>
            <button onClick={fetchProfile} className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-900 text-white text-sm font-bold hover:bg-slate-700 transition-all">
              <i className="ri-refresh-line text-base" />Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  const expInfo = expLevelLabels[profile.experienceLevel];
  const workInfo = workModeLabels[profile.workMode];

  const tabs: { key: TabKey; label: string; icon: string; count?: number }[] = [
    { key: 'resumes', label: 'My Resumes', icon: 'ri-file-text-line', count: resumes.length },
    { key: 'applications', label: 'Applied Jobs', icon: 'ri-briefcase-line', count: applications.length },
    { key: 'profile', label: 'Profile', icon: 'ri-user-3-line' },
  ];

  return (
    <div className="min-h-screen mesh-bg">
      <Navbar />
      <div className="pt-28 pb-16 px-4 max-w-5xl mx-auto">

        {savedBanner && (
          <div className="mb-5 flex items-center gap-3 px-5 py-3.5 glass-strong border border-emerald-200/60 rounded-2xl animate-fade-in-up">
            <div className="w-5 h-5 flex items-center justify-center">
              <i className="ri-checkbox-circle-fill text-emerald-500 text-lg" />
            </div>
            <p className="text-sm font-semibold text-emerald-700">Profile updated successfully!</p>
            <button onClick={() => setSavedBanner(false)} className="ml-auto w-5 h-5 flex items-center justify-center text-emerald-400 hover:text-emerald-600 cursor-pointer">
              <i className="ri-close-line text-sm" />
            </button>
          </div>
        )}

        <div className="flex items-center gap-2 text-xs text-slate-400 mb-6">
          <Link to="/" className="hover:text-teal-600 transition-colors cursor-pointer">Home</Link>
          <i className="ri-arrow-right-s-line text-slate-300" />
          <span className="text-slate-600 font-semibold">My Profile</span>
        </div>

        <div className="mb-6">
          <ProfileHeader name={profile.name} email={profile.email} location={profile.location} targetRole={profile.targetRole} experienceLevel={profile.experienceLevel} onEdit={() => setIsEditOpen(true)} />
        </div>

        <div className="flex items-center gap-1 mb-6 glass-card rounded-2xl p-1.5">
          {tabs.map((tab) => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${activeTab === tab.key ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400 hover:text-slate-700'}`}>
              <div className="w-4 h-4 flex items-center justify-center"><i className={`${tab.icon} text-sm`} /></div>
              {tab.label}
              {tab.count !== undefined && (
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold ${activeTab === tab.key ? 'bg-teal-500 text-white' : 'bg-slate-100 text-slate-400'}`}>{tab.count}</span>
              )}
            </button>
          ))}
        </div>

        {activeTab === 'resumes' && <ResumesTab resumes={resumes} loading={resumesLoading} onDelete={handleDeleteResume} />}

        {activeTab === 'applications' && <ApplicationsTab applications={applications} loading={applicationsLoading} />}

        {activeTab === 'profile' && (
          <div className="grid grid-cols-3 gap-6">
            {/* Left sidebar */}
            <div className="col-span-1 space-y-5">
              <ProfileCompletionBar data={profile} />

              <div className="glass-card rounded-2xl p-5 space-y-2">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Quick Actions</p>
                <Link to="/resume-builder" className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 text-white text-sm font-semibold hover:from-teal-600 hover:to-emerald-600 transition-all cursor-pointer shadow-sm shadow-teal-200">
                  <div className="w-5 h-5 flex items-center justify-center"><i className="ri-magic-line text-base" /></div>
                  Build AI Resume
                  <div className="ml-auto w-4 h-4 flex items-center justify-center"><i className="ri-arrow-right-line text-sm" /></div>
                </Link>
                <button onClick={() => setIsEditOpen(true)} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl glass text-slate-700 text-sm font-semibold hover:bg-white/80 transition-all cursor-pointer">
                  <div className="w-5 h-5 flex items-center justify-center"><i className="ri-edit-2-line text-base text-slate-400" /></div>
                  Edit Profile
                </button>
                <Link to="/onboarding" className="flex items-center gap-3 px-4 py-3 rounded-xl glass text-slate-700 text-sm font-semibold hover:bg-white/80 transition-all cursor-pointer">
                  <div className="w-5 h-5 flex items-center justify-center"><i className="ri-refresh-line text-base text-slate-400" /></div>
                  Redo Onboarding
                </Link>
              </div>

              <div className="glass-card rounded-2xl p-5 space-y-3">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Career Snapshot</p>
                {profile.targetRole ? (
                  <>
                    <div className="flex items-center gap-3 p-3 glass rounded-xl">
                      <div className="w-8 h-8 flex items-center justify-center bg-teal-100 rounded-lg">
                        <i className="ri-briefcase-4-line text-teal-600 text-sm" />
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide">Target Role</p>
                        <p className="text-sm font-bold text-slate-800">{profile.targetRole}</p>
                      </div>
                    </div>
                    {expInfo && (
                      <div className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border ${expInfo.color}`}>
                        <div className="w-4 h-4 flex items-center justify-center"><i className={`${expInfo.icon} text-sm`} /></div>
                        <span className="text-xs font-bold">{expInfo.label}</span>
                      </div>
                    )}
                    {workInfo && (
                      <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl glass text-slate-600">
                        <div className="w-4 h-4 flex items-center justify-center"><i className={`${workInfo.icon} text-sm`} /></div>
                        <span className="text-xs font-bold">{workInfo.label}</span>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-4">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center mx-auto mb-2">
                      <i className="ri-focus-3-line text-xl text-slate-300" />
                    </div>
                    <p className="text-xs text-slate-400 mb-2">No career target set yet.</p>
                    <button onClick={() => setIsEditOpen(true)} className="text-xs font-bold text-teal-600 hover:text-teal-700 cursor-pointer">+ Set Target Role</button>
                  </div>
                )}
              </div>
            </div>

            {/* Right content */}
            <div className="col-span-2 space-y-5">
              <InfoCard title="Personal Information" icon="ri-user-3-line" onEdit={() => setIsEditOpen(true)}>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: 'Full Name', value: profile.name, icon: 'ri-user-3-line' },
                    { label: 'Email', value: profile.email, icon: 'ri-mail-line' },
                    { label: 'Phone', value: profile.phone, icon: 'ri-phone-line' },
                    { label: 'Location', value: profile.location, icon: 'ri-map-pin-2-line' },
                  ].map((item) => (
                    <div key={item.label} className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg glass flex items-center justify-center flex-shrink-0 mt-0.5">
                        <i className={`${item.icon} text-slate-400 text-sm`} />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{item.label}</p>
                        <p className="text-sm font-semibold text-slate-800 mt-0.5">
                          {item.value || <span className="text-slate-300 font-normal italic">Not set</span>}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div className="col-span-2 flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#e8f0f9] border border-[#b3cce8] flex items-center justify-center flex-shrink-0 mt-0.5">
                      <i className="ri-linkedin-fill text-[#0A66C2] text-sm" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">LinkedIn</p>
                      {profile.linkedin ? (
                        <a href={profile.linkedin.startsWith('http') ? profile.linkedin : `https://${profile.linkedin}`} target="_blank" rel="nofollow noopener noreferrer" className="text-sm font-semibold text-[#0A66C2] hover:underline mt-0.5 block">
                          {profile.linkedin}
                        </a>
                      ) : (
                        <p className="text-sm text-slate-300 italic mt-0.5">Not set</p>
                      )}
                    </div>
                  </div>
                </div>
              </InfoCard>

              <InfoCard title="Career Target" icon="ri-focus-3-line" onEdit={() => setIsEditOpen(true)}>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg glass flex items-center justify-center flex-shrink-0 mt-0.5">
                      <i className="ri-briefcase-4-line text-slate-400 text-sm" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Target Role</p>
                      <p className="text-sm font-semibold text-slate-800 mt-0.5">
                        {profile.targetRole || <span className="text-slate-300 font-normal italic">Not set</span>}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg glass flex items-center justify-center flex-shrink-0 mt-0.5">
                        <i className={`${expInfo?.icon || 'ri-award-line'} text-slate-400 text-sm`} />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Experience Level</p>
                        <p className="text-sm font-semibold text-slate-800 mt-0.5">
                          {expInfo?.label || <span className="text-slate-300 font-normal italic">Not set</span>}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg glass flex items-center justify-center flex-shrink-0 mt-0.5">
                        <i className={`${workInfo?.icon || 'ri-building-2-line'} text-slate-400 text-sm`} />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Work Mode</p>
                        <p className="text-sm font-semibold text-slate-800 mt-0.5">
                          {workInfo?.label || <span className="text-slate-300 font-normal italic">Not set</span>}
                        </p>
                      </div>
                    </div>
                  </div>
                  {profile.preferredLocations.length > 0 && (
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-2">Preferred Locations</p>
                      <div className="flex flex-wrap gap-2">
                        {profile.preferredLocations.map((loc) => (
                          <span key={loc} className="inline-flex items-center gap-1.5 px-3 py-1.5 glass text-teal-700 text-xs font-semibold rounded-lg">
                            <i className="ri-map-pin-line text-xs" />{loc}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </InfoCard>

              <InfoCard title="Skills & Expertise" icon="ri-sparkling-2-line" onEdit={() => setIsEditOpen(true)}>
                {profile.skills.length === 0 ? (
                  <div className="text-center py-6">
                    <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
                      <i className="ri-sparkling-2-line text-2xl text-slate-300" />
                    </div>
                    <p className="text-sm text-slate-400 mb-2">No skills added yet.</p>
                    <button onClick={() => setIsEditOpen(true)} className="text-xs font-bold text-teal-600 hover:text-teal-700 cursor-pointer">+ Add Skills</button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {profile.skills.map((skill) => {
                      const pct = Math.round((Math.min(skill.years, 10) / 10) * 100);
                      return (
                        <div key={skill.name} className="flex items-center gap-4">
                          <div className="w-36 flex-shrink-0">
                            <p className="text-sm font-semibold text-slate-800 truncate">{skill.name}</p>
                            <p className="text-[10px] text-slate-400">{expYearLabels[Math.min(skill.years, 10)]}</p>
                          </div>
                          <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.5)', backdropFilter: 'blur(4px)' }}>
                            <div className="h-full bg-gradient-to-r from-teal-400 to-emerald-400 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-xs font-bold text-slate-400 w-8 text-right flex-shrink-0">{pct}%</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </InfoCard>
            </div>
          </div>
        )}
      </div>

      {isEditOpen && (
        <ProfileEditModal
          data={profile}
          onSave={handleSave}
          onClose={() => setIsEditOpen(false)}
          saving={saving}
        />
      )}

      <style>{`
        @keyframes fade-in { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fade-in 0.3s ease forwards; }
      `}</style>
    </div>
  );
}


import { useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/feature/Navbar';
import ProfileHeader from './components/ProfileHeader';
import ProfileEditModal from './components/ProfileEditModal';

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

interface AppliedJob {
  id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  appliedDate: string;
  status: 'applied' | 'reviewing' | 'interview' | 'offer' | 'rejected';
  logo: string;
  salary: string;
}

interface ResumeEntry {
  id: string;
  name: string;
  template: string;
  targetRole: string;
  createdDate: string;
  lastModified: string;
  matchScore: number;
  color: string;
}

const MOCK_APPLIED_JOBS: AppliedJob[] = [
  {
    id: '1',
    title: 'Senior Product Manager',
    company: 'Stripe',
    location: 'San Francisco, CA',
    type: 'Hybrid',
    appliedDate: 'Jun 12, 2025',
    status: 'interview',
    logo: 'S',
    salary: '$160k–$200k',
  },
  {
    id: '2',
    title: 'Product Manager, Growth',
    company: 'Notion',
    location: 'Remote',
    type: 'Remote',
    appliedDate: 'Jun 10, 2025',
    status: 'reviewing',
    logo: 'N',
    salary: '$140k–$175k',
  },
  {
    id: '3',
    title: 'Lead Product Manager',
    company: 'Figma',
    location: 'New York, NY',
    type: 'On-site',
    appliedDate: 'Jun 7, 2025',
    status: 'applied',
    logo: 'F',
    salary: '$170k–$210k',
  },
  {
    id: '4',
    title: 'Principal PM – Platform',
    company: 'Vercel',
    location: 'Remote',
    type: 'Remote',
    appliedDate: 'Jun 3, 2025',
    status: 'offer',
    logo: 'V',
    salary: '$180k–$220k',
  },
  {
    id: '5',
    title: 'Product Manager II',
    company: 'Linear',
    location: 'San Francisco, CA',
    type: 'Hybrid',
    appliedDate: 'May 28, 2025',
    status: 'rejected',
    logo: 'L',
    salary: '$130k–$160k',
  },
  {
    id: '6',
    title: 'Senior PM – Developer Tools',
    company: 'GitHub',
    location: 'Remote',
    type: 'Remote',
    appliedDate: 'May 22, 2025',
    status: 'reviewing',
    logo: 'G',
    salary: '$155k–$195k',
  },
];

const MOCK_RESUMES: ResumeEntry[] = [
  {
    id: '1',
    name: 'Stripe – Senior PM',
    template: 'Modern',
    targetRole: 'Senior Product Manager',
    createdDate: 'Jun 12, 2025',
    lastModified: 'Jun 12, 2025',
    matchScore: 96,
    color: 'from-teal-500 to-emerald-500',
  },
  {
    id: '2',
    name: 'Notion – Growth PM',
    template: 'Minimal',
    targetRole: 'Product Manager, Growth',
    createdDate: 'Jun 10, 2025',
    lastModified: 'Jun 11, 2025',
    matchScore: 91,
    color: 'from-violet-500 to-purple-500',
  },
  {
    id: '3',
    name: 'Figma – Lead PM',
    template: 'Executive',
    targetRole: 'Lead Product Manager',
    createdDate: 'Jun 7, 2025',
    lastModified: 'Jun 7, 2025',
    matchScore: 88,
    color: 'from-rose-500 to-pink-500',
  },
  {
    id: '4',
    name: 'General Application',
    template: 'Classic',
    targetRole: 'Senior Product Manager',
    createdDate: 'May 20, 2025',
    lastModified: 'Jun 1, 2025',
    matchScore: 82,
    color: 'from-amber-500 to-orange-500',
  },
];

const statusConfig: Record<AppliedJob['status'], { label: string; color: string; dot: string }> = {
  applied:   { label: 'Applied',    color: 'bg-slate-100 text-slate-600',    dot: 'bg-slate-400' },
  reviewing: { label: 'Reviewing',  color: 'bg-amber-50 text-amber-700',     dot: 'bg-amber-400' },
  interview: { label: 'Interview',  color: 'bg-teal-50 text-teal-700',       dot: 'bg-teal-500' },
  offer:     { label: '🎉 Offer',   color: 'bg-emerald-50 text-emerald-700', dot: 'bg-emerald-500' },
  rejected:  { label: 'Rejected',   color: 'bg-red-50 text-red-600',         dot: 'bg-red-400' },
};

const logoColors: Record<string, string> = {
  S: 'bg-indigo-600', N: 'bg-slate-900', F: 'bg-violet-600',
  V: 'bg-slate-900',  L: 'bg-violet-500', G: 'bg-slate-800',
};

const expLevelLabels: Record<string, { label: string; icon: string; color: string }> = {
  entry: { label: 'Entry Level',    icon: 'ri-seedling-line', color: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
  mid:   { label: 'Mid Level',      icon: 'ri-plant-line',    color: 'text-teal-600 bg-teal-50 border-teal-100' },
  senior:{ label: 'Senior',         icon: 'ri-tree-line',     color: 'text-amber-600 bg-amber-50 border-amber-100' },
  lead:  { label: 'Lead / Manager', icon: 'ri-award-line',    color: 'text-rose-600 bg-rose-50 border-rose-100' },
};

const workModeLabels: Record<string, { label: string; icon: string }> = {
  remote: { label: 'Remote',  icon: 'ri-home-wifi-line' },
  hybrid: { label: 'Hybrid',  icon: 'ri-building-2-line' },
  onsite: { label: 'On-site', icon: 'ri-map-pin-2-line' },
};

const expYearLabels = ['< 1 yr','1 yr','2 yrs','3 yrs','4 yrs','5 yrs','6 yrs','7 yrs','8 yrs','9 yrs','10+ yrs'];

const DEMO_DATA: ProfileData = {
  name: 'Alex Johnson',
  email: 'alex.johnson@example.com',
  phone: '+1 (555) 234-5678',
  linkedin: 'linkedin.com/in/alexjohnson',
  location: 'San Francisco, CA',
  targetRole: 'Senior Product Manager',
  preferredLocations: ['San Francisco', 'New York', 'Remote'],
  experienceLevel: 'senior',
  workMode: 'hybrid',
  skills: [
    { name: 'Product Strategy', years: 6 },
    { name: 'Roadmapping', years: 5 },
    { name: 'User Research', years: 4 },
    { name: 'Agile', years: 7 },
    { name: 'Data Analysis', years: 4 },
    { name: 'Stakeholder Management', years: 5 },
    { name: 'A/B Testing', years: 3 },
    { name: 'SQL', years: 3 },
  ],
};

type TabKey = 'jobs' | 'resumes' | 'profile';

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
          <div className="w-5 h-5 flex items-center justify-center">
            <i className="ri-bar-chart-grouped-line text-teal-500 text-base" />
          </div>
          <span className="text-sm font-bold text-slate-800">Profile Completion</span>
        </div>
        <span className={`text-sm font-extrabold ${pct === 100 ? 'text-emerald-500' : 'text-teal-600'}`}>{pct}%</span>
      </div>
      <div className="h-2 rounded-full overflow-hidden mb-3" style={{ background: 'rgba(255,255,255,0.45)', backdropFilter: 'blur(4px)' }}>
        <div
          className={`h-full rounded-full transition-all duration-700 ${pct === 100 ? 'bg-emerald-500' : 'bg-gradient-to-r from-teal-500 to-emerald-400'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-xs text-slate-400">
        {pct === 100
          ? '🎉 Your profile is 100% complete — you\'re getting the best job matches!'
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
          <div className="w-8 h-8 rounded-xl bg-teal-50 flex items-center justify-center">
            <i className={`${icon} text-teal-500 text-base`} />
          </div>
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

function EmptyState({ message }: { message: string }) {
  return <p className="text-sm text-slate-400 italic">{message}</p>;
}

// ── Applied Jobs Tab ──
function AppliedJobsTab() {
  const [filter, setFilter] = useState<'all' | AppliedJob['status']>('all');

  const filters: { key: 'all' | AppliedJob['status']; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'applied', label: 'Applied' },
    { key: 'reviewing', label: 'Reviewing' },
    { key: 'interview', label: 'Interview' },
    { key: 'offer', label: 'Offer' },
    { key: 'rejected', label: 'Rejected' },
  ];

  const filtered = filter === 'all' ? MOCK_APPLIED_JOBS : MOCK_APPLIED_JOBS.filter((j) => j.status === filter);

  const counts = {
    all: MOCK_APPLIED_JOBS.length,
    applied: MOCK_APPLIED_JOBS.filter((j) => j.status === 'applied').length,
    reviewing: MOCK_APPLIED_JOBS.filter((j) => j.status === 'reviewing').length,
    interview: MOCK_APPLIED_JOBS.filter((j) => j.status === 'interview').length,
    offer: MOCK_APPLIED_JOBS.filter((j) => j.status === 'offer').length,
    rejected: MOCK_APPLIED_JOBS.filter((j) => j.status === 'rejected').length,
  };

  return (
    <div className="space-y-5">
      {/* Stats row */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total Applied', value: MOCK_APPLIED_JOBS.length, icon: 'ri-send-plane-line', color: 'text-teal-600 bg-teal-50' },
          { label: 'In Progress', value: counts.reviewing + counts.interview, icon: 'ri-loader-4-line', color: 'text-amber-600 bg-amber-50' },
          { label: 'Interviews', value: counts.interview, icon: 'ri-calendar-check-line', color: 'text-violet-600 bg-violet-50' },
          { label: 'Offers', value: counts.offer, icon: 'ri-trophy-line', color: 'text-emerald-600 bg-emerald-50' },
        ].map((stat) => (
          <div key={stat.label} className="glass-card rounded-2xl p-5 flex items-center gap-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stat.color}`}>
              <i className={`${stat.icon} text-lg`} />
            </div>
            <div>
              <p className="text-2xl font-extrabold text-slate-900">{stat.value}</p>
              <p className="text-xs text-slate-400 font-semibold">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-2 flex-wrap">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              filter === f.key
                ? 'bg-slate-900 text-white shadow-sm'
                : 'glass text-slate-500 hover:text-slate-800'
            }`}
          >
            {f.label}
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-extrabold ${filter === f.key ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>
              {counts[f.key]}
            </span>
          </button>
        ))}
      </div>

      {/* Job list */}
      <div className="space-y-3">
        {filtered.map((job) => {
          const st = statusConfig[job.status];
          return (
            <div key={job.id} className="glass-card rounded-2xl p-5 flex items-center gap-5 hover:shadow-md transition-all">
              {/* Logo */}
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-extrabold text-lg flex-shrink-0 ${logoColors[job.logo] || 'bg-slate-700'}`}>
                {job.logo}
              </div>
              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="text-sm font-extrabold text-slate-900 truncate">{job.title}</p>
                </div>
                <p className="text-sm font-semibold text-slate-500">{job.company}</p>
                <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                  <span className="flex items-center gap-1 text-xs text-slate-400">
                    <i className="ri-map-pin-line text-xs" />{job.location}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-slate-400">
                    <i className="ri-building-2-line text-xs" />{job.type}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-slate-400">
                    <i className="ri-money-dollar-circle-line text-xs" />{job.salary}
                  </span>
                </div>
              </div>
              {/* Right side */}
              <div className="flex flex-col items-end gap-2 flex-shrink-0">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${st.color}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                  {st.label}
                </span>
                <span className="text-[11px] text-slate-400 font-semibold">Applied {job.appliedDate}</span>
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="glass-card rounded-2xl p-12 text-center">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <i className="ri-briefcase-line text-2xl text-slate-300" />
          </div>
          <p className="text-sm font-semibold text-slate-400">No jobs in this category yet.</p>
        </div>
      )}
    </div>
  );
}

// ── Resumes Tab ──
function ResumesTab() {
  return (
    <div className="space-y-5">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-bold text-slate-700">{MOCK_RESUMES.length} resumes created</p>
          <p className="text-xs text-slate-400 mt-0.5">AI-tailored resumes for each application</p>
        </div>
        <Link
          to="/resume-builder"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 text-white text-sm font-bold hover:from-teal-600 hover:to-emerald-600 transition-all cursor-pointer shadow-sm shadow-teal-200 whitespace-nowrap"
        >
          <div className="w-4 h-4 flex items-center justify-center">
            <i className="ri-add-line text-sm" />
          </div>
          New Resume
        </Link>
      </div>

      {/* Resume cards */}
      <div className="grid grid-cols-2 gap-4">
        {MOCK_RESUMES.map((resume) => (
          <div key={resume.id} className="glass-card rounded-2xl overflow-hidden hover:shadow-md transition-all group">
            {/* Preview banner */}
            <div className={`h-24 bg-gradient-to-br ${resume.color} relative flex items-center justify-center`}>
              <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 18px, rgba(255,255,255,0.3) 18px, rgba(255,255,255,0.3) 19px), repeating-linear-gradient(90deg, transparent, transparent 60px, rgba(255,255,255,0.15) 60px, rgba(255,255,255,0.15) 61px)' }} />
              <div className="bg-white/20 backdrop-blur-sm rounded-xl px-5 py-3 text-center">
                <p className="text-white font-extrabold text-sm">{resume.template}</p>
                <p className="text-white/70 text-[10px] font-semibold">Template</p>
              </div>
              {/* Match score badge */}
              <div className="absolute top-3 right-3 bg-white rounded-lg px-2.5 py-1 shadow-sm">
                <span className="text-xs font-extrabold text-emerald-600">{resume.matchScore}% match</span>
              </div>
            </div>

            {/* Info */}
            <div className="p-5">
              <p className="text-sm font-extrabold text-slate-900 mb-0.5 truncate">{resume.name}</p>
              <p className="text-xs text-slate-500 font-semibold truncate mb-3">{resume.targetRole}</p>
              <div className="flex items-center gap-3 text-[11px] text-slate-400 mb-4">
                <span className="flex items-center gap-1">
                  <i className="ri-calendar-line text-xs" />Created {resume.createdDate}
                </span>
                <span className="flex items-center gap-1">
                  <i className="ri-edit-line text-xs" />Edited {resume.lastModified}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  to="/optimized-resume"
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-700 transition-all cursor-pointer whitespace-nowrap"
                >
                  <i className="ri-eye-line text-xs" />View
                </Link>
                <button className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl glass text-slate-600 text-xs font-bold hover:bg-white/80 transition-all cursor-pointer whitespace-nowrap">
                  <i className="ri-download-line text-xs" />Download
                </button>
                <button className="w-8 h-8 flex items-center justify-center rounded-xl glass text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all cursor-pointer">
                  <i className="ri-delete-bin-line text-sm" />
                </button>
              </div>
            </div>
          </div>
        ))}

        {/* Empty add card */}
        <Link
          to="/resume-builder"
          className="glass-card rounded-2xl border-2 border-dashed border-slate-200 hover:border-teal-300 hover:bg-teal-50/30 transition-all cursor-pointer flex flex-col items-center justify-center gap-3 p-8 min-h-[220px] group"
        >
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

export default function ProfilePage() {
  const [profile, setProfile] = useState<ProfileData>(DEMO_DATA);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [savedBanner, setSavedBanner] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>('jobs');

  const handleSave = (updated: ProfileData) => {
    setProfile(updated);
    setSavedBanner(true);
    setTimeout(() => setSavedBanner(false), 3000);
  };

  const expInfo = expLevelLabels[profile.experienceLevel];
  const workInfo = workModeLabels[profile.workMode];

  const tabs: { key: TabKey; label: string; icon: string; count?: number }[] = [
    { key: 'jobs',    label: 'Applied Jobs',     icon: 'ri-briefcase-line',   count: MOCK_APPLIED_JOBS.length },
    { key: 'resumes', label: 'Resumes Created',  icon: 'ri-file-text-line',   count: MOCK_RESUMES.length },
    { key: 'profile', label: 'Profile',          icon: 'ri-user-3-line' },
  ];

  return (
    <div className="min-h-screen mesh-bg">
      <Navbar />

      <div className="pt-28 pb-16 px-4 max-w-5xl mx-auto">

        {/* Saved Banner */}
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

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-slate-400 mb-6">
          <Link to="/" className="hover:text-teal-600 transition-colors cursor-pointer">Home</Link>
          <i className="ri-arrow-right-s-line text-slate-300" />
          <span className="text-slate-600 font-semibold">My Profile</span>
        </div>

        {/* Profile Header Card */}
        <div className="mb-6">
          <ProfileHeader
            name={profile.name}
            email={profile.email}
            location={profile.location}
            targetRole={profile.targetRole}
            experienceLevel={profile.experienceLevel}
            onEdit={() => setIsEditOpen(true)}
          />
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 mb-6 glass-card rounded-2xl p-1.5">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === tab.key
                  ? 'bg-white shadow-sm text-slate-900'
                  : 'text-slate-400 hover:text-slate-700'
              }`}
            >
              <div className="w-4 h-4 flex items-center justify-center">
                <i className={`${tab.icon} text-sm`} />
              </div>
              {tab.label}
              {tab.count !== undefined && (
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold ${
                  activeTab === tab.key ? 'bg-teal-500 text-white' : 'bg-slate-100 text-slate-400'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'jobs' && <AppliedJobsTab />}
        {activeTab === 'resumes' && <ResumesTab />}

        {activeTab === 'profile' && (
          <div className="grid grid-cols-3 gap-6">
            {/* ── Left Column ── */}
            <div className="col-span-1 space-y-5">
              <ProfileCompletionBar data={profile} />

              {/* Quick Actions */}
              <div className="glass-card rounded-2xl p-5 space-y-2">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Quick Actions</p>
                <Link
                  to="/resume-builder"
                  className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 text-white text-sm font-semibold hover:from-teal-600 hover:to-emerald-600 transition-all cursor-pointer shadow-sm shadow-teal-200"
                >
                  <div className="w-5 h-5 flex items-center justify-center">
                    <i className="ri-magic-line text-base" />
                  </div>
                  Build AI Resume
                  <div className="ml-auto w-4 h-4 flex items-center justify-center">
                    <i className="ri-arrow-right-line text-sm" />
                  </div>
                </Link>
                <button
                  onClick={() => setIsEditOpen(true)}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl glass text-slate-700 text-sm font-semibold hover:bg-white/80 transition-all cursor-pointer"
                >
                  <div className="w-5 h-5 flex items-center justify-center">
                    <i className="ri-edit-2-line text-base text-slate-400" />
                  </div>
                  Edit Profile
                </button>
                <Link
                  to="/onboarding"
                  className="flex items-center gap-3 px-4 py-3 rounded-xl glass text-slate-700 text-sm font-semibold hover:bg-white/80 transition-all cursor-pointer"
                >
                  <div className="w-5 h-5 flex items-center justify-center">
                    <i className="ri-refresh-line text-base text-slate-400" />
                  </div>
                  Redo Onboarding
                </Link>
              </div>

              {/* Career Snapshot */}
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
                        <div className="w-4 h-4 flex items-center justify-center">
                          <i className={`${expInfo.icon} text-sm`} />
                        </div>
                        <span className="text-xs font-bold">{expInfo.label}</span>
                      </div>
                    )}
                    {workInfo && (
                      <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl glass text-slate-600">
                        <div className="w-4 h-4 flex items-center justify-center">
                          <i className={`${workInfo.icon} text-sm`} />
                        </div>
                        <span className="text-xs font-bold">{workInfo.label}</span>
                      </div>
                    )}
                  </>
                ) : (
                  <EmptyState message="No career target set yet." />
                )}
              </div>
            </div>

            {/* ── Right Column ── */}
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
                        <p className="text-sm font-semibold text-slate-800 mt-0.5">{item.value || <span className="text-slate-300 font-normal italic">Not set</span>}</p>
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
                        <a href={profile.linkedin.startsWith('http') ? profile.linkedin : `https://${profile.linkedin}`}
                          target="_blank" rel="nofollow noopener noreferrer"
                          className="text-sm font-semibold text-[#0A66C2] hover:underline mt-0.5 block">
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
                      <p className="text-sm font-semibold text-slate-800 mt-0.5">{profile.targetRole || <span className="text-slate-300 font-normal italic">Not set</span>}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg glass flex items-center justify-center flex-shrink-0 mt-0.5">
                        <i className={`${expInfo?.icon || 'ri-award-line'} text-slate-400 text-sm`} />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Experience Level</p>
                        <p className="text-sm font-semibold text-slate-800 mt-0.5">{expInfo?.label || <span className="text-slate-300 font-normal italic">Not set</span>}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg glass flex items-center justify-center flex-shrink-0 mt-0.5">
                        <i className={`${workInfo?.icon || 'ri-building-2-line'} text-slate-400 text-sm`} />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Work Mode</p>
                        <p className="text-sm font-semibold text-slate-800 mt-0.5">{workInfo?.label || <span className="text-slate-300 font-normal italic">Not set</span>}</p>
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

              <InfoCard title="Skills &amp; Expertise" icon="ri-sparkling-2-line" onEdit={() => setIsEditOpen(true)}>
                {profile.skills.length === 0 ? (
                  <EmptyState message="No skills added yet. Edit your profile to add skills." />
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
        <ProfileEditModal data={profile} onSave={handleSave} onClose={() => setIsEditOpen(false)} />
      )}

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in { animation: fade-in 0.3s ease forwards; }
      `}</style>
    </div>
  );
}

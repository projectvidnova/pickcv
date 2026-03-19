import { useState, useMemo, useEffect, Fragment } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/feature/Navbar';
import { resolvePath } from '../../utils/subdomain';
import Footer from '../../components/feature/Footer';
import ShareProfilesModal from './components/ShareProfilesModal';
import SettingsModal from './components/SettingsModal';
import DepartmentsTab from './components/DepartmentsTab';
import COEGroupsTab from './components/COEGroupsTab';
import SkillAnalyticsTab from './components/SkillAnalyticsTab';
import AlertsPanel from './components/AlertsPanel';
import { apiService } from '../../services/api';

// ─── Interfaces ───────────────────────────────────────────────
interface CollegeProfile {
  logo_url: string | null;
  institution_name: string;
  website: string;
  address: string;
  city: string;
  state: string;
  naac_grade: string;
  total_students: number | null;
}

interface StudentResume {
  id: number;
  title: string;
  original_filename: string | null;
  ats_score: number | null;
  is_optimized: boolean;
  file_format: string | null;
  created_at: string;
  updated_at: string | null;
}

interface Student {
  id: number;
  email: string;
  name: string;
  full_name: string | null;
  branch: string;
  graduation_year: number | null;
  status: string;
  has_resume: boolean;
  resume_count: number;
  resumes: StudentResume[];
  skills: string[];
  cgpa: number | null;
  linkedin_url: string | null;
  phone: string | null;
  profile_picture_url: string | null;
  // Phase 1 fields
  department_id: number | null;
  department_name: string | null;
  roll_number: string | null;
  degree_type: string | null;
  current_semester: number | null;
  admission_year: number | null;
  github_url: string | null;
  portfolio_url: string | null;
  resume_score: number | null;
  resume_status: string | null;
  interview_readiness_score: number | null;
  placement_status: string | null;
  placed_company: string | null;
  placed_role: string | null;
  placed_salary_lpa: number | null;
  skill_details: Array<{ skill_name: string; proficiency: number; category: string }>;
  coe_groups: Array<{ id: number; name: string; code: string }>;
}

interface StudentStats {
  total: number;
  invited: number;
  registered: number;
  ready: number;
  avg_cgpa?: number | null;
  department_breakdown?: Record<string, number>;
  placement_stats?: {
    not_placed: number;
    placed: number;
    in_process: number;
    higher_studies: number;
    not_interested: number;
    avg_salary_lpa: number | null;
    placement_rate: number | null;
  };
  resume_stats?: {
    no_resume: number;
    uploaded: number;
    optimized: number;
    avg_score: number | null;
  };
  coe_stats?: {
    total_groups: number;
    total_memberships: number;
  };
  alerts_count?: number;
}

interface Department {
  id: number;
  name: string;
  code: string;
  degree_type: string;
  duration_semesters: number;
  is_active: boolean;
  student_count?: number;
}

type TabKey = 'students' | 'departments' | 'coe' | 'analytics' | 'alerts';

// ─── Main Component ───────────────────────────────────────────
export default function CollegeDashboard() {
  const navigate = useNavigate();
  const [collegeProfile, setCollegeProfile] = useState<CollegeProfile | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [stats, setStats] = useState<StudentStats>({ total: 0, invited: 0, registered: 0, ready: 0 });
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>('students');

  // Student directory state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBranch, setSelectedBranch] = useState<string>('all');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedPlacement, setSelectedPlacement] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [expandedStudent, setExpandedStudent] = useState<number | null>(null);
  const [selectedStudents, setSelectedStudents] = useState<number[]>([]);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [isInviting, setIsInviting] = useState(false);

  // Auth check & load data
  useEffect(() => {
    if (!apiService.isCollegeAuthenticated()) {
      navigate(resolvePath('/college/login'));
      return;
    }
    const session = localStorage.getItem('college_session');
    if (session) {
      const parsed = JSON.parse(session);
      if (!parsed.onboarding_completed) {
        navigate(resolvePath('/college/onboarding'));
        return;
      }
    }
    loadDashboardData();
  }, [navigate]);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      const [profileRes, studentsRes, statsRes, deptRes] = await Promise.all([
        apiService.getCollegeProfile(),
        apiService.getCollegeStudents(),
        apiService.getCollegeStudentStats(),
        apiService.getDepartments(),
      ]);
      if (profileRes.success && profileRes.data) setCollegeProfile(profileRes.data);
      if (studentsRes.success && studentsRes.data) setStudents(studentsRes.data);
      if (statsRes.success && statsRes.data) setStats(statsRes.data);
      if (deptRes.success && deptRes.data) setDepartments(deptRes.data);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    }
    setIsLoading(false);
  };

  const handleLogout = () => {
    apiService.clearCollegeToken();
    navigate(resolvePath('/college/login'));
  };

  const handleProfileUpdate = (updatedProfile: CollegeProfile) => {
    setCollegeProfile(updatedProfile);
  };

  const handleInviteStudents = async () => {
    setIsInviting(true);
    try {
      const result = await apiService.inviteStudents();
      if (result.success) {
        const [studentsRes, statsRes] = await Promise.all([
          apiService.getCollegeStudents(),
          apiService.getCollegeStudentStats(),
        ]);
        if (studentsRes.success && studentsRes.data) setStudents(studentsRes.data);
        if (statsRes.success && statsRes.data) setStats(statsRes.data);
      }
    } catch (err) {
      console.error('Failed to invite students:', err);
    }
    setIsInviting(false);
  };

  const refreshData = () => { loadDashboardData(); };

  // ─── Derived Data ───────────────────────────────────────────
  const branches = useMemo(() => {
    const branchSet = new Set(students.map(s => s.branch || s.department_name).filter(Boolean));
    return Array.from(branchSet).sort() as string[];
  }, [students]);

  const years = useMemo(() => {
    const yearSet = new Set(students.map(s => s.graduation_year).filter(Boolean));
    return Array.from(yearSet).sort() as number[];
  }, [students]);

  const filteredStudents = useMemo(() => {
    return students.filter(student => {
      const displayName = student.full_name || student.name || student.email;
      const matchesSearch = searchQuery === '' ||
        displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.skills.some(skill => skill.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (student.roll_number || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchesBranch = selectedBranch === 'all' || student.branch === selectedBranch || student.department_name === selectedBranch;
      const matchesYear = selectedYear === 'all' || student.graduation_year?.toString() === selectedYear;
      const matchesStatus = selectedStatus === 'all' || student.status === selectedStatus;
      const matchesPlacement = selectedPlacement === 'all' || student.placement_status === selectedPlacement;
      return matchesSearch && matchesBranch && matchesYear && matchesStatus && matchesPlacement;
    });
  }, [students, searchQuery, selectedBranch, selectedYear, selectedStatus, selectedPlacement]);

  const clearAllFilters = () => {
    setSearchQuery('');
    setSelectedBranch('all');
    setSelectedYear('all');
    setSelectedStatus('all');
    setSelectedPlacement('all');
  };

  const hasActiveFilters = searchQuery !== '' || selectedBranch !== 'all' ||
    selectedYear !== 'all' || selectedStatus !== 'all' || selectedPlacement !== 'all';

  const toggleStudentSelection = (studentId: number) => {
    setSelectedStudents(prev =>
      prev.includes(studentId) ? prev.filter(id => id !== studentId) : [...prev, studentId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedStudents.length === filteredStudents.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(filteredStudents.map(s => s.id));
    }
  };

  const toggleExpandStudent = (studentId: number) => {
    setExpandedStudent(prev => prev === studentId ? null : studentId);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ready': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'registered': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'invited': return 'bg-amber-100 text-amber-700 border-amber-200';
      default: return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'ready': return 'Ready';
      case 'registered': return 'Registered';
      case 'invited': return 'Invited';
      default: return status;
    }
  };

  const getPlacementBadge = (status: string | null) => {
    switch (status) {
      case 'placed': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'in_process': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'higher_studies': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'not_interested': return 'bg-gray-100 text-gray-500 border-gray-200';
      default: return 'bg-amber-100 text-amber-700 border-amber-200';
    }
  };

  const getPlacementLabel = (status: string | null) => {
    switch (status) {
      case 'placed': return 'Placed';
      case 'in_process': return 'In Process';
      case 'higher_studies': return 'Higher Studies';
      case 'not_interested': return 'Not Interested';
      default: return 'Not Placed';
    }
  };

  const getSelectedStudentsData = () => students.filter(s => selectedStudents.includes(s.id));

  // Tab config
  const tabs: { key: TabKey; label: string; icon: string; badge?: number }[] = [
    { key: 'students', label: 'Students', icon: 'ri-group-line' },
    { key: 'departments', label: 'Departments', icon: 'ri-building-2-line', badge: departments.length },
    { key: 'coe', label: 'COE Groups', icon: 'ri-lightbulb-line', badge: stats.coe_stats?.total_groups },
    { key: 'analytics', label: 'Skill Analytics', icon: 'ri-bar-chart-box-line' },
    { key: 'alerts', label: 'Alerts', icon: 'ri-notification-3-line', badge: stats.alerts_count },
  ];

  // ─── Loading ────────────────────────────────────────────────
  if (isLoading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-teal-50/30 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-3 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm text-gray-600">Loading dashboard...</p>
        </div>
      </main>
    );
  }

  // ─── Render ─────────────────────────────────────────────────
  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-teal-50/30">
      <Navbar />

      <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* ──── College Header ──── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-6">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div className="flex items-start gap-6">
              {collegeProfile?.logo_url ? (
                <img src={collegeProfile.logo_url} alt="College Logo" className="w-20 h-20 rounded-xl object-cover shrink-0 border border-gray-100" />
              ) : (
                <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center shrink-0">
                  <i className="ri-graduation-cap-fill text-white text-3xl"></i>
                </div>
              )}
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{collegeProfile?.institution_name || 'College Dashboard'}</h1>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span className="flex items-center gap-1.5">
                    <i className="ri-map-pin-line text-teal-600"></i>
                    {collegeProfile?.city}, {collegeProfile?.state}
                  </span>
                  {collegeProfile?.naac_grade && (
                    <span className="flex items-center gap-1.5">
                      <i className="ri-award-line text-teal-600"></i>
                      NAAC {collegeProfile.naac_grade}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex gap-3 flex-wrap">
              {stats.invited > 0 && (
                <button
                  onClick={handleInviteStudents} disabled={isInviting}
                  className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-teal-500 to-emerald-500 text-white text-sm font-semibold hover:from-teal-600 hover:to-emerald-600 transition-all whitespace-nowrap flex items-center gap-2 cursor-pointer disabled:opacity-60">
                  {isInviting ? (<><i className="ri-loader-4-line animate-spin"></i>Sending...</>) : (<><i className="ri-mail-send-line"></i>Invite ({stats.invited})</>)}
                </button>
              )}
              <button onClick={() => setShowSettingsModal(true)}
                className="px-5 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors whitespace-nowrap flex items-center gap-2 cursor-pointer">
                <i className="ri-settings-3-line"></i>Settings
              </button>
              <button onClick={handleLogout}
                className="px-5 py-2.5 rounded-lg bg-red-50 text-red-600 text-sm font-medium hover:bg-red-100 transition-colors whitespace-nowrap flex items-center gap-2 cursor-pointer">
                <i className="ri-logout-box-line"></i>Logout
              </button>
            </div>
          </div>

          {/* ──── Enhanced Stats Cards ──── */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-8">
            <div className="bg-gradient-to-br from-teal-50 to-emerald-50 rounded-xl p-4 border border-teal-100">
              <div className="w-9 h-9 rounded-lg bg-teal-600 flex items-center justify-center mb-2">
                <i className="ri-group-line text-white text-base"></i>
              </div>
              <p className="text-xl font-bold text-gray-900">{stats.total}</p>
              <p className="text-xs text-gray-600">Total Students</p>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-4 border border-blue-100">
              <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center mb-2">
                <i className="ri-user-follow-line text-white text-base"></i>
              </div>
              <p className="text-xl font-bold text-gray-900">{stats.registered}</p>
              <p className="text-xs text-gray-600">Registered</p>
            </div>
            <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl p-4 border border-emerald-100">
              <div className="w-9 h-9 rounded-lg bg-emerald-600 flex items-center justify-center mb-2">
                <i className="ri-checkbox-circle-line text-white text-base"></i>
              </div>
              <p className="text-xl font-bold text-gray-900">{stats.ready}</p>
              <p className="text-xs text-gray-600">Ready</p>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-4 border border-purple-100">
              <div className="w-9 h-9 rounded-lg bg-purple-600 flex items-center justify-center mb-2">
                <i className="ri-bar-chart-box-line text-white text-base"></i>
              </div>
              <p className="text-xl font-bold text-gray-900">{stats.avg_cgpa?.toFixed(1) ?? '—'}</p>
              <p className="text-xs text-gray-600">Avg CGPA</p>
            </div>
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-100">
              <div className="w-9 h-9 rounded-lg bg-amber-600 flex items-center justify-center mb-2">
                <i className="ri-briefcase-line text-white text-base"></i>
              </div>
              <p className="text-xl font-bold text-gray-900">
                {stats.placement_stats?.placement_rate != null ? `${stats.placement_stats.placement_rate}%` : '—'}
              </p>
              <p className="text-xs text-gray-600">Placement Rate</p>
            </div>
            <div className="bg-gradient-to-br from-rose-50 to-pink-50 rounded-xl p-4 border border-rose-100">
              <div className="w-9 h-9 rounded-lg bg-rose-600 flex items-center justify-center mb-2">
                <i className="ri-file-text-line text-white text-base"></i>
              </div>
              <p className="text-xl font-bold text-gray-900">
                {stats.resume_stats?.avg_score != null ? `${Math.round(stats.resume_stats.avg_score)}` : '—'}
              </p>
              <p className="text-xs text-gray-600">Avg Resume Score</p>
            </div>
          </div>

          {/* Placement & Resume Breakdown */}
          {(stats.placement_stats || stats.resume_stats) && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
              {stats.placement_stats && (
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Placement Breakdown</h4>
                  <div className="flex flex-wrap items-center gap-3">
                    {[
                      { label: 'Placed', value: stats.placement_stats.placed, color: 'bg-emerald-500' },
                      { label: 'In Process', value: stats.placement_stats.in_process, color: 'bg-blue-500' },
                      { label: 'Not Placed', value: stats.placement_stats.not_placed, color: 'bg-amber-500' },
                      { label: 'Higher Studies', value: stats.placement_stats.higher_studies, color: 'bg-purple-500' },
                    ].map(item => (
                      <div key={item.label} className="flex items-center gap-1.5">
                        <span className={`w-2.5 h-2.5 rounded-full ${item.color}`}></span>
                        <span className="text-xs text-gray-600">{item.label}: <span className="font-semibold text-gray-900">{item.value}</span></span>
                      </div>
                    ))}
                  </div>
                  {stats.placement_stats.avg_salary_lpa && (
                    <p className="text-xs text-gray-500 mt-2">
                      Avg package: <span className="font-semibold text-teal-700">₹{stats.placement_stats.avg_salary_lpa.toFixed(1)} LPA</span>
                    </p>
                  )}
                </div>
              )}
              {stats.resume_stats && (
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Resume Overview</h4>
                  <div className="flex flex-wrap items-center gap-4">
                    {[
                      { label: 'No Resume', value: stats.resume_stats.no_resume, color: 'bg-gray-400' },
                      { label: 'Uploaded', value: stats.resume_stats.uploaded, color: 'bg-blue-500' },
                      { label: 'Optimized', value: stats.resume_stats.optimized, color: 'bg-emerald-500' },
                    ].map(item => (
                      <div key={item.label} className="flex items-center gap-1.5">
                        <span className={`w-2.5 h-2.5 rounded-full ${item.color}`}></span>
                        <span className="text-xs text-gray-600">{item.label}: <span className="font-semibold text-gray-900">{item.value}</span></span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ──── Tab Navigation ──── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="border-b border-gray-100 px-6">
            <nav className="flex gap-1 -mb-px overflow-x-auto">
              {tabs.map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-2 px-4 py-3.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
                    activeTab === tab.key
                      ? 'border-teal-600 text-teal-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}>
                  <i className={`${tab.icon} text-base`}></i>
                  {tab.label}
                  {tab.badge != null && tab.badge > 0 && (
                    <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                      tab.key === 'alerts' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {tab.badge}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {/* ──── Students Tab ──── */}
            {activeTab === 'students' && (
              <div>
                {/* Search + Filters Header */}
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-gray-900">Student Directory</h2>
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2 cursor-pointer">
                    <i className={`ri-filter-3-line ${showFilters ? 'text-teal-600' : ''}`}></i>
                    {showFilters ? 'Hide Filters' : 'Filters'}
                  </button>
                </div>

                {/* Search Bar */}
                <div className="relative mb-4">
                  <i className="ri-search-line absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg"></i>
                  <input
                    type="text" placeholder="Search by name, email, roll number or skill..."
                    value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>

                {/* Filter Panel */}
                {showFilters && (
                  <div className="bg-gray-50 rounded-xl p-5 border border-gray-100 mb-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5">Branch / Department</label>
                        <select value={selectedBranch} onChange={e => setSelectedBranch(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer">
                          <option value="all">All</option>
                          {branches.map(b => <option key={b} value={b}>{b}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5">Graduation Year</label>
                        <select value={selectedYear} onChange={e => setSelectedYear(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer">
                          <option value="all">All Years</option>
                          {years.map(y => <option key={y} value={y.toString()}>{y}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5">Status</label>
                        <select value={selectedStatus} onChange={e => setSelectedStatus(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer">
                          <option value="all">All Status</option>
                          <option value="invited">Invited</option>
                          <option value="registered">Registered</option>
                          <option value="ready">Ready</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5">Placement Status</label>
                        <select value={selectedPlacement} onChange={e => setSelectedPlacement(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer">
                          <option value="all">All</option>
                          <option value="not_placed">Not Placed</option>
                          <option value="placed">Placed</option>
                          <option value="in_process">In Process</option>
                          <option value="higher_studies">Higher Studies</option>
                          <option value="not_interested">Not Interested</option>
                        </select>
                      </div>
                    </div>
                    {hasActiveFilters && (
                      <div className="mt-4 pt-3 border-t border-gray-200 flex items-center justify-between">
                        <div className="flex flex-wrap gap-2">
                          {selectedBranch !== 'all' && (
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-purple-100 text-purple-700 text-xs font-medium">
                              {selectedBranch}
                              <button onClick={() => setSelectedBranch('all')} className="cursor-pointer"><i className="ri-close-line text-xs"></i></button>
                            </span>
                          )}
                          {selectedStatus !== 'all' && (
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-teal-100 text-teal-700 text-xs font-medium">
                              {selectedStatus}
                              <button onClick={() => setSelectedStatus('all')} className="cursor-pointer"><i className="ri-close-line text-xs"></i></button>
                            </span>
                          )}
                          {selectedPlacement !== 'all' && (
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-medium">
                              {getPlacementLabel(selectedPlacement)}
                              <button onClick={() => setSelectedPlacement('all')} className="cursor-pointer"><i className="ri-close-line text-xs"></i></button>
                            </span>
                          )}
                        </div>
                        <button onClick={clearAllFilters}
                          className="text-sm font-medium text-teal-600 hover:text-teal-700 cursor-pointer">Clear All</button>
                      </div>
                    )}
                  </div>
                )}

                {/* Results Count & Select All */}
                <div className="flex items-center justify-between py-3 border-b border-gray-100 mb-2">
                  <p className="text-sm text-gray-600">
                    Showing <span className="font-semibold text-gray-900">{filteredStudents.length}</span> of <span className="font-semibold text-gray-900">{students.length}</span> students
                  </p>
                  {filteredStudents.length > 0 && (
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox"
                        checked={selectedStudents.length === filteredStudents.length && filteredStudents.length > 0}
                        onChange={toggleSelectAll}
                        className="w-4 h-4 text-teal-600 rounded border-gray-300 focus:ring-teal-500 cursor-pointer" />
                      <span className="text-sm font-medium text-gray-700">Select All</span>
                    </label>
                  )}
                </div>

                {/* Student Table */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-100">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-10"></th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Student</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Dept / Branch</th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">CGPA</th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Resume</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Skills</th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Placement</th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                        <th className="px-4 py-3 w-16"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredStudents.map(student => {
                        const displayName = student.full_name || student.name || student.email.split('@')[0];
                        const initials = displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
                        return (
                          <Fragment key={student.id}>
                            <tr className={`transition-colors ${expandedStudent === student.id ? 'bg-teal-50/30' : 'hover:bg-gray-50'}`}>
                              <td className="px-4 py-3">
                                <input type="checkbox" checked={selectedStudents.includes(student.id)}
                                  onChange={() => toggleStudentSelection(student.id)}
                                  className="w-4 h-4 text-teal-600 rounded border-gray-300 focus:ring-teal-500 cursor-pointer" />
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-3">
                                  {student.profile_picture_url ? (
                                    <img src={student.profile_picture_url} alt={displayName} className="w-9 h-9 rounded-full object-cover shrink-0" />
                                  ) : (
                                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center text-white font-semibold text-xs shrink-0">
                                      {initials}
                                    </div>
                                  )}
                                  <div className="min-w-0">
                                    <p className="text-sm font-semibold text-gray-900 truncate">{displayName}</p>
                                    <p className="text-xs text-gray-500 truncate">{student.roll_number || student.email}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <p className="text-sm text-gray-700">{student.department_name || student.branch || '—'}</p>
                                {student.graduation_year && <p className="text-xs text-gray-400">{student.degree_type || ''} {student.graduation_year}</p>}
                              </td>
                              <td className="px-4 py-3 text-center">
                                <span className={`text-sm font-semibold ${student.cgpa ? (student.cgpa >= 8 ? 'text-emerald-700' : student.cgpa >= 6 ? 'text-amber-700' : 'text-red-600') : 'text-gray-400'}`}>
                                  {student.cgpa?.toFixed(1) ?? '—'}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-center">
                                {student.resume_score != null ? (
                                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${
                                    student.resume_score >= 80 ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
                                    student.resume_score >= 60 ? 'bg-amber-100 text-amber-700 border-amber-200' :
                                    'bg-red-100 text-red-700 border-red-200'
                                  }`}>
                                    {student.resume_score.toFixed(0)}%
                                  </span>
                                ) : student.resume_count > 0 ? (
                                  <span className="text-xs text-blue-600 font-medium">{student.resume_count} file{student.resume_count > 1 ? 's' : ''}</span>
                                ) : (
                                  <span className="text-xs text-gray-400">—</span>
                                )}
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex flex-wrap gap-1 max-w-[160px]">
                                  {student.skills.length > 0 ? (
                                    <>
                                      {student.skills.slice(0, 2).map(skill => (
                                        <span key={skill} className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 text-[11px] font-medium">{skill}</span>
                                      ))}
                                      {student.skills.length > 2 && (
                                        <span className="px-2 py-0.5 rounded-md bg-teal-100 text-teal-700 text-[11px] font-semibold">+{student.skills.length - 2}</span>
                                      )}
                                    </>
                                  ) : (
                                    <span className="text-xs text-gray-400">—</span>
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-3 text-center">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${getPlacementBadge(student.placement_status)}`}>
                                  {getPlacementLabel(student.placement_status)}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-center">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${getStatusBadge(student.status)}`}>
                                  {getStatusLabel(student.status)}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <button onClick={() => toggleExpandStudent(student.id)}
                                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500 hover:text-teal-600 transition-colors cursor-pointer">
                                  <i className={`ri-${expandedStudent === student.id ? 'arrow-up' : 'arrow-down'}-s-line`}></i>
                                </button>
                              </td>
                            </tr>

                            {/* Expanded Detail Row */}
                            {expandedStudent === student.id && (
                              <tr className="bg-gradient-to-br from-teal-50/50 to-emerald-50/30">
                                <td colSpan={9} className="px-6 py-5">
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {/* Contact */}
                                    <div className="bg-white rounded-xl p-4 border border-gray-100">
                                      <h3 className="text-xs font-bold text-gray-900 mb-3 flex items-center gap-2">
                                        <i className="ri-contacts-line text-teal-600"></i>Contact
                                      </h3>
                                      <div className="space-y-2 text-sm">
                                        <p className="text-gray-600"><span className="text-gray-400 text-xs">Email:</span> {student.email}</p>
                                        {student.phone && <p className="text-gray-600"><span className="text-gray-400 text-xs">Phone:</span> {student.phone}</p>}
                                        <div className="flex items-center gap-3 mt-1">
                                          {student.linkedin_url && (
                                            <a href={student.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-xs flex items-center gap-1 cursor-pointer">
                                              <i className="ri-linkedin-box-fill"></i>LinkedIn
                                            </a>
                                          )}
                                          {student.github_url && (
                                            <a href={student.github_url} target="_blank" rel="noopener noreferrer" className="text-gray-700 hover:underline text-xs flex items-center gap-1 cursor-pointer">
                                              <i className="ri-github-fill"></i>GitHub
                                            </a>
                                          )}
                                          {student.portfolio_url && (
                                            <a href={student.portfolio_url} target="_blank" rel="noopener noreferrer" className="text-teal-600 hover:underline text-xs flex items-center gap-1 cursor-pointer">
                                              <i className="ri-global-line"></i>Portfolio
                                            </a>
                                          )}
                                        </div>
                                      </div>
                                    </div>

                                    {/* Academic */}
                                    <div className="bg-white rounded-xl p-4 border border-gray-100">
                                      <h3 className="text-xs font-bold text-gray-900 mb-3 flex items-center gap-2">
                                        <i className="ri-book-open-line text-teal-600"></i>Academic
                                      </h3>
                                      <div className="grid grid-cols-2 gap-3">
                                        <div><p className="text-[10px] text-gray-400">Department</p><p className="text-sm font-medium text-gray-900">{student.department_name || student.branch || '—'}</p></div>
                                        <div><p className="text-[10px] text-gray-400">Roll No</p><p className="text-sm font-medium text-gray-900">{student.roll_number || '—'}</p></div>
                                        <div><p className="text-[10px] text-gray-400">CGPA</p><p className="text-sm font-medium text-gray-900">{student.cgpa?.toFixed(2) ?? '—'}</p></div>
                                        <div><p className="text-[10px] text-gray-400">Semester</p><p className="text-sm font-medium text-gray-900">{student.current_semester ?? '—'}</p></div>
                                        <div><p className="text-[10px] text-gray-400">Admission</p><p className="text-sm font-medium text-gray-900">{student.admission_year ?? '—'}</p></div>
                                        <div><p className="text-[10px] text-gray-400">Graduation</p><p className="text-sm font-medium text-gray-900">{student.graduation_year ?? '—'}</p></div>
                                      </div>
                                    </div>

                                    {/* Placement & Scores */}
                                    <div className="bg-white rounded-xl p-4 border border-gray-100">
                                      <h3 className="text-xs font-bold text-gray-900 mb-3 flex items-center gap-2">
                                        <i className="ri-briefcase-line text-teal-600"></i>Placement & Scores
                                      </h3>
                                      <div className="grid grid-cols-2 gap-3">
                                        <div><p className="text-[10px] text-gray-400">Status</p>
                                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${getPlacementBadge(student.placement_status)}`}>
                                            {getPlacementLabel(student.placement_status)}
                                          </span>
                                        </div>
                                        <div><p className="text-[10px] text-gray-400">Resume Score</p><p className="text-sm font-medium text-gray-900">{student.resume_score != null ? `${student.resume_score}%` : '—'}</p></div>
                                        {student.placed_company && (
                                          <div><p className="text-[10px] text-gray-400">Company</p><p className="text-sm font-medium text-gray-900">{student.placed_company}</p></div>
                                        )}
                                        {student.placed_role && (
                                          <div><p className="text-[10px] text-gray-400">Role</p><p className="text-sm font-medium text-gray-900">{student.placed_role}</p></div>
                                        )}
                                        {student.placed_salary_lpa && (
                                          <div><p className="text-[10px] text-gray-400">Package</p><p className="text-sm font-bold text-emerald-700">₹{student.placed_salary_lpa} LPA</p></div>
                                        )}
                                        <div><p className="text-[10px] text-gray-400">Interview Ready</p><p className="text-sm font-medium text-gray-900">{student.interview_readiness_score != null ? `${student.interview_readiness_score}%` : '—'}</p></div>
                                      </div>
                                    </div>

                                    {/* Skills */}
                                    <div className="bg-white rounded-xl p-4 border border-gray-100 md:col-span-2">
                                      <h3 className="text-xs font-bold text-gray-900 mb-3 flex items-center gap-2">
                                        <i className="ri-code-box-line text-teal-600"></i>Skills ({student.skills.length})
                                      </h3>
                                      {student.skills.length > 0 ? (
                                        <div className="flex flex-wrap gap-2">
                                          {student.skills.map(skill => (
                                            <span key={skill} className="px-3 py-1 rounded-lg bg-teal-50 text-teal-700 text-xs font-medium border border-teal-100">{skill}</span>
                                          ))}
                                        </div>
                                      ) : (
                                        <p className="text-sm text-gray-400">No skills data</p>
                                      )}
                                    </div>

                                    {/* COE Groups */}
                                    {student.coe_groups && student.coe_groups.length > 0 && (
                                      <div className="bg-white rounded-xl p-4 border border-gray-100">
                                        <h3 className="text-xs font-bold text-gray-900 mb-3 flex items-center gap-2">
                                          <i className="ri-lightbulb-line text-purple-600"></i>COE Groups
                                        </h3>
                                        <div className="space-y-1.5">
                                          {student.coe_groups.map(g => (
                                            <div key={g.id} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-purple-50 border border-purple-100">
                                              <span className="text-[10px] font-bold text-purple-600">{g.code}</span>
                                              <span className="text-xs text-purple-800">{g.name}</span>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}

                                    {/* Resumes */}
                                    {student.resumes?.length > 0 && (
                                      <div className="bg-white rounded-xl p-4 border border-gray-100 md:col-span-3">
                                        <h3 className="text-xs font-bold text-gray-900 mb-3 flex items-center gap-2">
                                          <i className="ri-file-text-line text-teal-600"></i>Resumes ({student.resumes.length})
                                        </h3>
                                        <div className="space-y-2">
                                          {student.resumes.map(resume => (
                                            <div key={resume.id} className="flex items-center gap-3 bg-gray-50 rounded-lg p-3 border border-gray-100">
                                              <div className="w-9 h-11 rounded-lg bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center border border-red-200 shrink-0">
                                                <i className={`ri-file-${resume.file_format === 'pdf' ? 'pdf' : 'word'}-line text-${resume.file_format === 'pdf' ? 'red' : 'blue'}-500`}></i>
                                              </div>
                                              <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-gray-900 truncate">{resume.title}</p>
                                                <p className="text-xs text-gray-400">{resume.original_filename}{resume.created_at && ` · ${new Date(resume.created_at).toLocaleDateString()}`}</p>
                                              </div>
                                              <div className="flex items-center gap-2 shrink-0">
                                                {resume.ats_score != null && (
                                                  <span className={`px-2 py-0.5 rounded-md text-xs font-semibold border ${
                                                    resume.ats_score >= 80 ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
                                                    resume.ats_score >= 60 ? 'bg-amber-100 text-amber-700 border-amber-200' :
                                                    'bg-red-100 text-red-700 border-red-200'
                                                  }`}>ATS: {resume.ats_score.toFixed(0)}%</span>
                                                )}
                                                {resume.is_optimized && (
                                                  <span className="px-2 py-0.5 rounded-md bg-teal-100 text-teal-700 text-xs font-semibold border border-teal-200">Optimized</span>
                                                )}
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            )}
                          </Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Empty State */}
                {filteredStudents.length === 0 && (
                  <div className="py-16 text-center">
                    <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                      <i className="ri-search-line text-2xl text-gray-400"></i>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No students found</h3>
                    <p className="text-sm text-gray-500 mb-4">Try adjusting your filters or search query</p>
                    <button onClick={clearAllFilters}
                      className="px-4 py-2 rounded-lg bg-teal-600 text-white text-sm font-medium hover:bg-teal-700 transition-colors cursor-pointer">
                      Clear All Filters
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* ──── Departments Tab ──── */}
            {activeTab === 'departments' && (
              <DepartmentsTab onRefresh={refreshData} />
            )}

            {/* ──── COE Groups Tab ──── */}
            {activeTab === 'coe' && (
              <COEGroupsTab students={students} onRefresh={refreshData} />
            )}

            {/* ──── Skill Analytics Tab ──── */}
            {activeTab === 'analytics' && (
              <SkillAnalyticsTab departments={departments} />
            )}

            {/* ──── Alerts Tab ──── */}
            {activeTab === 'alerts' && (
              <AlertsPanel />
            )}
          </div>
        </div>
      </div>

      {/* ──── Floating Action Bar ──── */}
      {selectedStudents.length > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50">
          <div className="bg-gradient-to-r from-teal-600 to-emerald-600 rounded-2xl shadow-2xl border border-teal-500/20 px-6 py-4 flex items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <i className="ri-checkbox-multiple-line text-white text-lg"></i>
              </div>
              <div>
                <p className="text-white font-semibold text-sm">
                  {selectedStudents.length} {selectedStudents.length === 1 ? 'Student' : 'Students'} Selected
                </p>
                <p className="text-teal-100 text-xs">Ready to share with recruiters</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => setSelectedStudents([])}
                className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm font-medium transition-colors cursor-pointer flex items-center gap-2">
                <i className="ri-close-line"></i>Clear
              </button>
              <button onClick={() => setShowShareModal(true)}
                className="px-5 py-2 rounded-lg bg-white text-teal-600 hover:bg-teal-50 text-sm font-semibold transition-colors cursor-pointer flex items-center gap-2 shadow-lg">
                <i className="ri-share-forward-line"></i>Share with Recruiters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ──── Modals ──── */}
      {showShareModal && (
        <ShareProfilesModal
          students={getSelectedStudentsData()}
          onClose={() => setShowShareModal(false)}
          onSuccess={() => { setShowShareModal(false); setSelectedStudents([]); }}
        />
      )}
      {showSettingsModal && collegeProfile && (
        <SettingsModal
          profile={collegeProfile}
          onClose={() => setShowSettingsModal(false)}
          onSave={handleProfileUpdate}
        />
      )}

      <Footer />
    </main>
  );
}

import { useState, useMemo, useEffect, Fragment } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/feature/Navbar';
import { resolvePath } from '../../utils/subdomain';
import Footer from '../../components/feature/Footer';
import ShareProfilesModal from './components/ShareProfilesModal';
import SettingsModal from './components/SettingsModal';
import { apiService } from '../../services/api';

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
  full_name: string | null;
  profile_picture_url: string | null;
}

interface StudentStats {
  total: number;
  invited: number;
  registered: number;
  ready: number;
}

export default function CollegeDashboard() {
  const navigate = useNavigate();
  const [collegeProfile, setCollegeProfile] = useState<CollegeProfile | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [stats, setStats] = useState<StudentStats>({ total: 0, invited: 0, registered: 0, ready: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBranch, setSelectedBranch] = useState<string>('all');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [expandedStudent, setExpandedStudent] = useState<number | null>(null);
  const [selectedStudents, setSelectedStudents] = useState<number[]>([]);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [isInviting, setIsInviting] = useState(false);

  // Check auth and load data
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
      const [profileRes, studentsRes, statsRes] = await Promise.all([
        apiService.getCollegeProfile(),
        apiService.getCollegeStudents(),
        apiService.getCollegeStudentStats(),
      ]);

      if (profileRes.success && profileRes.data) setCollegeProfile(profileRes.data);
      if (studentsRes.success && studentsRes.data) setStudents(studentsRes.data);
      if (statsRes.success && statsRes.data) setStats(statsRes.data);
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
        // Reload students to get updated states
        const studentsRes = await apiService.getCollegeStudents();
        if (studentsRes.success && studentsRes.data) setStudents(studentsRes.data);
        const statsRes = await apiService.getCollegeStudentStats();
        if (statsRes.success && statsRes.data) setStats(statsRes.data);
      }
    } catch (err) {
      console.error('Failed to invite students:', err);
    }
    setIsInviting(false);
  };

  const branches = useMemo(() => {
    const branchSet = new Set(students.map(s => s.branch).filter(Boolean));
    return Array.from(branchSet).sort();
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
        student.skills.some(skill => skill.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesBranch = selectedBranch === 'all' || student.branch === selectedBranch;
      const matchesYear = selectedYear === 'all' || student.graduation_year?.toString() === selectedYear;
      const matchesStatus = selectedStatus === 'all' || student.status === selectedStatus;
      return matchesSearch && matchesBranch && matchesYear && matchesStatus;
    });
  }, [students, searchQuery, selectedBranch, selectedYear, selectedStatus]);

  const clearAllFilters = () => {
    setSearchQuery('');
    setSelectedBranch('all');
    setSelectedYear('all');
    setSelectedStatus('all');
  };

  const hasActiveFilters = searchQuery !== '' || selectedBranch !== 'all' || 
    selectedYear !== 'all' || selectedStatus !== 'all';

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
      case 'ready':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'registered':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'invited':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      default:
        return 'bg-gray-100 text-gray-600 border-gray-200';
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

  const getSelectedStudentsData = () => {
    return students.filter(s => selectedStudents.includes(s.id));
  };

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

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-teal-50/30">
      <Navbar />
      
      <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* College Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-8">
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
                  onClick={handleInviteStudents}
                  disabled={isInviting}
                  className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-teal-500 to-emerald-500 text-white text-sm font-semibold hover:from-teal-600 hover:to-emerald-600 transition-all whitespace-nowrap flex items-center gap-2 cursor-pointer disabled:opacity-60">
                  {isInviting ? (
                    <><i className="ri-loader-4-line animate-spin"></i>Sending...</>
                  ) : (
                    <><i className="ri-mail-send-line"></i>Invite Students ({stats.invited})</>
                  )}
                </button>
              )}
              <button 
                onClick={() => setShowSettingsModal(true)}
                className="px-5 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors whitespace-nowrap flex items-center gap-2 cursor-pointer">
                <i className="ri-settings-3-line"></i>
                Settings
              </button>
              <button 
                onClick={handleLogout}
                className="px-5 py-2.5 rounded-lg bg-red-50 text-red-600 text-sm font-medium hover:bg-red-100 transition-colors whitespace-nowrap flex items-center gap-2 cursor-pointer">
                <i className="ri-logout-box-line"></i>
                Logout
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
            <div className="bg-gradient-to-br from-teal-50 to-emerald-50 rounded-xl p-5 border border-teal-100">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-teal-600 flex items-center justify-center">
                  <i className="ri-group-line text-white text-lg"></i>
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900 mb-1">{stats.total}</p>
              <p className="text-sm text-gray-600">Total Students</p>
            </div>

            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-5 border border-amber-100">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-amber-600 flex items-center justify-center">
                  <i className="ri-mail-send-line text-white text-lg"></i>
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900 mb-1">{stats.invited}</p>
              <p className="text-sm text-gray-600">Invited <span className="text-amber-600 font-semibold">(pending registration)</span></p>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-5 border border-blue-100">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center">
                  <i className="ri-user-follow-line text-white text-lg"></i>
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900 mb-1">{stats.registered}</p>
              <p className="text-sm text-gray-600">Registered <span className="text-blue-600 font-semibold">(no resume yet)</span></p>
            </div>

            <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl p-5 border border-emerald-100">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-600 flex items-center justify-center">
                  <i className="ri-checkbox-circle-line text-white text-lg"></i>
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900 mb-1">{stats.ready}</p>
              <p className="text-sm text-gray-600">Ready <span className="text-emerald-600 font-semibold">({stats.total > 0 ? Math.round((stats.ready / stats.total) * 100) : 0}%)</span></p>
            </div>
          </div>
        </div>

        {/* Student Directory */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Header */}
          <div className="px-6 py-5 border-b border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Student Directory</h2>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors whitespace-nowrap flex items-center gap-2 cursor-pointer">
                <i className={`ri-filter-3-line ${showFilters ? 'text-teal-600' : ''}`}></i>
                {showFilters ? 'Hide Filters' : 'Show Filters'}
              </button>
            </div>

            {/* Search Bar */}
            <div className="relative">
              <i className="ri-search-line absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg"></i>
              <input
                type="text"
                placeholder="Search by name, email or skill..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <div className="px-6 py-5 bg-gray-50 border-b border-gray-100">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Branch Filter */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Branch</label>
                  <select
                    value={selectedBranch}
                    onChange={(e) => setSelectedBranch(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer">
                    <option value="all">All Branches</option>
                    {branches.map(branch => (
                      <option key={branch} value={branch}>{branch}</option>
                    ))}
                  </select>
                </div>

                {/* Graduation Year */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Graduation Year</label>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer">
                    <option value="all">All Years</option>
                    {years.map(year => (
                      <option key={year} value={year.toString()}>{year}</option>
                    ))}
                  </select>
                </div>

                {/* Onboarding Status */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer">
                    <option value="all">All Status</option>
                    <option value="invited">Invited</option>
                    <option value="registered">Registered</option>
                    <option value="ready">Ready</option>
                  </select>
                </div>
              </div>

              {/* Active Filters & Clear */}
              {hasActiveFilters && (
                <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between">
                  <div className="flex flex-wrap gap-2">
                    {selectedBranch !== 'all' && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-100 text-purple-700 text-xs font-medium">
                        {selectedBranch}
                      </span>
                    )}
                    {selectedStatus !== 'all' && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-100 text-teal-700 text-xs font-medium">
                        {selectedStatus}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={clearAllFilters}
                    className="text-sm font-medium text-teal-600 hover:text-teal-700 whitespace-nowrap cursor-pointer">
                    Clear All
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Results Count & Select All */}
          <div className="px-6 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Showing <span className="font-semibold text-gray-900">{filteredStudents.length}</span> of <span className="font-semibold text-gray-900">{students.length}</span> students
            </p>
            {filteredStudents.length > 0 && (
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedStudents.length === filteredStudents.length && filteredStudents.length > 0}
                  onChange={toggleSelectAll}
                  className="w-4 h-4 text-teal-600 rounded border-gray-300 focus:ring-teal-500 cursor-pointer"
                />
                <span className="text-sm font-medium text-gray-700">Select All</span>
              </label>
            )}
          </div>

          {/* Student Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-12"></th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Student</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Branch</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Resumes</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Skills</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredStudents.map((student) => {
                  const displayName = student.full_name || student.name || student.email.split('@')[0];
                  const initials = displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
                  return (
                  <Fragment key={student.id}>
                    <tr className={`transition-colors ${expandedStudent === student.id ? 'bg-teal-50/30' : 'hover:bg-gray-50'}`}>
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedStudents.includes(student.id)}
                          onChange={() => toggleStudentSelection(student.id)}
                          className="w-4 h-4 text-teal-600 rounded border-gray-300 focus:ring-teal-500 cursor-pointer"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {student.profile_picture_url ? (
                            <img src={student.profile_picture_url} alt={displayName} className="w-10 h-10 rounded-full object-cover shrink-0" />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center text-white font-semibold text-sm shrink-0">
                              {initials}
                            </div>
                          )}
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{displayName}</p>
                            <p className="text-xs text-gray-500">{student.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-700">{student.branch || '—'}</p>
                        {student.graduation_year && (
                          <p className="text-xs text-gray-500">Class of {student.graduation_year}</p>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${
                          student.resume_count > 0 ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-gray-100 text-gray-500 border-gray-200'
                        }`}>
                          {student.resume_count > 0 ? `${student.resume_count} resume${student.resume_count > 1 ? 's' : ''}` : 'No resume'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1.5 max-w-xs">
                          {student.skills.length > 0 ? (
                            <>
                              {student.skills.slice(0, 3).map(skill => (
                                <span key={skill} className="px-2 py-1 rounded-md bg-gray-100 text-gray-700 text-xs font-medium">
                                  {skill}
                                </span>
                              ))}
                              {student.skills.length > 3 && (
                                <span className="px-2 py-1 rounded-md bg-teal-100 text-teal-700 text-xs font-semibold">
                                  +{student.skills.length - 3}
                                </span>
                              )}
                            </>
                          ) : (
                            <span className="text-xs text-gray-400">—</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${getStatusBadge(student.status)}`}>
                          {getStatusLabel(student.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => toggleExpandStudent(student.id)}
                            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-600 hover:text-teal-600 transition-colors cursor-pointer" 
                            title={expandedStudent === student.id ? 'Collapse' : 'Expand Details'}>
                            <i className={`ri-${expandedStudent === student.id ? 'arrow-up' : 'arrow-down'}-s-line text-base`}></i>
                          </button>
                          {student.linkedin_url && (
                            <a href={student.linkedin_url} target="_blank" rel="noopener noreferrer" className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-600 hover:text-blue-600 transition-colors cursor-pointer" title="LinkedIn">
                              <i className="ri-linkedin-box-line text-base"></i>
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                    
                    {/* Expanded Detail Row */}
                    {expandedStudent === student.id && (
                      <tr className="bg-gradient-to-br from-teal-50/50 to-emerald-50/30">
                        <td colSpan={7} className="px-6 py-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Contact Information */}
                            <div className="bg-white rounded-xl p-5 border border-gray-100">
                              <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <i className="ri-contacts-line text-teal-600"></i>
                                Contact Information
                              </h3>
                              <div className="space-y-3">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center shrink-0">
                                    <i className="ri-mail-line text-teal-600 text-sm"></i>
                                  </div>
                                  <div>
                                    <p className="text-xs text-gray-500">Email</p>
                                    <p className="text-sm font-medium text-gray-900">{student.email}</p>
                                  </div>
                                </div>
                                {student.phone && (
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center shrink-0">
                                      <i className="ri-phone-line text-teal-600 text-sm"></i>
                                    </div>
                                    <div>
                                      <p className="text-xs text-gray-500">Phone</p>
                                      <p className="text-sm font-medium text-gray-900">{student.phone}</p>
                                    </div>
                                  </div>
                                )}
                                {student.linkedin_url && (
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                                      <i className="ri-linkedin-box-fill text-blue-600 text-sm"></i>
                                    </div>
                                    <div>
                                      <p className="text-xs text-gray-500">LinkedIn</p>
                                      <a href={student.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-blue-600 hover:underline cursor-pointer">
                                        View Profile
                                      </a>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Skills & Resume Info */}
                            <div className="bg-white rounded-xl p-5 border border-gray-100">
                              <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <i className="ri-code-box-line text-teal-600"></i>
                                Skills ({student.skills.length})
                              </h3>
                              {student.skills.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                  {student.skills.map(skill => (
                                    <span key={skill} className="px-3 py-1.5 rounded-lg bg-teal-50 text-teal-700 text-xs font-medium border border-teal-100">
                                      {skill}
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-sm text-gray-400">No skills data available</p>
                              )}
                            </div>

                            {/* Resumes */}
                            {student.resumes && student.resumes.length > 0 && (
                              <div className="bg-white rounded-xl p-5 border border-gray-100 md:col-span-2">
                                <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                                  <i className="ri-file-text-line text-teal-600"></i>
                                  Resumes ({student.resumes.length})
                                </h3>
                                <div className="space-y-3">
                                  {student.resumes.map((resume) => (
                                    <div key={resume.id} className="flex items-center gap-4 bg-gray-50 rounded-lg p-3 border border-gray-100">
                                      <div className="w-10 h-12 rounded-lg bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center border border-red-200 shrink-0">
                                        <i className={`ri-file-${resume.file_format === 'pdf' ? 'pdf' : 'word'}-line text-${resume.file_format === 'pdf' ? 'red' : 'blue'}-500 text-lg`}></i>
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-gray-900 truncate">{resume.title}</p>
                                        <p className="text-xs text-gray-500">
                                          {resume.original_filename || 'Uploaded file'}
                                          {resume.created_at && ` · ${new Date(resume.created_at).toLocaleDateString()}`}
                                        </p>
                                      </div>
                                      <div className="flex items-center gap-2 shrink-0">
                                        {resume.ats_score != null && (
                                          <span className={`px-2 py-1 rounded-md text-xs font-semibold border ${
                                            resume.ats_score >= 80 ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
                                            resume.ats_score >= 60 ? 'bg-amber-100 text-amber-700 border-amber-200' :
                                            'bg-red-100 text-red-700 border-red-200'
                                          }`}>
                                            ATS: {resume.ats_score.toFixed(0)}%
                                          </span>
                                        )}
                                        {resume.is_optimized && (
                                          <span className="px-2 py-1 rounded-md bg-teal-100 text-teal-700 text-xs font-semibold border border-teal-200">
                                            Optimized
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Academic & Status Details */}
                            <div className="bg-white rounded-xl p-5 border border-gray-100 md:col-span-2">
                              <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <i className="ri-book-open-line text-teal-600"></i>
                                Details
                              </h3>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div>
                                  <p className="text-xs text-gray-500 mb-1">Branch</p>
                                  <p className="text-sm font-semibold text-gray-900">{student.branch || '—'}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500 mb-1">Graduation Year</p>
                                  <p className="text-sm font-semibold text-gray-900">{student.graduation_year || '—'}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500 mb-1">Resumes Uploaded</p>
                                  <p className="text-sm font-semibold text-gray-900">{student.resume_count}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500 mb-1">Onboarding Status</p>
                                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${getStatusBadge(student.status)}`}>
                                    {getStatusLabel(student.status)}
                                  </span>
                                </div>
                              </div>
                            </div>
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
            <div className="px-6 py-16 text-center">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <i className="ri-search-line text-2xl text-gray-400"></i>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No students found</h3>
              <p className="text-sm text-gray-500 mb-4">Try adjusting your filters or search query</p>
              <button
                onClick={clearAllFilters}
                className="px-4 py-2 rounded-lg bg-teal-600 text-white text-sm font-medium hover:bg-teal-700 transition-colors whitespace-nowrap cursor-pointer">
                Clear All Filters
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Floating Action Bar */}
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
              <button
                onClick={() => setSelectedStudents([])}
                className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm font-medium transition-colors whitespace-nowrap cursor-pointer flex items-center gap-2">
                <i className="ri-close-line"></i>
                Clear
              </button>
              <button
                onClick={() => setShowShareModal(true)}
                className="px-5 py-2 rounded-lg bg-white text-teal-600 hover:bg-teal-50 text-sm font-semibold transition-colors whitespace-nowrap cursor-pointer flex items-center gap-2 shadow-lg">
                <i className="ri-share-forward-line"></i>
                Share with Recruiters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {showShareModal && (
        <ShareProfilesModal
          students={getSelectedStudentsData()}
          onClose={() => setShowShareModal(false)}
          onSuccess={() => {
            setShowShareModal(false);
            setSelectedStudents([]);
          }}
        />
      )}

      {/* Settings Modal */}
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

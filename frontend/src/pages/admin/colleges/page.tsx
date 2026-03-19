import { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiService } from '../../../services/api';
import { resolvePath } from '../../../utils/subdomain';

interface CollegeRegistration {
  id: number;
  institution_name: string;
  official_email: string;
  contact_person_name: string;
  designation: string;
  phone_number: string;
  city: string;
  state: string;
  institution_type: string;
  created_at: string;
  approved_at: string | null;
  status: 'pending' | 'approved' | 'rejected';
  rejection_reason?: string;
  student_count: number;
}

export default function AdminColleges() {
  const navigate = useNavigate();
  const [registrations, setRegistrations] = useState<CollegeRegistration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectTargetId, setRejectTargetId] = useState<number>(0);
  const [rejectReason, setRejectReason] = useState('');

  // Check admin auth and load data
  useEffect(() => {
    if (!apiService.isAdminAuthenticated()) {
      navigate(resolvePath('/admin/login'));
      return;
    }
    loadColleges();
  }, [navigate]);

  const loadColleges = async () => {
    setIsLoading(true);
    const result = await apiService.getAdminColleges();
    if (result.success && result.data) {
      setRegistrations(result.data);
    }
    setIsLoading(false);
  };

  const handleLogout = () => {
    apiService.clearAdminToken();
    navigate(resolvePath('/admin/login'));
  };

  const filteredRegistrations = useMemo(() => {
    return registrations.filter(reg => {
      const matchesTab = activeTab === 'all' || reg.status === activeTab;
      const matchesSearch = searchQuery === '' ||
        reg.institution_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        reg.official_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        reg.city.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesTab && matchesSearch;
    });
  }, [registrations, activeTab, searchQuery]);

  const stats = useMemo(() => ({
    total: registrations.length,
    pending: registrations.filter(r => r.status === 'pending').length,
    approved: registrations.filter(r => r.status === 'approved').length,
    rejected: registrations.filter(r => r.status === 'rejected').length,
  }), [registrations]);

  const handleApprove = async (id: number) => {
    const result = await apiService.approveCollege(id);
    if (result.success) {
      setRegistrations(prev =>
        prev.map(reg => reg.id === id ? { ...reg, status: 'approved' as const } : reg)
      );
    }
  };

  const openRejectModal = (id: number) => {
    setRejectTargetId(id);
    setRejectReason('');
    setShowRejectModal(true);
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) return;
    const result = await apiService.rejectCollege(rejectTargetId, rejectReason);
    if (result.success) {
      setRegistrations(prev =>
        prev.map(reg => reg.id === rejectTargetId
          ? { ...reg, status: 'rejected' as const, rejection_reason: rejectReason }
          : reg
        )
      );
    }
    setShowRejectModal(false);
    setRejectTargetId(0);
    setRejectReason('');
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Top Bar */}
      <header className="bg-gray-800/50 backdrop-blur-xl border-b border-gray-700/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center">
                <i className="ri-shield-keyhole-fill text-white text-lg"></i>
              </div>
              <span className="text-xl font-bold text-white">PickCV</span>
            </Link>
            <div className="hidden sm:block h-6 w-px bg-gray-600"></div>
            <span className="hidden sm:block text-sm text-gray-400">Admin Dashboard</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to={resolvePath('/admin/colleges')}
              className="px-4 py-2 rounded-lg bg-teal-500/20 text-teal-300 text-sm font-medium border border-teal-500/30 flex items-center gap-2">
              <i className="ri-building-4-line"></i>
              <span className="hidden sm:inline">Colleges</span>
            </Link>
            <Link
              to={resolvePath('/admin/payments')}
              className="px-4 py-2 rounded-lg text-gray-400 text-sm font-medium hover:text-white hover:bg-gray-700/50 transition-colors flex items-center gap-2">
              <i className="ri-money-rupee-circle-line"></i>
              <span className="hidden sm:inline">Payments</span>
            </Link>
            <button
              onClick={handleLogout}
              className="px-4 py-2 rounded-lg bg-gray-700/50 text-gray-300 text-sm font-medium hover:bg-gray-700 hover:text-white transition-colors flex items-center gap-2 cursor-pointer">
              <i className="ri-logout-box-line"></i>
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Page Header */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-white mb-2">College Registrations</h1>
          <p className="text-gray-400">Review and manage college registration requests</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-gray-800/50 backdrop-blur-xl rounded-xl border border-gray-700/50 p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-lg bg-gray-700 flex items-center justify-center">
                <i className="ri-building-4-line text-gray-300"></i>
              </div>
            </div>
            <p className="text-2xl font-bold text-white">{stats.total}</p>
            <p className="text-sm text-gray-400">Total</p>
          </div>

          <div className="bg-gray-800/50 backdrop-blur-xl rounded-xl border border-amber-500/20 p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-lg bg-amber-500/20 flex items-center justify-center">
                <i className="ri-time-line text-amber-400"></i>
              </div>
            </div>
            <p className="text-2xl font-bold text-amber-400">{stats.pending}</p>
            <p className="text-sm text-gray-400">Pending</p>
          </div>

          <div className="bg-gray-800/50 backdrop-blur-xl rounded-xl border border-emerald-500/20 p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                <i className="ri-checkbox-circle-line text-emerald-400"></i>
              </div>
            </div>
            <p className="text-2xl font-bold text-emerald-400">{stats.approved}</p>
            <p className="text-sm text-gray-400">Approved</p>
          </div>

          <div className="bg-gray-800/50 backdrop-blur-xl rounded-xl border border-red-500/20 p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-lg bg-red-500/20 flex items-center justify-center">
                <i className="ri-close-circle-line text-red-400"></i>
              </div>
            </div>
            <p className="text-2xl font-bold text-red-400">{stats.rejected}</p>
            <p className="text-sm text-gray-400">Rejected</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-gray-800/50 backdrop-blur-xl rounded-2xl border border-gray-700/50 overflow-hidden">
          {/* Tabs and Search */}
          <div className="px-6 py-4 border-b border-gray-700/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              {(['all', 'pending', 'approved', 'rejected'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer whitespace-nowrap ${
                    activeTab === tab
                      ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                      : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/50'
                  }`}>
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  {tab !== 'all' && (
                    <span className="ml-2 text-xs opacity-60">
                      ({stats[tab]})
                    </span>
                  )}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-72">
              <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"></i>
              <input
                type="text"
                placeholder="Search colleges..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500"
              />
            </div>
          </div>

          {/* Registrations Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700/50">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Institution</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Contact</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Location</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Registered</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700/30">
                {filteredRegistrations.map(reg => (
                  <tr key={reg.id} className="hover:bg-gray-700/20 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-semibold text-white">{reg.institution_name}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{reg.official_email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm text-gray-300">{reg.contact_person_name}</p>
                        <p className="text-xs text-gray-500">{reg.designation}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-300">{reg.city}, {reg.state}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-400">{formatDate(reg.created_at)}</p>
                    </td>
                    <td className="px-6 py-4">
                      {reg.status === 'pending' && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          <i className="ri-time-line mr-1.5"></i>
                          Pending
                        </span>
                      )}
                      {reg.status === 'approved' && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <i className="ri-checkbox-circle-line mr-1.5"></i>
                          Approved
                        </span>
                      )}
                      {reg.status === 'rejected' && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20" title={reg.rejection_reason}>
                          <i className="ri-close-circle-line mr-1.5"></i>
                          Rejected
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {reg.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleApprove(reg.id)}
                              className="px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 text-xs font-medium hover:bg-emerald-500/20 transition-colors cursor-pointer flex items-center gap-1.5">
                              <i className="ri-check-line"></i>
                              Approve
                            </button>
                            <button
                              onClick={() => openRejectModal(reg.id)}
                              className="px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 text-xs font-medium hover:bg-red-500/20 transition-colors cursor-pointer flex items-center gap-1.5">
                              <i className="ri-close-line"></i>
                              Reject
                            </button>
                          </>
                        )}
                        {reg.status !== 'pending' && (
                          <span className="text-xs text-gray-500 italic">No actions</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Empty State */}
          {filteredRegistrations.length === 0 && (
            <div className="px-6 py-16 text-center">
              <div className="w-16 h-16 rounded-full bg-gray-700/50 flex items-center justify-center mx-auto mb-4">
                <i className="ri-building-4-line text-2xl text-gray-500"></i>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">No registrations found</h3>
              <p className="text-sm text-gray-500">Try adjusting your filters or search query</p>
            </div>
          )}
        </div>
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowRejectModal(false)}></div>
          <div className="relative bg-gray-800 rounded-2xl border border-gray-700 p-8 w-full max-w-md shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
                <i className="ri-error-warning-line text-red-400 text-xl"></i>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Reject Registration</h3>
                <p className="text-sm text-gray-400">Please provide a reason for rejection</p>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">Rejection Reason *</label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 resize-none"
                rows={4}
                placeholder="Enter the reason for rejecting this registration..."
              />
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowRejectModal(false)}
                className="px-5 py-2.5 rounded-xl bg-gray-700 text-gray-300 text-sm font-medium hover:bg-gray-600 transition-colors cursor-pointer">
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={!rejectReason.trim()}
                className="px-5 py-2.5 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center gap-2">
                <i className="ri-close-circle-line"></i>
                Reject Registration
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

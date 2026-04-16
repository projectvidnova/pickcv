import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../../../services/api';
import { resolvePath } from '../../../utils/subdomain';
import AdminNavbar from '../../../components/feature/AdminNavbar';

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
  plan_type?: string;
  plan_status?: string;
  plan_start_date?: string | null;
  plan_end_date?: string | null;
}

const PLAN_OPTIONS = [
  { value: 'monthly', label: '1 Month', desc: '30 days' },
  { value: 'quarterly', label: '3 Months', desc: '90 days' },
  { value: 'half_yearly', label: '6 Months', desc: '182 days' },
  { value: 'yearly', label: '1 Year', desc: '365 days' },
] as const;

export default function AdminColleges() {
  const navigate = useNavigate();
  const [registrations, setRegistrations] = useState<CollegeRegistration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectTargetId, setRejectTargetId] = useState<number>(0);
  const [rejectReason, setRejectReason] = useState('');
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [planTargetCollege, setPlanTargetCollege] = useState<CollegeRegistration | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<string>('monthly');
  const [planLoading, setPlanLoading] = useState(false);

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

  const openPlanModal = (reg: CollegeRegistration) => {
    setPlanTargetCollege(reg);
    setSelectedPlan(reg.plan_type && reg.plan_type !== 'none' ? reg.plan_type : 'monthly');
    setShowPlanModal(true);
  };

  const handleSetPlan = async () => {
    if (!planTargetCollege) return;
    setPlanLoading(true);
    const result = await apiService.setCollegePlan(planTargetCollege.id, selectedPlan);
    if (result.success && result.data) {
      setRegistrations(prev =>
        prev.map(reg => reg.id === planTargetCollege.id
          ? { ...reg, plan_type: selectedPlan, plan_status: 'active', plan_start_date: result.data.plan_start_date, plan_end_date: result.data.plan_end_date }
          : reg
        )
      );
      setShowPlanModal(false);
      setPlanTargetCollege(null);
    }
    setPlanLoading(false);
  };

  const handleRemovePlan = async (id: number) => {
    const result = await apiService.removeCollegePlan(id);
    if (result.success) {
      setRegistrations(prev =>
        prev.map(reg => reg.id === id
          ? { ...reg, plan_type: 'none', plan_status: 'none', plan_start_date: null, plan_end_date: null }
          : reg
        )
      );
    }
  };

  const getPlanLabel = (planType?: string) => {
    if (!planType || planType === 'none') return null;
    const opt = PLAN_OPTIONS.find(p => p.value === planType);
    return opt?.label || planType;
  };

  const isPlanExpired = (reg: CollegeRegistration) => {
    if (!reg.plan_end_date || reg.plan_status !== 'active') return false;
    return new Date(reg.plan_end_date) < new Date();
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50/30">
      <AdminNavbar activePage="colleges" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-10">
        {/* Page Header */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">College Registrations</h1>
          <p className="text-gray-500">Review and manage college registration requests</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center">
                <i className="ri-building-4-line text-gray-500"></i>
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            <p className="text-sm text-gray-500">Total</p>
          </div>

          <div className="bg-white rounded-xl border border-amber-200 shadow-sm p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center">
                <i className="ri-time-line text-amber-500"></i>
              </div>
            </div>
            <p className="text-2xl font-bold text-amber-600">{stats.pending}</p>
            <p className="text-sm text-gray-500">Pending</p>
          </div>

          <div className="bg-white rounded-xl border border-emerald-200 shadow-sm p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center">
                <i className="ri-checkbox-circle-line text-emerald-500"></i>
              </div>
            </div>
            <p className="text-2xl font-bold text-emerald-600">{stats.approved}</p>
            <p className="text-sm text-gray-500">Approved</p>
          </div>

          <div className="bg-white rounded-xl border border-red-200 shadow-sm p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-lg bg-red-50 flex items-center justify-center">
                <i className="ri-close-circle-line text-red-500"></i>
              </div>
            </div>
            <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
            <p className="text-sm text-gray-500">Rejected</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          {/* Tabs and Search */}
          <div className="px-6 py-4 border-b border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              {(['all', 'pending', 'approved', 'rejected'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer whitespace-nowrap ${
                    activeTab === tab
                      ? 'bg-indigo-50 text-indigo-600 border border-indigo-200'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
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
              <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
              <input
                type="text"
                placeholder="Search colleges..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-400"
              />
            </div>
          </div>

          {/* Registrations Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Institution</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Contact</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Location</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Registered</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Plan</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredRegistrations.map(reg => (
                  <tr key={reg.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{reg.institution_name}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{reg.official_email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm text-gray-700">{reg.contact_person_name}</p>
                        <p className="text-xs text-gray-400">{reg.designation}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-600">{reg.city}, {reg.state}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-500">{formatDate(reg.created_at)}</p>
                    </td>
                    <td className="px-6 py-4">
                      {reg.status === 'pending' && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-600 border border-amber-200">
                          <i className="ri-time-line mr-1.5"></i>
                          Pending
                        </span>
                      )}
                      {reg.status === 'approved' && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-600 border border-emerald-200">
                          <i className="ri-checkbox-circle-line mr-1.5"></i>
                          Approved
                        </span>
                      )}
                      {reg.status === 'rejected' && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-600 border border-red-200" title={reg.rejection_reason}>
                          <i className="ri-close-circle-line mr-1.5"></i>
                          Rejected
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {reg.status === 'approved' ? (
                        <div>
                          {reg.plan_status === 'active' && !isPlanExpired(reg) ? (
                            <div className="flex flex-col gap-1">
                              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-violet-50 text-violet-600 border border-violet-200">
                                <i className="ri-vip-crown-line mr-1"></i>
                                {getPlanLabel(reg.plan_type)}
                              </span>
                              {reg.plan_end_date && (
                                <span className="text-[10px] text-gray-400">
                                  Expires {formatDate(reg.plan_end_date)}
                                </span>
                              )}
                            </div>
                          ) : isPlanExpired(reg) ? (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-50 text-orange-500 border border-orange-200">
                              <i className="ri-time-line mr-1"></i>
                              Expired
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400">No plan</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-gray-300">&mdash;</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {reg.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleApprove(reg.id)}
                              className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-600 text-xs font-medium hover:bg-emerald-100 transition-colors cursor-pointer flex items-center gap-1.5">
                              <i className="ri-check-line"></i>
                              Approve
                            </button>
                            <button
                              onClick={() => openRejectModal(reg.id)}
                              className="px-3 py-1.5 rounded-lg bg-red-50 text-red-600 text-xs font-medium hover:bg-red-100 transition-colors cursor-pointer flex items-center gap-1.5">
                              <i className="ri-close-line"></i>
                              Reject
                            </button>
                          </>
                        )}
                        {reg.status === 'approved' && (
                          <>
                            <button
                              onClick={() => openPlanModal(reg)}
                              className="px-3 py-1.5 rounded-lg bg-violet-50 text-violet-600 text-xs font-medium hover:bg-violet-100 transition-colors cursor-pointer flex items-center gap-1.5">
                              <i className="ri-vip-crown-line"></i>
                              {reg.plan_status === 'active' && !isPlanExpired(reg) ? 'Change Plan' : 'Set Plan'}
                            </button>
                            {reg.plan_status === 'active' && !isPlanExpired(reg) && (
                              <button
                                onClick={() => handleRemovePlan(reg.id)}
                                className="px-3 py-1.5 rounded-lg bg-gray-50 text-gray-500 text-xs font-medium hover:bg-gray-100 transition-colors cursor-pointer flex items-center gap-1.5">
                                <i className="ri-close-line"></i>
                                Remove
                              </button>
                            )}
                          </>
                        )}
                        {reg.status === 'rejected' && (
                          <span className="text-xs text-gray-400 italic">Rejected</span>
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
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <i className="ri-building-4-line text-2xl text-gray-400"></i>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No registrations found</h3>
              <p className="text-sm text-gray-500">Try adjusting your filters or search query</p>
            </div>
          )}
        </div>
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setShowRejectModal(false)}></div>
          <div className="relative bg-white rounded-2xl border border-gray-200 p-8 w-full max-w-md shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
                <i className="ri-error-warning-line text-red-500 text-xl"></i>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Reject Registration</h3>
                <p className="text-sm text-gray-500">Please provide a reason for rejection</p>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Rejection Reason *</label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-400 resize-none"
                rows={4}
                placeholder="Enter the reason for rejecting this registration..."
              />
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowRejectModal(false)}
                className="px-5 py-2.5 rounded-xl bg-gray-100 text-gray-600 text-sm font-medium hover:bg-gray-200 transition-colors cursor-pointer">
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

      {/* Plan Modal */}
      {showPlanModal && planTargetCollege && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setShowPlanModal(false)}></div>
          <div className="relative bg-white rounded-2xl border border-gray-200 p-8 w-full max-w-md shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-violet-50 flex items-center justify-center">
                <i className="ri-vip-crown-line text-violet-500 text-xl"></i>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Set Plan</h3>
                <p className="text-sm text-gray-500 truncate max-w-[280px]">{planTargetCollege.institution_name}</p>
              </div>
            </div>

            <div className="mb-6 space-y-3">
              {PLAN_OPTIONS.map(opt => (
                <label
                  key={opt.value}
                  className={`flex items-center gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                    selectedPlan === opt.value
                      ? 'border-violet-400 bg-violet-50/50'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <input
                    type="radio"
                    name="plan"
                    value={opt.value}
                    checked={selectedPlan === opt.value}
                    onChange={() => setSelectedPlan(opt.value)}
                    className="accent-violet-500"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900">{opt.label}</p>
                    <p className="text-xs text-gray-400">{opt.desc} from today</p>
                  </div>
                </label>
              ))}
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowPlanModal(false)}
                className="px-5 py-2.5 rounded-xl bg-gray-100 text-gray-600 text-sm font-medium hover:bg-gray-200 transition-colors cursor-pointer">
                Cancel
              </button>
              <button
                onClick={handleSetPlan}
                disabled={planLoading}
                className="px-5 py-2.5 rounded-xl bg-violet-500 text-white text-sm font-semibold hover:bg-violet-600 transition-colors disabled:opacity-50 cursor-pointer flex items-center gap-2">
                {planLoading ? (
                  <i className="ri-loader-4-line animate-spin"></i>
                ) : (
                  <i className="ri-vip-crown-line"></i>
                )}
                Activate Plan
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

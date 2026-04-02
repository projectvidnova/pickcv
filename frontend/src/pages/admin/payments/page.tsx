import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../../../services/api';
import { resolvePath } from '../../../utils/subdomain';
import AdminNavbar from '../../../components/feature/AdminNavbar';

interface PaymentItem {
  id: number;
  user_id: number;
  user_email: string | null;
  user_name: string | null;
  resume_id: number | null;
  resume_title: string | null;
  zoho_session_id: string | null;
  zoho_payment_id: string | null;
  amount: number;
  currency: string;
  status: string;
  description: string | null;
  reference_number: string | null;
  product_type: string;
  created_at: string | null;
  paid_at: string | null;
}

interface PaymentStats {
  total_payments: number;
  succeeded: number;
  failed: number;
  pending: number;
  total_revenue: number;
  currency: string;
  active_subscriptions?: number;
  monthly_subscriptions?: number;
  yearly_subscriptions?: number;
  free_downloads_used?: number;
}

interface PaginatedResponse {
  items: PaymentItem[];
  total: number;
  page: number;
  per_page: number;
  pages: number;
}

export default function AdminPayments() {
  const navigate = useNavigate();
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [stats, setStats] = useState<PaymentStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'succeeded' | 'pending' | 'failed'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    if (!apiService.isAdminAuthenticated()) {
      navigate(resolvePath('/admin/login'));
      return;
    }
    loadStats();
  }, [navigate]);

  useEffect(() => {
    loadPayments();
  }, [activeTab, currentPage]);

  const loadStats = async () => {
    const result = await apiService.getAdminPaymentStats();
    if (result.success && result.data) {
      setStats(result.data);
    }
  };

  const loadPayments = async () => {
    setIsLoading(true);
    const statusFilter = activeTab === 'all' ? undefined : activeTab;
    const result = await apiService.getAdminPayments(statusFilter, currentPage, 50);
    if (result.success && result.data) {
      const data = result.data as PaginatedResponse;
      setPayments(data.items);
      setTotalPages(data.pages);
      setTotalCount(data.total);
    }
    setIsLoading(false);
  };

  const handleLogout = () => {
    apiService.clearAdminToken();
    navigate(resolvePath('/admin/login'));
  };

  const filteredPayments = useMemo(() => {
    if (!searchQuery) return payments;
    const q = searchQuery.toLowerCase();
    return payments.filter(p =>
      (p.user_email?.toLowerCase().includes(q)) ||
      (p.user_name?.toLowerCase().includes(q)) ||
      (p.reference_number?.toLowerCase().includes(q)) ||
      (p.zoho_payment_id?.toLowerCase().includes(q)) ||
      (p.resume_title?.toLowerCase().includes(q))
    );
  }, [payments, searchQuery]);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (amount: number, currency: string = 'INR') => {
    return currency === 'INR' ? `₹${amount.toFixed(2)}` : `$${amount.toFixed(2)}`;
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case 'succeeded':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-600 border border-emerald-200">
            <i className="ri-checkbox-circle-line mr-1.5"></i>
            Succeeded
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-600 border border-amber-200">
            <i className="ri-time-line mr-1.5"></i>
            Pending
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-600 border border-red-200">
            <i className="ri-close-circle-line mr-1.5"></i>
            Failed
          </span>
        );
      case 'refunded':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-600 border border-blue-200">
            <i className="ri-refund-line mr-1.5"></i>
            Refunded
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-500 border border-gray-200">
            {status}
          </span>
        );
    }
  };

  const handleTabChange = (tab: typeof activeTab) => {
    setActiveTab(tab);
    setCurrentPage(1);
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50/30">
      <AdminNavbar activePage="payments" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-10">
        {/* Page Header */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment History</h1>
          <p className="text-gray-500">View all payment transactions across the platform</p>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center">
                  <i className="ri-file-list-3-line text-gray-500"></i>
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900">{stats.total_payments}</p>
              <p className="text-sm text-gray-500">Total</p>
            </div>

            <div className="bg-white rounded-xl border border-emerald-200 shadow-sm p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center">
                  <i className="ri-checkbox-circle-line text-emerald-500"></i>
                </div>
              </div>
              <p className="text-2xl font-bold text-emerald-600">{stats.succeeded}</p>
              <p className="text-sm text-gray-500">Succeeded</p>
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

            <div className="bg-white rounded-xl border border-red-200 shadow-sm p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-lg bg-red-50 flex items-center justify-center">
                  <i className="ri-close-circle-line text-red-500"></i>
                </div>
              </div>
              <p className="text-2xl font-bold text-red-600">{stats.failed}</p>
              <p className="text-sm text-gray-500">Failed</p>
            </div>

            <div className="col-span-2 lg:col-span-1 bg-white rounded-xl border border-indigo-200 shadow-sm p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center">
                  <i className="ri-money-rupee-circle-line text-indigo-500"></i>
                </div>
              </div>
              <p className="text-2xl font-bold text-indigo-600">{formatCurrency(stats.total_revenue, stats.currency)}</p>
              <p className="text-sm text-gray-500">Revenue</p>
            </div>
          </div>
        )}

        {/* Subscription Stats */}
        {stats && (stats.active_subscriptions !== undefined && stats.active_subscriptions > 0 || stats.free_downloads_used !== undefined && stats.free_downloads_used > 0) && (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            <div className="bg-white rounded-xl border border-purple-200 shadow-sm p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-lg bg-purple-50 flex items-center justify-center">
                  <i className="ri-vip-crown-line text-purple-500"></i>
                </div>
              </div>
              <p className="text-2xl font-bold text-purple-600">{stats.active_subscriptions || 0}</p>
              <p className="text-sm text-gray-500">Active Subscriptions</p>
              <p className="text-xs text-gray-400 mt-1">
                {stats.monthly_subscriptions || 0} monthly • {stats.yearly_subscriptions || 0} yearly
              </p>
            </div>

            <div className="bg-white rounded-xl border border-cyan-200 shadow-sm p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-lg bg-cyan-50 flex items-center justify-center">
                  <i className="ri-gift-line text-cyan-500"></i>
                </div>
              </div>
              <p className="text-2xl font-bold text-cyan-600">{stats.free_downloads_used || 0}</p>
              <p className="text-sm text-gray-500">Free Downloads Used</p>
            </div>
          </div>
        )}

        {/* Payments Table Card */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          {/* Tabs and Search */}
          <div className="px-6 py-4 border-b border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              {(['all', 'succeeded', 'pending', 'failed'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => handleTabChange(tab)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer whitespace-nowrap ${
                    activeTab === tab
                      ? 'bg-indigo-50 text-indigo-600 border border-indigo-200'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  {tab !== 'all' && stats && (
                    <span className="ml-2 text-xs opacity-60">
                      ({stats[tab as keyof Pick<PaymentStats, 'succeeded' | 'pending' | 'failed'>]})
                    </span>
                  )}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-72">
              <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
              <input
                type="text"
                placeholder="Search by email, name, ref..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-400"
              />
            </div>
          </div>

          {/* Loading State */}
          {isLoading ? (
            <div className="px-6 py-16 text-center">
              <div className="w-10 h-10 border-2 border-indigo-200 border-t-indigo-500 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-sm text-gray-500">Loading payments...</p>
            </div>
          ) : (
            <>
              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">ID</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">User</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Resume</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Reference</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Created</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Paid At</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredPayments.map(p => (
                      <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <span className="text-sm text-gray-500 font-mono">#{p.id}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{p.user_name || 'Unknown'}</p>
                            <p className="text-xs text-gray-400 mt-0.5">{p.user_email || `User #${p.user_id}`}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-gray-600 max-w-[180px] truncate" title={p.resume_title || undefined}>
                            {p.resume_title || (p.resume_id ? `Resume #${p.resume_id}` : '—')}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm font-semibold text-gray-900">{formatCurrency(p.amount, p.currency)}</p>
                        </td>
                        <td className="px-6 py-4">
                          {p.product_type === 'free_download' ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-cyan-50 text-cyan-600 border border-cyan-200">
                              <i className="ri-gift-line mr-1"></i>Free
                            </span>
                          ) : p.product_type === 'subscription_monthly' ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-purple-50 text-purple-600 border border-purple-200">
                              <i className="ri-calendar-line mr-1"></i>Monthly
                            </span>
                          ) : p.product_type === 'subscription_yearly' ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-600 border border-amber-200">
                              <i className="ri-vip-crown-line mr-1"></i>Yearly
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 text-gray-500 border border-gray-200">
                              <i className="ri-file-download-line mr-1"></i>Per Resume
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-xs font-mono text-gray-500" title={p.zoho_payment_id || undefined}>
                            {p.reference_number || '—'}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          {statusBadge(p.status)}
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-gray-500">{formatDate(p.created_at)}</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-gray-500">{formatDate(p.paid_at)}</p>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Empty State */}
              {filteredPayments.length === 0 && (
                <div className="px-6 py-16 text-center">
                  <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                    <i className="ri-money-rupee-circle-line text-2xl text-gray-400"></i>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No payments found</h3>
                  <p className="text-sm text-gray-500">
                    {searchQuery ? 'Try adjusting your search query' : 'No payment transactions yet'}
                  </p>
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
                  <p className="text-sm text-gray-500">
                    Showing {((currentPage - 1) * 50) + 1}–{Math.min(currentPage * 50, totalCount)} of {totalCount} payments
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 text-sm hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                    >
                      <i className="ri-arrow-left-s-line"></i>
                    </button>
                    <span className="text-sm text-gray-500">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 text-sm hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                    >
                      <i className="ri-arrow-right-s-line"></i>
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </main>
  );
}

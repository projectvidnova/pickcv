import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../../../services/api';
import { resolvePath } from '../../../utils/subdomain';
import AdminNavbar from '../../../components/feature/AdminNavbar';

export default function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await apiService.adminLogin(email, password);
      if (!result.success) {
        setError(result.error || 'Invalid admin credentials');
      } else {
        navigate(resolvePath('/admin/colleges'));
      }
    } catch {
      setError('Something went wrong. Please try again.');
    }

    setIsLoading(false);
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50/30">
      <AdminNavbar />

      <div className="pt-32 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto">
          {/* Header */}
          <div className="text-center mb-10">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center mx-auto mb-5">
              <i className="ri-shield-keyhole-fill text-white text-3xl"></i>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-3">Admin Portal</h1>
            <p className="text-base text-gray-600">Access the admin dashboard to manage PickCV</p>
          </div>

          {/* Login Form */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <form onSubmit={handleLogin} className="space-y-6">
              {/* Error */}
              {error && (
                <div className="p-4 rounded-lg bg-red-50 border border-red-200">
                  <div className="flex items-start gap-3">
                    <i className="ri-error-warning-line text-red-600 text-lg mt-0.5"></i>
                    <p className="text-sm text-red-800 flex-1">{error}</p>
                  </div>
                </div>
              )}

              {/* Email */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="admin@pickcv.com"
                  required
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 pr-12 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Enter admin password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer">
                    <i className={`ri-${showPassword ? 'eye-off' : 'eye'}-line`}></i>
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 rounded-lg bg-gradient-to-r from-indigo-500 to-violet-500 text-white text-sm font-semibold hover:from-indigo-600 hover:to-violet-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer">
                {isLoading ? (
                  <>
                    <i className="ri-loader-4-line animate-spin"></i>
                    Authenticating...
                  </>
                ) : (
                  <>
                    Sign In
                    <i className="ri-arrow-right-line"></i>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Footer text */}
          <p className="text-center text-gray-400 text-xs mt-8">
            PickCV Admin Portal &bull; Authorized Personnel Only
          </p>
        </div>
      </div>
    </main>
  );
}

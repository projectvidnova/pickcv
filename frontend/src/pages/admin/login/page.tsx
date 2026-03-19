import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiService } from '../../../services/api';
import { resolvePath } from '../../../utils/subdomain';

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
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      {/* Background Decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-teal-500/5 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl"></div>
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-10">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center">
              <i className="ri-shield-keyhole-fill text-white text-xl"></i>
            </div>
            <span className="text-2xl font-bold text-white">PickCV Admin</span>
          </Link>
        </div>

        {/* Login Card */}
        <div className="bg-gray-800/50 backdrop-blur-xl rounded-2xl border border-gray-700/50 p-8 shadow-2xl">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-white mb-2">Admin Portal</h1>
            <p className="text-gray-400 text-sm">Access the admin dashboard to manage colleges</p>
          </div>

          {/* Demo Credentials Banner */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6">
              <div className="flex items-center gap-3">
                <i className="ri-error-warning-line text-red-400 text-lg"></i>
                <p className="text-red-300 text-sm">{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Email Address</label>
              <div className="relative">
                <i className="ri-mail-line absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"></i>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition-all"
                  placeholder="admin@pickcv.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
              <div className="relative">
                <i className="ri-lock-2-line absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"></i>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-12 py-3 bg-gray-700/50 border border-gray-600 rounded-xl text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition-all"
                  placeholder="Enter admin password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 cursor-pointer">
                  <i className={`ri-${showPassword ? 'eye-off' : 'eye'}-line`}></i>
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 text-white font-semibold text-sm hover:from-teal-600 hover:to-emerald-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-teal-500/20">
              {isLoading ? (
                <>
                  <i className="ri-loader-4-line animate-spin"></i>
                  Authenticating...
                </>
              ) : (
                <>
                  <i className="ri-shield-check-line"></i>
                  Sign In to Admin
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link to="/" className="text-sm text-gray-500 hover:text-teal-400 transition-colors">
              ← Back to PickCV
            </Link>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-gray-600 text-xs mt-8">
          PickCV Admin Portal • Authorized Personnel Only
        </p>
      </div>
    </main>
  );
}

import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { apiService } from '../../services/api';
import { googleAuthService } from '../../services/googleAuthService';
import { linkedinAuthService } from '../../services/linkedinAuthService';

interface InviteInfo {
  college_name: string;
  college_logo: string | null;
  student_email: string;
  student_name: string | null;
  status: string;
}

export default function InvitePage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get('token') || '';

  const [inviteInfo, setInviteInfo] = useState<InviteInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Registration form
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [view, setView] = useState<'form' | 'verification-sent' | 'already-registered'>('form');
  const [googleLoading, setGoogleLoading] = useState(false);
  const [linkedinLoading, setLinkedinLoading] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('No invitation token provided. Please use the link from your email.');
      setLoading(false);
      return;
    }
    verifyToken();
  }, [token]);

  const verifyToken = async () => {
    const res = await apiService.verifyInviteToken(token);
    if (res.success && res.data) {
      setInviteInfo(res.data);
      setFormData(prev => ({
        ...prev,
        email: res.data.student_email || '',
        name: res.data.student_name || '',
      }));
      if (res.data.status === 'registered' || res.data.status === 'ready') {
        setView('already-registered');
      }
    } else {
      setError(res.error || 'This invitation link is invalid or has expired.');
    }
    setLoading(false);
  };

  const handleGoogleSignIn = () => {
    setGoogleLoading(true);
    // Store invite context so callback can show success
    sessionStorage.setItem('invite_college', inviteInfo?.college_name || '');
    googleAuthService.redirectToGoogleLogin();
  };

  const handleLinkedInSignIn = () => {
    setLinkedinLoading(true);
    sessionStorage.setItem('invite_college', inviteInfo?.college_name || '');
    linkedinAuthService.redirectToLinkedInLogin();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setIsSubmitting(true);

    const result = await apiService.register(formData.email, formData.password, formData.name);
    if (result.success) {
      setView('verification-sent');
    } else {
      setFormError(result.error || 'Registration failed');
    }
    setIsSubmitting(false);
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-emerald-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-3 border-teal-200 border-t-teal-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Verifying your invitation...</p>
        </div>
      </div>
    );
  }

  // Invalid/expired token
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-emerald-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="ri-link-unlink text-2xl text-red-500"></i>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Invalid Invitation</h2>
          <p className="text-gray-500 mb-6">{error}</p>
          <button onClick={() => navigate('/')} className="px-6 py-2.5 bg-teal-600 text-white rounded-lg font-semibold hover:bg-teal-700 transition-colors">
            Go to PickCV
          </button>
        </div>
      </div>
    );
  }

  // Already registered
  if (view === 'already-registered' && inviteInfo) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-emerald-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 text-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="ri-check-double-line text-2xl text-emerald-600"></i>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">You're Already Registered!</h2>
          <p className="text-gray-500 mb-2">
            You're connected with <strong>{inviteInfo.college_name}</strong>.
          </p>
          <p className="text-sm text-gray-400 mb-6">
            Sign in to upload your resume and get started with AI-powered optimization.
          </p>
          <div className="space-y-3">
            <button onClick={handleGoogleSignIn} disabled={googleLoading}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white border-2 border-gray-200 rounded-xl hover:bg-gray-50 transition-all font-medium text-gray-700">
              {googleLoading ? <i className="ri-loader-4-line animate-spin text-lg"></i> : (
                <svg width="18" height="18" viewBox="0 0 18 18"><path d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92a8.78 8.78 0 0 0 2.68-6.62Z" fill="#4285F4"/><path d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.83.86-3.04.86-2.34 0-4.33-1.58-5.04-3.71H.96v2.33A9 9 0 0 0 9 18Z" fill="#34A853"/><path d="M3.96 10.71A5.41 5.41 0 0 1 3.68 9c0-.6.1-1.17.28-1.71V4.96H.96A9 9 0 0 0 0 9c0 1.45.35 2.82.96 4.04l3-2.33Z" fill="#FBBC05"/><path d="M9 3.58c1.32 0 2.5.46 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.96l3 2.33C4.67 5.16 6.66 3.58 9 3.58Z" fill="#EA4335"/></svg>
              )}
              Sign in with Google
            </button>
            <button onClick={() => navigate('/')}
              className="w-full py-3 text-teal-600 font-medium hover:underline text-sm">
              Go to PickCV Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Verification sent
  if (view === 'verification-sent') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-emerald-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="ri-mail-check-line text-2xl text-blue-600"></i>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Check Your Email</h2>
          <p className="text-gray-500 mb-2">
            We've sent a verification link to <strong>{formData.email}</strong>.
          </p>
          <p className="text-sm text-gray-400 mb-6">
            Click the link in the email to verify your account, then sign in to start building your resume.
          </p>
          <div className="bg-teal-50 border border-teal-200 rounded-xl p-4 text-left">
            <h4 className="text-sm font-semibold text-teal-800 mb-2">What happens next?</h4>
            <ol className="text-xs text-teal-700 space-y-1.5">
              <li className="flex items-start gap-2">
                <span className="bg-teal-600 text-white w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">1</span>
                Verify your email (check spam if you don't see it)
              </li>
              <li className="flex items-start gap-2">
                <span className="bg-teal-600 text-white w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">2</span>
                Sign in to PickCV
              </li>
              <li className="flex items-start gap-2">
                <span className="bg-teal-600 text-white w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">3</span>
                Upload your resume for AI-powered optimization
              </li>
              <li className="flex items-start gap-2">
                <span className="bg-teal-600 text-white w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">4</span>
                {inviteInfo?.college_name} will see your career readiness
              </li>
            </ol>
          </div>
        </div>
      </div>
    );
  }

  // Main registration form
  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-emerald-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* College header */}
        <div className="text-center mb-6">
          {inviteInfo?.college_logo ? (
            <img src={inviteInfo.college_logo} alt={inviteInfo.college_name} className="w-16 h-16 rounded-xl object-cover mx-auto mb-3 border border-gray-200 shadow-sm" />
          ) : (
            <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-emerald-500 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-lg">
              <i className="ri-graduation-cap-line text-2xl text-white"></i>
            </div>
          )}
          <h1 className="text-2xl font-bold text-gray-900">You're Invited!</h1>
          <p className="text-gray-500 mt-1">
            <strong className="text-teal-700">{inviteInfo?.college_name}</strong> invites you to join PickCV
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Benefits strip */}
          <div className="bg-gradient-to-r from-teal-600 to-emerald-500 px-6 py-4">
            <div className="flex items-center gap-6 text-white/90 text-xs">
              <span className="flex items-center gap-1.5"><i className="ri-file-text-line"></i>AI Resume</span>
              <span className="flex items-center gap-1.5"><i className="ri-target-line"></i>ATS Score</span>
              <span className="flex items-center gap-1.5"><i className="ri-briefcase-line"></i>Job Match</span>
            </div>
          </div>

          <div className="p-6 space-y-5">
            {/* OAuth buttons */}
            <div className="space-y-3">
              <button onClick={handleGoogleSignIn} disabled={googleLoading}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white border-2 border-gray-200 rounded-xl hover:border-gray-300 hover:bg-gray-50 transition-all font-medium text-gray-700">
                {googleLoading ? <i className="ri-loader-4-line animate-spin text-lg"></i> : (
                  <svg width="18" height="18" viewBox="0 0 18 18"><path d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92a8.78 8.78 0 0 0 2.68-6.62Z" fill="#4285F4"/><path d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.83.86-3.04.86-2.34 0-4.33-1.58-5.04-3.71H.96v2.33A9 9 0 0 0 9 18Z" fill="#34A853"/><path d="M3.96 10.71A5.41 5.41 0 0 1 3.68 9c0-.6.1-1.17.28-1.71V4.96H.96A9 9 0 0 0 0 9c0 1.45.35 2.82.96 4.04l3-2.33Z" fill="#FBBC05"/><path d="M9 3.58c1.32 0 2.5.46 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.96l3 2.33C4.67 5.16 6.66 3.58 9 3.58Z" fill="#EA4335"/></svg>
                )}
                Continue with Google
              </button>
              <button onClick={handleLinkedInSignIn} disabled={linkedinLoading}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-[#0A66C2] text-white rounded-xl hover:bg-[#004182] transition-all font-medium">
                {linkedinLoading ? <i className="ri-loader-4-line animate-spin text-lg"></i> : <i className="ri-linkedin-fill text-lg"></i>}
                Continue with LinkedIn
              </button>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-xs text-gray-400 font-medium">or register with email</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            {/* Email form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Full Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="Your full name"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-teal-200 focus:border-teal-400 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  required
                  placeholder="you@college.edu"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-teal-200 focus:border-teal-400 transition-all bg-gray-50"
                />
                <p className="text-[11px] text-gray-400 mt-1">Use the same email your college registered you with</p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                    required
                    minLength={6}
                    placeholder="Min. 6 characters"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-teal-200 focus:border-teal-400 transition-all pr-10"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    <i className={showPassword ? 'ri-eye-off-line' : 'ri-eye-line'}></i>
                  </button>
                </div>
              </div>

              {formError && (
                <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2 flex items-center gap-1.5">
                  <i className="ri-error-warning-line"></i>{formError}
                </p>
              )}

              <button type="submit" disabled={isSubmitting}
                className="w-full py-3 bg-gradient-to-r from-teal-600 to-emerald-500 text-white rounded-xl font-semibold hover:from-teal-700 hover:to-emerald-600 transition-all disabled:opacity-60">
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2"><i className="ri-loader-4-line animate-spin"></i>Creating account...</span>
                ) : 'Create Account'}
              </button>
            </form>

            <p className="text-xs text-center text-gray-400">
              Already have an account?{' '}
              <button onClick={() => navigate('/')} className="text-teal-600 font-medium hover:underline">
                Sign in
              </button>
            </p>
          </div>
        </div>

        {/* Footer note */}
        <p className="text-center text-xs text-gray-400 mt-4">
          This invitation was sent by {inviteInfo?.college_name} via PickCV
        </p>
      </div>
    </div>
  );
}

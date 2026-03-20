import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../../services/api';
import { googleAuthService } from '../../services/googleAuthService';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type ModalView = 'form' | 'verification-sent';

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [linkedinLoading, setLinkedinLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modalView, setModalView] = useState<ModalView>('form');
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [showResendOnError, setShowResendOnError] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  useEffect(() => {
    const pwd = formData.password;
    let strength = 0;
    if (pwd.length >= 6) strength++;
    if (pwd.length >= 10) strength++;
    if (/[A-Z]/.test(pwd)) strength++;
    if (/[0-9]/.test(pwd)) strength++;
    if (/[^A-Za-z0-9]/.test(pwd)) strength++;
    setPasswordStrength(Math.min(strength, 4));
  }, [formData.password]);

  if (!isOpen) return null;

  const handleGoogleSignIn = () => {
    setGoogleLoading(true);
    try {
      googleAuthService.redirectToGoogleLogin();
    } catch (error) {
      console.error('Google sign in error:', error);
      setError(error instanceof Error ? error.message : 'Failed to sign in with Google');
      setGoogleLoading(false);
    }
  };

  const handleLinkedInSignIn = () => {
    // LinkedIn OAuth not yet configured — coming soon
    setError('LinkedIn sign-in is coming soon. Please use Google or email.');
  };

  const handleResendVerification = async (email: string) => {
    setResendLoading(true);
    setResendSuccess(false);
    try {
      const result = await apiService.resendVerification(email);
      if (result.success) {
        setResendSuccess(true);
        setTimeout(() => setResendSuccess(false), 5000);
      } else {
        setError(result.error || 'Failed to resend. Please try again.');
      }
    } catch {
      setError('Failed to resend verification email.');
    } finally {
      setResendLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (isLogin) {
        // Login
        const result = await apiService.login(formData.email, formData.password);
        if (result.success) {
          onClose();
          navigate('/onboarding', {
            state: {
              prefill: {
                email: formData.email,
                phone: '',
              },
            },
          });
        } else {
          const msg = result.error || 'Login failed';
          setError(msg);
          // Detect "verify your email" errors and show resend button
          if (msg.toLowerCase().includes('verify')) {
            setShowResendOnError(true);
            setRegisteredEmail(formData.email);
          } else {
            setShowResendOnError(false);
          }
        }
      } else {
        // Register
        const result = await apiService.register(
          formData.email,
          formData.password,
          formData.name
        );
        if (result.success) {
          // Show verification-sent screen inside the modal
          setError(null);
          setRegisteredEmail(formData.email);
          setModalView('verification-sent');
        } else {
          setError(result.error || 'Registration failed');
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setFormData({ name: '', email: '', password: '' });
    setError(null);
    setModalView('form');
    setShowResendOnError(false);
    setResendSuccess(false);
  };

  const strengthLabels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
  const strengthColors = ['', 'bg-red-500', 'bg-amber-500', 'bg-yellow-400', 'bg-emerald-500'];
  const strengthTextColors = ['', 'text-red-500', 'text-amber-500', 'text-yellow-500', 'text-emerald-500'];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className={`absolute inset-0 transition-opacity duration-400 ${isAnimating ? 'opacity-100' : 'opacity-0'}`}
        style={{ background: 'rgba(15, 40, 35, 0.45)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
        onClick={onClose}
      />

      {/* Decorative orbs behind modal */}
      <div className="absolute w-72 h-72 orb orb-teal top-1/4 left-1/4 pointer-events-none" style={{ zIndex: 101 }} />
      <div className="absolute w-56 h-56 orb orb-emerald bottom-1/4 right-1/4 pointer-events-none" style={{ zIndex: 101 }} />

      {/* Modal */}
      <div
        className={`relative glass-modal rounded-2xl w-full max-w-[440px] overflow-hidden transition-all duration-500 ${
          isAnimating ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-4'
        }`}
        style={{ zIndex: 102 }}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-white/60 rounded-lg transition-all z-10 cursor-pointer"
        >
          <i className="ri-close-line text-xl" />
        </button>

        <div className="px-8 pt-8 pb-7">
          {/* ─── Verification-Sent View ─── */}
          {modalView === 'verification-sent' ? (
            <div className="text-center py-4">
              <div className="mx-auto mb-5 h-16 w-16 rounded-full bg-teal-50 flex items-center justify-center">
                <svg className="h-8 w-8 text-teal-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Check your email</h2>
              <p className="text-sm text-gray-500 mb-1">
                We've sent a verification link to
              </p>
              <p className="text-sm font-semibold text-teal-600 mb-6">{registeredEmail}</p>
              <p className="text-xs text-gray-400 mb-6">
                Click the link in the email to verify your account, then come back to sign in. The link expires in 24 hours.
              </p>

              {resendSuccess && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-sm text-emerald-700 mb-4">
                  ✅ Verification email resent! Check your inbox.
                </div>
              )}

              <button
                type="button"
                onClick={() => handleResendVerification(registeredEmail)}
                disabled={resendLoading}
                className="text-sm text-teal-600 hover:text-teal-700 font-medium cursor-pointer disabled:opacity-50 mb-5"
              >
                {resendLoading ? 'Resending…' : "Didn't get the email? Resend"}
              </button>

              <div className="border-t border-gray-100 pt-5">
                <button
                  type="button"
                  onClick={() => { setModalView('form'); setIsLogin(true); setError(null); }}
                  className="w-full py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 transition-all shadow-md cursor-pointer"
                >
                  Go to Sign In
                </button>
              </div>
            </div>
          ) : (
          <>
          {/* Header */}
          <div className="text-center mb-7">
            <div className="inline-flex items-center justify-center mb-5">
              <img
                src="https://static.readdy.ai/image/118f59b514d655f060b6a8ef60c2b755/e0bd9983c8b60cb1b82cd43c64b6d0bd.png"
                alt="PickCV"
                className="h-8 w-auto"
              />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">
              {isLogin ? 'Welcome back' : 'Create your account'}
            </h2>
            <p className="text-sm text-gray-500">
              {isLogin ? 'Sign in to continue to PickCV' : 'Get started with PickCV for free'}
            </p>
          </div>

          {/* Social Login */}
          <div className="space-y-2.5 mb-6">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={googleLoading || linkedinLoading}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 glass rounded-xl text-sm font-medium text-gray-700 hover:bg-white/80 transition-all whitespace-nowrap cursor-pointer group disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {googleLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-gray-300 border-t-rose-500 rounded-full animate-spin" />
                  <span className="text-gray-500">Connecting to Google...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                  <span className="group-hover:text-gray-900 transition-colors">Continue with Google</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleLinkedInSignIn}
              disabled={googleLoading || linkedinLoading}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-[#0A66C2] rounded-xl text-sm font-medium text-white hover:bg-[#004182] transition-all whitespace-nowrap cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {linkedinLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  <span>Connecting to LinkedIn...</span>
                </>
              ) : (
                <>
                  <i className="ri-linkedin-fill text-lg" />
                  <span>Continue with LinkedIn</span>
                </>
              )}
            </button>
          </div>

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/60" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-3 text-gray-400 font-medium" style={{ background: 'transparent' }}>or</span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {!isLogin && (
              <div>
                <label htmlFor="name" className="block text-xs font-semibold text-gray-700 mb-1.5">Full name</label>
                <div className={`relative flex items-center rounded-xl transition-all duration-200 glass-input ${focusedField === 'name' ? 'ring-2 ring-teal-400/30' : ''}`}>
                  <input
                    type="text" id="name" name="name" value={formData.name}
                    onChange={handleChange} onFocus={() => setFocusedField('name')} onBlur={() => setFocusedField(null)}
                    placeholder="e.g. Rahul Sharma"
                    className="w-full px-4 py-3 text-sm bg-transparent focus:outline-none text-gray-900 placeholder:text-gray-400 rounded-xl"
                    required={!isLogin}
                  />
                </div>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-gray-700 mb-1.5">Email address</label>
              <div className={`relative flex items-center rounded-xl transition-all duration-200 glass-input ${focusedField === 'email' ? 'ring-2 ring-teal-400/30' : ''}`}>
                <input
                  type="email" id="email" name="email" value={formData.email}
                  onChange={handleChange} onFocus={() => setFocusedField('email')} onBlur={() => setFocusedField(null)}
                  placeholder="you@example.com"
                  className="w-full px-4 py-3 text-sm bg-transparent focus:outline-none text-gray-900 placeholder:text-gray-400 rounded-xl"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="password" className="block text-xs font-semibold text-gray-700">Password</label>
                {isLogin && (
                  <button type="button" className="text-xs text-teal-600 hover:text-teal-700 font-medium whitespace-nowrap cursor-pointer">
                    Forgot password?
                  </button>
                )}
              </div>
              <div className={`relative flex items-center rounded-xl transition-all duration-200 glass-input ${focusedField === 'password' ? 'ring-2 ring-teal-400/30' : ''}`}>
                <input
                  type={showPassword ? 'text' : 'password'} id="password" name="password" value={formData.password}
                  onChange={handleChange} onFocus={() => setFocusedField('password')} onBlur={() => setFocusedField(null)}
                  placeholder={isLogin ? 'Enter your password' : 'Create a password'}
                  className="w-full pl-4 pr-11 py-3 text-sm bg-transparent focus:outline-none text-gray-900 placeholder:text-gray-400 rounded-xl"
                  required
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer">
                  <div className="w-5 h-5 flex items-center justify-center">
                    <i className={`${showPassword ? 'ri-eye-off-line' : 'ri-eye-line'} text-base`} />
                  </div>
                </button>
              </div>
              {!isLogin && formData.password.length > 0 && (
                <div className="mt-2 px-0.5">
                  <div className="flex gap-1 mb-1">
                    {[1, 2, 3, 4].map((level) => (
                      <div key={level} className={`h-1 flex-1 rounded-full transition-all duration-500 ${passwordStrength >= level ? strengthColors[passwordStrength] : 'bg-gray-200'}`} />
                    ))}
                  </div>
                  <p className={`text-xs font-medium ${strengthTextColors[passwordStrength]}`}>{strengthLabels[passwordStrength]}</p>
                </div>
              )}
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700 mb-3">
                <p>{error}</p>
                {showResendOnError && (
                  <button
                    type="button"
                    onClick={() => handleResendVerification(registeredEmail)}
                    disabled={resendLoading}
                    className="mt-2 text-teal-600 hover:text-teal-700 font-semibold text-xs underline underline-offset-2 cursor-pointer disabled:opacity-50"
                  >
                    {resendLoading ? 'Resending…' : 'Resend verification email'}
                  </button>
                )}
                {showResendOnError && resendSuccess && (
                  <p className="mt-1 text-emerald-600 text-xs font-medium">✅ Verification email resent!</p>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || googleLoading || linkedinLoading}
              className="w-full bg-gradient-to-r from-teal-500 to-emerald-500 text-white py-3 rounded-xl text-sm font-semibold hover:from-teal-600 hover:to-emerald-600 transition-all active:scale-[0.98] flex items-center justify-center gap-2 whitespace-nowrap mt-1 cursor-pointer shadow-lg shadow-teal-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>{isLogin ? 'Signing in...' : 'Creating account...'}</span>
                </>
              ) : (
                <>
                  {isLogin ? 'Sign In' : 'Create Account'}
                  <i className="ri-arrow-right-line text-base" />
                </>
              )}
            </button>
          </form>

          <div className="mt-5 text-center">
            <p className="text-sm text-gray-500">
              {isLogin ? "Don't have an account?" : 'Already have an account?'}{' '}
              <button type="button" onClick={toggleMode} className="text-teal-600 hover:text-teal-700 font-semibold whitespace-nowrap cursor-pointer">
                {isLogin ? 'Sign Up' : 'Sign In'}
              </button>
            </p>
          </div>

          <p className="text-[11px] text-center text-gray-400 mt-4 leading-relaxed">
            By continuing, you agree to our{' '}
            <a href="#" className="text-gray-500 hover:text-gray-700 underline underline-offset-2 whitespace-nowrap" rel="nofollow">Terms of Service</a>{' '}
            and{' '}
            <a href="#" className="text-gray-500 hover:text-gray-700 underline underline-offset-2 whitespace-nowrap" rel="nofollow">Privacy Policy</a>
          </p>
          </>
          )}
        </div>
      </div>
    </div>
  );
}

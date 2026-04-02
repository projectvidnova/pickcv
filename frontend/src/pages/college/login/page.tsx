import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import InstitutionNavbar from '../../../components/feature/InstitutionNavbar';
import Footer from '../../../components/feature/Footer';
import { apiService } from '../../../services/api';
import { resolvePath } from '../../../utils/subdomain';

export default function CollegeLogin() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginError, setLoginError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    if (loginError) {
      setLoginError('');
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    if (!formData.password.trim()) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setLoginError('');

    try {
      const result = await apiService.collegeLogin(formData.email, formData.password);

      if (!result.success) {
        setLoginError(result.error || 'Invalid email or password');
        setIsSubmitting(false);
        return;
      }

      const { data } = result;

      // Check college status
      if (data.status === 'pending') {
        setLoginError('Your account is pending admin approval. Please wait for approval before logging in.');
        apiService.clearCollegeToken();
        setIsSubmitting(false);
        return;
      }

      if (data.status === 'rejected') {
        setLoginError('Your registration has been rejected. Please contact support for more information.');
        apiService.clearCollegeToken();
        setIsSubmitting(false);
        return;
      }

      setIsSubmitting(false);
      if (data.onboarding_completed) {
        navigate(resolvePath('/college-dashboard'));
      } else {
        navigate(resolvePath('/college/onboarding'));
      }
    } catch {
      setLoginError('Something went wrong. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-teal-50/30">
      <InstitutionNavbar />
      
      <div className="pt-32 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto">
          {/* Header */}
          <div className="text-center mb-10">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center mx-auto mb-5">
              <i className="ri-graduation-cap-fill text-white text-3xl"></i>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-3">College Login</h1>
            <p className="text-base text-gray-600">Access your institution dashboard</p>
          </div>

          {/* Login Form */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Global Error */}
              {loginError && (
                <div className="p-4 rounded-lg bg-red-50 border border-red-200">
                  <div className="flex items-start gap-3">
                    <i className="ri-error-warning-line text-red-600 text-lg mt-0.5"></i>
                    <p className="text-sm text-red-800 flex-1">{loginError}</p>
                  </div>
                </div>
              )}

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 rounded-lg border ${errors.email ? 'border-red-300 focus:ring-red-500' : 'border-gray-200 focus:ring-teal-500'} text-sm focus:outline-none focus:ring-2 focus:border-transparent`}
                  placeholder="placement@institution.edu"
                />
                {errors.email && (
                  <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
                    <i className="ri-error-warning-line"></i>
                    {errors.email}
                  </p>
                )}
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 rounded-lg border ${errors.password ? 'border-red-300 focus:ring-red-500' : 'border-gray-200 focus:ring-teal-500'} text-sm focus:outline-none focus:ring-2 focus:border-transparent`}
                  placeholder="Enter your password"
                />
                {errors.password && (
                  <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
                    <i className="ri-error-warning-line"></i>
                    {errors.password}
                  </p>
                )}
              </div>

              {/* Forgot Password */}
              <div className="flex items-center justify-end">
                <a href="#" className="text-sm font-semibold text-teal-600 hover:text-teal-700 cursor-pointer">
                  Forgot password?
                </a>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 rounded-lg bg-gradient-to-r from-teal-500 to-emerald-500 text-white text-sm font-semibold hover:from-teal-600 hover:to-emerald-600 transition-all duration-200 whitespace-nowrap cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                {isSubmitting ? (
                  <>
                    <i className="ri-loader-4-line animate-spin"></i>
                    Logging in...
                  </>
                ) : (
                  <>
                    Login
                    <i className="ri-arrow-right-line"></i>
                  </>
                )}
              </button>

              {/* Register Link */}
              <div className="text-center pt-4 border-t border-gray-100">
                <p className="text-sm text-gray-600">
                  Don't have an account?{' '}
                  <a href={resolvePath('/college/register')} className="font-semibold text-teal-600 hover:text-teal-700 cursor-pointer">
                    Register your institution
                  </a>
                </p>
              </div>
            </form>
          </div>

          {/* Help Section */}
          <div className="mt-8 bg-gradient-to-br from-teal-50 to-emerald-50 rounded-xl p-6 border border-teal-100">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center flex-shrink-0">
                <i className="ri-question-line text-teal-600 text-lg"></i>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-2">Need Help?</h3>
                <p className="text-xs text-gray-600 mb-3">
                  If you're having trouble logging in or your registration is pending approval, please contact our support team.
                </p>
                <a href="mailto:support@pickcv.com" className="text-xs font-semibold text-teal-600 hover:text-teal-700 cursor-pointer inline-flex items-center gap-1">
                  <i className="ri-mail-line"></i>
                  support@pickcv.com
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}

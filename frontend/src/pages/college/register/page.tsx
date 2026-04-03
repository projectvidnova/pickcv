import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import InstitutionNavbar from '../../../components/feature/InstitutionNavbar';
import { resolvePath } from '../../../utils/subdomain';
import Footer from '../../../components/feature/Footer';
import { apiService } from '../../../services/api';

export default function CollegeRegister() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    institutionName: '',
    officialEmail: '',
    password: '',
    confirmPassword: '',
    contactPersonName: '',
    designation: '',
    phoneNumber: '',
    city: '',
    state: '',
    institutionType: 'college'
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    setSubmitError('');
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.institutionName.trim()) newErrors.institutionName = 'Institution name is required';
    if (!formData.officialEmail.trim()) {
      newErrors.officialEmail = 'Official email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.officialEmail)) {
      newErrors.officialEmail = 'Please enter a valid email address';
    }
    if (!formData.contactPersonName.trim()) newErrors.contactPersonName = 'Contact person name is required';
    if (!formData.designation.trim()) newErrors.designation = 'Designation is required';
    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = 'Phone number is required';
    } else if (!/^\+?[\d\s\-()]{10,}$/.test(formData.phoneNumber)) {
      newErrors.phoneNumber = 'Please enter a valid phone number';
    }
    if (!formData.city.trim()) newErrors.city = 'City is required';
    if (!formData.state.trim()) newErrors.state = 'State is required';
    if (!formData.password.trim()) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      const firstErrorKey = Object.keys(newErrors)[0];
      const el = document.getElementById(firstErrorKey);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setSubmitError('Please fill in all required fields before submitting.');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setSubmitError('');

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const result = await apiService.collegeRegister({
        institution_name: formData.institutionName,
        official_email: formData.officialEmail,
        password: formData.password,
        contact_person_name: formData.contactPersonName,
        designation: formData.designation,
        phone_number: formData.phoneNumber,
        city: formData.city,
        state: formData.state,
        institution_type: formData.institutionType,
      });

      if (!result.success) {
        setIsSubmitting(false);
        setSubmitError(result.error || 'Registration failed. Please try again.');
        return;
      }

      // Store registration data for the pending-approval page
      localStorage.setItem('collegeRegistration', JSON.stringify({
        institutionName: formData.institutionName,
        officialEmail: formData.officialEmail,
        contactPersonName: formData.contactPersonName,
        city: formData.city,
        state: formData.state,
      }));

      setSubmitted(true);
      setIsSubmitting(false);
      setShowSuccessModal(true);
    } catch {
      setIsSubmitting(false);
      setSubmitError('Something went wrong. Please try again.');
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-teal-50/30">
      <InstitutionNavbar />

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 animate-in fade-in zoom-in">
            {/* Success Icon */}
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center mx-auto mb-4">
                <i className="ri-check-line text-white text-3xl"></i>
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Thank You for Registering!</h2>
              <p className="text-sm text-gray-600">
                Your registration for <strong>{formData.institutionName}</strong> has been successfully submitted.
              </p>
            </div>

            {/* Info Box */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
              <div className="flex items-start gap-3">
                <i className="ri-time-line text-amber-500 text-xl mt-0.5 flex-shrink-0"></i>
                <div>
                  <p className="text-sm font-semibold text-amber-800 mb-1">Under Review</p>
                  <p className="text-xs text-amber-700 leading-relaxed">
                    Our admin team will review and approve your request within <strong>48 hours</strong>. 
                    You will receive an email at <strong>{formData.officialEmail}</strong> once your account has been approved.
                  </p>
                </div>
              </div>
            </div>

            {/* Email confirmation note */}
            <div className="flex items-center gap-2 bg-teal-50 rounded-lg px-4 py-3 mb-6">
              <i className="ri-mail-check-line text-teal-600 text-lg"></i>
              <p className="text-xs text-teal-700">A confirmation email has been sent to <strong>{formData.officialEmail}</strong></p>
            </div>

            {/* Action Button */}
            <button
              onClick={() => navigate(resolvePath('/college/pending-approval'))}
              className="w-full py-3 rounded-lg bg-gradient-to-r from-teal-500 to-emerald-500 text-white text-sm font-semibold hover:from-teal-600 hover:to-emerald-600 transition-all duration-200 cursor-pointer flex items-center justify-center gap-2"
            >
              Continue
              <i className="ri-arrow-right-line"></i>
            </button>
          </div>
        </div>
      )}

      <div className="pt-32 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-10">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center mx-auto mb-5">
              <i className="ri-graduation-cap-fill text-white text-3xl"></i>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-3">Register Your Institution</h1>
            <p className="text-base text-gray-600">Join PickCV to help your students build standout resumes and land their dream jobs</p>
          </div>

          {/* Error Banner */}
          {submitError && (
            <div className="mb-6 flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-5 py-4">
              <i className="ri-error-warning-fill text-red-500 text-xl flex-shrink-0"></i>
              <p className="text-sm text-red-700 font-medium">{submitError}</p>
            </div>
          )}

          {/* Success Banner */}
          {submitted && (
            <div className="mb-6 flex items-center gap-3 bg-teal-50 border border-teal-200 rounded-xl px-5 py-4">
              <i className="ri-checkbox-circle-fill text-teal-500 text-xl flex-shrink-0"></i>
              <p className="text-sm text-teal-700 font-medium">Registration submitted! Redirecting you now...</p>
            </div>
          )}

          {/* Registration Form */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <form onSubmit={handleSubmit} noValidate className="space-y-6">
              {/* Institution Name */}
              <div>
                <label htmlFor="institutionName" className="block text-sm font-semibold text-gray-700 mb-2">
                  Institution Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="institutionName"
                  name="institutionName"
                  value={formData.institutionName}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 rounded-lg border ${errors.institutionName ? 'border-red-300 focus:ring-red-500' : 'border-gray-200 focus:ring-teal-500'} text-sm focus:outline-none focus:ring-2 focus:border-transparent`}
                  placeholder="e.g., Indian Institute of Technology Mumbai"
                />
                {errors.institutionName && (
                  <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
                    <i className="ri-error-warning-line"></i>{errors.institutionName}
                  </p>
                )}
              </div>

              {/* Institution Type */}
              <div>
                <label htmlFor="institutionType" className="block text-sm font-semibold text-gray-700 mb-2">
                  Institution Type <span className="text-red-500">*</span>
                </label>
                <select
                  id="institutionType"
                  name="institutionType"
                  value={formData.institutionType}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent cursor-pointer">
                  <option value="college">College</option>
                  <option value="university">University</option>
                  <option value="institute">Institute</option>
                </select>
              </div>

              {/* Official Email */}
              <div>
                <label htmlFor="officialEmail" className="block text-sm font-semibold text-gray-700 mb-2">
                  Official Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  id="officialEmail"
                  name="officialEmail"
                  value={formData.officialEmail}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 rounded-lg border ${errors.officialEmail ? 'border-red-300 focus:ring-red-500' : 'border-gray-200 focus:ring-teal-500'} text-sm focus:outline-none focus:ring-2 focus:border-transparent`}
                  placeholder="placement@institution.edu"
                />
                {errors.officialEmail && (
                  <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
                    <i className="ri-error-warning-line"></i>{errors.officialEmail}
                  </p>
                )}
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                  Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 rounded-lg border ${errors.password ? 'border-red-300 focus:ring-red-500' : 'border-gray-200 focus:ring-teal-500'} text-sm focus:outline-none focus:ring-2 focus:border-transparent`}
                  placeholder="Create a strong password"
                />
                {errors.password && (
                  <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
                    <i className="ri-error-warning-line"></i>{errors.password}
                  </p>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700 mb-2">
                  Confirm Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 rounded-lg border ${errors.confirmPassword ? 'border-red-300 focus:ring-red-500' : 'border-gray-200 focus:ring-teal-500'} text-sm focus:outline-none focus:ring-2 focus:border-transparent`}
                  placeholder="Confirm your password"
                />
                {errors.confirmPassword && (
                  <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
                    <i className="ri-error-warning-line"></i>{errors.confirmPassword}
                  </p>
                )}
              </div>

              {/* Contact Person Name */}
              <div>
                <label htmlFor="contactPersonName" className="block text-sm font-semibold text-gray-700 mb-2">
                  Contact Person Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="contactPersonName"
                  name="contactPersonName"
                  value={formData.contactPersonName}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 rounded-lg border ${errors.contactPersonName ? 'border-red-300 focus:ring-red-500' : 'border-gray-200 focus:ring-teal-500'} text-sm focus:outline-none focus:ring-2 focus:border-transparent`}
                  placeholder="Full name of placement officer or admin"
                />
                {errors.contactPersonName && (
                  <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
                    <i className="ri-error-warning-line"></i>{errors.contactPersonName}
                  </p>
                )}
              </div>

              {/* Designation */}
              <div>
                <label htmlFor="designation" className="block text-sm font-semibold text-gray-700 mb-2">
                  Designation <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="designation"
                  name="designation"
                  value={formData.designation}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 rounded-lg border ${errors.designation ? 'border-red-300 focus:ring-red-500' : 'border-gray-200 focus:ring-teal-500'} text-sm focus:outline-none focus:ring-2 focus:border-transparent`}
                  placeholder="e.g., Placement Officer, Training & Placement Head"
                />
                {errors.designation && (
                  <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
                    <i className="ri-error-warning-line"></i>{errors.designation}
                  </p>
                )}
              </div>

              {/* Phone Number */}
              <div>
                <label htmlFor="phoneNumber" className="block text-sm font-semibold text-gray-700 mb-2">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  id="phoneNumber"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 rounded-lg border ${errors.phoneNumber ? 'border-red-300 focus:ring-red-500' : 'border-gray-200 focus:ring-teal-500'} text-sm focus:outline-none focus:ring-2 focus:border-transparent`}
                  placeholder="+91 98765 43210"
                />
                {errors.phoneNumber && (
                  <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
                    <i className="ri-error-warning-line"></i>{errors.phoneNumber}
                  </p>
                )}
              </div>

              {/* City & State */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="city" className="block text-sm font-semibold text-gray-700 mb-2">
                    City <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="city"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 rounded-lg border ${errors.city ? 'border-red-300 focus:ring-red-500' : 'border-gray-200 focus:ring-teal-500'} text-sm focus:outline-none focus:ring-2 focus:border-transparent`}
                    placeholder="Mumbai"
                  />
                  {errors.city && (
                    <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
                      <i className="ri-error-warning-line"></i>{errors.city}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="state" className="block text-sm font-semibold text-gray-700 mb-2">
                    State <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="state"
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 rounded-lg border ${errors.state ? 'border-red-300 focus:ring-red-500' : 'border-gray-200 focus:ring-teal-500'} text-sm focus:outline-none focus:ring-2 focus:border-transparent`}
                    placeholder="Maharashtra"
                  />
                  {errors.state && (
                    <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
                      <i className="ri-error-warning-line"></i>{errors.state}
                    </p>
                  )}
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting || submitted}
                  className="w-full py-3.5 rounded-lg bg-gradient-to-r from-teal-500 to-emerald-500 text-white text-sm font-semibold hover:from-teal-600 hover:to-emerald-600 transition-all duration-200 whitespace-nowrap cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                  {isSubmitting ? (
                    <>
                      <i className="ri-loader-4-line animate-spin"></i>
                      Submitting...
                    </>
                  ) : submitted ? (
                    <>
                      <i className="ri-checkbox-circle-line"></i>
                      Submitted!
                    </>
                  ) : (
                    <>
                      Submit Registration
                      <i className="ri-arrow-right-line"></i>
                    </>
                  )}
                </button>
              </div>

              {/* Login Link */}
              <div className="text-center pt-4 border-t border-gray-100">
                <p className="text-sm text-gray-600">
                  Already registered?{' '}
                  <a href={resolvePath('/college/login')} className="font-semibold text-teal-600 hover:text-teal-700 cursor-pointer">
                    Login here
                  </a>
                </p>
              </div>
            </form>
          </div>

          {/* Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
            <div className="bg-white rounded-xl p-5 border border-gray-100 text-center">
              <div className="w-10 h-10 rounded-lg bg-teal-50 flex items-center justify-center mx-auto mb-3">
                <i className="ri-shield-check-line text-teal-600 text-lg"></i>
              </div>
              <p className="text-sm font-semibold text-gray-900 mb-1">Secure & Verified</p>
              <p className="text-xs text-gray-500">All registrations are reviewed by our team</p>
            </div>

            <div className="bg-white rounded-xl p-5 border border-gray-100 text-center">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center mx-auto mb-3">
                <i className="ri-time-line text-emerald-600 text-lg"></i>
              </div>
              <p className="text-sm font-semibold text-gray-900 mb-1">Quick Approval</p>
              <p className="text-xs text-gray-500">Get approved within 24-48 hours</p>
            </div>

            <div className="bg-white rounded-xl p-5 border border-gray-100 text-center">
              <div className="w-10 h-10 rounded-lg bg-teal-50 flex items-center justify-center mx-auto mb-3">
                <i className="ri-customer-service-2-line text-teal-600 text-lg"></i>
              </div>
              <p className="text-sm font-semibold text-gray-900 mb-1">Dedicated Support</p>
              <p className="text-xs text-gray-500">Get help from our placement team</p>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}

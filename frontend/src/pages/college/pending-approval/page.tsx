import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../../components/feature/Navbar';
import Footer from '../../../components/feature/Footer';
import { resolvePath } from '../../../utils/subdomain';

export default function PendingApproval() {
  const navigate = useNavigate();
  const [registrationData, setRegistrationData] = useState<any>(null);

  useEffect(() => {
    const data = localStorage.getItem('collegeRegistration');
    if (!data) {
      navigate(resolvePath('/college/register'));
      return;
    }
    setRegistrationData(JSON.parse(data));
  }, [navigate]);

  if (!registrationData) {
    return null;
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-teal-50/30">
      <Navbar />
      
      <div className="pt-32 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          {/* Success Icon */}
          <div className="text-center mb-10">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center mx-auto mb-6 animate-pulse">
              <i className="ri-time-line text-white text-4xl"></i>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-3">Registration Submitted!</h1>
            <p className="text-base text-gray-600">Your application is under review</p>
          </div>

          {/* Status Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-6">
            <div className="flex items-start gap-4 mb-6 pb-6 border-b border-gray-100">
              <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
                <i className="ri-hourglass-line text-amber-600 text-xl"></i>
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-bold text-gray-900 mb-2">Pending Admin Approval</h2>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Thank you for registering <strong>{registrationData.institutionName}</strong> with PickCV. 
                  Our admin team is currently reviewing your application. You'll receive an email notification 
                  once your account has been approved.
                </p>
              </div>
            </div>

            {/* Registration Details */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Registration Details</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <i className="ri-building-line text-gray-400 text-lg mt-0.5"></i>
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">Institution</p>
                    <p className="text-sm font-semibold text-gray-900">{registrationData.institutionName}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <i className="ri-mail-line text-gray-400 text-lg mt-0.5"></i>
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">Email</p>
                    <p className="text-sm font-semibold text-gray-900">{registrationData.officialEmail}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <i className="ri-user-line text-gray-400 text-lg mt-0.5"></i>
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">Contact Person</p>
                    <p className="text-sm font-semibold text-gray-900">{registrationData.contactPersonName}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <i className="ri-map-pin-line text-gray-400 text-lg mt-0.5"></i>
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">Location</p>
                    <p className="text-sm font-semibold text-gray-900">{registrationData.city}, {registrationData.state}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* What Happens Next */}
          <div className="bg-gradient-to-br from-teal-50 to-emerald-50 rounded-2xl p-8 border border-teal-100 mb-6">
            <h3 className="text-lg font-bold text-gray-900 mb-5 flex items-center gap-2">
              <i className="ri-roadmap-line text-teal-600"></i>
              What Happens Next?
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center flex-shrink-0 font-bold text-sm text-teal-600">
                  1
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900 mb-1">Admin Review</p>
                  <p className="text-xs text-gray-600">Our team will verify your institution details and credentials</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center flex-shrink-0 font-bold text-sm text-teal-600">
                  2
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900 mb-1">Email Notification</p>
                  <p className="text-xs text-gray-600">You'll receive an approval email within 24-48 hours</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center flex-shrink-0 font-bold text-sm text-teal-600">
                  3
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900 mb-1">Login & Setup</p>
                  <p className="text-xs text-gray-600">Once approved, login and complete your institution profile</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center flex-shrink-0 font-bold text-sm text-teal-600">
                  4
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900 mb-1">Start Helping Students</p>
                  <p className="text-xs text-gray-600">Add students and help them build professional resumes</p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={() => navigate('/')}
              className="flex-1 py-3.5 rounded-lg bg-white border-2 border-gray-200 text-gray-700 text-sm font-semibold hover:bg-gray-50 transition-all duration-200 whitespace-nowrap cursor-pointer flex items-center justify-center gap-2">
              <i className="ri-home-line"></i>
              Back to Home
            </button>

            <button
              onClick={() => navigate(resolvePath('/college/login'))}
              className="flex-1 py-3.5 rounded-lg bg-gradient-to-r from-teal-500 to-emerald-500 text-white text-sm font-semibold hover:from-teal-600 hover:to-emerald-600 transition-all duration-200 whitespace-nowrap cursor-pointer flex items-center justify-center gap-2">
              <i className="ri-login-box-line"></i>
              Go to Login
            </button>
          </div>

          {/* Contact Support */}
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-600 mb-2">Need urgent assistance?</p>
            <a href="mailto:support@pickcv.com" className="text-sm font-semibold text-teal-600 hover:text-teal-700 cursor-pointer inline-flex items-center gap-1">
              <i className="ri-customer-service-2-line"></i>
              Contact Support Team
            </a>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}

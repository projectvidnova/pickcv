import { Link } from 'react-router-dom';

export default function RecruiterPendingApproval() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      <div className="relative w-full max-w-md text-center">
        <div className="bg-gray-800/50 backdrop-blur-xl rounded-2xl border border-gray-700/50 p-8 shadow-2xl">
          <div className="w-16 h-16 mx-auto rounded-full bg-yellow-500/10 flex items-center justify-center mb-6">
            <i className="ri-time-line text-yellow-400 text-3xl" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-3">Pending Admin Approval</h1>
          <p className="text-gray-400 mb-6">
            Your email is verified! Your account is currently under review by our admin team.
            You'll receive an email notification once your account is approved.
          </p>
          <div className="bg-gray-700/30 rounded-xl p-4 mb-6">
            <p className="text-gray-300 text-sm">
              <i className="ri-information-line text-blue-400 mr-2" />
              This usually takes less than 24 hours.
            </p>
          </div>
          <Link to="/recruiter/login"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gray-700 text-white rounded-xl hover:bg-gray-600 transition-all">
            <i className="ri-arrow-left-line" /> Back to Login
          </Link>
        </div>
      </div>
    </main>
  );
}

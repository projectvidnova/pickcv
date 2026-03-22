import { Link } from 'react-router-dom';

export default function VerifyEmailSent() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      <div className="relative w-full max-w-md text-center">
        <div className="bg-gray-800/50 backdrop-blur-xl rounded-2xl border border-gray-700/50 p-8 shadow-2xl">
          <div className="w-16 h-16 mx-auto rounded-full bg-blue-500/10 flex items-center justify-center mb-6">
            <i className="ri-mail-check-line text-blue-400 text-3xl" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-3">Check Your Email</h1>
          <p className="text-gray-400 mb-6">
            We've sent a verification link to your email address.
            Please click the link to verify your account.
          </p>
          <p className="text-gray-500 text-sm mb-6">
            After verification, your account will be reviewed by our admin team.
            You'll receive a welcome email once approved.
          </p>
          <Link to="/login"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gray-700 text-white rounded-xl hover:bg-gray-600 transition-all">
            <i className="ri-arrow-left-line" /> Back to Login
          </Link>
        </div>
      </div>
    </main>
  );
}

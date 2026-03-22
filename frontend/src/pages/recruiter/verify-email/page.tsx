import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { recruiterApi } from '../../../services/recruiterService';

export default function RecruiterVerifyEmail() {
  const [params] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = params.get('token');
    if (!token) { setStatus('error'); setMessage('Missing verification token'); return; }
    recruiterApi.verifyEmail(token)
      .then(data => { setStatus('success'); setMessage(data.message || 'Email verified!'); })
      .catch(err => { setStatus('error'); setMessage(err.message || 'Verification failed'); });
  }, [params]);

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      <div className="relative w-full max-w-md text-center">
        <div className="bg-gray-800/50 backdrop-blur-xl rounded-2xl border border-gray-700/50 p-8 shadow-2xl">
          {status === 'loading' && (
            <div className="py-8"><i className="ri-loader-4-line animate-spin text-blue-400 text-4xl" /></div>
          )}
          {status === 'success' && (
            <>
              <div className="w-16 h-16 mx-auto rounded-full bg-green-500/10 flex items-center justify-center mb-6">
                <i className="ri-check-double-line text-green-400 text-3xl" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-3">Email Verified Successfully!</h1>
              <p className="text-gray-300 mb-4">
                Your email has been verified. Our team will review your registration and reach out within <strong className="text-green-400">24 hours</strong> if everything checks out.
              </p>
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 mb-6">
                <p className="text-yellow-300 text-sm flex items-start gap-2">
                  <i className="ri-time-line text-lg mt-0.5" />
                  <span>You'll receive an email once your account is approved. You can then log in and start using your recruiter dashboard.</span>
                </p>
              </div>
              <Link to="/pending-approval"
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-all">
                Got it <i className="ri-check-line" />
              </Link>
            </>
          )}
          {status === 'error' && (
            <>
              <div className="w-16 h-16 mx-auto rounded-full bg-red-500/10 flex items-center justify-center mb-6">
                <i className="ri-error-warning-line text-red-400 text-3xl" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-3">Verification Failed</h1>
              <p className="text-gray-400 mb-6">{message}</p>
              <Link to="/login"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gray-700 text-white rounded-xl hover:bg-gray-600 transition-all">
                <i className="ri-arrow-left-line" /> Back to Login
              </Link>
            </>
          )}
        </div>
      </div>
    </main>
  );
}

import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { apiService } from '../../services/api';

type Status = 'loading' | 'success' | 'error';

export default function VerifyEmail() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<Status>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = params.get('token');
    if (!token) {
      setStatus('error');
      setMessage('Verification link is invalid or missing a token.');
      return;
    }

    (async () => {
      const res = await apiService.verifyEmail(token);
      if (res.success) {
        setStatus('success');
        setMessage(res.message || 'Your email has been verified!');
      } else {
        setStatus('error');
        setMessage(res.error || 'Verification failed. The link may have expired.');
      }
    })();
  }, [params]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-emerald-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md text-center">
        {/* Logo */}
        <h1 className="text-3xl font-bold bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent mb-8">
          PickCV
        </h1>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
          {status === 'loading' && (
            <>
              <div className="mx-auto mb-4 h-14 w-14 rounded-full bg-teal-50 flex items-center justify-center">
                <svg className="animate-spin h-7 w-7 text-teal-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-800 mb-2">Verifying your email…</h2>
              <p className="text-gray-500 text-sm">Please wait a moment.</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="mx-auto mb-4 h-14 w-14 rounded-full bg-emerald-50 flex items-center justify-center">
                <svg className="h-8 w-8 text-emerald-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-800 mb-2">Email Verified!</h2>
              <p className="text-gray-500 text-sm mb-2">{message}</p>
              <p className="text-gray-400 text-xs mb-6">You can now sign in with your email and password.</p>
              <button
                onClick={() => navigate('/')}
                className="w-full py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 transition-all shadow-md"
              >
                Sign In to PickCV
              </button>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="mx-auto mb-4 h-14 w-14 rounded-full bg-red-50 flex items-center justify-center">
                <svg className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-800 mb-2">Verification Failed</h2>
              <p className="text-gray-500 text-sm mb-6">{message}</p>
              <button
                onClick={() => navigate('/')}
                className="w-full py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 transition-all shadow-md"
              >
                Go to Homepage
              </button>
            </>
          )}
        </div>

        <p className="mt-6 text-gray-400 text-xs">
          &copy; 2025 PickCV. All rights reserved.
        </p>
      </div>
    </div>
  );
}

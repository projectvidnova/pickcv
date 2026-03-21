import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { recruiterApi } from '../../../services/recruiterService';

export default function AcceptInvitePage() {
  const [params] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = params.get('token');
    if (!token) { setStatus('error'); setMessage('Missing invitation token'); return; }
    recruiterApi.acceptInterviewerInvite(token)
      .then(data => { setStatus('success'); setMessage(data.message || 'Invitation accepted!'); })
      .catch(err => { setStatus('error'); setMessage(err.message || 'Failed to accept invitation'); });
  }, [params]);

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      <div className="relative w-full max-w-md text-center">
        <div className="bg-gray-800/50 backdrop-blur-xl rounded-2xl border border-gray-700/50 p-8 shadow-2xl">
          {status === 'loading' && (
            <div className="py-8"><i className="ri-loader-4-line animate-spin text-purple-400 text-4xl" /></div>
          )}
          {status === 'success' && (
            <>
              <div className="w-16 h-16 mx-auto rounded-full bg-green-500/10 flex items-center justify-center mb-6">
                <i className="ri-check-double-line text-green-400 text-3xl" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-3">Invitation Accepted!</h1>
              <p className="text-gray-400 mb-6">
                You've been added as an interviewer. You'll receive interview schedules via email.
              </p>
            </>
          )}
          {status === 'error' && (
            <>
              <div className="w-16 h-16 mx-auto rounded-full bg-red-500/10 flex items-center justify-center mb-6">
                <i className="ri-error-warning-line text-red-400 text-3xl" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-3">Something Went Wrong</h1>
              <p className="text-gray-400 mb-6">{message}</p>
            </>
          )}
        </div>
      </div>
    </main>
  );
}

import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { googleAuthService } from '../../services/googleAuthService';
import { linkedinAuthService } from '../../services/linkedinAuthService';

/**
 * OAuth Callback Handler
 * Processes the authorization code from Google or LinkedIn and exchanges it for JWT tokens
 */
export default function OAuthCallback() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(true);
  const hasRun = useRef(false);

  useEffect(() => {
    // Prevent double execution in React Strict Mode (dev only)
    if (hasRun.current) return;
    hasRun.current = true;

    const handleCallback = async () => {
      try {
        // Get authorization code from URL
        const params = new URLSearchParams(window.location.search);
        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');
        const userId = params.get('user_id');
        const userEmail = params.get('email') || '';
        const userName = params.get('name') || 'User';

        // If tokens are in URL (direct redirect from backend), use them
        if (accessToken && refreshToken && userId) {
          googleAuthService.storeTokens({
            access_token: accessToken,
            refresh_token: refreshToken,
            token_type: 'bearer',
            user_id: parseInt(userId),
            email: userEmail,
          });
          
          // Store user info
          googleAuthService.storeUserInfo(userName, userEmail);

          setIsProcessing(false);
          navigate('/', { replace: true });
          return;
        }

        // Determine which OAuth provider initiated this callback
        const oauthProvider = sessionStorage.getItem('oauth_provider');

        if (oauthProvider === 'linkedin') {
          // LinkedIn OAuth flow
          const tokens = await linkedinAuthService.handleCallback();
          if (tokens) {
            linkedinAuthService.storeTokens(tokens);
            linkedinAuthService.storeUserInfo(
              tokens.name || 'User',
              tokens.email || '',
              tokens.picture
            );
            setIsProcessing(false);
            navigate('/', { replace: true });
          } else {
            throw new Error('No tokens received from LinkedIn');
          }
        } else {
          // Default: Google OAuth flow
          const tokens = await googleAuthService.handleCallback();
          if (tokens) {
            googleAuthService.storeTokens(tokens);
            googleAuthService.storeUserInfo(
              tokens.name || 'User',
              tokens.email || '',
              tokens.picture
            );
            setIsProcessing(false);
            navigate('/', { replace: true });
          } else {
            throw new Error('No tokens received');
          }
        }
      } catch (err) {
        console.error('OAuth callback error:', err);
        setError(err instanceof Error ? err.message : 'Authentication failed');
        setIsProcessing(false);
      }
    };

    handleCallback();
  }, [navigate]);

  if (isProcessing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
        <div className="text-center">
          <div className="mb-4">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-teal-500 animate-spin">
              <div className="w-8 h-8 rounded-full border-4 border-transparent border-t-white"></div>
            </div>
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">Authenticating...</h2>
          <p className="text-slate-400">Setting up your account</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
        <div className="text-center">
          <div className="mb-4">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-500">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">Authentication Failed</h2>
          <p className="text-slate-400 mb-6">{error}</p>
          <button
            onClick={() => navigate('/', { replace: true })}
            className="px-6 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-lg font-medium transition-colors"
          >
            Return Home
          </button>
        </div>
      </div>
    );
  }

  return null;
}

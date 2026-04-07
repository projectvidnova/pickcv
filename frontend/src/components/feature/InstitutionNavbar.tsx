import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { resolvePath } from '../../utils/subdomain';
import { apiService } from '../../services/api';

interface CollegeSession {
  college_id: number;
  email: string;
  institution_name: string;
  status: string;
  onboarding_completed: boolean;
}

export default function InstitutionNavbar() {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [session, setSession] = useState<CollegeSession | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const authed = apiService.isCollegeAuthenticated();
    setIsLoggedIn(authed);
    if (authed) {
      try {
        const raw = localStorage.getItem('college_session');
        if (raw) setSession(JSON.parse(raw));
      } catch { /* ignore */ }
    }
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    apiService.clearCollegeToken();
    localStorage.removeItem('college_session');
    setIsLoggedIn(false);
    setSession(null);
    setShowDropdown(false);
    navigate(resolvePath('/'));
  };

  const initials = session?.institution_name
    ? session.institution_name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
    : 'IN';

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex flex-col items-center pt-4 px-4 pointer-events-none">
      <div className="w-full max-w-5xl pointer-events-auto rounded-2xl bg-white/90 backdrop-blur-xl border border-gray-100/80 shadow-sm">
        <div className="flex items-center justify-between px-5 h-[58px]">
          {/* Logo */}
          <a onClick={() => navigate(resolvePath('/'))} className="flex items-center gap-2.5 cursor-pointer shrink-0">
            <img
              src="https://static.readdy.ai/image/118f59b514d655f060b6a8ef60c2b755/e0bd9983c8b60cb1b82cd43c64b6d0bd.png"
              alt="PickCV"
              className="h-20 w-auto"
            />
            <span className="hidden sm:inline-block text-xs font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
              Institutions
            </span>
          </a>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {isLoggedIn ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                    {initials}
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-sm font-semibold text-gray-800 leading-tight max-w-[160px] truncate">{session?.institution_name || 'Institution'}</p>
                    <p className="text-[10px] text-gray-400 leading-tight">{session?.email || ''}</p>
                  </div>
                  <i className={`ri-arrow-down-s-line text-gray-400 transition-transform ${showDropdown ? 'rotate-180' : ''}`}></i>
                </button>

                {showDropdown && (
                  <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    {/* Mobile-only: show name/email in dropdown */}
                    <div className="sm:hidden px-4 py-2.5 border-b border-gray-100">
                      <p className="text-sm font-semibold text-gray-800 truncate">{session?.institution_name || 'Institution'}</p>
                      <p className="text-xs text-gray-400 truncate">{session?.email || ''}</p>
                    </div>
                    <button
                      onClick={() => { setShowDropdown(false); navigate(resolvePath('/dashboard')); }}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <i className="ri-dashboard-line text-gray-400"></i>Dashboard
                    </button>
                    <button
                      onClick={() => { setShowDropdown(false); navigate(resolvePath('/settings')); }}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <i className="ri-settings-3-line text-gray-400"></i>Settings
                    </button>
                    <div className="border-t border-gray-100 my-1"></div>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <i className="ri-logout-box-r-line text-red-400"></i>Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <button onClick={() => navigate(resolvePath('/login'))}
                  className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors cursor-pointer">
                  Sign In
                </button>
                <button onClick={() => navigate(resolvePath('/register'))}
                  className="text-sm font-semibold px-5 py-2 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 text-white hover:from-teal-600 hover:to-emerald-600 transition-all cursor-pointer shadow-sm">
                  Register
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

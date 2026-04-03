import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { resolvePath } from '../../utils/subdomain';
import { apiService } from '../../services/api';

interface AdminSession {
  admin_id: number;
  email: string;
  name: string;
}

interface AdminNavbarProps {
  /** Which nav tab is active */
  activePage?: 'colleges' | 'recruiters' | 'payments';
}

export default function AdminNavbar({ activePage }: AdminNavbarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [session, setSession] = useState<AdminSession | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Determine active page from prop or current path
  const active = activePage || (() => {
    const p = location.pathname;
    if (p.includes('recruiter')) return 'recruiters';
    if (p.includes('payment')) return 'payments';
    return 'colleges';
  })();

  useEffect(() => {
    const authed = apiService.isAdminAuthenticated();
    setIsLoggedIn(authed);
    if (authed) {
      try {
        const raw = localStorage.getItem('admin_session');
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
    apiService.clearAdminToken();
    localStorage.removeItem('admin_session');
    setIsLoggedIn(false);
    setSession(null);
    setShowDropdown(false);
    navigate(resolvePath('/'));
  };

  const initials = session?.name
    ? session.name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
    : 'AD';

  const navItems = [
    { key: 'colleges', label: 'Colleges', icon: 'ri-building-4-line', path: '/admin/colleges' },
    { key: 'recruiters', label: 'Recruiters', icon: 'ri-briefcase-line', path: '/admin/recruiters' },
    { key: 'payments', label: 'Payments', icon: 'ri-money-rupee-circle-line', path: '/admin/payments' },
  ];

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
            <span className="hidden sm:inline-block text-xs font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200">
              Admin
            </span>
          </a>

          {/* Center nav (only when logged in) */}
          {isLoggedIn && (
            <div className="hidden md:flex items-center gap-1">
              {navItems.map(item => (
                <Link
                  key={item.key}
                  to={resolvePath(item.path)}
                  className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                    active === item.key
                      ? 'bg-teal-50 text-teal-700 border border-teal-200'
                      : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
                  }`}
                >
                  <i className={item.icon}></i>
                  {item.label}
                </Link>
              ))}
            </div>
          )}

          {/* Right side */}
          <div className="flex items-center gap-3">
            {isLoggedIn ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                    {initials}
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-sm font-semibold text-gray-800 leading-tight max-w-[140px] truncate">{session?.name || 'Admin'}</p>
                    <p className="text-[10px] text-gray-400 leading-tight">{session?.email || ''}</p>
                  </div>
                  <i className={`ri-arrow-down-s-line text-gray-400 transition-transform ${showDropdown ? 'rotate-180' : ''}`}></i>
                </button>

                {showDropdown && (
                  <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 py-1.5 z-50">
                    {/* Mobile-only: show name/email */}
                    <div className="sm:hidden px-4 py-2.5 border-b border-gray-100">
                      <p className="text-sm font-semibold text-gray-800 truncate">{session?.name || 'Admin'}</p>
                      <p className="text-xs text-gray-400 truncate">{session?.email || ''}</p>
                    </div>
                    {/* Mobile nav items */}
                    <div className="md:hidden border-b border-gray-100 py-1">
                      {navItems.map(item => (
                        <button
                          key={item.key}
                          onClick={() => { setShowDropdown(false); navigate(resolvePath(item.path)); }}
                          className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors ${
                            active === item.key ? 'text-teal-700 bg-teal-50' : 'text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          <i className={`${item.icon} text-gray-400`}></i>{item.label}
                        </button>
                      ))}
                    </div>
                    <div className="border-t border-gray-100 my-1 md:border-0 md:my-0"></div>
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
              <button onClick={() => navigate(resolvePath('/login'))}
                className="text-sm font-semibold px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 text-white hover:from-indigo-600 hover:to-violet-600 transition-all cursor-pointer shadow-sm">
                Sign In
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

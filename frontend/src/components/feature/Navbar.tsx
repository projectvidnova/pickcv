import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthModal from './AuthModal';
import OptimizeModal from './OptimizeModal';
import UserProfileDropdown from './UserProfileDropdown';
import { googleAuthService } from '../../services/googleAuthService';

export default function Navbar() {
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isOptimizeModalOpen, setIsOptimizeModalOpen] = useState(false);
  const [activeLink, setActiveLink] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userAvatar, setUserAvatar] = useState('');
  const [isToolsOpen, setIsToolsOpen] = useState(false);
  const [isMobileToolsOpen, setIsMobileToolsOpen] = useState(false);
  const toolsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check if user is authenticated
    const checkAuth = () => {
      const token = googleAuthService.getAccessToken();
      const name = localStorage.getItem('user_name') || '';
      const email = localStorage.getItem('user_email') || '';
      const picture = localStorage.getItem('user_picture') || '';
      
      setIsAuthenticated(!!token);
      setUserName(name || 'User');
      setUserEmail(email);
      setUserAvatar(picture);
    };

    checkAuth();
    // Listen for storage changes (logout from other tabs)
    window.addEventListener('storage', checkAuth);
    // Listen for custom logout event (logout in same tab)
    window.addEventListener('auth-logout', checkAuth);
    
    return () => {
      window.removeEventListener('storage', checkAuth);
      window.removeEventListener('auth-logout', checkAuth);
    };
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close Tools dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (toolsRef.current && !toolsRef.current.contains(event.target as Node)) {
        setIsToolsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCollegesClick = () => {
    setIsToolsOpen(false);
    setIsMobileMenuOpen(false);
    navigate('/college/login');
  };

  const handleRecruitersClick = () => {
    setIsToolsOpen(false);
    setIsMobileMenuOpen(false);
    navigate('/recruiter/login');
  };

  return (
    <>
      <style>{`
        .nav-link-pill {
          position: relative;
        }
        .nav-link-pill::after {
          content: '';
          position: absolute;
          bottom: -2px;
          left: 50%;
          transform: translateX(-50%);
          width: 0;
          height: 2px;
          background: linear-gradient(90deg, #0d9488, #10b981);
          border-radius: 99px;
          transition: width 0.25s ease;
        }
        .nav-link-pill:hover::after,
        .nav-link-pill.active::after {
          width: 60%;
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .mobile-menu-enter {
          animation: slideDown 0.2s ease forwards;
        }
        @keyframes toolsDropdownEnter {
          from { opacity: 0; transform: translateY(-4px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .tools-dropdown-enter {
          animation: toolsDropdownEnter 0.15s ease forwards;
        }
        .nav-scrolled {
          background: rgba(255, 255, 255, 0.92) !important;
          backdrop-filter: blur(28px) saturate(200%) !important;
          -webkit-backdrop-filter: blur(28px) saturate(200%) !important;
          border-color: rgba(0,0,0,0.07) !important;
          box-shadow: 0 4px 28px rgba(0,0,0,0.09), 0 1px 0 rgba(255,255,255,0.9) !important;
        }
      `}</style>

      <nav className="fixed top-0 left-0 right-0 z-50 flex flex-col items-center pt-4 px-4 pointer-events-none">
        <div
          className={`w-full max-w-5xl pointer-events-auto rounded-2xl transition-all duration-400 glass-nav ${isScrolled ? 'nav-scrolled' : ''}`}
        >
          <div className="flex items-center justify-between px-5 h-[58px]">
            {/* Logo */}
            <a href="/" className="flex items-center gap-2.5 group shrink-0">
              <img
                src="https://static.readdy.ai/image/118f59b514d655f060b6a8ef60c2b755/e0bd9983c8b60cb1b82cd43c64b6d0bd.png"
                alt="PickCV"
                className="h-20 w-auto"
              />
            </a>

            {/* Center Nav Links */}
            <div className="hidden md:flex items-center gap-6">
              <a href="/resume-builder" onClick={() => setActiveLink('resume')}
                className={`nav-link-pill text-sm font-medium transition-colors duration-200 whitespace-nowrap cursor-pointer pb-0.5 text-gray-600 hover:text-gray-900 ${activeLink === 'resume' ? 'active' : ''}`}>
                AI Resume Maker
              </a>
              <a href="/jobs" onClick={() => setActiveLink('jobs')}
                className={`nav-link-pill text-sm font-medium transition-colors duration-200 whitespace-nowrap cursor-pointer pb-0.5 text-gray-600 hover:text-gray-900 ${activeLink === 'jobs' ? 'active' : ''}`}>
                Jobs
              </a>
              {/* Tools Dropdown */}
              <div className="relative" ref={toolsRef}>
                <button
                  onClick={() => setIsToolsOpen(!isToolsOpen)}
                  className={`nav-link-pill text-sm font-medium transition-colors duration-200 whitespace-nowrap cursor-pointer pb-0.5 flex items-center gap-1 text-gray-600 hover:text-gray-900 ${activeLink === 'tools' ? 'active' : ''}`}>
                  Tools
                  <i className={`ri-arrow-down-s-line text-xs transition-transform duration-200 ${isToolsOpen ? 'rotate-180' : ''}`}></i>
                </button>
                {isToolsOpen && (
                  <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-64 tools-dropdown-enter">
                    <div className="bg-white/95 backdrop-blur-xl rounded-xl shadow-lg border border-gray-100/80 p-2 overflow-hidden">
                      <button
                        onClick={handleRecruitersClick}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-teal-50/60 transition-colors group cursor-pointer">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500/10 to-emerald-500/10 flex items-center justify-center shrink-0">
                          <i className="ri-building-2-line text-teal-600 text-base"></i>
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-medium text-gray-900 group-hover:text-teal-700 transition-colors">For Recruiters & Companies</p>
                          <p className="text-xs text-gray-500">Post jobs & find talent</p>
                        </div>
                      </button>
                      <a
                        onClick={handleCollegesClick}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-teal-50/60 transition-colors group cursor-pointer">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500/10 to-cyan-500/10 flex items-center justify-center shrink-0">
                          <i className="ri-graduation-cap-line text-blue-600 text-base"></i>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 group-hover:text-teal-700 transition-colors">For Colleges & Universities</p>
                          <p className="text-xs text-gray-500">Manage placements</p>
                        </div>
                      </a>
                    </div>
                  </div>
                )}
              </div>
              <a href="/profile" onClick={() => setActiveLink('profile')}
                className={`nav-link-pill text-sm font-medium transition-colors duration-200 whitespace-nowrap cursor-pointer pb-0.5 text-gray-600 hover:text-gray-900 ${activeLink === 'profile' ? 'active' : ''}`}>
                My Profile
              </a>
            </div>

            {/* Right CTA */}
            <div className="hidden md:flex items-center gap-2 shrink-0">
              {isAuthenticated ? (
                <>
                  <button onClick={() => setIsOptimizeModalOpen(true)}
                    className="relative overflow-hidden text-sm font-semibold px-5 py-2 rounded-xl transition-all duration-200 whitespace-nowrap cursor-pointer group bg-gradient-to-r from-teal-500 to-emerald-500 text-white hover:from-teal-600 hover:to-emerald-600 shadow-md shadow-teal-500/20">
                    <span className="relative z-10 flex items-center gap-1.5">
                      Optimize Resume
                      <i className="ri-arrow-right-line text-xs group-hover:translate-x-0.5 transition-transform duration-200"></i>
                    </span>
                  </button>
                  <UserProfileDropdown userName={userName} userEmail={userEmail} userAvatar={userAvatar} />
                </>
              ) : (
                <>
                  <button onClick={() => setIsAuthModalOpen(true)}
                    className="text-sm font-medium px-4 py-2 rounded-xl transition-all duration-200 whitespace-nowrap cursor-pointer text-gray-600 hover:text-gray-900 hover:bg-white/60">
                    Sign In
                  </button>
                  <button onClick={() => setIsAuthModalOpen(true)}
                    className="relative overflow-hidden text-sm font-semibold px-5 py-2 rounded-xl transition-all duration-200 whitespace-nowrap cursor-pointer group bg-gradient-to-r from-teal-500 to-emerald-500 text-white hover:from-teal-600 hover:to-emerald-600 shadow-md shadow-teal-500/20">
                    <span className="relative z-10 flex items-center gap-1.5">
                      Get Started
                      <i className="ri-arrow-right-line text-xs group-hover:translate-x-0.5 transition-transform duration-200"></i>
                    </span>
                  </button>
                </>
              )}
            </div>

            {/* Mobile Menu Toggle */}
            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden w-8 h-8 flex items-center justify-center rounded-lg transition-colors text-gray-700 hover:bg-white/60">
              <i className={`ri-${isMobileMenuOpen ? 'close' : 'menu-3'}-line text-lg`}></i>
            </button>
          </div>

          {/* Mobile Menu */}
          {isMobileMenuOpen && (
            <div className="md:hidden mobile-menu-enter border-t px-4 py-4 space-y-1 rounded-b-2xl border-white/50"
              style={{ background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(20px)' }}>
              {isAuthenticated ? (
                <>
                  {/* User Name and Email */}
                  <div className="px-3 py-2 mb-2 border-b border-white/30">
                    <p className="text-sm font-semibold text-gray-900">{userName}</p>
                    {userEmail && (
                      <p className="text-xs text-gray-600">{userEmail}</p>
                    )}
                  </div>
                  
                  {/* Navigation Links */}
                  <a href="/profile" onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-gray-700 hover:bg-teal-50/80 hover:text-teal-700">
                    <i className="ri-user-3-line text-teal-500"></i>My Profile
                  </a>
                  <a href="/resume-builder" onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-gray-700 hover:bg-teal-50/80 hover:text-teal-700">
                    <i className="ri-magic-line text-teal-500"></i>Resume Builder
                  </a>
                  <a href="/jobs" onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-gray-700 hover:bg-teal-50/80 hover:text-teal-700">
                    <i className="ri-briefcase-line text-teal-500"></i>Jobs
                  </a>
                  {/* Mobile Tools Accordion */}
                  <div>
                    <button
                      onClick={() => setIsMobileToolsOpen(!isMobileToolsOpen)}
                      className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-gray-700 hover:bg-teal-50/80 hover:text-teal-700 cursor-pointer">
                      <span className="flex items-center gap-3">
                        <i className="ri-tools-line text-teal-500"></i>Tools
                      </span>
                      <i className={`ri-arrow-down-s-line text-xs transition-transform duration-200 ${isMobileToolsOpen ? 'rotate-180' : ''}`}></i>
                    </button>
                    {isMobileToolsOpen && (
                      <div className="ml-8 mt-1 space-y-1">
                        <button onClick={handleRecruitersClick}
                          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-teal-50/60 hover:text-teal-700 transition-colors cursor-pointer">
                          <i className="ri-building-2-line text-teal-500 text-xs"></i>For Recruiters
                        </button>
                        <button onClick={handleCollegesClick}
                          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-teal-50/60 hover:text-teal-700 transition-colors cursor-pointer">
                          <i className="ri-graduation-cap-line text-blue-500 text-xs"></i>For Colleges
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Sign Out */}
                  <button
                    onClick={() => {
                      googleAuthService.clearTokens();
                      setIsAuthenticated(false);
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 mt-3 pt-3 rounded-xl text-sm font-medium transition-colors text-red-600 hover:bg-red-50/80 border-t border-white/30"
                  >
                    <i className="ri-logout-box-line text-red-500"></i>
                    <span>Sign Out</span>
                  </button>
                </>
              ) : (
                <>
                  <a href="/resume-builder" onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-gray-700 hover:bg-teal-50/80 hover:text-teal-700">
                    <i className="ri-magic-line text-teal-500"></i>AI Resume Maker
                  </a>
                  <a href="/jobs" onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-gray-700 hover:bg-teal-50/80 hover:text-teal-700">
                    <i className="ri-briefcase-line text-teal-500"></i>Jobs
                  </a>
                  {/* Mobile Tools Accordion (Unauthenticated) */}
                  <div>
                    <button
                      onClick={() => setIsMobileToolsOpen(!isMobileToolsOpen)}
                      className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-gray-700 hover:bg-teal-50/80 hover:text-teal-700 cursor-pointer">
                      <span className="flex items-center gap-3">
                        <i className="ri-tools-line text-teal-500"></i>Tools
                      </span>
                      <i className={`ri-arrow-down-s-line text-xs transition-transform duration-200 ${isMobileToolsOpen ? 'rotate-180' : ''}`}></i>
                    </button>
                    {isMobileToolsOpen && (
                      <div className="ml-8 mt-1 space-y-1">
                        <button onClick={handleRecruitersClick}
                          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-teal-50/60 hover:text-teal-700 transition-colors cursor-pointer">
                          <i className="ri-building-2-line text-teal-500 text-xs"></i>For Recruiters
                        </button>
                        <button onClick={handleCollegesClick}
                          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-teal-50/60 hover:text-teal-700 transition-colors cursor-pointer">
                          <i className="ri-graduation-cap-line text-blue-500 text-xs"></i>For Colleges
                        </button>
                      </div>
                    )}
                  </div>
                  <a href="/profile" onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-gray-700 hover:bg-teal-50/80 hover:text-teal-700">
                    <i className="ri-user-3-line text-teal-500"></i>My Profile
                  </a>
                  <div className="pt-3 border-t border-white/50 space-y-2">
                    <button onClick={() => { setIsAuthModalOpen(true); setIsMobileMenuOpen(false); }}
                      className="w-full py-2.5 text-center text-sm font-medium rounded-xl transition-colors whitespace-nowrap cursor-pointer border border-white/70 text-gray-700 hover:bg-white/60">
                      Sign In
                    </button>
                    <button onClick={() => { setIsAuthModalOpen(true); setIsMobileMenuOpen(false); }}
                      className="w-full py-2.5 text-center bg-gradient-to-r from-teal-500 to-emerald-500 text-white text-sm font-semibold rounded-xl whitespace-nowrap cursor-pointer">
                      Get Started →
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </nav>

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
      <OptimizeModal isOpen={isOptimizeModalOpen} onClose={() => setIsOptimizeModalOpen(false)} />
    </>
  );
}

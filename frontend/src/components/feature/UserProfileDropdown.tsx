import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { googleAuthService } from '../../services/googleAuthService';

interface UserProfileDropdownProps {
  userName?: string;
  userEmail?: string;
  userAvatar?: string;
}

export default function UserProfileDropdown({
  userName = 'User',
  userEmail = '',
  userAvatar = '',
}: UserProfileDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleSignOut = () => {
    googleAuthService.clearTokens();
    setIsOpen(false);
    // Dispatch custom event to notify Navbar of logout
    window.dispatchEvent(new Event('auth-logout'));
    navigate('/', { replace: true });
  };

  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Profile Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/60 transition-colors duration-200"
      >
        {/* Avatar */}
        {userAvatar ? (
          <img
            src={userAvatar}
            alt={userName}
            className="w-8 h-8 rounded-full object-cover border border-white/50"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center text-white text-xs font-semibold">
            {getInitials(userName)}
          </div>
        )}

        {/* Name (hidden on mobile) */}
        <span className="hidden sm:inline text-sm font-medium text-gray-700 max-w-[100px] truncate">
          {userName.split(' ')[0]}
        </span>

        {/* Chevron */}
        <i
          className={`ri-chevron-down-line text-gray-600 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 rounded-xl glass-modal overflow-hidden shadow-lg border border-white/20 z-50">
          {/* Profile Header */}
          <div className="px-4 py-3 border-b border-white/20 bg-gradient-to-r from-teal-50 to-emerald-50">
            <p className="text-sm font-semibold text-gray-900">{userName}</p>
            {userEmail && (
              <p className="text-xs text-gray-600 truncate mt-0.5">{userEmail}</p>
            )}
          </div>

          {/* Menu Items */}
          <div className="py-2">
            {/* My Profile */}
            <button
              onClick={() => {
                navigate('/profile');
                setIsOpen(false);
              }}
              className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-teal-50 transition-colors duration-150 flex items-center gap-3 group"
            >
              <i className="ri-user-line text-teal-500 group-hover:scale-110 transition-transform" />
              <span>My Profile</span>
            </button>

            {/* Resume Builder */}
            <button
              onClick={() => {
                navigate('/resume-builder');
                setIsOpen(false);
              }}
              className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-teal-50 transition-colors duration-150 flex items-center gap-3 group"
            >
              <i className="ri-file-text-line text-teal-500 group-hover:scale-110 transition-transform" />
              <span>Resume Builder</span>
            </button>

            {/* Jobs */}
            <button
              onClick={() => {
                navigate('/jobs');
                setIsOpen(false);
              }}
              className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-teal-50 transition-colors duration-150 flex items-center gap-3 group"
            >
              <i className="ri-briefcase-line text-teal-500 group-hover:scale-110 transition-transform" />
              <span>Jobs</span>
            </button>

            {/* Settings */}
            <button
              onClick={() => {
                navigate('/profile');
                setIsOpen(false);
              }}
              className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-teal-50 transition-colors duration-150 flex items-center gap-3 group"
            >
              <i className="ri-settings-3-line text-teal-500 group-hover:scale-110 transition-transform" />
              <span>Settings</span>
            </button>
          </div>

          {/* Divider */}
          <div className="border-t border-white/20" />

          {/* Sign Out */}
          <button
            onClick={handleSignOut}
            className="w-full px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 transition-colors duration-150 flex items-center gap-3 group font-medium"
          >
            <i className="ri-logout-box-line group-hover:scale-110 transition-transform" />
            <span>Sign Out</span>
          </button>
        </div>
      )}
    </div>
  );
}

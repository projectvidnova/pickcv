import { useState } from 'react';
import { apiService } from '../../../services/api';

interface ChangePasswordModalProps {
  isForced?: boolean;  // true = must change before proceeding (first login)
  onClose: () => void;
  onSuccess: () => void;
}

export default function ChangePasswordModal({ isForced, onClose, onSuccess }: ChangePasswordModalProps) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsSubmitting(true);
    const result = await apiService.changeCollegePassword(currentPassword, newPassword);

    if (result.success) {
      // Update session to clear must_change_password
      const session = localStorage.getItem('college_session');
      if (session) {
        const parsed = JSON.parse(session);
        parsed.must_change_password = false;
        localStorage.setItem('college_session', JSON.stringify(parsed));
      }
      onSuccess();
    } else {
      setError(result.error || 'Failed to change password');
    }
    setIsSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {isForced ? 'Set New Password' : 'Change Password'}
              </h2>
              {isForced && (
                <p className="text-sm text-amber-600 mt-1">
                  You must change your temporary password before continuing.
                </p>
              )}
            </div>
            {!isForced && (
              <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg cursor-pointer">
                <i className="ri-close-line text-gray-500 text-xl"></i>
              </button>
            )}
          </div>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2">
              <i className="ri-error-warning-line text-red-500"></i>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              {isForced ? 'Temporary Password' : 'Current Password'}
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={e => setCurrentPassword(e.target.value)}
              required
              placeholder={isForced ? 'Enter the password from your email' : 'Enter current password'}
              className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              required
              minLength={6}
              placeholder="At least 6 characters"
              className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm New Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              required
              placeholder="Re-enter new password"
              className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-5 py-2.5 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Saving...
                </>
              ) : (
                'Change Password'
              )}
            </button>
            {!isForced && (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 text-gray-600 hover:text-gray-800 text-sm cursor-pointer"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

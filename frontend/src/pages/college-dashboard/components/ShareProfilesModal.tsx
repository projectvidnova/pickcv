import { useState } from 'react';
import { apiService } from '../../../services/api';

interface Student {
  id: number;
  email: string;
  name: string | null;
  full_name: string | null;
  branch: string | null;
  graduation_year: number | null;
  status: string;
  has_resume: boolean;
  resume_count: number;
  skills: string[];
  cgpa: number | null;
  phone: string | null;
  linkedin_url: string | null;
  profile_picture_url: string | null;
}

interface ShareProfilesModalProps {
  students: Student[];
  onClose: () => void;
  onSuccess: () => void;
}

export default function ShareProfilesModal({ students, onClose, onSuccess }: ShareProfilesModalProps) {
  const [emails, setEmails] = useState('');
  const [message, setMessage] = useState('');
  const [expiryDays, setExpiryDays] = useState<7 | 30>(7);
  const [shareLink, setShareLink] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleShare = async () => {
    if (!emails.trim()) {
      alert('Please enter at least one email address');
      return;
    }
    setIsLoading(true);
    try {
      const res = await apiService.shareStudentProfiles({
        student_ids: students.map(s => s.id),
        recruiter_email: emails.trim(),
        message: message || undefined,
        expires_in_days: expiryDays,
      });
      const shareData = res.data || res;
      setShareLink(shareData.share_url || `https://pickcv.com/shared/profiles/${shareData.share_token || ''}`);
      setShowSuccess(true);
    } catch (err: any) {
      alert(err.message || 'Failed to share profiles');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareLink);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const handleClose = () => {
    if (showSuccess) {
      onSuccess();
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-teal-600 to-emerald-600 px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <i className="ri-share-forward-line text-white text-xl"></i>
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Share Student Profiles</h3>
              <p className="text-teal-100 text-sm">{students.length} {students.length === 1 ? 'profile' : 'profiles'} selected</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors cursor-pointer">
            <i className="ri-close-line text-white text-xl"></i>
          </button>
        </div>

        {!showSuccess ? (
          <div className="p-6 space-y-6">
            {/* Selected Students Summary */}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <i className="ri-user-line text-teal-600"></i>
                Selected Students
              </h4>
              <div className="bg-gray-50 rounded-xl p-4 max-h-48 overflow-y-auto space-y-2">
                {students.map((student) => {
                  const displayName = student.full_name || student.name || student.email.split('@')[0];
                  const initials = displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
                  return (
                  <div key={student.id} className="flex items-center justify-between bg-white rounded-lg px-3 py-2 border border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center text-white text-xs font-semibold">
                        {initials}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{displayName}</p>
                        <p className="text-xs text-gray-500">{student.branch || student.email}</p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-md text-xs font-semibold border ${
                      student.status === 'ready' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
                      student.status === 'registered' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                      'bg-amber-100 text-amber-700 border-amber-200'
                    }`}>
                      {student.status === 'ready' ? 'Ready' : student.status === 'registered' ? 'Registered' : 'Invited'}
                    </span>
                  </div>
                  );
                })}
              </div>
            </div>

            {/* Recruiter Emails */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <i className="ri-mail-line text-teal-600 mr-1"></i>
                Recruiter Email(s) <span className="text-red-500">*</span>
              </label>
              <textarea
                value={emails}
                onChange={(e) => setEmails(e.target.value)}
                placeholder={"Enter email addresses separated by commas\ne.g., recruiter@company.com, hr@startup.com"}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none text-sm"
                rows={3}
              />
              <p className="text-xs text-gray-500 mt-1">Separate multiple emails with commas</p>
            </div>

            {/* Optional Message */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <i className="ri-message-3-line text-teal-600 mr-1"></i>
                Message (Optional)
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Add a personal message to the recruiter..."
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none text-sm"
                rows={3}
                maxLength={500}
              />
              <p className="text-xs text-gray-500 mt-1">{message.length}/500 characters</p>
            </div>

            {/* Link Expiry */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                <i className="ri-time-line text-teal-600 mr-1"></i>
                Link Expiry
              </label>
              <div className="flex gap-3">
                <button
                  onClick={() => setExpiryDays(7)}
                  className={`flex-1 px-4 py-3 rounded-xl border-2 transition-all cursor-pointer ${
                    expiryDays === 7
                      ? 'border-teal-500 bg-teal-50 text-teal-700'
                      : 'border-gray-200 hover:border-gray-300 text-gray-700'
                  }`}>
                  <p className="font-semibold text-sm">7 Days</p>
                  <p className="text-xs text-gray-500 mt-0.5">Short-term access</p>
                </button>
                <button
                  onClick={() => setExpiryDays(30)}
                  className={`flex-1 px-4 py-3 rounded-xl border-2 transition-all cursor-pointer ${
                    expiryDays === 30
                      ? 'border-teal-500 bg-teal-50 text-teal-700'
                      : 'border-gray-200 hover:border-gray-300 text-gray-700'
                  }`}>
                  <p className="font-semibold text-sm">30 Days</p>
                  <p className="text-xs text-gray-500 mt-0.5">Extended access</p>
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                onClick={onClose}
                className="flex-1 px-6 py-3 rounded-xl border-2 border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 transition-colors cursor-pointer whitespace-nowrap">
                Cancel
              </button>
              <button
                onClick={handleShare}
                disabled={isLoading}
                className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 text-white font-semibold hover:from-teal-700 hover:to-emerald-700 transition-all cursor-pointer whitespace-nowrap flex items-center justify-center gap-2 shadow-lg disabled:opacity-50">
                <i className={isLoading ? 'ri-loader-4-line animate-spin' : 'ri-send-plane-fill'}></i>
                {isLoading ? 'Sharing...' : 'Share Profiles'}
              </button>
            </div>
          </div>
        ) : (
          <div className="p-6 space-y-6">
            {/* Success Message */}
            <div className="text-center py-6">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center mx-auto mb-4">
                <i className="ri-check-line text-white text-3xl"></i>
              </div>
              <h4 className="text-xl font-bold text-gray-900 mb-2">Profiles Shared Successfully!</h4>
              <p className="text-gray-600 text-sm">
                {students.length} student {students.length === 1 ? 'profile has' : 'profiles have'} been shared with the recruiters.
              </p>
            </div>

            {/* Shareable Link */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <i className="ri-link text-teal-600 mr-1"></i>
                Shareable Link
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={shareLink}
                  readOnly
                  className="flex-1 px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-sm text-gray-700 font-mono"
                />
                <button
                  onClick={copyToClipboard}
                  className={`px-5 py-3 rounded-xl font-semibold transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
                    copySuccess
                      ? 'bg-emerald-100 text-emerald-700 border-2 border-emerald-200'
                      : 'bg-teal-600 text-white hover:bg-teal-700'
                  }`}>
                  <i className={copySuccess ? 'ri-check-line' : 'ri-file-copy-line'}></i>
                  {copySuccess ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                <i className="ri-information-line mr-1"></i>
                This link will expire in {expiryDays} days
              </p>
            </div>

            {/* Email Confirmation */}
            <div className="bg-teal-50 border border-teal-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center shrink-0">
                  <i className="ri-mail-check-line text-teal-600"></i>
                </div>
                <div>
                  <p className="text-sm font-semibold text-teal-900 mb-1">Email Sent</p>
                  <p className="text-xs text-teal-700 leading-relaxed">
                    An email with the shareable link has been sent to the recruiter(s). They can access the profiles directly from the link.
                  </p>
                </div>
              </div>
            </div>

            {/* Close Button */}
            <button
              onClick={handleClose}
              className="w-full px-6 py-3 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 text-white font-semibold hover:from-teal-700 hover:to-emerald-700 transition-all cursor-pointer whitespace-nowrap shadow-lg">
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

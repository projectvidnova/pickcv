
import { useState } from 'react';

interface ProfileHeaderProps {
  name: string;
  email: string;
  location: string;
  targetRole: string;
  experienceLevel: string;
  onEdit: () => void;
}

const expLabels: Record<string, string> = {
  entry: 'Entry Level',
  mid: 'Mid Level',
  senior: 'Senior',
  lead: 'Lead / Manager',
};

export default function ProfileHeader({ name, email, location, targetRole, experienceLevel, onEdit }: ProfileHeaderProps) {
  const [copied, setCopied] = useState(false);

  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(email);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      {/* Banner */}
      <div className="h-28 bg-gradient-to-r from-teal-500 via-emerald-500 to-teal-400 relative">
        <div className="absolute inset-0 opacity-20"
          style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)', backgroundSize: '40px 40px' }}
        />
      </div>

      {/* Avatar + Info */}
      <div className="px-8 pb-7">
        <div className="flex items-end justify-between -mt-10 mb-5">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center border-4 border-white shadow-lg flex-shrink-0">
            <span className="text-2xl font-extrabold text-white">{initials || '?'}</span>
          </div>
          <button
            onClick={onEdit}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-700 transition-all cursor-pointer whitespace-nowrap shadow-sm"
          >
            <i className="ri-edit-2-line text-sm" />
            Edit Profile
          </button>
        </div>

        <div className="flex flex-col gap-1 mb-4">
          <h1 className="text-2xl font-extrabold text-slate-900">{name || 'Your Name'}</h1>
          {targetRole && (
            <p className="text-sm font-semibold text-teal-600">{targetRole}</p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-4">
          {email && (
            <button
              onClick={handleCopyEmail}
              className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 transition-colors cursor-pointer group"
            >
              <div className="w-4 h-4 flex items-center justify-center">
                <i className="ri-mail-line text-sm" />
              </div>
              {email}
              <div className="w-4 h-4 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <i className={`text-xs ${copied ? 'ri-checkbox-circle-fill text-emerald-500' : 'ri-file-copy-line text-slate-400'}`} />
              </div>
            </button>
          )}
          {location && (
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <div className="w-4 h-4 flex items-center justify-center">
                <i className="ri-map-pin-2-line text-sm" />
              </div>
              {location}
            </div>
          )}
          {experienceLevel && (
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-teal-50 text-teal-700 text-xs font-bold rounded-full border border-teal-100">
                <i className="ri-award-line text-xs" />
                {expLabels[experienceLevel] || experienceLevel}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

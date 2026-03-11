
import { useState } from 'react';

interface BasicInfoData {
  name: string;
  email: string;
  phone: string;
  linkedin: string;
  location: string;
}

interface StepBasicInfoProps {
  data: BasicInfoData;
  onChange: (data: BasicInfoData) => void;
}

export default function StepBasicInfo({ data, onChange }: StepBasicInfoProps) {
  const [focused, setFocused] = useState<string | null>(null);

  const handleChange = (field: keyof BasicInfoData, value: string) => {
    onChange({ ...data, [field]: value });
  };

  const fieldClass = (field: string) =>
    `w-full pl-11 pr-10 py-3.5 text-sm rounded-xl border-2 transition-all duration-200 focus:outline-none bg-white text-gray-900 placeholder:text-gray-300 ${
      focused === field
        ? 'border-rose-400 ring-4 ring-rose-50 shadow-sm'
        : 'border-gray-100 hover:border-gray-200 bg-gray-50/50'
    }`;

  const isValid = (field: string) => {
    if (field === 'name') return data.name.trim().length > 1;
    if (field === 'email') return data.email.includes('@') && data.email.includes('.');
    if (field === 'location') return data.location.trim().length > 2;
    return false;
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-extrabold text-gray-900 leading-tight mb-2">
          Your basic details
        </h2>
        <p className="text-gray-400 text-sm leading-relaxed">
          Fill in your info below — this takes less than 2 minutes.
        </p>
      </div>

      <div className="space-y-4">
        {/* Full Name */}
        <div>
          <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">
            Full Name <span className="text-rose-400">*</span>
          </label>
          <div className="relative">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center text-gray-300">
              <i className="ri-user-3-line text-base" />
            </div>
            <input
              type="text"
              value={data.name}
              onChange={(e) => handleChange('name', e.target.value)}
              onFocus={() => setFocused('name')}
              onBlur={() => setFocused(null)}
              placeholder="e.g. Rahul Sharma"
              className={fieldClass('name')}
              required
            />
            {isValid('name') && (
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center text-emerald-500">
                <i className="ri-checkbox-circle-fill text-base" />
              </div>
            )}
          </div>
        </div>

        {/* Email & Phone */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">
              Email <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center text-gray-300">
                <i className="ri-mail-line text-base" />
              </div>
              <input
                type="email"
                value={data.email}
                onChange={(e) => handleChange('email', e.target.value)}
                onFocus={() => setFocused('email')}
                onBlur={() => setFocused(null)}
                placeholder="rahul@example.com"
                className={fieldClass('email')}
                required
              />
              {isValid('email') && (
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center text-emerald-500">
                  <i className="ri-checkbox-circle-fill text-base" />
                </div>
              )}
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">
              Phone
            </label>
            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center text-gray-300">
                <i className="ri-phone-line text-base" />
              </div>
              <input
                type="tel"
                value={data.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                onFocus={() => setFocused('phone')}
                onBlur={() => setFocused(null)}
                placeholder="+1 (555) 000-0000"
                className={fieldClass('phone')}
              />
            </div>
          </div>
        </div>

        {/* LinkedIn */}
        <div>
          <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">
            LinkedIn Profile
          </label>
          <div className="relative">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center text-[#0A66C2]">
              <i className="ri-linkedin-fill text-base" />
            </div>
            <input
              type="url"
              value={data.linkedin}
              onChange={(e) => handleChange('linkedin', e.target.value)}
              onFocus={() => setFocused('linkedin')}
              onBlur={() => setFocused(null)}
              placeholder="linkedin.com/in/yourprofile"
              className={fieldClass('linkedin')}
            />
          </div>
        </div>

        {/* Location */}
        <div>
          <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">
            Current Location <span className="text-rose-400">*</span>
          </label>
          <div className="relative">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center text-gray-300">
              <i className="ri-map-pin-2-line text-base" />
            </div>
            <input
              type="text"
              value={data.location}
              onChange={(e) => handleChange('location', e.target.value)}
              onFocus={() => setFocused('location')}
              onBlur={() => setFocused(null)}
              placeholder="San Francisco, CA"
              className={fieldClass('location')}
              required
            />
            {isValid('location') && (
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center text-emerald-500">
                <i className="ri-checkbox-circle-fill text-base" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Trust note */}
      <div className="mt-6 flex items-center gap-2 px-4 py-3 bg-gray-50 rounded-xl">
        <div className="w-4 h-4 flex items-center justify-center text-emerald-500 flex-shrink-0">
          <i className="ri-shield-check-fill text-sm" />
        </div>
        <span className="text-xs text-gray-400">Your information is encrypted and never shared without your consent.</span>
      </div>
    </div>
  );
}

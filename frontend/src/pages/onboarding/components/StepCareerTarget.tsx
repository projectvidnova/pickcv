
import { useState } from 'react';

interface CareerTargetData {
  targetRole: string;
  preferredLocations: string[];
  experienceLevel: string;
  workMode: string;
}

interface StepCareerTargetProps {
  data: CareerTargetData;
  onChange: (data: CareerTargetData) => void;
}

const experienceLevels = [
  { value: 'entry', label: 'Entry Level', desc: '0–2 years', icon: 'ri-seedling-line', color: 'emerald' },
  { value: 'mid', label: 'Mid Level', desc: '3–5 years', icon: 'ri-plant-line', color: 'teal' },
  { value: 'senior', label: 'Senior', desc: '6–10 years', icon: 'ri-tree-line', color: 'amber' },
  { value: 'lead', label: 'Lead / Manager', desc: '10+ years', icon: 'ri-award-line', color: 'rose' },
];

const workModes = [
  { value: 'remote', label: 'Remote', icon: 'ri-home-wifi-line', desc: 'Work from anywhere' },
  { value: 'hybrid', label: 'Hybrid', icon: 'ri-building-2-line', desc: 'Best of both worlds' },
  { value: 'onsite', label: 'On-site', icon: 'ri-map-pin-2-line', desc: 'In-office full time' },
];

const suggestedRoles = [
  'Product Manager', 'Software Engineer', 'Data Scientist', 'UX Designer',
  'Marketing Manager', 'Business Analyst', 'Project Manager', 'DevOps Engineer',
  'Frontend Developer', 'Backend Developer', 'Full Stack Developer', 'Data Analyst',
];

export default function StepCareerTarget({ data, onChange }: StepCareerTargetProps) {
  const [focused, setFocused] = useState<string | null>(null);
  const [locationInput, setLocationInput] = useState('');
  const [showRoleSuggestions, setShowRoleSuggestions] = useState(false);

  const filteredRoles = suggestedRoles.filter(
    (r) => r.toLowerCase().includes(data.targetRole.toLowerCase()) && data.targetRole.length > 0,
  );

  const addLocation = () => {
    const trimmed = locationInput.trim();
    if (!trimmed || data.preferredLocations.includes(trimmed)) { setLocationInput(''); return; }
    onChange({ ...data, preferredLocations: [...data.preferredLocations, trimmed] });
    setLocationInput('');
  };

  const removeLocation = (loc: string) =>
    onChange({ ...data, preferredLocations: data.preferredLocations.filter((l) => l !== loc) });

  const handleLocationKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') { e.preventDefault(); addLocation(); }
  };

  const inputBase = (field: string) =>
    `w-full pl-11 pr-4 py-3.5 text-sm rounded-xl border-2 transition-all duration-200 focus:outline-none bg-white text-gray-900 placeholder:text-gray-300 ${
      focused === field
        ? 'border-amber-400 ring-4 ring-amber-50 shadow-sm'
        : 'border-gray-100 hover:border-gray-200 bg-gray-50/50'
    }`;

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-extrabold text-gray-900 leading-tight mb-2">
          Your career target
        </h2>
        <p className="text-gray-400 text-sm leading-relaxed">
          Be specific — the more precise you are, the better your job matches will be.
        </p>
      </div>

      <div className="space-y-6">
        {/* Target Role */}
        <div>
          <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">
            Target Role <span className="text-rose-400">*</span>
          </label>
          <div className="relative">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center text-gray-300">
              <i className="ri-briefcase-4-line text-base" />
            </div>
            <input
              type="text"
              value={data.targetRole}
              onChange={(e) => { onChange({ ...data, targetRole: e.target.value }); setShowRoleSuggestions(true); }}
              onFocus={() => { setFocused('role'); setShowRoleSuggestions(true); }}
              onBlur={() => { setFocused(null); setTimeout(() => setShowRoleSuggestions(false), 200); }}
              placeholder="e.g. Product Manager"
              className={inputBase('role')}
              required
            />
            {showRoleSuggestions && filteredRoles.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-gray-100 rounded-xl shadow-xl z-20 overflow-hidden">
                {filteredRoles.slice(0, 5).map((role) => (
                  <button
                    key={role}
                    type="button"
                    onMouseDown={() => { onChange({ ...data, targetRole: role }); setShowRoleSuggestions(false); }}
                    className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-amber-50 transition-colors cursor-pointer flex items-center gap-3"
                  >
                    <div className="w-6 h-6 flex items-center justify-center text-amber-400">
                      <i className="ri-briefcase-4-line text-sm" />
                    </div>
                    {role}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Preferred Locations */}
        <div>
          <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">
            Preferred Locations
            <span className="ml-2 text-gray-300 font-normal normal-case">Press Enter to add</span>
          </label>
          <div className={`flex flex-wrap items-center gap-2 p-3 border-2 rounded-xl transition-all duration-200 min-h-[52px] bg-white ${
            focused === 'locations' ? 'border-amber-400 ring-4 ring-amber-50 shadow-sm' : 'border-gray-100 hover:border-gray-200'
          }`}>
            {data.preferredLocations.map((loc) => (
              <span key={loc} className="inline-flex items-center gap-1.5 bg-amber-500 text-white px-3 py-1.5 rounded-lg text-xs font-semibold">
                <i className="ri-map-pin-line text-xs" />
                {loc}
                <button type="button" onClick={() => removeLocation(loc)} className="hover:text-amber-200 cursor-pointer ml-0.5">
                  <i className="ri-close-line text-sm" />
                </button>
              </span>
            ))}
            <input
              type="text"
              value={locationInput}
              onChange={(e) => setLocationInput(e.target.value)}
              onKeyDown={handleLocationKeyDown}
              onFocus={() => setFocused('locations')}
              onBlur={() => { setFocused(null); addLocation(); }}
              placeholder={data.preferredLocations.length === 0 ? 'e.g. New York, London, Remote...' : 'Add more...'}
              className="flex-1 min-w-[160px] text-sm bg-transparent focus:outline-none text-gray-900 placeholder:text-gray-300 py-1"
            />
          </div>
        </div>

        {/* Experience Level */}
        <div>
          <label className="block text-xs font-bold text-gray-600 mb-3 uppercase tracking-wide">
            Experience Level <span className="text-rose-400">*</span>
          </label>
          <div className="grid grid-cols-2 gap-3">
            {experienceLevels.map((level) => {
              const active = data.experienceLevel === level.value;
              return (
                <button
                  key={level.value}
                  type="button"
                  onClick={() => onChange({ ...data, experienceLevel: level.value })}
                  className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer text-left group ${
                    active
                      ? 'border-amber-400 bg-gradient-to-br from-amber-50 to-orange-50 shadow-md shadow-amber-100'
                      : 'border-gray-100 hover:border-gray-200 bg-white hover:shadow-sm'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                    active ? 'bg-amber-500 text-white' : 'bg-gray-100 text-gray-400 group-hover:bg-gray-200'
                  }`}>
                    <i className={`${level.icon} text-lg`} />
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm font-bold ${active ? 'text-amber-700' : 'text-gray-800'}`}>{level.label}</p>
                    <p className={`text-xs mt-0.5 ${active ? 'text-amber-500' : 'text-gray-400'}`}>{level.desc}</p>
                  </div>
                  {active && (
                    <div className="w-5 h-5 flex items-center justify-center">
                      <i className="ri-checkbox-circle-fill text-emerald-500 text-lg" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Work Mode */}
        <div>
          <label className="block text-xs font-bold text-gray-600 mb-3 uppercase tracking-wide">
            Work Preference <span className="text-rose-400">*</span>
          </label>
          <div className="grid grid-cols-3 gap-3">
            {workModes.map((mode) => {
              const active = data.workMode === mode.value;
              return (
                <button
                  key={mode.value}
                  type="button"
                  onClick={() => onChange({ ...data, workMode: mode.value })}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer group ${
                    active
                      ? 'border-amber-400 bg-gradient-to-br from-amber-50 to-orange-50 shadow-md shadow-amber-100'
                      : 'border-gray-100 hover:border-gray-200 bg-white hover:shadow-sm'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                    active ? 'bg-amber-500 text-white' : 'bg-gray-100 text-gray-400 group-hover:bg-gray-200'
                  }`}>
                    <i className={`${mode.icon} text-lg`} />
                  </div>
                  <p className={`text-sm font-bold ${active ? 'text-amber-700' : 'text-gray-800'}`}>{mode.label}</p>
                  <p className={`text-[10px] text-center leading-tight ${active ? 'text-amber-500' : 'text-gray-400'}`}>{mode.desc}</p>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

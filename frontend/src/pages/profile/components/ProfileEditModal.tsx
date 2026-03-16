
import { useState } from 'react';

interface SkillEntry {
  name: string;
  years: number;
}

interface ProfileData {
  name: string;
  email: string;
  phone: string;
  linkedin: string;
  location: string;
  targetRole: string;
  preferredLocations: string[];
  experienceLevel: string;
  workMode: string;
  skills: SkillEntry[];
}

interface ProfileEditModalProps {
  data: ProfileData;
  onSave: (data: ProfileData) => void;
  onClose: () => void;
  saving?: boolean;
}

const experienceLevels = [
  { value: 'entry', label: 'Entry Level', desc: '0–2 yrs', icon: 'ri-seedling-line' },
  { value: 'mid', label: 'Mid Level', desc: '3–5 yrs', icon: 'ri-plant-line' },
  { value: 'senior', label: 'Senior', desc: '6–10 yrs', icon: 'ri-tree-line' },
  { value: 'lead', label: 'Lead / Manager', desc: '10+ yrs', icon: 'ri-award-line' },
];

const workModes = [
  { value: 'remote', label: 'Remote', icon: 'ri-home-wifi-line' },
  { value: 'hybrid', label: 'Hybrid', icon: 'ri-building-2-line' },
  { value: 'onsite', label: 'On-site', icon: 'ri-map-pin-2-line' },
];

const expLabels = ['< 1 yr', '1 yr', '2 yrs', '3 yrs', '4 yrs', '5 yrs', '6 yrs', '7 yrs', '8 yrs', '9 yrs', '10+ yrs'];

type TabKey = 'personal' | 'career' | 'skills';

export default function ProfileEditModal({ data, onSave, onClose, saving = false }: ProfileEditModalProps) {
  const [form, setForm] = useState<ProfileData>({ ...data, skills: data.skills.map((s) => ({ ...s })), preferredLocations: [...data.preferredLocations] });
  const [activeTab, setActiveTab] = useState<TabKey>('personal');
  const [locationInput, setLocationInput] = useState('');
  const [skillInput, setSkillInput] = useState('');
  const [saved, setSaved] = useState(false);

  const update = (field: keyof ProfileData, value: unknown) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const addLocation = () => {
    const t = locationInput.trim();
    if (t && !form.preferredLocations.includes(t)) {
      update('preferredLocations', [...form.preferredLocations, t]);
    }
    setLocationInput('');
  };

  const removeLocation = (loc: string) =>
    update('preferredLocations', form.preferredLocations.filter((l) => l !== loc));

  const addSkill = (name: string) => {
    const t = name.trim();
    if (t && !form.skills.some((s) => s.name.toLowerCase() === t.toLowerCase())) {
      update('skills', [...form.skills, { name: t, years: 2 }]);
      setSkillInput('');
    }
  };

  const removeSkill = (name: string) =>
    update('skills', form.skills.filter((s) => s.name !== name));

  const updateSkillYears = (name: string, years: number) =>
    update('skills', form.skills.map((s) => (s.name === name ? { ...s, years } : s)));

  const handleSave = () => {
    onSave(form);
  };

  const inputCls = 'w-full pl-10 pr-4 py-3 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-teal-400 focus:ring-4 focus:ring-teal-50 transition-all bg-white text-slate-900 placeholder:text-slate-300';

  const tabs: { key: TabKey; label: string; icon: string }[] = [
    { key: 'personal', label: 'Personal Info', icon: 'ri-user-3-line' },
    { key: 'career', label: 'Career Target', icon: 'ri-focus-3-line' },
    { key: 'skills', label: 'Skills', icon: 'ri-sparkling-2-line' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-7 py-5 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900">Edit Profile</h2>
            <p className="text-xs text-slate-400 mt-0.5">Update your details below</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer">
            <i className="ri-close-line text-lg" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 px-7 pt-4 pb-0 border-b border-slate-100">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-t-xl transition-all cursor-pointer whitespace-nowrap border-b-2 -mb-px ${
                activeTab === tab.key
                  ? 'text-teal-600 border-teal-500 bg-teal-50/50'
                  : 'text-slate-400 border-transparent hover:text-slate-700 hover:bg-slate-50'
              }`}
            >
              <div className="w-4 h-4 flex items-center justify-center">
                <i className={`${tab.icon} text-sm`} />
              </div>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-7 py-6 space-y-5">

          {/* ── Personal Info ── */}
          {activeTab === 'personal' && (
            <>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Full Name</label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 flex items-center justify-center text-slate-300">
                    <i className="ri-user-3-line text-sm" />
                  </div>
                  <input type="text" value={form.name} onChange={(e) => update('name', e.target.value)} placeholder="Alex Johnson" className={inputCls} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Email</label>
                  <div className="relative">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 flex items-center justify-center text-slate-300">
                      <i className="ri-mail-line text-sm" />
                    </div>
                    <input type="email" value={form.email} onChange={(e) => update('email', e.target.value)} placeholder="alex@example.com" className={inputCls} />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Phone</label>
                  <div className="relative">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 flex items-center justify-center text-slate-300">
                      <i className="ri-phone-line text-sm" />
                    </div>
                    <input type="tel" value={form.phone} onChange={(e) => update('phone', e.target.value)} placeholder="+1 (555) 000-0000" className={inputCls} />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">LinkedIn URL</label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 flex items-center justify-center text-[#0A66C2]">
                    <i className="ri-linkedin-fill text-sm" />
                  </div>
                  <input type="url" value={form.linkedin} onChange={(e) => update('linkedin', e.target.value)} placeholder="linkedin.com/in/yourprofile" className={inputCls} />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Current Location</label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 flex items-center justify-center text-slate-300">
                    <i className="ri-map-pin-2-line text-sm" />
                  </div>
                  <input type="text" value={form.location} onChange={(e) => update('location', e.target.value)} placeholder="San Francisco, CA" className={inputCls} />
                </div>
              </div>
            </>
          )}

          {/* ── Career Target ── */}
          {activeTab === 'career' && (
            <>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Target Role</label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 flex items-center justify-center text-slate-300">
                    <i className="ri-briefcase-4-line text-sm" />
                  </div>
                  <input type="text" value={form.targetRole} onChange={(e) => update('targetRole', e.target.value)} placeholder="e.g. Product Manager" className={inputCls} />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">
                  Preferred Locations
                  <span className="ml-2 text-slate-300 font-normal normal-case">Press Enter to add</span>
                </label>
                <div className="flex flex-wrap items-center gap-2 p-3 border border-slate-200 rounded-xl min-h-[52px] bg-white focus-within:border-teal-400 focus-within:ring-4 focus-within:ring-teal-50 transition-all">
                  {form.preferredLocations.map((loc) => (
                    <span key={loc} className="inline-flex items-center gap-1.5 bg-teal-500 text-white px-3 py-1.5 rounded-lg text-xs font-semibold">
                      <i className="ri-map-pin-line text-xs" />
                      {loc}
                      <button type="button" onClick={() => removeLocation(loc)} className="hover:text-teal-200 cursor-pointer ml-0.5">
                        <i className="ri-close-line text-sm" />
                      </button>
                    </span>
                  ))}
                  <input
                    type="text"
                    value={locationInput}
                    onChange={(e) => setLocationInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addLocation(); } }}
                    onBlur={addLocation}
                    placeholder={form.preferredLocations.length === 0 ? 'e.g. New York, London...' : 'Add more...'}
                    className="flex-1 min-w-[140px] text-sm bg-transparent focus:outline-none text-slate-900 placeholder:text-slate-300 py-1"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-3 uppercase tracking-wide">Experience Level</label>
                <div className="grid grid-cols-2 gap-3">
                  {experienceLevels.map((lvl) => {
                    const active = form.experienceLevel === lvl.value;
                    return (
                      <button
                        key={lvl.value}
                        type="button"
                        onClick={() => update('experienceLevel', lvl.value)}
                        className={`flex items-center gap-3 p-3.5 rounded-xl border-2 transition-all cursor-pointer text-left ${
                          active ? 'border-teal-400 bg-teal-50 shadow-sm' : 'border-slate-100 hover:border-slate-200 bg-white'
                        }`}
                      >
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${active ? 'bg-teal-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                          <i className={`${lvl.icon} text-base`} />
                        </div>
                        <div>
                          <p className={`text-sm font-bold ${active ? 'text-teal-700' : 'text-slate-800'}`}>{lvl.label}</p>
                          <p className={`text-xs ${active ? 'text-teal-500' : 'text-slate-400'}`}>{lvl.desc}</p>
                        </div>
                        {active && <div className="ml-auto w-5 h-5 flex items-center justify-center"><i className="ri-checkbox-circle-fill text-emerald-500 text-lg" /></div>}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-3 uppercase tracking-wide">Work Preference</label>
                <div className="grid grid-cols-3 gap-3">
                  {workModes.map((mode) => {
                    const active = form.workMode === mode.value;
                    return (
                      <button
                        key={mode.value}
                        type="button"
                        onClick={() => update('workMode', mode.value)}
                        className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all cursor-pointer ${
                          active ? 'border-teal-400 bg-teal-50 shadow-sm' : 'border-slate-100 hover:border-slate-200 bg-white'
                        }`}
                      >
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${active ? 'bg-teal-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                          <i className={`${mode.icon} text-base`} />
                        </div>
                        <p className={`text-sm font-bold ${active ? 'text-teal-700' : 'text-slate-800'}`}>{mode.label}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {/* ── Skills ── */}
          {activeTab === 'skills' && (
            <>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">
                  Add Skills
                  <span className="ml-2 text-slate-300 font-normal normal-case">Press Enter to add</span>
                </label>
                <div className="flex flex-wrap items-center gap-2 p-3 border border-slate-200 rounded-xl min-h-[56px] bg-white focus-within:border-teal-400 focus-within:ring-4 focus-within:ring-teal-50 transition-all">
                  {form.skills.map((skill) => (
                    <span key={skill.name} className="inline-flex items-center gap-1.5 bg-teal-500 text-white px-3 py-1.5 rounded-lg text-xs font-semibold">
                      {skill.name}
                      <button type="button" onClick={() => removeSkill(skill.name)} className="hover:text-teal-200 cursor-pointer ml-0.5">
                        <i className="ri-close-line text-sm" />
                      </button>
                    </span>
                  ))}
                  <input
                    type="text"
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSkill(skillInput); } }}
                    placeholder={form.skills.length === 0 ? 'Type a skill and press Enter...' : 'Add more...'}
                    className="flex-1 min-w-[160px] text-sm bg-transparent focus:outline-none text-slate-900 placeholder:text-slate-300 py-1"
                  />
                </div>
              </div>

              {form.skills.length > 0 && (
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-3 uppercase tracking-wide">Years of experience per skill</label>
                  <div className="space-y-3">
                    {form.skills.map((skill) => (
                      <div key={skill.name} className="bg-slate-50 border border-slate-100 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-teal-500" />
                            <span className="text-sm font-bold text-slate-900">{skill.name}</span>
                          </div>
                          <span className="text-sm font-bold text-teal-600 bg-teal-50 px-2.5 py-1 rounded-lg">
                            {expLabels[Math.min(skill.years, 10)]}
                          </span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="10"
                          step="1"
                          value={Math.min(skill.years, 10)}
                          onChange={(e) => updateSkillYears(skill.name, Number(e.target.value))}
                          className="w-full h-2 bg-slate-200 rounded-full appearance-none cursor-pointer accent-teal-500"
                        />
                        <div className="flex justify-between mt-1">
                          <span className="text-[10px] text-slate-400">Beginner</span>
                          <span className="text-[10px] text-slate-400">Expert</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-7 py-5 border-t border-slate-100 bg-slate-50/50">
          <button onClick={onClose} className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-all cursor-pointer whitespace-nowrap">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer whitespace-nowrap shadow-sm ${
              saving
                ? 'bg-slate-400 text-white cursor-not-allowed'
                : 'bg-slate-900 text-white hover:bg-slate-700'
            }`}
          >
            {saving ? (
              <><i className="ri-loader-4-line text-base animate-spin" /> Saving...</>
            ) : (
              <><i className="ri-save-3-line text-base" /> Save Changes</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}


import { useState, useMemo } from 'react';

interface SkillEntry {
  name: string;
  years: number;
}

interface SkillsData {
  skills: SkillEntry[];
}

interface StepSkillsProps {
  data: SkillsData;
  targetRole: string;
  onChange: (data: SkillsData) => void;
}

const roleSuggestions: Record<string, string[]> = {
  'product manager': ['Product Strategy', 'Roadmapping', 'User Research', 'Agile', 'Data Analysis', 'Stakeholder Management', 'A/B Testing', 'SQL'],
  'software engineer': ['JavaScript', 'TypeScript', 'React', 'Node.js', 'Python', 'Git', 'AWS', 'System Design'],
  'data scientist': ['Python', 'Machine Learning', 'SQL', 'TensorFlow', 'Statistics', 'Data Visualization', 'R', 'Deep Learning'],
  'ux designer': ['Figma', 'User Research', 'Wireframing', 'Prototyping', 'Design Systems', 'Usability Testing', 'Adobe XD', 'Interaction Design'],
  'marketing manager': ['SEO', 'Content Strategy', 'Google Analytics', 'Social Media', 'Email Marketing', 'PPC', 'Brand Strategy', 'CRM'],
  'business analyst': ['SQL', 'Excel', 'Data Modeling', 'Requirements Gathering', 'Tableau', 'Process Mapping', 'Agile', 'Stakeholder Management'],
  'project manager': ['Agile', 'Scrum', 'Risk Management', 'Jira', 'Budgeting', 'Stakeholder Management', 'MS Project', 'Communication'],
  'devops engineer': ['Docker', 'Kubernetes', 'CI/CD', 'AWS', 'Terraform', 'Linux', 'Python', 'Monitoring'],
  'frontend developer': ['React', 'TypeScript', 'CSS', 'HTML', 'Next.js', 'Tailwind CSS', 'GraphQL', 'Testing'],
  'backend developer': ['Node.js', 'Python', 'PostgreSQL', 'REST APIs', 'Docker', 'Redis', 'AWS', 'Microservices'],
  'data analyst': ['SQL', 'Excel', 'Tableau', 'Python', 'Power BI', 'Data Visualization', 'Statistics', 'Google Analytics'],
};

const defaultSuggestions = ['Communication', 'Leadership', 'Problem Solving', 'Teamwork', 'Project Management', 'Data Analysis', 'Excel', 'Presentation'];

const experienceLabels = ['< 1 yr', '1 yr', '2 yrs', '3 yrs', '4 yrs', '5 yrs', '6 yrs', '7 yrs', '8 yrs', '9 yrs', '10+ yrs'];

export default function StepSkills({ data, targetRole, onChange }: StepSkillsProps) {
  const [skillInput, setSkillInput] = useState('');
  const [focused, setFocused] = useState(false);

  const suggestions = useMemo(() => {
    const roleKey = targetRole.toLowerCase();
    const matched = Object.keys(roleSuggestions).find((key) => roleKey.includes(key));
    return matched ? roleSuggestions[matched] : defaultSuggestions;
  }, [targetRole]);

  const availableSuggestions = suggestions.filter(
    (s) => !data.skills.some((sk) => sk.name.toLowerCase() === s.toLowerCase()),
  );

  const addSkill = (name: string) => {
    const trimmed = name.trim();
    if (trimmed && !data.skills.some((s) => s.name.toLowerCase() === trimmed.toLowerCase())) {
      onChange({ ...data, skills: [...data.skills, { name: trimmed, years: 2 }] });
      setSkillInput('');
    }
  };

  const removeSkill = (name: string) =>
    onChange({ ...data, skills: data.skills.filter((s) => s.name !== name) });

  const updateYears = (name: string, years: number) =>
    onChange({ ...data, skills: data.skills.map((s) => (s.name === name ? { ...s, years } : s)) });

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') { e.preventDefault(); addSkill(skillInput); }
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-extrabold text-gray-900 leading-tight mb-2">
          Your skills & expertise
        </h2>
        <p className="text-gray-400 text-sm leading-relaxed">
          Add your top skills — we&apos;ll match you with roles where you&apos;ll truly shine.
        </p>
      </div>

      <div className="space-y-6">
        {/* Skill Input */}
        <div>
          <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">
            Add Skills
            <span className="ml-2 text-gray-300 font-normal normal-case">Press Enter to add</span>
          </label>
          <div className={`flex flex-wrap items-center gap-2 p-3 border-2 rounded-xl transition-all duration-200 min-h-[56px] bg-white ${
            focused ? 'border-teal-400 ring-4 ring-teal-50 shadow-sm' : 'border-gray-100 hover:border-gray-200'
          }`}>
            {data.skills.map((skill) => (
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
              onKeyDown={handleKeyDown}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              placeholder={data.skills.length === 0 ? 'Type a skill and press Enter...' : 'Add more skills...'}
              className="flex-1 min-w-[160px] text-sm bg-transparent focus:outline-none text-gray-900 placeholder:text-gray-300 py-1"
            />
          </div>
        </div>

        {/* AI Suggestions */}
        {availableSuggestions.length > 0 && (
          <div className="bg-gradient-to-br from-teal-50 to-emerald-50 border border-teal-100 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 flex items-center justify-center">
                <i className="ri-sparkling-2-fill text-teal-500 text-base" />
              </div>
              <span className="text-xs font-bold text-teal-800">
                AI-suggested for {targetRole || 'you'}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {availableSuggestions.map((skill) => (
                <button
                  key={skill}
                  type="button"
                  onClick={() => addSkill(skill)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-teal-200 rounded-lg text-xs font-semibold text-teal-700 hover:bg-teal-500 hover:text-white hover:border-teal-500 transition-all cursor-pointer shadow-sm"
                >
                  <i className="ri-add-line text-sm" />
                  {skill}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Skill Experience Sliders */}
        {data.skills.length > 0 && (
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-3 uppercase tracking-wide">
              Years of experience per skill
            </label>
            <div className="space-y-3">
              {data.skills.map((skill) => (
                <div key={skill.name} className="bg-gray-50 border border-gray-100 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-teal-500" />
                      <span className="text-sm font-bold text-gray-900">{skill.name}</span>
                    </div>
                    <span className="text-sm font-bold text-teal-600 bg-teal-50 px-2.5 py-1 rounded-lg">
                      {experienceLabels[Math.min(skill.years, 10)]}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    step="1"
                    value={Math.min(skill.years, 10)}
                    onChange={(e) => updateYears(skill.name, Number(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-full appearance-none cursor-pointer accent-teal-500"
                  />
                  <div className="flex justify-between mt-1.5">
                    <span className="text-[10px] text-gray-400">Beginner</span>
                    <span className="text-[10px] text-gray-400">Expert</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {data.skills.length === 0 && (
          <div className="text-center py-10 border-2 border-dashed border-gray-100 rounded-xl">
            <div className="w-14 h-14 mx-auto mb-3 flex items-center justify-center bg-teal-50 rounded-2xl">
              <i className="ri-tools-line text-2xl text-teal-400" />
            </div>
            <p className="text-sm font-bold text-gray-500">No skills added yet</p>
            <p className="text-xs mt-1 text-gray-400">Type above or pick from AI suggestions</p>
          </div>
        )}
      </div>
    </div>
  );
}


import { useMemo } from 'react';

interface ResumeData {
  name: string;
  email: string;
  phone: string;
  linkedin: string;
  location: string;
  targetRole: string;
  preferredLocations: string[];
  experienceLevel: string;
  workMode: string;
  skills: Array<{ name: string; years: number }>;
}

interface ResumePreviewProps {
  data: ResumeData;
  currentStep: number;
}

const experienceMap: Record<string, string> = {
  entry: '0–2 years experience',
  mid: '3–5 years experience',
  senior: '6–10 years experience',
  lead: '10+ years experience',
};

const workModeMap: Record<string, string> = {
  remote: 'Remote',
  hybrid: 'Hybrid',
  onsite: 'On-site',
};

export default function ResumePreview({
  data,
  currentStep,
}: ResumePreviewProps) {
  const hasBasicInfo =
    data.name || data.email || data.phone || data.location;
  const hasCareer =
    data.targetRole || data.experienceLevel || data.workMode;
  const hasSkills = data.skills.length > 0;

  const initials = useMemo(() => {
    if (!data.name) return '?';
    const parts = data.name.trim().split(/\s+/);
    return parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : parts[0][0].toUpperCase();
  }, [data.name]);

  const skillBars = useMemo(() => {
    return data.skills.map((s) => ({
      ...s,
      pct: Math.min(Math.round((s.years / 10) * 100), 100),
    }));
  }, [data.skills]);

  return (
    <div className="w-full h-full flex flex-col">
      {/* Header label */}
      <div className="flex items-center justify-between px-5 pt-5 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 flex items-center justify-center text-slate-400">
            <i className="ri-file-text-line text-sm" />
          </div>
          <span className="text-[11px] font-bold tracking-wider uppercase text-slate-400">
            Live Preview
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <div
            className={`w-1.5 h-1.5 rounded-full ${
              hasBasicInfo ? 'bg-emerald-400' : 'bg-slate-200'
            }`}
          />
          <div
            className={`w-1.5 h-1.5 rounded-full ${
              hasCareer ? 'bg-emerald-400' : 'bg-slate-200'
            }`}
          />
          <div
            className={`w-1.5 h-1.5 rounded-full ${
              hasSkills ? 'bg-emerald-400' : 'bg-slate-200'
            }`}
          />
          <div
            className={`w-1.5 h-1.5 rounded-full ${
              currentStep === 4 ? 'bg-emerald-400' : 'bg-slate-200'
            }`}
          />
        </div>
      </div>

      {/* Resume document */}
      <div className="flex-1 px-5 pb-5 overflow-y-auto">
        <div
          className="bg-white rounded-xl border border-slate-200 shadow-lg shadow-slate-200/60 overflow-hidden transition-all duration-500"
          style={{ minHeight: 480 }}
        >
          {/* Resume header band */}
          <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-6 py-5 relative overflow-hidden">
            {/* Decorative circles */}
            <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-white/5" />
            <div className="absolute -right-2 bottom-0 w-14 h-14 rounded-full bg-white/5" />

            <div className="flex items-center gap-4 relative z-10">
              {/* Avatar */}
              <div
                className={`w-14 h-14 rounded-xl flex items-center justify-center text-lg font-black transition-all duration-500 flex-shrink-0 ${
                  data.name
                    ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-white'
                    : 'bg-slate-700 text-slate-500'
                }`}
              >
                {initials}
              </div>
              <div className="min-w-0">
                <h3
                  className={`text-base font-bold truncate transition-all duration-300 ${
                    data.name ? 'text-white' : 'text-slate-500'
                  }`}
                >
                  {data.name || 'Your Name'}
                </h3>
                <p
                  className={`text-xs truncate mt-0.5 transition-all duration-300 ${
                    data.targetRole ? 'text-amber-300' : 'text-slate-500'
                  }`}
                >
                  {data.targetRole || 'Your Target Role'}
                </p>
              </div>
            </div>
          </div>

          {/* Contact strip */}
          <div className="px-6 py-3 bg-slate-50 border-b border-slate-100 flex flex-wrap gap-x-4 gap-y-1.5">
            {[
              {
                icon: 'ri-mail-line',
                value: data.email,
                placeholder: 'email@example.com',
                color: 'text-rose-500',
              },
              {
                icon: 'ri-phone-line',
                value: data.phone,
                placeholder: '+1 (555) 000-0000',
                color: 'text-teal-500',
              },
              {
                icon: 'ri-map-pin-2-line',
                value: data.location,
                placeholder: 'Location',
                color: 'text-amber-500',
              },
            ].map((item) => (
              <div key={item.icon} className="flex items-center gap-1.5">
                <div
                  className={`w-3.5 h-3.5 flex items-center justify-center ${
                    item.value ? item.color : 'text-slate-300'
                  }`}
                >
                  <i className={`${item.icon} text-[11px]`} />
                </div>
                <span
                  className={`text-[11px] transition-all duration-300 ${
                    item.value
                      ? 'text-slate-600 font-medium'
                      : 'text-slate-300'
                  }`}
                >
                  {item.value || item.placeholder}
                </span>
              </div>
            ))}
            {data.linkedin && (
              <div className="flex items-center gap-1.5">
                <div className="w-3.5 h-3.5 flex items-center justify-center text-[#0A66C2]">
                  <i className="ri-linkedin-fill text-[11px]" />
                </div>
                <span className="text-[11px] text-slate-600 font-medium truncate max-w-[120px]">
                  {data.linkedin}
                </span>
              </div>
            )}
          </div>

          {/* Body */}
          <div className="px-6 py-5 space-y-5">
            {/* Career Objective */}
            <ResumeSection
              icon="ri-focus-3-line"
              title="Career Objective"
              active={!!hasCareer}
              highlight={currentStep === 2}
            >
              {hasCareer ? (
                <div className="space-y-2.5">
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    {data.experienceLevel
                      ? `${experienceMap[data.experienceLevel] || ''} professional`
                      : 'Experienced professional'}{' '}
                    seeking a{' '}
                    <strong className="text-slate-800">
                      {data.targetRole || 'role'}
                    </strong>
                    {data.workMode
                      ? ` in a ${workModeMap[data.workMode]?.toLowerCase()} setting`
                      : ''}.
                    {data.preferredLocations.length > 0 && (
                      <>
                        {' '}
                        Open to opportunities in{' '}
                        <strong className="text-slate-800">
                          {data.preferredLocations.join(', ')}
                        </strong>
                        .
                      </>
                    )}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {data.experienceLevel && (
                      <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-600 text-[10px] font-semibold px-2 py-1 rounded-md">
                        <i className="ri-bar-chart-line text-[10px]" />
                        {experienceMap[data.experienceLevel]}
                      </span>
                    )}
                    {data.workMode && (
                      <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-600 text-[10px] font-semibold px-2 py-1 rounded-md">
                        <i className="ri-home-wifi-line text-[10px]" />
                        {workModeMap[data.workMode]}
                      </span>
                    )}
                    {data.preferredLocations.map((loc) => (
                      <span
                        key={loc}
                        className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 text-[10px] font-semibold px-2 py-1 rounded-md"
                      >
                        <i className="ri-map-pin-line text-[10px]" />
                        {loc}
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                <PlaceholderLines count={2} />
              )}
            </ResumeSection>

            {/* Skills */}
            <ResumeSection
              icon="ri-tools-line"
              title="Skills"
              active={hasSkills}
              highlight={currentStep === 3}
            >
              {hasSkills ? (
                <div className="space-y-2">
                  {skillBars.map((skill) => (
                    <div key={skill.name} className="flex items-center gap-3">
                      <span className="text-[11px] font-semibold text-slate-700 w-24 truncate flex-shrink-0">
                        {skill.name}
                      </span>
                      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-slate-700 to-slate-900 rounded-full transition-all duration-700 ease-out"
                          style={{
                            width: `${Math.max(skill.pct, 10)}%`,
                          }}
                        />
                      </div>
                      <span className="text-[10px] text-slate-400 font-medium w-10 text-right flex-shrink-0">
                        {skill.years <= 1 ? '< 1 yr' : `${skill.years} yrs`}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <PlaceholderLines count={3} />
              )}
            </ResumeSection>

            {/* Experience placeholder */}
            <ResumeSection
              icon="ri-briefcase-4-line"
              title="Experience"
              active={false}
              highlight={false}
            >
              <PlaceholderBlock />
            </ResumeSection>

            {/* Education placeholder */}
            <ResumeSection
              icon="ri-graduation-cap-line"
              title="Education"
              active={false}
              highlight={false}
            >
              <PlaceholderBlock />
            </ResumeSection>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Sub‑components ── */

function ResumeSection({
  icon,
  title,
  active,
  highlight,
  children,
}: {
  icon: string;
  title: string;
  active: boolean;
  highlight: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`transition-all duration-500 rounded-lg ${
        highlight
          ? 'bg-amber-50/60 -mx-2 px-2 py-2 ring-1 ring-amber-200/60'
          : ''
      }`}
    >
      <div className="flex items-center gap-2 mb-2">
        <div
          className={`w-4 h-4 flex items-center justify-center transition-colors duration-300 ${
            active ? 'text-slate-800' : 'text-slate-300'
          }`}
        >
          <i className={`${icon} text-xs`} />
        </div>
        <h4
          className={`text-[11px] font-bold uppercase tracking-wider transition-colors duration-300 ${
            active ? 'text-slate-800' : 'text-slate-300'
          }`}
        >
          {title}
        </h4>
        {highlight && (
          <span className="ml-auto text-[9px] font-bold text-amber-500 bg-amber-100 px-1.5 py-0.5 rounded">
            EDITING
          </span>
        )}
      </div>
      <div className="pl-6">{children}</div>
    </div>
  );
}

function PlaceholderLines({ count }: { count: number }) {
  const widths = ['w-full', 'w-4/5', 'w-3/5', 'w-2/3'];
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`h-2 bg-slate-100 rounded-full ${widths[i % widths.length]}`}
        />
      ))}
    </div>
  );
}

function PlaceholderBlock() {
  return (
    <div className="space-y-3">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-slate-100 flex-shrink-0" />
        <div className="flex-1 space-y-1.5">
          <div className="h-2 bg-slate-100 rounded-full w-3/4" />
          <div className="h-2 bg-slate-100 rounded-full w-1/2" />
        </div>
      </div>
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-slate-100 flex-shrink-0" />
        <div className="flex-1 space-y-1.5">
          <div className="h-2 bg-slate-100 rounded-full w-2/3" />
          <div className="h-2 bg-slate-100 rounded-full w-2/5" />
        </div>
      </div>
    </div>
  );
}

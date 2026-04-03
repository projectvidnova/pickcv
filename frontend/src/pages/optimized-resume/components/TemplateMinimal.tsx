
import { ResumeData } from '../types';

interface Props {
  data: ResumeData;
}

export default function TemplateMinimal({ data }: Props) {
  return (
    <div className="w-full bg-white font-sans text-gray-900 p-8 leading-[1.35]">
      {/* Header - ultra clean */}
      <div className="mb-6">
        <h2 className="text-3xl font-light tracking-tight text-gray-900 mb-1">{data.name}</h2>
        <p className="text-sm text-gray-400 font-light mb-3">{data.title}</p>
        <div className="flex flex-wrap gap-4 text-[11px] text-gray-400">
          <span>{data.email}</span>
          <span>{data.phone}</span>
          <span>{data.linkedin}</span>
          <span>{data.location}</span>
        </div>
        <div className="mt-4 h-px bg-gray-100"></div>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-3 gap-6">
        {/* Main column */}
        <div className="col-span-2 space-y-5">
          {/* Summary */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-300 mb-3">About</h3>
            <p className="text-xs text-gray-600 leading-relaxed font-light">{data.summary}</p>
          </div>

          {/* Experience */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-300 mb-4">Experience</h3>
            <div className="space-y-4">
              {data.experience.map((exp, i) => (
                <div key={i}>
                  <div className="flex items-baseline justify-between mb-0.5">
                    <h4 className="text-sm font-semibold text-gray-900">{exp.role}</h4>
                    <span className="text-xs text-gray-300">{exp.period}</span>
                  </div>
                  <p className="text-xs text-gray-400 mb-2">{exp.company} · {exp.location}</p>
                  <ul className="space-y-1">
                    {exp.bullets.map((b, j) => (
                      <li key={j} className="text-xs text-gray-500 leading-relaxed pl-3 border-l border-gray-100">
                        {b}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Side column */}
        <div className="space-y-5">
          {/* Skills */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-300 mb-3">Skills</h3>
            <div className="space-y-2">
              {data.skills.map((skill, i) => (
                <div key={i} className="text-xs text-gray-600 py-1.5 border-b border-gray-50 font-light">
                  {skill}
                </div>
              ))}
            </div>
          </div>

          {/* Education */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-300 mb-3">Education</h3>
            {data.education.map((edu, i) => (
              <div key={i}>
                <p className="text-xs font-semibold text-gray-700 leading-snug">{edu.degree}</p>
                <p className="text-xs text-gray-400 mt-0.5">{edu.school}</p>
                <p className="text-xs text-gray-300 mt-0.5">{edu.period}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

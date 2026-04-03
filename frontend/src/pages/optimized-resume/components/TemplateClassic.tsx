
import { ResumeData } from '../types';

interface Props {
  data: ResumeData;
}

export default function TemplateClassic({ data }: Props) {
  return (
    <div className="w-full bg-white font-serif text-gray-900 p-8 leading-[1.35]">
      {/* Header - centered, traditional */}
      <div className="text-center border-b-2 border-gray-800 pb-4 mb-5">
        <h2 className="text-2xl font-bold tracking-wide uppercase mb-1">{data.name}</h2>
        <p className="text-sm text-gray-600 mb-2 tracking-widest uppercase">{data.title}</p>
        <div className="flex items-center justify-center flex-wrap gap-3 text-xs text-gray-600">
          <span>{data.email}</span>
          <span className="text-gray-300">|</span>
          <span>{data.phone}</span>
          <span className="text-gray-300">|</span>
          <span>{data.linkedin}</span>
          <span className="text-gray-300">|</span>
          <span>{data.location}</span>
        </div>
      </div>

      {/* Summary */}
      <div className="mb-4">
        <h3 className="text-sm font-bold uppercase tracking-widest text-gray-800 border-b border-gray-300 pb-1 mb-3">
          Professional Summary
        </h3>
        <p className="text-xs text-gray-700 leading-relaxed">{data.summary}</p>
      </div>

      {/* Experience */}
      <div className="mb-4">
        <h3 className="text-sm font-bold uppercase tracking-widest text-gray-800 border-b border-gray-300 pb-1 mb-4">
          Professional Experience
        </h3>
        {data.experience.map((exp, i) => (
          <div key={i} className="mb-4">
            <div className="flex items-start justify-between mb-1">
              <div>
                <h4 className="text-sm font-bold text-gray-900">{exp.role}</h4>
                <p className="text-xs italic text-gray-600">{exp.company} — {exp.location}</p>
              </div>
              <span className="text-xs text-gray-500 whitespace-nowrap font-medium">{exp.period}</span>
            </div>
            <ul className="mt-1.5 space-y-1">
              {exp.bullets.map((b, j) => (
                <li key={j} className="text-xs text-gray-700 flex items-start gap-2">
                  <span className="mt-1.5 w-1 h-1 rounded-full bg-gray-500 flex-shrink-0"></span>
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Skills */}
      <div className="mb-4">
        <h3 className="text-sm font-bold uppercase tracking-widest text-gray-800 border-b border-gray-300 pb-1 mb-3">
          Core Competencies
        </h3>
        <div className="grid grid-cols-3 gap-1">
          {data.skills.map((skill, i) => (
            <div key={i} className="text-xs text-gray-700 flex items-center gap-2">
              <span className="w-1 h-1 rounded-full bg-gray-500 flex-shrink-0"></span>
              {skill}
            </div>
          ))}
        </div>
      </div>

      {/* Education */}
      <div>
        <h3 className="text-sm font-bold uppercase tracking-widest text-gray-800 border-b border-gray-300 pb-1 mb-3">
          Education
        </h3>
        {data.education.map((edu, i) => (
          <div key={i} className="flex items-start justify-between">
            <div>
              <h4 className="text-xs font-bold text-gray-900">{edu.degree}</h4>
              <p className="text-xs italic text-gray-600">{edu.school}</p>
            </div>
            <span className="text-xs text-gray-500 whitespace-nowrap">{edu.period}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

import { ResumeData } from '../types';

interface Props {
  data: ResumeData;
}

export default function TemplateAtsPro({ data }: Props) {
  return (
    <div className="w-full bg-white font-sans text-gray-900 p-7 leading-[1.35]">
      {/* Header */}
      <header className="border-b border-gray-300 pb-3 mb-4">
        <h2 className="text-2xl font-bold tracking-tight text-gray-900">{data.name}</h2>
        <p className="text-sm font-semibold text-gray-600 mt-0.5">{data.title}</p>
        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-gray-600">
          <span>{data.email}</span>
          <span>•</span>
          <span>{data.phone}</span>
          <span>•</span>
          <span>{data.linkedin}</span>
          <span>•</span>
          <span>{data.location}</span>
        </div>
      </header>

      {/* Summary */}
      <section className="mb-3.5">
        <h3 className="text-[11px] font-bold uppercase tracking-[0.16em] text-gray-800 border-b border-gray-200 pb-1 mb-2">
          Professional Summary
        </h3>
        <p className="text-[11px] text-gray-700 leading-relaxed">{data.summary}</p>
      </section>

      {/* Skills */}
      <section className="mb-3.5">
        <h3 className="text-[11px] font-bold uppercase tracking-[0.16em] text-gray-800 border-b border-gray-200 pb-1 mb-2">
          Skills
        </h3>
        <p className="text-[11px] text-gray-700 leading-relaxed">{data.skills.join(' • ')}</p>
      </section>

      {/* Experience */}
      <section className="mb-3.5">
        <h3 className="text-[11px] font-bold uppercase tracking-[0.16em] text-gray-800 border-b border-gray-200 pb-1 mb-2">
          Experience
        </h3>
        <div className="space-y-3">
          {data.experience.map((exp, i) => (
            <div key={i}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h4 className="text-xs font-bold text-gray-900">{exp.role}</h4>
                  <p className="text-[11px] text-gray-600">{exp.company} · {exp.location}</p>
                </div>
                <span className="text-[10px] text-gray-500 whitespace-nowrap">{exp.period}</span>
              </div>
              <ul className="mt-1.5 space-y-1">
                {exp.bullets.map((bullet, idx) => (
                  <li key={idx} className="text-[11px] text-gray-700 flex items-start gap-1.5">
                    <span className="mt-1.5 w-1 h-1 rounded-full bg-gray-500 flex-shrink-0"></span>
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Education */}
      <section>
        <h3 className="text-[11px] font-bold uppercase tracking-[0.16em] text-gray-800 border-b border-gray-200 pb-1 mb-2">
          Education
        </h3>
        <div className="space-y-1.5">
          {data.education.map((edu, i) => (
            <div key={i} className="flex items-start justify-between gap-3">
              <div>
                <h4 className="text-xs font-semibold text-gray-900">{edu.degree}</h4>
                <p className="text-[11px] text-gray-600">{edu.school}</p>
              </div>
              <span className="text-[10px] text-gray-500 whitespace-nowrap">{edu.period}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

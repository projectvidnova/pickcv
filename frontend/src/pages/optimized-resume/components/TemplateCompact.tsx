
import { ResumeData } from '../types';

interface Props {
  data: ResumeData;
}

export default function TemplateCompact({ data }: Props) {
  return (
    <div className="bg-white font-sans text-gray-900 p-8 min-h-[1000px]">
      {/* Header - inline horizontal */}
      <div className="flex items-start justify-between border-b-4 border-teal-500 pb-5 mb-6">
        <div>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight">{data.name}</h2>
          <p className="text-sm font-semibold text-teal-600 mt-0.5">{data.title}</p>
        </div>
        <div className="text-right space-y-1">
          <p className="text-xs text-gray-500">{data.email}</p>
          <p className="text-xs text-gray-500">{data.phone}</p>
          <p className="text-xs text-gray-500">{data.linkedin}</p>
          <p className="text-xs text-gray-500">{data.location}</p>
        </div>
      </div>

      {/* Summary */}
      <div className="mb-5">
        <div className="flex items-center gap-2 mb-2">
          <span className="w-3 h-3 bg-teal-500 rounded-sm flex-shrink-0"></span>
          <h3 className="text-xs font-black uppercase tracking-widest text-gray-700">Summary</h3>
        </div>
        <p className="text-xs text-gray-600 leading-relaxed">{data.summary}</p>
      </div>

      {/* Skills inline */}
      <div className="mb-5">
        <div className="flex items-center gap-2 mb-2">
          <span className="w-3 h-3 bg-teal-500 rounded-sm flex-shrink-0"></span>
          <h3 className="text-xs font-black uppercase tracking-widest text-gray-700">Technical Skills</h3>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {data.skills.map((skill, i) => (
            <span key={i} className="px-2.5 py-1 bg-teal-50 text-teal-800 text-[10px] font-semibold rounded border border-teal-100">
              {skill}
            </span>
          ))}
        </div>
      </div>

      {/* Experience - compact table-like */}
      <div className="mb-5">
        <div className="flex items-center gap-2 mb-3">
          <span className="w-3 h-3 bg-teal-500 rounded-sm flex-shrink-0"></span>
          <h3 className="text-xs font-black uppercase tracking-widest text-gray-700">Work Experience</h3>
        </div>
        <div className="space-y-4">
          {data.experience.map((exp, i) => (
            <div key={i} className="grid grid-cols-4 gap-3 text-xs">
              <div className="col-span-1 pt-0.5">
                <p className="font-bold text-teal-600 leading-snug">{exp.company}</p>
                <p className="text-gray-400 mt-0.5">{exp.period}</p>
                <p className="text-gray-400">{exp.location}</p>
              </div>
              <div className="col-span-3">
                <p className="font-bold text-gray-900 mb-1.5">{exp.role}</p>
                <ul className="space-y-1">
                  {exp.bullets.map((b, j) => (
                    <li key={j} className="text-gray-600 flex items-start gap-1.5">
                      <span className="text-teal-400 font-bold flex-shrink-0">·</span>
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Education */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <span className="w-3 h-3 bg-teal-500 rounded-sm flex-shrink-0"></span>
          <h3 className="text-xs font-black uppercase tracking-widest text-gray-700">Education</h3>
        </div>
        {data.education.map((edu, i) => (
          <div key={i} className="grid grid-cols-4 gap-3 text-xs">
            <div className="col-span-1">
              <p className="text-gray-400">{edu.period}</p>
            </div>
            <div className="col-span-3">
              <p className="font-bold text-gray-900">{edu.degree}</p>
              <p className="text-teal-600 font-semibold">{edu.school}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

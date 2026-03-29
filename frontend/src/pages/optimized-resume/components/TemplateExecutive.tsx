
import { ResumeData } from '../types';

interface Props {
  data: ResumeData;
}

export default function TemplateExecutive({ data }: Props) {
  return (
    <div className="w-full bg-white font-sans text-gray-900 leading-[1.32]">
      {/* Bold header bar */}
      <div className="bg-gray-900 text-white px-8 py-6">
        <h2 className="text-3xl font-black tracking-tight mb-1">{data.name}</h2>
        <p className="text-teal-400 font-semibold text-sm tracking-wide mb-3">{data.title}</p>
        <div className="flex flex-wrap gap-5 text-xs text-gray-400">
          <span className="flex items-center gap-1.5"><i className="ri-mail-line"></i>{data.email}</span>
          <span className="flex items-center gap-1.5"><i className="ri-phone-line"></i>{data.phone}</span>
          <span className="flex items-center gap-1.5"><i className="ri-linkedin-box-line"></i>{data.linkedin}</span>
          <span className="flex items-center gap-1.5"><i className="ri-map-pin-line"></i>{data.location}</span>
        </div>
      </div>

      <div className="p-8">
        {/* Summary with accent */}
        <div className="mb-5 p-4 bg-teal-50 border-l-4 border-teal-500 rounded-r-lg">
          <p className="text-xs text-gray-700 leading-relaxed">{data.summary}</p>
        </div>

        {/* Skills as tags row */}
        <div className="mb-5">
          <h3 className="text-xs font-black uppercase tracking-widest text-gray-900 mb-3">Core Competencies</h3>
          <div className="flex flex-wrap gap-1.5">
            {data.skills.map((skill, i) => (
              <span key={i} className="px-2.5 py-1 bg-gray-900 text-white text-[10px] font-semibold rounded">
                {skill}
              </span>
            ))}
          </div>
        </div>

        {/* Experience */}
        <div className="mb-5">
          <h3 className="text-xs font-black uppercase tracking-widest text-gray-900 mb-5">Professional Experience</h3>
          <div className="space-y-4">
            {data.experience.map((exp, i) => (
              <div key={i} className="grid grid-cols-4 gap-3">
                <div className="col-span-1 text-right pt-0.5">
                  <span className="text-xs font-semibold text-teal-600 bg-teal-50 px-2 py-1 rounded">{exp.period}</span>
                  <p className="text-xs text-gray-400 mt-2">{exp.location}</p>
                </div>
                <div className="col-span-3 border-l-2 border-gray-100 pl-5">
                  <h4 className="text-xs font-black text-gray-900">{exp.role}</h4>
                  <p className="text-xs font-bold text-teal-600 mb-2">{exp.company}</p>
                  <ul className="space-y-1">
                    {exp.bullets.map((b, j) => (
                      <li key={j} className="text-xs text-gray-600 flex items-start gap-2">
                        <span className="w-4 h-4 rounded bg-teal-500 text-white flex items-center justify-center flex-shrink-0 mt-0.5 text-[9px] font-bold">{j + 1}</span>
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
          <h3 className="text-xs font-black uppercase tracking-widest text-gray-900 mb-4">Education</h3>
          {data.education.map((edu, i) => (
            <div key={i} className="flex items-center justify-between bg-gray-50 rounded-lg px-5 py-3">
              <div>
                <h4 className="text-sm font-bold text-gray-900">{edu.degree}</h4>
                <p className="text-xs text-gray-500">{edu.school}</p>
              </div>
              <span className="text-xs font-semibold text-teal-600 bg-teal-50 px-3 py-1 rounded">{edu.period}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


import { ResumeData } from '../types';

interface Props {
  data: ResumeData;
}

export default function TemplateCreative({ data }: Props) {
  return (
    <div className="bg-white font-sans text-gray-900 min-h-[1000px]">
      {/* Split header */}
      <div className="grid grid-cols-5 min-h-[140px]">
        <div className="col-span-3 bg-gradient-to-br from-teal-600 to-emerald-700 p-8 flex flex-col justify-center">
          <h2 className="text-3xl font-black text-white tracking-tight mb-1">{data.name}</h2>
          <p className="text-teal-200 font-medium text-sm tracking-widest uppercase">{data.title}</p>
        </div>
        <div className="col-span-2 bg-gray-50 p-6 flex flex-col justify-center gap-2">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <div className="w-5 h-5 flex items-center justify-center rounded-full bg-teal-100 text-teal-600 flex-shrink-0">
              <i className="ri-mail-line text-[10px]"></i>
            </div>
            <span className="truncate">{data.email}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <div className="w-5 h-5 flex items-center justify-center rounded-full bg-teal-100 text-teal-600 flex-shrink-0">
              <i className="ri-phone-line text-[10px]"></i>
            </div>
            <span>{data.phone}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <div className="w-5 h-5 flex items-center justify-center rounded-full bg-teal-100 text-teal-600 flex-shrink-0">
              <i className="ri-linkedin-box-line text-[10px]"></i>
            </div>
            <span className="truncate">{data.linkedin}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <div className="w-5 h-5 flex items-center justify-center rounded-full bg-teal-100 text-teal-600 flex-shrink-0">
              <i className="ri-map-pin-line text-[10px]"></i>
            </div>
            <span>{data.location}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-5">
        {/* Main */}
        <div className="col-span-3 p-8 space-y-6">
          {/* Summary */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center flex-shrink-0">
                <i className="ri-user-line text-white text-sm"></i>
              </div>
              <h3 className="text-sm font-black uppercase tracking-widest text-gray-800">Profile</h3>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed">{data.summary}</p>
          </div>

          {/* Experience */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center flex-shrink-0">
                <i className="ri-briefcase-line text-white text-sm"></i>
              </div>
              <h3 className="text-sm font-black uppercase tracking-widest text-gray-800">Experience</h3>
            </div>
            <div className="space-y-5">
              {data.experience.map((exp, i) => (
                <div key={i} className="relative">
                  <div className="flex items-start justify-between mb-1">
                    <div>
                      <h4 className="text-sm font-bold text-gray-900">{exp.role}</h4>
                      <p className="text-xs text-teal-600 font-semibold">{exp.company}</p>
                    </div>
                    <span className="text-[10px] font-bold text-white bg-teal-600 px-2 py-0.5 rounded-full whitespace-nowrap">{exp.period}</span>
                  </div>
                  <ul className="mt-2 space-y-1">
                    {exp.bullets.map((b, j) => (
                      <li key={j} className="text-xs text-gray-600 flex items-start gap-2">
                        <span className="text-teal-500 font-bold mt-0.5 flex-shrink-0">—</span>
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="col-span-2 bg-gray-50 p-6 space-y-6">
          {/* Skills */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-emerald-600 flex items-center justify-center flex-shrink-0">
                <i className="ri-tools-line text-white text-xs"></i>
              </div>
              <h3 className="text-xs font-black uppercase tracking-widest text-gray-800">Skills</h3>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {data.skills.map((skill, i) => (
                <span key={i} className="px-2 py-1 bg-white border border-teal-200 text-teal-700 text-[10px] font-semibold rounded-md">
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {/* Education */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-emerald-600 flex items-center justify-center flex-shrink-0">
                <i className="ri-graduation-cap-line text-white text-xs"></i>
              </div>
              <h3 className="text-xs font-black uppercase tracking-widest text-gray-800">Education</h3>
            </div>
            {data.education.map((edu, i) => (
              <div key={i} className="bg-white rounded-lg p-3 border border-gray-100">
                <p className="text-xs font-bold text-gray-900 leading-snug">{edu.degree}</p>
                <p className="text-[10px] text-teal-600 font-semibold mt-0.5">{edu.school}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">{edu.period}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

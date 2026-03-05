
import { ResumeData } from '../types';

interface Props {
  data: ResumeData;
}

export default function TemplateModern({ data }: Props) {
  return (
    <div className="bg-white font-sans text-gray-900 flex min-h-[1000px]">
      {/* Left Sidebar */}
      <div className="w-64 flex-shrink-0 bg-gradient-to-b from-teal-700 to-teal-900 text-white p-7 flex flex-col gap-6">
        {/* Avatar / Initials */}
        <div className="text-center">
          <div className="w-20 h-20 rounded-full bg-white/20 border-2 border-white/40 flex items-center justify-center mx-auto mb-3">
            <span className="text-2xl font-bold text-white">
              {data.name.split(' ').map(n => n[0]).join('')}
            </span>
          </div>
          <h2 className="text-lg font-bold leading-tight">{data.name}</h2>
          <p className="text-teal-200 text-xs mt-1 font-medium tracking-wide">{data.title}</p>
        </div>

        {/* Contact */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-widest text-teal-300 mb-3">Contact</h3>
          <div className="space-y-2">
            <div className="flex items-start gap-2 text-xs text-teal-100">
              <i className="ri-mail-line mt-0.5 flex-shrink-0"></i>
              <span className="break-all">{data.email}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-teal-100">
              <i className="ri-phone-line flex-shrink-0"></i>
              <span>{data.phone}</span>
            </div>
            <div className="flex items-start gap-2 text-xs text-teal-100">
              <i className="ri-linkedin-box-line mt-0.5 flex-shrink-0"></i>
              <span className="break-all">{data.linkedin}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-teal-100">
              <i className="ri-map-pin-line flex-shrink-0"></i>
              <span>{data.location}</span>
            </div>
          </div>
        </div>

        {/* Skills */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-widest text-teal-300 mb-3">Skills</h3>
          <div className="space-y-2">
            {data.skills.map((skill, i) => (
              <div key={i}>
                <div className="flex justify-between text-xs text-teal-100 mb-1">
                  <span>{skill}</span>
                </div>
                <div className="h-1 bg-white/20 rounded-full">
                  <div
                    className="h-1 bg-teal-300 rounded-full"
                    style={{ width: `${75 + (i % 3) * 8}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Education */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-widest text-teal-300 mb-3">Education</h3>
          {data.education.map((edu, i) => (
            <div key={i}>
              <p className="text-xs font-semibold text-white leading-snug">{edu.degree}</p>
              <p className="text-xs text-teal-200 mt-0.5">{edu.school}</p>
              <p className="text-xs text-teal-300 mt-0.5">{edu.period}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right Main Content */}
      <div className="flex-1 p-8">
        {/* Summary */}
        <div className="mb-7">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-6 h-0.5 bg-teal-600"></div>
            <h3 className="text-sm font-bold uppercase tracking-widest text-teal-700">Profile</h3>
          </div>
          <p className="text-sm text-gray-600 leading-relaxed">{data.summary}</p>
        </div>

        {/* Experience */}
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-6 h-0.5 bg-teal-600"></div>
            <h3 className="text-sm font-bold uppercase tracking-widest text-teal-700">Experience</h3>
          </div>
          <div className="space-y-6">
            {data.experience.map((exp, i) => (
              <div key={i} className="relative pl-4 border-l-2 border-teal-100">
                <div className="absolute -left-1.5 top-1 w-3 h-3 rounded-full bg-teal-500 border-2 border-white"></div>
                <div className="flex items-start justify-between mb-1">
                  <div>
                    <h4 className="text-sm font-bold text-gray-900">{exp.role}</h4>
                    <p className="text-xs font-semibold text-teal-600">{exp.company}</p>
                  </div>
                  <span className="text-xs text-gray-400 whitespace-nowrap bg-gray-50 px-2 py-0.5 rounded-full">{exp.period}</span>
                </div>
                <ul className="mt-2 space-y-1.5">
                  {exp.bullets.map((b, j) => (
                    <li key={j} className="text-xs text-gray-600 flex items-start gap-2">
                      <span className="text-teal-400 mt-1 flex-shrink-0">›</span>
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

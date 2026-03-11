import { ResumeData } from '../types';

interface TemplateCorporateProps {
  data: ResumeData;
}

export default function TemplateCorporate({ data }: TemplateCorporateProps) {
  return (
    <div className="bg-white p-12 min-h-[1056px] max-w-[816px] mx-auto" style={{ fontFamily: 'Arial, sans-serif' }}>
      {/* Header - Gray box */}
      <div className="bg-gray-100 p-6 mb-6 -mx-12 px-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-1">{data.name}</h1>
        <p className="text-lg text-gray-700 font-semibold mb-3">{data.title}</p>
        <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
          <div>Email: {data.email}</div>
          <div>Phone: {data.phone}</div>
          <div>LinkedIn: {data.linkedin}</div>
          <div>Location: {data.location}</div>
        </div>
      </div>

      {/* Professional Summary */}
      {data.summary && (
        <div className="mb-6">
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-2 bg-gray-200 px-2 py-1">
            Professional Summary
          </h2>
          <p className="text-sm text-gray-700 leading-relaxed">{data.summary}</p>
        </div>
      )}

      {/* Work Experience */}
      {data.experience.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-2 bg-gray-200 px-2 py-1">
            Work Experience
          </h2>
          <div className="space-y-4">
            {data.experience.map((exp, idx) => (
              <div key={idx}>
                <div className="flex justify-between items-baseline mb-1">
                  <h3 className="text-base font-bold text-gray-900">{exp.role}</h3>
                  <span className="text-sm text-gray-500">{exp.period}</span>
                </div>
                <p className="text-sm text-gray-600 font-semibold mb-2">{exp.company} | {exp.location}</p>
                <ul className="space-y-1">
                  {exp.bullets.map((bullet, bidx) => (
                    <li key={bidx} className="text-sm text-gray-700 leading-relaxed pl-4 relative">
                      <span className="absolute left-0">▪</span>
                      {bullet}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Skills */}
      {data.skills.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-2 bg-gray-200 px-2 py-1">
            Skills & Competencies
          </h2>
          <div className="text-sm text-gray-700 leading-relaxed">
            {data.skills.join(' | ')}
          </div>
        </div>
      )}

      {/* Education */}
      {data.education.length > 0 && (
        <div>
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-2 bg-gray-200 px-2 py-1">
            Education
          </h2>
          <div className="space-y-2">
            {data.education.map((edu, idx) => (
              <div key={idx} className="flex justify-between items-baseline">
                <div>
                  <h3 className="text-base font-bold text-gray-900">{edu.degree}</h3>
                  <p className="text-sm text-gray-600">{edu.school}</p>
                </div>
                <span className="text-sm text-gray-500">{edu.period}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

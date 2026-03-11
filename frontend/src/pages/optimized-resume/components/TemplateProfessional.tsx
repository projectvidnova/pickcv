import { ResumeData } from '../types';

interface TemplateProfessionalProps {
  data: ResumeData;
}

export default function TemplateProfessional({ data }: TemplateProfessionalProps) {
  return (
    <div className="bg-white p-12 min-h-[1056px] max-w-[816px] mx-auto" style={{ fontFamily: 'Georgia, serif' }}>
      {/* Header with line */}
      <div className="border-b-4 border-gray-800 pb-4 mb-6">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">{data.name}</h1>
        <p className="text-xl text-gray-600 italic mb-3">{data.title}</p>
        <div className="flex flex-wrap gap-4 text-sm text-gray-600">
          <span>{data.email}</span>
          <span>•</span>
          <span>{data.phone}</span>
          <span>•</span>
          <span>{data.linkedin}</span>
          <span>•</span>
          <span>{data.location}</span>
        </div>
      </div>

      {/* Professional Summary */}
      {data.summary && (
        <div className="mb-6">
          <h2 className="text-lg font-bold text-gray-900 uppercase tracking-wide mb-3 border-b border-gray-300 pb-1">
            Professional Summary
          </h2>
          <p className="text-sm text-gray-700 leading-relaxed">{data.summary}</p>
        </div>
      )}

      {/* Professional Experience */}
      {data.experience.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-bold text-gray-900 uppercase tracking-wide mb-3 border-b border-gray-300 pb-1">
            Professional Experience
          </h2>
          <div className="space-y-4">
            {data.experience.map((exp, idx) => (
              <div key={idx}>
                <div className="flex justify-between items-start mb-1">
                  <div>
                    <h3 className="text-base font-bold text-gray-900">{exp.role}</h3>
                    <p className="text-sm text-gray-600 italic">{exp.company} | {exp.location}</p>
                  </div>
                  <span className="text-sm text-gray-500 font-semibold">{exp.period}</span>
                </div>
                <ul className="mt-2 space-y-1">
                  {exp.bullets.map((bullet, bidx) => (
                    <li key={bidx} className="text-sm text-gray-700 leading-relaxed flex">
                      <span className="mr-2">•</span>
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Core Competencies */}
      {data.skills.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-bold text-gray-900 uppercase tracking-wide mb-3 border-b border-gray-300 pb-1">
            Core Competencies
          </h2>
          <div className="flex flex-wrap gap-2">
            {data.skills.map((skill, idx) => (
              <span key={idx} className="text-sm text-gray-700">
                {skill}{idx < data.skills.length - 1 ? ' •' : ''}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Education */}
      {data.education.length > 0 && (
        <div>
          <h2 className="text-lg font-bold text-gray-900 uppercase tracking-wide mb-3 border-b border-gray-300 pb-1">
            Education
          </h2>
          <div className="space-y-2">
            {data.education.map((edu, idx) => (
              <div key={idx} className="flex justify-between items-start">
                <div>
                  <h3 className="text-base font-bold text-gray-900">{edu.degree}</h3>
                  <p className="text-sm text-gray-600 italic">{edu.school}</p>
                </div>
                <span className="text-sm text-gray-500 font-semibold">{edu.period}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

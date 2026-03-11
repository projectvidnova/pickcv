import { ResumeData } from '../types';

interface TemplateTechProps {
  data: ResumeData;
}

export default function TemplateTech({ data }: TemplateTechProps) {
  return (
    <div className="bg-white p-12 min-h-[1056px] max-w-[816px] mx-auto" style={{ fontFamily: 'Consolas, monospace' }}>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-1">
          {'>'} {data.name}
        </h1>
        <p className="text-lg text-teal-600 mb-3">{data.title}</p>
        <div className="text-sm text-gray-600 space-y-1">
          <div>📧 {data.email}</div>
          <div>📱 {data.phone}</div>
          <div>🔗 {data.linkedin}</div>
          <div>📍 {data.location}</div>
        </div>
      </div>

      <div className="border-t-2 border-gray-300 my-4"></div>

      {/* About */}
      {data.summary && (
        <div className="mb-6">
          <h2 className="text-base font-bold text-gray-900 mb-2">
            {'// ABOUT'}
          </h2>
          <p className="text-sm text-gray-700 leading-relaxed pl-4">{data.summary}</p>
        </div>
      )}

      {/* Experience */}
      {data.experience.length > 0 && (
        <div className="mb-6">
          <h2 className="text-base font-bold text-gray-900 mb-3">
            {'// EXPERIENCE'}
          </h2>
          <div className="space-y-4 pl-4">
            {data.experience.map((exp, idx) => (
              <div key={idx}>
                <div className="flex justify-between items-baseline mb-1">
                  <h3 className="text-sm font-bold text-teal-600">{exp.role}</h3>
                  <span className="text-xs text-gray-500 font-mono">{exp.period}</span>
                </div>
                <p className="text-sm text-gray-600 mb-2">@ {exp.company} - {exp.location}</p>
                <ul className="space-y-1">
                  {exp.bullets.map((bullet, bidx) => (
                    <li key={bidx} className="text-sm text-gray-700 leading-relaxed pl-4 relative">
                      <span className="absolute left-0 text-teal-600">→</span>
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
          <h2 className="text-base font-bold text-gray-900 mb-2">
            {'// SKILLS'}
          </h2>
          <div className="pl-4 flex flex-wrap gap-2">
            {data.skills.map((skill, idx) => (
              <span key={idx} className="text-sm bg-gray-100 px-2 py-1 rounded text-gray-700 border border-gray-300">
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Education */}
      {data.education.length > 0 && (
        <div>
          <h2 className="text-base font-bold text-gray-900 mb-2">
            {'// EDUCATION'}
          </h2>
          <div className="space-y-2 pl-4">
            {data.education.map((edu, idx) => (
              <div key={idx} className="flex justify-between items-baseline">
                <div>
                  <h3 className="text-sm font-bold text-gray-900">{edu.degree}</h3>
                  <p className="text-sm text-gray-600">{edu.school}</p>
                </div>
                <span className="text-xs text-gray-500 font-mono">{edu.period}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

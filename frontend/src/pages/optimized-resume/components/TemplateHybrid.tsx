import { ResumeData } from '../types';

interface Props {
  data: ResumeData;
}

export default function TemplateHybrid({ data }: Props) {
  return (
    <div className="w-full bg-white font-sans text-gray-900 grid grid-cols-12 leading-[1.33]">
      {/* Main */}
      <div className="col-span-8 p-6 border-r border-gray-100">
        <header className="mb-4 pb-3 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">{data.name}</h2>
          <p className="text-sm font-semibold text-teal-700 mt-0.5">{data.title}</p>
          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-gray-600">
            <span>{data.email}</span>
            <span>•</span>
            <span>{data.phone}</span>
            <span>•</span>
            <span>{data.location}</span>
          </div>
        </header>

        <section className="mb-4">
          <h3 className="text-[11px] font-bold uppercase tracking-[0.16em] text-teal-700 mb-2">Summary</h3>
          <p className="text-[11px] text-gray-700 leading-relaxed">{data.summary}</p>
        </section>

        <section>
          <h3 className="text-[11px] font-bold uppercase tracking-[0.16em] text-teal-700 mb-2">Experience</h3>
          <div className="space-y-3.5">
            {data.experience.map((exp, i) => (
              <div key={i}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="text-xs font-bold text-gray-900">{exp.role}</h4>
                    <p className="text-[11px] text-gray-600">{exp.company} · {exp.location}</p>
                  </div>
                  <span className="text-[10px] text-gray-500 whitespace-nowrap">{exp.period}</span>
                </div>
                <ul className="mt-1.5 space-y-1">
                  {exp.bullets.map((bullet, j) => (
                    <li key={j} className="text-[11px] text-gray-700 flex items-start gap-1.5">
                      <span className="text-teal-600 mt-0.5">▸</span>
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Sidebar */}
      <aside className="col-span-4 p-5 bg-gray-50">
        <section className="mb-4">
          <h3 className="text-[11px] font-bold uppercase tracking-[0.16em] text-teal-700 mb-2">Skills</h3>
          <div className="flex flex-wrap gap-1.5">
            {data.skills.map((skill, i) => (
              <span key={i} className="px-2 py-1 rounded border border-teal-100 bg-white text-[10px] font-semibold text-teal-700">
                {skill}
              </span>
            ))}
          </div>
        </section>

        <section>
          <h3 className="text-[11px] font-bold uppercase tracking-[0.16em] text-teal-700 mb-2">Education</h3>
          <div className="space-y-2">
            {data.education.map((edu, i) => (
              <div key={i} className="bg-white border border-gray-100 rounded-md p-2.5">
                <h4 className="text-[11px] font-bold text-gray-900 leading-snug">{edu.degree}</h4>
                <p className="text-[10px] text-gray-600 mt-0.5">{edu.school}</p>
                <p className="text-[10px] text-gray-500 mt-0.5">{edu.period}</p>
              </div>
            ))}
          </div>
        </section>
      </aside>
    </div>
  );
}

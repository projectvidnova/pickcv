import { useState } from 'react';

const capabilities = [
  {
    icon: 'ri-user-star-line',
    title: 'Student Resume Management',
    description: 'Every student gets an AI-powered resume builder that creates ATS-optimized resumes. Bulk upload via CSV, track completion rates, and ensure every student is placement-ready.',
    color: 'from-teal-500 to-teal-600',
    bgColor: 'bg-teal-50',
    iconColor: 'text-teal-600',
    visual: (
      <div className="mt-6 glass rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Resume Status</span>
          <span className="px-2.5 py-1 bg-teal-100 text-teal-700 rounded-full text-[10px] font-bold">1,247 students</span>
        </div>
        <div className="space-y-2">
          {[
            { label: 'Resume completed', pct: 78, color: 'from-teal-500 to-emerald-500' },
            { label: 'AI-optimized', pct: 64, color: 'from-emerald-500 to-green-500' },
            { label: 'Pending review', pct: 22, color: 'from-amber-400 to-orange-400' },
          ].map((row) => (
            <div key={row.label} className="rounded-xl px-3 py-2.5 bg-white/50">
              <div className="flex justify-between mb-1.5">
                <span className="text-[11px] font-medium text-gray-700">{row.label}</span>
                <span className="text-[11px] font-bold text-gray-600">{row.pct}%</span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className={`h-full rounded-full bg-gradient-to-r ${row.color}`} style={{ width: `${row.pct}%` }}></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    icon: 'ri-building-2-line',
    title: 'Recruiter Access Control',
    description: 'Verified recruiters browse student profiles filtered by branch, skills, CGPA, and placement status. Control which data recruiters can see. Track every recruiter interaction.',
    color: 'from-emerald-500 to-emerald-600',
    bgColor: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
    visual: (
      <div className="mt-6 glass rounded-2xl p-4">
        <div className="space-y-2">
          {[
            { name: 'Infosys', role: 'IT Services', access: 'Full', active: true },
            { name: 'TCS', role: 'IT Consulting', access: 'Limited', active: true },
            { name: 'Wipro', role: 'Technology', access: 'Pending', active: false },
          ].map((r) => (
            <div key={r.name} className="flex items-center gap-3 rounded-xl px-3 py-2.5 bg-white/50">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white text-xs font-bold shrink-0">{r.name[0]}</div>
              <div className="flex-1">
                <div className="text-xs font-semibold text-gray-800">{r.name}</div>
                <div className="text-[10px] text-gray-500">{r.role} · {r.access} access</div>
              </div>
              <div className={`w-2 h-2 rounded-full ${r.active ? 'bg-green-500' : 'bg-amber-400'}`}></div>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    icon: 'ri-line-chart-line',
    title: 'Placement Analytics',
    description: 'Real-time dashboards showing placement rate, average package, branch-wise breakdowns, recruiter participation, and year-over-year trends. Export reports for management.',
    color: 'from-cyan-500 to-teal-500',
    bgColor: 'bg-cyan-50',
    iconColor: 'text-cyan-600',
    visual: (
      <div className="mt-6 glass rounded-2xl p-4">
        <div className="grid grid-cols-2 gap-2 mb-3">
          {[
            { label: 'Placement Rate', val: '71.5%', color: 'text-teal-600' },
            { label: 'Avg Package', val: '₹8.4L', color: 'text-emerald-600' },
          ].map((m) => (
            <div key={m.label} className="rounded-xl bg-white/60 p-2.5 text-center">
              <div className={`text-lg font-extrabold ${m.color} leading-none`}>{m.val}</div>
              <div className="text-[9px] text-gray-500 mt-0.5">{m.label}</div>
            </div>
          ))}
        </div>
        <div className="flex items-end gap-1 h-12">
          {[40, 55, 50, 70, 65, 85, 80, 90, 75, 95, 88, 100].map((v, i) => (
            <div key={i} className="flex-1 rounded-sm bg-gradient-to-t from-teal-500 to-emerald-400" style={{ height: `${v}%`, opacity: 0.5 + v / 200 }}></div>
          ))}
        </div>
        <div className="text-[9px] text-gray-500 text-center mt-2">Monthly placement trend</div>
      </div>
    ),
  },
  {
    icon: 'ri-calendar-event-line',
    title: 'Campus Drive Management',
    description: 'Schedule campus drives, manage recruiter slots, send bulk student notifications, and track attendance. Complete drive lifecycle from announcement to final placement.',
    color: 'from-green-500 to-emerald-600',
    bgColor: 'bg-green-50',
    iconColor: 'text-green-600',
    visual: (
      <div className="mt-6 glass rounded-2xl p-4">
        <div className="space-y-2">
          {[
            { event: 'Infosys Pool Drive', date: 'Jan 15', students: 320, status: 'completed' },
            { event: 'TCS CodeVita Hire', date: 'Feb 8', students: 180, status: 'scheduled' },
            { event: 'Amazon SDE Hiring', date: 'Mar 2', students: 95, status: 'upcoming' },
          ].map((e) => (
            <div key={e.event} className="flex items-center gap-3 rounded-xl px-3 py-2.5 bg-white/50">
              <div className={`w-2 h-2 rounded-full shrink-0 ${e.status === 'completed' ? 'bg-green-500' : e.status === 'scheduled' ? 'bg-teal-500' : 'bg-amber-400'}`}></div>
              <div className="flex-1">
                <div className="text-[11px] font-bold text-gray-800">{e.event}</div>
                <div className="text-[10px] text-gray-500">{e.date} · {e.students} students</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
  },
];

export default function PlatformSection() {
  const [hovered, setHovered] = useState<number | null>(null);

  return (
    <section className="py-20 lg:py-28 relative overflow-hidden mesh-bg-subtle">
      <div className="orb orb-teal absolute top-40 -left-20 w-96 h-96 pointer-events-none" />
      <div className="orb orb-emerald absolute bottom-20 -right-32 w-[500px] h-[500px] pointer-events-none" />

      <div className="relative w-full px-4 sm:px-6 lg:px-8 xl:px-12 z-10">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 glass-badge text-teal-700 px-5 py-2.5 rounded-full text-sm font-semibold mb-6">
            <i className="ri-apps-line"></i>
            Platform Capabilities
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-5 tracking-tight">
            Everything your placement cell needs
          </h2>
          <p className="text-xl text-gray-600 leading-relaxed">
            A complete digital placement platform — from student onboarding to final offer letters.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-7 max-w-6xl mx-auto">
          {capabilities.map((cap, idx) => (
            <div
              key={idx}
              className="glass-card rounded-3xl p-8 cursor-default"
              onMouseEnter={() => setHovered(idx)}
              onMouseLeave={() => setHovered(null)}
              style={{ transform: hovered === idx ? 'translateY(-8px)' : 'translateY(0)', transition: 'transform 0.3s ease' }}
            >
              <div className={`w-16 h-16 ${cap.bgColor} rounded-2xl flex items-center justify-center mb-6`}>
                <i className={`${cap.icon} ${cap.iconColor} text-3xl`}></i>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">{cap.title}</h3>
              <p className="text-gray-600 text-sm leading-relaxed">{cap.description}</p>
              {cap.visual}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

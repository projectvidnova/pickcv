import { useState } from 'react';

const coreFeatures = [
  {
    icon: 'ri-briefcase-4-line',
    title: 'Smart Job Management',
    description: 'Create, publish, pause, and close job postings with configurable fields — job type, experience level, remote policy, salary range, and required skills. Auto-pause on schedule.',
    color: 'from-teal-500 to-teal-600',
    bgColor: 'bg-teal-50',
    iconColor: 'text-teal-600',
    visual: (
      <div className="mt-6 rounded-2xl p-4 glass">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Active Jobs</span>
          <span className="px-2.5 py-1 bg-teal-100 text-teal-700 rounded-full text-[10px] font-bold">8 Live</span>
        </div>
        <div className="space-y-2">
          {[
            { title: 'Senior Frontend Engineer', apps: 84, color: 'bg-emerald-500' },
            { title: 'Data Analyst · Remote', apps: 61, color: 'bg-emerald-500' },
            { title: 'Product Manager', apps: 47, color: 'bg-amber-400' },
          ].map((job) => (
            <div key={job.title} className="flex items-center gap-3 rounded-xl px-3 py-2.5 bg-white/50">
              <div className={`w-2 h-2 rounded-full ${job.color} shrink-0`}></div>
              <span className="text-xs font-medium text-gray-700 flex-1">{job.title}</span>
              <span className="text-xs font-bold text-gray-500">{job.apps} apps</span>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    icon: 'ri-kanban-view',
    title: 'Application Pipeline',
    description: 'Full kanban-style pipeline: Applied → In Review → Shortlisted → Interview → Offered → Hired/Rejected. View AI ATS scores, filter per job, manage every candidate.',
    color: 'from-emerald-500 to-emerald-600',
    bgColor: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
    visual: (
      <div className="mt-6 grid grid-cols-3 gap-2">
        {[
          { label: 'Shortlisted', count: 18, color: 'from-teal-400 to-teal-500' },
          { label: 'Interview', count: 7, color: 'from-emerald-400 to-emerald-500' },
          { label: 'Hired', count: 3, color: 'from-green-400 to-emerald-500' },
        ].map((col) => (
          <div key={col.label} className="rounded-xl p-3 glass text-center">
            <div className={`text-2xl font-extrabold bg-gradient-to-br ${col.color} bg-clip-text text-transparent leading-none mb-1`}>{col.count}</div>
            <div className="text-[10px] text-gray-500 font-medium">{col.label}</div>
          </div>
        ))}
      </div>
    ),
  },
  {
    icon: 'ri-calendar-schedule-line',
    title: 'Multi-Round Interviews',
    description: 'Plan multi-round interviews (phone, video, technical). Two modes: bulk or sequential. Assign interviewers per round, add Google Meet links, collect structured feedback.',
    color: 'from-cyan-500 to-teal-500',
    bgColor: 'bg-cyan-50',
    iconColor: 'text-cyan-600',
    visual: (
      <div className="mt-6 glass rounded-2xl p-4">
        <div className="space-y-2.5">
          {[
            { round: 'Round 1 · Screening', interviewer: 'Meera Joshi', status: 'completed', rating: 5 },
            { round: 'Round 2 · Technical', interviewer: 'Dev Sharma', status: 'scheduled', rating: null },
            { round: 'Round 3 · Culture Fit', interviewer: 'Riya Patel', status: 'pending', rating: null },
          ].map((r) => (
            <div key={r.round} className="flex items-center gap-3 rounded-xl px-3 py-2.5 bg-white/50">
              <div className={`w-2 h-2 rounded-full shrink-0 ${r.status === 'completed' ? 'bg-green-500' : r.status === 'scheduled' ? 'bg-teal-500' : 'bg-gray-300'}`}></div>
              <div className="flex-1">
                <div className="text-[11px] font-bold text-gray-800">{r.round}</div>
                <div className="text-[10px] text-gray-500">{r.interviewer}</div>
              </div>
              {r.rating && (
                <div className="flex gap-0.5">
                  {[...Array(r.rating)].map((_, i) => <i key={i} className="ri-star-fill text-amber-400 text-[10px]"></i>)}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    icon: 'ri-team-line',
    title: 'Team Management',
    description: "Invite team members as interviewers via email. One-click acceptance. Track each interviewer's activity and interview count. Activate or deactivate team members easily.",
    color: 'from-green-500 to-emerald-600',
    bgColor: 'bg-green-50',
    iconColor: 'text-green-600',
    visual: (
      <div className="mt-6 glass rounded-2xl p-4">
        <div className="space-y-2">
          {[
            { name: 'Ankit Mehta', role: 'Tech Lead', interviews: 14, active: true },
            { name: 'Sonal Gupta', role: 'HR Manager', interviews: 21, active: true },
            { name: 'Kiran Das', role: 'Designer', interviews: 6, active: false },
          ].map((m) => (
            <div key={m.name} className="flex items-center gap-3 rounded-xl px-3 py-2 bg-white/50">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center text-white text-xs font-bold shrink-0">{m.name[0]}</div>
              <div className="flex-1">
                <div className="text-xs font-semibold text-gray-800">{m.name}</div>
                <div className="text-[10px] text-gray-500">{m.role} · {m.interviews} interviews</div>
              </div>
              <div className={`w-2 h-2 rounded-full ${m.active ? 'bg-green-500' : 'bg-gray-300'}`}></div>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    icon: 'ri-file-text-line',
    title: 'Digital Offer Letters',
    description: 'Create reusable offer templates with {{placeholders}} for candidate name, salary, role, and start date. Release personalized offers in one click. Candidates accept or decline directly.',
    color: 'from-teal-500 to-cyan-500',
    bgColor: 'bg-teal-50',
    iconColor: 'text-teal-600',
    visual: (
      <div className="mt-6 glass rounded-2xl p-4">
        <div className="rounded-xl bg-white/70 p-3 border border-teal-100 mb-3">
          <div className="text-[10px] text-gray-500 mb-1">Template Preview</div>
          <div className="text-xs text-gray-700 leading-relaxed">
            Dear <span className="bg-teal-100 text-teal-700 px-1 rounded font-medium">{'{{candidate_name}}'}</span>,<br />
            We offer you <span className="bg-emerald-100 text-emerald-700 px-1 rounded font-medium">{'{{role}}'}</span> at ₹<span className="bg-green-100 text-green-700 px-1 rounded font-medium">{'{{salary}}'}</span> LPA.
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex-1 rounded-xl py-2 text-center text-[10px] font-bold bg-green-100 text-green-700">3 Accepted</div>
          <div className="flex-1 rounded-xl py-2 text-center text-[10px] font-bold bg-amber-100 text-amber-700">2 Pending</div>
        </div>
      </div>
    ),
  },
  {
    icon: 'ri-bar-chart-box-line',
    title: 'Dashboard & Analytics',
    description: 'At-a-glance metrics: open jobs, total applications, shortlisted, interviews scheduled, offers sent, and hires made. Quick-action shortcuts to post jobs and manage pipeline.',
    color: 'from-emerald-500 to-green-500',
    bgColor: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
    visual: (
      <div className="mt-6 glass rounded-2xl p-4">
        <div className="grid grid-cols-3 gap-2 mb-3">
          {[
            { label: 'Open Jobs', val: '8', color: 'text-teal-600' },
            { label: 'Applications', val: '312', color: 'text-emerald-600' },
            { label: 'Hires', val: '14', color: 'text-green-600' },
          ].map((m) => (
            <div key={m.label} className="rounded-xl bg-white/60 p-2.5 text-center">
              <div className={`text-lg font-extrabold ${m.color} leading-none`}>{m.val}</div>
              <div className="text-[9px] text-gray-500 mt-0.5">{m.label}</div>
            </div>
          ))}
        </div>
        <div className="flex items-end gap-1 h-10">
          {[65, 80, 55, 90, 72, 95, 68, 85, 100, 78].map((v, i) => (
            <div key={i} className="flex-1 rounded-sm bg-gradient-to-t from-teal-500 to-emerald-400" style={{ height: `${v}%`, opacity: 0.6 + v / 250 }}></div>
          ))}
        </div>
      </div>
    ),
  },
];

export default function FeaturesSection() {
  const [hovered, setHovered] = useState<number | null>(null);

  return (
    <section id="features" className="py-20 lg:py-28 relative overflow-hidden mesh-bg-subtle">
      <div className="orb orb-teal absolute top-40 -left-20 w-96 h-96 pointer-events-none" />
      <div className="orb orb-emerald absolute bottom-20 -right-32 w-[500px] h-[500px] pointer-events-none" />

      <div className="relative w-full px-4 sm:px-6 lg:px-8 xl:px-12 z-10">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 glass-badge text-teal-700 px-5 py-2.5 rounded-full text-sm font-semibold mb-6">
            <i className="ri-star-line"></i>
            Core Platform Features
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-5 tracking-tight">
            Everything you need to hire
          </h2>
          <p className="text-xl text-gray-600 leading-relaxed">
            A complete recruitment stack — no juggling between tools, no manual coordination.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-7 max-w-7xl mx-auto">
          {coreFeatures.map((feature, idx) => (
            <div
              key={idx}
              className="glass-card rounded-3xl p-8 cursor-default"
              onMouseEnter={() => setHovered(idx)}
              onMouseLeave={() => setHovered(null)}
              style={{ transform: hovered === idx ? 'translateY(-8px)' : 'translateY(0)', transition: 'transform 0.3s ease' }}
            >
              <div className={`w-16 h-16 ${feature.bgColor} rounded-2xl flex items-center justify-center mb-6`}>
                <i className={`${feature.icon} ${feature.iconColor} text-3xl`}></i>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
              <p className="text-gray-600 text-sm leading-relaxed">{feature.description}</p>
              {feature.visual}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

import { useState } from 'react';

const faqs = [
  {
    question: 'How does the resume builder work?',
    answer: `PickCV converts your input into structured hiring intelligence, not just a formatted document.

• You enter details like education, projects, skills, and internships
• The system organizes this into a standardized, machine-readable format
• AI improves clarity and specificity without adding or fabricating information
• Skills are extracted (both explicit and inferred from your experience)

Your resume is then:
• Tailored to align with hiring system expectations and role requirements
• Optimized for both automated screening and recruiter readability
• Structured to highlight relevant skills, projects, and outcomes

Outputs include:
• Resume Quality Score (0–100)
• ATS Compatibility Score
• Multiple role-specific resumes from a single profile`,
    icon: 'ri-file-list-3-line',
  },
  {
    question: 'Is my data safe and private?',
    answer: `Yes. PickCV is designed with strict data protection and user control.

Security measures:
• Encryption in transit (TLS) and at rest (AES-256)
• Role-based access control (RBAC)
• Session expiry after inactivity

Privacy controls:
• Explicit consent before data processing
• Ability to delete your account and all associated data
• Profile visibility settings (Public or Private)

Important:
• Your data is never sold to third parties
• AI does not fabricate or alter your information`,
    icon: 'ri-shield-check-line',
  },
  {
    question: 'Is there a free plan?',
    answer: `Yes. You can start without any payment.

• First resume download: Free
• After that: ₹49 per resume (Go plan)

Paid plans:
• Pro (₹499/month)
  - Unlimited resume generation and downloads
  - Role-specific resume versions
  - Advanced optimization features

• Max (₹999/year)
  - Same features as Pro
  - Better suited for long-term use (e.g., students preparing for placements)

Note: Free resumes include a watermark.`,
    icon: 'ri-lock-line',
  },
  {
    question: 'How long does it take to build a resume?',
    answer: `Most users complete their first resume quickly.

• Manual input: ~5–10 minutes
• AI optimization: ~30–60 seconds
• Uploading an existing resume: near-instant parsing

The system processes heavy tasks in the background, so the experience remains fast and responsive.`,
    icon: 'ri-gift-line',
  },
  {
    question: 'What does the ATS score mean?',
    answer: "Your ATS score represents how likely your resume is to pass through automated filters. Below 60% means most ATS systems will reject it. Above 80% means you're likely to reach a human recruiter. We aim for 90%+.",
    icon: 'ri-bar-chart-box-line',
  },
  {
    question: 'Does the AI change my actual experience?',
    answer: 'Never. PickCV does not fabricate experience or add false information. We only optimize how your real experience is presented — better keywords, stronger action verbs, and clearer quantified impact.',
    icon: 'ri-robot-2-line',
  },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" className="py-16 lg:py-24 relative overflow-hidden mesh-bg-subtle">
      <div className="orb orb-teal absolute top-20 right-10 w-80 h-80 pointer-events-none"></div>
      <div className="orb orb-emerald absolute bottom-20 left-10 w-96 h-96 pointer-events-none"></div>

      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 relative z-10">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <span className="inline-flex items-center gap-2 glass-badge text-teal-700 px-5 py-2.5 rounded-full text-sm font-semibold mb-6 shadow-sm">
            <i className="ri-question-answer-line text-teal-600"></i>
            Got Questions?
          </span>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 tracking-tight mb-5">
            Frequently Asked
            <span className="block bg-gradient-to-r from-teal-600 to-emerald-500 bg-clip-text text-transparent">
              Questions
            </span>
          </h2>
          <p className="text-lg text-gray-500">
            Everything you need to know about PickCV.
          </p>
        </div>

        {/* FAQ Grid */}
        <div className="max-w-4xl mx-auto space-y-3">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div
                key={index}
                className={`rounded-2xl transition-all duration-300 overflow-hidden ${
                  isOpen
                    ? 'glass-strong shadow-md'
                    : 'glass hover:shadow-sm'
                }`}
              >
                <button
                  onClick={() => toggle(index)}
                  className="w-full flex items-center gap-4 px-6 py-5 text-left cursor-pointer"
                >
                  <div className={`w-10 h-10 flex items-center justify-center rounded-xl flex-shrink-0 transition-all duration-300 ${
                    isOpen ? 'bg-gradient-to-br from-teal-500 to-emerald-500 text-white shadow-lg' : 'text-gray-500'
                  }`}
                  style={!isOpen ? { background: 'rgba(255,255,255,0.55)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.7)' } : {}}>
                    <i className={`${faq.icon} text-lg`}></i>
                  </div>

                  <span className={`flex-1 text-base font-semibold transition-colors duration-200 ${
                    isOpen ? 'text-teal-700' : 'text-gray-800'
                  }`}>
                    {faq.question}
                  </span>

                  <div className={`w-8 h-8 flex items-center justify-center rounded-full flex-shrink-0 transition-all duration-300 ${
                    isOpen ? 'bg-teal-100 text-teal-600 rotate-180' : 'text-gray-400'
                  }`}
                  style={!isOpen ? { background: 'rgba(255,255,255,0.55)', backdropFilter: 'blur(8px)' } : {}}>
                    <i className="ri-arrow-down-s-line text-xl"></i>
                  </div>
                </button>

                <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isOpen ? 'max-h-[1200px] opacity-100' : 'max-h-0 opacity-0'}`}>
                  <p className="px-6 pb-6 pl-20 text-gray-600 leading-relaxed text-sm whitespace-pre-line">
                    {faq.answer}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <div className="mt-14 text-center">
          <div className="inline-flex flex-col items-center gap-4 bg-gradient-to-r from-teal-600 to-emerald-500 rounded-3xl px-12 py-10 shadow-2xl shadow-teal-200">
            <p className="text-white text-xl font-semibold">Still have questions?</p>
            <p className="text-teal-100 text-sm max-w-sm text-center">
              Our team is happy to walk you through everything. No pressure, no sales pitch.
            </p>
            <a
              href="mailto:hello@pickcv.com"
              className="font-semibold px-8 py-3 rounded-xl transition-all duration-200 flex items-center gap-2 whitespace-nowrap shadow-md glass-strong text-teal-700 hover:bg-white/90"
            >
              <i className="ri-mail-line"></i>
              Contact Support
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

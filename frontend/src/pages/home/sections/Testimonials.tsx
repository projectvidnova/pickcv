import { useState } from 'react';

const faqs = [
  {
    question: 'How does the AI resume builder work?',
    answer: 'Our AI analyzes your work history, skills, and target job descriptions to craft tailored resume content. It rewrites your bullet points into achievement-driven statements, optimizes keywords for ATS systems, and formats everything to industry standards — all in minutes.',
    icon: 'ri-robot-2-line',
  },
  {
    question: 'What is ATS and why does it matter?',
    answer: 'ATS (Applicant Tracking System) is software used by 99% of Fortune 500 companies to filter resumes before a human ever sees them. If your resume isn\'t optimized, it gets rejected automatically. Our AI ensures your resume scores 90%+ on every ATS scan.',
    icon: 'ri-shield-check-line',
  },
  {
    question: 'Can I customize my resume for different jobs?',
    answer: 'Absolutely. With one click, our AI tailors your resume to match any job description — highlighting the most relevant experience, adjusting keywords, and reordering sections to maximize your match score for that specific role.',
    icon: 'ri-file-list-3-line',
  },
  {
    question: 'How accurate is the job matching feature?',
    answer: 'Our job matching engine analyzes 50+ signals including your skills, experience level, industry, location preferences, and salary expectations. Users report a 3× higher response rate compared to applying without matching. We surface roles where you\'re genuinely competitive.',
    icon: 'ri-compass-3-line',
  },
  {
    question: 'What does the Skill Gap Analysis show me?',
    answer: 'It compares your current skill set against the requirements of your target roles and shows you exactly what\'s missing. You\'ll get a prioritized list of skills to learn, along with curated course recommendations from top platforms like Coursera, Udemy, and LinkedIn Learning.',
    icon: 'ri-bar-chart-box-line',
  },
  {
    question: 'Is my data safe and private?',
    answer: 'Yes. Your resume data is encrypted at rest and in transit. We never sell your personal information to third parties. You can delete your account and all associated data at any time. We\'re fully GDPR compliant.',
    icon: 'ri-lock-line',
  },
  {
    question: 'Is there a free plan?',
    answer: 'Yes! You can create and download one fully optimized resume for free — no credit card required. Paid plans unlock unlimited resumes, job matching, skill gap analysis, and the application tracker.',
    icon: 'ri-gift-line',
  },
  {
    question: 'How long does it take to build a resume?',
    answer: 'Most users complete their first AI-optimized resume in under 10 minutes. If you\'re uploading an existing resume, our parser extracts your information instantly and the AI enhancement takes about 30 seconds.',
    icon: 'ri-time-line',
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
            Everything you need to know before you start your job search journey.
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

                <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isOpen ? 'max-h-64 opacity-100' : 'max-h-0 opacity-0'}`}>
                  <p className="px-6 pb-6 pl-20 text-gray-600 leading-relaxed text-sm">
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

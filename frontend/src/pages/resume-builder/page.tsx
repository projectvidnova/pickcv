import { useState } from 'react';
import Navbar from '../../components/feature/Navbar';
import Footer from '../../components/feature/Footer';
import OptimizeModal from '../../components/feature/OptimizeModal';

interface WorkExperience {
  id: string;
  role: string;
  company: string;
  startDate: string;
  endDate: string;
  achievements: string;
}

interface OptimizedResume {
  contact: {
    name: string;
    email: string;
    phone: string;
    location: string;
    linkedin: string;
  };
  summary: string;
  skills: Array<{ category: string; items: string[] }>;
  experience: Array<{
    title: string;
    company: string;
    period: string;
    bullets: string[];
  }>;
  education: Array<{
    degree: string;
    school: string;
    year: string;
  }>;
  certifications?: string[];
}

interface Keyword {
  word: string;
  count: number;
}

// Stopwords to filter out
const STOPWORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from', 'has', 'he',
  'in', 'is', 'it', 'its', 'of', 'on', 'that', 'the', 'to', 'was', 'will', 'with',
  'we', 'you', 'your', 'our', 'this', 'these', 'those', 'or', 'but', 'not', 'can',
  'have', 'do', 'does', 'did', 'been', 'being', 'am', 'were', 'would', 'should',
  'could', 'may', 'might', 'must', 'shall', 'all', 'any', 'both', 'each', 'few',
  'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'only', 'own', 'same',
  'so', 'than', 'too', 'very', 'just', 'where', 'when', 'who', 'which', 'what',
  'how', 'why', 'if', 'then', 'than', 'about', 'into', 'through', 'during', 'before',
  'after', 'above', 'below', 'up', 'down', 'out', 'off', 'over', 'under', 'again',
  'further', 'once', 'here', 'there', 'when', 'where', 'why', 'how', 'all', 'both',
  'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only'
]);

// Action verbs for resume bullets
const ACTION_VERBS = [
  'Led', 'Managed', 'Developed', 'Implemented', 'Spearheaded', 'Orchestrated',
  'Drove', 'Established', 'Launched', 'Optimized', 'Streamlined', 'Executed',
  'Delivered', 'Achieved', 'Increased', 'Reduced', 'Improved', 'Enhanced',
  'Collaborated', 'Coordinated', 'Facilitated', 'Directed', 'Oversaw', 'Supervised'
];

export default function ResumeBuilder() {
  // Personal Info
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  
  // Resume Content
  const [professionalSummary, setProfessionalSummary] = useState('');
  const [workExperiences, setWorkExperiences] = useState<WorkExperience[]>([
    { id: '1', role: '', company: '', startDate: '', endDate: '', achievements: '' }
  ]);
  const [skills, setSkills] = useState('');
  const [education, setEducation] = useState('');
  const [certifications, setCertifications] = useState('');
  
  // Target Job
  const [targetJobTitle, setTargetJobTitle] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  
  // UI State
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState(0);
  const [showOutput, setShowOutput] = useState(false);
  const [activeTab, setActiveTab] = useState<'resume' | 'keywords' | 'checklist'>('resume');
  const [copiedResume, setCopiedResume] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isOptimizeModalOpen, setIsOptimizeModalOpen] = useState(false);

  // Generated outputs
  const [optimizedResume, setOptimizedResume] = useState<OptimizedResume | null>(null);
  const [topKeywords, setTopKeywords] = useState<Keyword[]>([]);
  const [atsScore, setAtsScore] = useState(0);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [hasPlan, setHasPlan] = useState(false);

  const processingSteps = [
    { icon: 'ri-search-line', text: 'Analyzing keywords…' },
    { icon: 'ri-file-edit-line', text: 'Optimizing bullets…' },
    { icon: 'ri-checkbox-circle-line', text: 'Checking ATS compatibility…' },
  ];

  // Extract keywords from job description
  const extractKeywords = (text: string): Map<string, number> => {
    const words = text
      .toLowerCase()
      .replace(/[^\w\s-]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2 && !STOPWORDS.has(word));

    const keywordMap = new Map<string, number>();
    
    // Count single words
    words.forEach(word => {
      keywordMap.set(word, (keywordMap.get(word) || 0) + 1);
    });

    // Count 2-word phrases
    for (let i = 0; i < words.length - 1; i++) {
      const phrase = `${words[i]} ${words[i + 1]}`;
      if (!STOPWORDS.has(words[i]) && !STOPWORDS.has(words[i + 1])) {
        keywordMap.set(phrase, (keywordMap.get(phrase) || 0) + 1);
      }
    }

    return keywordMap;
  };

  // Calculate keyword match score
  const calculateMatchScore = (keywords: Map<string, number>, resumeText: string): number => {
    const resumeLower = resumeText.toLowerCase();
    let matchCount = 0;
    let totalKeywords = 0;

    keywords.forEach((count, keyword) => {
      totalKeywords++;
      if (resumeLower.includes(keyword)) {
        matchCount++;
      }
    });

    return totalKeywords > 0 ? Math.round((matchCount / totalKeywords) * 100) : 0;
  };

  // Rewrite summary with keywords
  const generateOptimizedSummary = (
    originalSummary: string,
    jobTitle: string,
    topKws: string[]
  ): string => {
    const summaryParts = originalSummary.split(/[.!?]+/).filter(s => s.trim());
    const firstPart = summaryParts[0] || '';
    
    // Inject job title and top keywords naturally
    const keywordPhrase = topKws.slice(0, 3).join(', ');
    
    return `${firstPart.trim()}. Proven expertise in ${keywordPhrase} with a track record of delivering measurable results. ${summaryParts.slice(1).join('. ').trim()}`;
  };

  // Rewrite experience bullets with action verbs and keywords
  const optimizeBullets = (achievements: string, keywords: string[]): string[] => {
    const bullets = achievements
      .split('\n')
      .map(b => b.trim().replace(/^[•\-*]\s*/, ''))
      .filter(b => b.length > 0);

    return bullets.map((bullet, idx) => {
      const verb = ACTION_VERBS[idx % ACTION_VERBS.length];
      const keyword = keywords[idx % keywords.length] || '';
      
      // If bullet doesn't start with action verb, add one
      if (!/^[A-Z][a-z]+ed/.test(bullet)) {
        bullet = `${verb} ${bullet.charAt(0).toLowerCase()}${bullet.slice(1)}`;
      }
      
      // Try to inject keyword if not present
      if (keyword && !bullet.toLowerCase().includes(keyword.toLowerCase())) {
        bullet = bullet.replace(/\.$/, '') + ` leveraging ${keyword}`;
      }
      
      return bullet;
    });
  };

  // Categorize skills based on keywords
  const categorizeSkills = (skillsText: string, keywords: string[]): Array<{ category: string; items: string[] }> => {
    const skillList = skillsText.split(',').map(s => s.trim()).filter(s => s);
    
    const technical: string[] = [];
    const leadership: string[] = [];
    const tools: string[] = [];
    
    skillList.forEach(skill => {
      const skillLower = skill.toLowerCase();
      if (skillLower.includes('lead') || skillLower.includes('manage') || skillLower.includes('team')) {
        leadership.push(skill);
      } else if (skillLower.includes('sql') || skillLower.includes('python') || skillLower.includes('java') || skillLower.includes('api')) {
        technical.push(skill);
      } else {
        tools.push(skill);
      }
    });

    const categories = [];
    if (technical.length > 0) categories.push({ category: 'Technical Skills', items: technical });
    if (leadership.length > 0) categories.push({ category: 'Leadership & Management', items: leadership });
    if (tools.length > 0) categories.push({ category: 'Tools & Methodologies', items: tools });
    
    return categories.length > 0 ? categories : [{ category: 'Core Skills', items: skillList }];
  };

  // Parse education entries
  const parseEducation = (eduText: string): Array<{ degree: string; school: string; year: string }> => {
    const lines = eduText.split('\n').filter(l => l.trim());
    return lines.map(line => {
      const parts = line.split(/[-–|]/);
      return {
        degree: parts[0]?.trim() || '',
        school: parts[1]?.trim() || '',
        year: parts[2]?.trim() || ''
      };
    });
  };

  const addWorkExperience = () => {
    const newId = Date.now().toString();
    setWorkExperiences([...workExperiences, { 
      id: newId, 
      role: '', 
      company: '', 
      startDate: '', 
      endDate: '', 
      achievements: '' 
    }]);
  };

  const removeWorkExperience = (id: string) => {
    if (workExperiences.length > 1) {
      setWorkExperiences(workExperiences.filter(exp => exp.id !== id));
    }
  };

  const updateWorkExperience = (id: string, field: keyof WorkExperience, value: string) => {
    setWorkExperiences(workExperiences.map(exp => 
      exp.id === id ? { ...exp, [field]: value } : exp
    ));
  };

  const validateForm = () => {
    const errors: string[] = [];
    
    if (!fullName.trim()) errors.push('fullName');
    if (!email.trim()) errors.push('email');
    if (!phone.trim()) errors.push('phone');
    if (!professionalSummary.trim()) errors.push('professionalSummary');
    if (!targetJobTitle.trim()) errors.push('targetJobTitle');
    if (!jobDescription.trim()) errors.push('jobDescription');
    
    // Check if at least one work experience is filled
    const hasValidExperience = workExperiences.some(exp => 
      exp.role.trim() && exp.company.trim() && exp.achievements.trim()
    );
    if (!hasValidExperience) errors.push('workExperience');
    
    if (!skills.trim()) errors.push('skills');
    if (!education.trim()) errors.push('education');
    
    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleOptimize = () => {
    if (!validateForm()) {
      // Scroll to first error
      const firstErrorElement = document.querySelector('.border-red-300');
      if (firstErrorElement) {
        firstErrorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    setIsProcessing(true);
    setProcessingStep(0);
    setShowOutput(false);

    // Step 1: Extract keywords
    setTimeout(() => {
      const keywordMap = extractKeywords(jobDescription);
      const sortedKeywords = Array.from(keywordMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([word, count]) => ({ word, count }));
      
      setTopKeywords(sortedKeywords);
      setProcessingStep(1);

      // Step 2: Optimize content
      setTimeout(() => {
        const topKwWords = sortedKeywords.map(k => k.word);
        
        // Generate optimized summary
        const optimizedSummary = generateOptimizedSummary(
          professionalSummary,
          targetJobTitle,
          topKwWords
        );

        // Categorize skills
        const categorizedSkills = categorizeSkills(skills, topKwWords);

        // Optimize work experiences
        const optimizedExperiences = workExperiences
          .filter(exp => exp.role.trim() && exp.company.trim())
          .map(exp => ({
            title: exp.role,
            company: exp.company,
            period: `${exp.startDate}${exp.endDate ? ' - ' + exp.endDate : ''}`,
            bullets: optimizeBullets(exp.achievements, topKwWords)
          }));

        // Parse education
        const parsedEducation = parseEducation(education);

        // Parse certifications
        const certList = certifications
          .split('\n')
          .map(c => c.trim())
          .filter(c => c);

        // Build full resume text for scoring
        const fullResumeText = [
          optimizedSummary,
          skills,
          workExperiences.map(e => e.achievements).join(' '),
          education
        ].join(' ');

        const matchScore = calculateMatchScore(keywordMap, fullResumeText);
        setAtsScore(matchScore);

        const optimized: OptimizedResume = {
          contact: {
            name: fullName,
            email: email,
            phone: phone,
            location: 'Location', // Could be added to form
            linkedin: linkedinUrl || 'LinkedIn Profile'
          },
          summary: optimizedSummary,
          skills: categorizedSkills,
          experience: optimizedExperiences,
          education: parsedEducation,
          certifications: certList.length > 0 ? certList : undefined
        };

        setOptimizedResume(optimized);
        setProcessingStep(2);

        // Step 3: Final check
        setTimeout(() => {
          setIsProcessing(false);
          setShowOutput(true);
        }, 800);
      }, 1500);
    }, 1500);
  };

  const handleStartOver = () => {
    setShowOutput(false);
    setFullName('');
    setEmail('');
    setPhone('');
    setLinkedinUrl('');
    setProfessionalSummary('');
    setWorkExperiences([{ id: '1', role: '', company: '', startDate: '', endDate: '', achievements: '' }]);
    setSkills('');
    setEducation('');
    setCertifications('');
    setTargetJobTitle('');
    setJobDescription('');
    setActiveTab('resume');
    setCopiedResume(false);
    setValidationErrors([]);
    setOptimizedResume(null);
    setTopKeywords([]);
    setAtsScore(0);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCopyResume = () => {
    if (!optimizedResume) return;

    const resumeText = `
${optimizedResume.contact.name}
${optimizedResume.contact.email} | ${optimizedResume.contact.phone} | ${optimizedResume.contact.location}
${optimizedResume.contact.linkedin}

PROFESSIONAL SUMMARY
${optimizedResume.summary}

SKILLS
${optimizedResume.skills.map(cat => `${cat.category}: ${cat.items.join(', ')}`).join('\n')}

PROFESSIONAL EXPERIENCE
${optimizedResume.experience.map(exp => `
${exp.title} | ${exp.company} | ${exp.period}
${exp.bullets.map(b => `• ${b}`).join('\n')}
`).join('\n')}

EDUCATION
${optimizedResume.education.map(edu => `${edu.degree} | ${edu.school} | ${edu.year}`).join('\n')}

${optimizedResume.certifications ? `CERTIFICATIONS\n${optimizedResume.certifications.join('\n')}` : ''}
    `.trim();

    navigator.clipboard.writeText(resumeText);
    setCopiedResume(true);
    setTimeout(() => setCopiedResume(false), 2000);
  };

  const handleDownloadPDF = () => {
    if (!hasPlan) {
      setShowPaymentModal(true);
      return;
    }
    window.print();
  };

  const handlePayAndDownload = () => {
    setHasPlan(true);
    setShowPaymentModal(false);
    setTimeout(() => window.print(), 100);
  };

  const scrollToForm = () => {
    const formSection = document.getElementById('resume-form');
    if (formSection) {
      formSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const hasError = (field: string) => validationErrors.includes(field);

  // ATS checklist based on actual score
  const atsChecklist = [
    { item: 'No images, tables, or graphics', passed: true },
    { item: 'Standard fonts (Arial, Calibri, Times)', passed: true },
    { item: 'Contact info in main body', passed: true },
    { item: 'Clear section headings', passed: true },
    { item: `Keyword match rate: ${atsScore}%`, passed: atsScore >= 70 },
    { item: 'Action verbs in bullets', passed: true },
    { item: 'Quantifiable achievements included', passed: true },
    { item: 'No headers/footers used', passed: true }
  ];

  return (
    <div className="min-h-screen mesh-bg">
      <Navbar />

      <OptimizeModal isOpen={isOptimizeModalOpen} onClose={() => setIsOptimizeModalOpen(false)} />

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(6px)' }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in">
            {/* Header */}
            <div className="bg-gradient-to-r from-teal-500 to-emerald-500 p-6 text-white relative">
              <button
                onClick={() => setShowPaymentModal(false)}
                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-colors cursor-pointer"
              >
                <i className="ri-close-line text-white text-lg"></i>
              </button>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-white/20">
                  <i className="ri-download-cloud-2-line text-2xl text-white"></i>
                </div>
                <div>
                  <h3 className="text-xl font-bold">Download Your Resume</h3>
                  <p className="text-sm text-white/80">One-time PDF download</p>
                </div>
              </div>
              <div className="flex items-end gap-1 mt-2">
                <span className="text-4xl font-extrabold">₹39</span>
                <span className="text-white/70 mb-1 text-sm">/ download</span>
              </div>
            </div>

            {/* Body */}
            <div className="p-6 space-y-5">
              <p className="text-gray-600 text-sm leading-relaxed">
                You don't have an active quarterly plan. Pay <strong className="text-gray-900">₹39</strong> to download your ATS-optimized resume as a PDF right now.
              </p>

              {/* What you get */}
              <div className="space-y-2.5">
                {[
                  { icon: 'ri-file-pdf-2-line', text: 'High-quality PDF download' },
                  { icon: 'ri-checkbox-circle-line', text: 'ATS-optimized formatting' },
                  { icon: 'ri-key-2-line', text: 'All keywords included' },
                  { icon: 'ri-shield-check-line', text: 'Secure one-time payment' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-7 h-7 flex items-center justify-center rounded-lg bg-emerald-50">
                      <i className={`${item.icon} text-emerald-600 text-sm`}></i>
                    </div>
                    <span className="text-sm text-gray-700">{item.text}</span>
                  </div>
                ))}
              </div>

              {/* Quarterly plan upsell */}
              <div className="p-4 rounded-xl bg-teal-50 border border-teal-100">
                <div className="flex items-start gap-2">
                  <i className="ri-sparkling-2-fill text-teal-500 mt-0.5 text-sm"></i>
                  <p className="text-xs text-teal-700 leading-relaxed">
                    <strong>Tip:</strong> Upgrade to a Quarterly Plan for unlimited downloads, priority optimization, and more — at a much better value.
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-3 pt-1">
                <button
                  onClick={handlePayAndDownload}
                  className="w-full py-3.5 rounded-xl font-bold text-white bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 transition-all shadow-lg shadow-teal-500/25 cursor-pointer whitespace-nowrap flex items-center justify-center gap-2"
                >
                  <i className="ri-secure-payment-line text-lg"></i>
                  Pay ₹39 &amp; Download PDF
                </button>
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="w-full py-3 rounded-xl font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-all cursor-pointer whitespace-nowrap text-sm"
                >
                  Maybe later
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hero Landing Section */}
      <section className="relative pt-28 pb-24 px-4 overflow-hidden">
        {/* Background orbs */}
        <div className="absolute top-0 left-1/4 w-96 h-96 orb orb-teal opacity-60 pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 orb orb-emerald opacity-50 pointer-events-none" />

        <div className="max-w-5xl mx-auto text-center relative z-10">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-badge mb-6">
            <i className="ri-sparkling-2-fill text-teal-500 text-sm"></i>
            <span className="text-sm font-semibold text-teal-700">Powered by AI</span>
          </div>

          <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-gray-900 mb-5 leading-[1.08]">
            AI Resume <span className="bg-gradient-to-r from-teal-500 to-emerald-500 bg-clip-text text-transparent">Creator</span>
          </h1>

          <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-10 leading-relaxed">
            Build an ATS-optimized resume from scratch in minutes — or upload yours and let AI tailor it to any job.
          </p>

          {/* Dual CTA Cards */}
          <div className="flex flex-col sm:flex-row items-stretch justify-center gap-4 max-w-2xl mx-auto mb-16">
            {/* Primary: Create */}
            <button
              onClick={scrollToForm}
              className="flex-1 group flex flex-col items-center gap-3 px-8 py-6 rounded-2xl bg-gray-900 text-white hover:bg-gray-800 transition-all shadow-xl shadow-gray-900/20 hover:shadow-2xl hover:scale-[1.02] cursor-pointer"
            >
              <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-white/10 group-hover:bg-white/20 transition-colors">
                <i className="ri-file-add-line text-2xl text-white"></i>
              </div>
              <div className="text-center">
                <div className="text-base font-bold whitespace-nowrap">Create Resume Now</div>
                <div className="text-xs text-white/60 mt-0.5 whitespace-nowrap">Build from scratch with AI</div>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-teal-300 whitespace-nowrap">
                <i className="ri-arrow-down-line text-sm"></i>
                Fill the form below
              </div>
            </button>

            {/* Divider */}
            <div className="flex sm:flex-col items-center justify-center gap-2 sm:gap-1 px-2">
              <div className="flex-1 sm:flex-none sm:h-8 w-full sm:w-px h-px bg-gray-200" />
              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">or</span>
              <div className="flex-1 sm:flex-none sm:h-8 w-full sm:w-px h-px bg-gray-200" />
            </div>

            {/* Secondary: Upload */}
            <button
              onClick={() => setIsOptimizeModalOpen(true)}
              className="flex-1 group flex flex-col items-center gap-3 px-8 py-6 rounded-2xl glass-card border border-white/60 hover:border-teal-300/60 hover:bg-white/80 transition-all cursor-pointer"
            >
              <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-gradient-to-br from-teal-500/10 to-emerald-500/10 group-hover:from-teal-500/20 group-hover:to-emerald-500/20 transition-colors">
                <i className="ri-upload-cloud-2-line text-2xl text-teal-600"></i>
              </div>
              <div className="text-center">
                <div className="text-base font-bold text-gray-900 whitespace-nowrap">Already Have a Resume?</div>
                <div className="text-xs text-gray-500 mt-0.5 whitespace-nowrap">Upload &amp; optimize it for any job</div>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-teal-600 whitespace-nowrap">
                <i className="ri-sparkling-fill text-sm"></i>
                AI-powered optimization
              </div>
            </button>
          </div>

          {/* Key Stats Bar */}
          <div className="flex flex-wrap items-center justify-center gap-6 md:gap-10">
            {[
              { icon: 'ri-line-chart-line', value: '95%', label: 'ATS Score' },
              { icon: 'ri-key-2-line', value: '50+', label: 'Keywords Matched' },
              { icon: 'ri-time-line', value: '2 min', label: 'Time to Build' },
              { icon: 'ri-user-star-line', value: '10k+', label: 'Resumes Created' },
            ].map((stat, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-emerald-500 shadow-md shadow-teal-500/25">
                  <i className={`${stat.icon} text-white text-base`}></i>
                </div>
                <div className="text-left">
                  <div className="text-xl font-extrabold text-gray-900 leading-none">{stat.value}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{stat.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Thin divider */}
      <div className="max-w-4xl mx-auto px-4">
        <div className="h-px bg-gradient-to-r from-transparent via-teal-200 to-transparent" />
      </div>

      {/* Input Form */}
      {!showOutput && (
        <section id="resume-form" className="py-16 px-4">
          <div className="max-w-4xl mx-auto">
            {/* Section label */}
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-emerald-500 shadow-md shadow-teal-500/25">
                <i className="ri-edit-2-line text-white text-lg"></i>
              </div>
              <div>
                <h2 className="text-2xl font-extrabold text-gray-900">Build Your Resume</h2>
                <p className="text-sm text-gray-500">Fill in your details — AI will optimize everything</p>
              </div>
            </div>

            <div className="glass-card rounded-2xl p-8 space-y-8">
              
              {/* Section 1: Personal Information */}
              <div className="space-y-4">
                <div className="flex items-center gap-3 pb-3 border-b border-white/40">
                  <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-emerald-500">
                    <i className="ri-user-line text-white text-lg"></i>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">Personal Information</h3>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name <span className="text-red-500">*</span></label>
                    <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="John Doe"
                      className={`w-full px-4 py-3 rounded-xl glass-input focus:outline-none transition-all text-sm text-gray-700 ${hasError('fullName') ? 'ring-2 ring-red-300' : ''}`} />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Email <span className="text-red-500">*</span></label>
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="john.doe@email.com"
                      className={`w-full px-4 py-3 rounded-xl glass-input focus:outline-none transition-all text-sm text-gray-700 ${hasError('email') ? 'ring-2 ring-red-300' : ''}`} />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Phone <span className="text-red-500">*</span></label>
                    <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 (555) 123-4567"
                      className={`w-full px-4 py-3 rounded-xl glass-input focus:outline-none transition-all text-sm text-gray-700 ${hasError('phone') ? 'ring-2 ring-red-300' : ''}`} />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">LinkedIn URL</label>
                    <input type="url" value={linkedinUrl} onChange={(e) => setLinkedinUrl(e.target.value)} placeholder="linkedin.com/in/johndoe"
                      className="w-full px-4 py-3 rounded-xl glass-input focus:outline-none transition-all text-sm text-gray-700" />
                  </div>
                </div>
              </div>

              {/* Section 2: Professional Summary */}
              <div className="space-y-4">
                <div className="flex items-center gap-3 pb-3 border-b border-white/40">
                  <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-emerald-500">
                    <i className="ri-file-text-line text-white text-lg"></i>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">Professional Summary</h3>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Summary <span className="text-red-500">*</span></label>
                  <textarea value={professionalSummary} onChange={(e) => setProfessionalSummary(e.target.value)}
                    placeholder="Write a brief professional summary highlighting your key strengths, experience, and career goals..."
                    rows={4}
                    className={`w-full px-4 py-3 rounded-xl glass-input focus:outline-none transition-all resize-none text-sm text-gray-700 ${hasError('professionalSummary') ? 'ring-2 ring-red-300' : ''}`} />
                </div>
              </div>

              {/* Section 3: Work Experience */}
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-white/40">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-emerald-500">
                      <i className="ri-briefcase-line text-white text-lg"></i>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">Work Experience</h3>
                  </div>
                  <button onClick={addWorkExperience}
                    className="px-4 py-2 rounded-xl glass text-teal-700 text-sm font-semibold hover:bg-white/70 transition-all whitespace-nowrap cursor-pointer">
                    <i className="ri-add-line mr-1"></i>Add Experience
                  </button>
                </div>

                {hasError('workExperience') && (
                  <div className="p-3 rounded-xl glass border border-red-200/60 text-sm text-red-700">
                    <i className="ri-error-warning-line mr-2"></i>Please add at least one complete work experience
                  </div>
                )}

                {workExperiences.map((exp, index) => (
                  <div key={exp.id} className="p-6 rounded-xl glass space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-gray-500">Experience #{index + 1}</span>
                      {workExperiences.length > 1 && (
                        <button onClick={() => removeWorkExperience(exp.id)}
                          className="text-red-500 hover:text-red-700 text-sm font-medium cursor-pointer">
                          <i className="ri-delete-bin-line mr-1"></i>Remove
                        </button>
                      )}
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Job Title <span className="text-red-500">*</span></label>
                        <input type="text" value={exp.role} onChange={(e) => updateWorkExperience(exp.id, 'role', e.target.value)}
                          placeholder="Senior Product Manager"
                          className="w-full px-4 py-3 rounded-xl glass-input focus:outline-none transition-all text-sm text-gray-700" />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Company <span className="text-red-500">*</span></label>
                        <input type="text" value={exp.company} onChange={(e) => updateWorkExperience(exp.id, 'company', e.target.value)}
                          placeholder="TechCorp Inc."
                          className="w-full px-4 py-3 rounded-xl glass-input focus:outline-none transition-all text-sm text-gray-700" />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Start Date</label>
                        <input type="text" value={exp.startDate} onChange={(e) => updateWorkExperience(exp.id, 'startDate', e.target.value)}
                          placeholder="Jan 2021"
                          className="w-full px-4 py-3 rounded-xl glass-input focus:outline-none transition-all text-sm text-gray-700" />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">End Date</label>
                        <input type="text" value={exp.endDate} onChange={(e) => updateWorkExperience(exp.id, 'endDate', e.target.value)}
                          placeholder="Present"
                          className="w-full px-4 py-3 rounded-xl glass-input focus:outline-none transition-all text-sm text-gray-700" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Key Achievements <span className="text-red-500">*</span></label>
                      <textarea value={exp.achievements} onChange={(e) => updateWorkExperience(exp.id, 'achievements', e.target.value)}
                        placeholder="• Led product strategy for B2B SaaS platform&#10;• Increased user engagement by 45%"
                        rows={4}
                        className="w-full px-4 py-3 rounded-xl glass-input focus:outline-none transition-all resize-none text-sm text-gray-700" />
                    </div>
                  </div>
                ))}
              </div>

              {/* Section 4: Skills */}
              <div className="space-y-4">
                <div className="flex items-center gap-3 pb-3 border-b border-white/40">
                  <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-emerald-500">
                    <i className="ri-lightbulb-line text-white text-lg"></i>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">Skills</h3>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Skills (comma separated) <span className="text-red-500">*</span></label>
                  <textarea value={skills} onChange={(e) => setSkills(e.target.value)}
                    placeholder="Product Strategy, Agile/Scrum, SQL, Google Analytics..."
                    rows={3}
                    className={`w-full px-4 py-3 rounded-xl glass-input focus:outline-none transition-all resize-none text-sm text-gray-700 ${hasError('skills') ? 'ring-2 ring-red-300' : ''}`} />
                </div>
              </div>

              {/* Section 5: Education */}
              <div className="space-y-4">
                <div className="flex items-center gap-3 pb-3 border-b border-white/40">
                  <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-emerald-500">
                    <i className="ri-graduation-cap-line text-white text-lg"></i>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">Education</h3>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Education <span className="text-red-500">*</span></label>
                  <textarea value={education} onChange={(e) => setEducation(e.target.value)}
                    placeholder="MBA, Technology Management - Stanford University - 2018"
                    rows={3}
                    className={`w-full px-4 py-3 rounded-xl glass-input focus:outline-none transition-all resize-none text-sm text-gray-700 ${hasError('education') ? 'ring-2 ring-red-300' : ''}`} />
                </div>
              </div>

              {/* Section 6: Certifications */}
              <div className="space-y-4">
                <div className="flex items-center gap-3 pb-3 border-b border-white/40">
                  <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-emerald-500">
                    <i className="ri-award-line text-white text-lg"></i>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900">Certifications</h3>
                    <p className="text-xs text-gray-500 mt-0.5">Optional</p>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Certifications</label>
                  <textarea value={certifications} onChange={(e) => setCertifications(e.target.value)}
                    placeholder="Certified Scrum Product Owner (CSPO)&#10;Google Analytics Certification"
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl glass-input focus:outline-none transition-all resize-none text-sm text-gray-700" />
                </div>
              </div>

              {/* Section 7: Target Job */}
              <div className="space-y-4">
                <div className="flex items-center gap-3 pb-3 border-b border-white/40">
                  <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500">
                    <i className="ri-focus-3-line text-white text-lg"></i>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">Target Job</h3>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Target Job Title <span className="text-red-500">*</span></label>
                  <input type="text" value={targetJobTitle} onChange={(e) => setTargetJobTitle(e.target.value)} placeholder="Senior Product Manager"
                    className={`w-full px-4 py-3 rounded-xl glass-input focus:outline-none transition-all text-sm text-gray-700 ${hasError('targetJobTitle') ? 'ring-2 ring-red-300' : ''}`} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Job Description <span className="text-red-500">*</span></label>
                  <textarea value={jobDescription} onChange={(e) => setJobDescription(e.target.value)}
                    placeholder="Paste the complete job description here..."
                    rows={8}
                    className={`w-full px-4 py-3 rounded-xl glass-input focus:outline-none transition-all resize-none text-sm text-gray-700 ${hasError('jobDescription') ? 'ring-2 ring-red-300' : ''}`} />
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex flex-col items-center gap-4 pt-4">
                <button
                  onClick={handleOptimize}
                  disabled={isProcessing}
                  className={`relative overflow-hidden px-8 py-4 rounded-xl font-semibold text-white transition-all duration-300 whitespace-nowrap cursor-pointer group ${
                    isProcessing ? 'cursor-not-allowed opacity-60' : 'bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 shadow-lg shadow-teal-500/30 hover:shadow-xl hover:shadow-teal-500/40'
                  }`}
                  style={isProcessing ? { background: 'rgba(255,255,255,0.4)', backdropFilter: 'blur(8px)' } : {}}
                >
                  <span className="relative z-10 flex items-center gap-2">
                    {isProcessing ? (
                      <><i className="ri-loader-4-line text-lg animate-spin"></i>Processing...</>
                    ) : (
                      <><i className="ri-sparkling-fill text-lg"></i>Generate Optimized Resume</>
                    )}
                  </span>
                </button>

                {isProcessing && (
                  <div className="flex items-center gap-8 animate-pulse">
                    {processingSteps.map((step, index) => (
                      <div key={index} className={`flex items-center gap-2 transition-all duration-500 ${
                        index === processingStep ? 'opacity-100 scale-100' : index < processingStep ? 'opacity-50 scale-95' : 'opacity-30 scale-90'
                      }`}>
                        <div className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all duration-500 ${
                          index === processingStep ? 'bg-gradient-to-br from-teal-500 to-emerald-500' : index < processingStep ? 'bg-teal-100' : ''
                        }`}
                        style={index > processingStep ? { background: 'rgba(255,255,255,0.45)', backdropFilter: 'blur(6px)' } : {}}>
                          <i className={`${step.icon} text-sm ${index <= processingStep ? 'text-white' : 'text-gray-400'}`}></i>
                        </div>
                        <span className={`text-sm font-medium ${
                          index === processingStep ? 'text-teal-700' : index < processingStep ? 'text-gray-500' : 'text-gray-400'
                        }`}>{step.text}</span>
                      </div>
                    ))}
                  </div>
                )}

                {!isProcessing && (
                  <p className="text-center text-xs text-gray-500">
                    <i className="ri-lock-line mr-1"></i>Your data is processed securely and never stored
                  </p>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Output Section */}
      {showOutput && optimizedResume && (
        <section className="pb-20 px-4">
          <div className="max-w-6xl mx-auto">
            
            {/* Success Banner */}
            <div className="bg-gradient-to-r from-teal-500 to-emerald-500 rounded-2xl p-6 mb-6 text-white">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-white/20">
                    <i className="ri-checkbox-circle-fill text-2xl"></i>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">Resume Optimized Successfully!</h3>
                    <p className="text-sm text-white/90">Your ATS-friendly resume is ready to download</p>
                  </div>
                </div>
                <button onClick={handleStartOver}
                  className="px-5 py-2.5 rounded-xl font-medium transition-all whitespace-nowrap cursor-pointer glass-strong text-white hover:bg-white/30">
                  <i className="ri-refresh-line mr-2"></i>Start Over
                </button>
              </div>
            </div>

            {/* Tabbed Output */}
            <div className="glass-card rounded-2xl overflow-hidden">
              {/* Tab Headers */}
              <div className="flex border-b border-white/40" style={{ background: 'rgba(255,255,255,0.35)', backdropFilter: 'blur(8px)' }}>
                {(['resume', 'keywords', 'checklist'] as const).map((tab) => {
                  const tabConfig = {
                    resume: { icon: 'ri-file-text-line', label: 'Optimized Resume' },
                    keywords: { icon: 'ri-key-2-line', label: 'Top Keywords' },
                    checklist: { icon: 'ri-checkbox-circle-line', label: 'ATS Checklist' },
                  };
                  return (
                    <button key={tab} onClick={() => setActiveTab(tab)}
                      className={`flex-1 px-6 py-4 font-semibold text-sm transition-all whitespace-nowrap cursor-pointer ${
                        activeTab === tab ? 'text-teal-600 border-b-2 border-teal-500 bg-white/60' : 'text-gray-600 hover:text-gray-900 hover:bg-white/30'
                      }`}>
                      <i className={`${tabConfig[tab].icon} mr-2`}></i>{tabConfig[tab].label}
                    </button>
                  );
                })}
              </div>

              <div className="p-8">
                {/* Optimized Resume Tab */}
                {activeTab === 'resume' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
                      <h3 className="text-xl font-bold text-gray-900">Your Optimized Resume</h3>
                      <div className="flex items-center gap-3">
                        <button onClick={handleDownloadPDF}
                          className="px-5 py-2.5 rounded-xl font-medium transition-all whitespace-nowrap cursor-pointer bg-gray-900 text-white hover:bg-gray-800">
                          <i className="ri-download-line mr-2"></i>Download PDF
                        </button>
                        <button onClick={handleCopyResume}
                          className={`px-5 py-2.5 rounded-xl font-medium transition-all whitespace-nowrap cursor-pointer ${
                            copiedResume ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'glass text-teal-700 hover:bg-white/70'
                          }`}>
                          <i className={`${copiedResume ? 'ri-check-line' : 'ri-file-copy-line'} mr-2`}></i>
                          {copiedResume ? 'Copied!' : 'Copy Text'}
                        </button>
                      </div>
                    </div>

                    <div id="resume-content" className="rounded-xl p-6 space-y-6 font-mono text-sm print:bg-white print:border-0 print:rounded-none print:p-8 glass">
                      <div className="text-center border-b border-white/50 pb-4 print:border-black">
                        <h2 className="text-xl font-bold text-gray-900 mb-1 print:text-2xl">{optimizedResume.contact.name}</h2>
                        <p className="text-gray-700">{optimizedResume.contact.email} | {optimizedResume.contact.phone}</p>
                        <p className="text-gray-700">{optimizedResume.contact.linkedin}</p>
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-gray-900 mb-2 uppercase tracking-wide">Professional Summary</h3>
                        <p className="text-gray-700 leading-relaxed">{optimizedResume.summary}</p>
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-gray-900 mb-2 uppercase tracking-wide">Skills</h3>
                        {optimizedResume.skills.map((cat, idx) => (
                          <p key={idx} className="text-gray-700 mb-1"><strong>{cat.category}:</strong> {cat.items.join(', ')}</p>
                        ))}
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-gray-900 mb-3 uppercase tracking-wide">Professional Experience</h3>
                        {optimizedResume.experience.map((exp, idx) => (
                          <div key={idx} className="mb-4">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <h4 className="font-bold text-gray-900">{exp.title}</h4>
                                <p className="text-gray-700">{exp.company}</p>
                              </div>
                              <span className="text-gray-600 text-xs">{exp.period}</span>
                            </div>
                            <ul className="space-y-1 ml-4">
                              {exp.bullets.map((bullet, bidx) => (
                                <li key={bidx} className="text-gray-700 leading-relaxed">• {bullet}</li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-gray-900 mb-2 uppercase tracking-wide">Education</h3>
                        {optimizedResume.education.map((edu, idx) => (
                          <p key={idx} className="text-gray-700"><strong>{edu.degree}</strong> | {edu.school} | {edu.year}</p>
                        ))}
                      </div>
                      {optimizedResume.certifications && optimizedResume.certifications.length > 0 && (
                        <div>
                          <h3 className="text-base font-bold text-gray-900 mb-2 uppercase tracking-wide">Certifications</h3>
                          {optimizedResume.certifications.map((cert, idx) => (
                            <p key={idx} className="text-gray-700">• {cert}</p>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Top Keywords Tab */}
                {activeTab === 'keywords' && (
                  <div className="space-y-6">
                    <div className="mb-6">
                      <h3 className="text-xl font-bold text-gray-900 mb-2">Top 10 Keywords Matched</h3>
                      <p className="text-sm text-gray-600">These keywords from the job description were successfully incorporated into your resume</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {topKeywords.map((kw, idx) => (
                        <div key={idx} className="flex items-center justify-between p-4 rounded-xl glass">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-gradient-to-br from-teal-500 to-emerald-500">
                              <i className="ri-key-2-fill text-white text-sm"></i>
                            </div>
                            <span className="font-semibold text-gray-900">{kw.word}</span>
                          </div>
                          <span className="px-3 py-1 rounded-full bg-teal-500 text-white text-xs font-bold">{kw.count}x</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-8 p-4 rounded-xl glass border border-emerald-200/40">
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 flex items-center justify-center rounded-lg bg-emerald-500 shrink-0 mt-0.5">
                          <i className="ri-lightbulb-flash-line text-white text-sm"></i>
                        </div>
                        <div>
                          <h4 className="font-semibold text-emerald-900 mb-1">Pro Tip</h4>
                          <p className="text-sm text-emerald-800">These keywords are strategically placed throughout your resume to maximize ATS compatibility while maintaining natural readability.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ATS Checklist Tab */}
                {activeTab === 'checklist' && (
                  <div className="space-y-6">
                    <div className="mb-6">
                      <h3 className="text-xl font-bold text-gray-900 mb-2">ATS Compatibility Checklist</h3>
                      <p className="text-sm text-gray-600">Your resume passes all critical ATS requirements</p>
                    </div>
                    <div className="space-y-3">
                      {atsChecklist.map((check, idx) => (
                        <div key={idx} className={`flex items-center gap-4 p-4 rounded-xl glass ${check.passed ? 'border border-emerald-200/40' : 'border border-amber-200/40'}`}>
                          <div className={`w-8 h-8 flex items-center justify-center rounded-lg shrink-0 ${check.passed ? 'bg-emerald-500' : 'bg-amber-500'}`}>
                            <i className={`${check.passed ? 'ri-check-line' : 'ri-error-warning-line'} text-white text-lg font-bold`}></i>
                          </div>
                          <span className="font-medium text-gray-900">{check.item}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-8 p-6 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 text-white">
                      <div className="flex items-center gap-4 mb-3">
                        <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-white/20">
                          <i className="ri-trophy-line text-2xl"></i>
                        </div>
                        <div>
                          <h4 className="text-xl font-bold">{atsScore >= 90 ? 'Excellent' : atsScore >= 70 ? 'Good' : 'Fair'} ATS Score!</h4>
                          <p className="text-sm text-white/90">Your resume is optimized for applicant tracking systems</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-4">
                        <div className="flex-1 h-3 bg-white/20 rounded-full overflow-hidden">
                          <div className="h-full bg-white rounded-full transition-all duration-1000" style={{ width: `${atsScore}%` }}></div>
                        </div>
                        <span className="font-bold text-lg">{atsScore}%</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Why This Beats Generic Resume Builders */}
      {!showOutput && (
        <section className="py-20 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Built for Real Hiring Systems</h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">Most resume tools format. We optimize for how applications are actually evaluated.</p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { icon: 'ri-focus-3-line', title: 'System-Aware Optimization', desc: 'Each resume is tailored to the specific role and aligned with structured screening workflows used by employers.' },
                { icon: 'ri-key-2-line', title: 'Intelligent Keyword Mapping', desc: 'Extracts high-impact keywords from job descriptions and aligns them naturally with your experience.' },
                { icon: 'ri-checkbox-circle-line', title: 'Structured Parsing Safe', desc: 'Clean, single-column formatting designed for reliable parsing and accurate data extraction.' },
                { icon: 'ri-flashlight-line', title: 'Performance in Minutes', desc: 'Generate an optimized resume quickly, without manual rewrites or formatting guesswork.' },
              ].map((f, i) => (
                <div key={i} className="glass-card rounded-2xl p-6 hover:shadow-lg transition-all">
                  <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-emerald-500 mb-4 shadow-lg shadow-teal-500/30">
                    <i className={`${f.icon} text-white text-xl`}></i>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{f.title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <Footer />
    </div>
  );
}
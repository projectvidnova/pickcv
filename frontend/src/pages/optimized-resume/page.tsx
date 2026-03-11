import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Navbar from '../../components/feature/Navbar';
import Footer from '../../components/feature/Footer';
import TemplateClassic from './components/TemplateClassic';
import TemplateModern from './components/TemplateModern';
import TemplateMinimal from './components/TemplateMinimal';
import TemplateExecutive from './components/TemplateExecutive';
import TemplateCreative from './components/TemplateCreative';
import TemplateCompact from './components/TemplateCompact';
import ResumeEditor from './components/ResumeEditor';
import { ResumeData } from './types';

type TemplateId = 'classic' | 'modern' | 'minimal' | 'executive' | 'creative' | 'compact';

const resumeData: ResumeData = {
  name: 'Sarah Mitchell',
  title: 'Senior Product Manager',
  email: 'sarah.mitchell@email.com',
  phone: '(555) 123-4567',
  linkedin: 'linkedin.com/in/sarahmitchell',
  location: 'San Francisco, CA',
  summary:
    'Results-driven Senior Product Manager with 8+ years of experience leading cross-functional teams to deliver innovative SaaS products. Proven track record of driving product strategy, conducting user research, and implementing agile methodologies to achieve 40% increase in user engagement and 25% revenue growth. Expert in roadmap planning, stakeholder management, and data-driven decision making.',
  experience: [
    {
      role: 'Senior Product Manager',
      company: 'TechCorp Solutions',
      location: 'San Francisco, CA',
      period: '2020 – Present',
      bullets: [
        'Led cross-functional team of 12 engineers and designers to launch 3 major product features, resulting in 40% increase in user engagement and $2M additional ARR',
        'Implemented agile/scrum methodologies and data-driven roadmap planning, reducing time-to-market by 30% and improving sprint velocity by 25%',
        'Conducted comprehensive user research and A/B testing with 5,000+ participants, leading to 35% improvement in conversion rates',
        'Managed stakeholder relationships across C-suite and 4 departments, securing $5M budget approval for strategic product initiatives',
      ],
    },
    {
      role: 'Product Manager',
      company: 'InnovateLabs Inc.',
      location: 'New York, NY',
      period: '2017 – 2020',
      bullets: [
        'Developed and executed product roadmap for mobile application serving 100K+ users, achieving 4.8-star rating and 50% YoY user growth',
        'Performed data analysis using SQL and analytics tools to identify user pain points, implementing solutions that reduced churn by 20%',
        'Collaborated with engineering teams to prioritize feature backlog, delivering 95% of committed features on schedule',
      ],
    },
  ],
  skills: [
    'Product Management',
    'Agile / Scrum',
    'Roadmap Planning',
    'Stakeholder Management',
    'Data Analysis',
    'User Research',
    'Cross-functional Leadership',
    'A/B Testing',
    'SQL',
    'OKR Frameworks',
  ],
  education: [
    {
      degree: 'Master of Business Administration (MBA)',
      school: 'Stanford Graduate School of Business',
      period: '2015 – 2017',
    },
  ],
};

interface TemplateOption {
  id: TemplateId;
  name: string;
  tag: string;
  description: string;
  accent: string;
  tagColor: string;
  preview: string[];
}

const templates: TemplateOption[] = [
  {
    id: 'classic',
    name: 'Classic',
    tag: 'Traditional',
    description: 'Centered header, serif typography, clean section dividers',
    accent: 'bg-gray-800',
    tagColor: 'bg-gray-100 text-gray-600',
    preview: ['centered-header', 'serif', 'dividers'],
  },
  {
    id: 'modern',
    name: 'Modern',
    tag: 'Two-Column',
    description: 'Dark sidebar with skills & contact, timeline experience on the right',
    accent: 'bg-teal-700',
    tagColor: 'bg-teal-50 text-teal-700',
    preview: ['sidebar', 'timeline', 'color-accent'],
  },
  {
    id: 'minimal',
    name: 'Minimal',
    tag: 'Clean',
    description: 'Ultra-light typography, generous whitespace, side skills column',
    accent: 'bg-gray-300',
    tagColor: 'bg-gray-50 text-gray-500',
    preview: ['light', 'whitespace', 'side-column'],
  },
  {
    id: 'executive',
    name: 'Executive',
    tag: 'Bold Header',
    description: 'Dark header bar, numbered bullets, timeline layout with dates on left',
    accent: 'bg-gray-900',
    tagColor: 'bg-gray-100 text-gray-700',
    preview: ['dark-header', 'numbered', 'timeline'],
  },
  {
    id: 'creative',
    name: 'Creative',
    tag: 'Split Layout',
    description: 'Gradient split header, icon-led sections, teal sidebar',
    accent: 'bg-gradient-to-r from-teal-600 to-emerald-600',
    tagColor: 'bg-teal-50 text-teal-700',
    preview: ['gradient', 'icons', 'split'],
  },
  {
    id: 'compact',
    name: 'Compact',
    tag: 'Dense Grid',
    description: 'Grid-based layout, inline skills row, maximum info density',
    accent: 'bg-teal-500',
    tagColor: 'bg-teal-50 text-teal-600',
    preview: ['grid', 'dense', 'inline'],
  },
];

const keywords = [
  'Product Management',
  'Agile/Scrum',
  'Roadmap Planning',
  'Stakeholder Management',
  'Data Analysis',
  'User Research',
  'Cross-functional Leadership',
  'A/B Testing',
];

const improvements = [
  { icon: 'ri-check-double-line', text: 'Rewritten 12 bullet points with action verbs and metrics', color: 'text-emerald-600' },
  { icon: 'ri-key-2-line', text: 'Injected 8 high-impact keywords from job description', color: 'text-teal-600' },
  { icon: 'ri-layout-line', text: 'Optimized formatting for ATS parsing (single-column, clean headers)', color: 'text-amber-600' },
  { icon: 'ri-text-spacing', text: 'Improved readability with consistent spacing and hierarchy', color: 'text-emerald-600' },
  { icon: 'ri-file-reduce-line', text: 'Reduced resume to 1 page while maintaining impact', color: 'text-teal-600' },
];

function TemplateThumbnail({ template, isSelected, onClick }: { template: TemplateOption; isSelected: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`relative w-full text-left rounded-xl border-2 transition-all cursor-pointer overflow-hidden group ${
        isSelected
          ? 'border-teal-500 shadow-lg shadow-teal-500/20'
          : 'border-gray-200 hover:border-teal-300 hover:shadow-md'
      }`}
    >
      {/* Live scaled-down preview */}
      <div className="h-36 bg-white overflow-hidden relative">
        <div
          style={{
            transform: 'scale(0.22)',
            transformOrigin: 'top left',
            width: '454%',
            height: '454%',
            pointerEvents: 'none',
            userSelect: 'none',
          }}
        >
          <ResumeRenderer templateId={template.id} data={resumeData} />
        </div>
        {/* Overlay gradient so bottom fades nicely */}
        <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-white/80 to-transparent pointer-events-none"></div>
        {isSelected && (
          <div className="absolute inset-0 bg-teal-500/10 flex items-start justify-end p-2">
            <div className="w-6 h-6 rounded-full bg-teal-500 flex items-center justify-center shadow-md">
              <i className="ri-check-line text-white text-xs"></i>
            </div>
          </div>
        )}
      </div>
      {/* Label */}
      <div className={`px-3 py-2.5 border-t ${isSelected ? 'bg-teal-50 border-teal-100' : 'bg-white border-gray-100'}`}>
        <div className="flex items-center justify-between mb-0.5">
          <span className={`text-sm font-bold ${isSelected ? 'text-teal-700' : 'text-gray-800'}`}>{template.name}</span>
          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${template.tagColor}`}>{template.tag}</span>
        </div>
        <p className="text-[10px] text-gray-400 leading-snug">{template.description}</p>
      </div>
    </button>
  );
}

function TemplateMiniPreview({ id }: { id: TemplateId }) {
  if (id === 'classic') {
    return (
      <div className="p-2 scale-[0.28] origin-top-left w-[357%] h-[357%]">
        <div className="text-center border-b-2 border-gray-700 pb-3 mb-3">
          <div className="h-4 w-32 bg-gray-800 rounded mx-auto mb-1"></div>
          <div className="h-2 w-20 bg-gray-400 rounded mx-auto mb-2"></div>
          <div className="flex justify-center gap-3">
            <div className="h-1.5 w-16 bg-gray-300 rounded"></div>
            <div className="h-1.5 w-16 bg-gray-300 rounded"></div>
          </div>
        </div>
        <div className="mb-3">
          <div className="h-1.5 w-24 bg-gray-700 rounded mb-2"></div>
          <div className="space-y-1">
            <div className="h-1.5 w-full bg-gray-200 rounded"></div>
            <div className="h-1.5 w-5/6 bg-gray-200 rounded"></div>
          </div>
        </div>
        <div className="mb-3">
          <div className="h-1.5 w-28 bg-gray-700 rounded mb-2"></div>
          <div className="space-y-1">
            <div className="h-1.5 w-full bg-gray-200 rounded"></div>
            <div className="h-1.5 w-4/5 bg-gray-200 rounded"></div>
            <div className="h-1.5 w-full bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }
  if (id === 'modern') {
    return (
      <div className="flex h-full scale-[0.28] origin-top-left w-[357%] h-[357%]">
        <div className="w-20 bg-teal-700 p-2 flex-shrink-0">
          <div className="w-8 h-8 rounded-full bg-white/30 mx-auto mb-2"></div>
          <div className="h-1.5 w-12 bg-teal-300 rounded mb-1 mx-auto"></div>
          <div className="h-1 w-10 bg-teal-400/60 rounded mx-auto mb-3"></div>
          <div className="space-y-1.5">
            <div className="h-1 w-full bg-teal-500/50 rounded"></div>
            <div className="h-1 w-full bg-teal-500/50 rounded"></div>
            <div className="h-1 w-4/5 bg-teal-500/50 rounded"></div>
          </div>
        </div>
        <div className="flex-1 p-2">
          <div className="h-1.5 w-16 bg-teal-600 rounded mb-2"></div>
          <div className="space-y-1 mb-3">
            <div className="h-1 w-full bg-gray-200 rounded"></div>
            <div className="h-1 w-5/6 bg-gray-200 rounded"></div>
          </div>
          <div className="h-1.5 w-20 bg-teal-600 rounded mb-2"></div>
          <div className="pl-2 border-l-2 border-teal-200 space-y-1">
            <div className="h-1.5 w-20 bg-gray-700 rounded"></div>
            <div className="h-1 w-full bg-gray-200 rounded"></div>
            <div className="h-1 w-4/5 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }
  if (id === 'minimal') {
    return (
      <div className="p-3 scale-[0.28] origin-top-left w-[357%] h-[357%]">
        <div className="mb-3">
          <div className="h-5 w-28 bg-gray-200 rounded mb-1"></div>
          <div className="h-2 w-16 bg-gray-100 rounded mb-2"></div>
          <div className="h-px bg-gray-100 w-full"></div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div className="col-span-2 space-y-2">
            <div className="h-1 w-10 bg-gray-200 rounded"></div>
            <div className="h-1 w-full bg-gray-100 rounded"></div>
            <div className="h-1 w-5/6 bg-gray-100 rounded"></div>
            <div className="h-1 w-10 bg-gray-200 rounded mt-2"></div>
            <div className="h-1 w-full bg-gray-100 rounded"></div>
            <div className="h-1 w-4/5 bg-gray-100 rounded"></div>
          </div>
          <div className="space-y-1.5">
            <div className="h-1 w-8 bg-gray-200 rounded"></div>
            <div className="h-1 w-full bg-gray-100 rounded"></div>
            <div className="h-1 w-full bg-gray-100 rounded"></div>
            <div className="h-1 w-4/5 bg-gray-100 rounded"></div>
          </div>
        </div>
      </div>
    );
  }
  if (id === 'executive') {
    return (
      <div className="scale-[0.28] origin-top-left w-[357%] h-[357%]">
        <div className="bg-gray-900 p-3 mb-2">
          <div className="h-4 w-24 bg-white/80 rounded mb-1"></div>
          <div className="h-2 w-16 bg-teal-400/70 rounded mb-2"></div>
          <div className="flex gap-2">
            <div className="h-1 w-16 bg-white/30 rounded"></div>
            <div className="h-1 w-16 bg-white/30 rounded"></div>
          </div>
        </div>
        <div className="px-3">
          <div className="bg-teal-50 border-l-4 border-teal-500 p-2 mb-2">
            <div className="h-1 w-full bg-teal-200 rounded"></div>
            <div className="h-1 w-5/6 bg-teal-200 rounded mt-1"></div>
          </div>
          <div className="flex flex-wrap gap-1 mb-2">
            {[1,2,3,4].map(i => <div key={i} className="h-3 w-10 bg-gray-800 rounded"></div>)}
          </div>
          <div className="grid grid-cols-4 gap-1">
            <div className="text-right"><div className="h-2 w-full bg-teal-100 rounded"></div></div>
            <div className="col-span-3 border-l-2 border-gray-100 pl-1 space-y-1">
              <div className="h-1.5 w-20 bg-gray-700 rounded"></div>
              <div className="h-1 w-full bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  if (id === 'creative') {
    return (
      <div className="scale-[0.28] origin-top-left w-[357%] h-[357%]">
        <div className="grid grid-cols-5 h-16">
          <div className="col-span-3 bg-gradient-to-br from-teal-600 to-emerald-700 p-2 flex flex-col justify-center">
            <div className="h-3 w-16 bg-white/80 rounded mb-1"></div>
            <div className="h-1.5 w-12 bg-teal-200/70 rounded"></div>
          </div>
          <div className="col-span-2 bg-gray-50 p-2 space-y-1">
            <div className="h-1 w-full bg-gray-200 rounded"></div>
            <div className="h-1 w-full bg-gray-200 rounded"></div>
            <div className="h-1 w-4/5 bg-gray-200 rounded"></div>
          </div>
        </div>
        <div className="grid grid-cols-5">
          <div className="col-span-3 p-2 space-y-1.5">
            <div className="h-1.5 w-12 bg-teal-600 rounded"></div>
            <div className="h-1 w-full bg-gray-200 rounded"></div>
            <div className="h-1 w-5/6 bg-gray-200 rounded"></div>
            <div className="h-1.5 w-16 bg-teal-600 rounded mt-1"></div>
            <div className="h-1 w-full bg-gray-200 rounded"></div>
            <div className="h-1 w-4/5 bg-gray-200 rounded"></div>
          </div>
          <div className="col-span-2 bg-gray-50 p-2 space-y-1">
            <div className="h-1.5 w-10 bg-emerald-600 rounded"></div>
            <div className="flex flex-wrap gap-0.5">
              {[1,2,3,4,5].map(i => <div key={i} className="h-2 w-8 bg-teal-100 rounded"></div>)}
            </div>
          </div>
        </div>
      </div>
    );
  }
  // compact
  return (
    <div className="p-2 scale-[0.28] origin-top-left w-[357%] h-[357%]">
      <div className="flex justify-between border-b-4 border-teal-500 pb-2 mb-2">
        <div>
          <div className="h-3 w-20 bg-gray-800 rounded mb-1"></div>
          <div className="h-1.5 w-14 bg-teal-500 rounded"></div>
        </div>
        <div className="space-y-1 text-right">
          <div className="h-1 w-16 bg-gray-300 rounded"></div>
          <div className="h-1 w-12 bg-gray-300 rounded"></div>
        </div>
      </div>
      <div className="flex flex-wrap gap-1 mb-2">
        {[1,2,3,4,5].map(i => <div key={i} className="h-2.5 w-10 bg-teal-50 border border-teal-200 rounded"></div>)}
      </div>
      <div className="grid grid-cols-4 gap-1">
        <div className="space-y-1">
          <div className="h-1.5 w-full bg-teal-500 rounded"></div>
          <div className="h-1 w-full bg-gray-200 rounded"></div>
        </div>
        <div className="col-span-3 space-y-1">
          <div className="h-1.5 w-20 bg-gray-700 rounded"></div>
          <div className="h-1 w-full bg-gray-200 rounded"></div>
          <div className="h-1 w-5/6 bg-gray-200 rounded"></div>
        </div>
      </div>
    </div>
  );
}

function ResumeRenderer({ templateId, data }: { templateId: TemplateId; data: ResumeData }) {
  switch (templateId) {
    case 'classic': return <TemplateClassic data={data} />;
    case 'modern': return <TemplateModern data={data} />;
    case 'minimal': return <TemplateMinimal data={data} />;
    case 'executive': return <TemplateExecutive data={data} />;
    case 'creative': return <TemplateCreative data={data} />;
    case 'compact': return <TemplateCompact data={data} />;
    default: return <TemplateClassic data={data} />;
  }
}

export default function OptimizedResumePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateId>('modern');
  const [resumeData, setResumeData] = useState<ResumeData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load resume data from location state or use mock data
  useEffect(() => {
    if (location.state?.optimizedResume) {
      // Parse the optimized resume data from API response
      const apiData = location.state.optimizedResume;
      
      // Transform API response to ResumeData format
      const transformedData: ResumeData = {
        name: apiData.name || 'Your Name',
        title: apiData.title || apiData.professional_summary?.split(' ')[0] || 'Professional',
        email: apiData.email || 'your.email@example.com',
        phone: apiData.phone || '(555) 123-4567',
        linkedin: apiData.linkedin || 'linkedin.com/in/yourname',
        location: apiData.location || 'City, State',
        summary: apiData.professional_summary || '',
        experience: apiData.experience?.map((exp: any) => ({
          role: exp.role || exp.title || '',
          company: exp.company || '',
          location: exp.location || '',
          period: exp.period || exp.dates || '',
          bullets: Array.isArray(exp.bullets) ? exp.bullets : exp.achievements || []
        })) || [],
        skills: Array.isArray(apiData.skills) ? apiData.skills : 
                apiData.skills?.technical || [],
        education: apiData.education?.map((edu: any) => ({
          degree: edu.degree || '',
          school: edu.school || edu.institution || '',
          period: edu.period || edu.year || ''
        })) || []
      };
      
      setResumeData(transformedData);
    } else {
      // Use mock data if no optimization result available
      setResumeData({
        name: 'Sarah Mitchell',
        title: 'Senior Product Manager',
        email: 'sarah.mitchell@email.com',
        phone: '(555) 123-4567',
        linkedin: 'linkedin.com/in/sarahmitchell',
        location: 'San Francisco, CA',
        summary:
          'Results-driven Senior Product Manager with 8+ years of experience leading cross-functional teams to deliver innovative SaaS products. Proven track record of driving product strategy, conducting user research, and implementing agile methodologies to achieve 40% increase in user engagement and 25% revenue growth.',
        experience: [
          {
            role: 'Senior Product Manager',
            company: 'TechCorp Solutions',
            location: 'San Francisco, CA',
            period: '2020 – Present',
            bullets: [
              'Led product strategy for flagship SaaS platform, resulting in 40% increase in user engagement',
              'Managed cross-functional team of 12 engineers, designers, and analysts',
              'Drove $2M in additional ARR through new feature development'
            ]
          },
          {
            role: 'Product Manager',
            company: 'InnovateTech',
            location: 'San Jose, CA',
            period: '2018 – 2020',
            bullets: [
              'Launched 3 major product features that increased customer retention by 25%',
              'Conducted user research with 100+ customers to inform product roadmap',
              'Implemented agile methodologies, reducing time-to-market by 30%'
            ]
          }
        ],
        skills: ['Product Management', 'Agile/Scrum', 'User Research', 'Data Analysis', 'Roadmap Planning', 'A/B Testing'],
        education: [
          {
            degree: 'MBA',
            school: 'Stanford Graduate School of Business',
            period: '2018'
          },
          {
            degree: 'BS in Computer Science',
            school: 'University of California, Berkeley',
            period: '2014'
          }
        ]
      });
    }
    setIsLoading(false);
  }, [location.state]);

  const handleStartOver = () => navigate('/');

  if (isLoading || !resumeData) {
    return (
      <div className="min-h-screen mesh-bg flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your optimized resume...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen mesh-bg relative overflow-hidden">
      <div className="orb orb-teal absolute top-0 left-1/4 w-96 h-96 opacity-60"></div>
      <div className="orb orb-emerald absolute bottom-0 right-1/4 w-96 h-96 opacity-50"></div>

      <Navbar />

      <main className="relative pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">

          {/* Header */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card mb-4">
              <i className="ri-sparkling-fill text-teal-500 text-lg"></i>
              <span className="text-sm font-semibold text-gray-700">Optimization Complete — 94% ATS Match</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
              Your Optimized Resume
            </h1>
            <p className="text-base text-gray-500 max-w-xl mx-auto">
              Choose a layout that fits your style. Every template is ATS-safe and fully optimized.
            </p>
          </div>

          {/* Main layout: template picker left, preview center, summary right */}
          <div className="grid lg:grid-cols-12 gap-6">

            {/* Template Picker — left column */}
            <div className="lg:col-span-3">
              <div className="glass-card rounded-2xl p-4 sticky top-24">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-7 h-7 flex items-center justify-center rounded-lg bg-teal-50 text-teal-600">
                    <i className="ri-palette-line text-base"></i>
                  </div>
                  <p className="text-sm font-bold text-gray-800">Choose Template</p>
                </div>
                <div className="grid grid-cols-1 gap-3">
                  {templates.map((t) => (
                    <TemplateThumbnail
                      key={t.id}
                      template={t}
                      isSelected={selectedTemplate === t.id}
                      onClick={() => setSelectedTemplate(t.id)}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Resume Preview — center */}
            <div className="lg:col-span-6">
              <div className="glass-card rounded-2xl p-4 mb-4 relative">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-sm ${templates.find(t => t.id === selectedTemplate)?.accent}`}></div>
                    <span className="text-sm font-bold text-gray-800">
                      {templates.find(t => t.id === selectedTemplate)?.name} Template
                    </span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${templates.find(t => t.id === selectedTemplate)?.tagColor}`}>
                      {templates.find(t => t.id === selectedTemplate)?.tag}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-400">
                    <i className="ri-eye-line"></i>
                    <span>Live Preview</span>
                  </div>
                </div>
                {/* Resume paper with editor */}
                <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 transition-all duration-300 relative">
                  <ResumeEditor
                    data={resumeData}
                    onDataChange={setResumeData}
                    templateId={selectedTemplate}
                  >
                    <ResumeRenderer templateId={selectedTemplate} data={resumeData} />
                  </ResumeEditor>
                </div>
              </div>
            </div>

            {/* Right panel — ATS score + actions */}
            <div className="lg:col-span-3 space-y-4">

              {/* ATS Score */}
              <div className="glass-card rounded-2xl p-5">
                <div className="text-center mb-4">
                  <div className="relative w-20 h-20 mx-auto mb-3">
                    <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
                      <circle cx="40" cy="40" r="34" fill="none" stroke="#e5e7eb" strokeWidth="7" />
                      <circle
                        cx="40" cy="40" r="34" fill="none"
                        stroke="url(#atsGrad)" strokeWidth="7"
                        strokeDasharray="213.6"
                        strokeDashoffset="12.8"
                        strokeLinecap="round"
                      />
                      <defs>
                        <linearGradient id="atsGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#0d9488" />
                          <stop offset="100%" stopColor="#10b981" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-xl font-black text-gray-900">94%</span>
                    </div>
                  </div>
                  <h3 className="text-sm font-bold text-gray-900">Excellent ATS Match</h3>
                  <p className="text-xs text-gray-500 mt-1">Your resume is highly optimized for applicant tracking systems</p>
                </div>
                <div className="space-y-2">
                  {[
                    { label: 'Keyword Match', value: 94 },
                    { label: 'Format Score', value: 98 },
                    { label: 'Readability', value: 91 },
                  ].map((item) => (
                    <div key={item.label}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-600">{item.label}</span>
                        <span className="font-semibold text-teal-600">{item.value}%</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-teal-500 to-emerald-400 rounded-full"
                          style={{ width: `${item.value}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Keywords */}
              <div className="glass-card rounded-2xl p-5">
                <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <i className="ri-key-2-line text-teal-500"></i>
                  Keywords Matched
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {keywords.map((kw, i) => (
                    <span key={i} className="px-2 py-1 bg-teal-50 text-teal-700 text-[10px] font-semibold rounded-lg border border-teal-100">
                      {kw}
                    </span>
                  ))}
                </div>
              </div>

              {/* Improvements */}
              <div className="glass-card rounded-2xl p-5">
                <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <i className="ri-checkbox-circle-line text-emerald-500"></i>
                  Improvements Made
                </h3>
                <div className="space-y-2.5">
                  {improvements.map((item, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <div className={`w-6 h-6 flex items-center justify-center rounded-md bg-gray-50 ${item.color} flex-shrink-0`}>
                        <i className={`${item.icon} text-xs`}></i>
                      </div>
                      <p className="text-xs text-gray-600 leading-relaxed">{item.text}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-2.5">
                <button
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-500 text-white text-sm font-semibold shadow-lg shadow-teal-500/25 hover:shadow-teal-500/40 hover:scale-[1.02] transition-all whitespace-nowrap cursor-pointer"
                >
                  <i className="ri-download-2-line mr-2"></i>
                  Download Resume
                </button>
                <button
                  onClick={handleStartOver}
                  className="w-full py-3 rounded-xl glass hover:bg-white/60 text-gray-700 text-sm font-semibold transition-all whitespace-nowrap cursor-pointer"
                >
                  <i className="ri-refresh-line mr-2"></i>
                  Start Over
                </button>
              </div>
            </div>

          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

import { useState, useRef, useEffect, useCallback } from 'react';
import { ResumeData, SectionId, ResumeSection, ColorTheme, TemplateId } from '../types';
import { RESUME_TEMPLATES, getDefaultTheme } from './themes';
import TemplatePicker from './TemplatePicker';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import PaymentModal from '../../../components/PaymentModal';
import paymentService, { PlanInfo, SubscriptionInfo } from '../../../services/paymentService';
import { authFetch } from '../../../services/authFetch';

/* ══════════════════════════════════════════════
   Editable Text — click-to-edit with contentEditable
   ══════════════════════════════════════════════ */
function EditableText({
  value,
  onChange,
  tag = 'span',
  className = '',
  placeholder = 'Click to edit',
  multiline = false,
  style,
}: {
  value: string;
  onChange: (v: string) => void;
  tag?: string;
  className?: string;
  placeholder?: string;
  multiline?: boolean;
  style?: React.CSSProperties;
}) {
  const ref = useRef<HTMLElement>(null);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (ref.current && !editing) ref.current.textContent = value;
  }, [value, editing]);

  const Tag = tag as any;

  return (
    <Tag
      ref={ref}
      contentEditable
      suppressContentEditableWarning
      className={`outline-none transition-all cursor-text ${
        editing
          ? 'ring-2 ring-blue-400/60 ring-offset-1 rounded-sm bg-blue-50/40'
          : 'hover:bg-blue-50/20 hover:ring-1 hover:ring-blue-200/50 rounded-sm'
      } ${!value ? 'text-gray-400 italic' : ''} ${className}`}
      style={{ minWidth: 20, minHeight: '1em', ...style }}
      onFocus={() => setEditing(true)}
      onBlur={(e: any) => {
        setEditing(false);
        const text = multiline ? e.target.innerText : e.target.textContent;
        if (text !== value) onChange(text || '');
      }}
      onKeyDown={(e: React.KeyboardEvent) => {
        if (!multiline && e.key === 'Enter') {
          e.preventDefault();
          (e.target as HTMLElement).blur();
        }
      }}
      data-placeholder={placeholder}
    />
  );
}

/* ══════════════════════════════════════════════
   Section Wrapper with move / hide controls
   ══════════════════════════════════════════════ */
function SectionWrapper({
  section,
  index,
  total,
  onMove,
  onToggle,
  children,
}: {
  section: ResumeSection;
  index: number;
  total: number;
  onMove: (id: SectionId, dir: 'up' | 'down') => void;
  onToggle: (id: SectionId) => void;
  children: React.ReactNode;
}) {
  const [hovering, setHovering] = useState(false);

  return (
    <div className="relative group" onMouseEnter={() => setHovering(true)} onMouseLeave={() => setHovering(false)}>
      <div
        className={`absolute -left-10 top-0 flex flex-col items-center gap-0.5 transition-opacity duration-150 ${hovering ? 'opacity-100' : 'opacity-0'}`}
        style={{ zIndex: 20 }}
      >
        <button onClick={() => onMove(section.id, 'up')} disabled={index === 0} className="w-6 h-6 flex items-center justify-center rounded bg-white shadow border border-gray-200 text-gray-500 hover:text-blue-600 disabled:opacity-30 text-[10px]"><i className="ri-arrow-up-s-line" /></button>
        <button onClick={() => onMove(section.id, 'down')} disabled={index === total - 1} className="w-6 h-6 flex items-center justify-center rounded bg-white shadow border border-gray-200 text-gray-500 hover:text-blue-600 disabled:opacity-30 text-[10px]"><i className="ri-arrow-down-s-line" /></button>
        <button onClick={() => onToggle(section.id)} className="w-6 h-6 flex items-center justify-center rounded bg-white shadow border border-gray-200 text-red-400 hover:text-red-600 text-[10px] mt-0.5"><i className="ri-eye-off-line" /></button>
      </div>
      {children}
    </div>
  );
}

/* ══════════════════════════════════════════════
   Shared section-content renderers
   ══════════════════════════════════════════════ */

/* Heading helper — each template calls this with different styling */
function SectionHeading({ label, icon, color, borderColor, style }: { label: string; icon: string; color: string; borderColor: string; style?: 'underline' | 'pill' | 'side' | 'caps' }) {
  if (style === 'pill') {
    return (
      <h3 className="text-[10px] font-bold uppercase tracking-[0.25em] px-3 py-1 rounded-full inline-flex items-center gap-1.5 mb-2.5" style={{ backgroundColor: borderColor, color: '#fff' }}>
        <i className={`${icon} text-[9px]`} />
        {label}
      </h3>
    );
  }
  if (style === 'side') {
    return (
      <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] mb-2 pl-3 border-l-[3px] flex items-center gap-1.5" style={{ color, borderColor }}>
        <i className={`${icon} text-[9px]`} />
        {label}
      </h3>
    );
  }
  if (style === 'caps') {
    return (
      <h3 className="text-[11px] font-bold uppercase tracking-[0.25em] mb-2 pb-0.5 flex items-center gap-1.5" style={{ color }}>
        {label}
      </h3>
    );
  }
  /* default: underline */
  return (
    <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] mb-2 pb-1.5 border-b-2 flex items-center gap-1.5" style={{ color, borderColor }}>
      <i className={`${icon} text-[9px]`} />
      {label}
    </h3>
  );
}

/* ══════════════════════════════════════════════
   Main Component
   ══════════════════════════════════════════════ */
export default function InlineResumeEditor({
  data,
  onDataChange,
}: {
  data: ResumeData;
  onDataChange: (d: ResumeData) => void;
}) {
  const [templateId, setTemplateId] = useState<TemplateId>('classic');
  const template = RESUME_TEMPLATES.find((t) => t.id === templateId)!;
  const [theme, setTheme] = useState<ColorTheme>(template.colors[0]);
  const [showAddSection, setShowAddSection] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved' | 'error'>('idle');
  const resumeRef = useRef<HTMLDivElement>(null);

  // Payment gating state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [hasPaymentAccess, setHasPaymentAccess] = useState(false);
  const [accessType, setAccessType] = useState<string | null>(null);
  const [freeDownloadsRemaining, setFreeDownloadsRemaining] = useState(0);
  const [activeSubscription, setActiveSubscription] = useState<SubscriptionInfo | null>(null);
  const [plans, setPlans] = useState<PlanInfo[]>([]);
  const [resumeId, setResumeId] = useState<number | null>(null);
  const [isClaimingFree, setIsClaimingFree] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(true);

  const [sections, setSections] = useState<ResumeSection[]>([
    { id: 'summary', label: 'Professional Summary', icon: 'ri-file-text-line', visible: true },
    { id: 'experience', label: 'Work Experience', icon: 'ri-briefcase-line', visible: true },
    { id: 'skills', label: 'Skills', icon: 'ri-tools-line', visible: true },
    { id: 'education', label: 'Education', icon: 'ri-graduation-cap-line', visible: true },
  ]);

  const visibleSections = sections.filter((s) => s.visible);

  // Check payment access on mount
  useEffect(() => {
    const checkAccess = async () => {
      try {
        const raw = sessionStorage.getItem('optimizationData');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed.resumeId) {
            setResumeId(parsed.resumeId);
            const access = await paymentService.checkAccess(parsed.resumeId);
            setHasPaymentAccess(access.has_access);
            setAccessType(access.access_type);
            setFreeDownloadsRemaining(access.free_downloads_remaining);
            setActiveSubscription(access.active_subscription);
            setPlans(access.plans);
          }
        }
      } catch (error) {
        console.error('Error checking payment access:', error);
        // On error, block access (fail-closed)
        setHasPaymentAccess(false);
      } finally {
        setPaymentLoading(false);
      }
    };
    checkAccess();
  }, []);

  /* Switch template → pick first color of that template */
  const switchTemplate = (id: TemplateId) => {
    setTemplateId(id);
    const tpl = RESUME_TEMPLATES.find((t) => t.id === id)!;
    setTheme(tpl.colors[0]);
  };

  /* ─── data helpers ─── */
  const update = useCallback(
    (field: keyof ResumeData, value: any) => onDataChange({ ...data, [field]: value }),
    [data, onDataChange],
  );
  const updateExp = useCallback(
    (idx: number, field: string, value: any) => {
      const exp = [...data.experience];
      exp[idx] = { ...exp[idx], [field]: value };
      onDataChange({ ...data, experience: exp });
    },
    [data, onDataChange],
  );
  const updateBullet = useCallback(
    (eIdx: number, bIdx: number, value: string) => {
      const exp = [...data.experience];
      exp[eIdx] = { ...exp[eIdx], bullets: exp[eIdx].bullets.map((b, i) => (i === bIdx ? value : b)) };
      onDataChange({ ...data, experience: exp });
    },
    [data, onDataChange],
  );

  /* ─── section management ─── */
  const moveSection = (id: SectionId, dir: 'up' | 'down') => {
    setSections((prev) => {
      const idx = prev.findIndex((s) => s.id === id);
      const target = dir === 'up' ? idx - 1 : idx + 1;
      if (target < 0 || target >= prev.length) return prev;
      const copy = [...prev];
      [copy[idx], copy[target]] = [copy[target], copy[idx]];
      return copy;
    });
  };
  const toggleSection = (id: SectionId) => setSections((prev) => prev.map((s) => (s.id === id ? { ...s, visible: !s.visible } : s)));

  /* ─── experience CRUD ─── */
  const addExperience = () =>
    onDataChange({
      ...data,
      experience: [...data.experience, { role: 'Job Title', company: 'Company Name', location: 'City, State', period: '2024 – Present', bullets: ['Describe your achievement'] }],
    });
  const removeExperience = (idx: number) => onDataChange({ ...data, experience: data.experience.filter((_, i) => i !== idx) });
  const moveExperience = (idx: number, dir: 'up' | 'down') => {
    const exp = [...data.experience];
    const t = dir === 'up' ? idx - 1 : idx + 1;
    if (t < 0 || t >= exp.length) return;
    [exp[idx], exp[t]] = [exp[t], exp[idx]];
    onDataChange({ ...data, experience: exp });
  };
  const addBullet = (eIdx: number) => {
    const exp = [...data.experience];
    exp[eIdx] = { ...exp[eIdx], bullets: [...exp[eIdx].bullets, 'New achievement'] };
    onDataChange({ ...data, experience: exp });
  };
  const removeBullet = (eIdx: number, bIdx: number) => {
    const exp = [...data.experience];
    exp[eIdx] = { ...exp[eIdx], bullets: exp[eIdx].bullets.filter((_, i) => i !== bIdx) };
    onDataChange({ ...data, experience: exp });
  };

  /* ─── education CRUD ─── */
  const addEducation = () => onDataChange({ ...data, education: [...data.education, { degree: 'Degree', school: 'University', period: 'Year' }] });
  const removeEducation = (idx: number) => onDataChange({ ...data, education: data.education.filter((_, i) => i !== idx) });

  /* ─── skills CRUD ─── */
  const addSkill = () => onDataChange({ ...data, skills: [...data.skills, 'New Skill'] });
  const removeSkill = (idx: number) => onDataChange({ ...data, skills: data.skills.filter((_, i) => i !== idx) });
  const updateSkill = (idx: number, value: string) => {
    const skills = [...data.skills];
    skills[idx] = value;
    onDataChange({ ...data, skills });
  };

  /* ─── save ─── */
  const saveToDatabase = async () => {
    setIsSaving(true);
    setSaveStatus('idle');
    try {
      const raw = sessionStorage.getItem('optimizationData');
      if (!raw) { setIsSaving(false); return; }
      const parsed = JSON.parse(raw);
      if (!parsed.resumeId) { setIsSaving(false); return; }

      const res = await authFetch(`${import.meta.env.VITE_API_URL}/resume/${parsed.resumeId}/save-edited`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, template_id: `${templateId}-${theme.id}` }),
      });
      setSaveStatus(res.ok ? 'saved' : 'error');
      if (res.ok) setTimeout(() => setSaveStatus('idle'), 2000);
    } catch {
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
    }
  };

  /* ─── download PDF (with payment gate) ─── */
  const handleDownloadPDF = async () => {
    // Case 1: Already has access (subscription, per-resume payment, or gateway not configured)
    if (hasPaymentAccess && accessType !== 'free') {
      await performDownload();
      return;
    }

    // Case 2: Free download available — claim it
    if (hasPaymentAccess && accessType === 'free' && freeDownloadsRemaining > 0 && resumeId) {
      setIsClaimingFree(true);
      try {
        const result = await paymentService.useFreeDownload(resumeId);
        if (result.success) {
          setFreeDownloadsRemaining(result.free_downloads_remaining);
          setHasPaymentAccess(true);
          setAccessType('per_resume');
          await performDownload();
        }
      } catch (error) {
        console.error('Free download claim failed:', error);
        setShowPaymentModal(true);
      } finally {
        setIsClaimingFree(false);
      }
      return;
    }

    // Case 3: Payment required — show pricing modal
    if (resumeId) {
      setShowPaymentModal(true);
    }
  };

  const handlePaymentSuccess = (subscriptionActivated?: boolean) => {
    setHasPaymentAccess(true);
    setAccessType(subscriptionActivated ? 'subscription' : 'per_resume');
    setShowPaymentModal(false);
    performDownload();
  };

  const performDownload = async () => {
    setIsDownloading(true);
    try {
      await saveToDatabase();
      const el = resumeRef.current;
      if (!el) return;

      const canvas = await html2canvas(el, { scale: 2, useCORS: true, logging: false, backgroundColor: '#ffffff' });
      const imgData = canvas.toDataURL('image/png');

      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 0; // edge-to-edge

      // Scale image to fit page width
      const imgWidth = pageWidth - margin * 2;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      // If it fits on one page, just add it
      if (imgHeight <= pageHeight) {
        pdf.addImage(imgData, 'PNG', margin, 0, imgWidth, imgHeight);
      } else {
        // Multi-page: slice the canvas into page-sized chunks
        const scaledPageHeight = (pageHeight * canvas.width) / imgWidth;
        let yOffset = 0;
        let pageNum = 0;

        while (yOffset < canvas.height) {
          if (pageNum > 0) pdf.addPage();

          // Create a slice of the canvas for this page
          const sliceHeight = Math.min(scaledPageHeight, canvas.height - yOffset);
          const pageCanvas = document.createElement('canvas');
          pageCanvas.width = canvas.width;
          pageCanvas.height = sliceHeight;
          const ctx = pageCanvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(canvas, 0, yOffset, canvas.width, sliceHeight, 0, 0, canvas.width, sliceHeight);
            const pageImgData = pageCanvas.toDataURL('image/png');
            const renderedHeight = (sliceHeight * imgWidth) / canvas.width;
            pdf.addImage(pageImgData, 'PNG', margin, 0, imgWidth, renderedHeight);
          }

          yOffset += scaledPageHeight;
          pageNum++;
        }
      }

      pdf.save(`${data.name.replace(/\s+/g, '_')}_Resume.pdf`);
    } catch (err) {
      console.error('PDF download failed:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  /* ════════════════════════════════════════════
     Reusable content blocks — used by templates
     ════════════════════════════════════════════ */

  const ContactRow = ({ color, separator = '·' }: { color: string; separator?: string }) => (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px]" style={{ color }}>
      <span className="flex items-center gap-1"><i className="ri-mail-line" /><EditableText value={data.email} onChange={(v) => update('email', v)} placeholder="email" /></span>
      <span>{separator}</span>
      <span className="flex items-center gap-1"><i className="ri-phone-line" /><EditableText value={data.phone} onChange={(v) => update('phone', v)} placeholder="Phone" /></span>
      <span>{separator}</span>
      <span className="flex items-center gap-1"><i className="ri-linkedin-box-line" /><EditableText value={data.linkedin} onChange={(v) => update('linkedin', v)} placeholder="LinkedIn" /></span>
      <span>{separator}</span>
      <span className="flex items-center gap-1"><i className="ri-map-pin-line" /><EditableText value={data.location} onChange={(v) => update('location', v)} placeholder="Location" /></span>
    </div>
  );

  const SummaryBlock = ({ headingStyle }: { headingStyle?: 'underline' | 'pill' | 'side' | 'caps' }) => (
    <div className="mb-5">
      <SectionHeading label="Professional Summary" icon="ri-file-text-line" color={theme.sectionLine} borderColor={theme.sectionLine} style={headingStyle} />
      <EditableText value={data.summary} onChange={(v) => update('summary', v)} tag="p" className="text-[11px] leading-[1.65] text-gray-600" placeholder="Write a compelling summary..." multiline />
    </div>
  );

  const ExperienceBlock = ({ headingStyle }: { headingStyle?: 'underline' | 'pill' | 'side' | 'caps' }) => (
    <div className="mb-5">
      <div className="flex items-center justify-between">
        <SectionHeading label="Work Experience" icon="ri-briefcase-line" color={theme.sectionLine} borderColor={theme.sectionLine} style={headingStyle} />
        <button onClick={addExperience} className="opacity-0 group-hover:opacity-100 text-[10px] px-2 py-0.5 rounded bg-gray-100 text-gray-600 hover:bg-blue-100 hover:text-blue-700 font-medium"><i className="ri-add-line mr-0.5" />Add</button>
      </div>
      <div className="space-y-4 mt-1">
        {data.experience.map((exp, i) => (
          <div key={i} className="relative group/exp pl-3 border-l-2" style={{ borderColor: `${theme.bulletColor}30` }}>
            <div className="absolute -right-1 top-0 flex items-center gap-0.5 opacity-0 group-hover/exp:opacity-100 transition-opacity">
              {i > 0 && <button onClick={() => moveExperience(i, 'up')} className="w-5 h-5 flex items-center justify-center rounded bg-white shadow border border-gray-200 text-gray-400 hover:text-blue-600 text-[10px]"><i className="ri-arrow-up-s-line" /></button>}
              {i < data.experience.length - 1 && <button onClick={() => moveExperience(i, 'down')} className="w-5 h-5 flex items-center justify-center rounded bg-white shadow border border-gray-200 text-gray-400 hover:text-blue-600 text-[10px]"><i className="ri-arrow-down-s-line" /></button>}
              {data.experience.length > 1 && <button onClick={() => removeExperience(i)} className="w-5 h-5 flex items-center justify-center rounded bg-white shadow border border-gray-200 text-red-400 hover:text-red-600 text-[10px]"><i className="ri-delete-bin-line" /></button>}
            </div>
            <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full" style={{ backgroundColor: theme.bulletColor }} />
            <div className="flex items-start justify-between mb-0.5">
              <div className="flex-1 min-w-0">
                <EditableText value={exp.role} onChange={(v) => updateExp(i, 'role', v)} tag="h4" className="text-[12px] font-bold text-gray-900" placeholder="Job Title" />
                <div className="flex items-center gap-1 text-[11px]">
                  <EditableText value={exp.company} onChange={(v) => updateExp(i, 'company', v)} className="font-semibold" style={{ color: theme.bulletColor }} placeholder="Company" />
                  <span className="text-gray-400">·</span>
                  <EditableText value={exp.location} onChange={(v) => updateExp(i, 'location', v)} className="text-gray-500" placeholder="Location" />
                </div>
              </div>
              <EditableText value={exp.period} onChange={(v) => updateExp(i, 'period', v)} className="text-[10px] text-gray-400 whitespace-nowrap ml-3 flex-shrink-0 bg-gray-50 px-2 py-0.5 rounded-full" placeholder="Period" />
            </div>
            <ul className="mt-1.5 space-y-1">
              {exp.bullets.map((b, j) => (
                <li key={j} className="flex items-start gap-1.5 group/bullet text-[11px] text-gray-600">
                  <span className="mt-[5px] flex-shrink-0 w-1 h-1 rounded-full" style={{ backgroundColor: theme.bulletColor }} />
                  <EditableText value={b} onChange={(v) => updateBullet(i, j, v)} className="flex-1" placeholder="Achievement..." multiline />
                  <button onClick={() => removeBullet(i, j)} className="opacity-0 group-hover/bullet:opacity-100 flex-shrink-0 text-red-400 hover:text-red-600 text-[10px] mt-0.5"><i className="ri-close-line" /></button>
                </li>
              ))}
            </ul>
            <button onClick={() => addBullet(i)} className="opacity-0 group-hover/exp:opacity-100 text-[10px] text-gray-400 hover:text-blue-600 mt-1 ml-2.5"><i className="ri-add-line mr-0.5" />Add bullet</button>
          </div>
        ))}
      </div>
    </div>
  );

  const SkillsBlock = ({ headingStyle, layout = 'tags' }: { headingStyle?: 'underline' | 'pill' | 'side' | 'caps'; layout?: 'tags' | 'list' }) => (
    <div className="mb-5">
      <div className="flex items-center justify-between">
        <SectionHeading label="Skills" icon="ri-tools-line" color={theme.sectionLine} borderColor={theme.sectionLine} style={headingStyle} />
        <button onClick={addSkill} className="opacity-0 group-hover:opacity-100 text-[10px] px-2 py-0.5 rounded bg-gray-100 text-gray-600 hover:bg-blue-100 hover:text-blue-700 font-medium"><i className="ri-add-line mr-0.5" />Add</button>
      </div>
      {layout === 'list' ? (
        <ul className="space-y-1 mt-1">
          {data.skills.map((skill, i) => (
            <li key={i} className="flex items-center gap-1.5 group/skill text-[11px]">
              <span className="w-1 h-1 rounded-full flex-shrink-0" style={{ backgroundColor: theme.bulletColor }} />
              <EditableText value={skill} onChange={(v) => updateSkill(i, v)} className="flex-1" style={{ color: theme.skillText }} placeholder="Skill" />
              <button onClick={() => removeSkill(i)} className="opacity-0 group-hover/skill:opacity-100 text-red-400 hover:text-red-600 text-[10px]"><i className="ri-close-line" /></button>
            </li>
          ))}
        </ul>
      ) : (
        <div className="flex flex-wrap gap-1.5 mt-1">
          {data.skills.map((skill, i) => (
            <div key={i} className="group/skill flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-medium" style={{ backgroundColor: theme.skillBg, color: theme.skillText }}>
              <EditableText value={skill} onChange={(v) => updateSkill(i, v)} className="text-[10px]" placeholder="Skill" />
              <button onClick={() => removeSkill(i)} className="opacity-0 group-hover/skill:opacity-100 text-red-400 hover:text-red-600 text-[10px] -mr-1"><i className="ri-close-line" /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const EducationBlock = ({ headingStyle }: { headingStyle?: 'underline' | 'pill' | 'side' | 'caps' }) => (
    <div className="mb-5">
      <div className="flex items-center justify-between">
        <SectionHeading label="Education" icon="ri-graduation-cap-line" color={theme.sectionLine} borderColor={theme.sectionLine} style={headingStyle} />
        <button onClick={addEducation} className="opacity-0 group-hover:opacity-100 text-[10px] px-2 py-0.5 rounded bg-gray-100 text-gray-600 hover:bg-blue-100 hover:text-blue-700 font-medium"><i className="ri-add-line mr-0.5" />Add</button>
      </div>
      <div className="space-y-2 mt-1">
        {data.education.map((edu, i) => (
          <div key={i} className="flex items-start justify-between group/edu">
            <div className="flex-1">
              <EditableText value={edu.degree} onChange={(v) => { const ed = [...data.education]; ed[i] = { ...ed[i], degree: v }; update('education', ed); }} tag="h4" className="text-[11px] font-bold text-gray-900" placeholder="Degree" />
              <EditableText value={edu.school} onChange={(v) => { const ed = [...data.education]; ed[i] = { ...ed[i], school: v }; update('education', ed); }} className="text-[11px] text-gray-500" placeholder="Institution" />
            </div>
            <div className="flex items-center gap-1 flex-shrink-0 ml-3">
              <EditableText value={edu.period} onChange={(v) => { const ed = [...data.education]; ed[i] = { ...ed[i], period: v }; update('education', ed); }} className="text-[10px] text-gray-400" placeholder="Year" />
              {data.education.length > 1 && <button onClick={() => removeEducation(i)} className="opacity-0 group-hover/edu:opacity-100 text-red-400 hover:text-red-600 text-[10px]"><i className="ri-delete-bin-line" /></button>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  /* Render section by id (for templates that use ordered sections) */
  const renderSection = (section: ResumeSection, sIdx: number, headingStyle?: 'underline' | 'pill' | 'side' | 'caps', skillLayout?: 'tags' | 'list') => {
    const wrap = (child: React.ReactNode) => (
      <SectionWrapper key={section.id} section={section} index={sIdx} total={visibleSections.length} onMove={moveSection} onToggle={toggleSection}>
        {child}
      </SectionWrapper>
    );
    switch (section.id) {
      case 'summary': return wrap(<SummaryBlock headingStyle={headingStyle} />);
      case 'experience': return wrap(<ExperienceBlock headingStyle={headingStyle} />);
      case 'skills': return wrap(<SkillsBlock headingStyle={headingStyle} layout={skillLayout} />);
      case 'education': return wrap(<EducationBlock headingStyle={headingStyle} />);
      default: return null;
    }
  };

  /* ════════════════════════════════════════════
     Template renderers
     ════════════════════════════════════════════ */

  /* ── 1. Classic — colored top header, single column ── */
  const ClassicTemplate = () => (
    <div ref={resumeRef} className="w-[612px] bg-white shadow-2xl rounded-sm overflow-hidden" style={{ fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif" }}>
      <div className="px-8 py-5" style={{ backgroundColor: theme.headerBg }}>
        <EditableText value={data.name} onChange={(v) => update('name', v)} tag="h1" className="text-xl font-bold mb-0.5" style={{ color: theme.headerText }} placeholder="Your Name" />
        <EditableText value={data.title} onChange={(v) => update('title', v)} tag="p" className="text-sm font-medium mb-3 opacity-85" style={{ color: theme.headerText }} placeholder="Professional Title" />
        <ContactRow color={`${theme.headerText}cc`} />
      </div>
      <div className="px-8 py-6">
        {visibleSections.map((s, i) => renderSection(s, i, 'underline', 'tags'))}
      </div>
    </div>
  );

  /* ── 2. Modern — left sidebar, right body ── */
  const ModernTemplate = () => (
    <div ref={resumeRef} className="w-[612px] bg-white shadow-2xl rounded-sm overflow-hidden flex" style={{ fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif" }}>
      {/* Sidebar */}
      <div className="w-[190px] flex-shrink-0 px-5 py-6" style={{ backgroundColor: theme.headerBg }}>
        <EditableText value={data.name} onChange={(v) => update('name', v)} tag="h1" className="text-[16px] font-bold mb-0.5 leading-tight" style={{ color: theme.headerText }} placeholder="Your Name" />
        <EditableText value={data.title} onChange={(v) => update('title', v)} tag="p" className="text-[10px] font-medium mb-5 opacity-80" style={{ color: theme.headerText }} placeholder="Title" />

        {/* Contact */}
        <div className="mb-5">
          <h3 className="text-[9px] font-bold uppercase tracking-[0.25em] mb-2 opacity-60" style={{ color: theme.headerText }}>Contact</h3>
          <div className="space-y-1.5 text-[9px]" style={{ color: `${theme.headerText}cc` }}>
            <div className="flex items-start gap-1.5"><i className="ri-mail-line mt-0.5 flex-shrink-0 text-[8px]" /><EditableText value={data.email} onChange={(v) => update('email', v)} placeholder="Email" /></div>
            <div className="flex items-start gap-1.5"><i className="ri-phone-line mt-0.5 flex-shrink-0 text-[8px]" /><EditableText value={data.phone} onChange={(v) => update('phone', v)} placeholder="Phone" /></div>
            <div className="flex items-start gap-1.5"><i className="ri-linkedin-box-line mt-0.5 flex-shrink-0 text-[8px]" /><EditableText value={data.linkedin} onChange={(v) => update('linkedin', v)} placeholder="LinkedIn" /></div>
            <div className="flex items-start gap-1.5"><i className="ri-map-pin-line mt-0.5 flex-shrink-0 text-[8px]" /><EditableText value={data.location} onChange={(v) => update('location', v)} placeholder="Location" /></div>
          </div>
        </div>

        {/* Skills in sidebar */}
        {visibleSections.find((s) => s.id === 'skills') && (
          <div className="mb-5">
            <h3 className="text-[9px] font-bold uppercase tracking-[0.25em] mb-2 opacity-60" style={{ color: theme.headerText }}>Skills</h3>
            <div className="flex flex-wrap gap-1">
              {data.skills.map((skill, i) => (
                <div key={i} className="group/skill flex items-center gap-0.5 px-2 py-0.5 rounded text-[8px] font-medium" style={{ backgroundColor: 'rgba(255,255,255,0.12)', color: `${theme.headerText}dd` }}>
                  <EditableText value={skill} onChange={(v) => updateSkill(i, v)} className="text-[8px]" placeholder="Skill" />
                  <button onClick={() => removeSkill(i)} className="opacity-0 group-hover/skill:opacity-100 text-red-300 hover:text-red-100 text-[8px]"><i className="ri-close-line" /></button>
                </div>
              ))}
              <button onClick={addSkill} className="opacity-0 group-hover:opacity-100 px-1.5 py-0.5 rounded text-[8px] font-medium" style={{ backgroundColor: 'rgba(255,255,255,0.08)', color: `${theme.headerText}99` }}><i className="ri-add-line" /></button>
            </div>
          </div>
        )}

        {/* Education in sidebar */}
        {visibleSections.find((s) => s.id === 'education') && (
          <div>
            <h3 className="text-[9px] font-bold uppercase tracking-[0.25em] mb-2 opacity-60" style={{ color: theme.headerText }}>Education</h3>
            <div className="space-y-2">
              {data.education.map((edu, i) => (
                <div key={i} className="group/edu">
                  <EditableText value={edu.degree} onChange={(v) => { const ed = [...data.education]; ed[i] = { ...ed[i], degree: v }; update('education', ed); }} tag="p" className="text-[9px] font-bold" style={{ color: theme.headerText }} placeholder="Degree" />
                  <EditableText value={edu.school} onChange={(v) => { const ed = [...data.education]; ed[i] = { ...ed[i], school: v }; update('education', ed); }} tag="p" className="text-[8px] opacity-70" style={{ color: theme.headerText }} placeholder="School" />
                  <EditableText value={edu.period} onChange={(v) => { const ed = [...data.education]; ed[i] = { ...ed[i], period: v }; update('education', ed); }} tag="p" className="text-[8px] opacity-50" style={{ color: theme.headerText }} placeholder="Year" />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Main body — only summary & experience */}
      <div className="flex-1 px-6 py-6">
        {visibleSections
          .filter((s) => s.id === 'summary' || s.id === 'experience')
          .map((s, i) => renderSection(s, i, 'side'))}
      </div>
    </div>
  );

  /* ── 3. Executive — centered name, thin accent line, single column ── */
  const ExecutiveTemplate = () => (
    <div ref={resumeRef} className="w-[612px] bg-white shadow-2xl rounded-sm overflow-hidden" style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}>
      {/* Accent top bar */}
      <div className="h-2" style={{ backgroundColor: theme.primary }} />
      <div className="px-10 pt-6 pb-4 text-center">
        <EditableText value={data.name} onChange={(v) => update('name', v)} tag="h1" className="text-2xl font-bold tracking-wide mb-0.5" style={{ color: theme.primary, fontFamily: "'Georgia', serif" }} placeholder="Your Name" />
        <EditableText value={data.title} onChange={(v) => update('title', v)} tag="p" className="text-[12px] font-normal uppercase tracking-[0.3em] text-gray-500 mb-4" placeholder="Professional Title" />
        <div className="w-16 h-px mx-auto mb-3" style={{ backgroundColor: theme.primary }} />
        <ContactRow color="#6b7280" separator="|" />
      </div>
      <div className="px-10 py-4">
        {visibleSections.map((s, i) => renderSection(s, i, 'caps', 'tags'))}
      </div>
    </div>
  );

  /* ── 4. Minimal — no color header, clean black & white ── */
  const MinimalTemplate = () => (
    <div ref={resumeRef} className="w-[612px] bg-white shadow-2xl rounded-sm overflow-hidden" style={{ fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif" }}>
      <div className="px-8 pt-7 pb-4">
        <EditableText value={data.name} onChange={(v) => update('name', v)} tag="h1" className="text-xl font-extrabold text-gray-900 mb-0.5" placeholder="Your Name" />
        <EditableText value={data.title} onChange={(v) => update('title', v)} tag="p" className="text-[12px] text-gray-500 mb-3" placeholder="Professional Title" />
        <div className="h-px bg-gray-200 mb-3" />
        <ContactRow color="#6b7280" />
      </div>
      <div className="px-8 pb-6">
        {visibleSections.map((s, i) => renderSection(s, i, 'underline', 'tags'))}
      </div>
    </div>
  );

  /* ── 5. Professional — top header + two-column body (skills sidebar right) ── */
  const ProfessionalTemplate = () => {
    const mainSections = visibleSections.filter((s) => s.id === 'summary' || s.id === 'experience');
    const rightSections = visibleSections.filter((s) => s.id === 'skills' || s.id === 'education');

    return (
      <div ref={resumeRef} className="w-[612px] bg-white shadow-2xl rounded-sm overflow-hidden" style={{ fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif" }}>
        {/* Header */}
        <div className="px-8 py-5 flex items-end justify-between" style={{ backgroundColor: theme.headerBg }}>
          <div>
            <EditableText value={data.name} onChange={(v) => update('name', v)} tag="h1" className="text-lg font-bold mb-0.5" style={{ color: theme.headerText }} placeholder="Your Name" />
            <EditableText value={data.title} onChange={(v) => update('title', v)} tag="p" className="text-[11px] font-medium opacity-80" style={{ color: theme.headerText }} placeholder="Title" />
          </div>
          <div className="text-right space-y-0.5 text-[9px]" style={{ color: `${theme.headerText}cc` }}>
            <div className="flex items-center gap-1 justify-end"><EditableText value={data.email} onChange={(v) => update('email', v)} placeholder="Email" /><i className="ri-mail-line" /></div>
            <div className="flex items-center gap-1 justify-end"><EditableText value={data.phone} onChange={(v) => update('phone', v)} placeholder="Phone" /><i className="ri-phone-line" /></div>
            <div className="flex items-center gap-1 justify-end"><EditableText value={data.location} onChange={(v) => update('location', v)} placeholder="Location" /><i className="ri-map-pin-line" /></div>
          </div>
        </div>

        {/* Two-col body */}
        <div className="flex">
          <div className="flex-1 px-6 py-5 border-r border-gray-100">
            {mainSections.map((s, i) => renderSection(s, i, 'pill'))}
          </div>
          <div className="w-[185px] flex-shrink-0 px-4 py-5" style={{ backgroundColor: theme.primaryLight }}>
            {rightSections.map((s, i) => renderSection(s, i, 'side', 'list'))}
          </div>
        </div>
      </div>
    );
  };

  /* ── 6. Elegant — serif font, refined top-border accents ── */
  const ElegantTemplate = () => (
    <div ref={resumeRef} className="w-[612px] bg-white shadow-2xl rounded-sm overflow-hidden" style={{ fontFamily: "'Georgia', 'Palatino Linotype', 'Times New Roman', serif" }}>
      {/* Thin top accent */}
      <div className="h-1" style={{ backgroundColor: theme.primary }} />
      <div className="px-10 pt-6 pb-3">
        <EditableText value={data.name} onChange={(v) => update('name', v)} tag="h1" className="text-2xl font-normal tracking-[0.05em] mb-1" style={{ color: theme.primary }} placeholder="Your Name" />
        <EditableText value={data.title} onChange={(v) => update('title', v)} tag="p" className="text-[12px] italic text-gray-500 mb-3" placeholder="Professional Title" />
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-gray-500 border-t border-b py-2" style={{ borderColor: `${theme.primary}30` }}>
          <span className="flex items-center gap-1"><i className="ri-mail-line" /><EditableText value={data.email} onChange={(v) => update('email', v)} placeholder="email" /></span>
          <span className="flex items-center gap-1"><i className="ri-phone-line" /><EditableText value={data.phone} onChange={(v) => update('phone', v)} placeholder="Phone" /></span>
          <span className="flex items-center gap-1"><i className="ri-linkedin-box-line" /><EditableText value={data.linkedin} onChange={(v) => update('linkedin', v)} placeholder="LinkedIn" /></span>
          <span className="flex items-center gap-1"><i className="ri-map-pin-line" /><EditableText value={data.location} onChange={(v) => update('location', v)} placeholder="Location" /></span>
        </div>
      </div>
      <div className="px-10 py-4">
        {visibleSections.map((s, i) => renderSection(s, i, 'caps', 'tags'))}
      </div>
      <div className="h-1" style={{ backgroundColor: theme.primary }} />
    </div>
  );

  /* ── 7. Compact — dense two-column body with colored header ── */
  const CompactTemplate = () => {
    const leftSections = visibleSections.filter((s) => s.id === 'experience');
    const rightSections = visibleSections.filter((s) => s.id === 'summary' || s.id === 'skills' || s.id === 'education');

    return (
      <div ref={resumeRef} className="w-[612px] bg-white shadow-2xl rounded-sm overflow-hidden" style={{ fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif" }}>
        {/* Compact header */}
        <div className="px-6 py-3 flex items-center justify-between" style={{ backgroundColor: theme.headerBg }}>
          <div>
            <EditableText value={data.name} onChange={(v) => update('name', v)} tag="h1" className="text-base font-bold" style={{ color: theme.headerText }} placeholder="Your Name" />
            <EditableText value={data.title} onChange={(v) => update('title', v)} tag="p" className="text-[10px] font-medium opacity-70" style={{ color: theme.headerText }} placeholder="Title" />
          </div>
          <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[8px] justify-end max-w-[280px]" style={{ color: `${theme.headerText}cc` }}>
            <span className="flex items-center gap-0.5"><i className="ri-mail-line" /><EditableText value={data.email} onChange={(v) => update('email', v)} placeholder="email" /></span>
            <span className="flex items-center gap-0.5"><i className="ri-phone-line" /><EditableText value={data.phone} onChange={(v) => update('phone', v)} placeholder="Phone" /></span>
            <span className="flex items-center gap-0.5"><i className="ri-linkedin-box-line" /><EditableText value={data.linkedin} onChange={(v) => update('linkedin', v)} placeholder="LinkedIn" /></span>
            <span className="flex items-center gap-0.5"><i className="ri-map-pin-line" /><EditableText value={data.location} onChange={(v) => update('location', v)} placeholder="Location" /></span>
          </div>
        </div>
        {/* Two columns */}
        <div className="flex">
          <div className="flex-1 px-5 py-4">
            {leftSections.map((s, i) => renderSection(s, i, 'underline'))}
          </div>
          <div className="w-[200px] flex-shrink-0 px-4 py-4 border-l" style={{ borderColor: `${theme.primary}15`, backgroundColor: `${theme.primaryLight}80` }}>
            {rightSections.map((s, i) => renderSection(s, i, 'side', 'list'))}
          </div>
        </div>
      </div>
    );
  };

  /* ── 8. Bold — oversized name, strong section bars ── */
  const BoldTemplate = () => (
    <div ref={resumeRef} className="w-[612px] bg-white shadow-2xl rounded-sm overflow-hidden" style={{ fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif" }}>
      <div className="px-8 pt-6 pb-3">
        <EditableText value={data.name} onChange={(v) => update('name', v)} tag="h1" className="text-3xl font-black tracking-tight mb-0" style={{ color: theme.primary }} placeholder="Your Name" />
        <EditableText value={data.title} onChange={(v) => update('title', v)} tag="p" className="text-[13px] font-semibold uppercase tracking-[0.15em] text-gray-400 mb-3" placeholder="Professional Title" />
        <ContactRow color="#6b7280" separator="|" />
      </div>
      <div className="px-8 py-4">
        {visibleSections.map((s, i) => (
          <div key={s.id}>
            {/* Bold full-width section bar */}
            <div className="flex items-center gap-2 px-3 py-1.5 -mx-1 mb-3 rounded" style={{ backgroundColor: theme.primary }}>
              <i className={`${s.icon} text-[10px] text-white/80`} />
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white">{s.label}</span>
            </div>
            <SectionWrapper section={s} index={i} total={visibleSections.length} onMove={moveSection} onToggle={toggleSection}>
              {s.id === 'summary' && <SummaryBlockNoHeading />}
              {s.id === 'experience' && <ExperienceBlockNoHeading />}
              {s.id === 'skills' && <SkillsBlockNoHeading />}
              {s.id === 'education' && <EducationBlockNoHeading />}
            </SectionWrapper>
          </div>
        ))}
      </div>
    </div>
  );

  /* No-heading variants for Bold template (section bar replaces heading) */
  const SummaryBlockNoHeading = () => (
    <div className="mb-5">
      <EditableText value={data.summary} onChange={(v) => update('summary', v)} tag="p" className="text-[11px] leading-[1.65] text-gray-600" placeholder="Write a compelling summary..." multiline />
    </div>
  );
  const ExperienceBlockNoHeading = () => (
    <div className="mb-5">
      <div className="space-y-4">
        {data.experience.map((exp, i) => (
          <div key={i} className="relative group/exp pl-3 border-l-2" style={{ borderColor: `${theme.bulletColor}30` }}>
            <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full" style={{ backgroundColor: theme.bulletColor }} />
            <div className="flex items-start justify-between mb-0.5">
              <div className="flex-1 min-w-0">
                <EditableText value={exp.role} onChange={(v) => updateExp(i, 'role', v)} tag="h4" className="text-[12px] font-bold text-gray-900" placeholder="Job Title" />
                <div className="flex items-center gap-1 text-[11px]">
                  <EditableText value={exp.company} onChange={(v) => updateExp(i, 'company', v)} className="font-semibold" style={{ color: theme.bulletColor }} placeholder="Company" />
                  <span className="text-gray-400">·</span>
                  <EditableText value={exp.location} onChange={(v) => updateExp(i, 'location', v)} className="text-gray-500" placeholder="Location" />
                </div>
              </div>
              <EditableText value={exp.period} onChange={(v) => updateExp(i, 'period', v)} className="text-[10px] text-gray-400 whitespace-nowrap ml-3 flex-shrink-0 bg-gray-50 px-2 py-0.5 rounded-full" placeholder="Period" />
            </div>
            <ul className="mt-1.5 space-y-1">
              {exp.bullets.map((b, j) => (
                <li key={j} className="flex items-start gap-1.5 group/bullet text-[11px] text-gray-600">
                  <span className="mt-[5px] flex-shrink-0 w-1 h-1 rounded-full" style={{ backgroundColor: theme.bulletColor }} />
                  <EditableText value={b} onChange={(v) => updateBullet(i, j, v)} className="flex-1" placeholder="Achievement..." multiline />
                  <button onClick={() => removeBullet(i, j)} className="opacity-0 group-hover/bullet:opacity-100 flex-shrink-0 text-red-400 hover:text-red-600 text-[10px] mt-0.5"><i className="ri-close-line" /></button>
                </li>
              ))}
            </ul>
            <button onClick={() => addBullet(i)} className="opacity-0 group-hover/exp:opacity-100 text-[10px] text-gray-400 hover:text-blue-600 mt-1 ml-2.5"><i className="ri-add-line mr-0.5" />Add bullet</button>
          </div>
        ))}
      </div>
    </div>
  );
  const SkillsBlockNoHeading = () => (
    <div className="mb-5">
      <div className="flex flex-wrap gap-1.5 mt-1">
        {data.skills.map((skill, i) => (
          <div key={i} className="group/skill flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-medium" style={{ backgroundColor: theme.skillBg, color: theme.skillText }}>
            <EditableText value={skill} onChange={(v) => updateSkill(i, v)} className="text-[10px]" placeholder="Skill" />
            <button onClick={() => removeSkill(i)} className="opacity-0 group-hover/skill:opacity-100 text-red-400 hover:text-red-600 text-[10px] -mr-1"><i className="ri-close-line" /></button>
          </div>
        ))}
      </div>
    </div>
  );
  const EducationBlockNoHeading = () => (
    <div className="mb-5">
      <div className="space-y-2">
        {data.education.map((edu, i) => (
          <div key={i} className="flex items-start justify-between group/edu">
            <div className="flex-1">
              <EditableText value={edu.degree} onChange={(v) => { const ed = [...data.education]; ed[i] = { ...ed[i], degree: v }; update('education', ed); }} tag="h4" className="text-[11px] font-bold text-gray-900" placeholder="Degree" />
              <EditableText value={edu.school} onChange={(v) => { const ed = [...data.education]; ed[i] = { ...ed[i], school: v }; update('education', ed); }} className="text-[11px] text-gray-500" placeholder="Institution" />
            </div>
            <EditableText value={edu.period} onChange={(v) => { const ed = [...data.education]; ed[i] = { ...ed[i], period: v }; update('education', ed); }} className="text-[10px] text-gray-400 ml-3 flex-shrink-0" placeholder="Year" />
          </div>
        ))}
      </div>
    </div>
  );

  /* ── 9. Timeline — dotted timeline connector for experience ── */
  const TimelineTemplate = () => (
    <div ref={resumeRef} className="w-[612px] bg-white shadow-2xl rounded-sm overflow-hidden" style={{ fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif" }}>
      <div className="px-8 pt-6 pb-3">
        <EditableText value={data.name} onChange={(v) => update('name', v)} tag="h1" className="text-xl font-extrabold mb-0.5" style={{ color: theme.primary }} placeholder="Your Name" />
        <EditableText value={data.title} onChange={(v) => update('title', v)} tag="p" className="text-[12px] text-gray-500 mb-3" placeholder="Professional Title" />
        <ContactRow color="#6b7280" />
      </div>

      <div className="px-8 py-4">
        {/* Summary */}
        {visibleSections.find((s) => s.id === 'summary') && (
          <SectionWrapper section={visibleSections.find((s) => s.id === 'summary')!} index={0} total={visibleSections.length} onMove={moveSection} onToggle={toggleSection}>
            <SummaryBlock headingStyle="underline" />
          </SectionWrapper>
        )}

        {/* Experience with timeline */}
        {visibleSections.find((s) => s.id === 'experience') && (
          <div className="mb-5">
            <SectionHeading label="Work Experience" icon="ri-briefcase-line" color={theme.sectionLine} borderColor={theme.sectionLine} style="underline" />
            <div className="relative ml-3 mt-2">
              {/* Dotted timeline */}
              <div className="absolute left-0 top-0 bottom-0 w-px border-l-2 border-dashed" style={{ borderColor: `${theme.primary}35` }} />

              <div className="space-y-5 pl-6">
                {data.experience.map((exp, i) => (
                  <div key={i} className="relative group/exp">
                    {/* Timeline dot */}
                    <div className="absolute -left-[29px] top-1 w-3 h-3 rounded-full border-2 bg-white" style={{ borderColor: theme.primary }} />
                    <div className="flex items-start justify-between mb-0.5">
                      <div className="flex-1 min-w-0">
                        <EditableText value={exp.role} onChange={(v) => updateExp(i, 'role', v)} tag="h4" className="text-[12px] font-bold text-gray-900" placeholder="Job Title" />
                        <div className="flex items-center gap-1 text-[11px]">
                          <EditableText value={exp.company} onChange={(v) => updateExp(i, 'company', v)} className="font-semibold" style={{ color: theme.bulletColor }} placeholder="Company" />
                          <span className="text-gray-400">·</span>
                          <EditableText value={exp.location} onChange={(v) => updateExp(i, 'location', v)} className="text-gray-500" placeholder="Location" />
                        </div>
                      </div>
                      <EditableText value={exp.period} onChange={(v) => updateExp(i, 'period', v)} className="text-[10px] text-gray-400 whitespace-nowrap ml-3 flex-shrink-0 px-2 py-0.5 rounded-full" style={{ backgroundColor: `${theme.primary}10`, color: theme.primary }} placeholder="Period" />
                    </div>
                    <ul className="mt-1.5 space-y-1">
                      {exp.bullets.map((b, j) => (
                        <li key={j} className="flex items-start gap-1.5 group/bullet text-[11px] text-gray-600">
                          <span className="mt-[5px] flex-shrink-0 w-1 h-1 rounded-full" style={{ backgroundColor: theme.bulletColor }} />
                          <EditableText value={b} onChange={(v) => updateBullet(i, j, v)} className="flex-1" placeholder="Achievement..." multiline />
                          <button onClick={() => removeBullet(i, j)} className="opacity-0 group-hover/bullet:opacity-100 flex-shrink-0 text-red-400 hover:text-red-600 text-[10px] mt-0.5"><i className="ri-close-line" /></button>
                        </li>
                      ))}
                    </ul>
                    <button onClick={() => addBullet(i)} className="opacity-0 group-hover/exp:opacity-100 text-[10px] text-gray-400 hover:text-blue-600 mt-1 ml-2.5"><i className="ri-add-line mr-0.5" />Add bullet</button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Skills & Education */}
        {visibleSections.filter((s) => s.id === 'skills' || s.id === 'education').map((s, i) => renderSection(s, i, 'underline', 'tags'))}
      </div>
    </div>
  );

  /* ── 10. Clean — airy whitespace-driven, subtle color lines ── */
  const CleanTemplate = () => (
    <div ref={resumeRef} className="w-[612px] bg-white shadow-2xl rounded-sm overflow-hidden" style={{ fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif" }}>
      <div className="px-10 pt-8 pb-4">
        <EditableText value={data.name} onChange={(v) => update('name', v)} tag="h1" className="text-xl font-bold mb-1 tracking-tight" style={{ color: theme.primary }} placeholder="Your Name" />
        <EditableText value={data.title} onChange={(v) => update('title', v)} tag="p" className="text-[12px] font-medium mb-4" style={{ color: `${theme.primary}88` }} placeholder="Professional Title" />
        <div className="h-px mb-4" style={{ backgroundColor: `${theme.primary}20` }} />
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-[10px] text-gray-400">
          <span className="flex items-center gap-1.5"><i className="ri-mail-line text-[9px]" style={{ color: theme.primary }} /><EditableText value={data.email} onChange={(v) => update('email', v)} placeholder="email" /></span>
          <span className="flex items-center gap-1.5"><i className="ri-phone-line text-[9px]" style={{ color: theme.primary }} /><EditableText value={data.phone} onChange={(v) => update('phone', v)} placeholder="Phone" /></span>
          <span className="flex items-center gap-1.5"><i className="ri-linkedin-box-line text-[9px]" style={{ color: theme.primary }} /><EditableText value={data.linkedin} onChange={(v) => update('linkedin', v)} placeholder="LinkedIn" /></span>
          <span className="flex items-center gap-1.5"><i className="ri-map-pin-line text-[9px]" style={{ color: theme.primary }} /><EditableText value={data.location} onChange={(v) => update('location', v)} placeholder="Location" /></span>
        </div>
      </div>
      <div className="px-10 py-4">
        {visibleSections.map((s, i) => {
          return (
            <div key={s.id} className="mb-6">
              {/* Clean section header with subtle left accent */}
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-1 h-5 rounded-full" style={{ backgroundColor: theme.primary }} />
                <span className="text-[11px] font-bold uppercase tracking-[0.15em]" style={{ color: theme.primary }}>{s.label}</span>
              </div>
              <SectionWrapper section={s} index={i} total={visibleSections.length} onMove={moveSection} onToggle={toggleSection}>
                {s.id === 'summary' && <SummaryBlockNoHeading />}
                {s.id === 'experience' && <ExperienceBlockNoHeading />}
                {s.id === 'skills' && <SkillsBlockNoHeading />}
                {s.id === 'education' && <EducationBlockNoHeading />}
              </SectionWrapper>
            </div>
          );
        })}
      </div>
    </div>
  );

  /* Template map */
  const renderTemplate = () => {
    switch (templateId) {
      case 'classic': return <ClassicTemplate />;
      case 'modern': return <ModernTemplate />;
      case 'executive': return <ExecutiveTemplate />;
      case 'minimal': return <MinimalTemplate />;
      case 'professional': return <ProfessionalTemplate />;
      case 'elegant': return <ElegantTemplate />;
      case 'compact': return <CompactTemplate />;
      case 'bold': return <BoldTemplate />;
      case 'timeline': return <TimelineTemplate />;
      case 'clean': return <CleanTemplate />;
      default: return <ClassicTemplate />;
    }
  };

  /* ════════════════════════════════════════════
     Layout
     ════════════════════════════════════════════ */
  return (
    <div className="flex flex-col items-center">

      {/* ─── Visual Template Picker ─── */}
      <div className="w-full max-w-[1200px] mb-6 bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100 px-5 py-4">
        <TemplatePicker
          activeTemplateId={templateId}
          activeTheme={theme}
          onSelectTemplate={switchTemplate}
          onSelectTheme={setTheme}
        />
      </div>

      {/* ─── Action bar ─── */}
      <div className="w-full max-w-[680px] mb-5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {/* Add section */}
            <div className="relative">
              <button
                onClick={() => setShowAddSection(!showAddSection)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white shadow-sm border border-gray-200 hover:border-gray-300 text-sm font-medium text-gray-700"
              >
                <i className="ri-add-line" /><span className="hidden sm:inline">Section</span>
              </button>
              {showAddSection && (
                <div className="absolute top-full left-0 mt-2 w-52 bg-white rounded-xl shadow-xl border border-gray-200 p-2 z-50">
                  {sections.filter((s) => !s.visible).length === 0 ? (
                    <p className="text-xs text-gray-400 px-3 py-2">All sections visible</p>
                  ) : (
                    sections.filter((s) => !s.visible).map((s) => (
                      <button key={s.id} onClick={() => { toggleSection(s.id); setShowAddSection(false); }} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 text-sm text-gray-700 font-medium">
                        <i className={`${s.icon} text-gray-400`} />{s.label}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={saveToDatabase}
              disabled={isSaving}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium shadow-sm border transition-all ${
                saveStatus === 'saved' ? 'bg-green-50 border-green-200 text-green-700'
                  : saveStatus === 'error' ? 'bg-red-50 border-red-200 text-red-700'
                  : 'bg-white border-gray-200 text-gray-700 hover:border-blue-300'
              }`}
            >
              <i className={`${isSaving ? 'ri-loader-4-line animate-spin' : saveStatus === 'saved' ? 'ri-check-line' : 'ri-save-line'}`} />
              <span className="hidden sm:inline">{isSaving ? 'Saving...' : saveStatus === 'saved' ? 'Saved!' : 'Save'}</span>
            </button>

            <button
              onClick={handleDownloadPDF}
              disabled={isDownloading || isClaimingFree || paymentLoading}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all disabled:opacity-50"
              style={{ backgroundColor: theme.primary }}
            >
              {paymentLoading ? (
                <>
                  <i className="ri-loader-4-line animate-spin" />
                  Checking...
                </>
              ) : isClaimingFree ? (
                <>
                  <i className="ri-loader-4-line animate-spin" />
                  Activating Free Download...
                </>
              ) : !hasPaymentAccess ? (
                <>
                  <i className="ri-lock-line" />
                  Pay & Download
                </>
              ) : accessType === 'free' && freeDownloadsRemaining > 0 ? (
                <>
                  <i className="ri-gift-line" />
                  Download Free ({freeDownloadsRemaining} left)
                </>
              ) : (
                <>
                  <i className={`${isDownloading ? 'ri-loader-4-line animate-spin' : 'ri-download-2-line'}`} />
                  {isDownloading ? 'Exporting...' : activeSubscription ? 'Download PDF ✨' : 'Download PDF'}
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ─── Resume Preview ─── */}
      <div className="relative pl-12">
        {renderTemplate()}
      </div>

      {/* Click-outside to close section picker */}
      {showAddSection && (
        <div className="fixed inset-0 z-40" onClick={() => setShowAddSection(false)} />
      )}

      {/* Payment Modal */}
      {resumeId && (
        <PaymentModal
          isOpen={showPaymentModal}
          resumeId={resumeId}
          plans={plans}
          onClose={() => setShowPaymentModal(false)}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
}

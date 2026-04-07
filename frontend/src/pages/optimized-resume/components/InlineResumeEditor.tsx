import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { ResumeData, SectionId, ResumeSection, ColorTheme, TemplateId } from '../types';
import { RESUME_TEMPLATES, getDefaultTheme, getVariantTemplates } from './themes';
import TemplatePicker from './TemplatePicker';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import PaymentModal from '../../../components/PaymentModal';
import paymentService, { PlanInfo, SubscriptionInfo } from '../../../services/paymentService';
import { authFetch } from '../../../services/authFetch';
import { API_BASE_URL } from '../../../config/api';

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
   Variant Section Ordering
   Derived from Resume OS agent prompt — each variant
   has a specific content priority that determines
   which sections appear first in the triage zone.
   ══════════════════════════════════════════════ */
const SECTION_META: Record<SectionId, { label: string; icon: string }> = {
  summary: { label: 'Professional Summary', icon: 'ri-file-text-line' },
  experience: { label: 'Work Experience', icon: 'ri-briefcase-line' },
  skills: { label: 'Skills', icon: 'ri-tools-line' },
  education: { label: 'Education', icon: 'ri-graduation-cap-line' },
};

// Section order per variant — matching Resume OS agent prompt priorities
const VARIANT_SECTION_ORDERS: Record<string, SectionId[]> = {
  // V1 Signal Stack: Skills → Projects → Experience → Education  (tech-first, stack depth leads)
  v1: ['skills', 'summary', 'experience', 'education'],
  // V2 Outcome Ledger: Summary → Metrics → Experience → Skills → Education  (results-first)
  v2: ['summary', 'experience', 'skills', 'education'],
  // V3 Authority Frame: Summary → Tools & Certs → Experience → Education  (formal, certs before exp)
  v3: ['summary', 'skills', 'experience', 'education'],
  // V4 Leadership Thesis: Exec Summary → Scale → Experience → Competencies → Education  (executive)
  v4: ['summary', 'experience', 'skills', 'education'],
  // V5 Proof Sheet: Research → Publications → Skills → Education (top)  (academic, education prominent)
  v5: ['summary', 'education', 'skills', 'experience'],
  // V6 Problem-Solver: Summary → Competency Matrix → Experience → Certs → Education
  v6: ['summary', 'skills', 'experience', 'education'],
  // V7 Portfolio Lead: Portfolio → Summary → Case Studies → Tools → Education
  v7: ['summary', 'experience', 'skills', 'education'],
  // V8 Versatility Map: Summary → Cross-functional Skills → Experience → Education
  v8: ['summary', 'skills', 'experience', 'education'],
  // V9 Domain Expert: Domain Summary → Industry Credentials → Experience → Education
  v9: ['summary', 'skills', 'experience', 'education'],
  // V10 Transition Narrative: Summary → Transferable Skills → Experience → Education
  v10: ['summary', 'skills', 'experience', 'education'],
};

const DEFAULT_SECTION_ORDER: SectionId[] = ['summary', 'experience', 'skills', 'education'];

function getSectionOrder(templateId: string): SectionId[] {
  const prefix = templateId.split('-')[0];
  return VARIANT_SECTION_ORDERS[prefix] || DEFAULT_SECTION_ORDER;
}

function buildSections(order: SectionId[]): ResumeSection[] {
  return order.map((id) => ({ id, ...SECTION_META[id], visible: true }));
}

/* ══════════════════════════════════════════════
   Main Component
   ══════════════════════════════════════════════ */
export default function InlineResumeEditor({
  data,
  onDataChange,
  initialTemplateId = 'v1-stack-first',
  variantId,
  variantRationale,
  onPageCountChange,
}: {
  data: ResumeData;
  onDataChange: (d: ResumeData) => void;
  initialTemplateId?: TemplateId;
  variantId?: string;
  variantRationale?: string;
  onPageCountChange?: (pages: number) => void;
}) {
  const [templateId, setTemplateId] = useState<TemplateId>(initialTemplateId);
  const variantTemplates = variantId ? getVariantTemplates(variantId) : RESUME_TEMPLATES.slice(0, 5);
  const template = variantTemplates.find((t) => t.id === templateId) || variantTemplates[0];
  const [theme, setTheme] = useState<ColorTheme>(template?.colors[0] || getDefaultTheme(templateId));
  const [showAddSection, setShowAddSection] = useState(false);

  // Sync when the recommended template changes from the parent
  useEffect(() => {
    if (initialTemplateId !== templateId) {
      setTemplateId(initialTemplateId);
      const tpl = variantTemplates.find((t) => t.id === initialTemplateId) || variantTemplates[0];
      if (tpl) setTheme(tpl.colors[0]);
      // Apply variant-specific section order
      setSections((prev) => {
        const newOrder = getSectionOrder(initialTemplateId);
        return newOrder.map((sid) => prev.find((s) => s.id === sid) || { id: sid, ...SECTION_META[sid], visible: true });
      });
    }
  // only re-run when initialTemplateId prop changes, not on internal template switches
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialTemplateId]);
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
  const [paymentLoading, setPaymentLoading] = useState(true);

  // Coupon state for first-time free download
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponValidating, setCouponValidating] = useState(false);

  const [sections, setSections] = useState<ResumeSection[]>(() => buildSections(getSectionOrder(initialTemplateId)));

  const visibleSections = sections.filter((s) => s.visible);

  // ─── Page-awareness: section-aware page break detection ───
  const A4_PAGE_HEIGHT = 866; // A4 page height in px at 612px width
  const [resumeContentHeight, setResumeContentHeight] = useState(A4_PAGE_HEIGHT);
  const [pageBreakPositions, setPageBreakPositions] = useState<number[]>([]);

  useEffect(() => {
    const el = resumeRef.current;
    if (!el) return;

    const computeBreaks = () => {
      const h = el.scrollHeight;
      setResumeContentHeight(h);
      if (h <= A4_PAGE_HEIGHT) { setPageBreakPositions([]); return; }

      const cRect = el.getBoundingClientRect();
      // Primary candidates: section & entry boundaries (preferred break points)
      const primary: number[] = [];
      el.querySelectorAll('[data-resume-section]').forEach((s) => {
        primary.push((s as HTMLElement).getBoundingClientRect().top - cRect.top);
      });
      el.querySelectorAll('[data-resume-entry]').forEach((e) => {
        primary.push((e as HTMLElement).getBoundingClientRect().top - cRect.top);
      });
      // Secondary candidates: individual bullet boundaries (fallback within tall entries)
      const secondary: number[] = [];
      el.querySelectorAll('[data-resume-bullet]').forEach((b) => {
        secondary.push((b as HTMLElement).getBoundingClientRect().top - cRect.top);
      });
      const sortedPrimary = [...new Set(primary.map(c => Math.round(c)))].sort((a, b) => a - b);
      const sortedSecondary = [...new Set(secondary.map(c => Math.round(c)))].sort((a, b) => a - b);

      const findBreak = (sorted: number[], pageStart: number, pageEnd: number, minFill: number): number => {
        for (let i = sorted.length - 1; i >= 0; i--) {
          if (sorted[i] <= pageEnd && sorted[i] > pageStart + minFill) return sorted[i];
        }
        return -1;
      };

      const breaks: number[] = [];
      let pageStart = 0;
      while (pageStart + A4_PAGE_HEIGHT < h) {
        const pageEnd = pageStart + A4_PAGE_HEIGHT;
        // Pass 1: section/entry boundary in [25%, 100%] of page (well-filled page)
        let breakAt = findBreak(sortedPrimary, pageStart, pageEnd, A4_PAGE_HEIGHT * 0.25);
        // Pass 2: any section/entry boundary above pageStart
        if (breakAt < 0) breakAt = findBreak(sortedPrimary, pageStart, pageEnd, 0);
        // Pass 3: bullet boundary in [25%, 100%] (break between bullets within a tall entry)
        if (breakAt < 0) breakAt = findBreak(sortedSecondary, pageStart, pageEnd, A4_PAGE_HEIGHT * 0.25);
        // Pass 4: any bullet boundary
        if (breakAt < 0) breakAt = findBreak(sortedSecondary, pageStart, pageEnd, 0);
        // Pass 5: raw cut (absolute last resort — no DOM boundaries found)
        if (breakAt < 0) breakAt = pageEnd;
        breaks.push(breakAt);
        pageStart = breakAt;
      }
      setPageBreakPositions(breaks);
    };

    const obs = new ResizeObserver(() => requestAnimationFrame(computeBreaks));
    obs.observe(el);
    requestAnimationFrame(computeBreaks);
    return () => obs.disconnect();
  }, [templateId, theme]);

  const totalPages = pageBreakPositions.length + 1;

  // Calculate page ranges for multi-page display
  const PAGE_GAP = 48;
  const pageRanges = useMemo(() => {
    const ranges: { startY: number; height: number }[] = [];
    let lastY = 0;
    for (const y of pageBreakPositions) {
      ranges.push({ startY: lastY, height: y - lastY });
      lastY = y;
    }
    ranges.push({
      startY: lastY,
      height: Math.max(A4_PAGE_HEIGHT, resumeContentHeight) - lastY,
    });
    return ranges;
  }, [pageBreakPositions, resumeContentHeight]);

  // Notify parent of actual page count
  useEffect(() => {
    onPageCountChange?.(totalPages);
  }, [totalPages, onPageCountChange]);

  // Check payment access on mount
  useEffect(() => {
    const checkAccess = async () => {
      try {
        const raw = sessionStorage.getItem('optimizationData');
        if (raw) {
          const parsed = JSON.parse(raw);
          const parsedResumeId = Number(parsed.resumeId ?? parsed.resume_id);
          if (parsedResumeId) {
            setResumeId(parsedResumeId);
            const access = await paymentService.checkAccess(parsedResumeId);
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

  /* Switch template → pick first color + apply variant-specific section order */
  const switchTemplate = (id: TemplateId) => {
    const prevPrefix = templateId.split('-')[0];
    const newPrefix = id.split('-')[0];
    setTemplateId(id);
    const tpl = variantTemplates.find((t) => t.id === id) || RESUME_TEMPLATES.find((t) => t.id === id);
    if (tpl) setTheme(tpl.colors[0]);
    // Update section order when switching to a different variant family
    if (prevPrefix !== newPrefix) {
      setSections((prev) => {
        const newOrder = getSectionOrder(id);
        return newOrder.map((sid) => prev.find((s) => s.id === sid) || { id: sid, ...SECTION_META[sid], visible: true });
      });
    }
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
      const parsedResumeId = Number(parsed.resumeId ?? parsed.resume_id);
      if (!parsedResumeId) { setIsSaving(false); return; }

      const res = await authFetch(`${API_BASE_URL}/resume/${parsedResumeId}/save-edited`, {
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

    // Case 2: Free download available — show coupon modal with auto-applied code
    if (hasPaymentAccess && accessType === 'free' && freeDownloadsRemaining > 0 && resumeId) {
      setCouponCode('FIRSTRESUME');
      setCouponError(null);
      setShowCouponModal(true);
      return;
    }

    // Case 3: Payment required — show pricing modal
    if (resumeId) {
      setShowPaymentModal(true);
      return;
    }

    alert('Could not determine resume ID. Please re-optimize your resume and try again.');
  };

  const handleCouponSubmit = async () => {
    if (!couponCode.trim()) {
      setCouponError('Please enter a coupon code');
      return;
    }
    setCouponValidating(true);
    setCouponError(null);

    // Validate coupon — only FIRSTRESUME is accepted
    const isValid = couponCode.trim().toUpperCase() === 'FIRSTRESUME';

    if (!isValid) {
      setCouponValidating(false);
      setCouponError('Invalid coupon code. Please try again.');
      return;
    }

    // Valid coupon — claim free download
    try {
      const result = await paymentService.useFreeDownload(resumeId!);
      if (result.success) {
        setFreeDownloadsRemaining(result.free_downloads_remaining);
        setHasPaymentAccess(true);
        setAccessType('per_resume');
        setShowCouponModal(false);
        await performDownload();
      }
    } catch (error) {
      console.error('Free download claim failed:', error);
      setCouponError('Failed to apply coupon. Please try again.');
    } finally {
      setCouponValidating(false);
    }
  };

  const handlePaymentSuccess = (subscriptionActivated?: boolean) => {
    setHasPaymentAccess(true);
    setAccessType(subscriptionActivated ? 'subscription' : 'per_resume');
    setShowPaymentModal(false);
    // Wait for modal to fully unmount before capturing the DOM for download
    setTimeout(() => {
      performDownload();
    }, 300);
  };

  const performDownload = async () => {
    setIsDownloading(true);
    try {
      await saveToDatabase();
      const el = resumeRef.current;
      if (!el) {
        alert('Resume preview not found. Please scroll to your resume and click Download again.');
        setIsDownloading(false);
        return;
      }

      const canvas = await html2canvas(el, { scale: 2, useCORS: true, logging: false, backgroundColor: '#ffffff' });
      const imgData = canvas.toDataURL('image/png');

      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 6; // mm — small margin so content doesn't touch edges
      const usableWidth = pageWidth - 2 * margin;
      const usableHeight = pageHeight - 2 * margin;

      const scaledWidth = usableWidth;
      const scaledHeight = (canvas.height * usableWidth) / canvas.width;

      /**
       * Smart page-break helper: scans a ±range band around `targetRow`
       * and picks the row with the most white pixels (natural whitespace
       * between sections / entries).
       */
      const findCleanBreak = (cvs: HTMLCanvasElement, targetRow: number, range = 60): number => {
        const ctx2 = cvs.getContext('2d');
        if (!ctx2) return targetRow;
        const startRow = Math.max(0, targetRow - range);
        const bandHeight = Math.min(range * 2, cvs.height - startRow);
        const band = ctx2.getImageData(0, startRow, cvs.width, bandHeight);
        const d = band.data;
        const w = cvs.width;
        let bestRow = targetRow;
        let bestScore = -1;
        for (let r = 0; r < bandHeight; r++) {
          let score = 0;
          const base = r * w * 4;
          for (let x = 0; x < w * 4; x += 4) {
            if (d[base + x] > 245 && d[base + x + 1] > 245 && d[base + x + 2] > 245) score++;
          }
          if (score > bestScore) { bestScore = score; bestRow = startRow + r; }
        }
        return bestRow;
      };

      if (scaledHeight <= usableHeight) {
        // Fits on one page
        const offsetX = margin + (usableWidth - scaledWidth) / 2;
        pdf.addImage(imgData, 'PNG', offsetX, margin, scaledWidth, scaledHeight);
      } else {
        // Multi-page: use section-aware break positions from preview
        const scaleRatio = canvas.height / (resumeContentHeight || 1);
        const canvasBreaks: number[] = pageBreakPositions.length > 0
          ? pageBreakPositions.map(y => Math.round(y * scaleRatio))
          : [];

        // Fallback: compute nominal breaks with whitespace scanning if no section breaks
        if (canvasBreaks.length === 0) {
          const nominalSlice = (usableHeight / scaledHeight) * canvas.height;
          let y = 0;
          while (y + nominalSlice < canvas.height) {
            const endRow = findCleanBreak(canvas, Math.round(y + nominalSlice));
            canvasBreaks.push(endRow);
            y = endRow;
          }
        }
        canvasBreaks.push(canvas.height);

        let yOffset = 0;
        let pageIndex = 0;

        for (const endY of canvasBreaks) {
          const sliceHeight = endY - yOffset;
          if (sliceHeight <= 0) continue;
          const pageCanvas = document.createElement('canvas');
          pageCanvas.width = canvas.width;
          pageCanvas.height = sliceHeight;
          const ctx = pageCanvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(canvas, 0, yOffset, canvas.width, sliceHeight, 0, 0, canvas.width, sliceHeight);
            const pageImgData = pageCanvas.toDataURL('image/png');
            const sliceScaledHeight = (sliceHeight * usableWidth) / canvas.width;

            if (pageIndex > 0) pdf.addPage();
            pdf.addImage(pageImgData, 'PNG', margin, margin, usableWidth, sliceScaledHeight);
          }
          yOffset = endY;
          pageIndex++;
        }
      }

      pdf.save(`${data.name.replace(/\s+/g, '_')}_Resume.pdf`);
    } catch (err) {
      console.error('PDF download failed:', err);
      alert('Failed to download PDF. Please try again.');
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
    <div className="mb-5" data-resume-section="summary">
      <SectionHeading label="Professional Summary" icon="ri-file-text-line" color={theme.sectionLine} borderColor={theme.sectionLine} style={headingStyle} />
      <EditableText value={data.summary} onChange={(v) => update('summary', v)} tag="p" className="text-[11px] leading-[1.65] text-gray-600" placeholder="Write a compelling summary..." multiline />
    </div>
  );

  const ExperienceBlock = ({ headingStyle }: { headingStyle?: 'underline' | 'pill' | 'side' | 'caps' }) => (
    <div className="mb-5" data-resume-section="experience">
      <div className="flex items-center justify-between">
        <SectionHeading label="Work Experience" icon="ri-briefcase-line" color={theme.sectionLine} borderColor={theme.sectionLine} style={headingStyle} />
        <button onClick={addExperience} className="opacity-0 group-hover:opacity-100 text-[10px] px-2 py-0.5 rounded bg-gray-100 text-gray-600 hover:bg-blue-100 hover:text-blue-700 font-medium"><i className="ri-add-line mr-0.5" />Add</button>
      </div>
      <div className="space-y-4 mt-1">
        {data.experience.map((exp, i) => (
          <div key={i} data-resume-entry className="relative group/exp pl-3 border-l-2" style={{ borderColor: `${theme.bulletColor}30` }}>
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
                <li key={j} data-resume-bullet className="flex items-start gap-1.5 group/bullet text-[11px] text-gray-600">
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
    <div className="mb-5" data-resume-section="skills">
      <div className="flex items-center justify-between">
        <SectionHeading label="Skills" icon="ri-tools-line" color={theme.sectionLine} borderColor={theme.sectionLine} style={headingStyle} />
        <button onClick={addSkill} className="opacity-0 group-hover:opacity-100 text-[10px] px-2 py-0.5 rounded bg-gray-100 text-gray-600 hover:bg-blue-100 hover:text-blue-700 font-medium"><i className="ri-add-line mr-0.5" />Add</button>
      </div>
      {layout === 'list' ? (
        <div className="flex flex-wrap mt-1 text-[11px] leading-[1.7]" style={{ color: theme.skillText }}>
          {data.skills.map((skill, i) => (
            <span key={i} className="group/skill inline-flex items-center">
              <EditableText value={skill} onChange={(v) => updateSkill(i, v)} className="inline" placeholder="Skill" />
              <button onClick={() => removeSkill(i)} className="opacity-0 group-hover/skill:opacity-100 text-red-400 hover:text-red-600 text-[9px] mx-0.5"><i className="ri-close-line" /></button>
              {i < data.skills.length - 1 && <span className="mx-1" style={{ color: theme.bulletColor, opacity: 0.4 }}>&bull;</span>}
            </span>
          ))}
        </div>
      ) : (
        <div className="flex flex-wrap gap-x-1 gap-y-0.5 mt-1">
          {data.skills.map((skill, i) => (
            <span key={i} className="group/skill inline-flex items-center text-[10px] font-medium" style={{ color: theme.skillText }}>
              <span className="px-1.5 py-0.5 rounded" style={{ backgroundColor: theme.skillBg }}>
                <EditableText value={skill} onChange={(v) => updateSkill(i, v)} className="text-[10px]" placeholder="Skill" />
              </span>
              <button onClick={() => removeSkill(i)} className="opacity-0 group-hover/skill:opacity-100 text-red-400 hover:text-red-600 text-[9px] ml-0.5"><i className="ri-close-line" /></button>
            </span>
          ))}
        </div>
      )}
    </div>
  );

  const EducationBlock = ({ headingStyle }: { headingStyle?: 'underline' | 'pill' | 'side' | 'caps' }) => (
    <div className="mb-5" data-resume-section="education">
      <div className="flex items-center justify-between">
        <SectionHeading label="Education" icon="ri-graduation-cap-line" color={theme.sectionLine} borderColor={theme.sectionLine} style={headingStyle} />
        <button onClick={addEducation} className="opacity-0 group-hover:opacity-100 text-[10px] px-2 py-0.5 rounded bg-gray-100 text-gray-600 hover:bg-blue-100 hover:text-blue-700 font-medium"><i className="ri-add-line mr-0.5" />Add</button>
      </div>
      <div className="space-y-2 mt-1">
        {data.education.map((edu, i) => (
          <div key={i} data-resume-entry className="flex items-start justify-between group/edu">
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
     Layout Configuration System
     Each template maps to a layout config to avoid
     50 separate component definitions.
     ════════════════════════════════════════════ */

  type LayoutType = 'header-single' | 'sidebar-left' | 'sidebar-right' | 'centered' | 'minimal' | 'bold-bars' | 'timeline' | 'two-col';
  type HeadingStyle = 'underline' | 'pill' | 'side' | 'caps';
  type SkillLayout = 'tags' | 'list';

  interface LayoutConfig {
    layout: LayoutType;
    headingStyle: HeadingStyle;
    skillLayout: SkillLayout;
    font: 'sans' | 'serif';
    sidebarSections?: SectionId[];
  }

  const FONT_SANS = "'Inter', 'Segoe UI', system-ui, sans-serif";
  const FONT_SERIF = "'Georgia', 'Times New Roman', serif";

  const TEMPLATE_LAYOUTS: Record<string, LayoutConfig> = {
    // V1: Signal Stack (Tech)
    'v1-stack-first':  { layout: 'header-single', headingStyle: 'underline', skillLayout: 'tags', font: 'sans' },
    'v1-dev-card':     { layout: 'minimal', headingStyle: 'side', skillLayout: 'tags', font: 'sans' },
    'v1-tech-grid':    { layout: 'two-col', headingStyle: 'underline', skillLayout: 'tags', font: 'sans' },
    'v1-system-arch':  { layout: 'sidebar-left', headingStyle: 'side', skillLayout: 'list', font: 'sans', sidebarSections: ['skills', 'education'] },
    'v1-terminal':     { layout: 'minimal', headingStyle: 'caps', skillLayout: 'tags', font: 'sans' },
    // V2: Outcome Ledger (Business)
    'v2-metric-hero':  { layout: 'header-single', headingStyle: 'pill', skillLayout: 'tags', font: 'sans' },
    'v2-impact-first': { layout: 'centered', headingStyle: 'underline', skillLayout: 'tags', font: 'sans' },
    'v2-results-dash': { layout: 'two-col', headingStyle: 'underline', skillLayout: 'tags', font: 'sans' },
    'v2-board-ready':  { layout: 'sidebar-right', headingStyle: 'caps', skillLayout: 'list', font: 'serif', sidebarSections: ['skills', 'education'] },
    'v2-numbers-lead': { layout: 'sidebar-right', headingStyle: 'side', skillLayout: 'list', font: 'sans', sidebarSections: ['skills', 'education'] },
    // V3: Authority Frame (Enterprise)
    'v3-corporate':    { layout: 'header-single', headingStyle: 'underline', skillLayout: 'tags', font: 'sans' },
    'v3-governance':   { layout: 'bold-bars', headingStyle: 'pill', skillLayout: 'tags', font: 'sans' },
    'v3-enterprise':   { layout: 'header-single', headingStyle: 'caps', skillLayout: 'tags', font: 'sans' },
    'v3-process':      { layout: 'sidebar-right', headingStyle: 'side', skillLayout: 'list', font: 'serif', sidebarSections: ['skills', 'education'] },
    'v3-compliance':   { layout: 'minimal', headingStyle: 'underline', skillLayout: 'tags', font: 'sans' },
    // V4: Leadership Thesis (Senior)
    'v4-exec-brief':   { layout: 'centered', headingStyle: 'caps', skillLayout: 'tags', font: 'serif' },
    'v4-leadership':   { layout: 'bold-bars', headingStyle: 'pill', skillLayout: 'tags', font: 'sans' },
    'v4-csuite':       { layout: 'sidebar-right', headingStyle: 'side', skillLayout: 'list', font: 'sans', sidebarSections: ['skills', 'education'] },
    'v4-strategy':     { layout: 'centered', headingStyle: 'underline', skillLayout: 'tags', font: 'serif' },
    'v4-board-deck':   { layout: 'header-single', headingStyle: 'pill', skillLayout: 'tags', font: 'sans' },
    // V5: Proof Sheet (Research)
    'v5-academic':     { layout: 'centered', headingStyle: 'caps', skillLayout: 'tags', font: 'serif' },
    'v5-method':       { layout: 'header-single', headingStyle: 'underline', skillLayout: 'tags', font: 'sans' },
    'v5-paper':        { layout: 'header-single', headingStyle: 'caps', skillLayout: 'tags', font: 'serif' },
    'v5-lab':          { layout: 'sidebar-left', headingStyle: 'side', skillLayout: 'list', font: 'sans', sidebarSections: ['skills', 'education'] },
    'v5-scholar':      { layout: 'centered', headingStyle: 'underline', skillLayout: 'tags', font: 'serif' },
    // V6: Problem-Solver (Ops)
    'v6-case-study':   { layout: 'sidebar-right', headingStyle: 'side', skillLayout: 'list', font: 'sans', sidebarSections: ['skills', 'education'] },
    'v6-consultant':   { layout: 'header-single', headingStyle: 'pill', skillLayout: 'tags', font: 'sans' },
    'v6-matrix':       { layout: 'bold-bars', headingStyle: 'underline', skillLayout: 'tags', font: 'sans' },
    'v6-sar':          { layout: 'header-single', headingStyle: 'side', skillLayout: 'tags', font: 'sans' },
    'v6-process-flow': { layout: 'timeline', headingStyle: 'underline', skillLayout: 'tags', font: 'sans' },
    // V7: Portfolio Lead (Design)
    'v7-portfolio-hero':  { layout: 'centered', headingStyle: 'caps', skillLayout: 'tags', font: 'sans' },
    'v7-case-gallery':    { layout: 'header-single', headingStyle: 'pill', skillLayout: 'tags', font: 'sans' },
    'v7-design-process':  { layout: 'sidebar-left', headingStyle: 'side', skillLayout: 'list', font: 'sans', sidebarSections: ['skills', 'education'] },
    'v7-creative-min':    { layout: 'minimal', headingStyle: 'caps', skillLayout: 'tags', font: 'sans' },
    'v7-studio':          { layout: 'header-single', headingStyle: 'side', skillLayout: 'tags', font: 'sans' },
    // V8: Versatility Map (Generalist)
    'v8-flexi-grid':   { layout: 'sidebar-left', headingStyle: 'side', skillLayout: 'list', font: 'sans', sidebarSections: ['skills', 'education'] },
    'v8-cross-func':   { layout: 'two-col', headingStyle: 'underline', skillLayout: 'tags', font: 'sans' },
    'v8-adaptive':     { layout: 'header-single', headingStyle: 'underline', skillLayout: 'tags', font: 'sans' },
    'v8-breadth':      { layout: 'bold-bars', headingStyle: 'pill', skillLayout: 'tags', font: 'sans' },
    'v8-hybrid':       { layout: 'sidebar-right', headingStyle: 'side', skillLayout: 'list', font: 'sans', sidebarSections: ['skills', 'education'] },
    // V9: Domain Expert (Specialist)
    'v9-authority':    { layout: 'header-single', headingStyle: 'underline', skillLayout: 'tags', font: 'sans' },
    'v9-specialist':   { layout: 'header-single', headingStyle: 'caps', skillLayout: 'tags', font: 'sans' },
    'v9-credential':   { layout: 'centered', headingStyle: 'underline', skillLayout: 'tags', font: 'sans' },
    'v9-industry':     { layout: 'header-single', headingStyle: 'caps', skillLayout: 'tags', font: 'serif' },
    'v9-expert':       { layout: 'sidebar-left', headingStyle: 'side', skillLayout: 'list', font: 'sans', sidebarSections: ['skills', 'education'] },
    // V10: Transition Narrative
    'v10-pivot-bridge': { layout: 'centered', headingStyle: 'underline', skillLayout: 'tags', font: 'sans' },
    'v10-new-chapter':  { layout: 'header-single', headingStyle: 'underline', skillLayout: 'tags', font: 'sans' },
    'v10-transfer':     { layout: 'sidebar-right', headingStyle: 'side', skillLayout: 'list', font: 'sans', sidebarSections: ['skills', 'education'] },
    'v10-fresh-start':  { layout: 'minimal', headingStyle: 'side', skillLayout: 'tags', font: 'sans' },
    'v10-narrative':    { layout: 'timeline', headingStyle: 'caps', skillLayout: 'tags', font: 'serif' },
  };

  /* No-heading variants for bold-bars layout */
  const SummaryBlockNoHeading = () => (
    <div className="mb-5" data-resume-section="summary">
      <EditableText value={data.summary} onChange={(v) => update('summary', v)} tag="p" className="text-[11px] leading-[1.65] text-gray-600" placeholder="Write a compelling summary..." multiline />
    </div>
  );
  const ExperienceBlockNoHeading = () => (
    <div className="mb-5" data-resume-section="experience">
      <div className="flex justify-end mb-1">
        <button onClick={addExperience} className="opacity-0 group-hover:opacity-100 text-[10px] px-2 py-0.5 rounded bg-gray-100 text-gray-600 hover:bg-blue-100 hover:text-blue-700 font-medium"><i className="ri-add-line mr-0.5" />Add</button>
      </div>
      <div className="space-y-4">
        {data.experience.map((exp, i) => (
          <div key={i} data-resume-entry className="relative group/exp pl-3 border-l-2" style={{ borderColor: `${theme.bulletColor}30` }}>
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
                <li key={j} data-resume-bullet className="flex items-start gap-1.5 group/bullet text-[11px] text-gray-600">
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
    <div className="mb-5" data-resume-section="skills">
      <div className="flex flex-wrap gap-x-1 gap-y-0.5 mt-1">
        {data.skills.map((skill, i) => (
          <span key={i} className="group/skill inline-flex items-center text-[10px] font-medium" style={{ color: theme.skillText }}>
            <span className="px-1.5 py-0.5 rounded" style={{ backgroundColor: theme.skillBg }}>
              <EditableText value={skill} onChange={(v) => updateSkill(i, v)} className="text-[10px]" placeholder="Skill" />
            </span>
            <button onClick={() => removeSkill(i)} className="opacity-0 group-hover/skill:opacity-100 text-red-400 hover:text-red-600 text-[9px] ml-0.5"><i className="ri-close-line" /></button>
          </span>
        ))}
        <button onClick={addSkill} className="opacity-0 group-hover:opacity-100 px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-500 hover:bg-blue-100 hover:text-blue-700"><i className="ri-add-line" /></button>
      </div>
    </div>
  );
  const EducationBlockNoHeading = () => (
    <div className="mb-5" data-resume-section="education">
      <div className="flex justify-end mb-1">
        <button onClick={addEducation} className="opacity-0 group-hover:opacity-100 text-[10px] px-2 py-0.5 rounded bg-gray-100 text-gray-600 hover:bg-blue-100 hover:text-blue-700 font-medium"><i className="ri-add-line mr-0.5" />Add</button>
      </div>
      <div className="space-y-2">
        {data.education.map((edu, i) => (
          <div key={i} data-resume-entry className="flex items-start justify-between group/edu">
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

  /* ════════════════════════════════════════════
     Dynamic Template Renderer
     Renders any template based on its layout config
     ════════════════════════════════════════════ */

  const renderTemplate = () => {
    const config = TEMPLATE_LAYOUTS[templateId] || TEMPLATE_LAYOUTS['v1-stack-first'];
    const fontFamily = config.font === 'serif' ? FONT_SERIF : FONT_SANS;
    const sidebarSections = config.sidebarSections || ['skills', 'education'];
    const mainSections = visibleSections.filter((s) => !sidebarSections.includes(s.id));
    const sidebarVisible = visibleSections.filter((s) => sidebarSections.includes(s.id));

    /* ─── Layout: header-single ─── */
    if (config.layout === 'header-single') {
      return (
        <div ref={resumeRef} className="w-[612px] bg-white shadow-2xl rounded-sm overflow-hidden" style={{ fontFamily }}>
          <div className="px-8 py-5" style={{ backgroundColor: theme.headerBg }}>
            <EditableText value={data.name} onChange={(v) => update('name', v)} tag="h1" className="text-xl font-bold mb-0.5" style={{ color: theme.headerText }} placeholder="Your Name" />
            <EditableText value={data.title} onChange={(v) => update('title', v)} tag="p" className="text-sm font-medium mb-3 opacity-85" style={{ color: theme.headerText }} placeholder="Professional Title" />
            <ContactRow color={`${theme.headerText}cc`} />
          </div>
          <div className="px-8 py-6">
            {visibleSections.map((s, i) => renderSection(s, i, config.headingStyle, config.skillLayout))}
          </div>
        </div>
      );
    }

    /* ─── Layout: sidebar-left ─── */
    if (config.layout === 'sidebar-left') {
      return (
        <div ref={resumeRef} className="w-[612px] bg-white shadow-2xl rounded-sm overflow-hidden flex" style={{ fontFamily }}>
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
            {/* Sidebar: Skills */}
            {sidebarVisible.find((s) => s.id === 'skills') && (
              <div className="mb-5" data-resume-section="skills">
                <h3 className="text-[9px] font-bold uppercase tracking-[0.25em] mb-2 opacity-60" style={{ color: theme.headerText }}>Skills</h3>
                <div className="flex flex-wrap gap-x-1 gap-y-0.5">
                  {data.skills.map((skill, i) => (
                    <span key={i} className="group/skill inline-flex items-center text-[8px] font-medium" style={{ color: `${theme.headerText}dd` }}>
                      <span className="px-1.5 py-0.5 rounded" style={{ backgroundColor: 'rgba(255,255,255,0.12)' }}>
                        <EditableText value={skill} onChange={(v) => updateSkill(i, v)} className="text-[8px]" placeholder="Skill" />
                      </span>
                      <button onClick={() => removeSkill(i)} className="opacity-0 group-hover/skill:opacity-100 text-red-300 hover:text-red-100 text-[8px]"><i className="ri-close-line" /></button>
                    </span>
                  ))}
                  <button onClick={addSkill} className="opacity-0 group-hover:opacity-100 px-1.5 py-0.5 rounded text-[8px] font-medium" style={{ backgroundColor: 'rgba(255,255,255,0.08)', color: `${theme.headerText}99` }}><i className="ri-add-line" /></button>
                </div>
              </div>
            )}
            {/* Sidebar: Education */}
            {sidebarVisible.find((s) => s.id === 'education') && (
              <div data-resume-section="education">
                <h3 className="text-[9px] font-bold uppercase tracking-[0.25em] mb-2 opacity-60" style={{ color: theme.headerText }}>Education</h3>
                <div className="space-y-2">
                  {data.education.map((edu, i) => (
                    <div key={i} data-resume-entry className="group/edu">
                      <EditableText value={edu.degree} onChange={(v) => { const ed = [...data.education]; ed[i] = { ...ed[i], degree: v }; update('education', ed); }} tag="p" className="text-[9px] font-bold" style={{ color: theme.headerText }} placeholder="Degree" />
                      <EditableText value={edu.school} onChange={(v) => { const ed = [...data.education]; ed[i] = { ...ed[i], school: v }; update('education', ed); }} tag="p" className="text-[8px] opacity-70" style={{ color: theme.headerText }} placeholder="School" />
                      <div className="flex items-center gap-1">
                        <EditableText value={edu.period} onChange={(v) => { const ed = [...data.education]; ed[i] = { ...ed[i], period: v }; update('education', ed); }} tag="p" className="text-[8px] opacity-50" style={{ color: theme.headerText }} placeholder="Year" />
                        {data.education.length > 1 && <button onClick={() => removeEducation(i)} className="opacity-0 group-hover/edu:opacity-100 text-red-300 hover:text-red-100 text-[7px]"><i className="ri-close-line" /></button>}
                      </div>
                    </div>
                  ))}
                </div>
                <button onClick={addEducation} className="opacity-0 group-hover:opacity-100 mt-1.5 text-[8px] font-medium" style={{ color: `${theme.headerText}80` }}><i className="ri-add-line mr-0.5" />Add</button>
              </div>
            )}
          </div>
          {/* Main body */}
          <div className="flex-1 px-6 py-6">
            {mainSections.map((s, i) => renderSection(s, i, config.headingStyle, config.skillLayout))}
          </div>
        </div>
      );
    }

    /* ─── Layout: sidebar-right ─── */
    if (config.layout === 'sidebar-right') {
      return (
        <div ref={resumeRef} className="w-[612px] bg-white shadow-2xl rounded-sm overflow-hidden" style={{ fontFamily }}>
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
          <div className="flex">
            <div className="flex-1 px-6 py-5 border-r border-gray-100">
              {mainSections.map((s, i) => renderSection(s, i, config.headingStyle, config.skillLayout))}
            </div>
            <div className="w-[185px] flex-shrink-0 px-4 py-5" style={{ backgroundColor: theme.primaryLight }}>
              {sidebarVisible.map((s, i) => renderSection(s, i, 'side', 'list'))}
            </div>
          </div>
        </div>
      );
    }

    /* ─── Layout: centered ─── */
    if (config.layout === 'centered') {
      return (
        <div ref={resumeRef} className="w-[612px] bg-white shadow-2xl rounded-sm overflow-hidden" style={{ fontFamily }}>
          <div className="h-2" style={{ backgroundColor: theme.primary }} />
          <div className="px-10 pt-6 pb-4 text-center">
            <EditableText value={data.name} onChange={(v) => update('name', v)} tag="h1" className="text-2xl font-bold tracking-wide mb-0.5" style={{ color: theme.primary }} placeholder="Your Name" />
            <EditableText value={data.title} onChange={(v) => update('title', v)} tag="p" className="text-[12px] font-normal uppercase tracking-[0.3em] text-gray-500 mb-4" placeholder="Professional Title" />
            <div className="w-16 h-px mx-auto mb-3" style={{ backgroundColor: theme.primary }} />
            <ContactRow color="#6b7280" separator="|" />
          </div>
          <div className="px-10 py-4">
            {visibleSections.map((s, i) => renderSection(s, i, config.headingStyle, config.skillLayout))}
          </div>
        </div>
      );
    }

    /* ─── Layout: minimal ─── */
    if (config.layout === 'minimal') {
      return (
        <div ref={resumeRef} className="w-[612px] bg-white shadow-2xl rounded-sm overflow-hidden" style={{ fontFamily }}>
          <div className="px-8 pt-7 pb-4">
            <EditableText value={data.name} onChange={(v) => update('name', v)} tag="h1" className="text-xl font-extrabold text-gray-900 mb-0.5" placeholder="Your Name" />
            <EditableText value={data.title} onChange={(v) => update('title', v)} tag="p" className="text-[12px] text-gray-500 mb-3" placeholder="Professional Title" />
            <div className="h-px bg-gray-200 mb-3" />
            <ContactRow color="#6b7280" />
          </div>
          <div className="px-8 pb-6">
            {visibleSections.map((s, i) => renderSection(s, i, config.headingStyle, config.skillLayout))}
          </div>
        </div>
      );
    }

    /* ─── Layout: bold-bars ─── */
    if (config.layout === 'bold-bars') {
      return (
        <div ref={resumeRef} className="w-[612px] bg-white shadow-2xl rounded-sm overflow-hidden" style={{ fontFamily }}>
          <div className="px-8 pt-6 pb-3">
            <EditableText value={data.name} onChange={(v) => update('name', v)} tag="h1" className="text-3xl font-black tracking-tight mb-0" style={{ color: theme.primary }} placeholder="Your Name" />
            <EditableText value={data.title} onChange={(v) => update('title', v)} tag="p" className="text-[13px] font-semibold uppercase tracking-[0.15em] text-gray-400 mb-3" placeholder="Professional Title" />
            <ContactRow color="#6b7280" separator="|" />
          </div>
          <div className="px-8 py-4">
            {visibleSections.map((s, i) => (
              <div key={s.id}>
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
    }

    /* ─── Layout: timeline ─── */
    if (config.layout === 'timeline') {
      return (
        <div ref={resumeRef} className="w-[612px] bg-white shadow-2xl rounded-sm overflow-hidden" style={{ fontFamily }}>
          <div className="px-8 pt-6 pb-3">
            <EditableText value={data.name} onChange={(v) => update('name', v)} tag="h1" className="text-xl font-extrabold mb-0.5" style={{ color: theme.primary }} placeholder="Your Name" />
            <EditableText value={data.title} onChange={(v) => update('title', v)} tag="p" className="text-[12px] text-gray-500 mb-3" placeholder="Professional Title" />
            <ContactRow color="#6b7280" />
          </div>
          <div className="px-8 py-4">
            {visibleSections.find((s) => s.id === 'summary') && (
              <SectionWrapper section={visibleSections.find((s) => s.id === 'summary')!} index={0} total={visibleSections.length} onMove={moveSection} onToggle={toggleSection}>
                <SummaryBlock headingStyle={config.headingStyle} />
              </SectionWrapper>
            )}
            {visibleSections.find((s) => s.id === 'experience') && (
              <SectionWrapper section={visibleSections.find((s) => s.id === 'experience')!} index={visibleSections.findIndex((s) => s.id === 'experience')} total={visibleSections.length} onMove={moveSection} onToggle={toggleSection}>
                <div className="mb-5" data-resume-section="experience">
                  <div className="flex items-center justify-between">
                    <SectionHeading label="Work Experience" icon="ri-briefcase-line" color={theme.sectionLine} borderColor={theme.sectionLine} style={config.headingStyle} />
                    <button onClick={addExperience} className="opacity-0 group-hover:opacity-100 text-[10px] px-2 py-0.5 rounded bg-gray-100 text-gray-600 hover:bg-blue-100 hover:text-blue-700 font-medium"><i className="ri-add-line mr-0.5" />Add</button>
                  </div>
                  <div className="relative ml-3 mt-2">
                    <div className="absolute left-0 top-0 bottom-0 w-px border-l-2 border-dashed" style={{ borderColor: `${theme.primary}35` }} />
                    <div className="space-y-5 pl-6">
                      {data.experience.map((exp, i) => (
                        <div key={i} data-resume-entry className="relative group/exp">
                          <div className="absolute -right-1 top-0 flex items-center gap-0.5 opacity-0 group-hover/exp:opacity-100 transition-opacity">
                            {i > 0 && <button onClick={() => moveExperience(i, 'up')} className="w-5 h-5 flex items-center justify-center rounded bg-white shadow border border-gray-200 text-gray-400 hover:text-blue-600 text-[10px]"><i className="ri-arrow-up-s-line" /></button>}
                            {i < data.experience.length - 1 && <button onClick={() => moveExperience(i, 'down')} className="w-5 h-5 flex items-center justify-center rounded bg-white shadow border border-gray-200 text-gray-400 hover:text-blue-600 text-[10px]"><i className="ri-arrow-down-s-line" /></button>}
                            {data.experience.length > 1 && <button onClick={() => removeExperience(i)} className="w-5 h-5 flex items-center justify-center rounded bg-white shadow border border-gray-200 text-red-400 hover:text-red-600 text-[10px]"><i className="ri-delete-bin-line" /></button>}
                          </div>
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
                              <li key={j} data-resume-bullet className="flex items-start gap-1.5 group/bullet text-[11px] text-gray-600">
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
              </SectionWrapper>
            )}
            {visibleSections.filter((s) => s.id === 'skills' || s.id === 'education').map((s, i) => renderSection(s, i, config.headingStyle, config.skillLayout))}
          </div>
        </div>
      );
    }

    /* ─── Layout: two-col ─── */
    if (config.layout === 'two-col') {
      const leftSections = visibleSections.filter((s) => s.id === 'experience');
      const rightSections = visibleSections.filter((s) => s.id === 'summary' || s.id === 'skills' || s.id === 'education');
      return (
        <div ref={resumeRef} className="w-[612px] bg-white shadow-2xl rounded-sm overflow-hidden" style={{ fontFamily }}>
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
          <div className="flex">
            <div className="flex-1 px-5 py-4">
              {leftSections.map((s, i) => renderSection(s, i, config.headingStyle, config.skillLayout))}
            </div>
            <div className="w-[200px] flex-shrink-0 px-4 py-4 border-l" style={{ borderColor: `${theme.primary}15`, backgroundColor: `${theme.primaryLight}80` }}>
              {rightSections.map((s, i) => renderSection(s, i, 'side', 'list'))}
            </div>
          </div>
        </div>
      );
    }

    /* fallback — header-single */
    return (
      <div ref={resumeRef} className="w-[612px] bg-white shadow-2xl rounded-sm overflow-hidden" style={{ fontFamily: FONT_SANS }}>
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
          variantId={variantId}
          variantRationale={variantRationale}
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
              disabled={isDownloading || paymentLoading}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all disabled:opacity-50"
              style={{ backgroundColor: theme.primary }}
            >
              {paymentLoading ? (
                <>
                  <i className="ri-loader-4-line animate-spin" />
                  Checking...
                </>
              ) : !hasPaymentAccess ? (
                <>
                  <i className="ri-lock-line" />
                  Pay & Download
                </>
              ) : accessType === 'free' && freeDownloadsRemaining > 0 ? (
                <>
                  <i className="ri-gift-line" />
                  Download & Apply (Free)
                </>
              ) : (
                <>
                  <i className={`${isDownloading ? 'ri-loader-4-line animate-spin' : 'ri-download-2-line'}`} />
                  {isDownloading ? 'Exporting...' : activeSubscription ? 'Download & Apply ✨' : 'Download & Apply'}
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ─── Resume Preview ─── */}
      <div className="relative pl-12">
        {/* Multi-page container: gray surface behind page cards */}
        <div
          className={`relative ${
            totalPages > 1
              ? 'bg-slate-200/70 rounded-xl p-5'
              : ''
          }`}
          style={{ width: totalPages > 1 ? 652 : 612 }}
        >
          {/* Content layer: actual editable resumeRef (for editing + html2canvas capture) */}
          <div
            className="relative w-[612px]"
            style={{
              minHeight: A4_PAGE_HEIGHT,
              marginLeft: totalPages > 1 ? 0 : 0,
            }}
          >
            {renderTemplate()}

            {/* Per-page number watermarks (overlaid on content) */}
            {totalPages > 1 && pageRanges.map((range, idx) => (
              <div
                key={`pn-${idx}`}
                className="absolute right-4 z-10 pointer-events-none select-none"
                style={{ top: range.startY + range.height - 24 }}
              >
                <span className="text-[9px] font-medium text-gray-300">
                  {idx + 1} / {totalPages}
                </span>
              </div>
            ))}

            {/* Page-break gap overlays: solid strips that visually separate pages */}
            {pageBreakPositions.map((y, idx) => (
              <div
                key={`gap-${idx}`}
                className="absolute z-20 pointer-events-none"
                style={{
                  left: totalPages > 1 ? -20 : -16,
                  right: totalPages > 1 ? -20 : -16,
                  top: y - PAGE_GAP / 2,
                  height: PAGE_GAP,
                }}
              >
                {/* Top shadow: bottom edge of current page */}
                <div
                  className="absolute top-0 left-0 right-0 h-2"
                  style={{
                    background: 'linear-gradient(to bottom, rgba(255,255,255,0.9), transparent)',
                    boxShadow: '0 4px 12px -2px rgba(0,0,0,0.12)',
                  }}
                />
                {/* Gap area */}
                <div
                  className="w-full h-full flex items-center justify-center"
                  style={{ backgroundColor: totalPages > 1 ? '#cbd5e1' : '#e2e8f0' }}
                >
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-white/90 rounded-full shadow-sm border border-slate-300/60">
                    <i className="ri-file-line text-[10px] text-slate-400" />
                    <span className="text-[10px] font-semibold text-slate-500">
                      Page {idx + 2}
                    </span>
                  </div>
                </div>
                {/* Bottom shadow: top edge of next page */}
                <div
                  className="absolute bottom-0 left-0 right-0 h-2"
                  style={{
                    background: 'linear-gradient(to top, rgba(255,255,255,0.9), transparent)',
                    boxShadow: '0 -4px 12px -2px rgba(0,0,0,0.12)',
                  }}
                />
              </div>
            ))}
          </div>

          {/* "Page 1" label at top-right when multi-page */}
          {totalPages > 1 && (
            <div className="absolute top-7 right-7 pointer-events-none select-none">
              <span className="text-[10px] font-medium text-slate-400 bg-white/80 px-2 py-0.5 rounded-full border border-slate-200/60 shadow-sm">
                Page 1
              </span>
            </div>
          )}
        </div>

        {/* Page count indicator */}
        <div className={`mt-4 text-center text-xs font-medium ${
          totalPages > 1 ? 'text-amber-600' : 'text-emerald-600'
        }`}>
          {totalPages === 1
            ? <span className="flex items-center justify-center gap-1"><i className="ri-checkbox-circle-line" />Fits on 1 page</span>
            : <span className="flex items-center justify-center gap-1"><i className="ri-file-copy-2-line" />{totalPages} pages — consider condensing to fit on 1 page</span>
          }
        </div>
      </div>

      {/* Click-outside to close section picker */}
      {showAddSection && (
        <div className="fixed inset-0 z-40" onClick={() => setShowAddSection(false)} />
      )}

      {/* Coupon Modal for First Free Download */}
      {showCouponModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowCouponModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 animate-in fade-in zoom-in-95">
            <button
              onClick={() => setShowCouponModal(false)}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 transition-colors"
            >
              <i className="ri-close-line text-lg" />
            </button>

            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-2xl flex items-center justify-center">
                <i className="ri-gift-2-fill text-3xl text-emerald-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Your First Resume — Free! 🎉</h3>
              <p className="text-sm text-gray-500 mt-2">A coupon has been auto-applied for your first download</p>
            </div>

            <div className="space-y-4">
              {/* Auto-applied coupon badge */}
              <div className="relative">
                <div className="w-full px-4 py-3.5 rounded-xl border-2 border-emerald-300 bg-emerald-50/60 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <i className="ri-coupon-3-fill text-emerald-500 text-lg" />
                    <span className="text-lg font-bold tracking-wider text-emerald-700">FIRSTRESUME</span>
                  </div>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-semibold">
                    <i className="ri-check-line text-sm" />
                    Auto Applied
                  </span>
                </div>
              </div>

              {couponError && (
                <p className="text-sm text-red-500 flex items-center justify-center gap-1">
                  <i className="ri-error-warning-line" />
                  {couponError}
                </p>
              )}

              <button
                onClick={handleCouponSubmit}
                disabled={couponValidating}
                className="w-full py-3 rounded-xl text-white font-semibold text-base shadow-lg hover:shadow-xl hover:scale-[1.01] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: theme.primary }}
              >
                {couponValidating ? (
                  <><i className="ri-loader-4-line animate-spin mr-2" />Applying Coupon...</>
                ) : (
                  <><i className="ri-download-2-line mr-2" />Download & Apply — Free</>                )}
              </button>

              <p className="text-center text-xs text-gray-400">Your first optimized resume download is on us!</p>
            </div>
          </div>
        </div>
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

import { useState, useEffect, useRef, useCallback } from 'react';

export interface ChangeAnnotation {
  section: string;
  what_changed: string;
  why: string;
}

interface ChangeAnnotationsProps {
  changes: ChangeAnnotation[];
  keywords: string[];
  resumeContainerRef: React.RefObject<HTMLDivElement | null>;
}

/* ── Section name → data-resume-section value mapping ── */
const SECTION_MAP: Record<string, string> = {
  'professional summary': 'summary',
  'summary': 'summary',
  'profile': 'summary',
  'experience': 'experience',
  'work experience': 'experience',
  'employment': 'experience',
  'skills': 'skills',
  'technical skills': 'skills',
  'core skills': 'skills',
  'education': 'education',
  'certifications': 'education',
  'projects': 'experience',
};

function mapSectionToAttr(section: string): string {
  const lower = section.toLowerCase().trim();
  return SECTION_MAP[lower] || lower.split(/\s+/)[0];
}

/* ── Section Icon helper ── */
function sectionIcon(attr: string): string {
  switch (attr) {
    case 'summary': return 'ri-user-line';
    case 'experience': return 'ri-briefcase-line';
    case 'skills': return 'ri-tools-line';
    case 'education': return 'ri-graduation-cap-line';
    default: return 'ri-sticky-note-line';
  }
}

/* ── Single annotation card ── */
function AnnotationCard({
  annotation,
  top,
  isExpanded,
  onToggle,
  idx,
}: {
  annotation: ChangeAnnotation;
  top: number;
  isExpanded: boolean;
  onToggle: () => void;
  idx: number;
}) {
  const attr = mapSectionToAttr(annotation.section);
  return (
    <div
      className="absolute left-0 right-0 transition-all duration-200 group"
      style={{ top }}
    >
      {/* Connector line from resume to card */}
      <div
        className="absolute left-[-20px] top-[14px] w-[20px] h-[2px] bg-amber-300"
        style={{ opacity: isExpanded ? 1 : 0.5 }}
      />
      {/* The card */}
      <div
        onClick={onToggle}
        className={`
          relative cursor-pointer rounded-lg border transition-all duration-200 text-left
          ${isExpanded
            ? 'bg-amber-50 border-amber-300 shadow-md'
            : 'bg-white border-gray-200 shadow-sm hover:border-amber-300 hover:shadow-md'
          }
        `}
        style={{ padding: isExpanded ? '10px 12px' : '6px 10px' }}
      >
        {/* Index badge */}
        <div className="absolute -left-2 -top-2 w-5 h-5 rounded-full bg-amber-400 text-white text-[10px] font-bold flex items-center justify-center shadow-sm">
          {idx + 1}
        </div>

        {/* Collapsed: one-line summary */}
        {!isExpanded && (
          <div className="flex items-center gap-1.5 text-[11px] text-gray-600 leading-tight">
            <i className={`${sectionIcon(attr)} text-amber-500 text-xs flex-shrink-0`} />
            <span className="truncate font-medium">{annotation.section}</span>
            <i className="ri-arrow-down-s-line text-gray-400 text-xs ml-auto flex-shrink-0" />
          </div>
        )}

        {/* Expanded: full detail */}
        {isExpanded && (
          <div>
            <div className="flex items-center gap-1.5 mb-1.5">
              <i className={`${sectionIcon(attr)} text-amber-600 text-xs`} />
              <span className="text-[11px] font-bold text-gray-900 capitalize">{annotation.section}</span>
              <i className="ri-arrow-up-s-line text-gray-400 text-xs ml-auto" />
            </div>
            <p className="text-[11px] leading-[1.4] text-gray-700 mb-1.5">
              {annotation.what_changed}
            </p>
            <div className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-1 rounded inline-flex items-center gap-1">
              <i className="ri-lightbulb-line text-[10px]" />
              {annotation.why}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Keywords pill bar ── */
function KeywordsPill({ keywords }: { keywords: string[] }) {
  if (!keywords.length) return null;
  return (
    <div className="mb-3 px-1">
      <div className="flex items-center gap-1 mb-1.5">
        <i className="ri-hashtag text-blue-500 text-xs" />
        <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Keywords Added</span>
      </div>
      <div className="flex flex-wrap gap-1">
        {keywords.slice(0, 12).map((kw, i) => (
          <span
            key={i}
            className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 text-[10px] font-medium border border-blue-100"
          >
            {kw}
          </span>
        ))}
        {keywords.length > 12 && (
          <span className="px-2 py-0.5 rounded-full bg-gray-50 text-gray-400 text-[10px]">
            +{keywords.length - 12} more
          </span>
        )}
      </div>
    </div>
  );
}

/* ── Main ChangeAnnotations sidebar ── */
export default function ChangeAnnotations({ changes, keywords, resumeContainerRef }: ChangeAnnotationsProps) {
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);
  const [sectionTops, setSectionTops] = useState<Record<string, number>>({});
  const sidebarRef = useRef<HTMLDivElement>(null);

  /* Measure section positions from the resume DOM */
  const measureSections = useCallback(() => {
    const container = resumeContainerRef.current;
    if (!container) return;
    const containerRect = container.getBoundingClientRect();
    const tops: Record<string, number> = {};
    container.querySelectorAll('[data-resume-section]').forEach((el) => {
      const attr = (el as HTMLElement).getAttribute('data-resume-section') || '';
      if (!tops[attr]) {
        tops[attr] = (el as HTMLElement).getBoundingClientRect().top - containerRect.top;
      }
    });
    setSectionTops(tops);
  }, [resumeContainerRef]);

  useEffect(() => {
    measureSections();
    // Re-measure after layout settles
    const t1 = setTimeout(measureSections, 300);
    const t2 = setTimeout(measureSections, 1000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [measureSections, changes]);

  // Also observe resize
  useEffect(() => {
    const container = resumeContainerRef.current;
    if (!container) return;
    const ro = new ResizeObserver(() => measureSections());
    ro.observe(container);
    return () => ro.disconnect();
  }, [resumeContainerRef, measureSections]);

  if (!changes.length && !keywords.length) return null;

  /* Compute card positions: try to align with section, but prevent overlap */
  const MIN_GAP = 8;
  const COLLAPSED_HEIGHT = 32;
  const EXPANDED_HEIGHT = 110;

  const cardPositions: number[] = [];
  const sortedChanges = [...changes];

  // First pass: compute ideal positions
  sortedChanges.forEach((c) => {
    const attr = mapSectionToAttr(c.section);
    const idealTop = sectionTops[attr] ?? 0;
    cardPositions.push(idealTop);
  });

  // Second pass: resolve overlaps (push down)
  for (let i = 1; i < cardPositions.length; i++) {
    const prevHeight = expandedIdx === i - 1 ? EXPANDED_HEIGHT : COLLAPSED_HEIGHT;
    const minTop = cardPositions[i - 1] + prevHeight + MIN_GAP;
    if (cardPositions[i] < minTop) {
      cardPositions[i] = minTop;
    }
  }

  return (
    <div
      ref={sidebarRef}
      className="relative"
      style={{ width: 220, minHeight: 200 }}
    >
      {/* Header */}
      <div className="mb-3 px-1">
        <div className="flex items-center gap-1.5 mb-0.5">
          <i className="ri-chat-check-line text-amber-500 text-sm" />
          <span className="text-xs font-bold text-gray-700">Changes</span>
          <span className="text-[10px] text-gray-400 font-medium ml-auto">{changes.length} edits</span>
        </div>
        <div className="h-px bg-gradient-to-r from-amber-200 to-transparent" />
      </div>

      {/* Keywords */}
      <KeywordsPill keywords={keywords} />

      {/* Annotation cards */}
      <div className="relative" style={{ minHeight: cardPositions.length ? cardPositions[cardPositions.length - 1] + 120 : 100 }}>
        {sortedChanges.map((c, i) => (
          <AnnotationCard
            key={i}
            annotation={c}
            top={cardPositions[i]}
            isExpanded={expandedIdx === i}
            onToggle={() => setExpandedIdx(expandedIdx === i ? null : i)}
            idx={i}
          />
        ))}
      </div>
    </div>
  );
}

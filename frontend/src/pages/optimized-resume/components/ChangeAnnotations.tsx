import { useState, useEffect, useRef, useCallback } from 'react';

export interface ChangeAnnotation {
  section: string;
  what_changed?: string;
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
  'certifications': 'certifications',
  'achievements': 'achievements',
  'awards': 'achievements',
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

function sectionLabel(attr: string): string {
  switch (attr) {
    case 'summary': return 'Professional Summary';
    case 'experience': return 'Experience';
    case 'skills': return 'Skills';
    case 'education': return 'Education';
    default: return attr.charAt(0).toUpperCase() + attr.slice(1);
  }
}

/* ── Grouped section card ── */
function GroupedAnnotationCard({
  sectionAttr,
  items,
  top,
  isExpanded,
  onToggle,
}: {
  sectionAttr: string;
  items: ChangeAnnotation[];
  top: number;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      className="absolute left-0 right-0 transition-all duration-200"
      style={{ top }}
    >
      {/* Connector line */}
      <div
        className="absolute left-[-20px] top-[14px] w-[20px] h-[2px] bg-amber-300"
        style={{ opacity: isExpanded ? 1 : 0.5 }}
      />
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
        {/* Collapsed view */}
        {!isExpanded && (
          <div className="flex items-center gap-1.5 text-[11px] text-gray-600 leading-tight">
            <i className={`${sectionIcon(sectionAttr)} text-amber-500 text-xs flex-shrink-0`} />
            <span className="truncate font-medium">{sectionLabel(sectionAttr)}</span>
            <span className="ml-auto flex items-center gap-1 flex-shrink-0">
              <span className="text-[10px] text-amber-600 font-semibold bg-amber-100 px-1.5 py-0.5 rounded-full">{items.length}</span>
              <i className="ri-arrow-down-s-line text-gray-400 text-xs" />
            </span>
          </div>
        )}

        {/* Expanded view — show all changes in this section */}
        {isExpanded && (
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <i className={`${sectionIcon(sectionAttr)} text-amber-600 text-xs`} />
              <span className="text-[11px] font-bold text-gray-900">{sectionLabel(sectionAttr)}</span>
              <span className="text-[10px] text-amber-600 font-semibold bg-amber-100 px-1.5 py-0.5 rounded-full ml-1">{items.length} edits</span>
              <i className="ri-arrow-up-s-line text-gray-400 text-xs ml-auto" />
            </div>
            <div className="space-y-2">
              {items.map((item, j) => (
                <div key={j} className="pl-2 border-l-2 border-amber-200">
                  <p className="text-[10.5px] leading-[1.4] text-gray-700">{item.what_changed}</p>
                  <p className="text-[9.5px] text-emerald-600 mt-0.5 flex items-start gap-1">
                    <i className="ri-lightbulb-line text-[10px] mt-0.5 flex-shrink-0" />
                    <span>{item.why}</span>
                  </p>
                </div>
              ))}
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

/* ── Main ChangeAnnotations sidebar — grouped by section ── */
export default function ChangeAnnotations({ changes, keywords, resumeContainerRef }: ChangeAnnotationsProps) {
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);
  const [sectionTops, setSectionTops] = useState<Record<string, number>>({});
  const sidebarRef = useRef<HTMLDivElement>(null);

  /* Group changes by section attribute */
  const grouped = (() => {
    const map = new Map<string, ChangeAnnotation[]>();
    const order: string[] = [];
    for (const c of changes) {
      const attr = mapSectionToAttr(c.section);
      if (!map.has(attr)) {
        map.set(attr, []);
        order.push(attr);
      }
      map.get(attr)!.push(c);
    }
    return order.map(attr => ({ attr, items: map.get(attr)! }));
  })();

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
    const t1 = setTimeout(measureSections, 300);
    const t2 = setTimeout(measureSections, 1000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [measureSections, changes]);

  useEffect(() => {
    const container = resumeContainerRef.current;
    if (!container) return;
    const ro = new ResizeObserver(() => measureSections());
    ro.observe(container);
    return () => ro.disconnect();
  }, [resumeContainerRef, measureSections]);

  if (!grouped.length && !keywords.length) return null;

  /* Compute card positions — one per section group */
  const MIN_GAP = 12;
  const COLLAPSED_HEIGHT = 36;
  const EXPANDED_HEIGHT = 160;

  const cardPositions: number[] = [];
  grouped.forEach((g) => {
    const idealTop = sectionTops[g.attr] ?? 0;
    cardPositions.push(idealTop);
  });

  for (let i = 1; i < cardPositions.length; i++) {
    const prevHeight = expandedIdx === i - 1
      ? Math.min(EXPANDED_HEIGHT, 60 + grouped[i - 1].items.length * 50)
      : COLLAPSED_HEIGHT;
    const minTop = cardPositions[i - 1] + prevHeight + MIN_GAP;
    if (cardPositions[i] < minTop) {
      cardPositions[i] = minTop;
    }
  }

  const totalEdits = changes.length;

  return (
    <div
      ref={sidebarRef}
      className="relative w-full"
      style={{ minHeight: 200 }}
    >
      {/* Header */}
      <div className="mb-3 px-1">
        <div className="flex items-center gap-1.5 mb-0.5">
          <i className="ri-chat-check-line text-amber-500 text-sm" />
          <span className="text-xs font-bold text-gray-700">Changes</span>
          <span className="text-[10px] text-gray-400 font-medium ml-auto">{totalEdits} edits · {grouped.length} sections</span>
        </div>
        <div className="h-px bg-gradient-to-r from-amber-200 to-transparent" />
      </div>

      {/* Keywords */}
      <KeywordsPill keywords={keywords} />

      {/* Grouped annotation cards */}
      <div className="relative" style={{ minHeight: cardPositions.length ? cardPositions[cardPositions.length - 1] + 120 : 100 }}>
        {grouped.map((g, i) => (
          <GroupedAnnotationCard
            key={g.attr}
            sectionAttr={g.attr}
            items={g.items}
            top={cardPositions[i]}
            isExpanded={expandedIdx === i}
            onToggle={() => setExpandedIdx(expandedIdx === i ? null : i)}
          />
        ))}
      </div>
    </div>
  );
}

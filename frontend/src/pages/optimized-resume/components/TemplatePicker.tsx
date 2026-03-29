import { ColorTheme, TemplateId, ResumeTemplate, VariantId } from '../types';
import { getVariantTemplates, getVariantMeta, RESUME_TEMPLATES } from './themes';
import React from 'react';

/* ─────────────────────────────────────────────
   Layout-based thumbnail SVG previews
   Each template maps to a visual layout pattern
   ───────────────────────────────────────────── */

type ThumbLayout = 'header-single' | 'sidebar-left' | 'sidebar-right' | 'centered' | 'minimal' | 'bold-bars' | 'timeline' | 'two-col';

/* Map template IDs to thumbnail layout patterns */
function getThumbLayout(templateId: string): ThumbLayout {
  if (templateId.includes('sidebar') || templateId.includes('system-arch') || templateId.includes('expert') || templateId.includes('design-process') || templateId.includes('flexi') || templateId.includes('lab')) return 'sidebar-left';
  if (templateId.includes('professional') || templateId.includes('compact') || templateId.includes('case-study') || templateId.includes('hybrid') || templateId.includes('transfer') || templateId.includes('process-') || templateId.includes('numbers-lead') || templateId.includes('board-ready')) return 'sidebar-right';
  if (templateId.includes('exec') || templateId.includes('centered') || templateId.includes('academic') || templateId.includes('scholar') || templateId.includes('credential') || templateId.includes('portfolio-hero') || templateId.includes('pivot') || templateId.includes('csuite') || templateId.includes('strategy') || templateId.includes('board-deck')) return 'centered';
  if (templateId.includes('minimal') || templateId.includes('terminal') || templateId.includes('creative-min') || templateId.includes('fresh') || templateId.includes('compliance') || templateId.includes('clean')) return 'minimal';
  if (templateId.includes('bold') || templateId.includes('leadership') || templateId.includes('governance') || templateId.includes('matrix') || templateId.includes('breadth')) return 'bold-bars';
  if (templateId.includes('timeline') || templateId.includes('process-flow') || templateId.includes('narrative')) return 'timeline';
  if (templateId.includes('cross-func') || templateId.includes('tech-grid') || templateId.includes('results-dash')) return 'two-col';
  return 'header-single';
}

function TemplateThumbnail({ templateId, color }: { templateId: string; color: string }) {
  const lightColor = color + '25';
  const medColor = color + '60';
  const layout = getThumbLayout(templateId);

  const thumbs: Record<ThumbLayout, React.ReactElement> = {
    'header-single': (
      <svg viewBox="0 0 60 80" className="w-full h-full">
        <rect width="60" height="80" fill="white" />
        <rect width="60" height="16" fill={color} />
        <rect x="4" y="4" width="20" height="3" rx="1" fill="white" opacity="0.9" />
        <rect x="4" y="9" width="30" height="2" rx="0.5" fill="white" opacity="0.5" />
        <rect x="4" y="22" width="52" height="1" fill={medColor} />
        <rect x="4" y="26" width="42" height="2" rx="0.5" fill="#d1d5db" />
        <rect x="4" y="30" width="50" height="2" rx="0.5" fill="#e5e7eb" />
        <rect x="4" y="34" width="46" height="2" rx="0.5" fill="#e5e7eb" />
        <rect x="4" y="40" width="52" height="1" fill={medColor} />
        <rect x="4" y="44" width="18" height="3" rx="1" fill={lightColor} />
        <rect x="4" y="49" width="44" height="2" rx="0.5" fill="#e5e7eb" />
        <rect x="4" y="53" width="48" height="2" rx="0.5" fill="#e5e7eb" />
        <rect x="4" y="57" width="40" height="2" rx="0.5" fill="#e5e7eb" />
        <rect x="4" y="63" width="52" height="1" fill={medColor} />
        <rect x="4" y="67" width="14" height="4" rx="2" fill={lightColor} />
        <rect x="20" y="67" width="14" height="4" rx="2" fill={lightColor} />
        <rect x="36" y="67" width="14" height="4" rx="2" fill={lightColor} />
        <rect x="4" y="73" width="14" height="4" rx="2" fill={lightColor} />
        <rect x="20" y="73" width="14" height="4" rx="2" fill={lightColor} />
      </svg>
    ),
    'sidebar-left': (
      <svg viewBox="0 0 60 80" className="w-full h-full">
        <rect width="60" height="80" fill="white" />
        <rect width="20" height="80" fill={color} />
        <rect x="3" y="5" width="14" height="3" rx="1" fill="white" opacity="0.9" />
        <rect x="3" y="10" width="14" height="2" rx="0.5" fill="white" opacity="0.5" />
        <rect x="3" y="18" width="14" height="1" rx="0.5" fill="white" opacity="0.3" />
        <rect x="3" y="21" width="14" height="1" rx="0.5" fill="white" opacity="0.3" />
        <rect x="3" y="24" width="14" height="1" rx="0.5" fill="white" opacity="0.3" />
        <rect x="3" y="32" width="12" height="3" rx="1.5" fill="white" opacity="0.15" />
        <rect x="3" y="37" width="12" height="3" rx="1.5" fill="white" opacity="0.15" />
        <rect x="3" y="42" width="12" height="3" rx="1.5" fill="white" opacity="0.15" />
        <rect x="24" y="8" width="32" height="1" fill={medColor} />
        <rect x="24" y="12" width="30" height="2" rx="0.5" fill="#d1d5db" />
        <rect x="24" y="16" width="32" height="2" rx="0.5" fill="#e5e7eb" />
        <rect x="24" y="24" width="32" height="1" fill={medColor} />
        <rect x="24" y="28" width="14" height="3" rx="1" fill="#e5e7eb" />
        <rect x="24" y="33" width="30" height="2" rx="0.5" fill="#e5e7eb" />
        <rect x="24" y="37" width="32" height="2" rx="0.5" fill="#e5e7eb" />
        <rect x="24" y="41" width="28" height="2" rx="0.5" fill="#e5e7eb" />
        <rect x="24" y="48" width="14" height="3" rx="1" fill="#e5e7eb" />
        <rect x="24" y="53" width="30" height="2" rx="0.5" fill="#e5e7eb" />
        <rect x="24" y="57" width="32" height="2" rx="0.5" fill="#e5e7eb" />
      </svg>
    ),
    centered: (
      <svg viewBox="0 0 60 80" className="w-full h-full">
        <rect width="60" height="80" fill="white" />
        <rect width="60" height="2" fill={color} />
        <rect x="15" y="8" width="30" height="4" rx="1" fill={color} opacity="0.15" />
        <rect x="20" y="14" width="20" height="2" rx="0.5" fill="#d1d5db" />
        <rect x="22" y="18" width="16" height="1" fill={color} />
        <rect x="10" y="22" width="40" height="2" rx="0.5" fill="#e5e7eb" />
        <rect x="4" y="30" width="52" height="1" fill={medColor} />
        <rect x="4" y="34" width="42" height="2" rx="0.5" fill="#d1d5db" />
        <rect x="4" y="38" width="50" height="2" rx="0.5" fill="#e5e7eb" />
        <rect x="4" y="42" width="46" height="2" rx="0.5" fill="#e5e7eb" />
        <rect x="4" y="50" width="52" height="1" fill={medColor} />
        <rect x="4" y="54" width="18" height="3" rx="1" fill="#e5e7eb" />
        <rect x="4" y="59" width="48" height="2" rx="0.5" fill="#e5e7eb" />
        <rect x="4" y="63" width="44" height="2" rx="0.5" fill="#e5e7eb" />
        <rect x="4" y="70" width="52" height="1" fill={medColor} />
        <rect x="4" y="74" width="14" height="4" rx="2" fill={lightColor} />
        <rect x="20" y="74" width="14" height="4" rx="2" fill={lightColor} />
        <rect x="36" y="74" width="14" height="4" rx="2" fill={lightColor} />
      </svg>
    ),
    minimal: (
      <svg viewBox="0 0 60 80" className="w-full h-full">
        <rect width="60" height="80" fill="white" />
        <rect x="4" y="6" width="28" height="5" rx="1" fill="#374151" />
        <rect x="4" y="13" width="18" height="2" rx="0.5" fill="#9ca3af" />
        <rect x="4" y="18" width="52" height="0.5" fill="#e5e7eb" />
        <rect x="4" y="22" width="40" height="1.5" rx="0.5" fill="#d1d5db" />
        <rect x="4" y="28" width="52" height="0.5" fill="#e5e7eb" />
        <rect x="4" y="32" width="42" height="2" rx="0.5" fill="#d1d5db" />
        <rect x="4" y="36" width="50" height="1.5" rx="0.5" fill="#e5e7eb" />
        <rect x="4" y="39" width="46" height="1.5" rx="0.5" fill="#e5e7eb" />
        <rect x="4" y="45" width="52" height="0.5" fill="#e5e7eb" />
        <rect x="4" y="49" width="18" height="3" rx="1" fill="#e5e7eb" />
        <rect x="4" y="54" width="48" height="1.5" rx="0.5" fill="#e5e7eb" />
        <rect x="4" y="57" width="50" height="1.5" rx="0.5" fill="#e5e7eb" />
        <rect x="4" y="60" width="44" height="1.5" rx="0.5" fill="#e5e7eb" />
        <rect x="4" y="66" width="52" height="0.5" fill="#e5e7eb" />
        <rect x="4" y="70" width="14" height="3" rx="1.5" fill={lightColor} />
        <rect x="20" y="70" width="14" height="3" rx="1.5" fill={lightColor} />
        <rect x="36" y="70" width="14" height="3" rx="1.5" fill={lightColor} />
      </svg>
    ),
    'sidebar-right': (
      <svg viewBox="0 0 60 80" className="w-full h-full">
        <rect width="60" height="80" fill="white" />
        <rect width="60" height="14" fill={color} />
        <rect x="4" y="3" width="20" height="3" rx="1" fill="white" opacity="0.9" />
        <rect x="4" y="8" width="14" height="2" rx="0.5" fill="white" opacity="0.5" />
        <rect x="38" y="4" width="18" height="1.5" rx="0.5" fill="white" opacity="0.4" />
        <rect x="38" y="7" width="18" height="1.5" rx="0.5" fill="white" opacity="0.4" />
        <rect x="38" y="10" width="18" height="1.5" rx="0.5" fill="white" opacity="0.4" />
        <rect width="40" height="66" y="14" fill="white" />
        <rect x="40" y="14" width="20" height="66" fill={lightColor} />
        <rect x="4" y="20" width="32" height="1" fill={medColor} />
        <rect x="4" y="24" width="30" height="2" rx="0.5" fill="#d1d5db" />
        <rect x="4" y="28" width="32" height="2" rx="0.5" fill="#e5e7eb" />
        <rect x="4" y="36" width="32" height="1" fill={medColor} />
        <rect x="4" y="40" width="16" height="3" rx="1" fill="#e5e7eb" />
        <rect x="4" y="45" width="30" height="2" rx="0.5" fill="#e5e7eb" />
        <rect x="4" y="49" width="32" height="2" rx="0.5" fill="#e5e7eb" />
        <rect x="43" y="18" width="14" height="1" fill={color} opacity="0.4" />
        <rect x="43" y="22" width="14" height="2" rx="0.5" fill={color} opacity="0.2" />
        <rect x="43" y="26" width="14" height="2" rx="0.5" fill={color} opacity="0.2" />
        <rect x="43" y="30" width="14" height="2" rx="0.5" fill={color} opacity="0.2" />
        <rect x="43" y="38" width="14" height="1" fill={color} opacity="0.4" />
        <rect x="43" y="42" width="14" height="2" rx="0.5" fill={color} opacity="0.2" />
        <rect x="43" y="46" width="14" height="2" rx="0.5" fill={color} opacity="0.2" />
      </svg>
    ),
    'bold-bars': (
      <svg viewBox="0 0 60 80" className="w-full h-full">
        <rect width="60" height="80" fill="white" />
        <rect x="4" y="4" width="36" height="7" rx="1" fill={color} opacity="0.15" />
        <rect x="4" y="13" width="20" height="2.5" rx="0.5" fill={color} opacity="0.4" />
        <rect x="4" y="18" width="40" height="1.5" rx="0.5" fill="#d1d5db" />
        <rect x="4" y="21" width="52" height="3" fill={color} />
        <rect x="4" y="28" width="50" height="2" rx="0.5" fill="#e5e7eb" />
        <rect x="4" y="32" width="46" height="2" rx="0.5" fill="#e5e7eb" />
        <rect x="4" y="38" width="52" height="3" fill={color} />
        <rect x="4" y="44" width="18" height="3" rx="1" fill="#e5e7eb" />
        <rect x="4" y="49" width="48" height="2" rx="0.5" fill="#e5e7eb" />
        <rect x="4" y="53" width="50" height="2" rx="0.5" fill="#e5e7eb" />
        <rect x="4" y="57" width="44" height="2" rx="0.5" fill="#e5e7eb" />
        <rect x="4" y="63" width="52" height="3" fill={color} />
        <rect x="4" y="69" width="14" height="4" rx="2" fill={lightColor} />
        <rect x="20" y="69" width="14" height="4" rx="2" fill={lightColor} />
        <rect x="36" y="69" width="14" height="4" rx="2" fill={lightColor} />
      </svg>
    ),
    timeline: (
      <svg viewBox="0 0 60 80" className="w-full h-full">
        <rect width="60" height="80" fill="white" />
        <rect x="4" y="4" width="24" height="4" rx="1" fill={color} />
        <rect x="4" y="10" width="16" height="2" rx="0.5" fill="#9ca3af" />
        <rect x="4" y="14" width="40" height="1.5" rx="0.5" fill="#d1d5db" />
        <rect x="4" y="20" width="52" height="1" fill={medColor} />
        <line x1="12" y1="25" x2="12" y2="58" stroke={color} strokeWidth="1" strokeDasharray="2 2" opacity="0.3" />
        <circle cx="12" cy="26" r="2" fill={color} />
        <rect x="18" y="24" width="16" height="2.5" rx="0.5" fill="#d1d5db" />
        <rect x="18" y="28" width="34" height="1.5" rx="0.5" fill="#e5e7eb" />
        <rect x="18" y="31" width="30" height="1.5" rx="0.5" fill="#e5e7eb" />
        <circle cx="12" cy="38" r="2" fill={color} />
        <rect x="18" y="36" width="16" height="2.5" rx="0.5" fill="#d1d5db" />
        <rect x="18" y="40" width="34" height="1.5" rx="0.5" fill="#e5e7eb" />
        <rect x="18" y="43" width="30" height="1.5" rx="0.5" fill="#e5e7eb" />
        <circle cx="12" cy="50" r="2" fill={color} />
        <rect x="18" y="48" width="16" height="2.5" rx="0.5" fill="#d1d5db" />
        <rect x="18" y="52" width="34" height="1.5" rx="0.5" fill="#e5e7eb" />
        <rect x="18" y="55" width="30" height="1.5" rx="0.5" fill="#e5e7eb" />
        <rect x="4" y="62" width="52" height="1" fill={medColor} />
        <rect x="4" y="66" width="12" height="3.5" rx="1.5" fill={lightColor} />
        <rect x="18" y="66" width="12" height="3.5" rx="1.5" fill={lightColor} />
        <rect x="32" y="66" width="12" height="3.5" rx="1.5" fill={lightColor} />
        <rect x="4" y="72" width="12" height="3.5" rx="1.5" fill={lightColor} />
        <rect x="18" y="72" width="12" height="3.5" rx="1.5" fill={lightColor} />
      </svg>
    ),
    'two-col': (
      <svg viewBox="0 0 60 80" className="w-full h-full">
        <rect width="60" height="80" fill="white" />
        <rect width="60" height="12" fill={color} />
        <rect x="4" y="3" width="18" height="3" rx="1" fill="white" opacity="0.9" />
        <rect x="4" y="7.5" width="52" height="1" rx="0.5" fill="white" opacity="0.3" />
        <rect x="4" y="16" width="26" height="1" fill={medColor} />
        <rect x="4" y="19" width="24" height="1.5" rx="0.5" fill="#d1d5db" />
        <rect x="4" y="22" width="26" height="1.5" rx="0.5" fill="#e5e7eb" />
        <rect x="4" y="25" width="24" height="1.5" rx="0.5" fill="#e5e7eb" />
        <rect x="33" y="16" width="24" height="1" fill={medColor} />
        <rect x="33" y="19" width="22" height="1.5" rx="0.5" fill="#d1d5db" />
        <rect x="33" y="22" width="24" height="1.5" rx="0.5" fill="#e5e7eb" />
        <rect x="33" y="25" width="22" height="1.5" rx="0.5" fill="#e5e7eb" />
        <rect x="4" y="30" width="26" height="1" fill={medColor} />
        <rect x="4" y="33" width="14" height="2.5" rx="1" fill="#e5e7eb" />
        <rect x="4" y="37" width="24" height="1.5" rx="0.5" fill="#e5e7eb" />
        <rect x="4" y="40" width="26" height="1.5" rx="0.5" fill="#e5e7eb" />
        <rect x="4" y="43" width="22" height="1.5" rx="0.5" fill="#e5e7eb" />
        <rect x="33" y="30" width="24" height="1" fill={medColor} />
        <rect x="33" y="33" width="14" height="2.5" rx="1" fill="#e5e7eb" />
        <rect x="33" y="37" width="22" height="1.5" rx="0.5" fill="#e5e7eb" />
        <rect x="33" y="40" width="24" height="1.5" rx="0.5" fill="#e5e7eb" />
        <rect x="4" y="49" width="52" height="1" fill={medColor} />
        <rect x="4" y="53" width="10" height="3" rx="1.5" fill={lightColor} />
        <rect x="16" y="53" width="10" height="3" rx="1.5" fill={lightColor} />
        <rect x="28" y="53" width="10" height="3" rx="1.5" fill={lightColor} />
        <rect x="40" y="53" width="10" height="3" rx="1.5" fill={lightColor} />
        <rect x="4" y="59" width="10" height="3" rx="1.5" fill={lightColor} />
        <rect x="16" y="59" width="10" height="3" rx="1.5" fill={lightColor} />
      </svg>
    ),
  };

  return thumbs[layout] || thumbs['header-single'];
}

/* ─────────────────────────────────────────────
   Template Picker — variant-scoped with reasoning
   Shows 5 templates specific to the recommended variant
   ───────────────────────────────────────────── */

export default function TemplatePicker({
  activeTemplateId,
  activeTheme,
  onSelectTemplate,
  onSelectTheme,
  variantId,
  variantRationale,
}: {
  activeTemplateId: TemplateId;
  activeTheme: ColorTheme;
  onSelectTemplate: (id: TemplateId) => void;
  onSelectTheme: (theme: ColorTheme) => void;
  variantId?: string;
  variantRationale?: string;
}) {
  const variantMeta = variantId ? getVariantMeta(variantId) : null;
  const templates = variantId ? getVariantTemplates(variantId) : RESUME_TEMPLATES.slice(0, 5);
  const activeTemplate = templates.find((t) => t.id === activeTemplateId) || templates[0];

  return (
    <div className="w-full">
      {/* ── Variant reasoning header ── */}
      {variantMeta && (
        <div className="mb-4 p-3.5 rounded-xl bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-100">
          <div className="flex items-start gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-100 flex items-center justify-center flex-shrink-0 mt-0.5">
              <i className="ri-lightbulb-flash-line text-teal-600 text-base" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="text-[10px] font-bold uppercase tracking-wide text-teal-700 bg-teal-100 px-2 py-0.5 rounded-md">
                  {variantMeta.id} · {variantMeta.name}
                </span>
                <span className="text-[10px] text-teal-600 font-medium">{variantMeta.tagline}</span>
              </div>
              {variantRationale && (
                <p className="text-xs text-gray-600 leading-relaxed">{variantRationale}</p>
              )}
              <p className="text-[10px] text-teal-600 mt-1.5 font-medium">
                <i className="ri-arrow-down-s-line mr-0.5" />
                These {templates.length} templates are designed specifically for this variant
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Section label */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <i className="ri-layout-masonry-line text-gray-400" />
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            {variantMeta ? `${variantMeta.name} Templates` : 'Choose Template'}
          </span>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-100">
          <i className="ri-shield-check-fill text-[10px] text-emerald-500" />
          <span className="text-[10px] font-semibold text-emerald-700">All ATS-Friendly</span>
        </div>
      </div>

      {/* Template cards — horizontal scroll */}
      <div className="flex gap-3 overflow-x-auto pb-3 snap-x snap-mandatory scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent -mx-1 px-1">
        {templates.map((tpl) => {
          const isActive = tpl.id === activeTemplateId;
          return (
            <button
              key={tpl.id}
              onClick={() => onSelectTemplate(tpl.id)}
              className={`group relative flex-shrink-0 snap-start rounded-xl transition-all duration-200 ${
                isActive
                  ? 'ring-2 ring-blue-500 shadow-lg shadow-blue-100 scale-[1.02]'
                  : 'ring-1 ring-gray-200 hover:ring-gray-300 hover:shadow-md hover:scale-[1.01]'
              }`}
              style={{ width: 130 }}
            >
              {/* Thumbnail preview */}
              <div className={`relative w-full rounded-t-xl overflow-hidden bg-gray-50 p-1.5 ${isActive ? 'bg-blue-50/50' : ''}`}>
                <div className="w-full aspect-[3/4] rounded-md overflow-hidden shadow-sm border border-gray-100">
                  <TemplateThumbnail
                    templateId={tpl.id}
                    color={isActive ? activeTheme.primary : tpl.colors[0].primary}
                  />
                </div>
                {isActive && (
                  <div className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center shadow-md">
                    <i className="ri-check-line text-white text-[10px]" />
                  </div>
                )}
              </div>

              {/* Label + description */}
              <div className={`px-2.5 py-2 rounded-b-xl text-left ${isActive ? 'bg-blue-50/80' : 'bg-white'}`}>
                <p className={`text-[11px] font-bold truncate ${isActive ? 'text-blue-700' : 'text-gray-700'}`}>
                  {tpl.name}
                </p>
                <p className="text-[9px] text-gray-400 mt-0.5 line-clamp-2 leading-tight">{tpl.description}</p>
                <div className="flex items-center gap-0.5 mt-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <i
                      key={i}
                      className={`ri-shield-check-fill text-[7px] ${
                        i < tpl.atsScore ? 'text-emerald-400' : 'text-gray-200'
                      }`}
                    />
                  ))}
                  <span className="text-[8px] text-gray-400 ml-0.5 font-medium">ATS</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Color theme selector for active template */}
      {activeTemplate && (
        <div className="mt-3 flex items-center gap-3 px-1">
          <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider flex-shrink-0">Color</span>
          <div className="flex items-center gap-2">
            {activeTemplate.colors.map((c) => {
              const isActiveColor = activeTheme.id === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => onSelectTheme(c)}
                  className={`group relative w-7 h-7 rounded-full transition-all duration-200 ${
                    isActiveColor
                      ? 'ring-2 ring-offset-2 ring-blue-500 scale-110'
                      : 'ring-1 ring-gray-200 hover:ring-gray-400 hover:scale-105'
                  }`}
                  style={{ backgroundColor: c.primary }}
                  title={c.name}
                >
                  {isActiveColor && (
                    <i className="ri-check-line text-white text-[10px] absolute inset-0 flex items-center justify-center" />
                  )}
                </button>
              );
            })}
          </div>
          <span className="text-[10px] text-gray-400 ml-1">{activeTheme.name}</span>
        </div>
      )}
    </div>
  );
}

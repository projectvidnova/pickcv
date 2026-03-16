import { ColorTheme, TemplateId } from '../types';
import { RESUME_TEMPLATES } from './themes';
import React from 'react';

/* ─────────────────────────────────────────────
   Mini resume thumbnail SVG previews
   Shows a stylized layout preview per template
   ───────────────────────────────────────────── */

function TemplateThumbnail({ templateId, color }: { templateId: TemplateId; color: string }) {
  const lightColor = color + '25';
  const medColor = color + '60';

  const thumbnails: Record<string, React.ReactElement> = {
    classic: (
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
    modern: (
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
    executive: (
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
        <rect x="4" y="6" width="24" height="4" rx="1" fill="#1f2937" />
        <rect x="4" y="12" width="16" height="2" rx="0.5" fill="#9ca3af" />
        <rect x="4" y="17" width="52" height="0.5" fill="#e5e7eb" />
        <rect x="4" y="20" width="30" height="2" rx="0.5" fill="#9ca3af" />
        <rect x="4" y="26" width="52" height="0.5" fill="#e5e7eb" />
        <rect x="4" y="30" width="40" height="2" rx="0.5" fill="#d1d5db" />
        <rect x="4" y="34" width="50" height="2" rx="0.5" fill="#e5e7eb" />
        <rect x="4" y="38" width="46" height="2" rx="0.5" fill="#e5e7eb" />
        <rect x="4" y="44" width="52" height="0.5" fill="#e5e7eb" />
        <rect x="4" y="48" width="18" height="3" rx="1" fill="#f3f4f6" />
        <rect x="4" y="53" width="48" height="2" rx="0.5" fill="#e5e7eb" />
        <rect x="4" y="57" width="44" height="2" rx="0.5" fill="#e5e7eb" />
        <rect x="4" y="63" width="52" height="0.5" fill="#e5e7eb" />
        <rect x="4" y="67" width="12" height="3.5" rx="1.5" fill="#f3f4f6" />
        <rect x="18" y="67" width="12" height="3.5" rx="1.5" fill="#f3f4f6" />
        <rect x="32" y="67" width="12" height="3.5" rx="1.5" fill="#f3f4f6" />
        <rect x="4" y="73" width="12" height="3.5" rx="1.5" fill="#f3f4f6" />
        <rect x="18" y="73" width="12" height="3.5" rx="1.5" fill="#f3f4f6" />
      </svg>
    ),
    professional: (
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
    elegant: (
      <svg viewBox="0 0 60 80" className="w-full h-full">
        <rect width="60" height="80" fill="white" />
        <rect x="4" y="3" width="52" height="0.5" fill={color} />
        <rect x="14" y="8" width="32" height="4" rx="1" fill={color} opacity="0.1" />
        <rect x="18" y="14" width="24" height="2" rx="0.5" fill="#9ca3af" />
        <line x1="18" y1="19" x2="42" y2="19" stroke={color} strokeWidth="0.5" />
        <rect x="10" y="22" width="40" height="1.5" rx="0.5" fill="#d1d5db" />
        <rect x="4" y="30" width="20" height="2" rx="0.5" fill={color} opacity="0.6" />
        <rect x="4" y="34" width="50" height="2" rx="0.5" fill="#e5e7eb" />
        <rect x="4" y="38" width="46" height="2" rx="0.5" fill="#e5e7eb" />
        <rect x="4" y="42" width="48" height="2" rx="0.5" fill="#e5e7eb" />
        <rect x="4" y="50" width="20" height="2" rx="0.5" fill={color} opacity="0.6" />
        <rect x="4" y="54" width="18" height="3" rx="1" fill="#f3f4f6" />
        <rect x="4" y="59" width="48" height="2" rx="0.5" fill="#e5e7eb" />
        <rect x="4" y="63" width="44" height="2" rx="0.5" fill="#e5e7eb" />
        <rect x="4" y="70" width="20" height="2" rx="0.5" fill={color} opacity="0.6" />
        <rect x="4" y="74" width="40" height="2" rx="0.5" fill="#e5e7eb" />
        <rect x="56" y="76.5" width="0.5" height="0" fill={color} />
        <rect x="4" y="77.5" width="52" height="0.5" fill={color} />
      </svg>
    ),
    compact: (
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
    bold: (
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
    clean: (
      <svg viewBox="0 0 60 80" className="w-full h-full">
        <rect width="60" height="80" fill="white" />
        <rect x="4" y="6" width="22" height="3.5" rx="1" fill={color} opacity="0.12" />
        <rect x="4" y="12" width="14" height="2" rx="0.5" fill={color} opacity="0.35" />
        <rect x="4" y="17" width="52" height="0.5" fill={color} opacity="0.15" />
        <rect x="4" y="22" width="36" height="1.5" rx="0.5" fill="#d1d5db" />
        <rect x="4" y="26" width="52" height="0.5" fill={color} opacity="0.15" />
        <rect x="4" y="32" width="10" height="2" rx="0.5" fill={color} opacity="0.25" />
        <rect x="4" y="36" width="46" height="1.5" rx="0.5" fill="#e5e7eb" />
        <rect x="4" y="39" width="50" height="1.5" rx="0.5" fill="#e5e7eb" />
        <rect x="4" y="42" width="42" height="1.5" rx="0.5" fill="#e5e7eb" />
        <rect x="4" y="48" width="10" height="2" rx="0.5" fill={color} opacity="0.25" />
        <rect x="4" y="52" width="18" height="3" rx="1" fill="#f3f4f6" />
        <rect x="4" y="57" width="48" height="1.5" rx="0.5" fill="#e5e7eb" />
        <rect x="4" y="60" width="44" height="1.5" rx="0.5" fill="#e5e7eb" />
        <rect x="4" y="66" width="10" height="2" rx="0.5" fill={color} opacity="0.25" />
        <rect x="4" y="70" width="12" height="3.5" rx="1.5" fill={lightColor} />
        <rect x="18" y="70" width="12" height="3.5" rx="1.5" fill={lightColor} />
        <rect x="32" y="70" width="12" height="3.5" rx="1.5" fill={lightColor} />
        <rect x="46" y="70" width="10" height="3.5" rx="1.5" fill={lightColor} />
      </svg>
    ),
  };

  return thumbnails[templateId] || thumbnails.classic;
}

/* ─────────────────────────────────────────────
   Template Picker — visual horizontal card strip
   Always visible, no dropdown
   ───────────────────────────────────────────── */

export default function TemplatePicker({
  activeTemplateId,
  activeTheme,
  onSelectTemplate,
  onSelectTheme,
}: {
  activeTemplateId: TemplateId;
  activeTheme: ColorTheme;
  onSelectTemplate: (id: TemplateId) => void;
  onSelectTheme: (theme: ColorTheme) => void;
}) {
  const activeTemplate = RESUME_TEMPLATES.find((t) => t.id === activeTemplateId)!;

  return (
    <div className="w-full">
      {/* Section label */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <i className="ri-layout-masonry-line text-gray-400" />
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Choose Template</span>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-100">
          <i className="ri-shield-check-fill text-[10px] text-emerald-500" />
          <span className="text-[10px] font-semibold text-emerald-700">All ATS-Friendly</span>
        </div>
      </div>

      {/* Template cards — horizontal scroll */}
      <div className="flex gap-3 overflow-x-auto pb-3 snap-x snap-mandatory scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent -mx-1 px-1">
        {RESUME_TEMPLATES.map((tpl) => {
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
              style={{ width: 110 }}
            >
              {/* Thumbnail preview */}
              <div className={`relative w-full rounded-t-xl overflow-hidden bg-gray-50 p-1.5 ${isActive ? 'bg-blue-50/50' : ''}`}>
                <div className="w-full aspect-[3/4] rounded-md overflow-hidden shadow-sm border border-gray-100">
                  <TemplateThumbnail
                    templateId={tpl.id}
                    color={isActive ? activeTheme.primary : tpl.colors[0].primary}
                  />
                </div>
                {/* Active check badge */}
                {isActive && (
                  <div className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center shadow-md">
                    <i className="ri-check-line text-white text-[10px]" />
                  </div>
                )}
              </div>

              {/* Label */}
              <div className={`px-2.5 py-2 rounded-b-xl ${isActive ? 'bg-blue-50/80' : 'bg-white'}`}>
                <p className={`text-[11px] font-bold truncate ${isActive ? 'text-blue-700' : 'text-gray-700'}`}>
                  {tpl.name}
                </p>
                {/* ATS stars */}
                <div className="flex items-center gap-0.5 mt-0.5">
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
    </div>
  );
}

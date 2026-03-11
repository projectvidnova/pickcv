
import { useEffect, useRef, useState } from 'react';

interface JourneyTimelineProps {
  currentStep: number;
}

const getPhase = (step: number): number => {
  if (step <= 1) return 1;
  if (step === 2) return 2;
  if (step === 3) return 3;
  if (step === 4) return 4;
  return 5;
};

const steps = [
  {
    id: 1,
    title: 'Register',
    desc: 'Create your profile',
    image:
      'https://readdy.ai/api/search-image?query=a%20single%20cute%20tiny%203D%20rendered%20clay%20character%20mascot%20friendly%20robot%20waving%20hello%20with%20one%20hand%20raised%20round%20smooth%20body%20teal%20mint%20color%20scheme%20big%20expressive%20eyes%20standing%20on%20nothing%20pure%20white%20background%20Pixar%20Claymation%20style%20soft%20lighting%20minimal%20clean%20adorable%20no%20text%20no%20props%20centered&width=240&height=240&seq=char3d01&orientation=squarish',
    color: '#8b5cf6',
    glow: 'rgba(139,92,246,0.3)',
    ring: '#8b5cf6',
    tag: { bg: 'bg-violet-100', text: 'text-violet-600' },
    titleColor: 'text-violet-600',
    dot: 'bg-violet-500',
  },
  {
    id: 2,
    title: 'Build Resume',
    desc: 'AI-powered creation',
    image:
      'https://readdy.ai/api/search-image?query=a%20single%20cute%20tiny%203D%20rendered%20clay%20character%20mascot%20friendly%20robot%20holding%20a%20clipboard%20document%20writing%20notes%20round%20smooth%20body%20warm%20coral%20orange%20color%20scheme%20big%20expressive%20eyes%20standing%20on%20nothing%20pure%20white%20background%20Pixar%20Claymation%20style%20soft%20lighting%20minimal%20clean%20adorable%20no%20text%20centered&width=240&height=240&seq=char3d02&orientation=squarish',
    color: '#f97316',
    glow: 'rgba(249,115,22,0.3)',
    ring: '#f97316',
    tag: { bg: 'bg-orange-100', text: 'text-orange-600' },
    titleColor: 'text-orange-600',
    dot: 'bg-orange-500',
  },
  {
    id: 3,
    title: 'Find Jobs',
    desc: 'Match opportunities',
    image:
      'https://readdy.ai/api/search-image?query=a%20single%20cute%20tiny%203D%20rendered%20clay%20character%20mascot%20friendly%20robot%20looking%20through%20a%20telescope%20searching%20exploring%20round%20smooth%20body%20golden%20amber%20yellow%20color%20scheme%20big%20expressive%20eyes%20standing%20on%20nothing%20pure%20white%20background%20Pixar%20Claymation%20style%20soft%20lighting%20minimal%20clean%20adorable%20no%20text%20centered&width=240&height=240&seq=char3d03&orientation=squarish',
    color: '#f59e0b',
    glow: 'rgba(245,158,11,0.3)',
    ring: '#f59e0b',
    tag: { bg: 'bg-amber-100', text: 'text-amber-600' },
    titleColor: 'text-amber-600',
    dot: 'bg-amber-500',
  },
  {
    id: 4,
    title: 'Learn Skills',
    desc: 'Upskill if needed',
    image:
      'https://readdy.ai/api/search-image?query=a%20single%20cute%20tiny%203D%20rendered%20clay%20character%20mascot%20friendly%20robot%20sitting%20reading%20an%20open%20book%20with%20lightbulb%20above%20head%20round%20smooth%20body%20soft%20pink%20rose%20color%20scheme%20big%20expressive%20eyes%20pure%20white%20background%20Pixar%20Claymation%20style%20soft%20lighting%20minimal%20clean%20adorable%20no%20text%20centered&width=240&height=240&seq=char3d04&orientation=squarish',
    color: '#ec4899',
    glow: 'rgba(236,72,153,0.3)',
    ring: '#ec4899',
    tag: { bg: 'bg-pink-100', text: 'text-pink-600' },
    titleColor: 'text-pink-600',
    dot: 'bg-pink-500',
  },
  {
    id: 5,
    title: 'Land Job',
    desc: 'Your dream career',
    image:
      'https://readdy.ai/api/search-image?query=a%20single%20cute%20tiny%203D%20rendered%20clay%20character%20mascot%20friendly%20robot%20celebrating%20jumping%20with%20arms%20raised%20holding%20golden%20trophy%20cup%20confetti%20around%20round%20smooth%20body%20emerald%20green%20color%20scheme%20big%20expressive%20eyes%20pure%20white%20background%20Pixar%20Claymation%20style%20soft%20lighting%20minimal%20clean%20adorable%20no%20text%20centered&width=240&height=240&seq=char3d05&orientation=squarish',
    color: '#10b981',
    glow: 'rgba(16,185,129,0.3)',
    ring: '#10b981',
    tag: { bg: 'bg-emerald-100', text: 'text-emerald-600' },
    titleColor: 'text-emerald-600',
    dot: 'bg-emerald-500',
  },
] as const;

// SVG path that winds through all 5 character positions
// Characters are placed at alternating x positions in a 340px wide, 420px tall canvas
// Positions (cx, cy): 1=(60,42), 2=(280,126), 3=(60,210), 4=(280,294), 5=(60,378)
const PATH_D =
  'M60,42 C60,80 280,88 280,126 C280,164 60,172 60,210 C60,248 280,256 280,294 C280,332 60,340 60,378';

const CHAR_POSITIONS = [
  { cx: 60, cy: 42, alignRight: true },
  { cx: 280, cy: 126, alignRight: false },
  { cx: 60, cy: 210, alignRight: true },
  { cx: 280, cy: 294, alignRight: false },
  { cx: 60, cy: 378, alignRight: true },
];

export default function JourneyTimeline({ currentStep }: JourneyTimelineProps) {
  const [animated, setAnimated] = useState(false);
  const [pathLen, setPathLen] = useState(0);
  const pathRef = useRef<SVGPathElement>(null);
  const phase = getPhase(currentStep);

  useEffect(() => {
    if (pathRef.current) {
      setPathLen(pathRef.current.getTotalLength());
    }
  }, []);

  useEffect(() => {
    setAnimated(false);
    const t = setTimeout(() => setAnimated(true), 60);
    return () => clearTimeout(t);
  }, [phase]);

  // How much of the path to fill: each step covers 1/4 of the path
  const fillFraction = Math.min((phase - 1) / 4, 1);
  const filledLen = pathLen * fillFraction;
  const remainLen = pathLen - filledLen;

  return (
    <div className="w-full h-full flex flex-col items-center justify-between px-4 py-6 select-none">
      {/* Header */}
      <div className="text-center flex-shrink-0">
        <p className="text-[10px] font-bold tracking-[0.2em] text-slate-400 uppercase mb-0.5">
          Your Journey
        </p>
        <h2 className="text-base font-extrabold text-slate-800">5 Steps to Success</h2>
      </div>

      {/* SVG Canvas */}
      <div className="flex-1 w-full flex items-center justify-center">
        <div className="relative" style={{ width: 340, height: 420 }}>
          {/* Background path (gray) */}
          <svg
            className="absolute inset-0 pointer-events-none"
            width="340"
            height="420"
            viewBox="0 0 340 420"
          >
            <defs>
              <linearGradient id="pathGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#8b5cf6" />
                <stop offset="25%" stopColor="#f97316" />
                <stop offset="50%" stopColor="#f59e0b" />
                <stop offset="75%" stopColor="#ec4899" />
                <stop offset="100%" stopColor="#10b981" />
              </linearGradient>
            </defs>

            {/* Gray base path */}
            <path
              d={PATH_D}
              fill="none"
              stroke="#e2e8f0"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray="6 5"
            />

            {/* Colored filled path */}
            <path
              ref={pathRef}
              d={PATH_D}
              fill="none"
              stroke="url(#pathGrad)"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeDasharray={`${filledLen} ${remainLen}`}
              strokeDashoffset="0"
              style={{ transition: 'stroke-dasharray 0.8s cubic-bezier(0.4,0,0.2,1)' }}
            />
          </svg>

          {/* Characters */}
          {steps.map((step, idx) => {
            const pos = CHAR_POSITIONS[idx];
            const isActive = phase === step.id;
            const isDone = phase > step.id;
            const isRight = pos.alignRight;

            return (
              <div
                key={step.id}
                className="absolute flex items-center"
                style={{
                  left: pos.cx - 36,
                  top: pos.cy - 36,
                  opacity: animated ? 1 : 0,
                  transform: animated ? 'scale(1)' : 'scale(0.7)',
                  transition: `opacity 0.5s ease ${idx * 100}ms, transform 0.5s ease ${idx * 100}ms`,
                  zIndex: isActive ? 10 : 5,
                  flexDirection: isRight ? 'row' : 'row-reverse',
                }}
              >
                {/* Character bubble */}
                <div className="relative flex-shrink-0">
                  {/* Glow ring for active */}
                  {isActive && (
                    <div
                      className="absolute -inset-2 rounded-full"
                      style={{
                        backgroundColor: step.glow,
                        animation: 'pulse 2s ease-in-out infinite',
                      }}
                    />
                  )}

                  <div
                    className="relative overflow-hidden rounded-full"
                    style={{
                      width: isActive ? 76 : isDone ? 64 : 56,
                      height: isActive ? 76 : isDone ? 64 : 56,
                      border: `3px solid ${isActive ? step.color : isDone ? '#10b981' : '#e2e8f0'}`,
                      boxShadow: isActive
                        ? `0 0 0 4px ${step.glow}, 0 8px 24px ${step.glow}`
                        : isDone
                        ? '0 4px 12px rgba(16,185,129,0.2)'
                        : 'none',
                      filter: isDone || isActive ? 'none' : 'grayscale(0.7) opacity(0.5)',
                      transition: 'all 0.5s ease',
                      animation: isActive ? 'character-float 3s ease-in-out infinite' : 'none',
                    }}
                  >
                    <img
                      src={step.image}
                      alt={step.title}
                      className="w-full h-full object-cover"
                      loading="eager"
                    />
                  </div>

                  {/* Done checkmark */}
                  {isDone && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center border-2 border-white shadow-md">
                      <i className="ri-check-line text-white text-[9px]" />
                    </div>
                  )}

                  {/* Step number badge */}
                  {!isDone && (
                    <div
                      className="absolute -top-1 w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black border-2 border-white shadow"
                      style={{
                        right: isRight ? -4 : undefined,
                        left: isRight ? undefined : -4,
                        background: isActive ? step.color : '#cbd5e1',
                        color: isActive ? '#fff' : '#64748b',
                      }}
                    >
                      {step.id}
                    </div>
                  )}
                </div>

                {/* Label card */}
                <div
                  className={`${isRight ? 'ml-2.5 text-left' : 'mr-2.5 text-right'}`}
                  style={{ minWidth: 90 }}
                >
                  <div
                    className={`inline-block text-[8px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full mb-0.5 ${
                      isActive
                        ? `${step.tag.bg} ${step.tag.text}`
                        : isDone
                        ? 'bg-emerald-50 text-emerald-500'
                        : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    Step {step.id}
                  </div>
                  <div
                    className={`text-[13px] font-extrabold leading-tight transition-colors duration-500 ${
                      isActive ? step.titleColor : isDone ? 'text-emerald-600' : 'text-slate-400'
                    }`}
                  >
                    {step.title}
                  </div>
                  <div
                    className={`text-[10px] mt-0.5 transition-colors duration-500 ${
                      isActive ? 'text-slate-500' : 'text-slate-300'
                    }`}
                  >
                    {step.desc}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom stats */}
      <div className="flex items-center gap-5 flex-shrink-0 pb-1">
        <div className="text-center">
          <div className="text-sm font-black text-slate-800">New</div>
          <div className="text-[9px] text-slate-400 font-semibold">Launch</div>
        </div>
        <div className="w-px h-5 bg-slate-200" />
        <div className="text-center">
          <div className="text-sm font-black text-slate-800">98%</div>
          <div className="text-[9px] text-slate-400 font-semibold">Success</div>
        </div>
        <div className="w-px h-5 bg-slate-200" />
        <div className="text-center">
          <div className="text-sm font-black text-slate-800">3min</div>
          <div className="text-[9px] text-slate-400 font-semibold">Setup</div>
        </div>
      </div>
    </div>
  );
}

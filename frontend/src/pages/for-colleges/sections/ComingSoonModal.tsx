type CollegeAction = 'register' | 'signin';

interface ComingSoonModalProps {
  isOpen: boolean;
  action: CollegeAction;
  onClose: () => void;
}

export default function ComingSoonModal({ isOpen, action, onClose }: ComingSoonModalProps) {
  if (!isOpen) return null;

  const title = action === 'register' ? 'Institution Registration Is Launching Soon' : 'Institution Sign In Is Launching Soon';
  const subtitle = action === 'register'
    ? 'We are finalizing college onboarding, admin verification, and placement-cell setup.'
    : 'We are polishing institution sign in, student management, and recruiter workflows.';

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Coming soon"
    >
      <button
        className="absolute inset-0 bg-slate-900/55 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Close coming soon modal"
      />

      <div className="relative w-full max-w-lg glass-card rounded-3xl border border-white/60 p-7 sm:p-8 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-9 h-9 rounded-full glass hover:bg-white/80 text-gray-500 hover:text-gray-700 transition-colors"
          aria-label="Close"
        >
          <i className="ri-close-line text-lg" />
        </button>

        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-500 text-white flex items-center justify-center mb-5 shadow-lg shadow-teal-500/30">
          <i className="ri-graduation-cap-line text-2xl" />
        </div>

        <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight mb-3">{title}</h3>
        <p className="text-gray-600 leading-relaxed mb-6">{subtitle}</p>

        <div className="rounded-2xl border border-teal-100 bg-gradient-to-r from-teal-50 to-emerald-50 p-4 mb-6">
          <div className="flex items-center gap-2 text-teal-700 mb-1.5">
            <i className="ri-time-line" />
            <span className="text-sm font-semibold">Early access opening soon</span>
          </div>
          <p className="text-sm text-gray-600">
            Pick Camp is in final testing. Your institution will get a full AI-native placement workflow experience.
          </p>
        </div>

        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-3 rounded-xl text-white text-sm font-semibold bg-gradient-to-r from-teal-600 to-emerald-500 shadow-lg shadow-teal-500/25 hover:shadow-teal-500/40 transition-all"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}

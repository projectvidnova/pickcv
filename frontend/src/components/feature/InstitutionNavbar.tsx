import { useNavigate } from 'react-router-dom';
import { resolvePath } from '../../utils/subdomain';

export default function InstitutionNavbar() {
  const navigate = useNavigate();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex flex-col items-center pt-4 px-4 pointer-events-none">
      <div className="w-full max-w-5xl pointer-events-auto rounded-2xl bg-white/90 backdrop-blur-xl border border-gray-100/80 shadow-sm">
        <div className="flex items-center justify-between px-5 h-[58px]">
          {/* Logo */}
          <a onClick={() => navigate(resolvePath('/login'))} className="flex items-center gap-2.5 cursor-pointer shrink-0">
            <img
              src="https://static.readdy.ai/image/118f59b514d655f060b6a8ef60c2b755/e0bd9983c8b60cb1b82cd43c64b6d0bd.png"
              alt="PickCV"
              className="h-20 w-auto"
            />
            <span className="hidden sm:inline-block text-xs font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
              Institutions
            </span>
          </a>

          {/* Right side */}
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(resolvePath('/login'))}
              className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors cursor-pointer">
              Sign In
            </button>
            <button onClick={() => navigate(resolvePath('/register'))}
              className="text-sm font-semibold px-5 py-2 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 text-white hover:from-teal-600 hover:to-emerald-600 transition-all cursor-pointer shadow-sm">
              Register
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}

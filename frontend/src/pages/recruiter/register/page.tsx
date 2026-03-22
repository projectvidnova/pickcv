import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { recruiterApi } from '../../../services/recruiterService';

const INDUSTRIES = [
  'Technology', 'Finance', 'Healthcare', 'Education', 'Manufacturing',
  'Consulting', 'Retail', 'Media', 'Telecommunications', 'Other',
];
const COMPANY_SIZES = ['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+'];

export default function RecruiterRegister() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [form, setForm] = useState({
    email: '', password: '', confirm_password: '', full_name: '', phone: '',
    company_name: '', company_website: '', company_size: '', industry: '', designation: '',
  });

  const set = (field: string, value: string) => setForm(p => ({ ...p, [field]: value }));

  const nextStep = () => {
    if (step === 1) {
      if (!form.full_name || !form.email || !form.password || !form.confirm_password) {
        setError('Please fill all required fields'); return;
      }
      if (form.password.length < 8) { setError('Password must be at least 8 characters'); return; }
      if (form.password !== form.confirm_password) { setError('Passwords do not match'); return; }
    }
    setError('');
    setStep(s => s + 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.company_name) { setError('Company name is required'); return; }
    setError('');
    setIsLoading(true);
    try {
      await recruiterApi.register({
        email: form.email, password: form.password, full_name: form.full_name,
        phone: form.phone || undefined, company_name: form.company_name,
        company_website: form.company_website || undefined,
        company_size: form.company_size || undefined,
        industry: form.industry || undefined, designation: form.designation || undefined,
      });
      navigate('/verify-email-sent');
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    }
    setIsLoading(false);
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl" />
      </div>
      <div className="relative w-full max-w-lg">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
              <i className="ri-building-2-fill text-white text-xl" />
            </div>
            <span className="text-2xl font-bold text-white">PickCV Recruiter</span>
          </Link>
        </div>
        <div className="bg-gray-800/50 backdrop-blur-xl rounded-2xl border border-gray-700/50 p-8 shadow-2xl">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-white mb-2">Create Recruiter Account</h1>
            <p className="text-gray-400 text-sm">Step {step} of 2 — {step === 1 ? 'Personal Details' : 'Company Details'}</p>
          </div>
          {/* Progress bar */}
          <div className="flex gap-2 mb-6">
            <div className={`h-1 flex-1 rounded-full ${step >= 1 ? 'bg-blue-500' : 'bg-gray-700'}`} />
            <div className={`h-1 flex-1 rounded-full ${step >= 2 ? 'bg-blue-500' : 'bg-gray-700'}`} />
          </div>
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6">
              <p className="text-red-300 text-sm flex items-center gap-2"><i className="ri-error-warning-line" />{error}</p>
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            {step === 1 && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Full Name *</label>
                  <input type="text" value={form.full_name} onChange={e => set('full_name', e.target.value)}
                    className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50" placeholder="John Doe" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Email *</label>
                  <input type="email" value={form.email} onChange={e => set('email', e.target.value)}
                    className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50" placeholder="you@company.com" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Phone</label>
                  <input type="tel" value={form.phone} onChange={e => set('phone', e.target.value)}
                    className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50" placeholder="+91 XXXX XXXXXX" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Designation</label>
                  <input type="text" value={form.designation} onChange={e => set('designation', e.target.value)}
                    className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50" placeholder="HR Manager" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Password *</label>
                  <input type="password" value={form.password} onChange={e => set('password', e.target.value)}
                    className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50" placeholder="Minimum 8 characters" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Confirm Password *</label>
                  <input type="password" value={form.confirm_password} onChange={e => set('confirm_password', e.target.value)}
                    className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50" placeholder="Re-enter password" required />
                </div>
                <button type="button" onClick={nextStep}
                  className="w-full py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-indigo-600 transition-all shadow-lg shadow-blue-500/25">
                  Continue to Company Details <i className="ri-arrow-right-line ml-1" />
                </button>
              </>
            )}
            {step === 2 && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Company Name *</label>
                  <input type="text" value={form.company_name} onChange={e => set('company_name', e.target.value)}
                    className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50" placeholder="Acme Inc." required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Company Website</label>
                  <input type="url" value={form.company_website} onChange={e => set('company_website', e.target.value)}
                    className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50" placeholder="https://acme.com" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Company Size</label>
                    <select value={form.company_size} onChange={e => set('company_size', e.target.value)}
                      className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50">
                      <option value="">Select size</option>
                      {COMPANY_SIZES.map(s => <option key={s} value={s}>{s} employees</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Industry</label>
                    <select value={form.industry} onChange={e => set('industry', e.target.value)}
                      className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50">
                      <option value="">Select industry</option>
                      {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
                    </select>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setStep(1)}
                    className="flex-1 py-3 border border-gray-600 text-gray-300 rounded-xl hover:bg-gray-700/50 transition-all">
                    <i className="ri-arrow-left-line mr-1" /> Back
                  </button>
                  <button type="submit" disabled={isLoading}
                    className="flex-1 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-indigo-600 transition-all shadow-lg shadow-blue-500/25 disabled:opacity-50">
                    {isLoading ? <span className="flex items-center justify-center gap-2"><i className="ri-loader-4-line animate-spin" /> Creating...</span> : 'Create Account'}
                  </button>
                </div>
              </>
            )}
          </form>
          <div className="mt-6 text-center">
            <p className="text-gray-400 text-sm">
              Already have an account?{' '}
              <Link to="/login" className="text-blue-400 hover:text-blue-300 font-medium">Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

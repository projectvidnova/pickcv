import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Navbar from '../../../components/feature/Navbar';
import Footer from '../../../components/feature/Footer';
import ResumeCustomizeModal from './components/ResumeCustomizeModal';
import ApplyModal from './components/ApplyModal';
import { recruiterApi, RecruiterJob } from '../../../services/recruiterService';
import { apiService } from '../../../services/api';

export default function JobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const jobId = Number(id);
  const [job, setJob] = useState<RecruiterJob | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  const [showOptimizeModal, setShowOptimizeModal] = useState(false);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);
  const [applicationStatus, setApplicationStatus] = useState('');

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const data = await recruiterApi.getPublicJob(jobId);
        setJob(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load job');
      }
      setLoading(false);
    })();

    const savedJobs = JSON.parse(localStorage.getItem('savedJobs') || '[]');
    setIsSaved(savedJobs.includes(id));
    window.scrollTo(0, 0);

    // Check if user already applied
    if (apiService.isAuthenticated()) {
      apiService.checkIfApplied(jobId).then((res) => {
        if (res.applied) {
          setHasApplied(true);
          setApplicationStatus(res.status || 'applied');
        }
      });
    }
  }, [id, jobId]);

  const toggleSaveJob = () => {
    const savedJobs = JSON.parse(localStorage.getItem('savedJobs') || '[]');
    let updated;
    if (savedJobs.includes(id)) {
      updated = savedJobs.filter((jId: string) => jId !== id);
      setIsSaved(false);
    } else {
      updated = [...savedJobs, id];
      setIsSaved(true);
    }
    localStorage.setItem('savedJobs', JSON.stringify(updated));
  };

  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
    return `${Math.floor(diffInDays / 30)} months ago`;
  };

  const formatSalary = (j: RecruiterJob) => {
    const sym = j.currency === 'INR' ? '₹' : j.currency === 'EUR' ? '€' : j.currency === 'GBP' ? '£' : '$';
    const fmt = (n: number) => j.currency === 'INR' ? `${(n / 100000).toFixed(1)}L` : `${(n / 1000).toFixed(0)}k`;
    if (j.salary_min && j.salary_max) return `${sym}${fmt(j.salary_min)} - ${sym}${fmt(j.salary_max)}`;
    if (j.salary_min) return `${sym}${fmt(j.salary_min)}+`;
    if (j.salary_max) return `Up to ${sym}${fmt(j.salary_max)}`;
    return 'Not disclosed';
  };

  const renderTextAsList = (text?: string) => {
    if (!text) return null;
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    return (
      <ul className="space-y-2">
        {lines.map((line, i) => (
          <li key={i} className="flex items-start gap-3 text-gray-700">
            <i className="ri-checkbox-circle-fill text-teal-500 text-lg mt-0.5 flex-shrink-0"></i>
            <span>{line}</span>
          </li>
        ))}
      </ul>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-6 py-20 text-center">
          <i className="ri-loader-4-line animate-spin text-teal-500 text-4xl"></i>
          <p className="text-gray-500 mt-4">Loading job details...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-6 py-20">
          <div className="text-center">
            <i className="ri-error-warning-line text-6xl text-gray-300 mb-4"></i>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Job Not Found</h2>
            <p className="text-gray-600 mb-6">{error || "The job you're looking for doesn't exist or has been removed."}</p>
            <button
              onClick={() => window.REACT_APP_NAVIGATE('/jobs')}
              className="px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-medium whitespace-nowrap cursor-pointer"
            >
              Back to Jobs
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Back Button */}
        <button
          onClick={() => window.REACT_APP_NAVIGATE('/jobs')}
          className="flex items-center gap-2 text-gray-600 hover:text-teal-600 transition-colors mb-6 cursor-pointer group"
        >
          <i className="ri-arrow-left-line text-xl group-hover:-translate-x-1 transition-transform"></i>
          <span className="font-medium">Back to Jobs</span>
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Job Header Card */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8">
              <div className="flex items-start gap-6 mb-6">
                <div className="w-20 h-20 flex-shrink-0">
                  {job.company_logo_url ? (
                    <img src={job.company_logo_url} alt={job.company_name || ''} className="w-full h-full object-cover rounded-xl" />
                  ) : (
                    <div className="w-full h-full rounded-xl bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center">
                      <span className="text-white font-bold text-2xl">{(job.company_name || 'C')[0].toUpperCase()}</span>
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex-1 min-w-0">
                      <h1 className="text-3xl font-bold text-gray-900 mb-2">{job.title}</h1>
                      <p className="text-xl text-gray-700 font-medium">{job.company_name}</p>
                    </div>
                    <button
                      onClick={toggleSaveJob}
                      className="flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                      <i className={`${isSaved ? 'ri-bookmark-fill text-teal-600' : 'ri-bookmark-line text-gray-400'} text-2xl`}></i>
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 mb-4 text-gray-600">
                    <div className="flex items-center gap-2">
                      <i className="ri-map-pin-line text-lg"></i>
                      <span>{job.location}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <i className="ri-briefcase-line text-lg"></i>
                      <span>{job.job_type}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <i className="ri-money-dollar-circle-line text-lg"></i>
                      <span className="font-semibold">{formatSalary(job)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <i className="ri-time-line text-lg"></i>
                      <span>{getRelativeTime(job.created_at)}</span>
                    </div>
                    {job.remote_policy && (
                      <div className="flex items-center gap-2">
                        <i className="ri-home-wifi-line text-lg"></i>
                        <span>{job.remote_policy}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <span className={`px-4 py-2 text-sm font-semibold rounded-lg ${
                      job.experience_level === 'Senior' ? 'bg-purple-50 text-purple-700 border border-purple-100' :
                      job.experience_level === 'Lead' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                      job.experience_level === 'Executive' ? 'bg-red-50 text-red-700 border border-red-100' :
                      'bg-teal-50 text-teal-700 border border-teal-100'
                    }`}>
                      {job.experience_level} Level
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-4 pt-6 border-t border-gray-100">
                <div className="flex-1 min-w-[180px] relative group">
                  <div className="absolute -inset-0.5 rounded-lg bg-gradient-to-r from-amber-400 via-orange-400 to-amber-400 opacity-75 blur-sm group-hover:opacity-100 transition-opacity animate-pulse pointer-events-none"></div>
                  <button
                    onClick={() => setShowOptimizeModal(true)}
                    className="relative w-full px-5 py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg font-semibold whitespace-nowrap cursor-pointer shadow-lg shadow-amber-500/30 hover:from-amber-600 hover:to-orange-600 hover:shadow-amber-500/50 hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
                  >
                    <i className="ri-sparkling-fill text-lg"></i>
                    Customize Resume
                    <span className="ml-1 px-1.5 py-0.5 bg-white/20 rounded text-[10px] font-black tracking-wide">AI</span>
                  </button>
                </div>

                <div className="flex-1 min-w-[180px]">
                  {hasApplied ? (
                    <div className="w-full px-5 py-3.5 bg-emerald-50 border-2 border-emerald-200 text-emerald-700 rounded-lg font-semibold flex items-center justify-center gap-2">
                      <i className="ri-checkbox-circle-fill text-lg"></i>
                      Applied
                      <span className="ml-1 px-2 py-0.5 bg-emerald-100 rounded text-[10px] font-bold uppercase tracking-wide">{applicationStatus}</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowApplyModal(true)}
                      className="w-full px-5 py-3.5 bg-gradient-to-r from-teal-600 to-emerald-600 text-white rounded-lg font-semibold whitespace-nowrap cursor-pointer shadow-lg shadow-teal-500/20 hover:from-teal-700 hover:to-emerald-700 hover:shadow-teal-500/40 hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
                    >
                      <i className="ri-send-plane-fill text-lg"></i>
                      Apply
                    </button>
                  )}
                </div>
              </div>

              <div className="mt-4 flex items-center gap-2 px-4 py-2.5 bg-amber-50 border border-amber-100 rounded-lg">
                <i className="ri-lightbulb-flash-line text-amber-500 text-base shrink-0"></i>
                <p className="text-xs text-amber-700">
                  <strong>Boost your chances:</strong> Candidates with tailored resumes are <strong>3× more likely</strong> to get an interview. Customize yours in seconds.
                </p>
              </div>
            </div>

            {/* Job Description */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Job Description</h2>
              <p className="text-gray-700 leading-relaxed whitespace-pre-line">{job.description}</p>
            </div>

            {/* Responsibilities */}
            {job.responsibilities && (
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <i className="ri-task-line text-teal-600"></i>
                  Key Responsibilities
                </h2>
                {renderTextAsList(job.responsibilities)}
              </div>
            )}

            {/* Requirements */}
            {job.requirements && (
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <i className="ri-shield-check-line text-teal-600"></i>
                  Requirements
                </h2>
                {renderTextAsList(job.requirements)}
              </div>
            )}

            {/* Benefits */}
            {job.benefits && (
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <i className="ri-gift-line text-teal-600"></i>
                  Benefits
                </h2>
                {renderTextAsList(job.benefits)}
              </div>
            )}

            {/* Skills */}
            {((job.required_skills?.length ?? 0) > 0 || (job.preferred_skills?.length ?? 0) > 0) && (
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8">
                {(job.required_skills?.length ?? 0) > 0 && (
                  <>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Required Skills</h2>
                    <div className="flex flex-wrap gap-3 mb-6">
                      {job.required_skills.map((skill: string) => (
                        <span key={skill} className="px-4 py-2 bg-gradient-to-r from-teal-50 to-emerald-50 text-teal-700 rounded-lg text-sm font-semibold border border-teal-100">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </>
                )}
                {(job.preferred_skills?.length ?? 0) > 0 && (
                  <>
                    <h3 className="text-lg font-bold text-gray-900 mb-3">Preferred Skills</h3>
                    <div className="flex flex-wrap gap-3">
                      {job.preferred_skills.map((skill: string) => (
                        <span key={skill} className="px-4 py-2 bg-gray-50 text-gray-600 rounded-lg text-sm font-medium border border-gray-200">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Sidebar - Job Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 sticky top-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <i className="ri-file-info-line text-teal-600"></i>
                Job Summary
              </h2>

              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <i className="ri-building-line text-xl text-teal-600"></i>
                  <div>
                    <p className="text-xs text-gray-500">Company</p>
                    <p className="font-semibold text-gray-900 text-sm">{job.company_name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <i className="ri-map-pin-line text-xl text-teal-600"></i>
                  <div>
                    <p className="text-xs text-gray-500">Location</p>
                    <p className="font-semibold text-gray-900 text-sm">{job.location}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <i className="ri-briefcase-line text-xl text-teal-600"></i>
                  <div>
                    <p className="text-xs text-gray-500">Job Type</p>
                    <p className="font-semibold text-gray-900 text-sm">{job.job_type}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <i className="ri-bar-chart-line text-xl text-teal-600"></i>
                  <div>
                    <p className="text-xs text-gray-500">Experience Level</p>
                    <p className="font-semibold text-gray-900 text-sm">{job.experience_level}</p>
                  </div>
                </div>
                {job.remote_policy && (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <i className="ri-home-wifi-line text-xl text-teal-600"></i>
                    <div>
                      <p className="text-xs text-gray-500">Work Mode</p>
                      <p className="font-semibold text-gray-900 text-sm">{job.remote_policy}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <i className="ri-money-dollar-circle-line text-xl text-teal-600"></i>
                  <div>
                    <p className="text-xs text-gray-500">Salary</p>
                    <p className="font-semibold text-gray-900 text-sm">{formatSalary(job)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <i className="ri-calendar-line text-xl text-teal-600"></i>
                  <div>
                    <p className="text-xs text-gray-500">Posted</p>
                    <p className="font-semibold text-gray-900 text-sm">{getRelativeTime(job.created_at)}</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-100 space-y-3">
                <button
                  onClick={() => setShowOptimizeModal(true)}
                  className="w-full px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg hover:from-amber-600 hover:to-orange-600 transition-all font-semibold text-center cursor-pointer shadow-lg shadow-amber-500/20"
                >
                  <i className="ri-sparkling-fill mr-2"></i>
                  Customize Resume
                </button>
                {hasApplied ? (
                  <div className="w-full px-6 py-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg font-semibold text-center flex items-center justify-center gap-2">
                    <i className="ri-checkbox-circle-fill"></i>
                    Applied <span className="text-xs bg-emerald-100 px-2 py-0.5 rounded uppercase">{applicationStatus}</span>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowApplyModal(true)}
                    className="w-full px-6 py-3 bg-gradient-to-r from-teal-600 to-emerald-600 text-white rounded-lg hover:from-teal-700 hover:to-emerald-700 transition-all font-semibold text-center cursor-pointer shadow-lg shadow-teal-500/20"
                  >
                    <i className="ri-send-plane-fill mr-2"></i>
                    Apply
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />

      {showOptimizeModal && (
        <ResumeCustomizeModal
          jobTitle={job.title}
          company={job.company_name || ''}
          jobDescription={job.description}
          onClose={() => setShowOptimizeModal(false)}
        />
      )}

      {showApplyModal && (
        <ApplyModal
          jobId={jobId}
          jobTitle={job.title}
          company={job.company_name || ''}
          onClose={() => setShowApplyModal(false)}
          onApplied={() => {
            setShowApplyModal(false);
            setHasApplied(true);
            setApplicationStatus('applied');
          }}
        />
      )}
    </div>
  );
}
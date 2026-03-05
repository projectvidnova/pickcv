import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Navbar from '../../../components/feature/Navbar';
import Footer from '../../../components/feature/Footer';
import ResumeCustomizeModal from './components/ResumeCustomizeModal';
import { jobs } from '../../../mocks/jobs';

export default function JobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [job, setJob] = useState<typeof jobs[0] | null>(null);
  const [similarJobs, setSimilarJobs] = useState<typeof jobs>([]);
  const [isSaved, setIsSaved] = useState(false);
  const [showOptimizeModal, setShowOptimizeModal] = useState(false);

  useEffect(() => {
    // Find the current job
    const currentJob = jobs.find(j => j.id === id);
    if (currentJob) {
      setJob(currentJob);
      
      // Find similar jobs (same industry or overlapping skills)
      const similar = jobs
        .filter(j => j.id !== id)
        .filter(j => {
          const hasCommonSkills = j.skills.some(skill => 
            currentJob.skills.includes(skill)
          );
          const sameIndustry = j.industry === currentJob.industry;
          return hasCommonSkills || sameIndustry;
        })
        .slice(0, 5);
      
      setSimilarJobs(similar);
    }

    // Check if job is saved
    const savedJobs = JSON.parse(localStorage.getItem('savedJobs') || '[]');
    setIsSaved(savedJobs.includes(id));

    // Scroll to top
    window.scrollTo(0, 0);
  }, [id]);

  const toggleSaveJob = () => {
    const savedJobs = JSON.parse(localStorage.getItem('savedJobs') || '[]');
    let updated;
    
    if (savedJobs.includes(id)) {
      updated = savedJobs.filter((jobId: string) => jobId !== id);
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

  if (!job) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-6 py-20">
          <div className="text-center">
            <i className="ri-error-warning-line text-6xl text-gray-300 mb-4"></i>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Job Not Found</h2>
            <p className="text-gray-600 mb-6">The job you're looking for doesn't exist or has been removed.</p>
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
                  <img
                    src={job.logo}
                    alt={job.company}
                    className="w-full h-full object-cover rounded-xl"
                  />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex-1 min-w-0">
                      <h1 className="text-3xl font-bold text-gray-900 mb-2">{job.title}</h1>
                      <p className="text-xl text-gray-700 font-medium">{job.company}</p>
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
                      <span>{job.type}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <i className="ri-money-dollar-circle-line text-lg"></i>
                      <span className="font-semibold">{job.salary}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <i className="ri-time-line text-lg"></i>
                      <span>{getRelativeTime(job.postedDate)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-teal-50 to-emerald-50 rounded-lg border border-teal-100">
                      <div className="w-16 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full"
                          style={{ width: `${job.matchPercentage}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-bold text-teal-700">
                        {job.matchPercentage}% Match
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-4 pt-6 border-t border-gray-100">
                <a
                  href={job.applyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 min-w-[200px] px-6 py-3.5 bg-gradient-to-r from-teal-600 to-emerald-600 text-white rounded-lg hover:from-teal-700 hover:to-emerald-700 transition-all font-semibold text-center whitespace-nowrap cursor-pointer shadow-lg shadow-teal-500/30"
                >
                  <i className="ri-external-link-line mr-2"></i>
                  Apply on Company Site
                </a>

                {/* Highlighted Customize Button */}
                <div className="flex-1 min-w-[200px] relative group">
                  {/* Animated glow ring */}
                  <div className="absolute -inset-0.5 rounded-lg bg-gradient-to-r from-amber-400 via-orange-400 to-amber-400 opacity-75 blur-sm group-hover:opacity-100 transition-opacity animate-pulse pointer-events-none"></div>
                  <button
                    onClick={() => setShowOptimizeModal(true)}
                    className="relative w-full px-6 py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg font-semibold whitespace-nowrap cursor-pointer shadow-lg shadow-amber-500/30 hover:from-amber-600 hover:to-orange-600 hover:shadow-amber-500/50 hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
                  >
                    <i className="ri-sparkling-fill text-lg"></i>
                    Customize Resume for This Job
                    <span className="ml-1 px-1.5 py-0.5 bg-white/20 rounded text-[10px] font-black tracking-wide">AI</span>
                  </button>
                </div>
              </div>

              {/* Customize nudge tip */}
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
              <p className="text-gray-700 leading-relaxed mb-6">{job.description}</p>

              <div className="space-y-6">
                {/* Responsibilities */}
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <i className="ri-task-line text-teal-600"></i>
                    Key Responsibilities
                  </h3>
                  <ul className="space-y-2">
                    {job.responsibilities.map((item, index) => (
                      <li key={index} className="flex items-start gap-3 text-gray-700">
                        <i className="ri-checkbox-circle-fill text-teal-500 text-lg mt-0.5 flex-shrink-0"></i>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Requirements */}
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <i className="ri-shield-check-line text-teal-600"></i>
                    Requirements
                  </h3>
                  <ul className="space-y-2">
                    {job.requirements.map((item, index) => (
                      <li key={index} className="flex items-start gap-3 text-gray-700">
                        <i className="ri-checkbox-circle-fill text-teal-500 text-lg mt-0.5 flex-shrink-0"></i>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Nice to Have */}
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <i className="ri-star-line text-teal-600"></i>
                    Nice to Have
                  </h3>
                  <ul className="space-y-2">
                    {job.niceToHave.map((item, index) => (
                      <li key={index} className="flex items-start gap-3 text-gray-700">
                        <i className="ri-add-circle-line text-gray-400 text-lg mt-0.5 flex-shrink-0"></i>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Required Skills */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Required Skills</h2>
              <div className="flex flex-wrap gap-3">
                {job.skills.map(skill => (
                  <span
                    key={skill}
                    className="px-4 py-2 bg-gradient-to-r from-teal-50 to-emerald-50 text-teal-700 rounded-lg text-sm font-semibold border border-teal-100"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            {/* About Company */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">About {job.company}</h2>
              <p className="text-gray-700 leading-relaxed mb-6">{job.companyDescription}</p>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                  <i className="ri-building-line text-2xl text-teal-600"></i>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Company Size</p>
                    <p className="font-semibold text-gray-900">{job.companySize}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                  <i className="ri-pie-chart-line text-2xl text-teal-600"></i>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Industry</p>
                    <p className="font-semibold text-gray-900">{job.industry}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar - Similar Jobs */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 sticky top-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <i className="ri-lightbulb-line text-teal-600"></i>
                Similar Jobs
              </h2>
              
              {similarJobs.length > 0 ? (
                <div className="space-y-4">
                  {similarJobs.map(similarJob => (
                    <div
                      key={similarJob.id}
                      onClick={() => window.REACT_APP_NAVIGATE(`/jobs/${similarJob.id}`)}
                      className="p-4 border border-gray-100 rounded-lg hover:border-teal-200 hover:shadow-md transition-all cursor-pointer group"
                    >
                      <div className="flex items-start gap-3 mb-3">
                        <div className="w-12 h-12 flex-shrink-0">
                          <img
                            src={similarJob.logo}
                            alt={similarJob.company}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 group-hover:text-teal-600 transition-colors mb-1 text-sm line-clamp-2">
                            {similarJob.title}
                          </h3>
                          <p className="text-xs text-gray-600 truncate">{similarJob.company}</p>
                        </div>
                      </div>
                      
                      <div className="space-y-2 text-xs text-gray-600 mb-3">
                        <div className="flex items-center gap-1.5">
                          <i className="ri-map-pin-line"></i>
                          <span className="truncate">{similarJob.location}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <i className="ri-money-dollar-circle-line"></i>
                          <span>{similarJob.salary}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <div className="w-10 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full"
                              style={{ width: `${similarJob.matchPercentage}%` }}
                            ></div>
                          </div>
                          <span className="text-xs font-semibold text-teal-600">
                            {similarJob.matchPercentage}%
                          </span>
                        </div>
                        <span className="text-xs text-gray-500">
                          {getRelativeTime(similarJob.postedDate)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <i className="ri-inbox-line text-4xl text-gray-300 mb-2"></i>
                  <p className="text-sm text-gray-500">No similar jobs found</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <Footer />
      
      {/* Resume Customize Modal */}
      {showOptimizeModal && (
        <ResumeCustomizeModal
          jobTitle={job.title}
          company={job.company}
          jobDescription={job.description}
          onClose={() => setShowOptimizeModal(false)}
        />
      )}
    </div>
  );
}
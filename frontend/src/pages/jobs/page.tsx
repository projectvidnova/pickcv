import { useState, useMemo, useEffect } from 'react';
import Navbar from '../../components/feature/Navbar';
import Footer from '../../components/feature/Footer';
import { apiService } from '../../services/api';

type ViewMode = 'grid' | 'list';
type SortOption = 'relevance' | 'newest' | 'salary';

interface Filters {
  keyword: string;
  location: string;
  jobTypes: string[];
  experienceLevels: string[];
  salaryRange: [number, number];
  industries: string[];
  datePosted: string;
}

interface Job {
  id: number;
  title: string;
  company: string;
  location: string;
  job_type?: string;
  experience_level?: string;
  salary_min?: number;
  salary_max?: number;
  match_score?: number;
  [key: string]: any;
}

const JobsPage = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<SortOption>('relevance');
  const [savedJobs, setSavedJobs] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const jobsPerPage = 12;

  const [filters, setFilters] = useState<Filters>({
    keyword: '',
    location: '',
    jobTypes: [],
    experienceLevels: [],
    salaryRange: [0, 200],
    industries: [],
    datePosted: 'any'
  });

  // Load jobs from API on mount
  useEffect(() => {
    const loadJobs = async () => {
      setLoading(true);
      try {
        const result = await apiService.listJobs(0, 100);
        if (result.success) {
          setJobs(result.jobs || []);
        } else {
          setError(result.error || 'Failed to load jobs');
        }
      } catch (err) {
        setError('Failed to load jobs');
      } finally {
        setLoading(false);
      }
    };
    loadJobs();
  }, []);

  const jobTypes = ['Full-time', 'Part-time', 'Remote', 'Contract'];
  const experienceLevels = ['Entry', 'Mid', 'Senior', 'Lead'];
  const industries = ['Technology', 'Design', 'Education'];
  const datePostedOptions = [
    { value: 'any', label: 'Any Time' },
    { value: '24h', label: 'Last 24 Hours' },
    { value: 'week', label: 'Last Week' },
    { value: 'month', label: 'Last Month' }
  ];

  const toggleJobType = (type: string) => {
    setFilters(prev => ({
      ...prev,
      jobTypes: prev.jobTypes.includes(type)
        ? prev.jobTypes.filter(t => t !== type)
        : [...prev.jobTypes, type]
    }));
  };

  const toggleExperienceLevel = (level: string) => {
    setFilters(prev => ({
      ...prev,
      experienceLevels: prev.experienceLevels.includes(level)
        ? prev.experienceLevels.filter(l => l !== level)
        : [...prev.experienceLevels, level]
    }));
  };

  const toggleIndustry = (industry: string) => {
    setFilters(prev => ({
      ...prev,
      industries: prev.industries.includes(industry)
        ? prev.industries.filter(i => i !== industry)
        : [...prev.industries, industry]
    }));
  };

  const removeFilter = (filterType: string, value?: string) => {
    setFilters(prev => {
      if (filterType === 'keyword') return { ...prev, keyword: '' };
      if (filterType === 'location') return { ...prev, location: '' };
      if (filterType === 'jobType' && value) {
        return { ...prev, jobTypes: prev.jobTypes.filter(t => t !== value) };
      }
      if (filterType === 'experienceLevel' && value) {
        return { ...prev, experienceLevels: prev.experienceLevels.filter(l => l !== value) };
      }
      if (filterType === 'industry' && value) {
        return { ...prev, industries: prev.industries.filter(i => i !== value) };
      }
      if (filterType === 'datePosted') return { ...prev, datePosted: 'any' };
      return prev;
    });
  };

  const clearAllFilters = () => {
    setFilters({
      keyword: '',
      location: '',
      jobTypes: [],
      experienceLevels: [],
      salaryRange: [0, 200],
      industries: [],
      datePosted: 'any'
    });
  };

  const filteredJobs = useMemo(() => {
    let result = [...jobs];

    if (filters.keyword) {
      const keyword = filters.keyword.toLowerCase();
      result = result.filter(job =>
        job.title.toLowerCase().includes(keyword) ||
        job.company.toLowerCase().includes(keyword)
      );
    }

    if (filters.location) {
      const location = filters.location.toLowerCase();
      result = result.filter(job =>
        job.location?.toLowerCase().includes(location)
      );
    }

    if (filters.jobTypes.length > 0) {
      result = result.filter(job => filters.jobTypes.includes(job.job_type));
    }

    if (filters.experienceLevels.length > 0) {
      result = result.filter(job => filters.experienceLevels.includes(job.experience_level));
    }

    if (filters.salaryRange) {
      const [minSalary, maxSalary] = filters.salaryRange;
      result = result.filter(job => {
        const salary = job.salary_min || 0;
        return salary >= minSalary * 1000 && salary <= maxSalary * 1000;
      });
    }

    // Sort by match score or relevance
    result.sort((a, b) => (b.match_score || 0) - (a.match_score || 0));

    return result;
  }, [jobs, filters, sortBy]);

  const totalPages = Math.ceil(filteredJobs.length / jobsPerPage);
  const paginatedJobs = filteredJobs.slice(
    (currentPage - 1) * jobsPerPage,
    currentPage * jobsPerPage
  );

  const toggleSaveJob = (jobId: string) => {
    setSavedJobs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(jobId)) {
        newSet.delete(jobId);
      } else {
        newSet.add(jobId);
      }
      return newSet;
    });
  };

  const activeFilterCount = 
    (filters.keyword ? 1 : 0) +
    (filters.location ? 1 : 0) +
    filters.jobTypes.length +
    filters.experienceLevels.length +
    filters.industries.length +
    (filters.datePosted !== 'any' ? 1 : 0);

  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Today';
    if (diffDays === 2) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays} days ago`;
    if (diffDays <= 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-teal-50/30">
      <Navbar />
      
      <div className="pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-6">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-3">
              Find Your Dream Job
            </h1>
            <p className="text-lg text-gray-600">
              Discover opportunities from top companies worldwide
            </p>
          </div>

          <div className="flex gap-8">
            {/* Left Sidebar - Filters */}
            <div className="w-80 flex-shrink-0">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sticky top-24">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
                  {activeFilterCount > 0 && (
                    <button
                      onClick={clearAllFilters}
                      className="text-sm text-teal-600 hover:text-teal-700 font-medium whitespace-nowrap cursor-pointer"
                    >
                      Clear All
                    </button>
                  )}
                </div>

                <div className="space-y-6">
                  {/* Keyword Search */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Keyword
                    </label>
                    <div className="relative">
                      <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-base"></i>
                      <input
                        type="text"
                        value={filters.keyword}
                        onChange={(e) => setFilters(prev => ({ ...prev, keyword: e.target.value }))}
                        placeholder="Job title, skills..."
                        className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                      />
                    </div>
                  </div>

                  {/* Location */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Location
                    </label>
                    <div className="relative">
                      <i className="ri-map-pin-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-base"></i>
                      <input
                        type="text"
                        value={filters.location}
                        onChange={(e) => setFilters(prev => ({ ...prev, location: e.target.value }))}
                        placeholder="City, state, or remote"
                        className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                      />
                    </div>
                  </div>

                  {/* Job Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Job Type
                    </label>
                    <div className="space-y-2">
                      {jobTypes.map(type => (
                        <label key={type} className="flex items-center gap-2 cursor-pointer group">
                          <input
                            type="checkbox"
                            checked={filters.jobTypes.includes(type)}
                            onChange={() => toggleJobType(type)}
                            className="w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500 cursor-pointer"
                          />
                          <span className="text-sm text-gray-700 group-hover:text-gray-900">
                            {type}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Experience Level */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Experience Level
                    </label>
                    <div className="space-y-2">
                      {experienceLevels.map(level => (
                        <label key={level} className="flex items-center gap-2 cursor-pointer group">
                          <input
                            type="checkbox"
                            checked={filters.experienceLevels.includes(level)}
                            onChange={() => toggleExperienceLevel(level)}
                            className="w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500 cursor-pointer"
                          />
                          <span className="text-sm text-gray-700 group-hover:text-gray-900">
                            {level}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Salary Range */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Salary Range (in thousands)
                    </label>
                    <div className="space-y-3">
                      <input
                        type="range"
                        min="0"
                        max="200"
                        step="10"
                        value={filters.salaryRange[0]}
                        onChange={(e) => setFilters(prev => ({
                          ...prev,
                          salaryRange: [parseInt(e.target.value), prev.salaryRange[1]]
                        }))}
                        className="w-full accent-teal-600 cursor-pointer"
                      />
                      <input
                        type="range"
                        min="0"
                        max="200"
                        step="10"
                        value={filters.salaryRange[1]}
                        onChange={(e) => setFilters(prev => ({
                          ...prev,
                          salaryRange: [prev.salaryRange[0], parseInt(e.target.value)]
                        }))}
                        className="w-full accent-teal-600 cursor-pointer"
                      />
                      <div className="flex items-center justify-between text-sm text-gray-600">
                        <span>${filters.salaryRange[0]}k</span>
                        <span>${filters.salaryRange[1]}k</span>
                      </div>
                    </div>
                  </div>

                  {/* Industry */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Industry
                    </label>
                    <div className="space-y-2">
                      {industries.map(industry => (
                        <label key={industry} className="flex items-center gap-2 cursor-pointer group">
                          <input
                            type="checkbox"
                            checked={filters.industries.includes(industry)}
                            onChange={() => toggleIndustry(industry)}
                            className="w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500 cursor-pointer"
                          />
                          <span className="text-sm text-gray-700 group-hover:text-gray-900">
                            {industry}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Date Posted */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date Posted
                    </label>
                    <select
                      value={filters.datePosted}
                      onChange={(e) => setFilters(prev => ({ ...prev, datePosted: e.target.value }))}
                      className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 cursor-pointer"
                    >
                      {datePostedOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="flex-1">
              {/* Active Filters */}
              {activeFilterCount > 0 && (
                <div className="mb-6 flex flex-wrap items-center gap-2">
                  {filters.keyword && (
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-teal-50 text-teal-700 rounded-full text-sm">
                      <span>Keyword: {filters.keyword}</span>
                      <button
                        onClick={() => removeFilter('keyword')}
                        className="hover:bg-teal-100 rounded-full p-0.5 cursor-pointer"
                      >
                        <i className="ri-close-line text-sm"></i>
                      </button>
                    </div>
                  )}
                  {filters.location && (
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-teal-50 text-teal-700 rounded-full text-sm">
                      <span>Location: {filters.location}</span>
                      <button
                        onClick={() => removeFilter('location')}
                        className="hover:bg-teal-100 rounded-full p-0.5 cursor-pointer"
                      >
                        <i className="ri-close-line text-sm"></i>
                      </button>
                    </div>
                  )}
                  {filters.jobTypes.map(type => (
                    <div key={type} className="inline-flex items-center gap-2 px-3 py-1.5 bg-teal-50 text-teal-700 rounded-full text-sm">
                      <span>{type}</span>
                      <button
                        onClick={() => removeFilter('jobType', type)}
                        className="hover:bg-teal-100 rounded-full p-0.5 cursor-pointer"
                      >
                        <i className="ri-close-line text-sm"></i>
                      </button>
                    </div>
                  ))}
                  {filters.experienceLevels.map(level => (
                    <div key={level} className="inline-flex items-center gap-2 px-3 py-1.5 bg-teal-50 text-teal-700 rounded-full text-sm">
                      <span>{level}</span>
                      <button
                        onClick={() => removeFilter('experienceLevel', level)}
                        className="hover:bg-teal-100 rounded-full p-0.5 cursor-pointer"
                      >
                        <i className="ri-close-line text-sm"></i>
                      </button>
                    </div>
                  ))}
                  {filters.industries.map(industry => (
                    <div key={industry} className="inline-flex items-center gap-2 px-3 py-1.5 bg-teal-50 text-teal-700 rounded-full text-sm">
                      <span>{industry}</span>
                      <button
                        onClick={() => removeFilter('industry', industry)}
                        className="hover:bg-teal-100 rounded-full p-0.5 cursor-pointer"
                      >
                        <i className="ri-close-line text-sm"></i>
                      </button>
                    </div>
                  ))}
                  {filters.datePosted !== 'any' && (
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-teal-50 text-teal-700 rounded-full text-sm">
                      <span>{datePostedOptions.find(o => o.value === filters.datePosted)?.label}</span>
                      <button
                        onClick={() => removeFilter('datePosted')}
                        className="hover:bg-teal-100 rounded-full p-0.5 cursor-pointer"
                      >
                        <i className="ri-close-line text-sm"></i>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Results Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <p className="text-sm text-gray-600">
                    <span className="font-semibold text-gray-900">{filteredJobs.length}</span> jobs found
                  </p>
                  <div className="h-4 w-px bg-gray-200"></div>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortOption)}
                    className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 cursor-pointer"
                  >
                    <option value="relevance">Most Relevant</option>
                    <option value="newest">Newest First</option>
                    <option value="salary">Highest Salary</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded-lg transition-colors cursor-pointer ${
                      viewMode === 'grid'
                        ? 'bg-teal-50 text-teal-600'
                        : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <i className="ri-grid-line text-lg"></i>
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded-lg transition-colors cursor-pointer ${
                      viewMode === 'list'
                        ? 'bg-teal-50 text-teal-600'
                        : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <i className="ri-list-check text-lg"></i>
                  </button>
                </div>
              </div>

              {/* Job Cards */}
              {loading ? (
                <div className="text-center py-16">
                  <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                    <i className="ri-loader-4-line text-3xl text-gray-400 animate-spin"></i>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Loading jobs...</h3>
                  <p className="text-gray-600">Please wait while we fetch available opportunities</p>
                </div>
              ) : error ? (
                <div className="text-center py-16">
                  <div className="w-20 h-20 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                    <i className="ri-alert-line text-3xl text-red-600"></i>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Error loading jobs</h3>
                  <p className="text-gray-600 mb-6">{error}</p>
                  <button
                    onClick={() => window.location.reload()}
                    className="px-6 py-2.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-medium whitespace-nowrap cursor-pointer"
                  >
                    Retry
                  </button>
                </div>
              ) : paginatedJobs.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                    <i className="ri-search-line text-3xl text-gray-400"></i>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No jobs found</h3>
                  <p className="text-gray-600 mb-6">Try adjusting your filters to see more results</p>
                  <button
                    onClick={clearAllFilters}
                    className="px-6 py-2.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-medium whitespace-nowrap cursor-pointer"
                  >
                    Clear All Filters
                  </button>
                </div>
              ) : (
                <>
                  <div className={viewMode === 'grid' ? 'grid grid-cols-1 lg:grid-cols-2 gap-6' : 'space-y-4'}>
                    {paginatedJobs.map(job => (
                      <div
                        key={job.id}
                        className="bg-white rounded-xl border border-gray-100 hover:border-teal-200 hover:shadow-lg transition-all duration-300 p-6 group cursor-pointer"
                        onClick={() => window.REACT_APP_NAVIGATE(`/jobs/${job.id}`)}
                      >
                        <div className="flex items-start gap-4">
                          <div className="w-14 h-14 flex-shrink-0">
                            <img
                              src={job.logo}
                              alt={job.company}
                              className="w-full h-full object-cover rounded-lg"
                            />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-3 mb-2">
                              <div className="flex-1 min-w-0">
                                <h3 className="text-lg font-semibold text-gray-900 group-hover:text-teal-600 transition-colors mb-1 truncate">
                                  {job.title}
                                </h3>
                                <p className="text-sm text-gray-600 truncate">{job.company}</p>
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleSaveJob(job.id);
                                }}
                                className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                              >
                                <i className={`${savedJobs.has(job.id) ? 'ri-bookmark-fill text-teal-600' : 'ri-bookmark-line text-gray-400'} text-lg`}></i>
                              </button>
                            </div>

                            <div className="flex flex-wrap items-center gap-3 mb-3 text-sm text-gray-600">
                              <div className="flex items-center gap-1.5">
                                <i className="ri-map-pin-line text-base"></i>
                                <span>{job.location}</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <i className="ri-briefcase-line text-base"></i>
                                <span>{job.type}</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <i className="ri-money-dollar-circle-line text-base"></i>
                                <span>{job.salary}</span>
                              </div>
                            </div>

                            <div className="flex flex-wrap gap-2 mb-3">
                              {job.skills.slice(0, 3).map(skill => (
                                <span
                                  key={skill}
                                  className="px-2.5 py-1 bg-gray-50 text-gray-700 rounded-md text-xs font-medium"
                                >
                                  {skill}
                                </span>
                              ))}
                              {job.skills.length > 3 && (
                                <span className="px-2.5 py-1 bg-gray-50 text-gray-500 rounded-md text-xs font-medium">
                                  +{job.skills.length - 3} more
                                </span>
                              )}
                            </div>

                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="flex items-center gap-1.5">
                                  <div className="w-12 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                    <div
                                      className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full"
                                      style={{ width: `${job.matchPercentage}%` }}
                                    ></div>
                                  </div>
                                  <span className="text-xs font-semibold text-teal-600">
                                    {job.matchPercentage}% Match
                                  </span>
                                </div>
                              </div>
                              <span className="text-xs text-gray-500">
                                {getRelativeTime(job.postedDate)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="mt-12 flex items-center justify-center gap-2">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap cursor-pointer"
                      >
                        <i className="ri-arrow-left-s-line"></i>
                      </button>
                      
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap cursor-pointer ${
                            currentPage === page
                              ? 'bg-teal-600 text-white'
                              : 'border border-gray-200 text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                      
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                        className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap cursor-pointer"
                      >
                        <i className="ri-arrow-right-s-line"></i>
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default JobsPage;
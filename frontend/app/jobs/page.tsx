'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Sparkles, Briefcase, MapPin, DollarSign, Clock, 
  TrendingUp, Search, Filter, ArrowLeft, ExternalLink,
  CheckCircle, Building2
} from 'lucide-react';
import apiClient from '@/lib/api';

interface Job {
  id: number;
  title: string;
  company: string;
  location: string;
  jobType: string;
  salaryRange: string;
  description: string;
  matchScore?: number;
  postedDate: string;
}

export default function JobsPage() {
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {
    try {
      const response = await apiClient.get('/api/jobs/');
      setJobs(response.data);
    } catch (error) {
      // If unauthorized, redirect to login
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  const filteredJobs = jobs.filter(job =>
    job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    job.company.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Loading jobs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/dashboard" className="text-gray-600 hover:text-gray-900">
                <ArrowLeft className="w-6 h-6" />
              </Link>
              <div className="flex items-center gap-2">
                <Sparkles className="w-8 h-8 text-indigo-600" />
                <h1 className="text-2xl font-bold text-gray-900">Job Matches</h1>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Search and Filters */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search jobs by title or company..."
                className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none"
              />
            </div>
            <button className="flex items-center gap-2 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition">
              <Filter className="w-5 h-5" />
              Filters
            </button>
          </div>
        </div>

        {/* Jobs Grid */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Jobs List */}
          <div className="space-y-4">
            {filteredJobs.length === 0 ? (
              <div className="bg-white rounded-xl shadow-lg p-12 text-center">
                <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">No jobs found</h3>
                <p className="text-gray-500">Try adjusting your search criteria</p>
              </div>
            ) : (
              filteredJobs.map((job) => (
                <div
                  key={job.id}
                  onClick={() => setSelectedJob(job)}
                  className={`bg-white rounded-xl shadow-lg p-6 cursor-pointer hover:shadow-xl transition ${
                    selectedJob?.id === job.id ? 'ring-2 ring-indigo-600' : ''
                  }`}
                >
                  {/* Match Score Badge */}
                  {job.matchScore && (
                    <div className="flex items-center gap-2 mb-4">
                      <div className="bg-gradient-to-r from-green-400 to-green-600 text-white text-sm font-bold px-3 py-1 rounded-full">
                        {job.matchScore}% Match
                      </div>
                      <TrendingUp className="w-4 h-4 text-green-600" />
                    </div>
                  )}

                  {/* Job Info */}
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{job.title}</h3>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                    <div className="flex items-center gap-1">
                      <Building2 className="w-4 h-4" />
                      {job.company}
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {job.location}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-sm">
                    <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full">
                      {job.jobType}
                    </span>
                    {job.salaryRange && (
                      <div className="flex items-center gap-1 text-gray-600">
                        <DollarSign className="w-4 h-4" />
                        {job.salaryRange}
                      </div>
                    )}
                  </div>

                  <p className="mt-4 text-sm text-gray-600 line-clamp-2">
                    {job.description}
                  </p>
                </div>
              ))
            )}
          </div>

          {/* Job Details */}
          <div className="lg:sticky lg:top-8 h-fit">
            {selectedJob ? (
              <div className="bg-white rounded-xl shadow-lg p-8">
                {/* Header */}
                <div className="mb-6">
                  {selectedJob.matchScore && (
                    <div className="flex items-center gap-2 mb-4">
                      <div className="bg-gradient-to-r from-green-400 to-green-600 text-white text-lg font-bold px-4 py-2 rounded-full">
                        {selectedJob.matchScore}% Match
                      </div>
                      <div className="text-sm text-gray-600">
                        <p className="font-medium">Excellent fit!</p>
                        <p>Your skills align well</p>
                      </div>
                    </div>
                  )}

                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    {selectedJob.title}
                  </h2>
                  <div className="flex items-center gap-4 text-gray-600 mb-4">
                    <div className="flex items-center gap-1">
                      <Building2 className="w-5 h-5" />
                      <span className="font-medium">{selectedJob.company}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="w-5 h-5" />
                      {selectedJob.location}
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm">
                      {selectedJob.jobType}
                    </span>
                    {selectedJob.salaryRange && (
                      <div className="flex items-center gap-1 text-gray-600">
                        <DollarSign className="w-5 h-5" />
                        <span className="font-medium">{selectedJob.salaryRange}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Description */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Description</h3>
                  <p className="text-gray-600 whitespace-pre-line">{selectedJob.description}</p>
                </div>

                {/* Actions */}
                <div className="flex gap-4">
                  <button className="flex-1 bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition flex items-center justify-center gap-2">
                    <CheckCircle className="w-5 h-5" />
                    Apply Now
                  </button>
                  <button className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition">
                    <ExternalLink className="w-5 h-5" />
                  </button>
                </div>

                {/* Match Analysis */}
                {selectedJob.matchScore && selectedJob.matchScore >= 70 && (
                  <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <h4 className="font-semibold text-green-900 mb-2 flex items-center gap-2">
                      <CheckCircle className="w-5 h-5" />
                      Why You're a Great Fit
                    </h4>
                    <ul className="text-sm text-green-800 space-y-1">
                      <li>• Strong skill alignment with job requirements</li>
                      <li>• Experience matches the seniority level</li>
                      <li>• Your resume highlights relevant achievements</li>
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-lg p-12 text-center">
                <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">
                  Select a job to view details
                </h3>
                <p className="text-gray-500">
                  Click on any job from the list to see more information
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

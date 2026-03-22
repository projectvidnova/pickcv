import { useState, useEffect, useRef } from 'react';
import { apiService } from '../../../../services/api';

interface ResumeEntry {
  id: number;
  title: string;
  template_name: string | null;
  original_filename: string | null;
  ats_score: number | null;
  file_format: string | null;
  created_at: string;
}

interface ApplyModalProps {
  jobId: number;
  jobTitle: string;
  company: string;
  onClose: () => void;
  onApplied: () => void;
}

type Step = 'choose' | 'uploading' | 'applying' | 'success';

export default function ApplyModal({ jobId, jobTitle, company, onClose, onApplied }: ApplyModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<Step>('choose');
  const [resumes, setResumes] = useState<ResumeEntry[]>([]);
  const [loadingResumes, setLoadingResumes] = useState(true);
  const [selectedResumeId, setSelectedResumeId] = useState<number | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [mode, setMode] = useState<'saved' | 'upload'>('saved');
  const [coverLetter, setCoverLetter] = useState('');
  const [error, setError] = useState('');
  const [applying, setApplying] = useState(false);

  const isLoggedIn = apiService.isAuthenticated();

  useEffect(() => {
    if (!isLoggedIn) return;
    (async () => {
      setLoadingResumes(true);
      try {
        const result = await apiService.listResumes();
        if (result.success && result.resumes) {
          setResumes(result.resumes);
          if (result.resumes.length > 0) {
            setSelectedResumeId(result.resumes[0].id);
            setMode('saved');
          } else {
            setMode('upload');
          }
        }
      } catch { /* silent */ }
      setLoadingResumes(false);
    })();
  }, [isLoggedIn]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.size <= 5 * 1024 * 1024) {
      setUploadedFile(file);
      setError('');
    } else if (file) {
      setError('File must be under 5MB');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.size <= 5 * 1024 * 1024) {
      setUploadedFile(file);
      setError('');
    } else if (file) {
      setError('File must be under 5MB');
    }
  };

  const canApply = () => {
    if (mode === 'saved' && selectedResumeId) return true;
    if (mode === 'upload' && uploadedFile) return true;
    return false;
  };

  const handleApply = async () => {
    if (!canApply()) return;
    setError('');
    setApplying(true);

    try {
      let resumeId = selectedResumeId;

      // If uploading, upload first
      if (mode === 'upload' && uploadedFile) {
        setStep('uploading');
        const uploadResult = await apiService.uploadResume(
          uploadedFile.name.replace(/\.[^.]+$/, ''),
          uploadedFile
        );
        if (!uploadResult.success || !uploadResult.resume) {
          throw new Error(uploadResult.error || 'Resume upload failed');
        }
        resumeId = uploadResult.resume.id;
      }

      setStep('applying');
      const result = await apiService.applyToRecruiterJob(jobId, resumeId || undefined, coverLetter || undefined);

      if (!result.success) {
        throw new Error(result.error || 'Application failed');
      }

      setStep('success');
      setTimeout(() => {
        onApplied();
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
      setStep('choose');
    } finally {
      setApplying(false);
    }
  };

  // Not logged in
  if (!isLoggedIn) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center" onClick={e => e.stopPropagation()}>
          <div className="w-16 h-16 rounded-2xl bg-teal-50 flex items-center justify-center mx-auto mb-5">
            <i className="ri-lock-line text-3xl text-teal-500"></i>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Sign in to Apply</h2>
          <p className="text-sm text-gray-500 mb-6">Create an account or sign in to apply for this job.</p>
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 transition-colors cursor-pointer">
              Cancel
            </button>
            <button
              onClick={() => { onClose(); window.REACT_APP_NAVIGATE('/auth/login'); }}
              className="flex-1 px-4 py-3 rounded-xl bg-teal-600 text-white font-semibold hover:bg-teal-700 transition-colors cursor-pointer"
            >
              Sign In
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Success state
  if (step === 'success') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center" onClick={e => e.stopPropagation()}>
          <div className="w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-5">
            <i className="ri-checkbox-circle-fill text-5xl text-emerald-500"></i>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Application Submitted!</h2>
          <p className="text-gray-500 mb-2">
            You've applied for <strong>{jobTitle}</strong> at <strong>{company}</strong>.
          </p>
          <p className="text-sm text-gray-400 mb-6">
            Track your application status in your profile.
          </p>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 transition-colors cursor-pointer"
            >
              Close
            </button>
            <button
              onClick={() => { onClose(); window.REACT_APP_NAVIGATE('/profile'); }}
              className="flex-1 px-4 py-3 rounded-xl bg-teal-600 text-white font-semibold hover:bg-teal-700 transition-colors cursor-pointer"
            >
              <i className="ri-user-line mr-1"></i>View Applications
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Processing states
  if (step === 'uploading' || step === 'applying') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center">
          <i className="ri-loader-4-line animate-spin text-teal-500 text-4xl mb-4"></i>
          <h3 className="text-lg font-bold text-gray-900 mb-1">
            {step === 'uploading' ? 'Uploading Resume...' : 'Submitting Application...'}
          </h3>
          <p className="text-sm text-gray-500">Please wait a moment.</p>
        </div>
      </div>
    );
  }

  // Main choose step
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Apply for this Job</h2>
              <p className="text-sm text-gray-500 mt-0.5">
                {jobTitle} at {company}
              </p>
            </div>
            <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors cursor-pointer">
              <i className="ri-close-line text-xl text-gray-400"></i>
            </button>
          </div>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Mode Toggle */}
          <div>
            <p className="text-sm font-bold text-gray-700 mb-3">Select your resume</p>
            <div className="flex gap-2 p-1 bg-gray-100 rounded-xl">
              <button
                onClick={() => setMode('saved')}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                  mode === 'saved' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <i className="ri-file-text-line"></i>
                Saved Resumes {resumes.length > 0 && <span className="text-xs bg-teal-100 text-teal-700 px-1.5 py-0.5 rounded-full">{resumes.length}</span>}
              </button>
              <button
                onClick={() => setMode('upload')}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                  mode === 'upload' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <i className="ri-upload-cloud-line"></i>
                Upload New
              </button>
            </div>
          </div>

          {/* Saved Resumes */}
          {mode === 'saved' && (
            <div className="space-y-2">
              {loadingResumes ? (
                <div className="text-center py-8">
                  <i className="ri-loader-4-line animate-spin text-teal-500 text-2xl"></i>
                  <p className="text-sm text-gray-400 mt-2">Loading resumes...</p>
                </div>
              ) : resumes.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-xl">
                  <i className="ri-file-text-line text-3xl text-gray-300 mb-2"></i>
                  <p className="text-sm text-gray-500 mb-3">No saved resumes yet</p>
                  <button
                    onClick={() => setMode('upload')}
                    className="text-sm font-semibold text-teal-600 hover:text-teal-700 cursor-pointer"
                  >
                    Upload a resume →
                  </button>
                </div>
              ) : (
                resumes.map((resume) => (
                  <label
                    key={resume.id}
                    className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      selectedResumeId === resume.id
                        ? 'border-teal-500 bg-teal-50/50'
                        : 'border-gray-100 hover:border-gray-200 bg-white'
                    }`}
                  >
                    <input
                      type="radio"
                      name="resume"
                      checked={selectedResumeId === resume.id}
                      onChange={() => setSelectedResumeId(resume.id)}
                      className="sr-only"
                    />
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      selectedResumeId === resume.id ? 'bg-teal-500 text-white' : 'bg-gray-100 text-gray-400'
                    }`}>
                      <i className="ri-file-text-line text-lg"></i>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{resume.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {resume.original_filename && (
                          <span className="text-xs text-gray-400 truncate">{resume.original_filename}</span>
                        )}
                        {resume.ats_score != null && (
                          <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                            {Math.round(resume.ats_score)}% ATS
                          </span>
                        )}
                      </div>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                      selectedResumeId === resume.id ? 'border-teal-500 bg-teal-500' : 'border-gray-300'
                    }`}>
                      {selectedResumeId === resume.id && <i className="ri-check-line text-white text-xs"></i>}
                    </div>
                  </label>
                ))
              )}
            </div>
          )}

          {/* Upload New */}
          {mode === 'upload' && (
            <div>
              {uploadedFile ? (
                <div className="flex items-center gap-4 p-4 bg-teal-50 rounded-xl border border-teal-200">
                  <div className="w-10 h-10 rounded-lg bg-teal-500 text-white flex items-center justify-center flex-shrink-0">
                    <i className="ri-file-text-line text-lg"></i>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{uploadedFile.name}</p>
                    <p className="text-xs text-gray-500">{(uploadedFile.size / 1024).toFixed(0)} KB</p>
                  </div>
                  <button
                    onClick={() => { setUploadedFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-teal-100 text-teal-600 cursor-pointer"
                  >
                    <i className="ri-close-line text-lg"></i>
                  </button>
                </div>
              ) : (
                <div
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`p-8 border-2 border-dashed rounded-xl text-center cursor-pointer transition-all ${
                    isDragging ? 'border-teal-400 bg-teal-50' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <i className="ri-upload-cloud-2-line text-3xl text-gray-300 mb-3"></i>
                  <p className="text-sm font-semibold text-gray-700">
                    Drop your resume here or <span className="text-teal-600">browse files</span>
                  </p>
                  <p className="text-xs text-gray-400 mt-1">PDF, DOCX up to 5MB</p>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          )}

          {/* Cover Letter (Optional) */}
          <div>
            <label className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-1">
              Cover Letter <span className="text-xs font-normal text-gray-400">(optional)</span>
            </label>
            <textarea
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value)}
              placeholder="Write a brief note to the hiring manager..."
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-100 rounded-xl">
              <i className="ri-error-warning-line text-red-500"></i>
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            disabled={!canApply() || applying}
            className="flex-1 px-4 py-3 rounded-xl bg-teal-600 text-white font-semibold hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer flex items-center justify-center gap-2"
          >
            <i className="ri-send-plane-fill"></i>
            Submit Application
          </button>
        </div>
      </div>
    </div>
  );
}

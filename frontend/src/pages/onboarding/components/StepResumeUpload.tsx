
import { useState, useRef } from 'react';
import { apiService } from '../../../services/api';

interface ResumeData {
  file: File | null;
  fileName: string;
  extracting: boolean;
  extracted: boolean;
}

interface StepResumeUploadProps {
  data: ResumeData;
  onChange: (data: ResumeData) => void;
}

export default function StepResumeUpload({ data, onChange }: StepResumeUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [localExtracting, setLocalExtracting] = useState(false);
  const [localExtracted, setLocalExtracted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isValidFile = (file: File): boolean => {
    const validTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    return validTypes.includes(file.type) && file.size <= 5 * 1024 * 1024;
  };

  const handleFile = async (file: File) => {
    if (!isValidFile(file)) return;
    setLocalExtracting(true);
    setLocalExtracted(false);
    setError(null);
    onChange({ file, fileName: file.name, extracting: true, extracted: false });

    // Upload to API
    try {
      const result = await apiService.uploadResume(file.name.replace(/\.[^.]+$/, ''), file);
      if (result.success) {
        setLocalExtracting(false);
        setLocalExtracted(true);
        onChange({ file, fileName: file.name, extracting: false, extracted: true });
      } else {
        setError(result.error || 'Upload failed');
        setLocalExtracting(false);
        setLocalExtracted(false);
        onChange({ file: null, fileName: '', extracting: false, extracted: false });
      }
    } catch (err) {
      setError('Failed to upload resume');
      setLocalExtracting(false);
      setLocalExtracted(false);
      onChange({ file: null, fileName: '', extracting: false, extracted: false });
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = () => setIsDragging(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const removeFile = () => {
    setLocalExtracting(false);
    setLocalExtracted(false);
    onChange({ file: null, fileName: '', extracting: false, extracted: false });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const isPdf = data.fileName.toLowerCase().endsWith('.pdf');

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-extrabold text-gray-900 leading-tight mb-2">
          Upload your resume
        </h2>
        <p className="text-gray-400 text-sm leading-relaxed">
          Optional — our AI will extract your info instantly and build your profile automatically.
        </p>
      </div>

      <div className="space-y-5">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 flex items-center justify-center text-red-500 mt-0.5 flex-shrink-0">
                <i className="ri-error-warning-line text-lg" />
              </div>
              <div>
                <p className="text-sm font-bold text-red-800 mb-0.5">Upload failed</p>
                <p className="text-xs text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}
        {!data.fileName ? (
          /* ── Drop Zone ── */
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
            className={`relative border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300 cursor-pointer group ${
              isDragging
                ? 'border-slate-600 bg-slate-50 scale-[1.01]'
                : 'border-gray-200 hover:border-slate-400 bg-gray-50/50 hover:bg-gray-50'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={handleInputChange}
              className="hidden"
            />

            <div className={`w-20 h-20 mx-auto mb-5 rounded-2xl flex items-center justify-center transition-all duration-300 ${
              isDragging
                ? 'bg-slate-900 text-white scale-110'
                : 'bg-white border-2 border-gray-200 text-gray-300 group-hover:border-slate-300 group-hover:text-slate-500'
            }`}>
              <i className="ri-upload-cloud-2-line text-4xl" />
            </div>

            <p className="text-base font-bold text-gray-800 mb-1">
              {isDragging ? 'Drop it here!' : 'Drag & drop your resume'}
            </p>
            <p className="text-sm text-gray-400 mb-5">or click to browse your files</p>

            <div className="inline-flex items-center gap-2 bg-white border border-gray-200 rounded-full px-4 py-2 text-xs text-gray-400 font-medium">
              <i className="ri-file-pdf-2-line text-rose-400" />
              PDF
              <span className="text-gray-200">·</span>
              <i className="ri-file-word-line text-sky-400" />
              DOC / DOCX
              <span className="text-gray-200">·</span>
              Max 5MB
            </div>
          </div>
        ) : (
          /* ── File Card ── */
          <div className={`border-2 rounded-2xl p-6 transition-all duration-500 ${
            localExtracted ? 'border-emerald-200 bg-emerald-50/40' : 'border-gray-100 bg-white'
          }`}>
            <div className="flex items-center gap-4 mb-4">
              <div className={`w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 ${
                localExtracted ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500'
              }`}>
                <i className={`${isPdf ? 'ri-file-pdf-2-line' : 'ri-file-word-line'} text-2xl`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-900 truncate">{data.fileName}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {localExtracting ? 'AI is reading your resume...' : localExtracted ? 'Analysis complete ✓' : 'Uploaded'}
                </p>
              </div>
              <button
                type="button"
                onClick={removeFile}
                className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-300 hover:text-rose-500 hover:bg-rose-50 transition-all cursor-pointer flex-shrink-0"
              >
                <i className="ri-delete-bin-line text-lg" />
              </button>
            </div>

            {localExtracting && (
              <div className="mt-2">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 flex items-center justify-center">
                      <i className="ri-sparkling-2-fill text-amber-500 animate-spin text-sm" />
                    </div>
                    <span className="text-xs font-semibold text-gray-700">Extracting data with AI...</span>
                  </div>
                  <span className="text-xs text-gray-400">Just a moment</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-gradient-to-r from-slate-600 to-slate-900 h-full rounded-full animate-extraction" />
                </div>
              </div>
            )}

            {localExtracted && (
              <div className="mt-2">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
                    <i className="ri-check-line text-white text-xs" />
                  </div>
                  <span className="text-xs font-bold text-emerald-700">Data extracted successfully</span>
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  {[
                    { label: 'Experience', value: '5 years', icon: 'ri-briefcase-4-line', color: 'text-slate-600', bg: 'bg-slate-50' },
                    { label: 'Skills Found', value: '12 skills', icon: 'ri-tools-line', color: 'text-teal-600', bg: 'bg-teal-50' },
                    { label: 'Education', value: 'Detected', icon: 'ri-graduation-cap-line', color: 'text-amber-600', bg: 'bg-amber-50' },
                    { label: 'Projects', value: '4 found', icon: 'ri-folder-3-line', color: 'text-rose-600', bg: 'bg-rose-50' },
                  ].map((item) => (
                    <div key={item.label} className="bg-white rounded-xl p-3.5 border border-emerald-100 shadow-sm">
                      <div className="flex items-center gap-2 mb-1.5">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${item.bg} ${item.color}`}>
                          <i className={`${item.icon} text-sm`} />
                        </div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">{item.label}</span>
                      </div>
                      <p className="text-sm font-bold text-gray-900">{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {data.fileName && (
          <button
            type="button"
            onClick={() => { removeFile(); setTimeout(() => fileInputRef.current?.click(), 100); }}
            className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-slate-700 font-medium cursor-pointer transition-colors"
          >
            <i className="ri-refresh-line" />
            Upload a different file
          </button>
        )}

        {/* Optional note */}
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-100 rounded-xl p-4">
          <div className="w-5 h-5 flex items-center justify-center text-amber-500 mt-0.5 flex-shrink-0">
            <i className="ri-lightbulb-flash-line text-lg" />
          </div>
          <div>
            <p className="text-sm font-bold text-amber-800 mb-0.5">This step is optional</p>
            <p className="text-xs text-amber-700 leading-relaxed">
              Skip it and build your resume from scratch using our AI builder — it only takes 2 minutes.
            </p>
          </div>
        </div>

        {/* What happens next */}
        <div className="bg-slate-50 border border-slate-100 rounded-xl p-4">
          <p className="text-xs font-bold text-slate-700 mb-3 uppercase tracking-wide">What happens after you submit</p>
          <div className="space-y-2.5">
            {[
              { icon: 'ri-search-eye-line', text: 'We scan 10,000+ jobs matching your profile', color: 'text-teal-500' },
              { icon: 'ri-file-edit-line', text: 'Your AI resume is polished & ATS-optimized', color: 'text-amber-500' },
              { icon: 'ri-notification-3-line', text: 'You get instant job alerts tailored to you', color: 'text-rose-500' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className={`w-5 h-5 flex items-center justify-center ${item.color} flex-shrink-0`}>
                  <i className={`${item.icon} text-base`} />
                </div>
                <span className="text-xs text-slate-600">{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes extraction {
          0% { width: 0%; }
          40% { width: 55%; }
          70% { width: 75%; }
          100% { width: 90%; }
        }
        .animate-extraction {
          animation: extraction 2.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
}

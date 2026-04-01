import { useState, useRef } from 'react';
import { apiService } from '../../../services/api';

interface UploadResult {
  total: number;
  invited: number;
  registered: number;
  ready: number;
  already_exists: number;
}

interface AddStudentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStudentsAdded: () => void;
}

export default function AddStudentsModal({ isOpen, onClose, onStudentsAdded }: AddStudentsModalProps) {
  const [mode, setMode] = useState<'upload' | 'manual'>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [manualEmails, setManualEmails] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<UploadResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      const name = f.name.toLowerCase();
      if (!name.endsWith('.xlsx') && !name.endsWith('.csv')) {
        setError('Please upload an Excel (.xlsx) or CSV file');
        return;
      }
      setFile(f);
      setError('');
    }
  };

  const handleSubmit = async () => {
    setError('');
    setResult(null);

    if (mode === 'upload' && !file) {
      setError('Please select a file to upload');
      return;
    }
    if (mode === 'manual' && !manualEmails.trim()) {
      setError('Please enter at least one email address');
      return;
    }

    setIsUploading(true);
    try {
      const payload = mode === 'upload'
        ? { file: file! }
        : { text: manualEmails.trim() };

      const res = await apiService.uploadStudents(payload);
      if (res.success && res.data) {
        setResult(res.data);
      } else {
        setError(res.error || 'Upload failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    }
    setIsUploading(false);
  };

  const handleDone = () => {
    setFile(null);
    setManualEmails('');
    setResult(null);
    setError('');
    onStudentsAdded();
    onClose();
  };

  const handleClose = () => {
    if (result) {
      handleDone();
    } else {
      setFile(null);
      setManualEmails('');
      setError('');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={isUploading ? undefined : handleClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full mx-4 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-600 to-emerald-500 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-white">Add Students</h3>
              <p className="text-sm text-white/80">Upload a file or enter emails manually</p>
            </div>
            {!isUploading && (
              <button onClick={handleClose} className="text-white/80 hover:text-white transition-colors">
                <i className="ri-close-line text-xl"></i>
              </button>
            )}
          </div>
        </div>

        <div className="p-6">
          {/* Success Result */}
          {result ? (
            <div className="space-y-4">
              <div className="text-center">
                <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <i className="ri-check-double-line text-2xl text-green-600"></i>
                </div>
                <h4 className="text-lg font-bold text-gray-900 mb-1">Students Added!</h4>
                <p className="text-sm text-gray-500">{result.total} student(s) processed</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {result.invited > 0 && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-center">
                    <p className="text-xl font-bold text-amber-700">{result.invited}</p>
                    <p className="text-xs text-amber-600">New (Need Invite)</p>
                  </div>
                )}
                {result.registered > 0 && (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-center">
                    <p className="text-xl font-bold text-blue-700">{result.registered}</p>
                    <p className="text-xs text-blue-600">Already Registered</p>
                  </div>
                )}
                {result.ready > 0 && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-center">
                    <p className="text-xl font-bold text-emerald-700">{result.ready}</p>
                    <p className="text-xs text-emerald-600">Ready (Has Resume)</p>
                  </div>
                )}
                {result.already_exists > 0 && (
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-center">
                    <p className="text-xl font-bold text-gray-500">{result.already_exists}</p>
                    <p className="text-xs text-gray-500">Already Added</p>
                  </div>
                )}
              </div>
              {result.invited > 0 && (
                <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2 text-center">
                  <i className="ri-information-line mr-1"></i>
                  Click "Invite" on the dashboard to send registration emails to new students.
                </p>
              )}
              <button onClick={handleDone} className="w-full py-3 bg-teal-600 text-white rounded-xl font-semibold hover:bg-teal-700 transition-colors">
                Done
              </button>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Mode Toggle */}
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => { setMode('upload'); setError(''); }}
                  className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${mode === 'upload' ? 'bg-white shadow-sm text-teal-700' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  <i className="ri-upload-2-line mr-1.5"></i>Upload File
                </button>
                <button
                  onClick={() => { setMode('manual'); setError(''); }}
                  className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${mode === 'manual' ? 'bg-white shadow-sm text-teal-700' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  <i className="ri-keyboard-line mr-1.5"></i>Enter Manually
                </button>
              </div>

              {/* Upload Mode */}
              {mode === 'upload' && (
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.csv"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-teal-400 hover:bg-teal-50/50 transition-all"
                  >
                    {file ? (
                      <div>
                        <i className="ri-file-excel-2-line text-3xl text-emerald-500 mb-2"></i>
                        <p className="text-sm font-semibold text-gray-900">{file.name}</p>
                        <p className="text-xs text-gray-500 mt-1">Click to change file</p>
                      </div>
                    ) : (
                      <div>
                        <i className="ri-upload-cloud-2-line text-3xl text-gray-400 mb-2"></i>
                        <p className="text-sm font-medium text-gray-700">Click to upload Excel or CSV</p>
                        <p className="text-xs text-gray-400 mt-1">Columns: email, name, branch, graduation_year</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Manual Mode */}
              {mode === 'manual' && (
                <div>
                  <textarea
                    value={manualEmails}
                    onChange={(e) => setManualEmails(e.target.value)}
                    placeholder={"Enter student emails (one per line or comma-separated):\n\nstudent1@college.edu\nstudent2@college.edu\nstudent3@college.edu"}
                    rows={6}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-teal-200 focus:border-teal-400 transition-all resize-none placeholder:text-gray-400"
                  />
                  <p className="text-xs text-gray-400 mt-1.5">
                    <i className="ri-information-line mr-0.5"></i>
                    Separate emails with commas, semicolons, or new lines
                  </p>
                </div>
              )}

              {/* Error */}
              {error && (
                <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2 flex items-center gap-1.5">
                  <i className="ri-error-warning-line"></i>{error}
                </p>
              )}

              {/* Submit */}
              <button
                onClick={handleSubmit}
                disabled={isUploading || (mode === 'upload' && !file) || (mode === 'manual' && !manualEmails.trim())}
                className="w-full py-3 bg-gradient-to-r from-teal-600 to-emerald-500 text-white rounded-xl font-semibold hover:from-teal-700 hover:to-emerald-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUploading ? (
                  <span className="flex items-center justify-center gap-2">
                    <i className="ri-loader-4-line animate-spin"></i>Processing...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <i className={mode === 'upload' ? 'ri-upload-2-line' : 'ri-user-add-line'}></i>
                    {mode === 'upload' ? 'Upload Students' : 'Add Students'}
                  </span>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

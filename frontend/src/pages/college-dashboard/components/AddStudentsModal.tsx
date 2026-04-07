import { useState, useRef } from 'react';
import { apiService } from '../../../services/api';

interface UploadResult {
  total: number;
  invited: number;
  registered: number;
  ready: number;
  already_exists: number;
}

interface StudentFormEntry {
  email: string;
  name: string;
  branch: string;
  graduation_year: string;
  current_semester: string;
  cgpa: string;
}

const emptyStudent = (): StudentFormEntry => ({
  email: '',
  name: '',
  branch: '',
  graduation_year: '',
  current_semester: '',
  cgpa: '',
});

interface AddStudentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStudentsAdded: () => void;
}

export default function AddStudentsModal({ isOpen, onClose, onStudentsAdded }: AddStudentsModalProps) {
  const [mode, setMode] = useState<'upload' | 'manual'>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [students, setStudents] = useState<StudentFormEntry[]>([emptyStudent()]);
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

  const updateStudent = (index: number, field: keyof StudentFormEntry, value: string) => {
    setStudents(prev => prev.map((s, i) => i === index ? { ...s, [field]: value } : s));
  };

  const addStudentRow = () => {
    setStudents(prev => [...prev, emptyStudent()]);
  };

  const removeStudentRow = (index: number) => {
    if (students.length <= 1) return;
    setStudents(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    setError('');
    setResult(null);

    if (mode === 'upload' && !file) {
      setError('Please select a file to upload');
      return;
    }
    if (mode === 'manual') {
      const validStudents = students.filter(s => s.email.trim());
      if (validStudents.length === 0) {
        setError('Please enter at least one student with an email address');
        return;
      }
    }

    setIsUploading(true);
    try {
      let res;
      if (mode === 'upload') {
        res = await apiService.uploadStudents({ file: file! });
      } else {
        const payload = students
          .filter(s => s.email.trim())
          .map(s => ({
            email: s.email.trim(),
            name: s.name.trim() || null,
            branch: s.branch.trim() || null,
            graduation_year: s.graduation_year ? parseInt(s.graduation_year) || null : null,
            current_semester: s.current_semester ? parseInt(s.current_semester) || null : null,
            cgpa: s.cgpa ? parseFloat(s.cgpa) || null : null,
          }));
        res = await apiService.addStudentsManual(payload);
      }
      if (res.success && res.data) {
        setResult(res.data);
        // Also trigger invite endpoint as backup (backend auto-sends via background task too)
        if (res.data.invited > 0) {
          apiService.inviteStudents().catch(() => {
            // Ignore — backend already sends invitations via background task
          });
        }
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
    setStudents([emptyStudent()]);
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
      setStudents([emptyStudent()]);
      setError('');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={isUploading ? undefined : handleClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-600 to-emerald-500 px-6 py-4 shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-white">Add Students</h3>
              <p className="text-sm text-white/80">Upload a file or add students manually</p>
            </div>
            {!isUploading && (
              <button onClick={handleClose} className="text-white/80 hover:text-white transition-colors">
                <i className="ri-close-line text-xl"></i>
              </button>
            )}
          </div>
        </div>

        <div className="p-6 overflow-y-auto">
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
                  <i className="ri-user-add-line mr-1.5"></i>Add Manually
                </button>
              </div>

              {/* Upload Mode */}
              {mode === 'upload' && (
                <div className="space-y-3">
                  {/* Template Download */}
                  <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
                    <div className="flex items-center gap-2">
                      <i className="ri-file-download-line text-blue-600 text-lg"></i>
                      <div>
                        <p className="text-sm font-medium text-blue-800">Download Template</p>
                        <p className="text-xs text-blue-600">Use this CSV template to fill student data</p>
                      </div>
                    </div>
                    <a
                      href={apiService.getStudentTemplateUrl()}
                      download="student_upload_template.csv"
                      className="px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <i className="ri-download-2-line mr-1"></i>Download
                    </a>
                  </div>

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
                        <p className="text-xs text-gray-400 mt-1">Fill in the template above and upload it here</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Manual Mode — Form */}
              {mode === 'manual' && (
                <div className="space-y-4">
                  {students.map((student, index) => (
                    <div key={index} className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Student {index + 1}</span>
                        {students.length > 1 && (
                          <button onClick={() => removeStudentRow(index)} className="text-red-400 hover:text-red-600 transition-colors">
                            <i className="ri-delete-bin-line text-sm"></i>
                          </button>
                        )}
                      </div>
                      {/* Row 1: Name, Email */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-medium text-gray-600 mb-1 block">Full Name</label>
                          <input
                            type="text"
                            value={student.name}
                            onChange={(e) => updateStudent(index, 'name', e.target.value)}
                            placeholder="John Doe"
                            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-teal-200 focus:border-teal-400 transition-all"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-gray-600 mb-1 block">Email *</label>
                          <input
                            type="email"
                            value={student.email}
                            onChange={(e) => updateStudent(index, 'email', e.target.value)}
                            placeholder="student@college.edu"
                            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-teal-200 focus:border-teal-400 transition-all"
                          />
                        </div>
                      </div>
                      {/* Row 2: Branch, Year */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-medium text-gray-600 mb-1 block">Branch / Department</label>
                          <input
                            type="text"
                            value={student.branch}
                            onChange={(e) => updateStudent(index, 'branch', e.target.value)}
                            placeholder="Computer Science"
                            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-teal-200 focus:border-teal-400 transition-all"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-gray-600 mb-1 block">Year</label>
                          <input
                            type="number"
                            value={student.graduation_year}
                            onChange={(e) => updateStudent(index, 'graduation_year', e.target.value)}
                            placeholder="2025"
                            min="2000"
                            max="2050"
                            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-teal-200 focus:border-teal-400 transition-all"
                          />
                        </div>
                      </div>
                      {/* Row 3: Semester, CGPA */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-medium text-gray-600 mb-1 block">Semester</label>
                          <input
                            type="number"
                            value={student.current_semester}
                            onChange={(e) => updateStudent(index, 'current_semester', e.target.value)}
                            placeholder="8"
                            min="1"
                            max="12"
                            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-teal-200 focus:border-teal-400 transition-all"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-gray-600 mb-1 block">CGPA</label>
                          <input
                            type="number"
                            value={student.cgpa}
                            onChange={(e) => updateStudent(index, 'cgpa', e.target.value)}
                            placeholder="8.5"
                            step="0.1"
                            min="0"
                            max="10"
                            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-teal-200 focus:border-teal-400 transition-all"
                          />
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Add Another Student */}
                  <button
                    onClick={addStudentRow}
                    className="w-full py-2.5 border-2 border-dashed border-gray-300 rounded-xl text-sm text-gray-500 hover:border-teal-400 hover:text-teal-600 hover:bg-teal-50/50 transition-all flex items-center justify-center gap-1.5"
                  >
                    <i className="ri-add-circle-line"></i>Add Another Student
                  </button>
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
                disabled={isUploading || (mode === 'upload' && !file) || (mode === 'manual' && !students.some(s => s.email.trim()))}
                className="w-full py-3 bg-gradient-to-r from-teal-600 to-emerald-500 text-white rounded-xl font-semibold hover:from-teal-700 hover:to-emerald-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUploading ? (
                  <span className="flex items-center justify-center gap-2">
                    <i className="ri-loader-4-line animate-spin"></i>Processing...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <i className={mode === 'upload' ? 'ri-upload-2-line' : 'ri-user-add-line'}></i>
                    {mode === 'upload' ? 'Upload Students' : `Add ${students.filter(s => s.email.trim()).length} Student(s)`}
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

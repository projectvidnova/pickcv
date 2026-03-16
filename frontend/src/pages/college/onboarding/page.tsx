import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../../../services/api';
import { resolvePath } from '../../../utils/subdomain';

interface CollegeProfile {
  logo: string | null;
  name: string;
  website: string;
  address: string;
  city: string;
  state: string;
  naacGrade: string;
  totalStudents: string;
}

interface StudentRow {
  id: string;
  name: string;
  email: string;
  branch: string;
  cgpa: string;
  graduationYear: string;
  phone: string;
  linkedin: string;
  skills: string;
  placementStatus: string;
  error?: string;
}

export default function CollegeOnboarding() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  // Step 1: College Profile
  const [profile, setProfile] = useState<CollegeProfile>({
    logo: null,
    name: '',
    website: '',
    address: '',
    city: '',
    state: '',
    naacGrade: '',
    totalStudents: '',
  });

  // Step 2: Students
  const [addMethod, setAddMethod] = useState<'manual' | 'upload'>('upload');
  const [manualEmails, setManualEmails] = useState<string[]>(['']);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [parsedStudents, setParsedStudents] = useState<StudentRow[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // Handle logo upload
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
        setProfile({ ...profile, logo: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  // Download Excel Template
  const downloadTemplate = () => {
    const headers = ['Name', 'Email', 'Branch', 'CGPA', 'Graduation Year', 'Phone', 'LinkedIn', 'Skills', 'Placement Status'];
    const sampleRow = ['John Doe', 'john.doe@college.edu', 'Computer Science', '8.5', '2025', '+91 9876543210', 'https://linkedin.com/in/johndoe', 'Python, React, Machine Learning', 'open'];
    
    const csvContent = [
      headers.join(','),
      sampleRow.join(','),
      Array(5).fill('').join(',')
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'student_upload_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Parse uploaded CSV/Excel
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFile(file);
    setIsProcessing(true);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const rows = text.split('\n').filter(row => row.trim());
      
      const dataRows = rows.slice(1);
      
      const students: StudentRow[] = dataRows.map((row, index) => {
        const cols = row.split(',').map(col => col.trim());
        const student: StudentRow = {
          id: `temp-${Date.now()}-${index}`,
          name: cols[0] || '',
          email: cols[1] || '',
          branch: cols[2] || '',
          cgpa: cols[3] || '',
          graduationYear: cols[4] || '',
          phone: cols[5] || '',
          linkedin: cols[6] || '',
          skills: cols[7] || '',
          placementStatus: cols[8] || 'unplaced',
        };

        if (!student.email || !student.email.includes('@')) {
          student.error = 'Invalid email';
        } else if (!student.name) {
          student.error = 'Name required';
        } else if (student.cgpa && (parseFloat(student.cgpa) < 0 || parseFloat(student.cgpa) > 10)) {
          student.error = 'CGPA must be 0-10';
        }

        return student;
      }).filter(s => s.name || s.email);

      setParsedStudents(students);
      setIsProcessing(false);
    };

    reader.readAsText(file);
  };

  const addEmailField = () => {
    setManualEmails([...manualEmails, '']);
  };

  const updateManualEmail = (index: number, value: string) => {
    const updated = [...manualEmails];
    updated[index] = value;
    setManualEmails(updated);
  };

  const removeEmailField = (index: number) => {
    setManualEmails(manualEmails.filter((_, i) => i !== index));
  };

  const removeStudent = (id: string) => {
    setParsedStudents(parsedStudents.filter(s => s.id !== id));
  };

  const isStep1Valid = () => {
    return profile.name && profile.city && profile.state && profile.naacGrade && profile.totalStudents;
  };

  const isStep2Valid = () => {
    if (addMethod === 'manual') {
      return manualEmails.some(email => email.trim() && email.includes('@'));
    }
    return parsedStudents.length > 0 && parsedStudents.every(s => !s.error);
  };

  const completeOnboarding = async () => {
    try {
      // Step 1: Update college profile
      await apiService.updateCollegeProfile({
        logo_url: profile.logo,
        website: profile.website,
        address: profile.address,
        naac_grade: profile.naacGrade,
        total_students: profile.totalStudents ? parseInt(profile.totalStudents) : undefined,
      });

      // Step 2: Upload students
      if (addMethod === 'manual') {
        const validEmails = manualEmails.filter(e => e.trim() && e.includes('@'));
        if (validEmails.length > 0) {
          await apiService.uploadStudents({ text: validEmails.join('\n') });
        }
      } else if (uploadedFile) {
        await apiService.uploadStudents({ file: uploadedFile });
      }

      // Step 3: Mark onboarding as complete
      await apiService.completeCollegeOnboarding();

      // Update session info
      const sessionStr = localStorage.getItem('college_session');
      if (sessionStr) {
        const session = JSON.parse(sessionStr);
        session.onboarding_completed = true;
        localStorage.setItem('college_session', JSON.stringify(session));
      }

      navigate(resolvePath('/college-dashboard'));
    } catch (err) {
      console.error('Onboarding error:', err);
    }
  };

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    } else {
      completeOnboarding();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-teal-50/30">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center">
              <i className="ri-graduation-cap-fill text-white text-xl"></i>
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">College Setup</h1>
              <p className="text-xs text-gray-500">Complete your profile to get started</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  step === currentStep 
                    ? 'bg-teal-600 text-white' 
                    : step < currentStep 
                    ? 'bg-emerald-500 text-white' 
                    : 'bg-gray-100 text-gray-400'
                }`}>
                  {step < currentStep ? <i className="ri-check-line"></i> : step}
                </div>
                {step < 3 && <div className={`w-8 h-0.5 ${step < currentStep ? 'bg-emerald-500' : 'bg-gray-200'}`}></div>}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          
          {/* Step 1: College Profile */}
          {currentStep === 1 && (
            <div className="p-10">
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">College Profile Setup</h2>
                <p className="text-gray-500 text-sm">Tell us about your institution</p>
              </div>

              <div className="space-y-6">
                {/* Logo Upload */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">College Logo</label>
                  <div className="flex items-center gap-6">
                    <div className="w-24 h-24 rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center bg-gray-50 overflow-hidden">
                      {logoPreview ? (
                        <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" />
                      ) : (
                        <i className="ri-image-add-line text-3xl text-gray-300"></i>
                      )}
                    </div>
                    <div>
                      <label className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer inline-block">
                        <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                        Upload Logo
                      </label>
                      <p className="text-xs text-gray-400 mt-2">PNG, JPG up to 2MB</p>
                    </div>
                  </div>
                </div>

                {/* College Name */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">College Name *</label>
                  <input
                    type="text"
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    placeholder="e.g., Indian Institute of Technology Mumbai"
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                {/* Website */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Website</label>
                  <input
                    type="url"
                    value={profile.website}
                    onChange={(e) => setProfile({ ...profile, website: e.target.value })}
                    placeholder="https://www.college.edu"
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                {/* Address */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Address</label>
                  <input
                    type="text"
                    value={profile.address}
                    onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                    placeholder="Street address"
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                {/* City & State */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">City *</label>
                    <input
                      type="text"
                      value={profile.city}
                      onChange={(e) => setProfile({ ...profile, city: e.target.value })}
                      placeholder="Mumbai"
                      className="w-full px-4 py-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">State *</label>
                    <input
                      type="text"
                      value={profile.state}
                      onChange={(e) => setProfile({ ...profile, state: e.target.value })}
                      placeholder="Maharashtra"
                      className="w-full px-4 py-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                </div>

                {/* NAAC Grade & Total Students */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">NAAC Grade *</label>
                    <select
                      value={profile.naacGrade}
                      onChange={(e) => setProfile({ ...profile, naacGrade: e.target.value })}
                      className="w-full px-4 py-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer">
                      <option value="">Select grade</option>
                      <option value="A++">A++</option>
                      <option value="A+">A+</option>
                      <option value="A">A</option>
                      <option value="B++">B++</option>
                      <option value="B+">B+</option>
                      <option value="B">B</option>
                      <option value="C">C</option>
                      <option value="Not Accredited">Not Accredited</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Total Students *</label>
                    <input
                      type="number"
                      value={profile.totalStudents}
                      onChange={(e) => setProfile({ ...profile, totalStudents: e.target.value })}
                      placeholder="e.g., 5000"
                      className="w-full px-4 py-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Add Students */}
          {currentStep === 2 && (
            <div className="p-10">
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Add Students</h2>
                <p className="text-gray-500 text-sm">Choose how you want to add student profiles</p>
              </div>

              {/* Method Selection */}
              <div className="grid grid-cols-2 gap-4 mb-8">
                <button
                  onClick={() => setAddMethod('upload')}
                  className={`p-6 rounded-xl border-2 transition-all cursor-pointer text-left ${
                    addMethod === 'upload' 
                      ? 'border-teal-500 bg-teal-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}>
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 ${
                    addMethod === 'upload' ? 'bg-teal-600' : 'bg-gray-100'
                  }`}>
                    <i className={`ri-file-excel-2-line text-2xl ${
                      addMethod === 'upload' ? 'text-white' : 'text-gray-400'
                    }`}></i>
                  </div>
                  <h3 className="text-base font-bold text-gray-900 mb-1">Upload Excel Sheet</h3>
                  <p className="text-sm text-gray-500">Bulk upload student data using our template</p>
                  {addMethod === 'upload' && (
                    <div className="mt-3 flex items-center gap-1.5 text-xs text-teal-600 font-semibold">
                      <i className="ri-check-line"></i>
                      Selected
                    </div>
                  )}
                </button>

                <button
                  onClick={() => setAddMethod('manual')}
                  className={`p-6 rounded-xl border-2 transition-all cursor-pointer text-left ${
                    addMethod === 'manual' 
                      ? 'border-teal-500 bg-teal-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}>
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 ${
                    addMethod === 'manual' ? 'bg-teal-600' : 'bg-gray-100'
                  }`}>
                    <i className={`ri-user-add-line text-2xl ${
                      addMethod === 'manual' ? 'text-white' : 'text-gray-400'
                    }`}></i>
                  </div>
                  <h3 className="text-base font-bold text-gray-900 mb-1">Add Manually</h3>
                  <p className="text-sm text-gray-500">Enter student email addresses one by one</p>
                  {addMethod === 'manual' && (
                    <div className="mt-3 flex items-center gap-1.5 text-xs text-teal-600 font-semibold">
                      <i className="ri-check-line"></i>
                      Selected
                    </div>
                  )}
                </button>
              </div>

              {/* Upload Method */}
              {addMethod === 'upload' && (
                <div className="space-y-6">
                  {/* Download Template */}
                  <div className="bg-amber-50 border border-amber-100 rounded-xl p-5">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                        <i className="ri-information-line text-amber-600 text-lg"></i>
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-bold text-amber-900 mb-1">Download the template first</h4>
                        <p className="text-sm text-amber-700 mb-3">Fill in your student data using our standardized format, then upload it below.</p>
                        <button
                          onClick={downloadTemplate}
                          className="px-4 py-2 rounded-lg bg-amber-600 text-white text-sm font-medium hover:bg-amber-700 transition-colors whitespace-nowrap cursor-pointer flex items-center gap-2">
                          <i className="ri-download-line"></i>
                          Download Template
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* File Upload */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">Upload Filled Template</label>
                    <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center hover:border-teal-400 transition-colors">
                      <input
                        type="file"
                        accept=".csv,.xlsx,.xls"
                        onChange={handleFileUpload}
                        className="hidden"
                        id="file-upload"
                      />
                      <label htmlFor="file-upload" className="cursor-pointer">
                        <div className="w-16 h-16 rounded-xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
                          <i className="ri-upload-cloud-2-line text-3xl text-gray-400"></i>
                        </div>
                        <p className="text-sm font-semibold text-gray-900 mb-1">
                          {uploadedFile ? uploadedFile.name : 'Click to upload or drag and drop'}
                        </p>
                        <p className="text-xs text-gray-500">CSV or Excel file (max 5MB)</p>
                      </label>
                    </div>
                  </div>

                  {/* Processing */}
                  {isProcessing && (
                    <div className="flex items-center justify-center gap-3 py-8">
                      <div className="w-5 h-5 border-2 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-sm text-gray-600">Processing file...</span>
                    </div>
                  )}

                  {/* Parsed Students Preview */}
                  {parsedStudents.length > 0 && !isProcessing && (
                    <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-sm font-bold text-gray-900">
                          Parsed Students ({parsedStudents.length})
                        </h4>
                        <span className="text-xs text-gray-500">
                          {parsedStudents.filter(s => s.error).length > 0 && (
                            <span className="text-red-600 font-semibold">
                              {parsedStudents.filter(s => s.error).length} errors found
                            </span>
                          )}
                        </span>
                      </div>
                      <div className="max-h-64 overflow-y-auto space-y-2">
                        {parsedStudents.map((student) => (
                          <div key={student.id} className={`flex items-center justify-between p-3 rounded-lg ${
                            student.error ? 'bg-red-50 border border-red-200' : 'bg-white border border-gray-100'
                          }`}>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">{student.name || 'No name'}</p>
                              <p className="text-xs text-gray-500 truncate">{student.email}</p>
                              {student.error && (
                                <p className="text-xs text-red-600 font-semibold mt-1">{student.error}</p>
                              )}
                            </div>
                            <button
                              onClick={() => removeStudent(student.id)}
                              className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer shrink-0 ml-3">
                              <i className="ri-close-line text-base"></i>
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Manual Method */}
              {addMethod === 'manual' && (
                <div className="space-y-4">
                  <label className="block text-sm font-semibold text-gray-700">Student Email Addresses</label>
                  {manualEmails.map((email, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => updateManualEmail(index, e.target.value)}
                        placeholder="student@college.edu"
                        className="flex-1 px-4 py-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                      {manualEmails.length > 1 && (
                        <button
                          onClick={() => removeEmailField(index)}
                          className="w-10 h-10 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer shrink-0">
                          <i className="ri-delete-bin-line text-base"></i>
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    onClick={addEmailField}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer whitespace-nowrap">
                    <i className="ri-add-line"></i>
                    Add Another Email
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Review & Confirm */}
          {currentStep === 3 && (
            <div className="p-10">
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Review & Confirm</h2>
                <p className="text-gray-500 text-sm">Verify your information before completing setup</p>
              </div>

              <div className="space-y-6">
                {/* College Profile Summary */}
                <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
                  <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <i className="ri-building-line text-teal-600"></i>
                    College Profile
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">College Name</p>
                      <p className="text-sm font-semibold text-gray-900">{profile.name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Location</p>
                      <p className="text-sm font-semibold text-gray-900">{profile.city}, {profile.state}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">NAAC Grade</p>
                      <p className="text-sm font-semibold text-gray-900">{profile.naacGrade}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Total Students</p>
                      <p className="text-sm font-semibold text-gray-900">{profile.totalStudents}</p>
                    </div>
                  </div>
                </div>

                {/* Students Summary */}
                <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
                  <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <i className="ri-group-line text-teal-600"></i>
                    Students to be Added
                  </h3>
                  
                  {addMethod === 'manual' ? (
                    <div>
                      <p className="text-sm text-gray-600 mb-3">
                        <span className="font-bold text-gray-900">{manualEmails.filter(e => e.trim()).length}</span> email addresses added
                      </p>
                      <div className="max-h-48 overflow-y-auto space-y-2">
                        {manualEmails.filter(e => e.trim()).map((email, index) => (
                          <div key={index} className="flex items-center gap-2 text-sm text-gray-700 bg-white px-3 py-2 rounded-lg border border-gray-100">
                            <i className="ri-mail-line text-teal-600 text-xs"></i>
                            {email}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm text-gray-600 mb-3">
                        <span className="font-bold text-gray-900">{parsedStudents.length}</span> students from uploaded file
                      </p>
                      <div className="max-h-64 overflow-y-auto">
                        <table className="w-full text-sm">
                          <thead className="bg-white sticky top-0">
                            <tr className="border-b border-gray-200">
                              <th className="text-left py-2 px-3 text-xs font-semibold text-gray-600">Name</th>
                              <th className="text-left py-2 px-3 text-xs font-semibold text-gray-600">Email</th>
                              <th className="text-left py-2 px-3 text-xs font-semibold text-gray-600">Branch</th>
                              <th className="text-left py-2 px-3 text-xs font-semibold text-gray-600">CGPA</th>
                            </tr>
                          </thead>
                          <tbody>
                            {parsedStudents.map((student) => (
                              <tr key={student.id} className="border-b border-gray-100">
                                <td className="py-2 px-3 text-gray-900">{student.name}</td>
                                <td className="py-2 px-3 text-gray-600">{student.email}</td>
                                <td className="py-2 px-3 text-gray-600">{student.branch}</td>
                                <td className="py-2 px-3 text-gray-900 font-semibold">{student.cgpa}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>

                {/* Success Message */}
                <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-5">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
                      <i className="ri-checkbox-circle-line text-emerald-600 text-lg"></i>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-emerald-900 mb-1">Ready to launch!</h4>
                      <p className="text-sm text-emerald-700">
                        Once you confirm, your college dashboard will be set up and all students will be added to the system.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="px-10 pb-10 flex items-center justify-between border-t border-gray-100 pt-6">
            <button
              onClick={handleBack}
              disabled={currentStep === 1}
              className="flex items-center gap-2 px-5 py-3 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors font-medium cursor-pointer whitespace-nowrap">
              <i className="ri-arrow-left-line"></i>
              Back
            </button>

            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-500">
                Step {currentStep} of 3
              </span>
              <button
                onClick={handleNext}
                disabled={
                  (currentStep === 1 && !isStep1Valid()) ||
                  (currentStep === 2 && !isStep2Valid())
                }
                className="flex items-center gap-2 px-6 py-3 rounded-lg bg-teal-600 text-white font-semibold hover:bg-teal-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer whitespace-nowrap">
                {currentStep === 3 ? (
                  <>
                    <i className="ri-check-line"></i>
                    Complete Setup
                  </>
                ) : (
                  <>
                    Continue
                    <i className="ri-arrow-right-line"></i>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

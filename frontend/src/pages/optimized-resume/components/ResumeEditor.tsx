import { useState } from 'react';
import { ResumeData } from '../types';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface ResumeEditorProps {
  data: ResumeData;
  onDataChange: (data: ResumeData) => void;
  templateId: string;
  children: React.ReactNode;
}

export default function ResumeEditor({ data, onDataChange, templateId, children }: ResumeEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const saveToDatabase = async () => {
    setIsSaving(true);
    try {
      const token = localStorage.getItem('access_token');
      const optimizationData = sessionStorage.getItem('optimizationData');
      
      if (!token || !optimizationData) return;
      
      const parsedData = JSON.parse(optimizationData);
      const resumeId = parsedData.resumeId;
      
      if (!resumeId) return;

      const response = await fetch(`${import.meta.env.VITE_API_URL}/resume/${resumeId}/save-edited`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...data,
          template_id: templateId,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Resume saved:', result);
      }
    } catch (error) {
      console.error('Error saving resume:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownloadPDF = async () => {
    setIsDownloading(true);
    try {
      // Save to database first
      await saveToDatabase();

      const resumeElement = document.getElementById('resume-preview');
      if (!resumeElement) return;

      // Create canvas from HTML
      const canvas = await html2canvas(resumeElement, {
        scale: 2,
        useCORS: true,
        logging: false,
      });

      // Convert to PDF
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      // Scale image to fit page width
      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      // If it fits on one page, just add it
      if (imgHeight <= pageHeight) {
        pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      } else {
        // Multi-page: slice the canvas into page-sized chunks
        const scaledPageHeight = (pageHeight * canvas.width) / imgWidth;
        let yOffset = 0;
        let pageNum = 0;

        while (yOffset < canvas.height) {
          if (pageNum > 0) pdf.addPage();

          const sliceHeight = Math.min(scaledPageHeight, canvas.height - yOffset);
          const pageCanvas = document.createElement('canvas');
          pageCanvas.width = canvas.width;
          pageCanvas.height = sliceHeight;
          const ctx = pageCanvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(canvas, 0, yOffset, canvas.width, sliceHeight, 0, 0, canvas.width, sliceHeight);
            const pageImgData = pageCanvas.toDataURL('image/png');
            const renderedHeight = (sliceHeight * imgWidth) / canvas.width;
            pdf.addImage(pageImgData, 'PNG', 0, 0, imgWidth, renderedHeight);
          }

          yOffset += scaledPageHeight;
          pageNum++;
        }
      }

      pdf.save(`${data.name.replace(/\s+/g, '_')}_Resume.pdf`);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert('Failed to download PDF. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleFieldUpdate = (field: keyof ResumeData, value: any) => {
    onDataChange({ ...data, [field]: value });
  };

  const handleExperienceUpdate = (index: number, field: string, value: any) => {
    const newExperience = [...data.experience];
    newExperience[index] = { ...newExperience[index], [field]: value };
    onDataChange({ ...data, experience: newExperience });
  };

  const handleAddExperience = () => {
    onDataChange({
      ...data,
      experience: [
        ...data.experience,
        {
          role: 'New Role',
          company: 'Company Name',
          location: 'Location',
          period: 'Start - End',
          bullets: ['Achievement or responsibility'],
        },
      ],
    });
  };

  const handleRemoveExperience = (index: number) => {
    const newExperience = data.experience.filter((_, i) => i !== index);
    onDataChange({ ...data, experience: newExperience });
  };

  const handleMoveExperience = (index: number, direction: 'up' | 'down') => {
    const newExperience = [...data.experience];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newExperience.length) return;
    [newExperience[index], newExperience[targetIndex]] = [newExperience[targetIndex], newExperience[index]];
    onDataChange({ ...data, experience: newExperience });
  };

  const handleAddBullet = (expIndex: number) => {
    const newExperience = [...data.experience];
    newExperience[expIndex].bullets.push('New achievement or responsibility');
    onDataChange({ ...data, experience: newExperience });
  };

  const handleRemoveBullet = (expIndex: number, bulletIndex: number) => {
    const newExperience = [...data.experience];
    newExperience[expIndex].bullets = newExperience[expIndex].bullets.filter((_, i) => i !== bulletIndex);
    onDataChange({ ...data, experience: newExperience });
  };

  const handleUpdateBullet = (expIndex: number, bulletIndex: number, value: string) => {
    const newExperience = [...data.experience];
    newExperience[expIndex].bullets[bulletIndex] = value;
    onDataChange({ ...data, experience: newExperience });
  };

  const handleAddEducation = () => {
    onDataChange({
      ...data,
      education: [
        ...data.education,
        {
          degree: 'Degree Name',
          school: 'Institution Name',
          period: 'Year',
        },
      ],
    });
  };

  const handleRemoveEducation = (index: number) => {
    const newEducation = data.education.filter((_, i) => i !== index);
    onDataChange({ ...data, education: newEducation });
  };

  const handleAddSkill = () => {
    onDataChange({
      ...data,
      skills: [...data.skills, 'New Skill'],
    });
  };

  const handleRemoveSkill = (index: number) => {
    const newSkills = data.skills.filter((_, i) => i !== index);
    onDataChange({ ...data, skills: newSkills });
  };

  return (
    <div className="relative">
      {/* Edit Mode Toggle */}
      <div className="absolute -top-12 right-0 flex items-center gap-2 z-10">
        <button
          onClick={() => setIsEditing(!isEditing)}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
            isEditing
              ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/30'
              : 'bg-white text-gray-700 border border-gray-200 hover:border-amber-400'
          }`}
        >
          <i className={`${isEditing ? 'ri-eye-line' : 'ri-edit-line'} mr-2`}></i>
          {isEditing ? 'Preview' : 'Edit'}
        </button>
        <button
          onClick={saveToDatabase}
          disabled={isSaving}
          className="px-4 py-2 rounded-lg bg-blue-500 text-white text-sm font-semibold shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <i className={`${isSaving ? 'ri-loader-4-line animate-spin' : 'ri-save-line'} mr-2`}></i>
          {isSaving ? 'Saving...' : 'Save'}
        </button>
        <button
          onClick={handleDownloadPDF}
          disabled={isDownloading}
          className="px-4 py-2 rounded-lg bg-gradient-to-r from-teal-600 to-emerald-500 text-white text-sm font-semibold shadow-lg shadow-teal-500/25 hover:shadow-teal-500/40 hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <i className={`${isDownloading ? 'ri-loader-4-line animate-spin' : 'ri-download-2-line'} mr-2`}></i>
          {isDownloading ? 'Downloading...' : 'Download PDF'}
        </button>
      </div>

      {/* Resume Preview with Editing */}
      <div id="resume-preview" className={isEditing ? 'editing-mode' : ''}>
        {children}
      </div>

      {/* Editing Controls (when in edit mode) */}
      {isEditing && (
        <div className="mt-6 glass-card rounded-2xl p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <i className="ri-edit-box-line text-teal-600"></i>
            Edit Resume Content
          </h3>

          {/* Personal Info */}
          <div className="mb-6">
            <h4 className="text-sm font-bold text-gray-700 mb-3">Personal Information</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Full Name</label>
                <input
                  type="text"
                  value={data.name}
                  onChange={(e) => handleFieldUpdate('name', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Job Title</label>
                <input
                  type="text"
                  value={data.title}
                  onChange={(e) => handleFieldUpdate('title', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Email</label>
                <input
                  type="email"
                  value={data.email}
                  onChange={(e) => handleFieldUpdate('email', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Phone</label>
                <input
                  type="tel"
                  value={data.phone}
                  onChange={(e) => handleFieldUpdate('phone', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">LinkedIn</label>
                <input
                  type="text"
                  value={data.linkedin}
                  onChange={(e) => handleFieldUpdate('linkedin', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Location</label>
                <input
                  type="text"
                  value={data.location}
                  onChange={(e) => handleFieldUpdate('location', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>
          </div>

          {/* Professional Summary */}
          <div className="mb-6">
            <h4 className="text-sm font-bold text-gray-700 mb-3">Professional Summary</h4>
            <textarea
              value={data.summary}
              onChange={(e) => handleFieldUpdate('summary', e.target.value)}
              rows={4}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {/* Experience */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-bold text-gray-700">Work Experience</h4>
              <button
                onClick={handleAddExperience}
                className="px-3 py-1.5 rounded-lg bg-teal-50 text-teal-700 text-xs font-semibold hover:bg-teal-100 transition-colors"
              >
                <i className="ri-add-line mr-1"></i>
                Add Position
              </button>
            </div>
            <div className="space-y-4">
              {data.experience.map((exp, index) => (
                <div key={index} className="p-4 rounded-lg border border-gray-200 bg-gray-50">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-gray-500">Position {index + 1}</span>
                    <div className="flex items-center gap-2">
                      {data.experience.length > 1 && (
                        <>
                          <button
                            onClick={() => handleMoveExperience(index, 'up')}
                            disabled={index === 0}
                            className="text-gray-400 hover:text-teal-600 text-sm disabled:opacity-30"
                            title="Move up"
                          >
                            <i className="ri-arrow-up-line"></i>
                          </button>
                          <button
                            onClick={() => handleMoveExperience(index, 'down')}
                            disabled={index === data.experience.length - 1}
                            className="text-gray-400 hover:text-teal-600 text-sm disabled:opacity-30"
                            title="Move down"
                          >
                            <i className="ri-arrow-down-line"></i>
                          </button>
                        </>
                      )}
                      {data.experience.length > 1 && (
                        <button
                          onClick={() => handleRemoveExperience(index)}
                          className="text-red-500 hover:text-red-700 text-xs"
                          title="Delete position"
                        >
                          <i className="ri-delete-bin-line"></i>
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <input
                      type="text"
                      value={exp.role}
                      onChange={(e) => handleExperienceUpdate(index, 'role', e.target.value)}
                      placeholder="Job Title"
                      className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                    <input
                      type="text"
                      value={exp.company}
                      onChange={(e) => handleExperienceUpdate(index, 'company', e.target.value)}
                      placeholder="Company"
                      className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                    <input
                      type="text"
                      value={exp.location}
                      onChange={(e) => handleExperienceUpdate(index, 'location', e.target.value)}
                      placeholder="Location"
                      className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                    <input
                      type="text"
                      value={exp.period}
                      onChange={(e) => handleExperienceUpdate(index, 'period', e.target.value)}
                      placeholder="Period"
                      className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-xs font-semibold text-gray-600">Achievements</label>
                      <button
                        onClick={() => handleAddBullet(index)}
                        className="text-xs text-teal-600 hover:text-teal-700 font-semibold"
                      >
                        <i className="ri-add-line"></i> Add Bullet
                      </button>
                    </div>
                    <div className="space-y-2">
                      {exp.bullets.map((bullet, bidx) => (
                        <div key={bidx} className="flex gap-2">
                          <textarea
                            value={bullet}
                            onChange={(e) => handleUpdateBullet(index, bidx, e.target.value)}
                            rows={2}
                            className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                          />
                          {exp.bullets.length > 1 && (
                            <button
                              onClick={() => handleRemoveBullet(index, bidx)}
                              className="text-red-500 hover:text-red-700 px-2"
                              title="Remove bullet"
                            >
                              <i className="ri-close-line"></i>
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Skills */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-bold text-gray-700">Skills</h4>
              <button
                onClick={handleAddSkill}
                className="px-3 py-1.5 rounded-lg bg-teal-50 text-teal-700 text-xs font-semibold hover:bg-teal-100 transition-colors"
              >
                <i className="ri-add-line mr-1"></i>
                Add Skill
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {data.skills.map((skill, idx) => (
                <div key={idx} className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2">
                  <input
                    type="text"
                    value={skill}
                    onChange={(e) => {
                      const newSkills = [...data.skills];
                      newSkills[idx] = e.target.value;
                      handleFieldUpdate('skills', newSkills);
                    }}
                    className="text-sm focus:outline-none min-w-[100px]"
                  />
                  <button
                    onClick={() => handleRemoveSkill(idx)}
                    className="text-red-500 hover:text-red-700 text-xs"
                  >
                    <i className="ri-close-line"></i>
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Education */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-bold text-gray-700">Education</h4>
              <button
                onClick={handleAddEducation}
                className="px-3 py-1.5 rounded-lg bg-teal-50 text-teal-700 text-xs font-semibold hover:bg-teal-100 transition-colors"
              >
                <i className="ri-add-line mr-1"></i>
                Add Education
              </button>
            </div>
            <div className="space-y-3">
              {data.education.map((edu, index) => (
                <div key={index} className="p-4 rounded-lg border border-gray-200 bg-gray-50">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-gray-500">Education {index + 1}</span>
                    {data.education.length > 1 && (
                      <button
                        onClick={() => handleRemoveEducation(index)}
                        className="text-red-500 hover:text-red-700 text-xs"
                      >
                        <i className="ri-delete-bin-line"></i>
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <input
                      type="text"
                      value={edu.degree}
                      onChange={(e) => {
                        const newEd = [...data.education];
                        newEd[index] = { ...newEd[index], degree: e.target.value };
                        handleFieldUpdate('education', newEd);
                      }}
                      placeholder="Degree"
                      className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                    <input
                      type="text"
                      value={edu.school}
                      onChange={(e) => {
                        const newEd = [...data.education];
                        newEd[index] = { ...newEd[index], school: e.target.value };
                        handleFieldUpdate('education', newEd);
                      }}
                      placeholder="School"
                      className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                    <input
                      type="text"
                      value={edu.period}
                      onChange={(e) => {
                        const newEd = [...data.education];
                        newEd[index] = { ...newEd[index], period: e.target.value };
                        handleFieldUpdate('education', newEd);
                      }}
                      placeholder="Year"
                      className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

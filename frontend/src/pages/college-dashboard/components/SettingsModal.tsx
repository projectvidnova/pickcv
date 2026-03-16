import { useState } from 'react';
import { apiService } from '../../../services/api';

interface CollegeProfile {
  logo_url: string | null;
  institution_name: string;
  website: string;
  address: string;
  city: string;
  state: string;
  naac_grade: string;
  total_students: number | string;
  official_email?: string;
  contact_person_name?: string;
  designation?: string;
  phone_number?: string;
  institution_type?: string;
}

interface SettingsModalProps {
  profile: CollegeProfile;
  onClose: () => void;
  onSave: (profile: CollegeProfile) => void;
}

export default function SettingsModal({ profile, onClose, onSave }: SettingsModalProps) {
  const [formData, setFormData] = useState<CollegeProfile>(profile);
  const [logoPreview, setLogoPreview] = useState<string | null>(profile.logo_url);
  const [isSaving, setIsSaving] = useState(false);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setLogoPreview(result);
        setFormData(prev => ({ ...prev, logo_url: result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await apiService.updateCollegeProfile({
        institution_name: formData.institution_name,
        website: formData.website,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        naac_grade: formData.naac_grade,
        total_students: typeof formData.total_students === 'string' ? parseInt(formData.total_students) || 0 : formData.total_students,
      });
      onSave(formData);
      onClose();
    } catch (err: any) {
      alert(err.message || 'Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-teal-600 to-emerald-600 px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
              <i className="ri-settings-3-line text-white text-xl"></i>
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">College Settings</h2>
              <p className="text-teal-100 text-sm">Update your institution profile</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-white transition-colors cursor-pointer">
            <i className="ri-close-line text-xl"></i>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Logo Upload */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">College Logo</label>
            <div className="flex items-center gap-4">
              {logoPreview ? (
                <img src={logoPreview} alt="Logo Preview" className="w-20 h-20 rounded-xl object-cover border border-gray-200" />
              ) : (
                <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center">
                  <i className="ri-graduation-cap-fill text-white text-2xl"></i>
                </div>
              )}
              <div className="flex-1">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                  className="hidden"
                  id="logo-upload"
                />
                <label
                  htmlFor="logo-upload"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer">
                  <i className="ri-upload-2-line"></i>
                  Upload New Logo
                </label>
                <p className="text-xs text-gray-500 mt-2">Recommended: Square image, at least 200x200px</p>
              </div>
            </div>
          </div>

          {/* College Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">College Name *</label>
            <input
              type="text"
              required
              value={formData.institution_name}
              onChange={(e) => setFormData(prev => ({ ...prev, institution_name: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              placeholder="Enter college name"
            />
          </div>

          {/* Website */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Website</label>
            <input
              type="url"
              value={formData.website}
              onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              placeholder="https://www.example.edu"
            />
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Address *</label>
            <input
              type="text"
              required
              value={formData.address}
              onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              placeholder="Street address"
            />
          </div>

          {/* City & State */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">City *</label>
              <input
                type="text"
                required
                value={formData.city}
                onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                placeholder="City"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">State *</label>
              <input
                type="text"
                required
                value={formData.state}
                onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                placeholder="State"
              />
            </div>
          </div>

          {/* NAAC Grade & Total Students */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">NAAC Grade</label>
              <select
                value={formData.naac_grade}
                onChange={(e) => setFormData(prev => ({ ...prev, naac_grade: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer">
                <option value="">Select Grade</option>
                <option value="A++">A++</option>
                <option value="A+">A+</option>
                <option value="A">A</option>
                <option value="B++">B++</option>
                <option value="B+">B+</option>
                <option value="B">B</option>
                <option value="C">C</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Total Students</label>
              <input
                type="text"
                value={formData.total_students}
                onChange={(e) => setFormData(prev => ({ ...prev, total_students: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                placeholder="e.g., 850"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors whitespace-nowrap cursor-pointer">
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-teal-600 to-emerald-600 text-white text-sm font-semibold hover:from-teal-700 hover:to-emerald-700 transition-all whitespace-nowrap cursor-pointer flex items-center gap-2 disabled:opacity-50">
              <i className={isSaving ? 'ri-loader-4-line animate-spin' : 'ri-save-line'}></i>
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

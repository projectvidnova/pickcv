import { useState, useEffect } from 'react';
import { apiService } from '../../../services/api';

interface CollegeAdmin {
  id: number;
  college_id: number;
  email: string;
  name: string;
  role: string;
  is_active: boolean;
  must_change_password: boolean;
  last_login: string | null;
  created_at: string;
}

interface AdminsTabProps {
  isOwner: boolean;
}

export default function AdminsTab({ isOwner }: AdminsTabProps) {
  const [admins, setAdmins] = useState<CollegeAdmin[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Add admin form
  const [showAddForm, setShowAddForm] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    loadAdmins();
  }, []);

  const loadAdmins = async () => {
    setIsLoading(true);
    const result = await apiService.getCollegeAdmins();
    if (result.success && result.data) {
      setAdmins(result.data);
    }
    setIsLoading(false);
  };

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim() || !newName.trim()) return;

    setIsAdding(true);
    setError('');
    setSuccess('');

    const result = await apiService.addCollegeAdmin({
      email: newEmail.trim(),
      name: newName.trim(),
    });

    if (result.success) {
      setSuccess(`Admin added! Login credentials have been sent to ${newEmail.trim()}`);
      setNewEmail('');
      setNewName('');
      setShowAddForm(false);
      await loadAdmins();
    } else {
      setError(result.error || 'Failed to add admin');
    }
    setIsAdding(false);
  };

  const handleToggle = async (adminId: number) => {
    setError('');
    const result = await apiService.toggleCollegeAdmin(adminId);
    if (result.success) {
      await loadAdmins();
    } else {
      setError(result.error || 'Failed to update admin');
    }
  };

  const handleRemove = async (adminId: number, adminEmail: string) => {
    if (!confirm(`Remove ${adminEmail} as admin? They will no longer be able to log in.`)) return;
    setError('');
    const result = await apiService.removeCollegeAdmin(adminId);
    if (result.success) {
      setSuccess(`${adminEmail} has been removed`);
      await loadAdmins();
    } else {
      setError(result.error || 'Failed to remove admin');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-3 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Team Management</h3>
          <p className="text-sm text-gray-500 mt-1">
            Manage placement officers who can access this dashboard
          </p>
        </div>
        {isOwner && (
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-2 px-4 py-2.5 bg-teal-600 text-white rounded-xl text-sm font-medium hover:bg-teal-700 transition-colors cursor-pointer"
          >
            <i className="ri-user-add-line"></i>
            Add Placement Officer
          </button>
        )}
      </div>

      {/* Alerts */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
          <i className="ri-error-warning-line text-red-500 text-lg"></i>
          <p className="text-sm text-red-700">{error}</p>
          <button onClick={() => setError('')} className="ml-auto text-red-400 hover:text-red-600 cursor-pointer">
            <i className="ri-close-line"></i>
          </button>
        </div>
      )}
      {success && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-3">
          <i className="ri-checkbox-circle-line text-emerald-500 text-lg"></i>
          <p className="text-sm text-emerald-700">{success}</p>
          <button onClick={() => setSuccess('')} className="ml-auto text-emerald-400 hover:text-emerald-600 cursor-pointer">
            <i className="ri-close-line"></i>
          </button>
        </div>
      )}

      {/* Add Admin Form */}
      {showAddForm && isOwner && (
        <form onSubmit={handleAddAdmin} className="bg-gray-50 rounded-xl border border-gray-200 p-5 space-y-4">
          <h4 className="font-medium text-gray-900 text-sm">Add New Placement Officer</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Full Name</label>
              <input
                type="text"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder="e.g. Dr. Rajesh Kumar"
                required
                className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Email Address</label>
              <input
                type="email"
                value={newEmail}
                onChange={e => setNewEmail(e.target.value)}
                placeholder="e.g. rajesh@college.edu"
                required
                className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
              />
            </div>
          </div>
          <p className="text-xs text-gray-500">
            A temporary password will be generated and sent to this email. They will be asked to change it on first login.
          </p>
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={isAdding}
              className="px-5 py-2.5 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors disabled:opacity-50 cursor-pointer flex items-center gap-2"
            >
              {isAdding ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Adding...
                </>
              ) : (
                <>
                  <i className="ri-send-plane-line"></i>
                  Add & Send Credentials
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => { setShowAddForm(false); setNewEmail(''); setNewName(''); }}
              className="px-4 py-2.5 text-gray-600 hover:text-gray-800 text-sm cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Admins List */}
      <div className="space-y-3">
        {admins.map(admin => (
          <div
            key={`${admin.role}-${admin.id}`}
            className={`flex items-center justify-between p-4 rounded-xl border transition-colors ${
              !admin.is_active ? 'bg-gray-50 border-gray-200 opacity-60' : 'bg-white border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm ${
                admin.role === 'owner' ? 'bg-gradient-to-br from-amber-500 to-orange-500' : 'bg-gradient-to-br from-teal-500 to-emerald-500'
              }`}>
                {admin.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900 text-sm">{admin.name}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    admin.role === 'owner'
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-teal-100 text-teal-700'
                  }`}>
                    {admin.role}
                  </span>
                  {!admin.is_active && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700">
                      Disabled
                    </span>
                  )}
                  {admin.must_change_password && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-yellow-100 text-yellow-700">
                      Pending Setup
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-0.5">{admin.email}</p>
                {admin.last_login && (
                  <p className="text-xs text-gray-400 mt-0.5">
                    Last login: {new Date(admin.last_login).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>

            {/* Actions (only for non-owner admins, and only if current user is owner) */}
            {admin.role !== 'owner' && isOwner && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleToggle(admin.id)}
                  className={`p-2 rounded-lg text-sm transition-colors cursor-pointer ${
                    admin.is_active
                      ? 'text-amber-600 hover:bg-amber-50'
                      : 'text-emerald-600 hover:bg-emerald-50'
                  }`}
                  title={admin.is_active ? 'Deactivate' : 'Activate'}
                >
                  <i className={admin.is_active ? 'ri-forbid-line' : 'ri-checkbox-circle-line'}></i>
                </button>
                <button
                  onClick={() => handleRemove(admin.id, admin.email)}
                  className="p-2 rounded-lg text-red-500 hover:bg-red-50 text-sm transition-colors cursor-pointer"
                  title="Remove admin"
                >
                  <i className="ri-delete-bin-line"></i>
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {admins.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <i className="ri-team-line text-4xl mb-3 block"></i>
          <p className="text-sm">No team members yet</p>
        </div>
      )}
    </div>
  );
}

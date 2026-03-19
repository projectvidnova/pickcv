import { useState, useEffect, Fragment } from 'react';
import { apiService } from '../../../services/api';

interface COEGroup {
  id: number;
  name: string;
  code: string;
  description: string | null;
  focus_skills: string[];
  faculty_lead_name: string | null;
  faculty_lead_email: string | null;
  max_capacity: number | null;
  is_active: boolean;
  active_count?: number;
  avg_resume_score?: number | null;
  avg_cgpa?: number | null;
  created_at: string;
}

interface COEMember {
  student_id: number;
  student_name: string;
  student_email: string;
  role: string;
  resume_score: number | null;
  cgpa: number | null;
  joined_at: string;
}

interface Student {
  id: number;
  name: string;
  email: string;
  full_name: string | null;
}

interface COEGroupsTabProps {
  students: Student[];
  onRefresh: () => void;
}

export default function COEGroupsTab({ students, onRefresh }: COEGroupsTabProps) {
  const [groups, setGroups] = useState<COEGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingGroup, setEditingGroup] = useState<COEGroup | null>(null);
  const [expandedGroup, setExpandedGroup] = useState<number | null>(null);
  const [members, setMembers] = useState<Record<number, COEMember[]>>({});
  const [loadingMembers, setLoadingMembers] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showAddMembers, setShowAddMembers] = useState<number | null>(null);
  const [memberSearch, setMemberSearch] = useState('');

  const [formData, setFormData] = useState({
    name: '', code: '', description: '', faculty_lead_name: '', faculty_lead_email: '', max_capacity: 50,
  });

  useEffect(() => { loadGroups(); }, []);

  const loadGroups = async () => {
    setIsLoading(true);
    const res = await apiService.getCOEGroups(false);
    if (res.success && res.data) setGroups(res.data);
    setIsLoading(false);
  };

  const loadMembers = async (groupId: number) => {
    if (members[groupId]) return;
    setLoadingMembers(groupId);
    const res = await apiService.getCOEMembers(groupId);
    if (res.success && res.data) {
      setMembers(prev => ({ ...prev, [groupId]: res.data }));
    }
    setLoadingMembers(null);
  };

  const handleCreate = async () => {
    if (!formData.name || !formData.code) {
      setError('Name and code are required');
      return;
    }
    setError('');
    const res = await apiService.createCOEGroup({
      name: formData.name, code: formData.code,
      description: formData.description || undefined,
      faculty_lead_name: formData.faculty_lead_name || undefined,
      faculty_lead_email: formData.faculty_lead_email || undefined,
      max_capacity: formData.max_capacity || undefined,
    });
    if (res.success) {
      setShowCreateForm(false);
      resetForm();
      showSuccess('COE group created successfully');
      loadGroups();
      onRefresh();
    } else {
      setError(res.error || 'Failed to create');
    }
  };

  const handleUpdate = async () => {
    if (!editingGroup) return;
    const res = await apiService.updateCOEGroup(editingGroup.id, formData);
    if (res.success) {
      setEditingGroup(null);
      setShowCreateForm(false);
      resetForm();
      showSuccess('COE group updated');
      loadGroups();
    } else {
      setError(res.error || 'Failed to update');
    }
  };

  const handleAddMembers = async (groupId: number, studentIds: number[]) => {
    if (studentIds.length === 0) return;
    const res = await apiService.addCOEMembers(groupId, studentIds);
    if (res.success) {
      // Reload members
      setMembers(prev => { const n = { ...prev }; delete n[groupId]; return n; });
      loadMembers(groupId);
      setShowAddMembers(null);
      setMemberSearch('');
      showSuccess(`${studentIds.length} member(s) added`);
      loadGroups();
    } else {
      setError(res.error || 'Failed to add members');
    }
  };

  const handleRemoveMember = async (groupId: number, studentId: number) => {
    if (!confirm('Remove this student from the COE group?')) return;
    const res = await apiService.removeCOEMember(groupId, studentId);
    if (res.success) {
      setMembers(prev => ({
        ...prev,
        [groupId]: (prev[groupId] || []).filter(m => m.student_id !== studentId)
      }));
      showSuccess('Member removed');
      loadGroups();
    }
  };

  const resetForm = () => {
    setFormData({ name: '', code: '', description: '', faculty_lead_name: '', faculty_lead_email: '', max_capacity: 50 });
    setError('');
  };

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const startEdit = (group: COEGroup) => {
    setEditingGroup(group);
    setFormData({
      name: group.name, code: group.code,
      description: group.description || '',
      faculty_lead_name: group.faculty_lead_name || '',
      faculty_lead_email: group.faculty_lead_email || '',
      max_capacity: group.max_capacity || 50,
    });
    setShowCreateForm(true);
  };

  const cancelForm = () => {
    setShowCreateForm(false);
    setEditingGroup(null);
    resetForm();
  };

  const toggleExpand = (groupId: number) => {
    if (expandedGroup === groupId) {
      setExpandedGroup(null);
    } else {
      setExpandedGroup(groupId);
      loadMembers(groupId);
    }
  };

  // Filter students not already in the group
  const getAvailableStudents = (groupId: number) => {
    const existingIds = new Set((members[groupId] || []).map(m => m.student_id));
    return students.filter(s => {
      if (existingIds.has(s.id)) return false;
      if (!memberSearch) return true;
      const name = s.full_name || s.name || s.email;
      return name.toLowerCase().includes(memberSearch.toLowerCase()) ||
        s.email.toLowerCase().includes(memberSearch.toLowerCase());
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-8 h-8 border-3 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 flex items-center gap-2 text-emerald-700 text-sm font-medium">
          <i className="ri-checkbox-circle-fill text-lg"></i>{successMsg}
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-center gap-2 text-red-700 text-sm font-medium">
          <i className="ri-error-warning-fill text-lg"></i>{error}
          <button onClick={() => setError('')} className="ml-auto cursor-pointer"><i className="ri-close-line"></i></button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-gray-900">Centers of Excellence</h3>
          <p className="text-sm text-gray-500 mt-0.5">
            {groups.filter(g => g.is_active).length} active group{groups.filter(g => g.is_active).length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => { cancelForm(); setShowCreateForm(true); }}
          className="px-4 py-2.5 rounded-lg bg-gradient-to-r from-teal-500 to-emerald-500 text-white text-sm font-semibold hover:from-teal-600 hover:to-emerald-600 transition-all flex items-center gap-2 cursor-pointer">
          <i className="ri-add-line"></i>Create COE Group
        </button>
      </div>

      {/* Create/Edit Form */}
      {showCreateForm && (
        <div className="bg-gray-50 rounded-xl border border-gray-200 p-6">
          <h4 className="text-sm font-bold text-gray-900 mb-4">{editingGroup ? 'Edit COE Group' : 'New COE Group'}</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Group Name *</label>
              <input type="text" placeholder="e.g. AI & Machine Learning" value={formData.name}
                onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Code *</label>
              <input type="text" placeholder="e.g. COE-AI" value={formData.code}
                onChange={e => setFormData(p => ({ ...p, code: e.target.value.toUpperCase() }))}
                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Max Capacity</label>
              <input type="number" min={1} max={500} value={formData.max_capacity}
                onChange={e => setFormData(p => ({ ...p, max_capacity: Number(e.target.value) }))}
                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
            </div>
            <div className="md:col-span-2 lg:col-span-3">
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Description</label>
              <textarea placeholder="Brief description of this COE group" value={formData.description}
                onChange={e => setFormData(p => ({ ...p, description: e.target.value }))} rows={2}
                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Faculty Lead Name</label>
              <input type="text" placeholder="Dr. John Doe" value={formData.faculty_lead_name}
                onChange={e => setFormData(p => ({ ...p, faculty_lead_name: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Faculty Lead Email</label>
              <input type="email" placeholder="john@college.edu" value={formData.faculty_lead_email}
                onChange={e => setFormData(p => ({ ...p, faculty_lead_email: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
            </div>
          </div>
          <div className="flex items-center gap-3 mt-4">
            <button onClick={editingGroup ? handleUpdate : handleCreate}
              className="px-5 py-2.5 rounded-lg bg-teal-600 text-white text-sm font-semibold hover:bg-teal-700 transition-colors cursor-pointer">
              {editingGroup ? 'Update' : 'Create'}
            </button>
            <button onClick={cancelForm}
              className="px-5 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* COE Group Cards */}
      {groups.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <i className="ri-lightbulb-line text-2xl text-gray-400"></i>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No COE Groups</h3>
          <p className="text-sm text-gray-500">Create Centers of Excellence to group students by focus areas.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {groups.map(group => (
            <div key={group.id} className={`bg-white rounded-xl border transition-all ${expandedGroup === group.id ? 'border-teal-200 shadow-md lg:col-span-2' : 'border-gray-100 hover:border-gray-200'}`}>
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center shrink-0">
                      <i className="ri-lightbulb-flash-fill text-white text-lg"></i>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-gray-900">{group.name}</h4>
                        {!group.is_active && (
                          <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-600 text-xs font-medium">Inactive</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500">{group.code}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => startEdit(group)} className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-gray-100 text-gray-400 hover:text-teal-600 transition-colors cursor-pointer">
                      <i className="ri-pencil-line text-sm"></i>
                    </button>
                    <button onClick={() => toggleExpand(group.id)} className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-gray-100 text-gray-400 hover:text-teal-600 transition-colors cursor-pointer">
                      <i className={`ri-${expandedGroup === group.id ? 'arrow-up' : 'arrow-down'}-s-line text-sm`}></i>
                    </button>
                  </div>
                </div>

                {group.description && (
                  <p className="text-xs text-gray-500 mb-3 line-clamp-2">{group.description}</p>
                )}

                {/* Stats Row */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-gray-50 rounded-lg p-2.5 text-center">
                    <p className="text-lg font-bold text-gray-900">{group.active_count ?? 0}</p>
                    <p className="text-[10px] text-gray-500 font-medium">Members</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-2.5 text-center">
                    <p className="text-lg font-bold text-gray-900">{group.avg_cgpa?.toFixed(1) ?? '—'}</p>
                    <p className="text-[10px] text-gray-500 font-medium">Avg CGPA</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-2.5 text-center">
                    <p className="text-lg font-bold text-gray-900">{group.avg_resume_score?.toFixed(0) ?? '—'}</p>
                    <p className="text-[10px] text-gray-500 font-medium">Avg Resume</p>
                  </div>
                </div>

                {group.faculty_lead_name && (
                  <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
                    <i className="ri-user-star-line text-purple-500"></i>
                    <span>Lead: {group.faculty_lead_name}</span>
                  </div>
                )}

                {group.focus_skills?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {group.focus_skills.slice(0, 5).map(skill => (
                      <span key={skill} className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 text-[10px] font-medium">{skill}</span>
                    ))}
                    {group.focus_skills.length > 5 && (
                      <span className="text-[10px] text-gray-400">+{group.focus_skills.length - 5}</span>
                    )}
                  </div>
                )}
              </div>

              {/* Expanded Members View */}
              {expandedGroup === group.id && (
                <div className="border-t border-gray-100 p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h5 className="text-sm font-bold text-gray-900">Members ({members[group.id]?.length ?? 0})</h5>
                    <button
                      onClick={() => setShowAddMembers(showAddMembers === group.id ? null : group.id)}
                      className="px-3 py-1.5 rounded-lg bg-teal-50 text-teal-700 text-xs font-semibold hover:bg-teal-100 transition-colors cursor-pointer flex items-center gap-1">
                      <i className="ri-user-add-line text-sm"></i>Add Members
                    </button>
                  </div>

                  {/* Add Members Panel */}
                  {showAddMembers === group.id && (
                    <div className="mb-4 bg-gray-50 rounded-lg p-4 border border-gray-100">
                      <input
                        type="text" placeholder="Search students by name or email..."
                        value={memberSearch} onChange={e => setMemberSearch(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                      <div className="max-h-40 overflow-y-auto space-y-1">
                        {getAvailableStudents(group.id).slice(0, 20).map(s => (
                          <button key={s.id}
                            onClick={() => handleAddMembers(group.id, [s.id])}
                            className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-white text-left text-sm cursor-pointer transition-colors">
                            <span className="text-gray-700 truncate">{s.full_name || s.name || s.email}</span>
                            <i className="ri-add-circle-line text-teal-600 shrink-0"></i>
                          </button>
                        ))}
                        {getAvailableStudents(group.id).length === 0 && (
                          <p className="text-xs text-gray-400 text-center py-3">No matching students found</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Members List */}
                  {loadingMembers === group.id ? (
                    <div className="flex items-center justify-center py-6">
                      <div className="w-6 h-6 border-2 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  ) : members[group.id]?.length > 0 ? (
                    <div className="space-y-2">
                      {members[group.id].map(m => (
                        <div key={m.student_id} className="flex items-center justify-between px-4 py-3 bg-white rounded-lg border border-gray-100">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-indigo-400 flex items-center justify-center text-white text-xs font-bold shrink-0">
                              {(m.student_name || m.student_email[0]).charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">{m.student_name || m.student_email}</p>
                              <div className="flex items-center gap-3 text-xs text-gray-500">
                                <span>{m.role}</span>
                                {m.cgpa && <span>CGPA: {m.cgpa}</span>}
                                {m.resume_score && <span>Resume: {m.resume_score}%</span>}
                              </div>
                            </div>
                          </div>
                          <button onClick={() => handleRemoveMember(group.id, m.student_id)}
                            className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors cursor-pointer shrink-0">
                            <i className="ri-close-line text-sm"></i>
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400 text-center py-6">No members yet. Add students to this group.</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

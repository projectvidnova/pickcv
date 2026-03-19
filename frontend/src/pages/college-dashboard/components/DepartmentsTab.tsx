import { useState, useEffect, Fragment } from 'react';
import { apiService } from '../../../services/api';

interface Department {
  id: number;
  name: string;
  code: string;
  degree_type: string;
  duration_semesters: number;
  is_active: boolean;
  student_count?: number;
  created_at: string;
}

interface Course {
  id: number;
  course_name: string;
  course_code: string;
  semester_number: number;
  credits: number;
  course_type: string;
  mapped_skills: string[];
}

interface SemesterView {
  semester_number: number;
  courses: Course[];
  total_credits: number;
}

interface DepartmentsTabProps {
  onRefresh: () => void;
}

export default function DepartmentsTab({ onRefresh }: DepartmentsTabProps) {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [expandedDept, setExpandedDept] = useState<number | null>(null);
  const [curriculum, setCurriculum] = useState<Record<number, SemesterView[]>>({});
  const [loadingCurriculum, setLoadingCurriculum] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Create form state
  const [formData, setFormData] = useState({
    name: '', code: '', degree_type: 'B.Tech', duration_semesters: 8,
  });

  useEffect(() => { loadDepartments(); }, []);

  const loadDepartments = async () => {
    setIsLoading(true);
    const res = await apiService.getDepartments();
    if (res.success && res.data) setDepartments(res.data);
    setIsLoading(false);
  };

  const loadCurriculum = async (deptId: number) => {
    if (curriculum[deptId]) return;
    setLoadingCurriculum(deptId);
    const res = await apiService.getCurriculum(deptId);
    if (res.success && res.data) {
      setCurriculum(prev => ({ ...prev, [deptId]: res.data.semesters || res.data }));
    }
    setLoadingCurriculum(null);
  };

  const handleCreate = async () => {
    if (!formData.name || !formData.code) {
      setError('Name and code are required');
      return;
    }
    setError('');
    const res = await apiService.createDepartment(formData);
    if (res.success) {
      setShowCreateForm(false);
      setFormData({ name: '', code: '', degree_type: 'B.Tech', duration_semesters: 8 });
      setSuccessMsg('Department created successfully');
      setTimeout(() => setSuccessMsg(''), 3000);
      loadDepartments();
      onRefresh();
    } else {
      setError(res.error || 'Failed to create department');
    }
  };

  const handleUpdate = async () => {
    if (!editingDept) return;
    const res = await apiService.updateDepartment(editingDept.id, formData);
    if (res.success) {
      setEditingDept(null);
      setFormData({ name: '', code: '', degree_type: 'B.Tech', duration_semesters: 8 });
      setSuccessMsg('Department updated successfully');
      setTimeout(() => setSuccessMsg(''), 3000);
      loadDepartments();
    } else {
      setError(res.error || 'Failed to update');
    }
  };

  const handleDelete = async (dept: Department) => {
    if (!confirm(`Deactivate "${dept.name}"? Students won't be affected.`)) return;
    const res = await apiService.deleteDepartment(dept.id);
    if (res.success) {
      setSuccessMsg('Department deactivated');
      setTimeout(() => setSuccessMsg(''), 3000);
      loadDepartments();
      onRefresh();
    }
  };

  const toggleExpand = (deptId: number) => {
    if (expandedDept === deptId) {
      setExpandedDept(null);
    } else {
      setExpandedDept(deptId);
      loadCurriculum(deptId);
    }
  };

  const startEdit = (dept: Department) => {
    setEditingDept(dept);
    setFormData({
      name: dept.name, code: dept.code, degree_type: dept.degree_type,
      duration_semesters: dept.duration_semesters,
    });
    setShowCreateForm(true);
  };

  const cancelForm = () => {
    setShowCreateForm(false);
    setEditingDept(null);
    setFormData({ name: '', code: '', degree_type: 'B.Tech', duration_semesters: 8 });
    setError('');
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
      {/* Success/Error Messages */}
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
          <h3 className="text-lg font-bold text-gray-900">Departments</h3>
          <p className="text-sm text-gray-500 mt-0.5">{departments.length} department{departments.length !== 1 ? 's' : ''} configured</p>
        </div>
        <button
          onClick={() => { cancelForm(); setShowCreateForm(true); }}
          className="px-4 py-2.5 rounded-lg bg-gradient-to-r from-teal-500 to-emerald-500 text-white text-sm font-semibold hover:from-teal-600 hover:to-emerald-600 transition-all flex items-center gap-2 cursor-pointer">
          <i className="ri-add-line"></i>Add Department
        </button>
      </div>

      {/* Create/Edit Form */}
      {showCreateForm && (
        <div className="bg-gray-50 rounded-xl border border-gray-200 p-6">
          <h4 className="text-sm font-bold text-gray-900 mb-4">
            {editingDept ? 'Edit Department' : 'New Department'}
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Department Name *</label>
              <input
                type="text" placeholder="e.g. Computer Science"
                value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Code *</label>
              <input
                type="text" placeholder="e.g. CSE"
                value={formData.code} onChange={e => setFormData(p => ({ ...p, code: e.target.value.toUpperCase() }))}
                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Degree Type</label>
              <select
                value={formData.degree_type} onChange={e => setFormData(p => ({ ...p, degree_type: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer">
                <option value="B.Tech">B.Tech</option>
                <option value="B.E.">B.E.</option>
                <option value="M.Tech">M.Tech</option>
                <option value="MBA">MBA</option>
                <option value="BCA">BCA</option>
                <option value="MCA">MCA</option>
                <option value="B.Sc">B.Sc</option>
                <option value="M.Sc">M.Sc</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Duration (semesters)</label>
              <input
                type="number" min={1} max={12}
                value={formData.duration_semesters} onChange={e => setFormData(p => ({ ...p, duration_semesters: Number(e.target.value) }))}
                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>
          <div className="flex items-center gap-3 mt-4">
            <button
              onClick={editingDept ? handleUpdate : handleCreate}
              className="px-5 py-2.5 rounded-lg bg-teal-600 text-white text-sm font-semibold hover:bg-teal-700 transition-colors cursor-pointer">
              {editingDept ? 'Update' : 'Create'}
            </button>
            <button onClick={cancelForm} className="px-5 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Department Cards */}
      {departments.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <i className="ri-building-2-line text-2xl text-gray-400"></i>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No departments yet</h3>
          <p className="text-sm text-gray-500 mb-4">Add your first department to organize students and curriculum.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {departments.map(dept => (
            <Fragment key={dept.id}>
              <div className={`bg-white rounded-xl border transition-all ${expandedDept === dept.id ? 'border-teal-200 shadow-sm' : 'border-gray-100 hover:border-gray-200'}`}>
                <div className="px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-11 h-11 rounded-lg bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center shrink-0">
                      <span className="text-white text-xs font-bold">{dept.code}</span>
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-gray-900 truncate">{dept.name}</h4>
                        <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 text-xs font-medium shrink-0">{dept.degree_type}</span>
                        {!dept.is_active && (
                          <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-600 text-xs font-medium shrink-0">Inactive</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {dept.student_count ?? 0} students · {dept.duration_semesters} semesters
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => startEdit(dept)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500 hover:text-teal-600 transition-colors cursor-pointer" title="Edit">
                      <i className="ri-pencil-line text-base"></i>
                    </button>
                    <button onClick={() => handleDelete(dept)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 text-gray-500 hover:text-red-600 transition-colors cursor-pointer" title="Deactivate">
                      <i className="ri-delete-bin-line text-base"></i>
                    </button>
                    <button onClick={() => toggleExpand(dept.id)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500 hover:text-teal-600 transition-colors cursor-pointer" title="View Curriculum">
                      <i className={`ri-${expandedDept === dept.id ? 'arrow-up' : 'arrow-down'}-s-line text-base`}></i>
                    </button>
                  </div>
                </div>

                {/* Curriculum Expanded View */}
                {expandedDept === dept.id && (
                  <div className="px-6 pb-5 border-t border-gray-100 pt-4">
                    {loadingCurriculum === dept.id ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="w-6 h-6 border-2 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    ) : curriculum[dept.id] && curriculum[dept.id].length > 0 ? (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h5 className="text-sm font-bold text-gray-900">Curriculum Overview</h5>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {curriculum[dept.id].map(sem => (
                            <div key={sem.semester_number} className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                              <div className="flex items-center justify-between mb-3">
                                <h6 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                                  Semester {sem.semester_number}
                                </h6>
                                <span className="text-xs text-gray-500">{sem.total_credits} credits</span>
                              </div>
                              <div className="space-y-2">
                                {sem.courses.map(c => (
                                  <div key={c.id} className="flex items-start justify-between gap-2">
                                    <div className="min-w-0">
                                      <p className="text-xs font-medium text-gray-800 truncate">{c.course_name}</p>
                                      {c.mapped_skills?.length > 0 && (
                                        <div className="flex flex-wrap gap-1 mt-1">
                                          {c.mapped_skills.slice(0, 3).map(s => (
                                            <span key={s} className="px-1.5 py-0.5 rounded bg-teal-50 text-teal-700 text-[10px] font-medium">{s}</span>
                                          ))}
                                          {c.mapped_skills.length > 3 && (
                                            <span className="text-[10px] text-gray-400">+{c.mapped_skills.length - 3}</span>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                    <span className="text-[10px] text-gray-400 shrink-0">{c.credits}cr</span>
                                  </div>
                                ))}
                                {sem.courses.length === 0 && (
                                  <p className="text-xs text-gray-400 italic">No courses added</p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-sm text-gray-400">No curriculum data yet. Add courses to this department.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </Fragment>
          ))}
        </div>
      )}
    </div>
  );
}

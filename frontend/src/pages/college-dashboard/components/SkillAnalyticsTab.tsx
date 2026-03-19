import { useState, useEffect } from 'react';
import { apiService } from '../../../services/api';

interface HeatmapItem {
  skill_name: string;
  category: string;
  student_count: number;
  avg_proficiency: number;
  beginner_count: number;
  intermediate_count: number;
  advanced_count: number;
  expert_count: number;
}

interface SkillGap {
  skill_name: string;
  category: string;
  curriculum_courses: number;
  students_with_skill: number;
  total_students: number;
  coverage_pct: number;
  gap_severity: string;
}

interface AnalyticsData {
  total_unique_skills: number;
  total_skill_records: number;
  demand_alignment_pct: number;
  heatmap: HeatmapItem[];
  gaps: SkillGap[];
  department_distribution: Record<string, any[]>;
}

interface Department {
  id: number;
  name: string;
  code: string;
}

interface SkillAnalyticsTabProps {
  departments: Department[];
}

export default function SkillAnalyticsTab({ departments }: SkillAnalyticsTabProps) {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDept, setSelectedDept] = useState<number | undefined>(undefined);
  const [activeView, setActiveView] = useState<'heatmap' | 'gaps'>('heatmap');

  useEffect(() => { loadAnalytics(); }, [selectedDept]);

  const loadAnalytics = async () => {
    setIsLoading(true);
    const res = await apiService.getSkillAnalytics(selectedDept);
    if (res.success && res.data) setAnalytics(res.data);
    setIsLoading(false);
  };

  const getProficiencyColor = (level: number) => {
    if (level >= 4) return 'bg-emerald-500';
    if (level >= 3) return 'bg-teal-400';
    if (level >= 2) return 'bg-amber-400';
    return 'bg-gray-300';
  };

  const getGapSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-700 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'medium': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'low': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      default: return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  const getBarWidth = (count: number, maxCount: number) => {
    if (maxCount === 0) return '0%';
    return `${Math.round((count / maxCount) * 100)}%`;
  };

  // Group heatmap by category
  const groupedHeatmap = (analytics?.heatmap || []).reduce<Record<string, HeatmapItem[]>>((acc, item) => {
    const cat = item.category || 'Other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  const maxStudentCount = Math.max(...(analytics?.heatmap || []).map(h => h.student_count), 1);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-8 h-8 border-3 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-16">
        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
          <i className="ri-bar-chart-box-line text-2xl text-gray-400"></i>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Analytics Data</h3>
        <p className="text-sm text-gray-500">Skill analytics will appear once students have skills recorded.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-5 border border-purple-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-purple-600 flex items-center justify-center">
              <i className="ri-code-box-line text-white text-lg"></i>
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{analytics.total_unique_skills}</p>
          <p className="text-sm text-gray-600">Unique Skills Tracked</p>
        </div>

        <div className="bg-gradient-to-br from-teal-50 to-emerald-50 rounded-xl p-5 border border-teal-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-teal-600 flex items-center justify-center">
              <i className="ri-database-2-line text-white text-lg"></i>
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{analytics.total_skill_records.toLocaleString()}</p>
          <p className="text-sm text-gray-600">Skill Records</p>
        </div>

        <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-5 border border-amber-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-amber-600 flex items-center justify-center">
              <i className="ri-line-chart-line text-white text-lg"></i>
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{analytics.demand_alignment_pct}%</p>
          <p className="text-sm text-gray-600">Industry Demand Alignment</p>
        </div>
      </div>

      {/* Filters & View Toggle */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveView('heatmap')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${activeView === 'heatmap' ? 'bg-teal-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
            <i className="ri-grid-line mr-1.5"></i>Skill Heatmap
          </button>
          <button
            onClick={() => setActiveView('gaps')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${activeView === 'gaps' ? 'bg-teal-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
            <i className="ri-contrast-line mr-1.5"></i>Skill Gaps
          </button>
        </div>
        <select
          value={selectedDept ?? ''}
          onChange={e => setSelectedDept(e.target.value ? Number(e.target.value) : undefined)}
          className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer">
          <option value="">All Departments</option>
          {departments.map(d => (
            <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
          ))}
        </select>
      </div>

      {/* Heatmap View */}
      {activeView === 'heatmap' && (
        <div className="space-y-6">
          {Object.keys(groupedHeatmap).length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
              <p className="text-sm text-gray-400">No skill data available yet.</p>
            </div>
          ) : (
            Object.entries(groupedHeatmap)
              .sort(([, a], [, b]) => b.reduce((s, i) => s + i.student_count, 0) - a.reduce((s, i) => s + i.student_count, 0))
              .map(([category, skills]) => (
                <div key={category} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                  <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
                    <h4 className="text-sm font-bold text-gray-900">{category}</h4>
                    <p className="text-xs text-gray-500">{skills.length} skill{skills.length !== 1 ? 's' : ''}</p>
                  </div>
                  <div className="p-5 space-y-3">
                    {skills
                      .sort((a, b) => b.student_count - a.student_count)
                      .map(skill => (
                        <div key={skill.skill_name} className="flex items-center gap-4">
                          <div className="w-40 shrink-0">
                            <p className="text-sm font-medium text-gray-800 truncate">{skill.skill_name}</p>
                          </div>
                          <div className="flex-1 flex items-center gap-3">
                            {/* Bar */}
                            <div className="flex-1 h-6 bg-gray-100 rounded-md overflow-hidden flex">
                              <div className="bg-emerald-400 h-full transition-all" style={{ width: getBarWidth(skill.expert_count, maxStudentCount) }} title={`Expert: ${skill.expert_count}`}></div>
                              <div className="bg-teal-400 h-full transition-all" style={{ width: getBarWidth(skill.advanced_count, maxStudentCount) }} title={`Advanced: ${skill.advanced_count}`}></div>
                              <div className="bg-amber-300 h-full transition-all" style={{ width: getBarWidth(skill.intermediate_count, maxStudentCount) }} title={`Intermediate: ${skill.intermediate_count}`}></div>
                              <div className="bg-gray-300 h-full transition-all" style={{ width: getBarWidth(skill.beginner_count, maxStudentCount) }} title={`Beginner: ${skill.beginner_count}`}></div>
                            </div>
                            <div className="shrink-0 w-20 text-right">
                              <span className="text-xs font-semibold text-gray-700">{skill.student_count}</span>
                              <span className="text-xs text-gray-400 ml-1">students</span>
                            </div>
                          </div>
                          {/* Proficiency dot */}
                          <div className="shrink-0" title={`Avg proficiency: ${skill.avg_proficiency.toFixed(1)}/5`}>
                            <div className={`w-3 h-3 rounded-full ${getProficiencyColor(skill.avg_proficiency)}`}></div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              ))
          )}

          {/* Legend */}
          {Object.keys(groupedHeatmap).length > 0 && (
            <div className="flex items-center justify-center gap-6 text-xs text-gray-500">
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-emerald-400 inline-block"></span>Expert</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-teal-400 inline-block"></span>Advanced</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-amber-300 inline-block"></span>Intermediate</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-gray-300 inline-block"></span>Beginner</span>
            </div>
          )}
        </div>
      )}

      {/* Gaps View */}
      {activeView === 'gaps' && (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          {(analytics.gaps || []).length === 0 ? (
            <div className="text-center py-12">
              <p className="text-sm text-gray-400">No skill gap data available. Add curriculum courses with skill mappings to see gaps.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Skill</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Category</th>
                    <th className="px-5 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">In Curriculum</th>
                    <th className="px-5 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Students</th>
                    <th className="px-5 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Coverage</th>
                    <th className="px-5 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Severity</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {analytics.gaps
                    .sort((a, b) => {
                      const sev = { critical: 0, high: 1, medium: 2, low: 3 };
                      return (sev[a.gap_severity as keyof typeof sev] ?? 4) - (sev[b.gap_severity as keyof typeof sev] ?? 4);
                    })
                    .map(gap => (
                      <tr key={gap.skill_name} className="hover:bg-gray-50 transition-colors">
                        <td className="px-5 py-3 text-sm font-medium text-gray-900">{gap.skill_name}</td>
                        <td className="px-5 py-3 text-sm text-gray-600">{gap.category}</td>
                        <td className="px-5 py-3 text-center">
                          <span className="text-sm font-medium text-gray-700">{gap.curriculum_courses}</span>
                          <span className="text-xs text-gray-400 ml-1">courses</span>
                        </td>
                        <td className="px-5 py-3 text-center">
                          <span className="text-sm font-medium text-gray-700">{gap.students_with_skill}</span>
                          <span className="text-xs text-gray-400 ml-1">/ {gap.total_students}</span>
                        </td>
                        <td className="px-5 py-3 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <div className="w-16 h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${gap.coverage_pct >= 70 ? 'bg-emerald-500' : gap.coverage_pct >= 40 ? 'bg-amber-400' : 'bg-red-400'}`}
                                style={{ width: `${gap.coverage_pct}%` }}
                              ></div>
                            </div>
                            <span className="text-xs font-medium text-gray-700">{gap.coverage_pct}%</span>
                          </div>
                        </td>
                        <td className="px-5 py-3 text-center">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getGapSeverityBadge(gap.gap_severity)}`}>
                            {gap.gap_severity}
                          </span>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

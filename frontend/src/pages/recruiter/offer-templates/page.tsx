import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { recruiterApi, OfferTemplate } from '../../../services/recruiterService';

export default function OfferTemplatesPage() {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<OfferTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const [editing, setEditing] = useState<OfferTemplate | null>(null);
  const [form, setForm] = useState({ name: '', content: '', variables: '', is_default: false });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    if (!recruiterApi.isLoggedIn()) { navigate('/login'); return; }
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    try { setTemplates(await recruiterApi.listOfferTemplates()); }
    catch { navigate('/login'); }
    setLoading(false);
  };

  const openNew = () => {
    setEditing(null);
    setForm({
      name: '',
      content: `Dear {{candidate_name}},\n\nWe are pleased to offer you the position of {{job_title}} at {{company_name}}.\n\n**Start Date:** {{start_date}}\n**Salary:** {{salary}}\n**Location:** {{location}}\n\nWe believe you will be a valuable addition to our team.\n\nPlease confirm your acceptance by signing below.\n\nBest regards,\n{{recruiter_name}}\n{{company_name}}`,
      variables: 'candidate_name, job_title, company_name, start_date, salary, location, recruiter_name',
      is_default: false,
    });
    setShowEditor(true);
  };

  const openEdit = (tpl: OfferTemplate) => {
    setEditing(tpl);
    setForm({ name: tpl.name, content: tpl.content, variables: tpl.variables.join(', '), is_default: tpl.is_default });
    setShowEditor(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.content) { setError('Name and content are required'); return; }
    setError('');
    setSaving(true);
    const vars = form.variables.split(',').map(v => v.trim()).filter(Boolean);
    try {
      if (editing) {
        await recruiterApi.updateOfferTemplate(editing.id, { name: form.name, content: form.content, variables: vars, is_default: form.is_default });
      } else {
        await recruiterApi.createOfferTemplate({ name: form.name, content: form.content, variables: vars, is_default: form.is_default });
      }
      setShowEditor(false);
      load();
    } catch (err: any) { setError(err.message); }
    setSaving(false);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this template?')) return;
    try { await recruiterApi.deleteOfferTemplate(id); load(); }
    catch (err: any) { alert(err.message); }
  };

  return (
    <div className="min-h-screen bg-gray-900">
      <nav className="border-b border-gray-800 bg-gray-900/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
              <i className="ri-building-2-fill text-white text-sm" />
            </div>
            <span className="text-lg font-bold text-white">PickCV Recruiter</span>
          </Link>
          <div className="flex items-center gap-6">
            <Link to="/dashboard" className="text-gray-400 hover:text-white text-sm">Dashboard</Link>
            <Link to="/jobs" className="text-gray-400 hover:text-white text-sm">Jobs</Link>
            <Link to="/offer-templates" className="text-white text-sm font-medium">Templates</Link>
            <Link to="/offers" className="text-gray-400 hover:text-white text-sm">Offers</Link>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Offer Templates</h1>
            <p className="text-gray-400 text-sm mt-1">Create reusable offer letter templates with {'{{variables}}'}</p>
          </div>
          <button onClick={openNew}
            className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-sm font-medium rounded-xl hover:from-emerald-600 hover:to-teal-600 transition-all">
            <i className="ri-add-line mr-1" /> New Template
          </button>
        </div>

        {loading ? (
          <div className="text-center py-20"><i className="ri-loader-4-line animate-spin text-blue-400 text-2xl" /></div>
        ) : templates.length === 0 ? (
          <div className="text-center py-20 bg-gray-800/30 rounded-2xl border border-gray-700/50">
            <i className="ri-draft-line text-gray-600 text-5xl mb-4" />
            <p className="text-gray-400 mb-4">No templates yet</p>
            <button onClick={openNew}
              className="px-6 py-2.5 bg-emerald-500 text-white text-sm rounded-xl hover:bg-emerald-600">Create Your First Template</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {templates.map(tpl => (
              <div key={tpl.id} className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-5 hover:border-gray-600 transition-all">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-white font-semibold flex items-center gap-2">
                      {tpl.name}
                      {tpl.is_default && <span className="px-2 py-0.5 text-[10px] bg-emerald-500/20 text-emerald-400 rounded-full">Default</span>}
                    </h3>
                    <p className="text-gray-500 text-xs mt-1">{tpl.variables.length} variables</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setPreview(tpl.content)} className="text-gray-400 hover:text-white text-sm" title="Preview"><i className="ri-eye-line" /></button>
                    <button onClick={() => openEdit(tpl)} className="text-gray-400 hover:text-white text-sm" title="Edit"><i className="ri-pencil-line" /></button>
                    <button onClick={() => handleDelete(tpl.id)} className="text-red-400 hover:text-red-300 text-sm" title="Delete"><i className="ri-delete-bin-line" /></button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {tpl.variables.map(v => (
                    <span key={v} className="px-2 py-0.5 text-[10px] bg-blue-500/10 text-blue-400 rounded-full border border-blue-500/20">{`{{${v}}}`}</span>
                  ))}
                </div>
                <p className="text-gray-500 text-xs mt-3 line-clamp-2">{tpl.content.substring(0, 150)}...</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Template Editor Modal */}
      {showEditor && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-800 border border-gray-700 rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-white">{editing ? 'Edit Template' : 'New Template'}</h2>
              <button onClick={() => setShowEditor(false)} className="text-gray-400 hover:text-white"><i className="ri-close-line text-xl" /></button>
            </div>
            {error && <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-4"><p className="text-red-300 text-sm">{error}</p></div>}
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-300 mb-1">Template Name *</label>
                <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl text-white text-sm" placeholder="Standard Offer Letter" required />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Variables (comma-separated)</label>
                <input type="text" value={form.variables} onChange={e => setForm({ ...form, variables: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl text-white text-sm"
                  placeholder="candidate_name, job_title, salary, start_date" />
                <p className="text-gray-500 text-xs mt-1">Use {'{{variable_name}}'} in content to insert values</p>
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Template Content *</label>
                <textarea value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} rows={12}
                  className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl text-white text-sm font-mono" required />
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                <input type="checkbox" checked={form.is_default} onChange={e => setForm({ ...form, is_default: e.target.checked })}
                  className="rounded border-gray-600 bg-gray-700 text-blue-500" />
                Set as default template
              </label>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowEditor(false)} className="flex-1 py-2.5 border border-gray-600 text-gray-300 rounded-xl">Cancel</button>
                <button type="submit" disabled={saving}
                  className="flex-1 py-2.5 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 disabled:opacity-50">
                  {saving ? 'Saving...' : 'Save Template'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {preview !== null && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-800">Template Preview</h2>
              <button onClick={() => setPreview(null)} className="text-gray-400 hover:text-gray-600"><i className="ri-close-line text-xl" /></button>
            </div>
            <div className="prose prose-sm max-w-none whitespace-pre-wrap text-gray-700">{preview}</div>
          </div>
        </div>
      )}
    </div>
  );
}

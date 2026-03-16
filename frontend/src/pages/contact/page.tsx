import { useState, FormEvent } from 'react';
import Navbar from '../../components/feature/Navbar';
import Footer from '../../components/feature/Footer';

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setStatus('sending');
    try {
      // Send to backend contact endpoint
      const res = await fetch(`${import.meta.env.VITE_API_URL}/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setStatus('sent');
        setForm({ name: '', email: '', subject: '', message: '' });
      } else {
        // Fallback: open mailto
        window.location.href = `mailto:connect@pickcv.com?subject=${encodeURIComponent(form.subject)}&body=${encodeURIComponent(`Name: ${form.name}\nEmail: ${form.email}\n\n${form.message}`)}`;
        setStatus('sent');
      }
    } catch {
      // Fallback: open mailto
      window.location.href = `mailto:connect@pickcv.com?subject=${encodeURIComponent(form.subject)}&body=${encodeURIComponent(`Name: ${form.name}\nEmail: ${form.email}\n\n${form.message}`)}`;
      setStatus('sent');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-teal-50/30">
      <Navbar />

      {/* Hero */}
      <section className="pt-32 pb-8 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-teal-50 border border-teal-100 text-teal-700 text-xs font-semibold mb-6">
            <i className="ri-chat-smile-3-line" />
            Get in Touch
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight mb-6">
            We'd Love to<br />
            <span className="bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent">
              Hear From You
            </span>
          </h1>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto leading-relaxed">
            Have a question, feedback, or partnership inquiry? Drop us a message and we'll get back to you quickly.
          </p>
        </div>
      </section>

      {/* Contact Form + Info */}
      <section className="py-12 px-4">
        <div className="max-w-5xl mx-auto grid lg:grid-cols-5 gap-8">
          {/* Form */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
              {status === 'sent' ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                    <i className="ri-check-line text-3xl text-emerald-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Message Sent!</h3>
                  <p className="text-gray-500 mb-6">Thank you for reaching out. We'll get back to you soon.</p>
                  <button
                    onClick={() => setStatus('idle')}
                    className="text-sm text-teal-600 font-semibold hover:underline"
                  >
                    Send another message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Name</label>
                      <input
                        type="text"
                        required
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        placeholder="Your full name"
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50/50 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Email</label>
                      <input
                        type="email"
                        required
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        placeholder="you@example.com"
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50/50 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent transition-all"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Subject</label>
                    <input
                      type="text"
                      required
                      value={form.subject}
                      onChange={(e) => setForm({ ...form, subject: e.target.value })}
                      placeholder="What's this about?"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50/50 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Message</label>
                    <textarea
                      required
                      rows={5}
                      value={form.message}
                      onChange={(e) => setForm({ ...form, message: e.target.value })}
                      placeholder="Tell us what's on your mind..."
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50/50 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent transition-all resize-none"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={status === 'sending'}
                    className="w-full sm:w-auto px-8 py-3 rounded-full bg-gradient-to-r from-teal-500 to-emerald-600 text-white text-sm font-semibold hover:from-teal-600 hover:to-emerald-700 transition-all shadow-lg shadow-teal-500/25 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {status === 'sending' ? (
                      <>
                        <i className="ri-loader-4-line animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <i className="ri-send-plane-2-line" />
                        Send Message
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Info sidebar */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-sm font-bold text-gray-700 mb-4">Quick Reach</h3>
              <div className="space-y-4">
                <a href="mailto:connect@pickcv.com" className="flex items-center gap-3 group">
                  <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center group-hover:bg-teal-100 transition-colors">
                    <i className="ri-mail-line text-teal-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-medium">Email</p>
                    <p className="text-sm text-gray-700 font-semibold group-hover:text-teal-700 transition-colors">connect@pickcv.com</p>
                  </div>
                </a>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center flex-shrink-0">
                    <i className="ri-map-pin-line text-teal-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-medium">Office</p>
                    <p className="text-sm text-gray-700 font-semibold">Bhoomer Digital Solutions Pvt. Ltd.</p>
                    <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">
                      9-1-1/4, Oppelim School,<br />
                      Amalapuram, Andhra Pradesh,<br />
                      India, 533201
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-teal-500 to-emerald-600 rounded-3xl p-6 text-white">
              <h3 className="text-sm font-bold mb-2">Response Time</h3>
              <p className="text-sm text-white/80 leading-relaxed">
                We typically respond within <span className="font-bold text-white">24 hours</span> on business days. For urgent matters, email us directly.
              </p>
            </div>

            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-sm font-bold text-gray-700 mb-3">Follow Us</h3>
              <div className="flex items-center gap-3">
                <a href="#" className="w-10 h-10 rounded-full bg-teal-50 flex items-center justify-center hover:bg-teal-100 transition-colors text-teal-600">
                  <i className="ri-linkedin-fill text-lg" />
                </a>
                <a href="#" className="w-10 h-10 rounded-full bg-teal-50 flex items-center justify-center hover:bg-teal-100 transition-colors text-teal-600">
                  <i className="ri-twitter-x-fill text-lg" />
                </a>
                <a href="#" className="w-10 h-10 rounded-full bg-teal-50 flex items-center justify-center hover:bg-teal-100 transition-colors text-teal-600">
                  <i className="ri-instagram-fill text-lg" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

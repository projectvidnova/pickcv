const footerLinks = {
  product: [
    { label: 'ATS Optimizer', href: '#how-it-works' },
    { label: 'Resume Builder', href: '/resume-builder' },
    { label: 'Job Matching', href: '/jobs' },
    { label: 'Pricing', href: '#pricing' },
  ],
  company: [
    { label: 'About Us', href: '/about' },
    { label: 'Careers', href: '/careers' },
    { label: 'Contact Support', href: '/contact' },
  ],
  legal: [
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Terms of Service', href: '/terms' },
  ],
};

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="relative py-16 px-4 sm:px-6 lg:px-8 border-t border-gray-200/60">
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-4 gap-10 mb-12">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center text-white text-sm font-bold shadow-lg shadow-teal-500/30">
                P
              </div>
              <span className="text-xl font-bold text-gray-900">PickCV</span>
            </div>
            <p className="text-sm text-gray-500 leading-relaxed mb-5">
              AI-powered resume optimization that gets you past ATS and into interviews.
            </p>

            {/* Trust line */}
            <div className="flex items-center gap-2 text-xs text-gray-400 mb-5">
              <i className="ri-shield-check-fill text-teal-500"></i>
              DPDP compliant. Your data stays private.
            </div>

            {/* Social */}
            <div className="flex items-center gap-3">
              <a
                href="https://wa.me/919999999999"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-lg bg-gray-100 hover:bg-green-50 flex items-center justify-center text-gray-500 hover:text-green-600 transition-colors"
                aria-label="WhatsApp"
              >
                <i className="ri-whatsapp-fill text-lg"></i>
              </a>
              <a
                href="https://instagram.com/pickcv"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-lg bg-gray-100 hover:bg-pink-50 flex items-center justify-center text-gray-500 hover:text-pink-600 transition-colors"
                aria-label="Instagram"
              >
                <i className="ri-instagram-fill text-lg"></i>
              </a>
              <a
                href="https://linkedin.com/company/pickcv"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-lg bg-gray-100 hover:bg-blue-50 flex items-center justify-center text-gray-500 hover:text-blue-600 transition-colors"
                aria-label="LinkedIn"
              >
                <i className="ri-linkedin-box-fill text-lg"></i>
              </a>
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wider">Product</h4>
            <ul className="space-y-3">
              {footerLinks.product.map((link) => (
                <li key={link.label}>
                  <a href={link.href} className="text-sm text-gray-500 hover:text-teal-600 transition-colors">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wider">Company</h4>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.label}>
                  <a href={link.href} className="text-sm text-gray-500 hover:text-teal-600 transition-colors">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wider">Legal</h4>
            <ul className="space-y-3">
              {footerLinks.legal.map((link) => (
                <li key={link.label}>
                  <a href={link.href} className="text-sm text-gray-500 hover:text-teal-600 transition-colors">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-gray-200/60 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-gray-400">
            © {year} PickCV. All rights reserved.
          </p>
          <p className="text-xs text-gray-400">
            Made with <i className="ri-heart-fill text-red-400"></i> in India
          </p>
        </div>
      </div>
    </footer>
  );
}

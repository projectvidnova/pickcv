
export default function Footer() {
  return (
    <footer className="bg-gradient-to-br from-teal-50 via-emerald-50 to-cyan-50 text-gray-700 rounded-t-[32px] mt-12 border-t border-teal-100">
      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 py-16 lg:py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">
          {/* Newsletter */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <img
                src="https://static.readdy.ai/image/118f59b514d655f060b6a8ef60c2b755/e0bd9983c8b60cb1b82cd43c64b6d0bd.png"
                alt="PickCV"
                className="h-24 w-auto"
              />
            </div>
            <p className="text-gray-500 text-sm mb-6">
              Build smarter. Apply faster. Get hired.
            </p>
            <form 
              id="newsletter-form"
              data-readdy-form
              action="https://readdy.ai/api/form/d6e8vsaohb161tfd8um0"
              method="POST"
              className="space-y-3"
            >
              <input
                type="email"
                name="email"
                placeholder="Enter your email"
                required
                className="w-full bg-teal-100/60 border border-teal-200 rounded-2xl px-4 py-3 text-gray-700 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
              />
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-teal-500 to-emerald-600 text-white px-5 py-3 rounded-full text-sm font-medium hover:from-teal-600 hover:to-emerald-700 transition-all shadow-lg shadow-teal-500/25 whitespace-nowrap"
              >
                Get Started <i className="ri-arrow-right-line ml-1"></i>
              </button>
            </form>
          </div>

          {/* Product Links */}
          <div>
            <h4 className="text-xs uppercase tracking-wider text-gray-400 font-semibold mb-4">
              Product
            </h4>
            <ul className="space-y-3">
              <li><a href="#" className="text-gray-500 hover:text-teal-700 text-sm transition-colors">Resume Builder</a></li>
              <li><a href="#" className="text-gray-500 hover:text-teal-700 text-sm transition-colors">Job Search</a></li>
              <li><a href="#" className="text-gray-500 hover:text-teal-700 text-sm transition-colors">ATS Checker</a></li>
              <li><a href="#" className="text-gray-500 hover:text-teal-700 text-sm transition-colors">Templates</a></li>
              <li><a href="#" className="text-gray-500 hover:text-teal-700 text-sm transition-colors">Pricing</a></li>
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h4 className="text-xs uppercase tracking-wider text-gray-400 font-semibold mb-4">
              Company
            </h4>
            <ul className="space-y-3">
              <li><a href="#" className="text-gray-500 hover:text-teal-700 text-sm transition-colors">About Us</a></li>
              <li><a href="#" className="text-gray-500 hover:text-teal-700 text-sm transition-colors">Careers</a></li>
              <li><a href="#" className="text-gray-500 hover:text-teal-700 text-sm transition-colors">Blog</a></li>
              <li><a href="#" className="text-gray-500 hover:text-teal-700 text-sm transition-colors">Contact</a></li>
            </ul>
          </div>

          {/* Connect */}
          <div>
            <h4 className="text-xs uppercase tracking-wider text-gray-400 font-semibold mb-4">
              Connect
            </h4>
            <div className="flex items-center gap-4 mb-6">
              <a href="#" className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center hover:bg-gradient-to-r hover:from-teal-500 hover:to-emerald-600 hover:text-white transition-all text-gray-600">
                <i className="ri-linkedin-fill text-lg"></i>
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center hover:bg-gradient-to-r hover:from-teal-500 hover:to-emerald-600 hover:text-white transition-all text-gray-600">
                <i className="ri-twitter-x-fill text-lg"></i>
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center hover:bg-gradient-to-r hover:from-teal-500 hover:to-emerald-600 hover:text-white transition-all text-gray-600">
                <i className="ri-instagram-fill text-lg"></i>
              </a>
            </div>
            <div className="space-y-2">
              <a href="#" className="block text-gray-400 hover:text-teal-700 text-xs transition-colors">Privacy Policy</a>
              <a href="#" className="block text-gray-400 hover:text-teal-700 text-xs transition-colors">Terms of Service</a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-teal-100 mt-12 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-gray-400 text-sm">
            © 2025 Pick. All rights reserved.
          </p>
          <p className="text-gray-400 text-sm">
            Made with <span className="text-red-400">♥</span> for job seekers
          </p>
          <a href="https://readdy.ai/?ref=logo" target="_blank" rel="noopener noreferrer" className="text-gray-400 text-sm hover:text-teal-700 transition-colors">
            Powered by Readdy
          </a>
        </div>
      </div>
    </footer>
  );
}
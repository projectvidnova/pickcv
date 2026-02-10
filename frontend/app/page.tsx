import Link from 'next/link';
import { Upload, Sparkles, CheckCircle, FileText, TrendingUp } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Sparkles className="w-8 h-8 text-indigo-600" />
              <h1 className="text-2xl font-bold text-gray-900">PickCV</h1>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/login" className="text-gray-600 hover:text-gray-900">
                Sign In
              </Link>
              <Link 
                href="/register" 
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold text-gray-900 mb-6">
            Beat the ATS System
          </h2>
          <p className="text-xl text-gray-600 mb-4">
            Transform your resume and land your dream job in 60 seconds
          </p>
          <p className="text-lg text-indigo-600 font-semibold mb-8">
            75% cheaper than competitors • Powered by AI
          </p>
          
          <Link
            href="/register"
            className="inline-flex items-center gap-2 bg-indigo-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-indigo-700 transition shadow-lg"
          >
            <Upload className="w-6 h-6" />
            Upload Your Resume - Free
          </Link>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white p-8 rounded-xl shadow-lg">
            <FileText className="w-12 h-12 text-indigo-600 mb-4" />
            <h3 className="text-xl font-bold mb-3">ATS Optimization</h3>
            <p className="text-gray-600">
              AI-powered analysis transforms your resume to pass through any ATS system
            </p>
          </div>
          
          <div className="bg-white p-8 rounded-xl shadow-lg">
            <TrendingUp className="w-12 h-12 text-indigo-600 mb-4" />
            <h3 className="text-xl font-bold mb-3">Job Matching</h3>
            <p className="text-gray-600">
              Intelligent matching shows you jobs where you have the highest chance of success
            </p>
          </div>
          
          <div className="bg-white p-8 rounded-xl shadow-lg">
            <Sparkles className="w-12 h-12 text-indigo-600 mb-4" />
            <h3 className="text-xl font-bold mb-3">Skill Gap Analysis</h3>
            <p className="text-gray-600">
              Get personalized recommendations on skills to learn for better job prospects
            </p>
          </div>
        </div>

        {/* How It Works */}
        <div className="bg-white rounded-xl shadow-lg p-12 mb-16">
          <h3 className="text-3xl font-bold text-center mb-12">How It Works</h3>
          
          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                1
              </div>
              <h4 className="font-semibold mb-2">Upload</h4>
              <p className="text-sm text-gray-600">Upload your current resume</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                2
              </div>
              <h4 className="font-semibold mb-2">Analyze</h4>
              <p className="text-sm text-gray-600">AI analyzes ATS compatibility</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                3
              </div>
              <h4 className="font-semibold mb-2">Optimize</h4>
              <p className="text-sm text-gray-600">Get ATS-friendly version</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                4
              </div>
              <h4 className="font-semibold mb-2">Apply</h4>
              <p className="text-sm text-gray-600">Match with perfect jobs</p>
            </div>
          </div>
        </div>

        {/* Benefits */}
        <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl shadow-lg p-12 text-white mb-16">
          <h3 className="text-3xl font-bold text-center mb-8">Why PickCV?</h3>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-6 h-6 flex-shrink-0" />
              <div>
                <h4 className="font-semibold mb-1">2026 ATS Standards</h4>
                <p className="text-indigo-100">Built for modern applicant tracking systems</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <CheckCircle className="w-6 h-6 flex-shrink-0" />
              <div>
                <h4 className="font-semibold mb-1">Instant Results</h4>
                <p className="text-indigo-100">Get optimized resume in 60 seconds</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <CheckCircle className="w-6 h-6 flex-shrink-0" />
              <div>
                <h4 className="font-semibold mb-1">AI-Powered</h4>
                <p className="text-indigo-100">Uses latest Gemini 1.5 Flash for speed and accuracy</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <CheckCircle className="w-6 h-6 flex-shrink-0" />
              <div>
                <h4 className="font-semibold mb-1">Affordable</h4>
                <p className="text-indigo-100">75% cheaper than competitors</p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <h3 className="text-3xl font-bold mb-6">Ready to Land Your Dream Job?</h3>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 bg-indigo-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-indigo-700 transition shadow-lg"
          >
            Start Free Now
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-16 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-gray-600">© 2026 PickCV - AI-Powered Resume Optimization</p>
          <p className="text-sm text-gray-500 mt-2">Beat the ATS. Land the Job.</p>
        </div>
      </footer>
    </div>
  );
}

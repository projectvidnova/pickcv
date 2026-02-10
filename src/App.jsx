import { useState } from 'react'
import { Upload, FileText, Sparkles, CheckCircle } from 'lucide-react'
import './App.css'

function App() {
  const [step, setStep] = useState(1)
  const [resumeFile, setResumeFile] = useState(null)
  const [atsScore, setAtsScore] = useState(null)
  const [analyzing, setAnalyzing] = useState(false)

  const handleFileUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      setResumeFile(file)
      setStep(2)
      
      // Simulate AI analysis
      setAnalyzing(true)
      setTimeout(() => {
        const score = Math.floor(Math.random() * 20) + 75 // Random score 75-95
        setAtsScore(score)
        setAnalyzing(false)
        setStep(3)
      }, 2000)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Sparkles className="w-8 h-8 text-indigo-600" />
              <h1 className="text-2xl font-bold text-gray-900">PickCV</h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">Free Demo</span>
              <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition">
                Sign In
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Beat the ATS System
          </h2>
          <p className="text-xl text-gray-600 mb-2">
            Get your resume optimized in 60 seconds
          </p>
          <p className="text-sm text-indigo-600 font-semibold">
            75% cheaper than competitors • $7.49/month
          </p>
        </div>

        {/* Steps */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          {/* Step 1: Upload */}
          {step === 1 && (
            <div className="text-center">
              <Upload className="w-16 h-16 text-indigo-600 mx-auto mb-4" />
              <h3 className="text-2xl font-bold mb-4">Upload Your Resume</h3>
              <p className="text-gray-600 mb-6">
                PDF, DOC, or DOCX • Maximum 5MB
              </p>
              
              <label className="inline-block">
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <div className="bg-indigo-600 text-white px-8 py-4 rounded-lg cursor-pointer hover:bg-indigo-700 transition inline-flex items-center gap-2">
                  <Upload className="w-5 h-5" />
                  Choose File
                </div>
              </label>

              <div className="mt-8 grid grid-cols-3 gap-4 text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>ATS Optimized</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>AI Powered</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Free Analysis</span>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Analyzing */}
          {step === 2 && analyzing && (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-indigo-600 border-t-transparent mb-4"></div>
              <h3 className="text-2xl font-bold mb-2">Analyzing Your Resume</h3>
              <p className="text-gray-600">AI is checking ATS compatibility...</p>
              <p className="text-sm text-gray-500 mt-4">File: {resumeFile?.name}</p>
            </div>
          )}

          {/* Step 3: Results */}
          {step === 3 && atsScore && (
            <div className="text-center">
              <div className="mb-6">
                <div className="inline-flex items-center justify-center w-32 h-32 rounded-full bg-gradient-to-br from-green-400 to-green-600 text-white text-4xl font-bold mb-4">
                  {atsScore}
                </div>
                <h3 className="text-2xl font-bold mb-2">ATS Score</h3>
                <p className="text-gray-600">
                  {atsScore >= 85 ? 'Excellent!' : 'Good, but can be improved'}
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-6 mb-6 text-left">
                <h4 className="font-semibold mb-3">Analysis Summary:</h4>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>Strong keyword matching detected</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>ATS-friendly formatting identified</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>Clear section headers present</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5">⚠️</span>
                    <span>Consider adding more quantifiable achievements</span>
                  </li>
                </ul>
              </div>

              <div className="flex gap-4 justify-center">
                <button
                  onClick={() => {
                    setStep(1)
                    setResumeFile(null)
                    setAtsScore(null)
                  }}
                  className="px-6 py-3 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  Try Another Resume
                </button>
                <button className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition">
                  Get Full Report - $7.49/mo
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Features */}
        <div className="mt-12 grid md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <FileText className="w-10 h-10 text-indigo-600 mb-3" />
            <h3 className="font-bold mb-2">Resume Optimization</h3>
            <p className="text-sm text-gray-600">
              AI-powered analysis and optimization for ATS systems
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <Sparkles className="w-10 h-10 text-indigo-600 mb-3" />
            <h3 className="font-bold mb-2">Auto-Apply</h3>
            <p className="text-sm text-gray-600">
              Apply to 100+ jobs automatically every month
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <CheckCircle className="w-10 h-10 text-indigo-600 mb-3" />
            <h3 className="font-bold mb-2">Job Matching</h3>
            <p className="text-sm text-gray-600">
              AI matches you with the best job opportunities
            </p>
          </div>
        </div>

        {/* Pricing Preview */}
        <div className="mt-12 bg-white rounded-lg shadow p-8 text-center">
          <h3 className="text-2xl font-bold mb-4">Simple Pricing</h3>
          <div className="flex justify-center gap-6 flex-wrap">
            <div className="border rounded-lg p-6 w-48">
              <p className="text-sm text-gray-600 mb-2">Basic</p>
              <p className="text-3xl font-bold mb-2">$1.99</p>
              <p className="text-sm text-gray-500">One-time</p>
            </div>
            <div className="border-2 border-indigo-600 rounded-lg p-6 w-48 relative">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-indigo-600 text-white text-xs px-3 py-1 rounded-full">
                Popular
              </div>
              <p className="text-sm text-gray-600 mb-2">Pro</p>
              <p className="text-3xl font-bold mb-2">$7.49</p>
              <p className="text-sm text-gray-500">per month</p>
            </div>
            <div className="border rounded-lg p-6 w-48">
              <p className="text-sm text-gray-600 mb-2">Unlimited</p>
              <p className="text-3xl font-bold mb-2">$12.49</p>
              <p className="text-sm text-gray-500">per month</p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white mt-12 py-6 border-t">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-gray-600">
          <p>© 2024 PickCV - AI-Powered Job Search Platform</p>
          <p className="mt-2">75% cheaper than competitors • Production Ready</p>
        </div>
      </footer>
    </div>
  )
}

export default App

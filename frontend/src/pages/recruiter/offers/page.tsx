import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { recruiterApi, Offer } from '../../../services/recruiterService';

export default function OffersPage() {
  const navigate = useNavigate();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!recruiterApi.isLoggedIn()) { navigate('/login'); return; }
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    try { setOffers(await recruiterApi.listOffers()); }
    catch { navigate('/login'); }
    setLoading(false);
  };

  const statusColors: Record<string, string> = {
    released: 'bg-blue-500/10 text-blue-400',
    accepted: 'bg-green-500/10 text-green-400',
    declined: 'bg-red-500/10 text-red-400',
    withdrawn: 'bg-gray-500/10 text-gray-400',
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
            <Link to="/interviewers" className="text-gray-400 hover:text-white text-sm">Interviewers</Link>
            <Link to="/offers" className="text-white text-sm font-medium">Offers</Link>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">Offers</h1>
          <p className="text-gray-400 text-sm mt-1">{offers.length} total offers sent</p>
        </div>

        {loading ? (
          <div className="text-center py-20"><i className="ri-loader-4-line animate-spin text-blue-400 text-2xl" /></div>
        ) : offers.length === 0 ? (
          <div className="text-center py-20 bg-gray-800/30 rounded-2xl border border-gray-700/50">
            <i className="ri-mail-send-line text-gray-600 text-5xl mb-4" />
            <p className="text-gray-400 mb-2">No offers sent yet</p>
            <p className="text-gray-500 text-sm">Release offers from the job applications view</p>
          </div>
        ) : (
          <div className="space-y-3">
            {offers.map(offer => (
              <div key={offer.id} className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-5 hover:border-gray-600 transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                      <i className="ri-mail-send-line text-green-400 text-xl" />
                    </div>
                    <div>
                      <p className="text-white font-medium">{offer.candidate_name}</p>
                      <p className="text-gray-400 text-sm">{offer.candidate_email}</p>
                      <p className="text-gray-500 text-xs mt-0.5">
                        {offer.job_title}
                        {offer.released_at && ` • Sent: ${new Date(offer.released_at).toLocaleDateString()}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 text-xs font-medium rounded-full ${statusColors[offer.status]}`}>
                      {offer.status}
                    </span>
                    {offer.responded_at && (
                      <span className="text-gray-500 text-xs">
                        Responded: {new Date(offer.responded_at).toLocaleDateString()}
                      </span>
                    )}
                    <Link to={`/offer/${offer.id}`}
                      className="px-3 py-1.5 text-xs bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600">
                      <i className="ri-eye-line mr-1" />View
                    </Link>
                  </div>
                </div>
                {offer.response_note && (
                  <div className="mt-3 ml-16 bg-gray-700/30 rounded-lg p-3">
                    <p className="text-gray-300 text-sm"><i className="ri-chat-quote-line text-gray-500 mr-1" />{offer.response_note}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

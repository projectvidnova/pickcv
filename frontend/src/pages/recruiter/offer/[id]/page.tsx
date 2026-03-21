import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { recruiterApi, Offer } from '../../../../services/recruiterService';

export default function OfferViewPage() {
  const { id } = useParams();
  const offerId = Number(id);
  const [offer, setOffer] = useState<Offer | null>(null);
  const [loading, setLoading] = useState(true);
  const [responding, setResponding] = useState(false);
  const [note, setNote] = useState('');
  const [showConfirm, setShowConfirm] = useState<'accepted' | 'declined' | null>(null);

  useEffect(() => {
    recruiterApi.viewOffer(offerId)
      .then(setOffer)
      .catch(() => setOffer(null))
      .finally(() => setLoading(false));
  }, [offerId]);

  const handleRespond = async (response: 'accepted' | 'declined') => {
    setResponding(true);
    try {
      await recruiterApi.respondToOffer(offerId, response, note || undefined);
      const updated = await recruiterApi.viewOffer(offerId);
      setOffer(updated);
      setShowConfirm(null);
    } catch (err: any) { alert(err.message); }
    setResponding(false);
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <i className="ri-loader-4-line animate-spin text-blue-500 text-3xl" />
    </div>
  );

  if (!offer) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <i className="ri-file-unknow-line text-gray-300 text-5xl mb-4" />
        <p className="text-gray-500 text-lg">Offer not found</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 mx-auto rounded-full bg-blue-100 flex items-center justify-center mb-4">
            <i className="ri-building-2-fill text-blue-600 text-xl" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Offer Letter</h1>
          <p className="text-gray-500 text-sm mt-1">{offer.job_title}</p>
        </div>

        {/* Status banner */}
        {offer.status !== 'released' && (
          <div className={`rounded-xl p-4 mb-6 text-center ${
            offer.status === 'accepted' ? 'bg-green-50 border border-green-200' :
            offer.status === 'declined' ? 'bg-red-50 border border-red-200' :
            'bg-gray-100 border border-gray-200'
          }`}>
            <p className={`font-medium ${
              offer.status === 'accepted' ? 'text-green-700' :
              offer.status === 'declined' ? 'text-red-700' : 'text-gray-700'
            }`}>
              <i className={`${offer.status === 'accepted' ? 'ri-check-double-line' : 'ri-close-line'} mr-1`} />
              This offer has been {offer.status}
              {offer.responded_at && ` on ${new Date(offer.responded_at).toLocaleDateString()}`}
            </p>
          </div>
        )}

        {/* Offer Content */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-8 mb-6">
          <div className="prose prose-sm max-w-none whitespace-pre-wrap text-gray-700 leading-relaxed">
            {offer.rendered_content}
          </div>
        </div>

        {/* Actions (only if released / pending) */}
        {offer.status === 'released' && (
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Response</h3>
            <div>
              <label className="block text-sm text-gray-600 mb-2">Note (optional)</label>
              <textarea value={note} onChange={e => setNote(e.target.value)} rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                placeholder="Add any comments or questions..." />
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={() => setShowConfirm('declined')}
                className="flex-1 py-3 border border-red-200 text-red-600 rounded-xl hover:bg-red-50 transition-all font-medium">
                <i className="ri-close-line mr-1" /> Decline
              </button>
              <button onClick={() => setShowConfirm('accepted')}
                className="flex-1 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all font-medium">
                <i className="ri-check-line mr-1" /> Accept Offer
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-gray-400 text-xs">Powered by PickCV — AI-Powered Recruitment</p>
        </div>
      </div>

      {/* Confirm Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 text-center">
            <div className={`w-14 h-14 mx-auto rounded-full flex items-center justify-center mb-4 ${
              showConfirm === 'accepted' ? 'bg-green-100' : 'bg-red-100'
            }`}>
              <i className={`text-2xl ${showConfirm === 'accepted' ? 'ri-check-line text-green-600' : 'ri-close-line text-red-600'}`} />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              {showConfirm === 'accepted' ? 'Accept this offer?' : 'Decline this offer?'}
            </h3>
            <p className="text-gray-500 text-sm mb-6">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowConfirm(null)} className="flex-1 py-2.5 border border-gray-300 text-gray-600 rounded-xl">Cancel</button>
              <button onClick={() => handleRespond(showConfirm)} disabled={responding}
                className={`flex-1 py-2.5 text-white rounded-xl ${
                  showConfirm === 'accepted' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
                } disabled:opacity-50`}>
                {responding ? 'Processing...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

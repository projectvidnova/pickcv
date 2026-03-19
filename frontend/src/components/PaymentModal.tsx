import { useState, useCallback } from 'react';
import paymentService, { PaymentConfig, PaymentSession, PlanInfo } from '../services/paymentService';

// Zoho widget types
declare global {
  interface Window {
    ZPayments: new (config: {
      account_id: string;
      domain: string;
      otherOptions: { api_key: string };
    }) => {
      requestPaymentMethod: (options: {
        amount: number;
        currency_code: string;
        payments_session_id: string;
        description?: string;
      }) => Promise<{
        payment_id: string;
        signature: string;
        message: string;
      }>;
    };
  }
}

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPaymentSuccess: (subscriptionActivated?: boolean) => void;
  resumeId: number;
  plans: PlanInfo[];
}

export default function PaymentModal({
  isOpen,
  onClose,
  onPaymentSuccess,
  resumeId,
  plans,
}: PaymentModalProps) {
  const [selectedPlan, setSelectedPlan] = useState<string>('per_resume');
  const [status, setStatus] = useState<'idle' | 'loading' | 'processing' | 'verifying' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const selectedPlanInfo = plans.find((p) => p.plan_type === selectedPlan) || plans[0];

  const handlePayment = useCallback(async () => {
    setStatus('loading');
    setErrorMessage('');

    try {
      // Step 1: Get payment config
      const config: PaymentConfig = await paymentService.getConfig();

      if (!config.is_configured) {
        setErrorMessage('Payment gateway is not configured. Please contact support.');
        setStatus('error');
        return;
      }

      // Step 2: Create payment session for selected plan
      const session: PaymentSession = await paymentService.createSession(
        selectedPlan,
        selectedPlan === 'per_resume' ? resumeId : resumeId // pass resumeId for context
      );

      // Step 3: Load Zoho widget script
      await paymentService.loadZohoScript();

      // Step 4: Initialize Zoho widget
      setStatus('processing');
      const zpayInstance = new window.ZPayments({
        account_id: config.account_id,
        domain: config.domain,
        otherOptions: { api_key: config.api_key },
      });

      // Step 5: Open payment widget
      const result = await zpayInstance.requestPaymentMethod({
        amount: session.amount,
        currency_code: session.currency,
        payments_session_id: session.payments_session_id,
        description: selectedPlanInfo?.label || 'PickCV Payment',
      });

      // Step 6: Verify payment on backend
      setStatus('verifying');
      const verification = await paymentService.verifyPayment(
        session.payments_session_id,
        result.payment_id,
        result.signature
      );

      if (verification.success || verification.status === 'succeeded') {
        setStatus('success');
        setTimeout(() => {
          onPaymentSuccess(verification.subscription_activated);
          onClose();
        }, 1500);
      } else {
        setErrorMessage(verification.message || 'Payment verification failed');
        setStatus('error');
      }
    } catch (error: any) {
      console.error('Payment error:', error);
      if (error?.message?.includes('cancelled') || error?.message?.includes('closed')) {
        setStatus('idle');
        return;
      }
      setErrorMessage(error?.message || 'Payment failed. Please try again.');
      setStatus('error');
    }
  }, [resumeId, selectedPlan, selectedPlanInfo, onPaymentSuccess, onClose]);

  if (!isOpen) return null;

  const isProcessing = status === 'loading' || status === 'processing' || status === 'verifying';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={isProcessing ? undefined : onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-600 to-emerald-500 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-white">Choose Your Plan</h3>
              <p className="text-sm text-white/80">Select a plan to download your optimized resume</p>
            </div>
            {!isProcessing && (
              <button onClick={onClose} className="text-white/80 hover:text-white transition-colors">
                <i className="ri-close-line text-xl"></i>
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {status === 'success' ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="ri-check-line text-3xl text-green-600"></i>
              </div>
              <h4 className="text-lg font-bold text-gray-900 mb-2">Payment Successful!</h4>
              <p className="text-sm text-gray-600">Your download will start shortly...</p>
            </div>
          ) : status === 'error' ? (
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="ri-error-warning-line text-3xl text-red-600"></i>
              </div>
              <h4 className="text-lg font-bold text-gray-900 mb-2">Payment Failed</h4>
              <p className="text-sm text-red-600 mb-4">{errorMessage}</p>
              <button
                onClick={() => { setStatus('idle'); setErrorMessage(''); }}
                className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-semibold hover:bg-teal-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : (
            <>
              {/* Plan Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {plans.map((plan) => {
                  const isSelected = selectedPlan === plan.plan_type;
                  const isPopular = plan.badge === 'POPULAR';
                  const isBestValue = plan.badge === 'BEST VALUE';

                  return (
                    <button
                      key={plan.plan_type}
                      onClick={() => setSelectedPlan(plan.plan_type)}
                      disabled={isProcessing}
                      className={`relative p-4 rounded-xl border-2 text-left transition-all ${
                        isSelected
                          ? 'border-teal-500 bg-teal-50 shadow-lg shadow-teal-500/10'
                          : 'border-gray-200 bg-white hover:border-teal-300 hover:bg-gray-50'
                      } ${isProcessing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      {/* Badge */}
                      {plan.badge && (
                        <span
                          className={`absolute -top-2.5 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[10px] font-bold tracking-wide ${
                            isBestValue
                              ? 'bg-amber-500 text-white'
                              : isPopular
                              ? 'bg-teal-500 text-white'
                              : 'bg-gray-500 text-white'
                          }`}
                        >
                          {plan.badge}
                        </span>
                      )}

                      {/* Plan Icon */}
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${
                        isSelected ? 'bg-teal-500 text-white' : 'bg-gray-100 text-gray-500'
                      }`}>
                        <i className={`text-lg ${
                          plan.plan_type === 'per_resume'
                            ? 'ri-file-download-line'
                            : plan.plan_type === 'monthly'
                            ? 'ri-calendar-line'
                            : 'ri-vip-crown-line'
                        }`}></i>
                      </div>

                      {/* Plan Name */}
                      <h4 className="text-sm font-bold text-gray-900 mb-1">{plan.label}</h4>

                      {/* Price */}
                      <div className="flex items-baseline gap-1 mb-2">
                        <span className="text-2xl font-bold text-teal-700">
                          ₹{plan.price}
                        </span>
                        {plan.plan_type === 'monthly' && (
                          <span className="text-xs text-gray-500">/month</span>
                        )}
                        {plan.plan_type === 'yearly' && (
                          <span className="text-xs text-gray-500">/year</span>
                        )}
                      </div>

                      {/* Description */}
                      <p className="text-xs text-gray-500 mb-3">{plan.description}</p>

                      {/* Features */}
                      <ul className="space-y-1">
                        {plan.plan_type === 'per_resume' ? (
                          <>
                            <li className="flex items-center gap-1.5 text-xs text-gray-600">
                              <i className="ri-check-line text-teal-500 text-sm"></i>
                              One resume download
                            </li>
                            <li className="flex items-center gap-1.5 text-xs text-gray-600">
                              <i className="ri-check-line text-teal-500 text-sm"></i>
                              ATS-optimized PDF
                            </li>
                          </>
                        ) : (
                          <>
                            <li className="flex items-center gap-1.5 text-xs text-gray-600">
                              <i className="ri-check-line text-teal-500 text-sm"></i>
                              Unlimited downloads
                            </li>
                            <li className="flex items-center gap-1.5 text-xs text-gray-600">
                              <i className="ri-check-line text-teal-500 text-sm"></i>
                              All resume templates
                            </li>
                            <li className="flex items-center gap-1.5 text-xs text-gray-600">
                              <i className="ri-check-line text-teal-500 text-sm"></i>
                              {plan.plan_type === 'monthly' ? '30 days access' : '365 days access'}
                            </li>
                          </>
                        )}
                      </ul>

                      {/* Selection indicator */}
                      {isSelected && (
                        <div className="absolute top-3 right-3 w-5 h-5 bg-teal-500 rounded-full flex items-center justify-center">
                          <i className="ri-check-line text-white text-xs"></i>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Savings highlight for yearly */}
              {selectedPlan === 'yearly' && (
                <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-center">
                  <span className="text-sm font-semibold text-amber-800">
                    🎉 Save ₹789 compared to monthly! That's just ₹83/month.
                  </span>
                </div>
              )}

              {/* Pay Button */}
              <button
                onClick={handlePayment}
                disabled={isProcessing}
                className="w-full py-3.5 bg-gradient-to-r from-teal-600 to-emerald-500 text-white rounded-xl font-bold text-base shadow-lg shadow-teal-500/25 hover:shadow-teal-500/40 hover:scale-[1.02] transition-all disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {status === 'loading' ? (
                  <span className="flex items-center justify-center gap-2">
                    <i className="ri-loader-4-line animate-spin"></i>
                    Preparing Payment...
                  </span>
                ) : status === 'processing' ? (
                  <span className="flex items-center justify-center gap-2">
                    <i className="ri-loader-4-line animate-spin"></i>
                    Processing...
                  </span>
                ) : status === 'verifying' ? (
                  <span className="flex items-center justify-center gap-2">
                    <i className="ri-loader-4-line animate-spin"></i>
                    Verifying Payment...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <i className="ri-secure-payment-line"></i>
                    Pay ₹{selectedPlanInfo?.price || 49} — {selectedPlanInfo?.label || 'Download'}
                  </span>
                )}
              </button>

              {/* Security Note */}
              <p className="text-xs text-gray-400 text-center mt-3 flex items-center justify-center gap-1">
                <i className="ri-lock-line"></i>
                Secured by Zoho Payments. Your payment info is safe.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

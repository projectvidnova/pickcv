/**
 * Payment Service for PickCV
 * Handles Zoho Payment Gateway integration with subscription/plan support
 */

import { authFetch } from './authFetch';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// ─── Interfaces ──────────────────────────────────────────────

export interface PaymentConfig {
  account_id: string;
  api_key: string;
  domain: string;
  currency: string;
  resume_download_price: number;
  subscription_monthly_price: number;
  subscription_yearly_price: number;
  free_downloads_limit: number;
  is_configured: boolean;
}

export interface PlanInfo {
  plan_type: string;       // per_resume, monthly, yearly
  price: number;
  currency: string;
  label: string;
  description: string;
  period: string | null;
  badge: string | null;    // "POPULAR", "BEST VALUE", null
}

export interface SubscriptionInfo {
  id: number;
  plan_type: string;       // monthly, yearly
  status: string;          // active, expired, cancelled
  starts_at: string;
  expires_at: string;
  days_remaining: number;
}

export interface PaymentAccess {
  has_access: boolean;
  access_type: string | null;          // "free", "subscription", "per_resume", null
  payment_required: boolean;
  free_downloads_remaining: number;
  active_subscription: SubscriptionInfo | null;
  plans: PlanInfo[];
}

export interface PaymentSession {
  payments_session_id: string;
  amount: number;
  currency: string;
  reference_number: string;
}

export interface PaymentVerifyResult {
  success: boolean;
  payment_id: string;
  status: string;
  message: string;
  download_allowed?: boolean;
  subscription_activated?: boolean;
}

export interface PaymentHistoryItem {
  id: number;
  resume_id: number;
  amount: number;
  currency: string;
  status: string;
  product_type: string;
  created_at: string;
  paid_at: string | null;
  zoho_payment_id: string | null;
}

export interface FreeDownloadResult {
  success: boolean;
  message: string;
  free_downloads_remaining: number;
}

export interface CouponValidateResult {
  valid: boolean;
  code: string;
  description: string;
  remaining_uses: number;
}

export interface CouponApplyResult {
  success: boolean;
  message: string;
  coupon_code: string;
}

// ─── Service ─────────────────────────────────────────────────

class PaymentService {
  private baseUrl = `${API_BASE_URL}/payments`;

  /** Get payment gateway configuration */
  async getConfig(): Promise<PaymentConfig> {
    const response = await authFetch(`${this.baseUrl}/config`);
    if (!response.ok) throw new Error('Failed to fetch payment config');
    return response.json();
  }

  /** Get available pricing plans */
  async getPlans(): Promise<PlanInfo[]> {
    const response = await authFetch(`${this.baseUrl}/plans`);
    if (!response.ok) throw new Error('Failed to fetch plans');
    return response.json();
  }

  /** Comprehensive access check for a resume */
  async checkAccess(resumeId: number): Promise<PaymentAccess> {
    const response = await authFetch(`${this.baseUrl}/check-access/${resumeId}`);
    if (!response.ok) throw new Error('Failed to check payment access');
    return response.json();
  }

  /** Claim the one-time free download */
  async useFreeDownload(resumeId: number): Promise<FreeDownloadResult> {
    const response = await authFetch(`${this.baseUrl}/use-free-download`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resume_id: resumeId }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to claim free download');
    }
    return response.json();
  }

  /** Create a payment session for the selected plan */
  async createSession(
    planType: string,
    resumeId?: number
  ): Promise<PaymentSession> {
    const body: Record<string, unknown> = { plan_type: planType };
    if (resumeId) body.resume_id = resumeId;

    const response = await authFetch(`${this.baseUrl}/create-session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      const error = await response.json();
      const detail = error.detail;
      const message = typeof detail === 'object' ? detail.message : (detail || 'Failed to create payment session');
      const err = new Error(message) as Error & { status: number; code?: string };
      err.status = response.status;
      if (typeof detail === 'object') err.code = detail.code;
      throw err;
    }
    return response.json();
  }

  /** Verify payment after Zoho widget returns */
  async verifyPayment(
    sessionId: string,
    paymentId: string,
    signature: string
  ): Promise<PaymentVerifyResult> {
    const response = await authFetch(`${this.baseUrl}/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        payments_session_id: sessionId,
        payment_id: paymentId,
        signature,
      }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Payment verification failed');
    }
    return response.json();
  }

  /** Get user's active subscription */
  async getSubscription(): Promise<{ has_subscription: boolean; subscription: SubscriptionInfo | null }> {
    const response = await authFetch(`${this.baseUrl}/subscription`);
    if (!response.ok) throw new Error('Failed to fetch subscription');
    return response.json();
  }

  /** Get user's payment history */
  async getHistory(): Promise<PaymentHistoryItem[]> {
    const response = await authFetch(`${this.baseUrl}/history`);
    if (!response.ok) throw new Error('Failed to fetch payment history');
    return response.json();
  }

  /** Validate a coupon code without redeeming */
  async validateCoupon(couponCode: string): Promise<CouponValidateResult> {
    const response = await authFetch(`${this.baseUrl}/coupon/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ coupon_code: couponCode }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Invalid coupon');
    }
    return response.json();
  }

  /** Apply (redeem) a coupon to unlock resume download */
  async applyCoupon(couponCode: string, resumeId: number): Promise<CouponApplyResult> {
    const response = await authFetch(`${this.baseUrl}/coupon/apply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ coupon_code: couponCode, resume_id: resumeId }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to apply coupon');
    }
    return response.json();
  }

  /** Load Zoho Payments widget script dynamically */
  loadZohoScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Already loaded and available
      if (window.ZPayments) {
        resolve();
        return;
      }

      // Script tag exists but ZPayments not ready — wait for it
      const existingScript = document.querySelector('script[src*="zpayments.js"]');
      if (existingScript) {
        // Script was added but maybe still loading — listen for load event
        const checkReady = () => {
          if (window.ZPayments) { resolve(); return; }
          setTimeout(checkReady, 100);
        };
        // Bail out after 10 seconds
        const timeout = setTimeout(() => reject(new Error('Zoho Payments script timed out')), 10000);
        existingScript.addEventListener('load', () => { clearTimeout(timeout); checkReady(); });
        existingScript.addEventListener('error', () => { clearTimeout(timeout); reject(new Error('Failed to load Zoho Payments script')); });
        checkReady();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://static.zohocdn.com/zpay/zpay-js/v1/zpayments.js';
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Zoho Payments script'));
      document.head.appendChild(script);
    });
  }
}

export const paymentService = new PaymentService();
export default paymentService;

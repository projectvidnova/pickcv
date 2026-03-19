/**
 * Payment Service for PickCV
 * Handles Zoho Payment Gateway integration with subscription/plan support
 */

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

// ─── Service ─────────────────────────────────────────────────

class PaymentService {
  private baseUrl = `${API_BASE_URL}/payments`;

  private getHeaders(): Record<string, string> {
    const token = localStorage.getItem('access_token');
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }

  /** Get payment gateway configuration */
  async getConfig(): Promise<PaymentConfig> {
    const response = await fetch(`${this.baseUrl}/config`, {
      headers: this.getHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch payment config');
    return response.json();
  }

  /** Get available pricing plans */
  async getPlans(): Promise<PlanInfo[]> {
    const response = await fetch(`${this.baseUrl}/plans`, {
      headers: this.getHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch plans');
    return response.json();
  }

  /** Comprehensive access check for a resume */
  async checkAccess(resumeId: number): Promise<PaymentAccess> {
    const response = await fetch(`${this.baseUrl}/check-access/${resumeId}`, {
      headers: this.getHeaders(),
    });
    if (!response.ok) throw new Error('Failed to check payment access');
    return response.json();
  }

  /** Claim the one-time free download */
  async useFreeDownload(resumeId: number): Promise<FreeDownloadResult> {
    const response = await fetch(`${this.baseUrl}/use-free-download`, {
      method: 'POST',
      headers: this.getHeaders(),
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

    const response = await fetch(`${this.baseUrl}/create-session`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to create payment session');
    }
    return response.json();
  }

  /** Verify payment after Zoho widget returns */
  async verifyPayment(
    sessionId: string,
    paymentId: string,
    signature: string
  ): Promise<PaymentVerifyResult> {
    const response = await fetch(`${this.baseUrl}/verify`, {
      method: 'POST',
      headers: this.getHeaders(),
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
    const response = await fetch(`${this.baseUrl}/subscription`, {
      headers: this.getHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch subscription');
    return response.json();
  }

  /** Get user's payment history */
  async getHistory(): Promise<PaymentHistoryItem[]> {
    const response = await fetch(`${this.baseUrl}/history`, {
      headers: this.getHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch payment history');
    return response.json();
  }

  /** Load Zoho Payments widget script dynamically */
  loadZohoScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (document.querySelector('script[src*="zpayments.js"]')) {
        resolve();
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

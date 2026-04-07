"""Zoho Payments integration service.

Handles:
- OAuth token management (refresh flow)
- Payment session creation
- Payment verification
- Signature verification
"""
import hashlib
import hmac
import logging
import time
from typing import Optional, Dict, Any

import httpx

from config import settings

logger = logging.getLogger(__name__)


class ZohoPaymentService:
    """Service for interacting with Zoho Payments API."""

    def __init__(self):
        self.base_url = settings.zoho_payments_base_url
        self.account_id = settings.zoho_payments_account_id
        self._oauth_token: Optional[str] = settings.zoho_payments_oauth_token or None
        self._token_expiry: float = 0

    # ─── OAuth Token Management ───────────────────────────────

    async def _get_oauth_token(self) -> str:
        """Get a valid OAuth token, refreshing if needed."""
        # If we have a static token set via env, use it
        if self._oauth_token and self._token_expiry == 0:
            return self._oauth_token

        # If token is still valid, reuse
        if self._oauth_token and time.time() < self._token_expiry:
            return self._oauth_token

        # Refresh token flow
        if not settings.zoho_payments_refresh_token:
            if settings.zoho_payments_oauth_token:
                return settings.zoho_payments_oauth_token
            raise ValueError("No Zoho Payments OAuth token or refresh token configured")

        async with httpx.AsyncClient() as client:
            resp = await client.post(
                "https://accounts.zoho.in/oauth/v2/token",
                data={
                    "refresh_token": settings.zoho_payments_refresh_token,
                    "client_id": settings.zoho_payments_client_id,
                    "client_secret": settings.zoho_payments_client_secret,
                    "grant_type": "refresh_token",
                },
            )
            resp.raise_for_status()
            data = resp.json()
            self._oauth_token = data["access_token"]
            self._token_expiry = time.time() + data.get("expires_in", 3600) - 60
            logger.info("Zoho Payments OAuth token refreshed")
            return self._oauth_token

    async def _api_request(
        self,
        method: str,
        path: str,
        json_body: Optional[dict] = None,
        params: Optional[dict] = None,
    ) -> Dict[str, Any]:
        """Make an authenticated request to Zoho Payments API."""
        token = await self._get_oauth_token()
        url = f"{self.base_url}{path}"

        base_params = {"account_id": self.account_id}
        if params:
            base_params.update(params)

        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.request(
                method,
                url,
                headers={
                    "Authorization": f"Zoho-oauthtoken {token}",
                    "Content-Type": "application/json",
                },
                params=base_params,
                json=json_body,
            )

            if resp.status_code == 401:
                # Token may have expired, try refreshing
                self._oauth_token = None
                self._token_expiry = 0
                token = await self._get_oauth_token()
                resp = await client.request(
                    method,
                    url,
                    headers={
                        "Authorization": f"Zoho-oauthtoken {token}",
                        "Content-Type": "application/json",
                    },
                    params=base_params,
                    json=json_body,
                )

            resp.raise_for_status()
            return resp.json()

    # ─── Payment Sessions ─────────────────────────────────────

    async def create_payment_session(
        self,
        amount: float,
        currency: str = "INR",
        description: str = "Resume Download",
        reference_number: Optional[str] = None,
        meta_data: Optional[list] = None,
    ) -> Dict[str, Any]:
        """Create a Zoho Payments session for the checkout widget.

        Returns:
            {
                "payments_session_id": "...",
                "amount": "...",
                "currency": "...",
                ...
            }
        """
        body: Dict[str, Any] = {
            "amount": amount,
            "currency": currency,
            "description": description,
            "expires_in": 900,  # 15 minutes
        }
        if reference_number:
            body["reference_number"] = reference_number
        if meta_data:
            body["meta_data"] = meta_data

        data = await self._api_request("POST", "/paymentsessions", json_body=body)
        logger.info(
            "Payment session created: %s (amount=%s %s)",
            data.get("payments_session", {}).get("payments_session_id"),
            amount,
            currency,
        )
        return data.get("payments_session", data)

    async def retrieve_payment_session(self, session_id: str) -> Dict[str, Any]:
        """Retrieve a payment session to check its status."""
        data = await self._api_request("GET", f"/paymentsessions/{session_id}")
        return data.get("payments_session", data)

    # ─── Payments ─────────────────────────────────────────────

    async def retrieve_payment(self, payment_id: str) -> Dict[str, Any]:
        """Retrieve payment details to verify payment status."""
        data = await self._api_request("GET", f"/payments/{payment_id}")
        return data.get("payment", data)

    # ─── Signature Verification ───────────────────────────────

    def verify_signature(self, payment_id: str, received_signature: str) -> bool:
        """Verify the widget response signature using the signing key.

        Zoho signs: payment_id with HMAC-SHA256 using the signing key.
        """
        if not settings.zoho_payments_signing_key:
            logger.warning("No signing key configured — skipping signature verification")
            return True  # If no key, skip (for dev/sandbox)

        # Zoho provides the signing key as a hex string; decode to raw bytes
        try:
            key_bytes = bytes.fromhex(settings.zoho_payments_signing_key)
        except ValueError:
            key_bytes = settings.zoho_payments_signing_key.encode()

        expected = hmac.new(
            key_bytes,
            payment_id.encode(),
            hashlib.sha256,
        ).hexdigest()

        return hmac.compare_digest(expected, received_signature)

    # ─── Configuration Check ─────────────────────────────────

    @property
    def is_configured(self) -> bool:
        """Check if Zoho Payments is configured."""
        return bool(self.account_id and (self._oauth_token or settings.zoho_payments_refresh_token))


zoho_payment_service = ZohoPaymentService()

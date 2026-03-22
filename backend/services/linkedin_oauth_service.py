"""LinkedIn OAuth authentication service using OpenID Connect."""
import aiohttp
import logging
from urllib.parse import urlencode
from typing import Optional, Dict, Any
from config import settings

logger = logging.getLogger(__name__)

# LinkedIn OAuth 2.0 / OpenID Connect URLs
LINKEDIN_AUTH_URL = "https://www.linkedin.com/oauth/v2/authorization"
LINKEDIN_TOKEN_URL = "https://www.linkedin.com/oauth/v2/accessToken"
LINKEDIN_USERINFO_URL = "https://api.linkedin.com/v2/userinfo"


class LinkedInOAuthService:
    """Handle LinkedIn OAuth 2.0 authentication flow (OpenID Connect)."""

    def __init__(self):
        self.client_id = settings.linkedin_client_id
        self.client_secret = settings.linkedin_client_secret
        self.redirect_uri = settings.linkedin_redirect_uri

    def get_authorization_url(self, state: str) -> str:
        """
        Generate LinkedIn OAuth authorization URL.

        Args:
            state: CSRF protection state token

        Returns:
            Authorization URL to redirect user to
        """
        params = {
            "response_type": "code",
            "client_id": self.client_id,
            "redirect_uri": self.redirect_uri,
            "state": state,
            "scope": "openid profile email",
        }

        query_string = urlencode(params)
        return f"{LINKEDIN_AUTH_URL}?{query_string}"

    async def exchange_code_for_token(
        self, code: str, redirect_uri: str | None = None
    ) -> Optional[Dict[str, Any]]:
        """
        Exchange authorization code for access token.

        Args:
            code: Authorization code from LinkedIn redirect
            redirect_uri: Override redirect_uri (must match the one used in the auth request)

        Returns:
            Token response containing access_token (and optionally id_token), or None
        """
        used_redirect_uri = redirect_uri or self.redirect_uri
        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    LINKEDIN_TOKEN_URL,
                    data={
                        "grant_type": "authorization_code",
                        "code": code,
                        "client_id": self.client_id,
                        "client_secret": self.client_secret,
                        "redirect_uri": used_redirect_uri,
                    },
                    headers={
                        "Content-Type": "application/x-www-form-urlencoded",
                    },
                ) as resp:
                    if resp.status == 200:
                        return await resp.json()
                    else:
                        error_body = await resp.text()
                        logger.error(
                            f"LinkedIn token exchange failed: {resp.status} - {error_body}"
                        )
                        return None
        except Exception as e:
            logger.error(f"LinkedIn token exchange error: {e}")
            return None

    async def get_user_info(self, access_token: str) -> Optional[Dict[str, Any]]:
        """
        Get user info from LinkedIn using the OpenID Connect userinfo endpoint.

        Args:
            access_token: LinkedIn access token

        Returns:
            User info dict with sub, email, name, picture, etc., or None
        """
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(
                    LINKEDIN_USERINFO_URL,
                    headers={"Authorization": f"Bearer {access_token}"},
                ) as resp:
                    if resp.status == 200:
                        return await resp.json()
                    else:
                        error_body = await resp.text()
                        logger.error(
                            f"LinkedIn user info fetch failed: {resp.status} - {error_body}"
                        )
                        return None
        except Exception as e:
            logger.error(f"LinkedIn user info fetch error: {e}")
            return None


linkedin_oauth_service = LinkedInOAuthService()

"""Google OAuth authentication service."""
import aiohttp
import logging
from urllib.parse import urlencode
from typing import Optional, Dict, Any
from config import settings

logger = logging.getLogger(__name__)

# Google OAuth URLs
GOOGLE_DISCOVERY_URL = "https://accounts.google.com/.well-known/openid-configuration"


class GoogleOAuthService:
    """Handle Google OAuth 2.0 authentication flow."""
    
    def __init__(self):
        self.client_id = settings.google_client_id
        self.client_secret = settings.google_client_secret
        self.redirect_uri = settings.google_redirect_uri
    
    def get_authorization_url(self, state: str) -> str:
        """
        Generate Google OAuth authorization URL.
        
        Args:
            state: CSRF protection state token
            
        Returns:
            Authorization URL to redirect user to
        """
        params = {
            "client_id": self.client_id,
            "redirect_uri": self.redirect_uri,
            "response_type": "code",
            "scope": "openid email profile",
            "state": state,
            "access_type": "offline",
        }
        
        query_string = urlencode(params)
        return f"https://accounts.google.com/o/oauth2/v2/auth?{query_string}"
    
    async def exchange_code_for_token(self, code: str, redirect_uri: str = None) -> Dict[str, Any]:
        """
        Exchange authorization code for access token.
        
        Args:
            code: Authorization code from Google redirect
            redirect_uri: Override redirect_uri (must match the one used in the auth request)
            
        Returns:
            Token response containing access_token and id_token
        Raises:
            ValueError: If Google returns an error
        """
        used_redirect_uri = redirect_uri or self.redirect_uri
        logger.info(f"Token exchange: redirect_uri={used_redirect_uri}")
        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    "https://oauth2.googleapis.com/token",
                    data={
                        "client_id": self.client_id,
                        "client_secret": self.client_secret,
                        "code": code,
                        "grant_type": "authorization_code",
                        "redirect_uri": used_redirect_uri,
                    }
                ) as resp:
                    if resp.status == 200:
                        return await resp.json()
                    else:
                        error_body = await resp.text()
                        logger.error(f"Token exchange failed: {resp.status} - {error_body}")
                        raise ValueError(f"Google token exchange failed ({resp.status}): {error_body}")
        except ValueError:
            raise
        except Exception as e:
            logger.error(f"Token exchange error: {e}")
            raise ValueError(f"Token exchange error: {e}")
    
    async def get_user_info(self, access_token: str) -> Optional[Dict[str, Any]]:
        """
        Get user info from Google using access token.
        
        Args:
            access_token: Google access token
            
        Returns:
            User info dict with email, name, picture, etc., or None if failed
        """
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(
                    "https://www.googleapis.com/oauth2/v2/userinfo",
                    headers={"Authorization": f"Bearer {access_token}"}
                ) as resp:
                    if resp.status == 200:
                        return await resp.json()
                    else:
                        logger.error(f"User info fetch failed: {resp.status}")
                        return None
        except Exception as e:
            logger.error(f"User info fetch error: {e}")
            return None
    
    def verify_id_token(self, id_token: str) -> Optional[Dict[str, Any]]:
        """
        Verify and decode ID token (for additional verification).
        Note: This is a simplified version. For production, use google.auth.jwt
        
        Args:
            id_token: JWT ID token from Google
            
        Returns:
            Decoded token claims, or None if invalid
        """
        try:
            # In production, use google.auth.jwt.decode() with cert fetching
            # For now, this is a placeholder
            from jose import jwt
            
            # This would need actual Google public keys in production
            # For now, we rely on HTTPS + access token verification
            logger.warning("ID token verification not fully implemented - using access token instead")
            return None
        except Exception as e:
            logger.error(f"ID token verification error: {e}")
            return None


google_oauth_service = GoogleOAuthService()

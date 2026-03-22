"""LinkedIn OAuth authentication service using OpenID Connect."""
import aiohttp
import logging
from urllib.parse import urlencode
from typing import Optional, Dict, Any, List
from config import settings

logger = logging.getLogger(__name__)

# LinkedIn OAuth 2.0 / OpenID Connect URLs
LINKEDIN_AUTH_URL = "https://www.linkedin.com/oauth/v2/authorization"
LINKEDIN_TOKEN_URL = "https://www.linkedin.com/oauth/v2/accessToken"
LINKEDIN_USERINFO_URL = "https://api.linkedin.com/v2/userinfo"

# LinkedIn API v2 Endpoints (requires w_member_social)
LINKEDIN_POSTS_URL = "https://api.linkedin.com/v2/ugcPosts"
LINKEDIN_SHARES_URL = "https://api.linkedin.com/v2/shares"
LINKEDIN_SOCIAL_ACTIONS_URL = "https://api.linkedin.com/v2/socialActions"

# LinkedIn REST API (versioned)
LINKEDIN_REST_POSTS_URL = "https://api.linkedin.com/rest/posts"


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
            "scope": "openid profile email w_member_social",
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
        logger.info(
            f"LinkedIn token exchange: client_id={'SET' if self.client_id else 'EMPTY'}, "
            f"client_secret={'SET' if self.client_secret else 'EMPTY'}, "
            f"redirect_uri={used_redirect_uri}, code_length={len(code) if code else 0}"
        )
        if not self.client_id or not self.client_secret:
            logger.error("LinkedIn OAuth credentials not configured!")
            return None
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

    async def get_member_posts(
        self, access_token: str, linkedin_sub: str, count: int = 50
    ) -> Optional[List[Dict[str, Any]]]:
        """
        Fetch the authenticated member's own posts/shares.
        Requires w_member_social scope.

        Args:
            access_token: LinkedIn API access token
            linkedin_sub: LinkedIn person ID (sub from OIDC)
            count: Number of posts to retrieve (max 100)

        Returns:
            List of post objects, or None on failure
        """
        person_urn = f"urn:li:person:{linkedin_sub}"
        try:
            async with aiohttp.ClientSession() as session:
                # Try versioned REST API first (newer)
                headers = {
                    "Authorization": f"Bearer {access_token}",
                    "X-Restli-Protocol-Version": "2.0.0",
                    "LinkedIn-Version": "202401",
                }

                # GET posts by author
                params = {
                    "q": "author",
                    "author": person_urn,
                    "count": str(min(count, 100)),
                    "sortBy": "LAST_MODIFIED",
                }

                async with session.get(
                    LINKEDIN_REST_POSTS_URL,
                    headers=headers,
                    params=params,
                ) as resp:
                    if resp.status == 200:
                        data = await resp.json()
                        return data.get("elements", [])
                    else:
                        error_body = await resp.text()
                        logger.warning(
                            f"LinkedIn REST posts API failed ({resp.status}): {error_body}"
                        )

                # Fallback to v2 ugcPosts API
                headers_v2 = {
                    "Authorization": f"Bearer {access_token}",
                    "X-Restli-Protocol-Version": "2.0.0",
                }
                params_v2 = {
                    "q": "authors",
                    "authors": f"List({person_urn})",
                    "count": str(min(count, 100)),
                    "sortBy": "LAST_MODIFIED",
                }

                async with session.get(
                    LINKEDIN_POSTS_URL,
                    headers=headers_v2,
                    params=params_v2,
                ) as resp:
                    if resp.status == 200:
                        data = await resp.json()
                        return data.get("elements", [])
                    else:
                        error_body = await resp.text()
                        logger.error(
                            f"LinkedIn ugcPosts API failed ({resp.status}): {error_body}"
                        )
                        return None
        except Exception as e:
            logger.error(f"LinkedIn get_member_posts error: {e}")
            return None

    async def get_post_social_actions(
        self, access_token: str, post_urn: str
    ) -> Optional[Dict[str, Any]]:
        """
        Get social actions (likes, comments, shares) for a specific post.

        Args:
            access_token: LinkedIn API access token
            post_urn: URN of the post (e.g. urn:li:ugcPost:123456)

        Returns:
            Social actions data or None
        """
        try:
            async with aiohttp.ClientSession() as session:
                headers = {
                    "Authorization": f"Bearer {access_token}",
                    "X-Restli-Protocol-Version": "2.0.0",
                }

                url = f"{LINKEDIN_SOCIAL_ACTIONS_URL}/{post_urn}"

                async with session.get(url, headers=headers) as resp:
                    if resp.status == 200:
                        return await resp.json()
                    else:
                        error_body = await resp.text()
                        logger.error(
                            f"LinkedIn social actions failed ({resp.status}): {error_body}"
                        )
                        return None
        except Exception as e:
            logger.error(f"LinkedIn get_post_social_actions error: {e}")
            return None

    async def get_post_comments(
        self, access_token: str, post_urn: str, count: int = 20
    ) -> Optional[List[Dict[str, Any]]]:
        """
        Get comments on a specific post.

        Args:
            access_token: LinkedIn API access token
            post_urn: URN of the post
            count: Number of comments to retrieve

        Returns:
            List of comment objects or None
        """
        try:
            async with aiohttp.ClientSession() as session:
                headers = {
                    "Authorization": f"Bearer {access_token}",
                    "X-Restli-Protocol-Version": "2.0.0",
                }

                url = f"{LINKEDIN_SOCIAL_ACTIONS_URL}/{post_urn}/comments"
                params = {"count": str(min(count, 100))}

                async with session.get(url, headers=headers, params=params) as resp:
                    if resp.status == 200:
                        data = await resp.json()
                        return data.get("elements", [])
                    else:
                        error_body = await resp.text()
                        logger.error(
                            f"LinkedIn comments fetch failed ({resp.status}): {error_body}"
                        )
                        return None
        except Exception as e:
            logger.error(f"LinkedIn get_post_comments error: {e}")
            return None

    async def get_member_activity_summary(
        self, access_token: str, linkedin_sub: str
    ) -> Dict[str, Any]:
        """
        Build a comprehensive activity summary from the member's posts.
        Aggregates posts, reactions counts, comments, and content themes.

        Args:
            access_token: LinkedIn API access token
            linkedin_sub: LinkedIn person ID

        Returns:
            Activity summary dict
        """
        summary = {
            "total_posts": 0,
            "total_likes": 0,
            "total_comments": 0,
            "total_shares": 0,
            "posts": [],
            "content_themes": [],
            "recent_activity": [],
            "engagement_rate": 0,
        }

        posts = await self.get_member_posts(access_token, linkedin_sub)
        if not posts:
            return summary

        summary["total_posts"] = len(posts)

        for post in posts:
            post_data = self._extract_post_data(post)
            summary["posts"].append(post_data)

            # Aggregate engagement
            social = post.get("socialDetail", {})
            summary["total_likes"] += social.get("totalSocialActivityCounts", {}).get("numLikes", 0)
            summary["total_comments"] += social.get("totalSocialActivityCounts", {}).get("numComments", 0)
            summary["total_shares"] += social.get("totalSocialActivityCounts", {}).get("numShares", 0)

        # Calculate engagement rate
        if summary["total_posts"] > 0:
            total_engagement = summary["total_likes"] + summary["total_comments"] + summary["total_shares"]
            summary["engagement_rate"] = round(total_engagement / summary["total_posts"], 2)

        return summary

    def _extract_post_data(self, post: Dict[str, Any]) -> Dict[str, Any]:
        """Extract readable data from a LinkedIn post object."""
        # Handle both ugcPosts and REST API formats
        text = ""
        media = []
        post_urn = post.get("id", post.get("activity", ""))

        # UGC format
        specific_content = post.get("specificContent", {})
        share_content = specific_content.get("com.linkedin.ugc.ShareContent", {})
        if share_content:
            commentary = share_content.get("shareCommentary", {})
            text = commentary.get("text", "")
            media_list = share_content.get("media", [])
            for m in media_list:
                media.append({
                    "title": m.get("title", {}).get("text", ""),
                    "description": m.get("description", {}).get("text", ""),
                    "url": m.get("originalUrl", ""),
                })

        # REST format (newer)
        if not text:
            commentary_obj = post.get("commentary", "")
            if isinstance(commentary_obj, str):
                text = commentary_obj
            elif isinstance(commentary_obj, dict):
                text = commentary_obj.get("text", "")

        # Article/content
        content = post.get("content", {})
        if content:
            article = content.get("article", {})
            if article:
                media.append({
                    "title": article.get("title", ""),
                    "description": article.get("description", ""),
                    "url": article.get("source", ""),
                })

        # Timestamps
        created_at = post.get("created", {}).get("time", post.get("createdAt", 0))
        last_modified = post.get("lastModified", {}).get("time", post.get("lastModifiedAt", 0))

        # Social counts
        social = post.get("socialDetail", {})
        counts = social.get("totalSocialActivityCounts", {})

        return {
            "post_urn": post_urn,
            "text": text[:500] if text else "",  # Truncate long posts
            "full_text": text,
            "media": media,
            "created_at": created_at,
            "last_modified": last_modified,
            "likes": counts.get("numLikes", 0),
            "comments": counts.get("numComments", 0),
            "shares": counts.get("numShares", 0),
            "visibility": post.get("visibility", {}).get(
                "com.linkedin.ugc.MemberNetworkVisibility",
                post.get("visibility", ""),
            ),
        }


linkedin_oauth_service = LinkedInOAuthService()

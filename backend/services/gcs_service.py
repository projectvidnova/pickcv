"""Google Cloud Storage service for resume file management."""
import os
from typing import Optional
from google.cloud import storage
from google.oauth2 import service_account
import logging

logger = logging.getLogger(__name__)


class GCSService:
    """Service for managing resume files in Google Cloud Storage."""
    
    def __init__(self):
        """Initialize GCS client."""
        self.bucket_name = os.getenv("GCS_BUCKET_NAME")
        self.project_id = os.getenv("GCP_PROJECT_ID")
        
        if not self.bucket_name:
            logger.warning("GCS_BUCKET_NAME not set - file uploads will be disabled")
            self.client = None
            return
        
        try:
            # Try to use Application Default Credentials (works in Cloud Run)
            self.client = storage.Client(project=self.project_id)
            self.bucket = self.client.bucket(self.bucket_name)
        except Exception as e:
            logger.error(f"Failed to initialize GCS client: {e}")
            self.client = None
    
    def upload_resume(self, user_id: int, resume_id: int, file_data: bytes, 
                     filename: str, content_type: str) -> Optional[str]:
        """
        Upload resume file to Google Cloud Storage.
        
        Args:
            user_id: User ID
            resume_id: Resume ID
            file_data: Binary file content
            filename: Original filename
            content_type: MIME type (application/pdf, application/vnd.openxmlformats-officedocument.wordprocessingml.document)
        
        Returns:
            GCS file path (gs://bucket/path) or None if upload fails
        """
        if not self.client:
            logger.warning("GCS client not initialized - skipping file upload")
            return None
        
        try:
            # Create organized path: resumes/user_id/resume_id/filename
            blob_name = f"resumes/{user_id}/{resume_id}/{filename}"
            blob = self.bucket.blob(blob_name)
            
            # Set metadata
            blob.metadata = {
                "user_id": str(user_id),
                "resume_id": str(resume_id),
                "original_filename": filename,
            }
            
            # Upload file
            blob.upload_from_string(
                file_data,
                content_type=content_type
            )
            
            logger.info(f"Resume uploaded to GCS: {blob_name}")
            return f"gs://{self.bucket_name}/{blob_name}"
            
        except Exception as e:
            logger.error(f"Failed to upload resume to GCS: {e}")
            return None
    
    def get_signed_url(self, blob_name: str, expiration_seconds: int = 3600) -> Optional[str]:
        """
        Generate a signed URL for downloading a resume file.
        
        Args:
            blob_name: Full blob path (e.g., "resumes/1/1/resume.pdf")
            expiration_seconds: URL expiration time in seconds (default 1 hour)
        
        Returns:
            Signed URL or None if generation fails
        """
        if not self.client:
            return None
        
        try:
            blob = self.bucket.blob(blob_name)
            url = blob.generate_signed_url(
                version="v4",
                expiration=expiration_seconds,
                method="GET"
            )
            return url
        except Exception as e:
            logger.error(f"Failed to generate signed URL: {e}")
            return None
    
    def delete_resume(self, blob_name: str) -> bool:
        """
        Delete resume file from GCS.
        
        Args:
            blob_name: Full blob path
        
        Returns:
            True if successful, False otherwise
        """
        if not self.client:
            return False
        
        try:
            blob = self.bucket.blob(blob_name)
            blob.delete()
            logger.info(f"Resume deleted from GCS: {blob_name}")
            return True
        except Exception as e:
            logger.error(f"Failed to delete resume from GCS: {e}")
            return False
    
    def list_user_resumes(self, user_id: int) -> list:
        """
        List all resume files for a user.
        
        Args:
            user_id: User ID
        
        Returns:
            List of blob names
        """
        if not self.client:
            return []
        
        try:
            prefix = f"resumes/{user_id}/"
            blobs = self.client.list_blobs(self.bucket_name, prefix=prefix)
            return [blob.name for blob in blobs]
        except Exception as e:
            logger.error(f"Failed to list user resumes: {e}")
            return []
    
    def download_resume(self, blob_name: str) -> Optional[bytes]:
        """
        Download resume file from GCS.
        
        Args:
            blob_name: Full blob path
        
        Returns:
            File content as bytes or None if download fails
        """
        if not self.client:
            return None
        
        try:
            blob = self.bucket.blob(blob_name)
            return blob.download_as_bytes()
        except Exception as e:
            logger.error(f"Failed to download resume from GCS: {e}")
            return None


# Create singleton instance
gcs_service = GCSService()

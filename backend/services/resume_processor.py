"""Resume processing service."""
import base64
from typing import Tuple
from PyPDF2 import PdfReader
from docx import Document
from io import BytesIO


class ResumeProcessor:
    """Service for processing resume files."""
    
    def extract_text(self, file_data: bytes, filename: str) -> str:
        """Extract text from PDF or DOCX file.
        
        Args:
            file_data: Binary file data
            filename: Original filename with extension
            
        Returns:
            Extracted text from the file
        """
        file_ext = filename.lower().split('.')[-1]
        
        if file_ext == 'pdf':
            return self._extract_from_pdf(file_data)
        elif file_ext in ['doc', 'docx']:
            return self._extract_from_docx(file_data)
        else:
            raise ValueError(f"Unsupported file type: {file_ext}")
    
    def _extract_from_pdf(self, file_data: bytes) -> str:
        """Extract text from PDF file."""
        pdf_file = BytesIO(file_data)
        pdf_reader = PdfReader(pdf_file)
        
        text = ""
        for page in pdf_reader.pages:
            text += page.extract_text()
        
        return text.strip()
    
    def _extract_from_docx(self, file_data: bytes) -> str:
        """Extract text from DOCX file."""
        docx_file = BytesIO(file_data)
        doc = Document(docx_file)
        
        text = ""
        for paragraph in doc.paragraphs:
            text += paragraph.text + "\n"
        
        return text.strip()
    
    def decode_base64(self, base64_string: str) -> Tuple[bytes, str]:
        """Decode base64 file data.
        
        Args:
            base64_string: Base64 encoded file data with data URI prefix
            
        Returns:
            Tuple of (file_data, mime_type)
        """
        # Format: data:application/pdf;base64,<data>
        if ',' in base64_string:
            prefix, data = base64_string.split(',', 1)
            mime_type = prefix.split(':')[1].split(';')[0]
            file_data = base64.b64decode(data)
            return file_data, mime_type
        else:
            # Assume raw base64
            file_data = base64.b64decode(base64_string)
            return file_data, 'application/octet-stream'


resume_processor = ResumeProcessor()

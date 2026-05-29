import logging
from docx import Document

logger = logging.getLogger(__name__)

def parse_docx(file_obj):
    try:
        document = Document(file_obj)
        text = "\n".join([paragraph.text for paragraph in document.paragraphs if paragraph.text])
        return text
    except Exception as e:
        logger.error(f"Failed to parse docx: {e}")
        return ""

def parse_document(file_obj, filename):
    if filename.lower().endswith(".docx"):
        return parse_docx(file_obj)
    return ""

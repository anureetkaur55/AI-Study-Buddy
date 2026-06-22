import pypdf
from typing import Optional

def extract_text_from_pdf(file_path: str) -> str:
    """
    Extracts all text content from a PDF file page-by-page.
    """
    text_content = []
    try:
        reader = pypdf.PdfReader(file_path)
        for page in reader.pages:
            page_text = page.extract_text()
            if page_text:
                text_content.append(page_text)
        return "\n".join(text_content)
    except Exception as e:
        raise ValueError(f"Failed to parse PDF file: {str(e)}")

def extract_text_from_txt(file_path: str) -> str:
    """
    Extracts text from a text file, with UTF-8 and Latin-1 fallbacks.
    """
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            return f.read()
    except UnicodeDecodeError:
        with open(file_path, "r", encoding="latin-1") as f:
            return f.read()
    except Exception as e:
        raise ValueError(f"Failed to read text file: {str(e)}")

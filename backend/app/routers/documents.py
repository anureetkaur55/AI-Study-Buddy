import os
import uuid
import shutil
import datetime
from fastapi import APIRouter, UploadFile, File, HTTPException
from backend.app.config import settings
from backend.app.database import db
from backend.app.utils.pdf_extractor import extract_text_from_pdf, extract_text_from_txt

router = APIRouter(prefix="/api/documents", tags=["documents"])

@router.post("/upload")
async def upload_document(file: UploadFile = File(...)):
    """
    Accepts PDF or text files, uploads them to the server, 
    extracts their text content, and records metadata in the database.
    """
    filename = file.filename
    ext = os.path.splitext(filename)[1].lower()
    
    if ext not in [".pdf", ".txt", ".md"]:
        raise HTTPException(
            status_code=400, 
            detail="Unsupported file format. Only PDF, TXT, and MD files are allowed."
        )
        
    file_id = str(uuid.uuid4())
    save_path = os.path.join(settings.UPLOAD_DIR, f"{file_id}{ext}")
    
    try:
        # Save file to upload directory
        with open(save_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save file: {str(e)}")
        
    try:
        # Extract text based on file format
        if ext == ".pdf":
            text = extract_text_from_pdf(save_path)
        else:
            text = extract_text_from_txt(save_path)
    except Exception as e:
        # Cleanup uploaded file if parsing fails
        if os.path.exists(save_path):
            os.remove(save_path)
        raise HTTPException(
            status_code=400, 
            detail=f"Failed to extract content from file: {str(e)}"
        )
        
    word_count = len(text.split())
    upload_time = datetime.datetime.now().isoformat()
    
    # Save text and metadata to JSON database
    db.save_document(file_id, filename, text, upload_time)
    
    return {
        "file_id": file_id,
        "filename": filename,
        "word_count": word_count,
        "upload_time": upload_time
    }

@router.get("")
async def list_documents():
    """
    Returns list of metadata for all uploaded documents.
    """
    docs = db.get_documents()
    result = []
    for file_id, meta in docs.items():
        result.append({
            "file_id": file_id,
            "filename": meta["filename"],
            "word_count": len(meta.get("text", "").split()),
            "upload_time": meta.get("upload_time", "")
        })
    return result

@router.delete("/{file_id}")
async def delete_document(file_id: str):
    """
    Deletes an uploaded document from the disk and the database.
    """
    doc = db.get_document(file_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")
        
    # Attempt to delete file from disk
    for ext in [".pdf", ".txt", ".md"]:
        file_path = os.path.join(settings.UPLOAD_DIR, f"{file_id}{ext}")
        if os.path.exists(file_path):
            try:
                os.remove(file_path)
            except Exception as e:
                # Log error and continue deleting DB entry
                pass
            
    db.delete_document(file_id)
    return {"message": "Document deleted successfully."}

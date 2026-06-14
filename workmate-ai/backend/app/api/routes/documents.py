import os
import uuid
import shutil
from datetime import datetime
from fastapi import APIRouter, UploadFile, File, BackgroundTasks, HTTPException
from app.core.config import settings
from app.core.database import documents_collection
from app.services.rag_service import rag_service
from app.models.domain import DocumentResponse

router = APIRouter()

def process_document_background(doc_id: str, filepath: str, filename: str):
    try:
        rag_service.ingest_pdf(filepath, filename)
        documents_collection.update_one(
            {"_id": doc_id},
            {"$set": {"status": "indexed"}}
        )
    except Exception as e:
        documents_collection.update_one(
            {"_id": doc_id},
            {"$set": {"status": "failed"}}
        )

@router.post("/upload", response_model=DocumentResponse)
async def upload_document(background_tasks: BackgroundTasks, file: UploadFile = File(...)):
    ext = os.path.splitext(file.filename)[1].lower()
    if ext != ".pdf":
        raise HTTPException(status_code=400, detail="Only PDF documents are supported.")
        
    doc_id = str(uuid.uuid4())
    filename = file.filename
    filepath = os.path.join(settings.UPLOAD_DIR, f"{doc_id}.pdf")
    
    with open(filepath, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    doc = {
        "_id": doc_id,
        "filename": filename,
        "filepath": filepath,
        "status": "processing",
        "created_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    }
    
    documents_collection.insert_one(doc)
    
    background_tasks.add_task(process_document_background, doc_id, filepath, filename)
    
    doc["id"] = doc_id
    return doc

@router.get("", response_model=list[DocumentResponse])
async def get_documents():
    docs = list(documents_collection.find())
    for d in docs:
        d["id"] = str(d["_id"])
    docs.sort(key=lambda x: x.get("created_at", ""), reverse=True)
    return docs

@router.delete("/{doc_id}")
async def delete_document(doc_id: str):
    doc = documents_collection.find_one({"_id": doc_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")
        
    if doc.get("filepath") and os.path.exists(doc["filepath"]):
        try:
            os.remove(doc["filepath"])
        except Exception:
            pass
            
    rag_service.delete_document_index(doc["filename"])
    documents_collection.delete_one({"_id": doc_id})
    return {"message": "Document deleted successfully."}

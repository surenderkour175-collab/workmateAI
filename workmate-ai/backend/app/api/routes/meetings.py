import os
import uuid
import shutil
from datetime import datetime
from fastapi import APIRouter, UploadFile, File, BackgroundTasks, HTTPException
from app.core.config import settings
from app.core.database import meetings_collection
from app.services.ai_service import ai_service
from app.models.domain import MeetingResponse, ActionItem

router = APIRouter()

def process_meeting_background(meeting_id: str, filepath: str, filename: str):
    try:
        # 1. Transcribe audio
        transcript = ai_service.transcribe_audio(filepath, filename)
        
        # 2. Extract insights
        summary, action_items = ai_service.extract_insights(transcript, filename)
        
        # Convert action items to model schema
        parsed_action_items = []
        for item in action_items:
            parsed_action_items.append({
                "task": item.get("task", ""),
                "owner": item.get("owner", "Unassigned"),
                "due": item.get("due", "TBD")
            })
            
        # 3. Update database
        meetings_collection.update_one(
            {"_id": meeting_id},
            {
                "$set": {
                    "status": "completed",
                    "transcript": transcript,
                    "summary": summary,
                    "action_items": parsed_action_items
                }
            }
        )
    except Exception as e:
        meetings_collection.update_one(
            {"_id": meeting_id},
            {"$set": {"status": "failed", "summary": f"Failed to process: {str(e)}"}}
        )

@router.post("/upload", response_model=MeetingResponse)
async def upload_meeting(background_tasks: BackgroundTasks, file: UploadFile = File(...)):
    # Validate file extension
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in [".mp3", ".mp4", ".wav", ".m4a", ".mpeg"]:
        raise HTTPException(status_code=400, detail="Only audio/video files are supported (MP3, MP4, WAV, M4A).")
    
    meeting_id = str(uuid.uuid4())
    filename = file.filename
    filepath = os.path.join(settings.UPLOAD_DIR, f"{meeting_id}{ext}")
    
    # Save file to disk
    with open(filepath, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    # Create DB entry
    meeting_doc = {
        "_id": meeting_id,
        "filename": filename,
        "filepath": filepath,
        "status": "processing",
        "transcript": None,
        "summary": None,
        "action_items": [],
        "created_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    }
    
    meetings_collection.insert_one(meeting_doc)
    
    # Queue background processing
    background_tasks.add_task(process_meeting_background, meeting_id, filepath, filename)
    
    # Map back to domain model for response
    meeting_doc["id"] = meeting_id
    return meeting_doc

@router.get("", response_model=list[MeetingResponse])
async def get_meetings():
    docs = list(meetings_collection.find())
    for d in docs:
        d["id"] = str(d["_id"])
    docs.sort(key=lambda x: x.get("created_at", ""), reverse=True)
    return docs

@router.get("/{meeting_id}", response_model=MeetingResponse)
async def get_meeting(meeting_id: str):
    doc = meetings_collection.find_one({"_id": meeting_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Meeting not found.")
    doc["id"] = str(doc["_id"])
    return doc

@router.delete("/{meeting_id}")
async def delete_meeting(meeting_id: str):
    doc = meetings_collection.find_one({"_id": meeting_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Meeting not found.")
        
    # Remove file
    if doc.get("filepath") and os.path.exists(doc["filepath"]):
        try:
            os.remove(doc["filepath"])
        except Exception:
            pass
            
    meetings_collection.delete_one({"_id": meeting_id})
    return {"message": "Meeting deleted successfully."}

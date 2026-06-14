from fastapi import APIRouter
from app.models.domain import ChatRequest, ChatResponse
from app.services.rag_service import rag_service

router = APIRouter()

@router.post("", response_model=ChatResponse)
async def chat(request: ChatRequest):
    answer, sources = rag_service.query_rag(request.message)
    return ChatResponse(answer=answer, sources=sources)

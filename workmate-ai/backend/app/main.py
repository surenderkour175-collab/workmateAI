from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import meetings, documents, chat

app = FastAPI(
    title="WorkMate AI - Scaffold",
    description="FastAPI setup boilerplate",
    version="0.1.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(meetings.router, prefix="/api/meetings", tags=["meetings"])
app.include_router(documents.router, prefix="/api/documents", tags=["documents"])
app.include_router(chat.router, prefix="/api/chat", tags=["chat"])

@app.get("/")
async def root():
    return {"status": "scaffold online"}

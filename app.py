import os
from typing import List, Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from groq import AsyncGroq

# Load local environment variables
load_dotenv()

# Initialize FastAPI
app = FastAPI(title="Areesha's AI Assistant Backend (FastAPI)")

# Enable CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Helper function to lazily initialize the Groq client per request
def get_groq_client() -> AsyncGroq:
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise HTTPException(
            status_code=500, 
            detail="Missing GROQ_API_KEY environment variable on server."
        )
    return AsyncGroq(api_key=api_key)

# Pydantic models for request validation
class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    model: Optional[str] = "llama-3.1-8b-instant"
    max_tokens: Optional[int] = 500

@app.get("/")
@app.get("/api")
@app.get("/api/health")
def health_check():
    return {"status": "online", "framework": "FastAPI"}

# Handles both direct /chat and rewritten /api/chat paths from Vercel
@app.post("/chat")
@app.post("/api/chat")
async def chat(request_data: ChatRequest):
    client = get_groq_client()
    
    fallback_models = [
        request_data.model,
        'llama-3.3-70b-versatile',
        'openai/gpt-oss-20b'
    ]
    
    # Deduplicate fallback models while preserving order
    fallback_models = list(dict.fromkeys(fallback_models))
    
    groq_messages = [{"role": m.role, "content": m.content} for m in request_data.messages]
    last_error = None
    
    for model_id in fallback_models:
        try:
            print(f"Trying model: {model_id}...")
            completion = await client.chat.completions.create(
                model=model_id,
                messages=groq_messages,
                max_tokens=request_data.max_tokens
            )
            
            answer = completion.choices[0].message.content
            return {"response": answer, "used_model": model_id}
        
        except Exception as e:
            print(f"Model {model_id} failed: {str(e)}")
            last_error = str(e)
            continue
            
    raise HTTPException(
        status_code=500, 
        detail=f"All fallback models failed. Last error: {last_error}"
    )
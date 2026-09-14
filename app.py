import os
from typing import List, Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from groq import AsyncGroq

# Load environment variable files
load_dotenv()
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

if not GROQ_API_KEY:
    raise RuntimeError("Missing GROQ_API_KEY environment variable.")

# Initialize FastAPI
app = FastAPI(title="Areesha's AI Assistant Backend (FastAPI)")

# Enable CORS exactly as your React frontend expects
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize non-blocking Async Groq Client for multi-user concurrency
client = AsyncGroq(api_key=GROQ_API_KEY)

# Pydantic models for explicit Request Body validation
class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    model: Optional[str] = "llama-3.1-8b-instant"
    max_tokens: Optional[int] = 500

@app.get("/")
def health_check():
    return {"status": "online", "framework": "FastAPI"}

# The exact endpoint path your React code is sending POST requests to
@app.post("/api/chat")
async def chat(request_data: ChatRequest):
    # Setup fallback model sequence mirroring your original pipeline logic
    fallback_models = [
        request_data.model,
        'llama-3.3-70b-versatile',
        'openai/gpt-oss-20b'
    ]
    
    # Deduplicate fallback items while maintaining structural order
    fallback_models = list(dict.fromkeys(fallback_models))
    
    # Format your Pydantic data into raw dictionaries for the Groq SDK client
    groq_messages = [{"role": m.role, "content": m.content} for m in request_data.messages]
    
    last_error = None
    
    for model_id in fallback_models:
        try:
            print(f"Trying model: {model_id}...")
            # Non-blocking async API execution call
            completion = await client.chat.completions.create(
                model=model_id,
                messages=groq_messages,
                max_tokens=request_data.max_tokens
            )
            
            # FIXED: Access index 0 of choices list
            answer = completion.choices[0].message.content
            return {"response": answer, "used_model": model_id}
        
        except Exception as e:
            print(f"Model {model_id} failed: {str(e)}")
            last_error = str(e)
            continue
            
    # Raise a proper structured HTTP 500 Error back to the UI grid
    raise HTTPException(
        status_code=500, 
        detail=f"All fallback models failed. Last error: {last_error}"
    )
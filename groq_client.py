import os 
import time 
from dotenv import load_dotenv
from groq import Groq

def load_client():
    load_dotenv()
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise ValueError("GROQ_API_KEY not found.\n")
    return Groq(api_key=api_key)

def call_model(client, messages, model=None, max_tokens=None, max_retries=5):
    model = model or os.getenv("DEFAULT_MODEL", "qwen/qwen3.6-27b")
    max_tokens = max_tokens or int(os.getenv("MAX_TOKEN", "500"))

    last_error = None
    for attempt in range(1, max_retries + 1):
        try:
            response = client.chat.completions.create(
                model=model,
                max_tokens=max_tokens,
                messages=messages
            )
            return response.choices[0].message.content
        except Exception as e:
            last_error = e
            print(f"[attempt {attempt}/{max_retries}] API call failed: {e}")
            if attempt < max_retries:
                wait_seconds = 2 ** (attempt - 1)
                time.sleep(wait_seconds)
    return f"[Error: Could not get a response after {max_retries} attempts -- {last_error}]"
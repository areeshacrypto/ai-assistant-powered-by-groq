import json
import os 
from datetime import datetime

def get_system_prompt(mode):
    prompts = {
        "qa": (
            "You are a concise, helpful assistant. Answer the user's questions "
            "clearly and accurately. Keep answer under 4 sentences unless the "
            "user explicitly asks for more detail.format all replies and bold instead of asterisks"
            "wherever necessary and also show or put"
            "headers and use formatted text instead of symbols"
        ),
        "summarize": (
            "You are a summarization assistant. When the user gives you text "
            "respond with exactly 3 concise bullet points capturing the most "
            "important ideas. Do not add opinions or outside information.Make "
            "format all replies and bold instead of asterisks wherever necessary and also show or put"
            "headers and use formatted text instead of symbols"
        ),
        "math": (
            "You are a math assistant. Answer every single question that a user "
            "asks and reply to the point. Also explain the process strictly in "
            "steps and make sure to answer all kinds of math problems not just basic types include everything calculus linear algebra and all too. Make sure to format all replies format all replies and "
            "bold instead of asterisks wherever necessary and also show or put"
            "headers and use formatted text instead of symbols Also make sure to explain the steps in detail and also give examples if the user asks for a certain topic or concept and also make sure to give the user a detailed explanation of the topic or concept if the user asks for it. Make sure to answer all kinds of math problems not just basic types include everything calculus linear algebra and all too."
            "solve everything in absolute detail and make sure each step is there"
        ),
        "explain": (
            "You are an explainer assistant. Answer the user with at least a 10 line or more detailed paragraph."
            "format all replies and bold instead of asterisks wherever necessary and also show or put"
            "headers and use formatted text instead of symbols"
        )
    }
    if mode not in prompts:
        raise ValueError(f"Unknown mode '{mode}'. Choose from: {list(prompts.keys())}")
    return prompts[mode]

def estimate_tokens(text):
    return max(1, len(text) // 4)

def total_tokens_in_history(history):
    return sum(estimate_tokens(m["content"]) for m in history)

def save_session(history, mode):
    # Locates the exact directory containing utils.py to ensure logs land in project folder
    base_dir = os.path.dirname(os.path.abspath(__file__))
    logs_dir = os.path.join(base_dir, "logs")
    
    os.makedirs(logs_dir, exist_ok=True)
    timestamp = datetime.now().strftime("%d%m%Y_%H%M%S")
    filename = f"{mode}_session_{timestamp}.json"
    filepath = os.path.join(logs_dir, filename)
    
    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(history, f, indent=2)

    return filepath
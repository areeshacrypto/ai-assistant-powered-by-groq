import argparse 
import sys 
from groq_client import load_client, call_model 
from utils import get_system_prompt, estimate_tokens, total_tokens_in_history, save_session

def parse_args():
    parser = argparse.ArgumentParser(
        description="A simple LLM-powered CLI assistant, powered by Groq's free API."
    )
    parser.add_argument(
        "--mode",
        choices=["qa", "summarize", "math", "explain"],
        default="qa",
        help="Which assistant mode to run: 'qa' (default), 'summarize', 'math', 'explain'.",
    )
    parser.add_argument(
        "--max-tokens",
        type=int,
        default=None,
        help="Override the maximum reply length (in tokens). Defaults to the "
             "MAX_TOKENS environment variable, or 500 if that isn't set either.",
    )
    return parser.parse_args()


def print_welcome(mode):
    mode_labels = {
        "qa": "Q&A Assistant",
        "summarize": "Summarizer",
        "math": "Math Solver",
        "explain": "Concept Explainer"
    }
    mode_label = mode_labels.get(mode, "Assistant")
    
    print(f"  Areesha's CLI Assistant -- {mode_label} mode")
    print("Type your message and press Enter.")
    print("Type 'quit' (or press Ctrl+C) to exit and save this session.\n")


def run(mode="qa", max_tokens=None):
    try:
        client = load_client()
    except ValueError as e:
        print(f"Setup required:\n{e}")
        sys.exit(1)

    system_prompt = get_system_prompt(mode)
    history = [{"role": "system", "content": system_prompt}]

    print_welcome(mode)
    try:
        while True:
            user_input = input("You: ").strip()
            if not user_input:
                continue

            if user_input.lower() in ("quit", "exit"):
                break

            history.append({"role": "user", "content": user_input})
            token_count = total_tokens_in_history(history)
            
            if token_count > 3000:
                print(f"  (Note: conversation is getting long — ~{token_count} "
                      f"estimated tokens so far.)")
            if token_count > 5000:
                print(f"Session ended! Conversation has reached the context window limit - ~{token_count}")
                break

            print("Assistant: ", end="", flush=True)
            reply = call_model(client, history, max_tokens=max_tokens)
            print(reply)

            history.append({"role": "assistant", "content": reply})

    except KeyboardInterrupt:
        print("\n(Interrupted.)")

    finally:
        if len(history) > 1:
            try:
                filepath = save_session(history, mode)
                msg_count = len(history) - 1
                print(f"\n[LOG SAVED] {msg_count} message(s) saved to: {filepath}")
            except Exception as e:
                print(f"\n[LOG ERROR] Could not save session: {e}")
        else:
            print("\nNo messages exchanged -- nothing to save.")


if __name__ == "__main__":
    args = parse_args()
    run(mode=args.mode, max_tokens=args.max_tokens)
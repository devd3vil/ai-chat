import json
import httpx

MODEL = "llama3.1"
URL = "http://localhost:11434/api/generate"

def stream(prompt: str):
    with httpx.stream("POST", URL, json={"model": MODEL, "prompt": prompt, "stream": True}, timeout=120) as r:
        r.raise_for_status()
        for line in r.iter_lines():
            if not line:
                continue
            chunk = json.loads(line)
            if "response" in chunk:
                print(chunk["response"], end="", flush=True)
            if chunk.get("done"):
                print()

if __name__ == "__main__":
    stream("Explain in 5 bullet points how to test a FastAPI endpoint.")

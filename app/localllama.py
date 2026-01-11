"""Local LLaMA integration module for AI-app.

This module handles communication with a local Ollama LLaMA server.
Ensure Ollama is running and the llama3.2 model is available:
    ollama serve
    ollama pull llama3.2

Dependencies:
- httpx: HTTP client for streaming responses
- json: JSON parsing for Ollama API responses
- os: Environment variable access
"""

import json
import os
import httpx

# LLaMA model to use (must be available in local Ollama)
MODEL = "llama3.2"

# Ollama server configuration
# Read from environment variable, default to localhost for local development
# In Docker, set OLLAMA_HOST=ollama in docker-compose.yaml
OLLAMA_HOST = os.environ.get("OLLAMA_HOST", "localhost")
OLLAMA_PORT = os.environ.get("OLLAMA_PORT", "11434")
URL = f"http://{OLLAMA_HOST}:{OLLAMA_PORT}/api/generate"

def stream(prompt: str) -> str:
    """Stream tokens from local LLaMA and return complete response.
    
    This function streams individual tokens from the Ollama API, prints
    them to stdout for real-time feedback, and returns the complete
    concatenated response.
    
    Args:
        prompt: The input text prompt for the LLM
        
    Returns:
        str: The complete generated response
        
    Raises:
        httpx.HTTPError: If the Ollama API call fails
        json.JSONDecodeError: If response parsing fails
    """
    result_parts = []
    
    # Stream from Ollama API with 120 second timeout
    with httpx.stream(
        "POST",
        URL,
        json={"model": MODEL, "prompt": prompt, "stream": True},
        timeout=120
    ) as r:
        r.raise_for_status() 

        
        # Process each line of the streaming response
        for line in r.iter_lines():
            if not line:
                continue
                
            # Parse JSON chunk from Ollama
            chunk = json.loads(line)
            
            # Extract token if present and print for user feedback
            if "response" in chunk:
                token = chunk["response"]
                print(token, end="", flush=True)  # Real-time feedback to CLI
                result_parts.append(token)
                
            # Stop when generation is complete
            if chunk.get("done"):
                print()  # Newline after completion

    # Return full generated text by joining all tokens
    return "".join(result_parts)


def stream_tokens(prompt: str):
    """Generator that yields individual tokens from local LLaMA.
    
    This is a generator function that yields tokens as they are produced
    by the LLaMA model. Ideal for streaming responses to clients without
    waiting for complete generation. No output to stdout.
    
    Args:
        prompt: The input text prompt for the LLM
        
    Yields:
        str: Individual tokens as they are generated
        
    Raises:
        httpx.HTTPError: If the Ollama API call fails
        json.JSONDecodeError: If response parsing fails
        
    Example:
        for token in stream_tokens("Hello, world!"):
            print(token, end="", flush=True)
    """
    # Stream from Ollama API with 120 second timeout
    with httpx.stream(
        "POST",
        URL,
        json={"model": MODEL, "prompt": prompt, "stream": True},
        timeout=120,
    ) as r:
        r.raise_for_status()
        
        # Process each line of the streaming response
        for line in r.iter_lines():
            if not line:
                continue
                
            # Parse JSON chunk from Ollama
            chunk = json.loads(line)
            
            # Yield token if present
            token = chunk.get("response", "")
            if token:
                yield token
                
            # Stop when generation is complete
            if chunk.get("done"):
                return


if __name__ == "__main__":
    """Direct execution for testing local LLaMA connection.
    
    Run this module directly to test if the local Ollama server is
    working and the llama3.1 model is available.
    
    Usage:
        python app/localllama.py
    """
    stream("Explain in 5 bullet points how to test a FastAPI endpoint.")
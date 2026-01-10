import os
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()
KEY = os.environ["OPEN_ROUTER_API_KEY"]

client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=KEY,
    default_headers={
        "HTTP-Referer": "http://localhost:8000",  # or your site
        "X-Title": "My Local Test App",
    },
)

resp = client.responses.create(
    model="openai/gpt-4o", input="What is the meaning of life?", max_output_tokens=100
)

print(resp.output_text)

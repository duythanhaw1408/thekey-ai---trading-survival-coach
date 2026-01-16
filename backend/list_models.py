import os
from google import genai
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv('GEMINI_API_KEY')
client = genai.Client(api_key=api_key)

try:
    print("Listing available models...")
    for model in client.models.list():
        print(f"Name: {model.name}")
        # print(f"Supported Methods: {getattr(model, 'supported_methods', 'N/A')}")
except Exception as e:
    print(f"Error: {e}")

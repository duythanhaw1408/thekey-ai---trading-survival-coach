#!/usr/bin/env python3
"""
Test gemini-1.5-flash using the OLDER SDK (google-generativeai)
as recommended by user.

Usage:
  cd backend
  python3 test_flash_old_sdk.py
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from dotenv import load_dotenv
load_dotenv()

# Use the OLDER SDK: google-generativeai
import google.generativeai as genai

def main():
    api_key = os.getenv('GEMINI_API_KEY')
    if not api_key:
        print("❌ GEMINI_API_KEY not found!")
        return
    
    print(f"🔑 API Key: {api_key[:10]}...{api_key[-4:]}")
    print("="*60)
    
    # Configure with old SDK
    genai.configure(api_key=api_key)
    
    # Test 1: List models to see if 1.5-flash is available
    print("\n📋 Listing models with OLD SDK (google-generativeai):")
    print("-"*60)
    
    flash_models = []
    try:
        for m in genai.list_models():
            if 'generateContent' in [method.name for method in m.supported_generation_methods]:
                if '1.5-flash' in m.name.lower():
                    flash_models.append(m.name)
                    print(f"   ✅ {m.name}")
    except Exception as e:
        print(f"   ❌ Error listing models: {e}")
    
    if not flash_models:
        print("   ⚠️ No gemini-1.5-flash models found!")
    
    # Test 2: Try to use gemini-1.5-flash directly
    print("\n🧪 Testing gemini-1.5-flash directly:")
    print("-"*60)
    
    test_models = [
        'gemini-1.5-flash',
        'gemini-1.5-flash-latest', 
        'gemini-1.5-flash-001',
        'models/gemini-1.5-flash',
    ]
    
    for model_name in test_models:
        try:
            model = genai.GenerativeModel(model_name)
            response = model.generate_content("Say 'Hello THEKEY' in Vietnamese")
            print(f"   ✅ {model_name}: {response.text[:50]}...")
            print(f"\n🎉 SUCCESS! Model '{model_name}' works!")
            print(f"   Use this in gemini_client.py")
            return  # Stop on first success
        except Exception as e:
            error_msg = str(e)[:80]
            print(f"   ❌ {model_name}: {error_msg}")
    
    print("\n⚠️ None of the gemini-1.5-flash variants worked.")
    print("   Possible solutions:")
    print("   1. Create new API key from https://aistudio.google.com")
    print("   2. Enable Generative Language API in Google Cloud Console")
    print("   3. Check billing settings")

if __name__ == "__main__":
    main()

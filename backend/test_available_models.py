#!/usr/bin/env python3
"""
Test script to list all available Gemini models for your API key.
Run this to find the correct model names for gemini-1.5-flash.

Usage:
  cd backend
  python test_available_models.py
"""
import os
import sys

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from dotenv import load_dotenv
load_dotenv()

from google import genai

def main():
    api_key = os.getenv('GEMINI_API_KEY')
    if not api_key:
        print("❌ GEMINI_API_KEY not found in environment!")
        return
    
    print(f"🔑 API Key: {api_key[:10]}...{api_key[-4:]}")
    print("\n" + "="*60)
    print("📋 Available Models for your API Key:")
    print("="*60 + "\n")
    
    client = genai.Client(api_key=api_key)
    
    flash_models = []
    pro_models = []
    other_models = []
    
    try:
        for model in client.models.list():
            model_name = model.name
            
            # Check if model supports generateContent
            supported_methods = getattr(model, 'supported_generation_methods', [])
            supports_generate = 'generateContent' in str(supported_methods) if supported_methods else True
            
            if '1.5-flash' in model_name.lower():
                flash_models.append((model_name, supports_generate))
            elif '1.5-pro' in model_name.lower() or 'pro' in model_name.lower():
                pro_models.append((model_name, supports_generate))
            else:
                other_models.append((model_name, supports_generate))
        
        print("🚀 GEMINI 1.5 FLASH Models (FREE TIER RECOMMENDED):")
        if flash_models:
            for name, gen in flash_models:
                status = "✅ generateContent" if gen else "❓ unknown"
                print(f"   • {name} [{status}]")
        else:
            print("   ⚠️ No 1.5-flash models found!")
        
        print("\n🧠 PRO Models:")
        if pro_models:
            for name, gen in pro_models:
                status = "✅ generateContent" if gen else "❓ unknown"
                print(f"   • {name} [{status}]")
        else:
            print("   ⚠️ No pro models found!")
        
        print("\n📦 Other Models:")
        for name, gen in other_models[:10]:  # Limit to 10
            status = "✅ generateContent" if gen else "❓ unknown"
            print(f"   • {name} [{status}]")
        
        if len(other_models) > 10:
            print(f"   ... và {len(other_models) - 10} models khác")
        
        print("\n" + "="*60)
        print("💡 RECOMMENDATION:")
        print("="*60)
        
        if flash_models:
            recommended = flash_models[0][0]
            print(f"✅ Use this model name in gemini_client.py:")
            print(f"   '{recommended}'")
            print(f"\n   Hoặc thử: 'gemini-1.5-flash-latest' hoặc 'gemini-1.5-flash-001'")
        else:
            print("⚠️ gemini-1.5-flash không available với API key này!")
            print("   Có thể cần:")
            print("   1. Enable Generative Language API trong Google Cloud Console")
            print("   2. Kiểm tra billing account")
            print("   3. Tạo API key mới từ https://aistudio.google.com")
            
    except Exception as e:
        print(f"❌ Error listing models: {e}")
        print("\n💡 Possible solutions:")
        print("   1. Check if API key is valid")
        print("   2. Enable Generative Language API in Google Cloud Console")
        print("   3. Check network/proxy settings")

if __name__ == "__main__":
    main()

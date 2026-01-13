#!/usr/bin/env python3
"""
Test script following the exact guide provided by user.
Must create API key in NEW PROJECT from Google AI Studio.

Usage:
  cd backend
  python3 test_guide_flash.py
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from dotenv import load_dotenv

# Load biến môi trường từ file .env
load_dotenv()

import google.generativeai as genai

# Lấy key an toàn (support both GOOGLE_API_KEY and GEMINI_API_KEY)
api_key = os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY")

if not api_key:
    print("❌ Lỗi: Chưa tìm thấy API Key trong file .env")
    print("   Cần có GOOGLE_API_KEY hoặc GEMINI_API_KEY")
else:
    print(f"🔑 API Key: {api_key[:10]}...{api_key[-4:]}")
    print("="*60)
    
    genai.configure(api_key=api_key)
    
    # Cấu hình Model Flash (Dành cho Dev Test)
    generation_config = {
        "temperature": 1,  # Độ sáng tạo (0-2)
        "top_p": 0.95,
        "top_k": 64,
        "max_output_tokens": 8192,  # Độ dài câu trả lời
    }

    try:
        # Gọi đúng tên model Flash
        model = genai.GenerativeModel(
            model_name="gemini-1.5-flash", 
            generation_config=generation_config
        )

        print("🚀 Đang gửi request test tới Gemini 1.5 Flash...")
        response = model.generate_content("Chào bạn, hãy nói 'THEKEY Trading Coach hoạt động!' bằng tiếng Việt.")
        
        print("✅ Kết quả:")
        print(response.text)
        print("\n" + "="*60)
        print("🎉 SUCCESS! gemini-1.5-flash hoạt động!")
        print("   Có thể cập nhật gemini_client.py để dùng model này.")
        
    except Exception as e:
        error_str = str(e)
        print(f"❌ Có lỗi xảy ra: {error_str[:200]}")
        
        if "404" in error_str:
            print("\n💡 Lỗi 404 = Model không available.")
            print("   Giải pháp: Tạo API key MỚI trong project MỚI từ:")
            print("   👉 https://aistudio.google.com/app/apikey")
            print("   Chọn 'Create API key in a new project'")

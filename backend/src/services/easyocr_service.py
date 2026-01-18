#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
EasyOCR Service for extracting text from utility bills
"""

import sys
import json
import base64
from io import BytesIO
from PIL import Image
import easyocr
import os

# Initialize EasyOCR reader (English only for faster performance)
# Models will be downloaded to ~/.EasyOCR/ on first run
reader = None

def init_reader():
    """Initialize EasyOCR reader lazily"""
    global reader
    if reader is None:
        print("🔧 Initializing EasyOCR (first run will download models)...", file=sys.stderr)
        reader = easyocr.Reader(['en'], gpu=False)  # Set gpu=True if CUDA available
        print("✅ EasyOCR initialized", file=sys.stderr)

def extract_text_from_base64(base64_string):
    """
    Extract text from base64 encoded image using EasyOCR
    
    Args:
        base64_string: Base64 encoded image data
        
    Returns:
        dict: {"success": True, "text": "extracted text"} or {"success": False, "error": "message"}
    """
    try:
        # Initialize reader if needed
        init_reader()
        
        # Decode base64 to image
        image_data = base64.b64decode(base64_string)
        image = Image.open(BytesIO(image_data))
        
        # Convert to RGB if needed (EasyOCR expects RGB)
        if image.mode != 'RGB':
            image = image.convert('RGB')
        
        # Perform OCR
        print("📸 Running EasyOCR on image...", file=sys.stderr)
        result = reader.readtext(image, detail=0, paragraph=True)
        
        # Combine all text blocks with newlines
        extracted_text = '\n'.join(result)
        
        print(f"✅ EasyOCR extracted {len(extracted_text)} characters", file=sys.stderr)
        
        return {
            "success": True,
            "text": extracted_text,
            "char_count": len(extracted_text)
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

def main():
    """Main entry point - read base64 from stdin, write JSON to stdout"""
    if len(sys.argv) < 2:
        print(json.dumps({"success": False, "error": "Usage: python easyocr_service.py <base64_image>"}))
        sys.exit(1)
    
    base64_image = sys.argv[1]
    result = extract_text_from_base64(base64_image)
    print(json.dumps(result))

if __name__ == "__main__":
    main()

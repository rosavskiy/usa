# EasyOCR Setup Instructions

EasyOCR is a local Python-based OCR service that provides high accuracy (~90%) without requiring API keys.

## Prerequisites

1. **Python 3.7 or higher**
   - Download from: https://www.python.org/downloads/
   - Make sure to check "Add Python to PATH" during installation

2. **Verify Python installation:**
   ```bash
   python --version
   # Should show: Python 3.x.x
   ```

## Installation Steps

### 1. Install Python Dependencies

Navigate to the backend folder and install required packages:

```bash
cd C:\usa\backend
pip install -r requirements.txt
```

**Note:** First run will download ~1GB of EasyOCR models to `~/.EasyOCR/`

### 2. Test EasyOCR

Test the Python script manually:

```bash
cd C:\usa\backend\src\services
python easyocr_service.py "test_base64_string_here"
```

Expected output:
```json
{"success": true, "text": "extracted text", "char_count": 123}
```

### 3. Restart Backend

The Node.js backend will automatically use EasyOCR:

```bash
cd C:\usa\backend
npm run dev
```

## How It Works

1. **Priority Chain:**
   - EasyOCR (local Python) - tried first ✅
   - Azure Computer Vision - tried second
   - OCR.space - fallback

2. **Automatic Fallback:**
   - If Python is not installed, automatically falls back to OCR.space
   - No configuration changes needed

3. **Performance:**
   - First run: ~10-15 seconds (model loading)
   - Subsequent runs: ~3-5 seconds per image
   - Accuracy: ~90% (vs OCR.space 75%)

## Troubleshooting

### Python not found
```
Error: python: command not found
```
**Solution:** Install Python and add to PATH

### Missing dependencies
```
ModuleNotFoundError: No module named 'easyocr'
```
**Solution:** Run `pip install -r requirements.txt`

### GPU Support (Optional)
To enable GPU acceleration (if you have NVIDIA GPU):
1. Install CUDA toolkit
2. Change `gpu=False` to `gpu=True` in `easyocr_service.py` line 19
3. Performance: ~1-2 seconds per image

## Advantages

✅ **Free** - No API costs
✅ **Offline** - Works without internet
✅ **High Accuracy** - ~90% text extraction
✅ **Privacy** - All processing local
✅ **No Rate Limits** - Process unlimited images

## System Requirements

- **Disk Space:** ~2GB (Python + PyTorch + EasyOCR models)
- **RAM:** 2GB minimum, 4GB recommended
- **CPU:** Any modern processor (GPU optional)

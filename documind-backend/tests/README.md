# Document Ingestion Test Suite

This directory contains comprehensive test scripts for the document ingestion system.

## Test Scripts

### 1. `test_document_loaders.py`
**Comprehensive unit tests for all document loaders**

Run all tests:
```bash
python tests/test_document_loaders.py
```

Or with pytest:
```bash
pytest tests/test_document_loaders.py -v
```

**What it tests:**
- Document loader factory
- PDF loader
- Text loader
- Markdown loader
- CSV loader
- Image OCR loader
- Document ingestion service

### 2. `test_with_sample_files.py`
**Test with your own files**

Usage:
```bash
# Test a single file
python tests/test_with_sample_files.py sample.pdf

# Test multiple files
python tests/test_with_sample_files.py sample.pdf sample.docx sample.txt sample.png
```

**What it does:**
- Validates file before processing
- Ingests document and extracts content
- Shows detailed results including:
  - Text extraction
  - Metadata
  - Page/table counts
  - OCR confidence (for images)
  - Text preview

### 3. `test_ocr_engines.py`
**Test OCR functionality**

Usage:
```bash
# Check OCR engine availability
python tests/test_ocr_engines.py

# Test OCR with an image
python tests/test_ocr_engines.py sample.png
```

**What it does:**
- Checks which OCR engines are available (EasyOCR/Tesseract)
- Tests OCR with provided image
- Shows extracted text and confidence scores
- Creates test image if none provided

## Quick Start

1. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Run basic tests:**
   ```bash
   python tests/test_document_loaders.py
   ```

3. **Test with your files:**
   ```bash
   python tests/test_with_sample_files.py path/to/your/document.pdf
   ```

4. **Test OCR:**
   ```bash
   python tests/test_ocr_engines.py path/to/your/image.png
   ```

## Test Coverage

### ✅ Document Loaders
- [x] PDF loader
- [x] DOCX loader
- [x] Text loader
- [x] Markdown loader
- [x] Excel loader
- [x] CSV loader
- [x] PowerPoint loader
- [x] Image OCR loader

### ✅ Core Features
- [x] Format detection
- [x] Error handling
- [x] Metadata extraction
- [x] Streaming support
- [x] OCR engines (EasyOCR/Tesseract)

### ✅ Integration
- [x] Document ingestion service
- [x] File validation
- [x] End-to-end processing

## Creating Test Files

### PDF Test File
Create a simple PDF or use any existing PDF file.

### DOCX Test File
Create a Word document with some text and tables.

### Text Test File
Create a `.txt` file with UTF-8 content:
```txt
Hello, World!
This is a test file.
```

### Markdown Test File
Create a `.md` file:
```markdown
# Heading 1
## Heading 2
This is a paragraph with [a link](https://example.com).
```

### CSV Test File
Create a `.csv` file:
```csv
Name,Age,City
John,30,New York
Jane,25,London
```

### Image Test File
Use any image file (PNG, JPG, etc.) with text in it for OCR testing.

## Troubleshooting

### OCR Not Working
- **EasyOCR not installed**: `pip install easyocr`
- **First run slow**: EasyOCR downloads models on first use (one-time, ~500MB-1GB)
- **No text extracted**: Image may not contain clear text

### Import Errors
- Make sure you're in the `documind-backend` directory
- Install all dependencies: `pip install -r requirements.txt`

### File Not Found Errors
- Check file paths are correct
- Use absolute paths if relative paths don't work

## Expected Output

### Successful Test
```
✅ PDF loader creation works
✅ Text loader works - extracted 25 characters
✅ Document ingestion works - extracted 25 characters
```

### Failed Test
```
❌ PDF loader test failed: File not found
```

## Continuous Integration

These tests can be integrated into CI/CD pipelines:

```yaml
# Example GitHub Actions
- name: Run tests
  run: |
    pip install -r requirements.txt
    pytest tests/test_document_loaders.py -v
```

## Notes

- Some tests require actual files (use `test_with_sample_files.py`)
- OCR tests require EasyOCR or Tesseract to be installed
- First OCR operation may be slow (model download)
- Tests create temporary files that are automatically cleaned up


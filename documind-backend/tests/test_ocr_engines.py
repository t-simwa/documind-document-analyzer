"""
Test OCR engines (EasyOCR and Tesseract)
This script helps verify OCR functionality

Usage:
    python tests/test_ocr_engines.py <image_path>
"""

import sys
from pathlib import Path
from PIL import Image
import tempfile
import os

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.services.document_loaders.image_loader import (
    EASYOCR_AVAILABLE,
    TESSERACT_AVAILABLE,
    ImageLoader
)


def test_ocr_availability():
    """Test which OCR engines are available"""
    print("\n" + "="*60)
    print("OCR ENGINE AVAILABILITY CHECK")
    print("="*60 + "\n")
    
    print("🔍 Checking OCR engines...\n")
    
    if EASYOCR_AVAILABLE:
        print("✅ EasyOCR: AVAILABLE (Recommended)")
        print("   - Pip-installable")
        print("   - Cloud-ready")
        print("   - No system dependencies")
    else:
        print("❌ EasyOCR: NOT AVAILABLE")
        print("   Install with: pip install easyocr")
    
    print()
    
    if TESSERACT_AVAILABLE:
        try:
            import pytesseract
            # Try to get version
            try:
                version = pytesseract.get_tesseract_version()
                print(f"✅ Tesseract: AVAILABLE (v{version})")
            except:
                print("✅ Tesseract: AVAILABLE (version unknown)")
            print("   - Requires system installation")
            print("   - Not recommended for cloud deployment")
        except Exception as e:
            print(f"⚠️  Tesseract: PARTIALLY AVAILABLE (error: {e})")
    else:
        print("❌ Tesseract: NOT AVAILABLE")
        print("   Install with: pip install pytesseract")
        print("   Then install Tesseract OCR system package")
    
    print()
    
    if EASYOCR_AVAILABLE:
        print("✅ OCR is ready! EasyOCR will be used.")
        return True
    elif TESSERACT_AVAILABLE:
        print("⚠️  OCR is available but using Tesseract (not recommended for cloud)")
        return True
    else:
        print("❌ No OCR engine available!")
        print("\n💡 Recommendation:")
        print("   Install EasyOCR: pip install easyocr")
        return False


def test_ocr_with_image(image_path: str):
    """Test OCR with an actual image"""
    print("\n" + "="*60)
    print(f"TESTING OCR WITH: {image_path}")
    print("="*60 + "\n")
    
    path = Path(image_path)
    
    if not path.exists():
        print(f"❌ Error: Image not found: {image_path}")
        return False
    
    # Check if it's an image
    try:
        img = Image.open(path)
        print(f"✅ Image loaded: {img.size[0]}x{img.size[1]} pixels, format: {img.format}")
    except Exception as e:
        print(f"❌ Error: Not a valid image file: {e}")
        return False
    
    try:
        # Test with ImageLoader
        print("\n🔄 Running OCR...")
        loader = ImageLoader(str(path))
        content = loader.load()
        
        print(f"\n✅ OCR Successful!")
        print(f"\n📊 Results:")
        print(f"   Extraction Method: {content.metadata.get('extraction_method', 'unknown')}")
        print(f"   Text Length: {len(content.text)} characters")
        print(f"   Word Count: {content.metadata.get('word_count', 0)}")
        print(f"   Line Count: {content.metadata.get('line_count', 0)}")
        
        # OCR confidence
        if 'ocr_confidence_avg' in content.metadata:
            print(f"\n🔍 OCR Confidence:")
            print(f"   Average: {content.metadata['ocr_confidence_avg']}%")
            print(f"   Min: {content.metadata['ocr_confidence_min']}%")
            print(f"   Max: {content.metadata['ocr_confidence_max']}%")
        
        # Show extracted text
        if content.text.strip():
            print(f"\n📄 Extracted Text:")
            print("-" * 60)
            print(content.text[:500])  # First 500 chars
            if len(content.text) > 500:
                print(f"\n... (truncated, total {len(content.text)} characters)")
            print("-" * 60)
        else:
            print("\n⚠️  No text extracted from image")
            print("   This could mean:")
            print("   - Image has no text")
            print("   - Text is too small or unclear")
            print("   - OCR confidence is too low")
        
        return True
        
    except Exception as e:
        print(f"\n❌ OCR Error: {str(e)}")
        import traceback
        traceback.print_exc()
        return False


def create_test_image_with_text():
    """Create a simple test image with text for testing"""
    try:
        from PIL import Image, ImageDraw, ImageFont
        
        # Create image
        img = Image.new('RGB', (400, 200), color='white')
        draw = ImageDraw.Draw(img)
        
        # Try to use a font, fallback to default if not available
        try:
            # Try to use a system font
            font = ImageFont.truetype("arial.ttf", 24)
        except:
            try:
                font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 24)
            except:
                font = ImageFont.load_default()
        
        # Draw text
        text = "Hello, World!\nThis is a test image\nfor OCR testing."
        draw.text((20, 50), text, fill='black', font=font)
        
        # Save to temp file
        with tempfile.NamedTemporaryFile(suffix='.png', delete=False) as tmp:
            img.save(tmp.name, 'PNG')
            return tmp.name
            
    except Exception as e:
        print(f"⚠️  Could not create test image: {e}")
        return None


def main():
    """Main function"""
    print("\n" + "="*60)
    print("OCR ENGINE TESTING")
    print("="*60)
    
    # Check availability
    ocr_available = test_ocr_availability()
    
    if len(sys.argv) > 1:
        # Test with provided image
        image_path = sys.argv[1]
        if Path(image_path).exists():
            test_ocr_with_image(image_path)
        else:
            print(f"\n❌ Error: Image not found: {image_path}")
            sys.exit(1)
    else:
        # Create and test with sample image
        print("\n💡 No image provided. Creating test image...")
        test_image = create_test_image_with_text()
        
        if test_image:
            try:
                test_ocr_with_image(test_image)
            finally:
                # Clean up
                if os.path.exists(test_image):
                    os.unlink(test_image)
        else:
            print("\n❌ Could not create test image")
            print("\nUsage: python test_ocr_engines.py <image_path>")
            print("Example: python test_ocr_engines.py sample.png")
            sys.exit(1)
    
    print("\n" + "="*60)
    if ocr_available:
        print("✅ OCR testing complete!")
    else:
        print("⚠️  OCR testing complete, but no OCR engine is available")
    print("="*60 + "\n")


if __name__ == "__main__":
    main()


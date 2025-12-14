"""
Quick test script - Run this first to verify everything is set up correctly
Usage: python tests/quick_test.py
"""

import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

def check_imports():
    """Check if all required modules can be imported"""
    print("🔍 Checking imports...")
    
    issues = []
    
    # Core imports
    try:
        from app.services.document_loaders import DocumentLoaderFactory
        print("  ✅ Document loader factory")
    except ImportError as e:
        print(f"  ❌ Document loader factory: {e}")
        issues.append("Document loader factory")
    
    try:
        from app.services.document_ingestion import DocumentIngestionService
        print("  ✅ Document ingestion service")
    except ImportError as e:
        print(f"  ❌ Document ingestion service: {e}")
        issues.append("Document ingestion service")
    
    # Loader imports
    loaders = [
        ('PDFLoader', 'PDF'),
        ('DOCXLoader', 'DOCX'),
        ('TextLoader', 'Text'),
        ('MarkdownLoader', 'Markdown'),
        ('CSVLoader', 'CSV'),
        ('ExcelLoader', 'Excel'),
        ('PPTXLoader', 'PowerPoint'),
        ('ImageLoader', 'Image OCR'),
    ]
    
    for loader_name, display_name in loaders:
        try:
            from app.services.document_loaders import (
                PDFLoader, DOCXLoader, TextLoader, MarkdownLoader,
                CSVLoader, ExcelLoader, PPTXLoader, ImageLoader
            )
            loader_map = {
                'PDFLoader': PDFLoader,
                'DOCXLoader': DOCXLoader,
                'TextLoader': TextLoader,
                'MarkdownLoader': MarkdownLoader,
                'CSVLoader': CSVLoader,
                'ExcelLoader': ExcelLoader,
                'PPTXLoader': PPTXLoader,
                'ImageLoader': ImageLoader,
            }
            if loader_name in loader_map:
                print(f"  ✅ {display_name} loader")
            else:
                print(f"  ❌ {display_name} loader: Not found")
                issues.append(f"{display_name} loader")
        except Exception as e:
            print(f"  ❌ {display_name} loader: {e}")
            issues.append(f"{display_name} loader")
    
    # OCR engines
    print("\n🔍 Checking OCR engines...")
    try:
        from app.services.document_loaders.image_loader import EASYOCR_AVAILABLE, TESSERACT_AVAILABLE
        
        if EASYOCR_AVAILABLE:
            print("  ✅ EasyOCR (recommended)")
        else:
            print("  ⚠️  EasyOCR not installed (install with: pip install easyocr)")
            issues.append("EasyOCR")
        
        if TESSERACT_AVAILABLE:
            print("  ✅ Tesseract (fallback)")
        else:
            print("  ⚠️  Tesseract not available (optional)")
    except Exception as e:
        print(f"  ❌ OCR check failed: {e}")
        issues.append("OCR check")
    
    return issues


def check_dependencies():
    """Check if required Python packages are installed"""
    print("\n🔍 Checking dependencies...")
    
    required_packages = [
        ('PyPDF2', 'PDF processing'),
        ('docx', 'DOCX processing'),
        ('openpyxl', 'Excel processing'),
        ('pptx', 'PowerPoint processing'),
        ('pandas', 'CSV/Excel processing'),
        ('Pillow', 'Image processing'),
        ('chardet', 'Encoding detection'),
        ('easyocr', 'OCR (recommended)'),
    ]
    
    issues = []
    
    for package_name, description in required_packages:
        try:
            __import__(package_name)
            print(f"  ✅ {package_name} ({description})")
        except ImportError:
            print(f"  ❌ {package_name} not installed ({description})")
            issues.append(package_name)
    
    return issues


def check_supported_formats():
    """Check supported file formats"""
    print("\n🔍 Checking supported formats...")
    
    try:
        from app.services.document_loaders import DocumentLoaderFactory
        
        extensions = DocumentLoaderFactory.get_supported_extensions()
        print(f"  ✅ {len(extensions)} file formats supported:")
        print(f"     {', '.join(sorted(extensions))}")
        
        return True
    except Exception as e:
        print(f"  ❌ Failed to get supported formats: {e}")
        return False


def main():
    """Run quick test"""
    print("\n" + "="*60)
    print("QUICK TEST - Document Ingestion System")
    print("="*60 + "\n")
    
    all_issues = []
    
    # Check imports
    import_issues = check_imports()
    all_issues.extend(import_issues)
    
    # Check dependencies
    dep_issues = check_dependencies()
    all_issues.extend(dep_issues)
    
    # Check formats
    formats_ok = check_supported_formats()
    
    # Summary
    print("\n" + "="*60)
    print("SUMMARY")
    print("="*60)
    
    if not all_issues and formats_ok:
        print("✅ All checks passed! System is ready to use.")
        print("\nNext steps:")
        print("  1. Run full tests: python tests/test_document_loaders.py")
        print("  2. Test with files: python tests/test_with_sample_files.py <file_path>")
        print("  3. Test OCR: python tests/test_ocr_engines.py <image_path>")
        return True
    else:
        print("⚠️  Some issues found:")
        for issue in all_issues:
            print(f"  - {issue}")
        
        if not formats_ok:
            print("  - Supported formats check failed")
        
        print("\n💡 To fix:")
        print("  1. Install missing dependencies: pip install -r requirements.txt")
        print("  2. Check import paths")
        print("  3. Verify file structure")
        return False


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)


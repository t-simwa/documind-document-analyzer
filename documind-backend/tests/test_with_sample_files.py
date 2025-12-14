"""
Test document loaders with actual sample files
This script helps you test with your own files

Usage:
    python tests/test_with_sample_files.py <file_path>
    
Example:
    python tests/test_with_sample_files.py sample.pdf
    python tests/test_with_sample_files.py sample.docx
    python tests/test_with_sample_files.py sample.png
"""

import sys
import asyncio
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.services.document_ingestion import DocumentIngestionService
from app.services.document_loaders import DocumentLoaderFactory, LoaderError


async def test_file(file_path: str):
    """Test a single file"""
    print("\n" + "="*60)
    print(f"TESTING: {file_path}")
    print("="*60)
    
    path = Path(file_path)
    
    if not path.exists():
        print(f"❌ Error: File not found: {file_path}")
        return False
    
    # Check if supported
    if not DocumentLoaderFactory.is_supported(file_path):
        print(f"❌ Error: Unsupported file type: {path.suffix}")
        print(f"Supported types: {', '.join(DocumentLoaderFactory.get_supported_extensions())}")
        return False
    
    try:
        # Validate file
        service = DocumentIngestionService()
        validation = service.validate_file(file_path)
        
        print(f"\n📋 Validation Results:")
        print(f"   Valid: {validation['valid']}")
        print(f"   File Size: {validation['file_size'] / 1024:.2f} KB")
        print(f"   Is Large: {validation['is_large']}")
        print(f"   Is Supported: {validation['is_supported']}")
        
        if validation['errors']:
            print(f"   Errors: {', '.join(validation['errors'])}")
        if validation['warnings']:
            print(f"   Warnings: {', '.join(validation['warnings'])}")
        
        if not validation['valid']:
            return False
        
        # Ingest document
        print(f"\n🔄 Ingesting document...")
        content = await service.ingest_document(file_path)
        
        # Display results
        print(f"\n✅ Ingestion Successful!")
        print(f"\n📊 Results:")
        print(f"   Text Length: {len(content.text)} characters")
        print(f"   Word Count: ~{len(content.text.split())} words")
        print(f"   Extraction Method: {content.metadata.get('extraction_method', 'unknown')}")
        
        # Page/Slide count
        if content.pages:
            print(f"   Pages/Slides: {len(content.pages)}")
        
        # Table count
        if content.tables:
            print(f"   Tables: {len(content.tables)}")
        
        # Image count
        if content.images:
            print(f"   Images: {len(content.images)}")
        
        # Metadata summary
        print(f"\n📝 Metadata:")
        important_metadata = [
            'file_name', 'file_size', 'file_extension',
            'page_count', 'table_count', 'paragraph_count',
            'ocr_language', 'encoding', 'sheet_count'
        ]
        
        for key in important_metadata:
            if key in content.metadata:
                value = content.metadata[key]
                print(f"   {key}: {value}")
        
        # Preprocessing metadata (new features)
        print(f"\n🔧 Preprocessing Results:")
        if 'page_numbers_removed' in content.metadata:
            print(f"   Page Numbers Removed: {content.metadata['page_numbers_removed']}")
        if 'headers_footers_removed' in content.metadata:
            print(f"   Headers/Footers Removed: {content.metadata['headers_footers_removed']}")
        if 'detected_language' in content.metadata:
            lang = content.metadata['detected_language']
            confidence = content.metadata.get('language_confidence', 0.0)
            print(f"   Detected Language: {lang} (confidence: {confidence:.2%})")
        
        # Show text preview
        if content.text:
            preview = content.text[:200].replace('\n', ' ')
            print(f"\n📄 Text Preview (first 200 chars):")
            print(f"   {preview}...")
        
        # OCR confidence (if available)
        if 'ocr_confidence_avg' in content.metadata:
            print(f"\n🔍 OCR Confidence:")
            print(f"   Average: {content.metadata['ocr_confidence_avg']}%")
            print(f"   Min: {content.metadata['ocr_confidence_min']}%")
            print(f"   Max: {content.metadata['ocr_confidence_max']}%")
        
        return True
        
    except LoaderError as e:
        print(f"\n❌ Loader Error: {e.message}")
        if e.file_path:
            print(f"   File: {e.file_path}")
        return False
    
    except Exception as e:
        print(f"\n❌ Unexpected Error: {str(e)}")
        import traceback
        traceback.print_exc()
        return False


async def test_multiple_files(file_paths: list):
    """Test multiple files"""
    print("\n" + "="*60)
    print("BATCH TESTING MULTIPLE FILES")
    print("="*60)
    
    results = []
    for file_path in file_paths:
        success = await test_file(file_path)
        results.append((file_path, success))
    
    # Summary
    print("\n" + "="*60)
    print("BATCH TEST SUMMARY")
    print("="*60)
    
    passed = sum(1 for _, success in results if success)
    failed = len(results) - passed
    
    for file_path, success in results:
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status}: {file_path}")
    
    print(f"\nTotal: {len(results)} | Passed: {passed} | Failed: {failed}")
    print("="*60 + "\n")
    
    return failed == 0


def main():
    """Main function"""
    if len(sys.argv) < 2:
        print("Usage: python test_with_sample_files.py <file_path> [file_path2] ...")
        print("\nExample:")
        print("  python test_with_sample_files.py sample.pdf")
        print("  python test_with_sample_files.py sample.docx sample.txt sample.png")
        sys.exit(1)
    
    file_paths = sys.argv[1:]
    
    # Check all files exist
    missing_files = [f for f in file_paths if not Path(f).exists()]
    if missing_files:
        print(f"❌ Error: Files not found:")
        for f in missing_files:
            print(f"   - {f}")
        sys.exit(1)
    
    # Run tests
    if len(file_paths) == 1:
        success = asyncio.run(test_file(file_paths[0]))
    else:
        success = asyncio.run(test_multiple_files(file_paths))
    
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()


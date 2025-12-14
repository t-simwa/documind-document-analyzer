#!/bin/bash
# Quick test runner for Linux/macOS
# Usage: ./run_tests.sh [quick|all|sample|ocr]

echo "========================================"
echo "Document Ingestion Test Runner"
echo "========================================"
echo ""

case "$1" in
    quick)
        echo "Running quick test..."
        python tests/quick_test.py
        ;;
    all)
        echo "Running all tests..."
        python tests/test_document_loaders.py
        ;;
    sample)
        if [ -z "$2" ]; then
            echo "Usage: ./run_tests.sh sample <file_path>"
            echo "Example: ./run_tests.sh sample uploads/test-files/sample.pdf"
            exit 1
        fi
        echo "Testing with file: $2"
        python tests/test_with_sample_files.py "$2"
        ;;
    ocr)
        if [ -z "$2" ]; then
            echo "Testing OCR engines..."
            python tests/test_ocr_engines.py
        else
            echo "Testing OCR with: $2"
            python tests/test_ocr_engines.py "$2"
        fi
        ;;
    *)
        echo "Usage: ./run_tests.sh [quick|all|sample|ocr]"
        echo ""
        echo "Options:"
        echo "  quick  - Run quick system check"
        echo "  all    - Run all unit tests"
        echo "  sample - Test with a file (requires file path)"
        echo "  ocr    - Test OCR engines (optional: image path)"
        echo ""
        echo "Examples:"
        echo "  ./run_tests.sh quick"
        echo "  ./run_tests.sh all"
        echo "  ./run_tests.sh sample uploads/test-files/sample.pdf"
        echo "  ./run_tests.sh ocr uploads/test-files/sample.jpg"
        ;;
esac


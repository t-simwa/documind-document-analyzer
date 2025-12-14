@echo off
REM Quick test runner for Windows
REM Usage: run_tests.bat [quick|all|sample|ocr]

echo ========================================
echo Document Ingestion Test Runner
echo ========================================
echo.

if "%1"=="quick" (
    echo Running quick test...
    python tests\quick_test.py
) else if "%1"=="all" (
    echo Running all tests...
    python tests\test_document_loaders.py
) else if "%1"=="sample" (
    if "%2"=="" (
        echo Usage: run_tests.bat sample ^<file_path^>
        echo Example: run_tests.bat sample uploads\test-files\sample.pdf
        exit /b 1
    )
    echo Testing with file: %2
    python tests\test_with_sample_files.py %2
) else if "%1"=="ocr" (
    if "%2"=="" (
        echo Testing OCR engines...
        python tests\test_ocr_engines.py
    ) else (
        echo Testing OCR with: %2
        python tests\test_ocr_engines.py %2
    )
) else (
    echo Usage: run_tests.bat [quick^|all^|sample^|ocr]
    echo.
    echo Options:
    echo   quick  - Run quick system check
    echo   all    - Run all unit tests
    echo   sample - Test with a file (requires file path)
    echo   ocr    - Test OCR engines (optional: image path)
    echo.
    echo Examples:
    echo   run_tests.bat quick
    echo   run_tests.bat all
    echo   run_tests.bat sample uploads\test-files\sample.pdf
    echo   run_tests.bat ocr uploads\test-files\sample.jpg
)


"""
Excel and CSV document loaders
"""

from typing import Dict, Any, List
import pandas as pd
import openpyxl
import structlog

from .base import DocumentLoader, DocumentContent, LoaderError

logger = structlog.get_logger(__name__)


class ExcelLoader(DocumentLoader):
    """Loader for Excel files (XLSX, XLS)"""
    
    def load(self) -> DocumentContent:
        """
        Load and extract content from Excel file
        
        Returns:
            DocumentContent: Extracted content with text, tables, and metadata
            
        Raises:
            LoaderError: If Excel loading fails
        """
        try:
            logger.info("loading_excel", file_path=str(self.file_path))
            
            metadata = self._extract_metadata()
            tables_data = []
            full_text = []
            
            # Load Excel file
            excel_file = pd.ExcelFile(self.file_path, engine='openpyxl')
            
            metadata.update({
                "sheet_names": excel_file.sheet_names,
                "sheet_count": len(excel_file.sheet_names),
            })
            
            # Process each sheet
            for sheet_name in excel_file.sheet_names:
                try:
                    df = pd.read_excel(excel_file, sheet_name=sheet_name, engine='openpyxl')
                    
                    # Convert DataFrame to text
                    sheet_text = df.to_string(index=False)
                    full_text.append(f"Sheet: {sheet_name}\n{sheet_text}")
                    
                    # Store table data
                    table_data = {
                        "sheet_name": sheet_name,
                        "rows": df.values.tolist(),
                        "columns": df.columns.tolist(),
                        "row_count": len(df),
                        "column_count": len(df.columns),
                    }
                    tables_data.append(table_data)
                    
                except Exception as e:
                    logger.warning(
                        "excel_sheet_load_failed",
                        sheet_name=sheet_name,
                        error=str(e)
                    )
                    # Continue with other sheets
            
            # Combine all text
            combined_text = "\n\n".join(full_text)
            
            # Apply preprocessing (language detection only for Excel/CSV)
            from .preprocessing import preprocess_text
            preprocess_result = preprocess_text(
                combined_text,
                remove_page_nums=False,  # Excel doesn't have page numbers
                remove_headers_footers=False,  # Headers are data in Excel
                detect_lang=True
            )
            combined_text = preprocess_result["text"]
            combined_text = self._normalize_text(combined_text, apply_preprocessing=False)
            
            # Add language detection metadata
            if "language_detection" in preprocess_result:
                lang_info = preprocess_result["language_detection"]
                metadata["detected_language"] = lang_info.get("language", "unknown")
                metadata["language_confidence"] = lang_info.get("confidence", 0.0)
            
            metadata.update({
                "table_count": len(tables_data),
                "total_char_count": len(combined_text),
                "extraction_method": "pandas_openpyxl",
            })
            
            logger.info(
                "excel_loaded_successfully",
                file_path=str(self.file_path),
                sheet_count=len(excel_file.sheet_names),
                table_count=len(tables_data),
                char_count=len(combined_text)
            )
            
            return DocumentContent(
                text=combined_text,
                metadata=metadata,
                tables=tables_data
            )
            
        except Exception as e:
            error_msg = f"Failed to load Excel file: {str(e)}"
            logger.error("excel_load_error", file_path=str(self.file_path), error=str(e))
            raise LoaderError(error_msg, file_path=str(self.file_path), original_error=e)
    
    def supports_streaming(self) -> bool:
        """Excel loading supports streaming for large files"""
        return True
    
    def load_streaming(self, max_sheets: int = None, max_rows_per_sheet: int = None) -> DocumentContent:
        """
        Load Excel file with streaming support
        
        Args:
            max_sheets: Maximum number of sheets to load (None for all)
            max_rows_per_sheet: Maximum rows per sheet (None for all)
            
        Returns:
            DocumentContent: Extracted content
        """
        try:
            logger.info(
                "loading_excel_streaming",
                file_path=str(self.file_path),
                max_sheets=max_sheets,
                max_rows=max_rows_per_sheet
            )
            
            metadata = self._extract_metadata()
            tables_data = []
            full_text = []
            
            excel_file = pd.ExcelFile(self.file_path, engine='openpyxl')
            sheets_to_load = excel_file.sheet_names[:max_sheets] if max_sheets else excel_file.sheet_names
            
            metadata.update({
                "sheet_names": excel_file.sheet_names,
                "sheet_count": len(excel_file.sheet_names),
                "sheets_loaded": len(sheets_to_load),
                "is_partial": max_sheets is not None and len(sheets_to_load) < len(excel_file.sheet_names),
            })
            
            for sheet_name in sheets_to_load:
                try:
                    df = pd.read_excel(
                        excel_file,
                        sheet_name=sheet_name,
                        engine='openpyxl',
                        nrows=max_rows_per_sheet
                    )
                    
                    sheet_text = df.to_string(index=False)
                    full_text.append(f"Sheet: {sheet_name}\n{sheet_text}")
                    
                    table_data = {
                        "sheet_name": sheet_name,
                        "rows": df.values.tolist(),
                        "columns": df.columns.tolist(),
                        "row_count": len(df),
                        "column_count": len(df.columns),
                        "is_partial": max_rows_per_sheet is not None and len(df) >= max_rows_per_sheet,
                    }
                    tables_data.append(table_data)
                    
                except Exception as e:
                    logger.warning(
                        "excel_sheet_streaming_failed",
                        sheet_name=sheet_name,
                        error=str(e)
                    )
            
            combined_text = "\n\n".join(full_text)
            
            # Apply preprocessing (language detection only)
            from .preprocessing import preprocess_text
            preprocess_result = preprocess_text(
                combined_text,
                remove_page_nums=False,
                remove_headers_footers=False,
                detect_lang=True
            )
            combined_text = preprocess_result["text"]
            combined_text = self._normalize_text(combined_text, apply_preprocessing=False)
            
            # Add language detection metadata
            if "language_detection" in preprocess_result:
                lang_info = preprocess_result["language_detection"]
                metadata["detected_language"] = lang_info.get("language", "unknown")
                metadata["language_confidence"] = lang_info.get("confidence", 0.0)
            
            metadata.update({
                "table_count": len(tables_data),
                "total_char_count": len(combined_text),
                "extraction_method": "pandas_openpyxl_streaming",
            })
            
            return DocumentContent(
                text=combined_text,
                metadata=metadata,
                tables=tables_data
            )
            
        except Exception as e:
            error_msg = f"Failed to stream Excel file: {str(e)}"
            logger.error("excel_streaming_error", file_path=str(self.file_path), error=str(e))
            raise LoaderError(error_msg, file_path=str(self.file_path), original_error=e)


class CSVLoader(DocumentLoader):
    """Loader for CSV files"""
    
    def load(self) -> DocumentContent:
        """
        Load and extract content from CSV file
        
        Returns:
            DocumentContent: Extracted content with text, tables, and metadata
            
        Raises:
            LoaderError: If CSV loading fails
        """
        try:
            logger.info("loading_csv", file_path=str(self.file_path))
            
            metadata = self._extract_metadata()
            
            # Detect delimiter
            delimiter = self._detect_delimiter()
            
            # Load CSV
            try:
                df = pd.read_csv(self.file_path, delimiter=delimiter, encoding='utf-8')
            except UnicodeDecodeError:
                # Fallback to latin-1 if UTF-8 fails
                df = pd.read_csv(self.file_path, delimiter=delimiter, encoding='latin-1')
            
            # Convert to text
            text = df.to_string(index=False)
            
            # Apply preprocessing (language detection only for CSV)
            from .preprocessing import preprocess_text
            preprocess_result = preprocess_text(
                text,
                remove_page_nums=False,
                remove_headers_footers=False,
                detect_lang=True
            )
            text = preprocess_result["text"]
            normalized_text = self._normalize_text(text, apply_preprocessing=False)
            
            # Store table data
            table_data = {
                "rows": df.values.tolist(),
                "columns": df.columns.tolist(),
                "row_count": len(df),
                "column_count": len(df.columns),
            }
            
            # Add language detection metadata
            if "language_detection" in preprocess_result:
                lang_info = preprocess_result["language_detection"]
                metadata["detected_language"] = lang_info.get("language", "unknown")
                metadata["language_confidence"] = lang_info.get("confidence", 0.0)
            
            metadata.update({
                "delimiter": delimiter,
                "row_count": len(df),
                "column_count": len(df.columns),
                "column_names": df.columns.tolist(),
                "total_char_count": len(normalized_text),
                "extraction_method": "pandas_csv",
            })
            
            logger.info(
                "csv_loaded_successfully",
                file_path=str(self.file_path),
                row_count=len(df),
                column_count=len(df.columns),
                char_count=len(normalized_text)
            )
            
            return DocumentContent(
                text=normalized_text,
                metadata=metadata,
                tables=[table_data]
            )
            
        except Exception as e:
            error_msg = f"Failed to load CSV file: {str(e)}"
            logger.error("csv_load_error", file_path=str(self.file_path), error=str(e))
            raise LoaderError(error_msg, file_path=str(self.file_path), original_error=e)
    
    def _detect_delimiter(self) -> str:
        """
        Detect CSV delimiter
        
        Returns:
            str: Detected delimiter (defaults to ',')
        """
        try:
            # Read first line to detect delimiter
            with open(self.file_path, 'r', encoding='utf-8', errors='replace') as file:
                first_line = file.readline()
                
            # Common delimiters
            delimiters = [',', ';', '\t', '|']
            delimiter_counts = {delim: first_line.count(delim) for delim in delimiters}
            
            # Return delimiter with highest count
            detected = max(delimiter_counts, key=delimiter_counts.get)
            
            if delimiter_counts[detected] > 0:
                return detected
            
            return ','  # Default to comma
            
        except Exception:
            return ','  # Default to comma
    
    def supports_streaming(self) -> bool:
        """CSV files support streaming"""
        return True
    
    def load_streaming(self, max_rows: int = None) -> DocumentContent:
        """
        Load CSV file with streaming support
        
        Args:
            max_rows: Maximum rows to read (None for all)
            
        Returns:
            DocumentContent: Extracted content
        """
        try:
            logger.info("loading_csv_streaming", file_path=str(self.file_path), max_rows=max_rows)
            
            metadata = self._extract_metadata()
            delimiter = self._detect_delimiter()
            
            df = pd.read_csv(
                self.file_path,
                delimiter=delimiter,
                encoding='utf-8',
                errors='replace',
                nrows=max_rows
            )
            
            text = df.to_string(index=False)
            
            # Apply preprocessing (language detection only)
            from .preprocessing import preprocess_text
            preprocess_result = preprocess_text(
                text,
                remove_page_nums=False,
                remove_headers_footers=False,
                detect_lang=True
            )
            text = preprocess_result["text"]
            normalized_text = self._normalize_text(text, apply_preprocessing=False)
            
            table_data = {
                "rows": df.values.tolist(),
                "columns": df.columns.tolist(),
                "row_count": len(df),
                "column_count": len(df.columns),
                "is_partial": max_rows is not None and len(df) >= max_rows,
            }
            
            # Add language detection metadata
            if "language_detection" in preprocess_result:
                lang_info = preprocess_result["language_detection"]
                metadata["detected_language"] = lang_info.get("language", "unknown")
                metadata["language_confidence"] = lang_info.get("confidence", 0.0)
            
            metadata.update({
                "delimiter": delimiter,
                "row_count": len(df),
                "column_count": len(df.columns),
                "total_char_count": len(normalized_text),
                "is_partial": max_rows is not None,
                "extraction_method": "pandas_csv_streaming",
            })
            
            return DocumentContent(
                text=normalized_text,
                metadata=metadata,
                tables=[table_data]
            )
            
        except Exception as e:
            error_msg = f"Failed to stream CSV file: {str(e)}"
            logger.error("csv_streaming_error", file_path=str(self.file_path), error=str(e))
            raise LoaderError(error_msg, file_path=str(self.file_path), original_error=e)


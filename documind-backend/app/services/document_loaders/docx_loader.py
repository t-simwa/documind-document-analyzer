"""
DOCX document loader using python-docx
"""

from typing import Dict, Any, List
from docx import Document
from docx.document import Document as DocumentType
from docx.oxml.text.paragraph import CT_P
from docx.oxml.table import CT_Tbl
from docx.table import Table
from docx.text.paragraph import Paragraph
import structlog

from .base import DocumentLoader, DocumentContent, LoaderError

logger = structlog.get_logger(__name__)


class DOCXLoader(DocumentLoader):
    """Loader for DOCX (Microsoft Word) documents"""
    
    def load(self) -> DocumentContent:
        """
        Load and extract content from DOCX file
        
        Returns:
            DocumentContent: Extracted content with text, tables, and metadata
            
        Raises:
            LoaderError: If DOCX loading fails
        """
        try:
            logger.info("loading_docx", file_path=str(self.file_path))
            
            metadata = self._extract_metadata()
            paragraphs = []
            tables_data = []
            full_text = []
            
            # Open DOCX file
            doc = Document(self.file_path)
            
            # Extract document properties
            core_props = doc.core_properties
            metadata.update({
                "title": core_props.title or "",
                "author": core_props.author or "",
                "subject": core_props.subject or "",
                "keywords": core_props.keywords or "",
                "comments": core_props.comments or "",
                "created": core_props.created.isoformat() if core_props.created else None,
                "modified": core_props.modified.isoformat() if core_props.modified else None,
                "last_modified_by": core_props.last_modified_by or "",
                "revision": core_props.revision or 0,
            })
            
            # Extract paragraphs and tables
            for element in doc.element.body:
                if isinstance(element, CT_P):
                    # Paragraph
                    para = Paragraph(element, doc)
                    para_text = para.text.strip()
                    if para_text:
                        paragraphs.append(para_text)
                        full_text.append(para_text)
                
                elif isinstance(element, CT_Tbl):
                    # Table
                    table = Table(element, doc)
                    table_data = self._extract_table(table)
                    if table_data:
                        tables_data.append(table_data)
                        # Add table text to full text
                        table_text = self._table_to_text(table_data)
                        full_text.append(table_text)
            
            # Combine all text
            combined_text = "\n\n".join(full_text)
            combined_text = self._normalize_text(combined_text)
            
            metadata.update({
                "paragraph_count": len(paragraphs),
                "table_count": len(tables_data),
                "total_char_count": len(combined_text),
                "extraction_method": "python-docx",
            })
            
            logger.info(
                "docx_loaded_successfully",
                file_path=str(self.file_path),
                paragraph_count=len(paragraphs),
                table_count=len(tables_data),
                char_count=len(combined_text)
            )
            
            return DocumentContent(
                text=combined_text,
                metadata=metadata,
                tables=tables_data
            )
            
        except Exception as e:
            error_msg = f"Failed to load DOCX: {str(e)}"
            logger.error("docx_load_error", file_path=str(self.file_path), error=str(e))
            raise LoaderError(error_msg, file_path=str(self.file_path), original_error=e)
    
    def _extract_table(self, table: Table) -> Dict[str, Any]:
        """
        Extract data from a table
        
        Args:
            table: python-docx Table object
            
        Returns:
            Dict[str, Any]: Table data with rows and columns
        """
        rows_data = []
        for row in table.rows:
            row_data = [cell.text.strip() for cell in row.cells]
            rows_data.append(row_data)
        
        return {
            "rows": rows_data,
            "row_count": len(rows_data),
            "column_count": len(rows_data[0]) if rows_data else 0,
        }
    
    def _table_to_text(self, table_data: Dict[str, Any]) -> str:
        """
        Convert table data to text representation
        
        Args:
            table_data: Table data dictionary
            
        Returns:
            str: Text representation of the table
        """
        rows = table_data.get("rows", [])
        if not rows:
            return ""
        
        # Convert each row to a line of text
        text_rows = [" | ".join(row) for row in rows]
        return "\n".join(text_rows)
    
    def supports_streaming(self) -> bool:
        """DOCX loading supports streaming for large files"""
        return True



from dataclasses import asdict, dataclass, field
from typing import Any


@dataclass
class ExtractionBlock:
    block_type: str
    text: str
    block_index: int

    # PDF page number or None for DOCX
    page_number: int | None = None

    # Useful for DOCX headings
    heading_level: int | None = None

    # Useful for identifying tables
    table_index: int | None = None


@dataclass
class PageExtraction:
    page_number: int
    text: str

    extraction_type: str
    needs_ocr: bool

    text_char_count: int
    image_coverage: float


@dataclass
class DocumentExtraction:
    document_name: str
    document_type: str

    total_pages: int | None = None

    pages: list[PageExtraction] = field(default_factory=list)
    blocks: list[ExtractionBlock] = field(default_factory=list)

    metadata: dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)

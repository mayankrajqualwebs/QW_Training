
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


@dataclass
class ParsedContentItem:
    """
    One ordered item inside a parsed section.

    content_type:
        "paragraph", "table", or "section"
    """
    content_type: str
    text: str | None = None
    section: "ParsedSection | None" = None

    source_block_index: int | None = None
    page_number: int | None = None
    table_index: int | None = None


@dataclass
class ParsedSection:
    section_id: int
    title: str | None = None
    heading_level: int = 0

    # Preserves the original order of paragraphs, tables,
    # and nested sections.
    content: list[ParsedContentItem] = field(default_factory=list)

    source_block_index: int | None = None
    page_number: int | None = None


@dataclass
class ParsedDocument:
    document_name: str
    document_type: str
    sections: list[ParsedSection] = field(default_factory=list)
    metadata: dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)

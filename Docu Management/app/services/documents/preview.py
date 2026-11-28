
from rich.console import Console
from rich.panel import Panel
from rich.table import Table
from rich.text import Text

from .schemas import DocumentExtraction


console = Console()


def print_document_preview(
    document: DocumentExtraction,
    max_blocks: int = 30,
    max_text_length: int = 180,
) -> None:
    """
    Display a readable preview of extracted document content.
    """

    console.print(
        Panel(
            f"[bold cyan]{document.document_name}[/bold cyan]\n"
            f"Type: {document.document_type}\n"
            f"Pages: {document.total_pages or 'Not available'}\n"
            f"Blocks: {len(document.blocks)}",
            title="Document Extraction",
            border_style="blue",
        )
    )

    # --------------------------------------------------------
    # Extraction Metadata
    # --------------------------------------------------------

    if document.metadata:
        metadata_table = Table(
            title="Extraction Metadata",
            show_header=True,
        )

        metadata_table.add_column(
            "Property",
            style="cyan",
        )

        metadata_table.add_column(
            "Value",
            style="white",
        )

        for key, value in document.metadata.items():
            metadata_table.add_row(
                str(key),
                str(value),
            )

        console.print(metadata_table)

    # --------------------------------------------------------
    # Extracted Blocks
    # --------------------------------------------------------

    block_table = Table(
        title=f"Content Preview (first {max_blocks} blocks)",
        show_header=True,
        header_style="bold magenta",
    )

    block_table.add_column(
        "Index",
        justify="right",
        width=6,
    )

    block_table.add_column(
        "Type",
        width=12,
    )

    block_table.add_column(
        "Content",
        overflow="fold",
    )

    for block in document.blocks[:max_blocks]:
        content = block.text.replace(
            "\n",
            " ",
        ).strip()

        if len(content) > max_text_length:
            content = (
                content[:max_text_length]
                + "..."
            )

        if block.block_type == "heading":
            content = (
                f"[bold yellow]{content}[/bold yellow]"
            )

        elif block.block_type == "table":
            content = (
                f"[green]{content}[/green]"
            )

        block_table.add_row(
            str(block.block_index),
            block.block_type,
            content,
        )

    console.print(block_table)

    # --------------------------------------------------------
    # Preview Notice
    # --------------------------------------------------------

    if len(document.blocks) > max_blocks:
        console.print(
            f"\n[dim]Showing {max_blocks} of "
            f"{len(document.blocks)} blocks.[/dim]"
        )

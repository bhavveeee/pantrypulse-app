"""pp_rows — the ONE correct way to iterate a household board.
Header row is NOT always row 4: sheets onboarded from a list (Akshita, Samidha, Joseph,
Saurabh, Shyamli, Piyush & Mamta) have the header at row 1 and data from row 2.
Every script that hard-coded range(5, max_row+1) silently skipped rows 2-4 on those
sheets — the root cause of the recurring 'zero in backend but visible on board' bug
(18-Sep-2026). Always use data_rows() instead of range(5, ...).
"""
def header_row(ws):
    for r in range(1, 10):
        if str(ws.cell(r, 1).value or '').strip().lower() == 'category':
            return r
    return 4  # legacy default
def data_rows(ws):
    """Yield every data row index below the header, wherever the header is."""
    return range(header_row(ws) + 1, ws.max_row + 1)

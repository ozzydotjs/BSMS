export interface CsvColumn<T> {
  header: string;
  accessor: (row: T) => string | number | null | undefined;
}

function escapeCsvCell(raw: string | number | null | undefined): string {
  const str = raw === null || raw === undefined ? '' : String(raw);
  if (/[",\r\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function jsonToCsv<T>(rows: T[], columns: CsvColumn<T>[]): string {
  const headerLine = columns.map((col) => escapeCsvCell(col.header)).join(',');
  const bodyLines = rows.map((row) =>
    columns.map((col) => escapeCsvCell(col.accessor(row))).join(',')
  );
  return [headerLine, ...bodyLines].join('\r\n');
}

export function downloadCsv(filename: string, csvContent: string): void {
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

import { Platform } from "react-native";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";

export type CsvCell = string | number | boolean | null | undefined;
export type CsvRow = Record<string, CsvCell>;

/**
 * Escape a single CSV cell per RFC 4180:
 * wrap in quotes if it contains comma, quote, newline.
 */
function escapeCell(value: CsvCell): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Convert an array of rows to a CSV string.
 * Headers are derived from the union of keys in `rows`,
 * or from the explicit `headers` argument when provided.
 */
export function toCsv(rows: CsvRow[], headers?: string[]): string {
  if (rows.length === 0) {
    return headers && headers.length ? headers.join(",") + "\n" : "";
  }
  const cols =
    headers && headers.length
      ? headers
      : Array.from(
          rows.reduce<Set<string>>((set, row) => {
            Object.keys(row).forEach((k) => set.add(k));
            return set;
          }, new Set<string>()),
        );

  const headerLine = cols.map(escapeCell).join(",");
  const body = rows
    .map((row) => cols.map((c) => escapeCell(row[c])).join(","))
    .join("\n");
  return `${headerLine}\n${body}\n`;
}

/**
 * Trigger a CSV download/share. On web we use a Blob + anchor download;
 * on native we write to the document directory and open the share sheet.
 * Returns the path or URL the file was written to.
 */
export async function shareCsv(filename: string, csv: string): Promise<string> {
  const safeName = filename.endsWith(".csv") ? filename : `${filename}.csv`;

  if (Platform.OS === "web") {
    try {
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = safeName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      return url;
    } catch (error) {
      console.error("[csv-export] web download failed", error);
      throw error;
    }
  }

  const dir = FileSystem.documentDirectory ?? FileSystem.cacheDirectory;
  if (!dir) throw new Error("No writable directory available");
  const fileUri = `${dir}${safeName}`;

  await FileSystem.writeAsStringAsync(fileUri, csv, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  const available = await Sharing.isAvailableAsync();
  if (available) {
    await Sharing.shareAsync(fileUri, {
      mimeType: "text/csv",
      dialogTitle: safeName,
      UTI: "public.comma-separated-values-text",
    });
  } else {
    console.log("[csv-export] sharing not available, file at", fileUri);
  }
  return fileUri;
}

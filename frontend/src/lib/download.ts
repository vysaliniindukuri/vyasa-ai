/** Trigger a client-side download of a text file (no server round-trip). */
export function downloadTextFile(
  filename: string,
  content: string,
  type = 'text/markdown;charset=utf-8',
): void {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

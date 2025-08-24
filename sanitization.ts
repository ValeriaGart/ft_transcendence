// Utility to safely inject untrusted strings into HTML templates
// Escapes characters that have special meaning in HTML to prevent injection

export function sanitizeForTemplate(input: unknown): string {
  if (input === null || input === undefined) {
    return "";
  }

  const valueAsString = String(input);
  return valueAsString
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;")
    .replace(/`/g, "&#96;");
}


export async function parseApiError(res: Response, fallback: string): Promise<string> {
  try {
    const text = (await res.text()).trim();
    if (!text) return fallback;

    // Avoid dumping full ASP.NET Core stack traces or HTML pages into toast notifications
    if (
      res.status >= 500 ||
      text.includes('at Microsoft.') ||
      text.includes('HEADERS ========') ||
      text.startsWith('<')
    ) {
      const firstLine = text.split(/\r?\n/)[0]?.trim() || '';
      if (firstLine && firstLine.length <= 120 && !firstLine.startsWith('<')) {
        return firstLine;
      }
      return fallback;
    }

    return text.length > 140 ? `${text.slice(0, 140)}...` : text;
  } catch {
    return fallback;
  }
}

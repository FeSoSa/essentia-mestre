export function extractGdriveId(url: string): string | null {
  return (
    url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/)?.[1] ??
    url.match(/[?&]id=([a-zA-Z0-9_-]+)/)?.[1] ??
    null
  );
}

export function normalizeGdriveUrl(url: string): string {
  if (!url) return url;
  const fileId = extractGdriveId(url);
  return fileId ? `https://drive.google.com/uc?export=view&id=${fileId}` : url;
}

export function proxyUrl(url: string): string {
  if (!url) return url;
  const direct = normalizeGdriveUrl(url);
  return `/api/proxy-image?url=${encodeURIComponent(direct)}`;
}

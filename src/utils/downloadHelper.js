const API_BASE_URL = import.meta.env.VITE_API_URL || '';

/**
 * Extracts or appends the correct original extension to a filename if missing.
 */
export function getFileNameWithExtension(url = '', fileName = 'download', mimeType = '') {
  let name = (fileName || 'download').trim();

  // Check if filename already ends with a valid extension (e.g. .pdf, .png, .docx)
  const hasExtension = /\.[a-zA-Z0-9]+$/.test(name);
  if (hasExtension) return name;

  // Try extracting extension from URL path
  try {
    const cleanUrl = url.split('?')[0].split('#')[0];
    const match = cleanUrl.match(/\.([a-zA-Z0-9]+)$/);
    if (match && match[1] && match[1].length <= 5) {
      return `${name}.${match[1]}`;
    }
  } catch (e) {}

  // Try mapping mimeType to standard file extension
  if (mimeType) {
    const mimeMap = {
      'application/pdf': 'pdf',
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/gif': 'gif',
      'image/webp': 'webp',
      'image/svg+xml': 'svg',
      'text/plain': 'txt',
      'application/zip': 'zip',
      'application/x-zip-compressed': 'zip',
      'application/json': 'json',
      'application/msword': 'doc',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
      'application/vnd.ms-excel': 'xls',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
      'application/vnd.ms-powerpoint': 'ppt',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
      'audio/mpeg': 'mp3',
      'audio/wav': 'wav',
      'video/mp4': 'mp4',
      'video/webm': 'webm'
    };
    if (mimeMap[mimeType]) {
      return `${name}.${mimeMap[mimeType]}`;
    }
  }

  return name;
}

/**
 * Direct file download helper.
 * Fetches the file through the server proxy as a blob to trigger native browser download
 * without opening blank tabs or running into cross-origin download attribute restrictions.
 */
export async function downloadFile(url, fileName = 'download', mimeType = '') {
  if (!url) return;

  const finalFileName = getFileNameWithExtension(url, fileName, mimeType);

  // 1. Data URLs or Blob URLs can be downloaded directly
  if (url.startsWith('data:') || url.startsWith('blob:')) {
    const link = document.createElement('a');
    link.href = url;
    link.download = finalFileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return;
  }

  // 2. Fetch via proxy endpoint and trigger client-side blob download
  try {
    const proxyDownloadUrl = `${API_BASE_URL}/api/media/download?url=${encodeURIComponent(url)}&name=${encodeURIComponent(finalFileName)}`;
    const response = await fetch(proxyDownloadUrl);

    if (!response.ok) {
      const errData = await response.json().catch(() => null);
      throw new Error(errData?.message || `Server returned ${response.status}`);
    }

    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = finalFileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => window.URL.revokeObjectURL(blobUrl), 1000);
  } catch (err) {
    console.warn('[downloadHelper] Proxy download failed, falling back to direct URL:', err.message);
    // Fallback: Direct download link
    const fallbackLink = document.createElement('a');
    fallbackLink.href = url;
    fallbackLink.download = finalFileName;
    fallbackLink.target = '_blank';
    fallbackLink.rel = 'noopener noreferrer';
    document.body.appendChild(fallbackLink);
    fallbackLink.click();
    document.body.removeChild(fallbackLink);
  }
}

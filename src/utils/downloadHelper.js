const API_BASE_URL = import.meta.env.VITE_API_URL || '';

/**
 * Extracts or appends the correct original extension to a filename if missing.
 */
export function getFileNameWithExtension(url = '', fileName = 'download', mimeType = '') {
  let name = (fileName || 'download').trim();

  // Check if filename already ends with a valid extension (e.g. .pdf, .png, .docx)
  const hasExtension = /\.[a-zA-Z0-9]+$/.test(name);
  if (hasExtension) return name;

  // Try extracting extension from URL
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
 * Downloads a file given its URL, preferred filename, and optional mimeType.
 * Ensures the file is saved directly into Downloads with its original file extension.
 */
export async function downloadFile(url, fileName = 'download', mimeType = '') {
  if (!url) return;

  const finalFileName = getFileNameWithExtension(url, fileName, mimeType);

  try {
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

    // 2. Prepare URL: ONLY apply fl_attachment to /image/upload/ or /video/upload/.
    // NEVER put fl_attachment in /raw/upload/ as Cloudinary returns 400/404 for raw transformations.
    let downloadUrl = url;
    if (downloadUrl.includes('/image/upload/') && !downloadUrl.includes('/fl_attachment')) {
      downloadUrl = downloadUrl.replace('/image/upload/', '/image/upload/fl_attachment/');
    }

    // 3. Attempt direct fetch for client-side blob download
    const response = await fetch(downloadUrl);
    if (response.ok) {
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = finalFileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setTimeout(() => {
        window.URL.revokeObjectURL(blobUrl);
      }, 10000);
      return;
    }

    // 4. If direct fetch fails (e.g. 401 or CORS), use backend proxy download endpoint
    const proxyUrl = `${API_BASE_URL}/api/media/download?url=${encodeURIComponent(url)}&name=${encodeURIComponent(finalFileName)}`;
    const proxyResponse = await fetch(proxyUrl);
    if (proxyResponse.ok) {
      const blob = await proxyResponse.blob();
      const blobUrl = window.URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = finalFileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setTimeout(() => {
        window.URL.revokeObjectURL(blobUrl);
      }, 10000);
      return;
    }

    // 5. Fallback: direct anchor download
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.download = finalFileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

  } catch (err) {
    console.warn('Direct download failed, attempting backend proxy fallback:', err);
    try {
      const proxyUrl = `${API_BASE_URL}/api/media/download?url=${encodeURIComponent(url)}&name=${encodeURIComponent(finalFileName)}`;
      const proxyResponse = await fetch(proxyUrl);
      if (proxyResponse.ok) {
        const blob = await proxyResponse.blob();
        const blobUrl = window.URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = finalFileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        setTimeout(() => {
          window.URL.revokeObjectURL(blobUrl);
        }, 10000);
        return;
      }
    } catch (proxyErr) {
      console.error('Backend proxy download failed:', proxyErr);
    }

    // Final fallback
    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.download = finalFileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

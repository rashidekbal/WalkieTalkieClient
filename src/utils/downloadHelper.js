/**
 * Downloads a file given its URL and preferred filename.
 * Uses fetch and Blob URL creation to ensure cross-origin CDN resources (such as Cloudinary)
 * download directly with their full original name and extension instead of being opened in a browser tab
 * or saved without extension due to CORS/HTML5 download attribute limitations.
 */
export async function downloadFile(url, fileName = 'download') {
  if (!url) return;

  try {
    // For Data URLs or Blob URLs, direct standard download works
    if (url.startsWith('data:') || url.startsWith('blob:')) {
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    }

    // For remote URLs (e.g. Cloudinary), fetch as blob to enforce same-origin download behavior
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch file: ${response.status} ${response.statusText}`);
    }

    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clean up temporary blob URL after download is triggered
    setTimeout(() => {
      window.URL.revokeObjectURL(blobUrl);
    }, 10000);
  } catch (err) {
    console.warn('Blob fetch failed, falling back to direct link click:', err);
    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

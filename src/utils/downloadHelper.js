const API_BASE_URL = import.meta.env.VITE_API_URL || '';

/**
 * Downloads a file given its URL and preferred filename.
 * Handles Cloudinary raw/PDF files, cross-origin CDN constraints, and 401 unauthorized errors
 * by using fl_attachment transformation, Blob URLs, and backend proxy fallbacks.
 */
export async function downloadFile(url, fileName = 'download') {
  if (!url) return;

  try {
    // 1. Data URLs or Blob URLs can be downloaded directly
    if (url.startsWith('data:') || url.startsWith('blob:')) {
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    }

    // 2. Prepare Cloudinary attachment URL (forces Content-Disposition header)
    let downloadUrl = url;
    if (downloadUrl.includes('res.cloudinary.com') && !downloadUrl.includes('/fl_attachment')) {
      downloadUrl = downloadUrl.replace('/upload/', '/upload/fl_attachment/');
    }

    // 3. Try direct fetch for client-side blob download
    const response = await fetch(downloadUrl);
    if (response.ok) {
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setTimeout(() => {
        window.URL.revokeObjectURL(blobUrl);
      }, 10000);
      return;
    }

    // 4. If direct fetch fails (e.g. 401 Unauthorized), use backend proxy download endpoint
    const proxyUrl = `${API_BASE_URL}/api/media/download?url=${encodeURIComponent(url)}&name=${encodeURIComponent(fileName)}`;
    const proxyResponse = await fetch(proxyUrl);
    if (proxyResponse.ok) {
      const blob = await proxyResponse.blob();
      const blobUrl = window.URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setTimeout(() => {
        window.URL.revokeObjectURL(blobUrl);
      }, 10000);
      return;
    }

    // 5. Fallback: direct window link click with fl_attachment
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

  } catch (err) {
    console.warn('Direct download failed, attempting backend proxy fallback:', err);
    try {
      const proxyUrl = `${API_BASE_URL}/api/media/download?url=${encodeURIComponent(url)}&name=${encodeURIComponent(fileName)}`;
      const proxyResponse = await fetch(proxyUrl);
      if (proxyResponse.ok) {
        const blob = await proxyResponse.blob();
        const blobUrl = window.URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = fileName;
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
    const fallbackUrl = url.includes('res.cloudinary.com') ? url.replace('/upload/', '/upload/fl_attachment/') : url;
    const link = document.createElement('a');
    link.href = fallbackUrl;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

// Static hosts may answer Range requests with the whole file. A local blob
// lets the media element seek without requesting more bytes from the server.
export async function loadSeekableVideo(video, sources, signal) {
  for (const { url, type } of sources) {
    if (signal.aborted || !video.canPlayType(type)) continue;
    try {
      const response = await fetch(url, { signal });
      if (!response.ok || !response.headers.get('content-type')?.startsWith(type)) continue;
      const file = await response.blob();
      if (signal.aborted) return false;
      const objectUrl = URL.createObjectURL(file);
      const release = () => {
        video.removeAttribute('src');
        video.load();
        URL.revokeObjectURL(objectUrl);
      };
      signal.addEventListener('abort', release, { once: true });
      const loaded = await new Promise(resolve => {
        const finish = result => {
          video.removeEventListener('loadedmetadata', ready);
          video.removeEventListener('error', fail);
          signal.removeEventListener('abort', fail);
          resolve(result);
        };
        const ready = () => finish(true);
        const fail = () => finish(false);
        video.addEventListener('loadedmetadata', ready, { once: true });
        video.addEventListener('error', fail, { once: true });
        signal.addEventListener('abort', fail, { once: true });
        video.src = objectUrl;
        video.load();
      });
      if (loaded && !signal.aborted) return true;
      if (!signal.aborted) {
        signal.removeEventListener('abort', release);
        release();
      }
    } catch {
      if (signal.aborted) return false;
    }
  }
  return false;
}

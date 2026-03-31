// Video base URL — change this to your R2/CDN public URL
// Set to '' for local files in /public/videos/
export const VIDEO_BASE = 'https://pub-2c7d56fe4c98425381098ff8d4dfabe4.r2.dev'

// Helper to resolve video paths
export function videoUrl(path) {
  if (VIDEO_BASE && path.startsWith('/videos/')) {
    return VIDEO_BASE + path.replace('/videos/', '/')
  }
  return path
}

// Helper to get poster image for a video
export function posterUrl(videoPath) {
  const filename = videoPath.split('/').pop().replace('.mp4', '.jpg')
  if (VIDEO_BASE) {
    return `${VIDEO_BASE}/posters/${filename}`
  }
  return `/posters/${filename}`
}

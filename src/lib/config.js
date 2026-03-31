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

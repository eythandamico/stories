import { Share } from '@capacitor/share'
import { Capacitor } from '@capacitor/core'

const APP_URL = 'https://stories-bph.pages.dev'

export async function shareStory(story) {
  const url = `${APP_URL}/play/${story.storyId || story.id}`
  const title = story.title || 'Narrative Story'
  const text = story.description || 'Check out this interactive story!'

  if (Capacitor.isNativePlatform()) {
    await Share.share({ title, text, url, dialogTitle: 'Share Story' })
  } else if (navigator.share) {
    await navigator.share({ title, text, url })
  } else {
    await navigator.clipboard?.writeText(url)
    return 'copied'
  }
  return 'shared'
}

export async function shareEnding(endingTitle, connectionPct, storyTitle) {
  const text = `I just reached "${endingTitle}" with ${connectionPct}% connection in ${storyTitle} on Narrative!`
  const url = APP_URL

  if (Capacitor.isNativePlatform()) {
    await Share.share({ title: 'My Story Ending', text, url })
  } else if (navigator.share) {
    await navigator.share({ title: 'My Story Ending', text, url })
  } else {
    await navigator.clipboard?.writeText(`${text}\n${url}`)
    return 'copied'
  }
  return 'shared'
}

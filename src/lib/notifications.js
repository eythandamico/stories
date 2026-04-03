import { Capacitor } from '@capacitor/core'
import { PushNotifications } from '@capacitor/push-notifications'
import { api } from './api.js'
import { isFirebaseConfigured } from './firebase.js'

let initialized = false

export async function initPushNotifications() {
  if (!Capacitor.isNativePlatform() || initialized) return
  initialized = true

  try {
    const perm = await PushNotifications.requestPermissions()
    if (perm.receive !== 'granted') return

    await PushNotifications.register()

    PushNotifications.addListener('registration', async (token) => {
      console.log('Push token:', token.value)
      if (isFirebaseConfigured) {
        try {
          await api.updateMe({ push_token: token.value })
        } catch (e) {
          console.warn('Failed to send push token:', e)
        }
      }
    })

    PushNotifications.addListener('pushNotificationReceived', (notification) => {
      console.log('Push received:', notification)
    })

    PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
      const data = notification.notification.data
      if (data?.storyId) {
        window.location.href = `/play/${data.storyId}`
      }
    })
  } catch (e) {
    console.warn('Push notifications not available:', e)
  }
}

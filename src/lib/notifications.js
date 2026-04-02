import { Capacitor } from '@capacitor/core'
import { PushNotifications } from '@capacitor/push-notifications'

let initialized = false

export async function initPushNotifications() {
  if (!Capacitor.isNativePlatform() || initialized) return
  initialized = true

  try {
    const perm = await PushNotifications.requestPermissions()
    if (perm.receive !== 'granted') return

    await PushNotifications.register()

    PushNotifications.addListener('registration', (token) => {
      console.log('Push token:', token.value)
      // TODO: send token to your server for targeting
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

// Schedule local notifications for streaks
export async function scheduleStreakReminder() {
  if (!Capacitor.isNativePlatform()) return
  // Local notifications would go here — requires @capacitor/local-notifications
}

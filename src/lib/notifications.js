import { Capacitor } from '@capacitor/core'
import { api } from './api.js'
import { isFirebaseConfigured } from './firebase.js'

let initialized = false

export async function initPushNotifications() {
  if (!Capacitor.isNativePlatform() || initialized) return
  initialized = true

  try {
    // Use Firebase Messaging for proper FCM tokens (not raw APNs tokens)
    const { FirebaseMessaging } = await import('@capacitor-firebase/messaging')

    // Request permission
    const perm = await FirebaseMessaging.requestPermissions()
    if (perm.receive !== 'granted') return

    // Get FCM token
    const { token } = await FirebaseMessaging.getToken()
    console.log('FCM token:', token)

    if (token && isFirebaseConfigured) {
      try {
        await api.updateMe({ push_token: token })
        console.log('FCM token saved to server')
      } catch (e) {
        console.warn('Failed to send FCM token:', e)
      }
    }

    // Listen for token refresh
    FirebaseMessaging.addListener('tokenReceived', async ({ token }) => {
      console.log('FCM token refreshed:', token)
      if (isFirebaseConfigured) {
        api.updateMe({ push_token: token }).catch(() => {})
      }
    })

    // Handle foreground notifications
    FirebaseMessaging.addListener('notificationReceived', (notification) => {
      console.log('Push received:', notification)
    })

    // Handle notification taps
    FirebaseMessaging.addListener('notificationActionPerformed', ({ notification }) => {
      const data = notification.data
      if (data?.storyId) {
        window.location.href = `/play/${data.storyId}`
      } else if (data?.route) {
        window.location.href = data.route
      }
    })

    // Schedule local streak reminder
    await scheduleStreakReminder()
  } catch (e) {
    console.warn('Push notifications not available:', e)
  }
}

// Schedule daily streak reminder at 7pm local time
export async function scheduleStreakReminder() {
  if (!Capacitor.isNativePlatform()) return

  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications')

    const perm = await LocalNotifications.requestPermissions()
    if (perm.display !== 'granted') return

    await LocalNotifications.cancel({ notifications: [{ id: 1001 }, { id: 1002 }] })

    const tomorrow7pm = new Date()
    tomorrow7pm.setDate(tomorrow7pm.getDate() + 1)
    tomorrow7pm.setHours(19, 0, 0, 0)

    await LocalNotifications.schedule({
      notifications: [
        {
          id: 1001,
          title: "Don't lose your streak!",
          body: 'Play a story today to keep your streak going.',
          schedule: { at: tomorrow7pm, repeats: true, every: 'day' },
          sound: 'default',
          extra: { route: '/' },
        },
      ],
    })

    const threeDays = new Date()
    threeDays.setDate(threeDays.getDate() + 3)
    threeDays.setHours(12, 0, 0, 0)

    await LocalNotifications.schedule({
      notifications: [
        {
          id: 1002,
          title: 'New stories are waiting',
          body: "We've missed you! Come back and explore new adventures.",
          schedule: { at: threeDays },
          sound: 'default',
          extra: { route: '/explore' },
        },
      ],
    })
  } catch (e) {
    console.warn('Local notifications not available:', e)
  }
}

export async function cancelInactivityReminder() {
  if (!Capacitor.isNativePlatform()) return
  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications')
    await LocalNotifications.cancel({ notifications: [{ id: 1002 }] })
    const threeDays = new Date()
    threeDays.setDate(threeDays.getDate() + 3)
    threeDays.setHours(12, 0, 0, 0)
    await LocalNotifications.schedule({
      notifications: [
        {
          id: 1002,
          title: 'New stories are waiting',
          body: "We've missed you! Come back and explore new adventures.",
          schedule: { at: threeDays },
          sound: 'default',
          extra: { route: '/explore' },
        },
      ],
    })
  } catch {}
}

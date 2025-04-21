'use client'
import { useState, useEffect, useCallback } from 'react' // Import useCallback
import InstallPrompt from '@/components/InstallPrompt'
// Helper function to convert VAPID key
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')

  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

export default function NotificationControls() {
  const [notificationPermission, setNotificationPermission] = useState<
    NotificationPermission | 'default'
  >('default')
  const [isSubscribed, setIsSubscribed] = useState(false) // Track subscription status
  const [isLoading, setIsLoading] = useState(true) // Track initial loading/setup
  const [error, setError] = useState<string | null>(null) // Store potential errors

  // --- Push Subscription Logic ---

  const subscribeUser = useCallback(async () => {
    setError(null) // Clear previous errors
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.warn('Push messaging is not supported')
      setError('Push messaging is not supported by this browser.')
      return
    }

    try {
      const swRegistration = await navigator.serviceWorker.ready // Wait for SW activation
      console.log('Service Worker is ready.')

      let subscription = await swRegistration.pushManager.getSubscription()
      console.log('Existing subscription:', subscription)

      if (subscription === null) {
        console.log('No existing subscription found, creating new one.')
        const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
        if (!publicKey) {
          console.error('VAPID public key not found.')
          setError('Configuration error: VAPID public key missing.')
          return
        }
        console.log('Using VAPID Public Key:', publicKey) // Add this log
        subscription = await swRegistration.pushManager.subscribe({
          userVisibleOnly: true, // Required
          applicationServerKey: urlBase64ToUint8Array(publicKey),
        })
        console.log('New subscription created:', subscription)

        // Send the new subscription to the backend
        await sendSubscriptionToBackend(subscription)
      } else {
        console.log('User is already subscribed.')
        // Optional: You might want to send the existing subscription to the backend
        // again to ensure it's up-to-date, especially if keys could change.
        // await sendSubscriptionToBackend(subscription);
      }
      setIsSubscribed(true)
    } catch (err) {
      console.error('Failed to subscribe the user: ', err)
      // Handle specific errors (e.g., user denied permission after granting it before)
      if (err instanceof Error && err.name === 'NotAllowedError') {
        setError('Subscription failed: Permission was denied.')
        // Update permission state if it changed externally
        setNotificationPermission('denied')
      } else {
        setError(`Subscription failed: ${err instanceof Error ? err.message : String(err)}`)
      }
      setIsSubscribed(false)
    }
  }, []) // No dependencies needed if VAPID key is stable via env

  const sendSubscriptionToBackend = async (subscription: PushSubscription) => {
    try {
      const response = await fetch('/api-helpers/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(subscription),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Server error: ${response.status}`)
      }

      console.log('Subscription sent to backend successfully.')
      // Optionally show a success message to the user
    } catch (err) {
      console.error('Failed to send subscription to backend:', err)
      setError(`Failed to save subscription: ${err instanceof Error ? err.message : String(err)}`)
      // If sending fails, we might consider the user not fully subscribed
      // setIsSubscribed(false); // Decide on UX: is local subscription enough?
    }
  }

  // --- Effect for Initial Setup ---
  useEffect(() => {
    setIsLoading(true)
    setError(null)
    if ('Notification' in window && 'serviceWorker' in navigator) {
      // 1. Set initial permission state
      setNotificationPermission(Notification.permission)

      // 2. Register Service Worker
      navigator.serviceWorker
        .register('/service-worker.js')
        .then((swReg) => {
          console.log('Service Worker is registered', swReg)

          // 3. If permission already granted, try to subscribe immediately
          if (Notification.permission === 'granted') {
            subscribeUser() // Attempt subscription on load if already granted
          }
        })
        .catch((error) => {
          console.error('Service Worker Error', error)
          setError(`Service Worker registration failed: ${error.message}`)
        })
        .finally(() => {
          setIsLoading(false) // Loading finished after SW registration attempt
        })
    } else {
      console.warn('Notifications or Service Workers not supported.')
      setError('Notifications or Service Workers are not supported by this browser.')
      setIsLoading(false)
    }
  }, [subscribeUser]) // Add subscribeUser as dependency

  // --- Permission Request ---
  const requestNotificationPermission = () => {
    setError(null) // Clear error before requesting
    if (!('Notification' in window)) {
      alert('This browser does not support desktop notification')
      return
    }

    Notification.requestPermission().then((permission) => {
      setNotificationPermission(permission)
      if (permission === 'granted') {
        console.log('Notification permission granted.')
        // Now that permission is granted, subscribe the user
        subscribeUser()
      } else {
        console.log('Notification permission denied.')
        setError("Permission was denied. You won't receive push notifications.")
        setIsSubscribed(false) // Ensure subscription state is false if denied
      }
    })
  }

  // --- Trigger Test Push (Server-Side) ---
  const triggerServerPush = async () => {
    setError(null)
    if (!isSubscribed) {
      alert('Please subscribe to notifications first.')
      return
    }
    try {
      console.log('Attempting to trigger server push...')
      const response = await fetch('/api-helpers/notifications') // Make GET request
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Server error: ${response.status}`)
      }
      const result = await response.json()
      console.log('Server push trigger response:', result)
      //alert(result.message || "Push notification trigger sent!"); // Give feedback
    } catch (err) {
      console.error('Failed to trigger server push:', err)
      setError(`Failed to trigger push: ${err instanceof Error ? err.message : String(err)}`)
      alert(`Error triggering push: ${err instanceof Error ? err.message : String(err)}`)
    }
  }
  return (
    <details>
      <summary>Notification Controls</summary>
      <div className="flex flex-col gap-4 items-center border border-dashed border-gray-400 p-4 rounded-md w-full">
        <h2 className="text-lg font-semibold mb-2">Web Push Notifications</h2>
        <InstallPrompt />
        {isLoading && <p className="text-gray-500">Initializing...</p>}
        {error && <p className="text-red-600 text-sm font-medium">Error: {error}</p>}

        {!isLoading && (
          <>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Permission Status:{' '}
              <span
                className={`font-semibold ${
                  notificationPermission === 'granted'
                    ? 'text-green-600'
                    : notificationPermission === 'denied'
                      ? 'text-red-600'
                      : 'text-yellow-600'
                }`}
              >
                {notificationPermission}
              </span>
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Subscription Status:{' '}
              <span className={`font-semibold ${isSubscribed ? 'text-green-600' : 'text-red-600'}`}>
                {isSubscribed ? 'Subscribed' : 'Not Subscribed'}
              </span>
            </p>

            <div className="flex flex-col sm:flex-row gap-3 mt-2">
              {notificationPermission !== 'granted' && (
                <button
                  onClick={requestNotificationPermission}
                  className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={notificationPermission === 'denied'}
                >
                  {notificationPermission === 'denied'
                    ? 'Permission Denied'
                    : 'Allow Notifications'}
                </button>
              )}

              {/* Button to trigger server-side push */}
              <button
                onClick={triggerServerPush}
                className="bg-green-600 hover:bg-green-800 text-white font-bold py-2 px-4 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!isSubscribed || notificationPermission !== 'granted'}
              >
                Send Push Notification (Server)
              </button>
            </div>
            {notificationPermission === 'denied' && (
              <p className="text-xs text-gray-500 mt-2">
                You have denied notification permission. Please update your browser settings if you
                want to enable them.
              </p>
            )}
          </>
        )}
      </div>
    </details>
  )
}

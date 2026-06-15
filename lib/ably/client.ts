import Ably from 'ably'

let client: Ably.Realtime | null = null

export function getAblyClient(): Ably.Realtime | null {
  if (!process.env.NEXT_PUBLIC_ABLY_API_KEY) {
    console.warn('Ably API key not configured')
    return null
  }
  if (!client) {
    client = new Ably.Realtime({
      key: process.env.NEXT_PUBLIC_ABLY_API_KEY,
      autoConnect: true,
    })
  }
  return client
}

export function getChatChannel(userId: string, otherUserId: string): string {
  return ['chat', userId, otherUserId].sort().join(':')
}

export function getGroupChannel(groupId: string): string {
  return `group:${groupId}`
}

export function getUserChannel(userId: string): string {
  return `user:${userId}`
}

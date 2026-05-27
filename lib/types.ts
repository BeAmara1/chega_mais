export interface Profile {
  id: string
  username: string
  avatar_url: string | null
  bio: string | null
  created_at: string
}

export interface Event {
  id: string
  title: string
  description: string | null
  date: string
  location: string | null
  image_url: string | null
  price: number | null
  url_source: string | null
  source_platform: string | null
  category: string | null
  created_at: string
}

export interface EventWithAttendees extends Event {
  attendee_count: number
  is_attending: boolean
  is_liked: boolean
  friends_attending: Profile[]
}

export interface Friendship {
  id: string
  user_id: string
  friend_id: string
  status: 'pending' | 'accepted' | 'blocked'
  created_at: string
  friend?: Profile
  user?: Profile
}

export interface EventAttendee {
  id: string
  event_id: string
  user_id: string
  created_at: string
  profile?: Profile
}

export interface EventComment {
  id: string
  event_id: string
  user_id: string
  content: string | null
  rating: number | null
  created_at: string
  profile?: Profile
}

export interface Message {
  id: string
  sender_id: string
  receiver_id: string | null
  group_id: string | null
  content: string
  read_at: string | null
  created_at: string
  sender?: Profile
}

export interface ChatGroup {
  id: string
  name: string
  created_by: string
  created_at: string
}

export interface ChatGroupMember {
  id: string
  group_id: string
  user_id: string
  joined_at: string
  profile?: Profile
}

export interface Conversation {
  id: string
  type: 'direct' | 'group'
  name: string
  avatar_url: string | null
  last_message: Message | null
  unread_count: number
  other_user?: Profile
  group?: ChatGroup
}

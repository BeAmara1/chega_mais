'use client'

import { useState, useEffect, useCallback } from 'react'
import { MessageCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from '@/components/ui/dialog'
import { ChatListView } from './chat-list-view'
import { DirectChatView } from './direct-chat-view'
import { GroupChatView } from './group-chat-view'
import { CreateGroupView } from './create-group-view'
import { GroupSettingsView } from './group-settings-view'

type ViewState =
  | { type: 'list' }
  | { type: 'dm-chat'; otherUserId: string; otherUsername: string }
  | { type: 'group-chat'; groupId: string; groupName: string }
  | { type: 'group-settings'; groupId: string }
  | { type: 'create-group' }

export function ChatDialog() {
  const [open, setOpen] = useState(false)
  const [view, setView] = useState<ViewState>({ type: 'list' })
  const [userId, setUserId] = useState<string | null>(null)
  const [friends, setFriends] = useState<{ id: string; username: string; avatar_url: string | null }[]>([])
  const [groupName, setGroupName] = useState<string>('')

  useEffect(() => {
    if (!open) return
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUserId(user.id)
        supabase
          .from('friendships')
          .select('user_id, friend_id')
          .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)
          .eq('status', 'accepted')
          .then(({ data: friendships }) => {
            const friendIds = (friendships || []).map((f: any) =>
              f.user_id === user.id ? f.friend_id : f.user_id
            )
            if (friendIds.length > 0) {
              supabase
                .from('profiles')
                .select('id, username, avatar_url')
                .in('id', friendIds)
                .then(({ data }) => setFriends(data || []))
            }
          })
      }
    })
  }, [open])

  const handleOpenChange = useCallback((o: boolean) => {
    setOpen(o)
    if (!o) {
      setView({ type: 'list' })
      setGroupName('')
    }
  }, [])

  const handleBack = useCallback(() => setView({ type: 'list' }), [])

  const handleOpenSettings = useCallback((gId: string) => {
    setView({ type: 'group-settings', groupId: gId })
  }, [])

  const handleGroupUpdated = useCallback((data: { name?: string; description?: string | null; avatar_url?: string | null }) => {
    if (data.name) setGroupName(data.name)
  }, [])

  const handleGroupDeleted = useCallback(() => {
    setView({ type: 'list' })
  }, [])

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" title="Chat">
          <MessageCircle className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent
        className="flex flex-col p-0 gap-0 max-w-full md:max-w-2xl h-[100dvh] md:max-h-[80vh]"
        showCloseButton={false}
      >
        {view.type === 'list' && (
          <ChatListView
            userId={userId}
            friends={friends}
            onOpenDm={(id, name) => setView({ type: 'dm-chat', otherUserId: id, otherUsername: name })}
            onOpenGroup={(id, name) => {
              setGroupName(name)
              setView({ type: 'group-chat', groupId: id, groupName: name })
            }}
            onCreateGroup={() => setView({ type: 'create-group' })}
            onClose={() => setOpen(false)}
          />
        )}

        {view.type === 'dm-chat' && (
          <DirectChatView
            otherUserId={view.otherUserId}
            otherUsername={view.otherUsername}
            userId={userId!}
            onBack={handleBack}
          />
        )}

        {view.type === 'group-chat' && (
          <GroupChatView
            groupId={view.groupId}
            groupName={groupName}
            userId={userId!}
            onBack={handleBack}
            onSettings={handleOpenSettings}
          />
        )}

        {view.type === 'group-settings' && (
          <GroupSettingsView
            groupId={view.groupId}
            currentUserId={userId!}
            onBack={handleBack}
            onGroupUpdated={handleGroupUpdated}
            onGroupDeleted={handleGroupDeleted}
          />
        )}

        {view.type === 'create-group' && (
          <CreateGroupView
            userId={userId!}
            friends={friends}
            onBack={handleBack}
            onCreated={(groupId) => {
              setGroupName('')
              setView({ type: 'group-chat', groupId, groupName: '' })
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

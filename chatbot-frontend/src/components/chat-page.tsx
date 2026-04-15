"use client"

import { authFetch } from "@/app/utils/authFetch"
import { useEffect, useState } from "react"
import type { Conversation } from "../types/chat"
import ChatArea from "./chat-area"
import Sidebar from "./sidebar"

interface ChatPageProps {
  user: { id: string; email: string } | null
  onLogout: () => void
}

export default function ChatPage({ user, onLogout }: ChatPageProps) {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeConversationId, setActiveConversationId] = useState("")
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [isAssistantTyping, setIsAssistantTyping] = useState(false)
  const [isPaused, setIsPaused] = useState(false)

  const activeConversation = conversations.find((c: any) => String((c as any).conversationID) === activeConversationId)

  const handleNewChat = () => {
    const newConversation: any = {
      conversationID: Date.now(),
      title: "Đoạn chat mới",
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    setConversations([newConversation as Conversation, ...(conversations as any)])
    setActiveConversationId(String(newConversation.conversationID))
  }

  // Đẩy tin nhắn user lên UI
  const handleSendMessage = (message: string) => {
    if (!activeConversation) return

    const userMessage = {
      messageID: Date.now(),
      conversationID: Number(activeConversationId),
      role: "user" as const,
      text: message,
      timestamp: new Date().toISOString(),
    }

    setConversations((prev: any) =>
      (prev as any).map((conv: any) => {
        if (String(conv.conversationID) === activeConversationId) {
          return {
            ...conv,
            messages: [...conv.messages, userMessage],
            updatedAt: new Date().toISOString(),
          }
        }
        return conv
      }),
    )
  }

  // Nhận response từ API và đẩy lên UI
  const handleReceiveResponse = (response: string) => {
    if (!response) return

    const assistantMessage = {
      messageID: Date.now(),
      conversationID: Number(activeConversationId),
      role: "assistant" as const,
      text: response,
      timestamp: new Date().toISOString(),
    }

    setConversations((prev: any) =>
      (prev as any).map((conv: any) => {
        if (String(conv.conversationID) === activeConversationId) {
          return {
            ...conv,
            messages: [...conv.messages, assistantMessage],
            updatedAt: new Date().toISOString(),
          }
        }
        
        return conv
      }),
    )
  }

  // Load messages for active conversation from API
  useEffect(() => {
    const loadHistory = async () => {
      if (!activeConversationId) return;
      try {
        const res = await authFetch(
          `/api/chat/history/${activeConversationId}?limit=50&offset=0`,
          { method: "GET" }
        );
        const data = await res.json();
        if (!res.ok) {
          console.error("⚠️ Lỗi tải lịch sử đoạn chat:", data?.error);
          return;
        }

        const mappedMessages: any[] = Array.isArray(data?.messages)
          ? data.messages.map((m: any, idx: number) => ({
            messageID: m.messageID ?? idx,
            conversationID: m.conversationID ?? Number(activeConversationId),
            role: m.role === "assistant" ? "assistant" : "user",
            text: typeof m.text === "string" ? m.text : String(m.text ?? ""),
            timestamp: m.timestamp
              ? new Date(m.timestamp).toISOString()
              : new Date().toISOString(),
            files: Array.isArray(m.files)
              ? m.files.map((f: any) => ({
                name: f.name,
                url: f.url,
                size: f.size,
                type: f.type,
              }))
              : [],
          }))
          : [];

        setConversations((prev: any) => {
          const idx = prev.findIndex(
            (c: any) => String(c.conversationID) === activeConversationId
          );
          if (idx >= 0) {
            const next = [...prev];
            next[idx] = {
              ...next[idx],
              messages: mappedMessages,
              updatedAt: new Date().toISOString(),
            };
            return next;
          }

          const newConv = {
            conversationID: Number(activeConversationId),
            title: "Đoạn chat mới",
            messages: mappedMessages,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          return [newConv, ...prev];
        });
      } catch (err) {
        console.error("❌ Không thể tải lịch sử đoạn chat:", err);
      }
    };
    loadHistory();
  }, [activeConversationId]);


  const handleDeleteConversation = (id: string) => {
    const filtered = (conversations as any).filter((c: any) => String(c.conversationID) !== id)
    setConversations(filtered)
    if (activeConversationId === id && filtered.length > 0) {
      setActiveConversationId(String((filtered as any)[0].conversationID))
    }
  }

  const handleRenameConversation = (id: string, newTitle: string) => {
    setConversations((prevConversations: any) =>
      (prevConversations as any).map((conv: any) => {
        if (String(conv.conversationID) === id) {
          return {
            ...conv,
            title: newTitle,
            updatedAt: new Date().toISOString(),
          }
        }
        return conv
      }),
    )
  }

  const handleSelectConversation = (id: string) => {
    setActiveConversationId(id)
    setConversations((prev: any) => {
      const exists = (prev as any).some((c: any) => String(c.conversationID) === id)
      if (exists) return prev
      const placeholder = {
        conversationID: Number(id),
        title: "Đoạn chat",
        messages: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      return [...(prev as any), placeholder]
    })
  }

  return (
    <div className="flex h-screen bg-slate-900">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? "w-64" : "w-0"} transition-all duration-300 overflow-hidden`}>
        <Sidebar
          conversations={conversations}
          activeConversationId={activeConversationId}
          onSelectConversation={handleSelectConversation}
          onNewChat={handleNewChat}
          onDeleteConversation={handleDeleteConversation}
          onRenameConversation={handleRenameConversation}
          onLogout={onLogout}
          user={user}
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
        />
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        <ChatArea
          conversation={activeConversation}
          onSendMessage={handleSendMessage}
          onReceiveResponse={handleReceiveResponse}
          user={user}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          sidebarOpen={sidebarOpen}
          isAssistantTyping={isAssistantTyping}
          setIsAssistantTyping={setIsAssistantTyping}
          isPaused={isPaused}
          onTogglePause={() => setIsPaused((v) => !v)}
        />
      </div>
    </div>
  )
}

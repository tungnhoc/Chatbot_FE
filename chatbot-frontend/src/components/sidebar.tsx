"use client"

import { authFetch } from "@/app/utils/authFetch"
import { Button } from "@/components/ui/button"
import type { Conversation } from "@/types/chat"
import {
  ChevronLeft,
  LogOut,
  Menu,
  Plus,
  Search,
  Trash2,
  Edit2,
  Sparkles,
  MessageSquare,
  Check,
  X,
  User as UserIcon,
  ShieldAlert
} from "lucide-react"
import { useEffect, useState } from "react"

interface SidebarProps {
  conversations?: unknown
  activeConversationId?: string
  onSelectConversation?: (id: string) => void
  onNewChat?: () => void
  onDeleteConversation?: (id: string) => void
  onRenameConversation?: (id: string, newTitle: string) => void
  onLogout: () => void
  user: { id: string; email: string } | null
  isOpen: boolean
  onToggle: () => void
}

export default function Sidebar({
  onLogout,
  user,
  isOpen,
  onToggle,
  activeConversationId,
  onSelectConversation,
  onRenameConversation,
}: SidebarProps) {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editingTitle, setEditingTitle] = useState("")
  const [loading, setLoading] = useState(true)
  const [activeId, setActiveId] = useState<string>("")
  const [showLogoutDialog, setShowLogoutDialog] = useState(false)

  useEffect(() => {
    if (activeConversationId) {
      setActiveId(String(activeConversationId))
    }
  }, [activeConversationId])

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const res = await authFetch("/api/chat/conversations", { method: "GET" })
        const data = await res.json()

        if (!res.ok) {
          console.error("⚠️ Lỗi khi load đoạn chat:", data.error)
          setConversations([])
        } else {
          const items = Array.isArray(data.conversations) ? data.conversations : []
          const normalized = items.map((c: any) => ({
            ...c,
            conversationID: Number(c?.conversationID ?? c?.id ?? c?.conversation_id),
            title: String(c?.title ?? "Cuộc trò chuyện mới"),
          }))
          setConversations(normalized)
        }
      } catch (error) {
        console.error("❌ Không thể kết nối server:", error)
        setConversations([])
      } finally {
        setLoading(false)
      }
    }

    fetchConversations()

    const handleRenameEvent = (e: any) => {
      const { id, title } = e.detail || {}
      if (id && title) {
        setConversations((prev) =>
          prev.map((c) => (c.conversationID === Number(id) ? { ...c, title } : c))
        )
      }
    }

    window.addEventListener("conversationRenamed", handleRenameEvent)
    return () => {
      window.removeEventListener("conversationRenamed", handleRenameEvent)
    }
  }, [])

  const filteredConversations = conversations.filter((conv) =>
    conv.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleNewChatClick = async () => {
    try {
      const res = await authFetch("/api/chat/conversations/new", {
        method: "POST",
        body: JSON.stringify({ title: "Cuộc trò chuyện mới" }),
      })

      const data = await res.json()

      if (!res.ok) {
        alert(`⚠️ ${data.error || "Không thể tạo đoạn chat mới"}`)
        return
      }

      const newConv = {
        conversationID: data.conversation_id,
        userID: user?.id ? Number(user.id) : 0,
        title: data.title,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        messages: [],
        documentIds: [],
      }

      setConversations((prev) => [newConv, ...prev])
      setActiveId(String(newConv.conversationID))
      onSelectConversation?.(String(newConv.conversationID))
    } catch (error) {
      console.error("❌ Lỗi khi tạo đoạn chat:", error)
      alert("Không thể kết nối server")
    }
  }

  const handleSaveRename = async (id: number) => {
    const title = editingTitle.trim()
    if (!title) {
      setEditingId(null)
      setEditingTitle("")
      return
    }
    try {
      const res = await authFetch(`/api/chat/rename-conversation`, {
        method: "POST",
        body: JSON.stringify({ conversationId: id, newTitle: title }),
      })
      const data = await res.json()
      if (!res.ok) {
        alert(`⚠️ ${data?.error || "Không thể đổi tên"}`)
        return
      }
      setConversations((prev) => prev.map((c) => (c.conversationID === id ? { ...c, title } : c)))
      onRenameConversation?.(String(id), title)
    } catch (err) {
      console.error("❌ Lỗi đổi tên:", err)
      alert("Không thể kết nối server")
    } finally {
      setEditingId(null)
      setEditingTitle("")
    }
  }

  const handleCancelRename = () => {
    setEditingId(null)
    setEditingTitle("")
  }

  const handleDoubleClick = (conv: Conversation) => {
    setEditingId(conv.conversationID)
    setEditingTitle(conv.title)
  }

  const handleDeleteConversation = (id: number) => {
    ;(async () => {
      try {
        const res = await authFetch(`/api/chat/conversations/${id}`, { method: "DELETE" })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) {
          alert(`⚠️ ${data?.error || "Không thể xóa đoạn chat"}`)
          return
        }
        setConversations((prev) => prev.filter((c) => c.conversationID !== id))
        if (String(id) === activeId) setActiveId("")
      } catch (err) {
        console.error("❌ Lỗi xóa đoạn chat:", err)
        alert("Không thể kết nối server")
      }
    })()
  }

  const handleSelectConversation = (id: number) => {
    const idStr = String(id)
    setActiveId(idStr)
    onSelectConversation?.(idStr)
  }

  const handleLogoutClick = () => {
    setShowLogoutDialog(true)
  }

  const handleConfirmLogout = () => {
    setShowLogoutDialog(false)
    handleLogout()
  }

  const handleCancelLogout = () => {
    setShowLogoutDialog(false)
  }

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem("access_token")
      if (!token) {
        localStorage.removeItem("access_token")
        localStorage.removeItem("refresh_token")
        localStorage.removeItem("isAuthenticated")
        localStorage.removeItem("user")
        window.location.href = "/"
        return
      }

      await authFetch("/api/auth/logout", {
        method: "POST",
      })

      localStorage.removeItem("access_token")
      localStorage.removeItem("refresh_token")
      localStorage.removeItem("isAuthenticated")
      localStorage.removeItem("user")

      window.location.href = "/"
    } catch (err: any) {
      console.error("❌ Lỗi đăng xuất:", err)
      localStorage.removeItem("access_token")
      localStorage.removeItem("refresh_token")
      localStorage.removeItem("isAuthenticated")
      localStorage.removeItem("user")
      window.location.href = "/"
    }
  }

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={onToggle}
        className="fixed top-3 left-3 z-50 md:hidden glass-panel p-2 rounded-xl text-white border border-slate-700/80 shadow-lg"
      >
        <Menu size={20} />
      </button>

      {/* Sidebar Container */}
      <aside
        className={`${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } fixed md:relative md:translate-x-0 transition-transform duration-300 z-40 w-72 h-screen bg-[#090D14] border-r border-slate-800/80 flex flex-col`}
      >
        {/* Branding & New Chat Header */}
        <div className="p-4 border-b border-slate-800/80 space-y-3">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
                <Sparkles className="w-4 h-4" />
              </div>
              <span className="font-extrabold text-lg tracking-tight text-white">
                DocuMind <span className="text-indigo-400 text-xs font-semibold">AI</span>
              </span>
            </div>

            <button
              onClick={onToggle}
              className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
              title="Thu gọn"
            >
              <ChevronLeft size={18} />
            </button>
          </div>

          <Button
            onClick={handleNewChatClick}
            className="w-full bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white rounded-xl py-2.5 flex items-center justify-center gap-2 text-sm font-semibold shadow-lg shadow-indigo-600/20 transition-all hover:scale-[1.01]"
          >
            <Plus size={16} />
            <span>Trò chuyện mới</span>
          </Button>
        </div>

        {/* Search Bar */}
        <div className="px-3 py-2.5 border-b border-slate-800/60">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              placeholder="Tìm lịch sử..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900/80 text-white placeholder-slate-500 text-xs rounded-xl pl-9 pr-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 border border-slate-800/80"
            />
          </div>
        </div>

        {/* Conversations History List */}
        <div className="flex-1 overflow-y-auto px-2 py-3 space-y-1">
          {loading ? (
            <div className="text-slate-500 text-xs p-4 text-center">Đang tải lịch sử...</div>
          ) : filteredConversations.length === 0 ? (
            <p className="text-slate-500 text-xs p-4 text-center">Chưa có lịch sử trò chuyện</p>
          ) : (
            filteredConversations.map((conv) => {
              const isSelected = activeId === String(conv.conversationID)
              return (
                <div
                  key={conv.conversationID}
                  className={`group relative flex items-center gap-2.5 px-3 py-2.5 rounded-xl cursor-pointer transition-all ${
                    isSelected
                      ? "bg-indigo-600/15 text-white border border-indigo-500/30 font-medium"
                      : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
                  }`}
                  onClick={() => handleSelectConversation(conv.conversationID)}
                >
                  <MessageSquare
                    className={`w-4 h-4 flex-shrink-0 ${
                      isSelected ? "text-indigo-400" : "text-slate-500 group-hover:text-slate-300"
                    }`}
                  />

                  {editingId === conv.conversationID ? (
                    <input
                      type="text"
                      value={editingTitle}
                      onChange={(e) => setEditingTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSaveRename(conv.conversationID)
                        else if (e.key === "Escape") handleCancelRename()
                      }}
                      onClick={(e) => e.stopPropagation()}
                      autoFocus
                      className="flex-1 bg-slate-900 text-white rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 border border-slate-700"
                    />
                  ) : (
                    <span
                      className="flex-1 truncate text-xs"
                      onDoubleClick={(e) => {
                        e.stopPropagation()
                        handleDoubleClick(conv)
                      }}
                    >
                      {conv.title}
                    </span>
                  )}

                  {editingId === conv.conversationID ? (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleSaveRename(conv.conversationID)
                        }}
                        className="p-1 text-emerald-400 hover:text-emerald-300"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleCancelRename()
                        }}
                        className="p-1 text-slate-400 hover:text-slate-200"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDoubleClick(conv)
                        }}
                        className="p-1 text-slate-400 hover:text-indigo-300"
                        title="Đổi tên"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteConversation(conv.conversationID)
                        }}
                        className="p-1 text-slate-400 hover:text-rose-400"
                        title="Xóa"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>

        {/* User Account Card at Bottom */}
        <div className="border-t border-slate-800/80 p-3 bg-[#070A0F]">
          <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900/60 border border-slate-800/80 mb-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center text-white text-xs font-bold shadow-sm flex-shrink-0">
                {user?.email?.[0].toUpperCase() || <UserIcon className="w-3.5 h-3.5" />}
              </div>
              <span className="text-xs text-slate-300 truncate font-medium">
                {user?.email || "Người dùng"}
              </span>
            </div>
          </div>

          <Button
            onClick={handleLogoutClick}
            variant="ghost"
            className="w-full justify-start text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl px-3 py-2 text-xs font-medium gap-2 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Đăng xuất tài khoản</span>
          </Button>
        </div>
      </aside>

      {/* Overlay Backdrop for Mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 md:hidden"
          onClick={onToggle}
        />
      )}

      {/* Logout Confirmation Modal */}
      {showLogoutDialog && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-panel rounded-2xl p-6 max-w-sm w-full border border-slate-800 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mx-auto">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-lg font-bold text-white">Xác nhận đăng xuất</h3>
              <p className="text-xs text-slate-400">
                Bạn có chắc chắn muốn đăng xuất khỏi ứng dụng <span className="text-slate-200 font-semibold">DocuMind AI</span> không?
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2.5 pt-2">
              <Button
                onClick={handleCancelLogout}
                variant="ghost"
                className="w-full bg-slate-800/80 hover:bg-slate-800 text-slate-300 text-xs font-medium rounded-xl py-2"
              >
                Hủy bỏ
              </Button>
              <Button
                onClick={handleConfirmLogout}
                className="w-full bg-rose-600 hover:bg-rose-500 text-white text-xs font-medium rounded-xl py-2 shadow-lg shadow-rose-600/20"
              >
                Đăng xuất
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}


"use client"
import { authFetch } from "@/app/utils/authFetch"
import { Button } from "@/components/ui/button"
import {
  Loader2,
  Menu,
  Paperclip,
  Send,
  Sparkles,
  Bot,
  User,
  FileText,
  X,
  CheckCircle2,
  MessageSquarePlus,
  ArrowUpRight,
  ShieldAlert
} from "lucide-react"
import type React from "react"
import { useEffect, useRef, useState } from "react"
import type { Conversation } from "../types/chat"

interface ChatAreaProps {
  conversation: Conversation | undefined
  onSendMessage: (message: string) => void
  onReceiveResponse: (response: string) => void
  onRenameConversation?: (id: string, newTitle: string) => void
  user: { id: string; email: string } | null
  onToggleSidebar?: () => void
  sidebarOpen?: boolean
  isAssistantTyping?: boolean
  setIsAssistantTyping?: (v: boolean) => void
  isPaused?: boolean
  onTogglePause?: () => void
}

function isGenericTitle(title: string | undefined): boolean {
  if (!title || !title.trim()) return true
  const lower = title.trim().toLowerCase()
  const genericTitles = [
    "cuộc trò chuyện mới",
    "đoạn chat mới",
    "trò chuyện mới",
    "new chat",
    "new conversation",
    "chat",
    "untitled",
  ]
  return genericTitles.includes(lower)
}

export default function ChatArea({
  conversation,
  onSendMessage,
  onReceiveResponse,
  onRenameConversation,
  user,
  onToggleSidebar,
  sidebarOpen,
  isAssistantTyping,
  setIsAssistantTyping,
  isPaused,
}: ChatAreaProps) {
  const [input, setInput] = useState("")
  const [files, setFiles] = useState<
    { file: File; id?: string; status: "processing" | "done" }[]
  >([])

  useEffect(() => {
    setFiles([])
    setInput("")
  }, [conversation?.conversationID])

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const textAreaRef = useRef<HTMLTextAreaElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [conversation?.messages, isAssistantTyping])

  const handleSendMessage = async () => {
    const text = input.trim()
    if (!text) return

    if (!conversation) {
      alert("❌ Chưa có cuộc trò chuyện để gửi tin nhắn!")
      return
    }

    const conversationId = conversation.conversationID

    // Tự động đổi tên cuộc trò chuyện theo câu hỏi nếu đang là tiêu đề mặc định (kiểu ChatGPT)
    let currentTitle = conversation.title || "Cuộc trò chuyện mới"
    if (isGenericTitle(conversation.title)) {
      const cleanQuestion = text.trim().replace(/\r?\n|\r/g, " ")
      const autoTitle = cleanQuestion.length > 36 ? cleanQuestion.slice(0, 36) + "..." : cleanQuestion

      if (autoTitle) {
        currentTitle = autoTitle
        onRenameConversation?.(String(conversationId), autoTitle)

        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("conversationRenamed", {
              detail: { id: Number(conversationId), title: autoTitle },
            })
          )
        }

        authFetch("/api/chat/rename-conversation", {
          method: "POST",
          body: JSON.stringify({
            conversationId: Number(conversationId),
            newTitle: autoTitle,
          }),
        }).catch((err) => console.error("❌ Lỗi tự động đổi tên cuộc trò chuyện:", err))
      }
    }

    const documentIds = files
      .filter((f) => f.status === "done" && f.id)
      .map((f) => f.id as string)

    onSendMessage(text)
    setInput("")
    setIsAssistantTyping?.(true)

    try {
      const res = await authFetch("/api/chat/send-message", {
        method: "POST",
        body: JSON.stringify({
          conversationId,
          message: text,
          documentIds,
          title: currentTitle,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        console.error("❌ Lỗi từ server:", data)
        alert(data.error || "Gửi tin nhắn thất bại")
        setIsAssistantTyping?.(false)
        return
      }

      const assistantResponse = data?.response || ""
      const returnedTitle = data?.title
      if (returnedTitle) {
        onRenameConversation?.(String(conversationId), returnedTitle)
        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("conversationRenamed", {
              detail: { id: Number(conversationId), title: returnedTitle },
            })
          )
        }
      }
      onReceiveResponse(assistantResponse)
    } catch (err) {
      console.error("❌ Lỗi handleSendMessage:", err)
      alert("Gửi tin nhắn thất bại, vui lòng kiểm tra kết nối.")
    } finally {
      setIsAssistantTyping?.(false)
    }
  }

  const uploadSingleFile = async (file: File) => {
    if (!conversation) return

    try {
      const form = new FormData()
      form.append("files", file)

      const res = await authFetch(`/api/chat/upload-file/${conversation.conversationID}`, {
        method: "POST",
        body: form,
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Upload thất bại")
      }

      const uploaded = data.uploaded?.[0]
      const documentId = uploaded?.document_id || data.documentIds?.[0]

      setFiles((prev) =>
        prev.map((f) =>
          f.file === file
            ? { ...f, id: documentId, status: "done" }
            : f
        )
      )
    } catch (err) {
      console.error("Upload error:", err)
      setFiles((prev) => prev.filter((f) => f.file !== file))
      alert("Tải lên thất bại cho file: " + file.name)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newlySelected = Array.from(e.target.files)
      setFiles((prev) => [
        ...prev,
        ...newlySelected.map((file) => ({
          file,
          status: "processing" as const,
        })),
      ])
      e.target.value = ""
      newlySelected.forEach((file) => uploadSingleFile(file))
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const autoResizeTextArea = () => {
    const el = textAreaRef.current
    if (!el) return
    el.style.height = "auto"
    const maxPx = Math.round(window.innerHeight * 0.35)
    el.style.height = Math.min(el.scrollHeight, maxPx) + "px"
  }

  useEffect(() => {
    autoResizeTextArea()
  }, [input])

  if (!conversation) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[#0B0F17] text-slate-400 p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-4 shadow-lg shadow-indigo-500/10">
          <MessageSquarePlus className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Chưa chọn cuộc trò chuyện</h2>
        <p className="text-sm text-slate-400 max-w-sm">
          Vui lòng chọn một cuộc trò chuyện từ danh sách bên trái hoặc tạo cuộc trò chuyện mới để bắt đầu.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-[#0B0F17] text-slate-100 relative overflow-hidden">
      {/* Top Glassmorphic Header */}
      <div className="sticky top-0 z-30 glass-panel border-b border-slate-800/80 px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
            title={sidebarOpen ? "Thu gọn thanh bên" : "Mở thanh bên"}
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-white font-semibold text-base tracking-tight truncate max-w-md">
                {conversation.title || "Cuộc trò chuyện mới"}
              </h1>
              <span className="text-[11px] font-medium text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                DocuMind AI Ready
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
        {conversation.messages.length === 0 ? (
          /* Empty State Suggestions */
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center max-w-xl mx-auto space-y-6">
            <div className="w-14 h-14 rounded-2xl bg-indigo-600/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-xl shadow-indigo-500/10">
              <Sparkles className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Xin chào! Tôi có thể giúp gì cho bạn?</h2>
              <p className="text-slate-400 text-sm">
                Hãy đặt câu hỏi, gửi nội dung cần hỗ trợ hoặc đính kèm tài liệu PDF để cùng phân tích.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full text-left pt-2">
              <button
                onClick={() => setInput("Hãy tóm tắt giúp tôi nội dung chính của tài liệu này.")}
                className="p-3.5 rounded-xl glass-panel border border-slate-800 hover:border-indigo-500/40 text-slate-300 hover:text-white transition-all text-xs group flex items-start justify-between"
              >
                <div>
                  <div className="font-semibold text-slate-200 group-hover:text-indigo-400 transition-colors">📄 Tóm tắt tài liệu PDF</div>
                  <div className="text-slate-400 mt-1">Trích xuất nội dung cốt lõi nhanh chóng</div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 transition-colors flex-shrink-0" />
              </button>

              <button
                onClick={() => setInput("Tôi muốn tìm hiểu thêm về cách tối ưu hóa hiệu suất làm việc.")}
                className="p-3.5 rounded-xl glass-panel border border-slate-800 hover:border-purple-500/40 text-slate-300 hover:text-white transition-all text-xs group flex items-start justify-between"
              >
                <div>
                  <div className="font-semibold text-slate-200 group-hover:text-purple-400 transition-colors">💡 Đặt câu hỏi tri thức</div>
                  <div className="text-slate-400 mt-1">Giải đáp thắc mắc chuyên sâu & chi tiết</div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-purple-400 transition-colors flex-shrink-0" />
              </button>
            </div>
          </div>
        ) : (
          /* Render Messages */
          conversation.messages.map((message) => (
            <div
              key={message.messageID}
              className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {message.role === "assistant" && (
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white flex-shrink-0 shadow-md shadow-indigo-500/20 mt-1">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-2xl rounded-2xl px-5 py-3.5 text-sm leading-relaxed ${
                  message.role === "user"
                    ? "bg-indigo-600 text-white rounded-br-none shadow-lg shadow-indigo-600/15"
                    : "glass-panel border border-slate-800 text-slate-100 rounded-bl-none shadow-md"
                }`}
              >
                <p className="break-words whitespace-pre-line leading-6">{message.text}</p>

                {message.files && message.files.length > 0 && (
                  <div className="mt-3 pt-2 border-t border-slate-700/50 space-y-1.5">
                    {message.files.map((file, idx) => (
                      <div
                        key={idx}
                        className="text-xs opacity-90 flex items-center gap-1.5 bg-slate-900/60 px-2.5 py-1 rounded-lg border border-slate-700/40 w-fit"
                      >
                        <FileText className="w-3.5 h-3.5 text-indigo-400" />
                        <span className="truncate max-w-[200px]">{file.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {message.role === "user" && (
                <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700/80 flex items-center justify-center text-slate-300 flex-shrink-0 mt-1 shadow-sm">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))
        )}

        {/* Typing indicator */}
        {isAssistantTyping && !isPaused && (
          <div className="flex gap-3 justify-start items-center">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white flex-shrink-0 shadow-md shadow-indigo-500/20">
              <Bot className="w-4 h-4" />
            </div>
            <div className="glass-panel border border-slate-800 text-slate-300 px-4 py-3 rounded-2xl rounded-bl-none flex items-center gap-1.5">
              <span className="w-2 h-2 bg-indigo-400 rounded-full animate-wave" style={{ animationDelay: "0s" }}></span>
              <span className="w-2 h-2 bg-indigo-400 rounded-full animate-wave" style={{ animationDelay: "0.2s" }}></span>
              <span className="w-2 h-2 bg-indigo-400 rounded-full animate-wave" style={{ animationDelay: "0.4s" }}></span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Floating Bottom Input Dock */}
      <div className="p-4 sm:p-6 bg-[#0B0F17]/90 backdrop-blur-md border-t border-slate-800/80">
        <div className="max-w-4xl mx-auto">
          {/* File Badges */}
          {files.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-2">
              {files.map((item, idx) => (
                <div
                  key={idx}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium border ${
                    item.status === "done"
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                      : "bg-slate-800/80 border-slate-700 text-slate-300"
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span className="truncate max-w-[180px]">{item.file.name}</span>
                  {item.status === "processing" ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  )}
                  <button
                    onClick={() => {
                      const next = files.filter((_, i) => i !== idx)
                      setFiles(next)
                    }}
                    className="p-0.5 text-slate-400 hover:text-slate-200 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="glass-input rounded-2xl p-2 flex items-end gap-2 border border-slate-700/80 focus-within:border-indigo-500/50 shadow-xl transition-all">
            <textarea
              ref={textAreaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Nhập tin nhắn..."
              className="flex-1 bg-transparent text-white placeholder-slate-500 focus:outline-none resize-none max-h-[160px] min-h-[40px] px-3 py-2 text-sm leading-relaxed"
              disabled={Boolean(isAssistantTyping && !isPaused)}
              rows={1}
            />

            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.txt"
              onChange={handleFileSelect}
              className="hidden"
            />

            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-2.5 rounded-xl text-slate-400 hover:text-indigo-400 hover:bg-slate-800/60 transition-colors flex-shrink-0"
              title="Đính kèm tài liệu PDF / Văn bản"
            >
              <Paperclip className="w-5 h-5" />
            </button>

            <Button
              onClick={handleSendMessage}
              disabled={!input.trim() || Boolean(isAssistantTyping && !isPaused)}
              className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl p-2.5 h-10 w-10 disabled:opacity-40 disabled:hover:bg-indigo-600 transition-all flex items-center justify-center flex-shrink-0 shadow-md shadow-indigo-600/20"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}


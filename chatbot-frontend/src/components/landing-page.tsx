"use client"

import { Button } from "@/components/ui/button"
import { useState } from "react"
import LoginModal from "./login-modal"
import SignupModal from "./signup-modal"
import { Sparkles, Paperclip, Search, BookOpen, MessageSquare, Bot, ArrowRight, ShieldCheck, Zap } from "lucide-react"

interface LandingPageProps {
  onLogin: (userData: { id: string; email: string }) => void
}

interface Message {
  id: string
  type: "user" | "bot"
  content: string
}

export default function LandingPage({ onLogin }: LandingPageProps) {
  const [showLogin, setShowLogin] = useState(false)
  const [showSignup, setShowSignup] = useState(false)
  const [inputValue, setInputValue] = useState("")
  const [messages, setMessages] = useState<Message[]>([])

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: inputValue,
    }
    setMessages((prev) => [...prev, userMessage])
    setInputValue("")

    setTimeout(() => {
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "bot",
        content: "Vui lòng đăng nhập để bắt đầu trò chuyện và phân tích tài liệu đầy đủ cùng DocuMind AI.",
      }
      setMessages((prev) => [...prev, botMessage])
    }, 400)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <div className="min-h-screen bg-[#0B0F17] text-slate-100 flex flex-col relative overflow-hidden">
      {/* Dynamic Background Glow Effect */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-gradient-to-tr from-indigo-600/15 via-purple-600/10 to-transparent blur-[120px] pointer-events-none rounded-full" />

      {/* Header */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 glass-panel px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/25">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-indigo-200">
                DocuMind
              </span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                AI
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            className="text-slate-300 hover:text-white hover:bg-slate-800/60 rounded-xl px-4 py-2 text-sm font-medium transition-colors"
            onClick={() => setShowLogin(true)}
          >
            Đăng nhập
          </Button>
          <Button
            className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl px-5 py-2 text-sm font-semibold shadow-lg shadow-indigo-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
            onClick={() => setShowSignup(true)}
          >
            Khám phá ngay
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-10 z-10 max-w-4xl mx-auto w-full">
        {messages.length > 0 ? (
          <div className="w-full flex-1 overflow-y-auto space-y-4 mb-6 pr-2">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${message.type === "user" ? "justify-end" : "justify-start"}`}
              >
                {message.type === "bot" && (
                  <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 flex-shrink-0 mt-1">
                    <Bot className="w-4 h-4" />
                  </div>
                )}
                <div
                  className={`max-w-md px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                    message.type === "user"
                      ? "bg-indigo-600 text-white rounded-br-none shadow-md shadow-indigo-600/10"
                      : "glass-panel text-slate-200 rounded-bl-none border border-slate-700/60"
                  }`}
                >
                  {message.content}
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Hero Section */
          <div className="text-center mb-8 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700/60 text-xs font-medium text-slate-300 mb-2">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              Trợ lý Trí tuệ Nhân tạo Thế hệ Mới
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white max-w-2xl leading-tight">
              Khám phá tri thức cùng{" "}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">
                DocuMind AI
              </span>
            </h1>
            <p className="text-slate-400 text-base max-w-lg mx-auto">
              Hỏi đáp thông minh, phân tích tài liệu chuyên sâu và tối ưu hóa hiệu suất làm việc của bạn.
            </p>
          </div>
        )}

        {/* Input Box Area */}
        <div className="w-full max-w-2xl">
          <div className="glass-panel p-3 rounded-2xl border border-slate-700/80 shadow-2xl focus-within:border-indigo-500/50 transition-all">
            <div className="flex items-center px-3 py-2">
              <input
                type="text"
                placeholder="Nhập câu hỏi hoặc nội dung bạn cần hỗ trợ..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyPress}
                className="w-full bg-transparent text-white placeholder-slate-500 text-sm focus:outline-none"
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputValue.trim()}
                className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-40 disabled:hover:bg-indigo-600 transition-all flex items-center justify-center shadow-md shadow-indigo-600/20"
              >
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Action Badges */}
            <div className="flex items-center gap-2 pt-3 border-t border-slate-800/80 px-2 flex-wrap">
              <button
                onClick={() => setShowLogin(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/50 hover:bg-slate-800 text-slate-300 text-xs font-medium border border-slate-700/50 transition-colors"
              >
                <Paperclip className="w-3.5 h-3.5 text-indigo-400" />
                <span>Đính kèm PDF</span>
              </button>
              <button
                onClick={() => setShowLogin(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/50 hover:bg-slate-800 text-slate-300 text-xs font-medium border border-slate-700/50 transition-colors"
              >
                <Search className="w-3.5 h-3.5 text-purple-400" />
                <span>Tìm kiếm thông tin</span>
              </button>
              <button
                onClick={() => setShowLogin(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/50 hover:bg-slate-800 text-slate-300 text-xs font-medium border border-slate-700/50 transition-colors"
              >
                <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
                <span>Tóm tắt văn bản</span>
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-5 text-center text-slate-500 text-xs border-t border-slate-800/80 z-10 glass-panel">
        <div className="flex items-center justify-center gap-2">
          <ShieldCheck className="w-4 h-4 text-slate-400" />
          <span>DocuMind AI © 2026. Bảo mật & An toàn dữ liệu người dùng.</span>
        </div>
      </footer>

      {/* Modals */}
      {showLogin && (
        <LoginModal
          onClose={() => setShowLogin(false)}
          onSuccess={onLogin}
          onSwitchToSignup={() => {
            setShowLogin(false)
            setShowSignup(true)
          }}
        />
      )}
      {showSignup && (
        <SignupModal
          onClose={() => setShowSignup(false)}
          onSuccess={onLogin}
          onSwitchToLogin={() => {
            setShowSignup(false)
            setShowLogin(true)
          }}
        />
      )}
    </div>
  )
}


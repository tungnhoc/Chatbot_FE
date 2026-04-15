"use client"

import { Button } from "@/components/ui/button"
import { useState } from "react"
import LoginModal from "./login-modal"
import SignupModal from "./signup-modal"

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

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: inputValue,
    }
    setMessages((prev) => [...prev, userMessage])
    setInputValue("")

    // Simulate bot response after a short delay
    setTimeout(() => {
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "bot",
        content: "Hãy đăng nhập đã để sử dụng tính năng này.",
      }
      setMessages((prev) => [...prev, botMessage])
    }, 500)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-950 flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-emerald-400 to-cyan-400 rounded-xl flex items-center justify-center px-3 py-2">
            <span className="text-slate-900 font-extrabold text-xl tracking-wide">Bot123</span>
          </div>
          <span className="text-white font-bold text-2xl">ChatBot</span>
        </div>

        <div className="flex items-center gap-4">
        <Button
          variant="outline"
          className="border-slate-700 text-slate-300 hover:bg-slate-800 bg-transparent text-lg px-5 py-2.5 rounded-xl"
          onClick={() => setShowLogin(true)}
        >
          Đăng nhập
        </Button>
        <Button
          className="bg-white text-slate-900 hover:bg-slate-100 text-lg px-5 py-2.5 rounded-xl"
          onClick={() => setShowSignup(true)}
        >
          Đăng ký miễn phí
        </Button>
      </div>

      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-8">
        <div className="w-full max-w-2xl flex flex-col h-full">
          {messages.length > 0 && (
            <div className="mb-6 flex-1 overflow-y-auto space-y-4 pb-4">
              {messages.map((message) => (
                <div key={message.id} className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-xs px-4 py-2 rounded-lg ${
                      message.type === "user" ? "bg-emerald-600 text-white" : "bg-slate-700 text-slate-100"
                    }`}
                  >
                    {message.content}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Title - only show when no messages */}
          {messages.length === 0 && (
            <div className="text-center mb-8">
              <h1 className="text-5xl font-bold text-white">Khi bạn sẵn sàng là chúng ta có thể bắt đầu.</h1>
            </div>
          )}

          {/* Prompt Input Area */}
          <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
            <div className="mb-4">
              <input
                type="text"
                placeholder="Hỏi bất kỳ điều gì"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                className="w-full bg-slate-700 text-white placeholder-slate-400 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap gap-3 justify-center">
              <button className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-colors">

                <span>Định kèm</span>
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-colors">

                <span>Tìm kiếm</span>
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-colors">
 
                <span>Học tập</span>
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-colors">

                <span>Thoại</span>
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center py-6 text-slate-400 text-sm border-t border-slate-800">
        <p>Bằng cách nhấn cho ChatGPT, bạn đồng ý với Điều khoản và đã đọc Chính sách riêng tư của chúng tôi.</p>
      </footer>

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

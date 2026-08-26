"use client"

import ChatPage from "@/components/chat-page"
import LandingPage from "@/components/landing-page"
import { useEffect, useState } from "react"

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState<{ id: string; email: string } | null>(null)
  const [isLoading, setIsLoading] = useState(true) // ✅ thêm biến loading

  useEffect(() => {
    const savedAuth = localStorage.getItem("isAuthenticated")
    const savedUser = localStorage.getItem("user")

    if (savedAuth === "true") {
      try {
        const parsedUser = savedUser ? JSON.parse(savedUser) : null

        if (parsedUser) {
          setIsAuthenticated(true)
          setUser(parsedUser)
        }
      } catch (e) {
        console.error("❌ Invalid user JSON:", savedUser)
        localStorage.removeItem("user")
        localStorage.removeItem("isAuthenticated")
      }
    }


    setIsLoading(false) // ✅ đã đọc xong localStorage
  }, [])

  const handleLogin = (userData: { id: string; email: string }) => {
    localStorage.setItem("user", JSON.stringify(userData))
    localStorage.setItem("isAuthenticated", "true")
    setUser(userData)
    setIsAuthenticated(true)
  }

  const handleLogout = () => {
    localStorage.removeItem("user")
    localStorage.removeItem("isAuthenticated")
    setUser(null)
    setIsAuthenticated(false)
  }

  // ✅ Khi đang load localStorage, chưa render gì cả
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-[#0B0F17] text-slate-300 gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin"></div>
        <span className="text-xs font-medium text-slate-400">Đang khởi tạo DocuMind AI...</span>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <LandingPage onLogin={handleLogin} />
  }

  return <ChatPage user={user} onLogout={handleLogout} />
}


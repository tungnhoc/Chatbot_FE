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
      <div className="flex items-center justify-center h-screen bg-slate-900 text-slate-300">
        Đang tải...
      </div>
    )
  }

  if (!isAuthenticated) {
    return <LandingPage onLogin={handleLogin} />
  }

  return <ChatPage user={user} onLogout={handleLogout} />
}

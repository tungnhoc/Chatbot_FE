"use client"
import { authFetch } from "@/app/utils/authFetch"
import { Button } from "@/components/ui/button"
import {
  Loader2,
  Menu,
  Mic,
  Paperclip,
  Send,
  Square,
} from "lucide-react"
import type React from "react"
import { useEffect, useRef, useState } from "react"
import type { Conversation } from "../types/chat"

interface ChatAreaProps {
  conversation: Conversation | undefined
  onSendMessage: (message: string) => void
  onReceiveResponse: (response: string) => void
  user: { id: string; email: string } | null
  onToggleSidebar?: () => void
  sidebarOpen?: boolean
  isAssistantTyping?: boolean
  setIsAssistantTyping?: (v: boolean) => void
  isPaused?: boolean
  onTogglePause?: () => void
}

export default function ChatArea({
  conversation,
  onSendMessage,
  onReceiveResponse,
  user,
  onToggleSidebar,
  sidebarOpen,
  isAssistantTyping,
  setIsAssistantTyping,
  isPaused,
  onTogglePause,
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
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const recordedChunksRef = useRef<Blob[]>([])
  const activeStreamRef = useRef<MediaStream | null>(null)
  const [isListening, setIsListening] = useState(false)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [conversation?.messages])


  const handleSendMessage = async () => {
    const text = input.trim();
    if (!text) return;

    if (!conversation) {
      alert("❌ Chưa có conversation để gửi tin nhắn!");
      return;
    }

    const conversationId = conversation.conversationID;
    const userId = user?.id;

    // Lấy các documentId đã upload xong
    const documentIds = files
      .filter((f) => f.status === "done" && f.id)
      .map((f) => f.id as string);

    // Show debug information
    console.log('Conversation ID:', conversationId);
    console.log('User ID:', userId);
    console.log('Document IDs:', documentIds);

    // Show user-friendly alert
    // alert(`Gửi tin nhắn tới hội thoại: ${conversationId}\n` +
    //   `Số file đính kèm: ${documentIds.length}\n` +
    //   `Nội dung: ${documentIds}`);

    // 🔥 1. Đẩy tin nhắn user lên UI ngay lập tức
    onSendMessage(text);
    setInput("");

    // 🔥 2. Hiển thị typing indicator
    setIsAssistantTyping?.(true);

    try {
      // 🔥 3. Gửi request tới route NextJS
      const res = await authFetch("/api/chat/send-message", {
        method: "POST",
        body: JSON.stringify({
          conversationId,
          message: text,
          documentIds,
          title: conversation.title || "Chat",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        console.error("❌ Lỗi từ server:", data);
        alert(data.error || "Gửi tin nhắn thất bại");
        setIsAssistantTyping?.(false);
        return;
      }

      console.log("📩 Server trả về:", data);

      // 🔥 4. Đẩy response từ API vào UI
      const assistantResponse = data?.response || "";
      onReceiveResponse(assistantResponse);

    } catch (err) {
      console.error("❌ Lỗi handleSendMessage:", err);
      alert("Gửi tin nhắn thất bại, vui lòng thử lại.");
    } finally {
      // 🔥 5. Tắt typing indicator
      setIsAssistantTyping?.(false);
    }
  }

  // const loadConversationFiles = async (conversationId: string | number) => {
  //     try {
  //       const res = await authFetch(`/api/chat/load-files/${conversationId}`, {
  //         method: "GET",
  //       })

  //       if (!res.ok) {
  //         const err = await res.json().catch(() => ({}))
  //         throw new Error(err.error || "Không thể tải danh sách file")
  //       }

  //       const data = await res.json()
  //       // Flask trả về: { conversation_id, files: [ { name, url, created_at } ] }
  //       return data.files || []
  //     } catch (error) {
  //       console.error("❌ Lỗi khi load file:", error)
  //       return []
  //     }
  //   }
  //   useEffect(() => {
  //     if (!conversation?.conversationID) return

  //     const fetchFiles = async () => {
  //       const filesFromServer = await loadConversationFiles(conversation.conversationID)

  //       console.log("📂 Files loaded:", filesFromServer)

  //       setFiles(
  //         filesFromServer.map((f: any) => ({
  //           id: f.id,
  //           file: { name: f.name } as File,
  //           status: "done" as const,
  //           url: f.url,
  //         }))
  //       )
  //     }

  //     fetchFiles()
  //   }, [conversation?.conversationID])

  const uploadSingleFile = async (file: File) => {
    if (!conversation) return;

    try {
      const form = new FormData();
      form.append("files", file);

      const res = await authFetch(`/api/chat/upload-file/${conversation.conversationID}`, {
        method: "POST",
        body: form, // 👈 Phải có dòng này
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        console.error("Upload failed:", data);
        throw new Error(data.error || "Upload thất bại");
      }

      const uploaded = data.uploaded?.[0];
      const documentId = uploaded?.document_id || data.documentIds?.[0];

      setFiles((prev) =>
        prev.map((f) =>
          f.file === file
            ? { ...f, id: documentId, status: "done" }
            : f
        )
      );
    } catch (err) {
      console.error("Upload error:", err);
      setFiles((prev) => prev.filter((f) => f.file !== file));
      alert("Tải lên thất bại cho file: " + file.name);
    }
  };



  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newlySelected = Array.from(e.target.files);
      setFiles((prev) => [
        ...prev,
        ...newlySelected.map((file) => ({
          file,
          status: "processing" as const,
        })),
      ]);
      e.target.value = "";
      newlySelected.forEach((file) => uploadSingleFile(file));
    }
  };


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
    const maxPx = Math.round(window.innerHeight * 0.5)
    el.style.height = Math.min(el.scrollHeight, maxPx) + "px"
  }

  useEffect(() => {
    autoResizeTextArea()
  }, [input])

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      activeStreamRef.current = stream

      const recorder = new MediaRecorder(stream)
      mediaRecorderRef.current = recorder
      recordedChunksRef.current = []

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) recordedChunksRef.current.push(e.data)
      }

      recorder.onstop = async () => {
        setIsListening(false)
        const blob = new Blob(recordedChunksRef.current, { type: "audio/webm" })
        const form = new FormData()
        form.append("audio", blob, "speech.webm")

        try {
          const res = await fetch("/api/speech-to-text", {
            method: "POST",
            body: form,
          })
          const data = await res.json().catch(() => ({}))
          const text: string =
            data?.text || "(Giọng nói đã được chuyển thành chữ - mock)"
          setInput((prev) => (prev ? `${prev} ${text}` : text))
        } catch {
          const text = "(Giọng nói đã được chuyển thành chữ - mock)"
          setInput((prev) => (prev ? `${prev} ${text}` : text))
        } finally {
          activeStreamRef.current?.getTracks().forEach((t) => t.stop())
          activeStreamRef.current = null
        }
      }

      recorder.start()
      setIsListening(true)
    } catch {
      setIsListening(false)
      alert("Không thể truy cập micro. Vui lòng cấp quyền microphone.")
    }
  }

  const stopRecording = () => {
    const rec = mediaRecorderRef.current
    if (rec && rec.state !== "inactive") rec.stop()
    else setIsListening(false)
  }

  const toggleVoice = () => {
    if (isListening) stopRecording()
    else startRecording()
  }

  if (!conversation) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-900">
        <p className="text-slate-400 text-lg">
          Chọn một đoạn chat để bắt đầu
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-slate-900 text-lg">
      {/* Header */}
      <div className="border-b border-slate-700 px-6 py-4 flex items-center gap-4">
        <button
          onClick={onToggleSidebar}
          className="text-slate-400 hover:text-white transition-colors hidden md:block"
          title={sidebarOpen ? "Thu vào thanh bên" : "Đưa ra thanh bên"}
        >
          <Menu size={26} />
        </button>
        <h1 className="text-white font-semibold text-xl">
          {conversation.title}
        </h1>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {conversation.messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-slate-400 text-lg">
              Bắt đầu một cuộc trò chuyện mới
            </p>
          </div>
        ) : (
          conversation.messages.map((message) => (
            <div
              key={message.messageID}
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"
                }`}
            >
              <div
                className={`max-w-2xl rounded-lg px-5 py-4 text-lg ${message.role === "user"
                  ? "bg-emerald-600 text-white"
                  : "bg-slate-800 text-slate-100"
                  }`}
              >
                <p className="break-words whitespace-pre-line">
                  {message.text}
                </p>

                {message.files && message.files.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {message.files.map((file, idx) => (
                      <div
                        key={idx}
                        className="text-sm opacity-75 flex items-center gap-1"
                      >
                        <Paperclip size={14} /> {file.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))
        )}

        {/* Typing indicator - wave animation */}
        {isAssistantTyping && !isPaused && (
          <div className="flex justify-start">
            <div className="bg-slate-800 text-slate-100 px-5 py-4 rounded-lg inline-flex items-end gap-1.5">
              <span className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-[wave_1.2s_ease-in-out_infinite]" style={{ animationDelay: "0s" }}></span>
              <span className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-[wave_1.2s_ease-in-out_infinite]" style={{ animationDelay: "0.2s" }}></span>
              <span className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-[wave_1.2s_ease-in-out_infinite]" style={{ animationDelay: "0.4s" }}></span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-slate-700 p-6 bg-slate-900">
        {files.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-2">
            {files.map((item, idx) => (
              <div
                key={idx}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-base ${item.status === "done"
                  ? "bg-slate-800 text-emerald-300"
                  : "bg-slate-800 text-slate-300"
                  }`}
              >
                <Paperclip size={16} />
                <span className="truncate">{item.file.name}</span>
                {item.status === "processing" && (
                  <Loader2 size={16} className="animate-spin text-slate-400" />
                )}
                <button
                  onClick={() => {
                    const next = files.filter((_, i) => i !== idx)
                    setFiles(next)
                  }}
                  className="text-slate-400 hover:text-red-400"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-3">
          <div className="flex-1 flex items-end gap-2 bg-slate-800 rounded-lg px-4 py-3 border border-slate-700 focus-within:border-emerald-400 transition-colors">
            <textarea
              ref={textAreaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Hỏi bất kỳ điều gì..."
              className="flex-1 bg-transparent text-white placeholder-slate-400 focus:outline-none resize-none max-h-[50vh] overflow-y-auto text-lg"
              disabled={Boolean(isAssistantTyping && !isPaused)}
              rows={1}
            />

            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />

            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-slate-400 hover:text-emerald-400 transition-colors"
              title="Thêm file"
            >
              <Paperclip size={22} />
            </button>

            {/* <button
              onClick={toggleVoice}
              className={`${isListening ? "text-red-400" : "text-slate-400"
                } hover:text-emerald-400 transition-colors`}
              title={isListening ? "Dừng ghi âm" : "Nói để chuyển thành chữ"}
              aria-pressed={isListening}
            >
              {isListening ? <Square size={22} /> : <Mic size={22} />}
            </button> */}
          </div>

          <Button
            onClick={handleSendMessage}
            disabled={!input.trim() || Boolean(isAssistantTyping && !isPaused)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-3 text-lg"
          >
            <Send size={22} />
          </Button>

          {/* <Button
            type="button"
            onClick={onTogglePause}
            variant="secondary"
            className="px-4 py-3"
          >
            {isAssistantTyping && !isPaused ? "Tạm dừng" : "Tiếp tục"}
          </Button> */}
        </div>
      </div>
    </div>
  )
}

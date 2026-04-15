export interface Message {
  messageID: number
  conversationID: number
  role: "user" | "assistant"
  text: string
  summary?: string
  embedding?: number[]
  timestamp: string
  files?: {
    name: string
    url?: string
    size?: number
    type?: string
  }[]
}

export interface Conversation {
  conversationID: number
  userID: number
  title: string
  summary?: string
  createdAt: string
  updatedAt: string
  documentIds?: string[]
  messages: Message[] 
}

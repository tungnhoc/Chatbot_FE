export interface SourceCitation {
  id: string
  filename: string
  document_id: number
  page?: number
  sheet?: string
  row?: number
  chunk_id?: number
}

export interface Message {
  messageID: number
  conversationID: number
  role: "user" | "assistant"
  text: string
  summary?: string
  embedding?: number[]
  timestamp: string
  sources?: SourceCitation[]
  trace_id?: string
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

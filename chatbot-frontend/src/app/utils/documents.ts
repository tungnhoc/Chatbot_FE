import { authFetch } from "./authFetch"

export type DocumentStatus = "uploading" | "queued" | "processing" | "ready" | "failed" | "error"
export interface UploadEntry { key: string; name: string; file?: File; id?: string; status: DocumentStatus; error?: string; notice?: string }

export function documentErrorMessage(value: string): string {
  if (value.startsWith("source_file_missing")) return "Bản gốc không còn trên máy chủ. Hãy tải lại tài liệu này."
  if (value.startsWith("embedding_credits")) return "Dịch vụ xử lý tài liệu đã hết hạn mức. Vui lòng liên hệ hỗ trợ."
  if (value.startsWith("embedding_credentials")) return "Dịch vụ xử lý tài liệu chưa được cấu hình đúng. Vui lòng liên hệ hỗ trợ."
  if (value.startsWith("missing_dependency")) return "Máy chủ chưa có đủ thành phần để đọc tài liệu này."
  if (value.startsWith("embedding_http_")) return "Dịch vụ xử lý tài liệu đang gặp lỗi. Vui lòng thử lại sau."
  if (value === "Processing failed: FileNotFoundError") return "Bản gốc không còn trên máy chủ. Hãy tải lại tài liệu này."
  if (value.startsWith("Processing failed:")) return "Không thể xử lý tài liệu. Hãy thử lại hoặc tải lên một bản khác."
  if (value.includes("Failed to fetch") || value.includes("NetworkError")) return "Không thể kết nối máy chủ. Vui lòng kiểm tra kết nối và thử lại."
  return value
}

export function documentUploadUrl(conversationId: number, backend = process.env.NEXT_PUBLIC_API_URL): string {
  if (!Number.isSafeInteger(conversationId) || conversationId < 1) throw new Error("Cuộc trò chuyện không hợp lệ")
  if (!backend) return `/api/chat/upload-file/${conversationId}`
  const url = new URL(backend)
  if (!["http:", "https:"].includes(url.protocol)) throw new Error("Địa chỉ máy chủ không hợp lệ")
  url.pathname = url.pathname.replace(/\/+$/, "").replace(/\/api$/, "") + `/api/conversations/${conversationId}/documents`
  url.search = ""
  url.hash = ""
  return url.toString()
}

export async function pollDocument(
  id: string,
  onStatus: (status: DocumentStatus, error?: string, notice?: string) => void,
  signal: AbortSignal,
  { intervalMs = 1500, timeoutMs = 240000 } = {}
) {
  const started = Date.now()
  while (!signal.aborted) {
    const response = await authFetch(`/api/chat/documents/${id}/status`, { signal, cache: "no-store" })
    const data = await response.json().catch(() => { throw new Error("Máy chủ trả về phản hồi không hợp lệ. Vui lòng thử lại.") })
    if (!response.ok) throw new Error(documentErrorMessage(data.error || "Không thể kiểm tra tài liệu"))
    if (!["queued", "processing", "ready", "failed"].includes(data.status)) throw new Error("Không xác định được trạng thái tài liệu. Hãy tải lại tài liệu.")
    const elapsed = Date.now() - started
    const notice = data.status === "queued" && elapsed >= 45000
      ? "Tài liệu chưa bắt đầu xử lý. Bạn có thể chờ thêm hoặc kiểm tra lại sau."
      : undefined
    onStatus(data.status, data.error ? documentErrorMessage(data.error) : undefined, notice)
    if (data.status === "ready" || data.status === "failed") return
    if (elapsed >= timeoutMs) throw new Error(data.status === "queued"
      ? "Tài liệu chưa bắt đầu xử lý. Vui lòng kiểm tra lại sau hoặc liên hệ hỗ trợ."
      : "Tài liệu đang mất nhiều thời gian xử lý. Bấm Kiểm tra lại để xem trạng thái mới.")
    await new Promise<void>((resolve) => {
      const abort = () => { clearTimeout(timer); resolve() }
      const timer = setTimeout(() => { signal.removeEventListener("abort", abort); resolve() }, intervalMs)
      signal.addEventListener("abort", abort, { once: true })
      if (signal.aborted) abort()
    })
  }
}

export const statusLabel: Record<DocumentStatus, string> = {
  uploading: "Đang tải lên", queued: "Đang chờ xử lý", processing: "Đang xử lý",
  ready: "Sẵn sàng", failed: "Xử lý thất bại", error: "Cần kiểm tra lại"
}

export function canSendWithDocuments(files: UploadEntry[]): boolean {
  return files.every(file => file.status === "ready" && Boolean(file.id))
}

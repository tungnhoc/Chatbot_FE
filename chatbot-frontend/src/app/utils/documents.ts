import { authFetch } from "./authFetch"

export type DocumentStatus = "uploading" | "queued" | "processing" | "ready" | "failed" | "error"
export interface UploadEntry { key: string; name: string; file?: File; id?: string; status: DocumentStatus; error?: string }

export async function pollDocument(id: string, onStatus: (status: DocumentStatus, error?: string) => void, signal: AbortSignal) {
  const started = Date.now()
  while (!signal.aborted) {
    const response = await authFetch(`/api/chat/documents/${id}/status`, { signal })
    const data = await response.json()
    if (!response.ok) throw new Error(data.error || "Kh?ng th? ki?m tra t?i li?u")
    onStatus(data.status, data.error || undefined)
    if (data.status === "ready" || data.status === "failed") return
    if (Date.now() - started > 240000) throw new Error("Ch?a x? l? xong. B?m Ki?m tra l?i ?? xem tr?ng th?i m?i.")
    await new Promise<void>((resolve) => {
      const abort = () => { clearTimeout(timer); resolve() }
      const timer = setTimeout(() => { signal.removeEventListener("abort", abort); resolve() }, 1500)
      signal.addEventListener("abort", abort, { once: true })
    })
  }
}

export const statusLabel: Record<DocumentStatus, string> = {
  uploading: "?ang t?i l?n", queued: "?ang ch?", processing: "?ang x? l?",
  ready: "S?n s?ng", failed: "X? l? th?t b?i", error: "C?n ki?m tra l?i"
}

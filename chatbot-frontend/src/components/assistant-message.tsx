"use client"

import { useState } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import remarkLegacyBreaks from "../lib/remark-legacy-breaks.mjs"

export async function copyAnswer(text: string, clipboard = navigator.clipboard) {
  await clipboard.writeText(text)
}

export function AssistantMessage({ text }: { text: string }) {
  const [copyStatus, setCopyStatus] = useState("")
  return (
    <div className="min-w-0">
      <div className="assistant-markdown">
        <ReactMarkdown
          remarkPlugins={[remarkGfm, remarkLegacyBreaks]}
          skipHtml
          components={{
            table: ({ node, ...props }) => (
              <div className="markdown-table-scroll" role="region" aria-label="Bảng trong câu trả lời" tabIndex={0}>
                <table {...props} />
              </div>
            ),
            a: ({ node, ...props }) => <a {...props} target="_blank" rel="noopener noreferrer" />,
            // Do not fetch arbitrary remote images supplied by an AI response.
            img: ({ alt }) => <span>{alt || "Hình ảnh"}</span>,
          }}
        >{text}</ReactMarkdown>
      </div>
      <div className="mt-3 flex items-center gap-2 text-xs text-slate-400">
        <button type="button" className="rounded px-2 py-1 hover:bg-slate-800 hover:text-white focus-visible:outline focus-visible:outline-indigo-400"
          onClick={async () => {
            try {
              await copyAnswer(text)
              setCopyStatus("Đã sao chép")
            } catch {
              setCopyStatus("Không thể sao chép. Hãy thử lại.")
            }
          }}>Sao chép</button>
        <span role="status">{copyStatus}</span>
      </div>
    </div>
  )
}

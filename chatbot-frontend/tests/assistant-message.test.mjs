import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import ts from 'typescript'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

const componentUrl = new URL('../src/components/assistant-message.tsx', import.meta.url)
const source = fs.readFileSync(componentUrl, 'utf8')
let code = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ES2022, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 },
}).outputText
code = code.replace(/from (["'])([^"']+)\1/g, (_, quote, specifier) => {
  const url = specifier.startsWith('.') ? new URL(specifier, componentUrl).href : import.meta.resolve(specifier)
  return 'from ' + JSON.stringify(url)
})
const { AssistantMessage, copyAnswer } = await import('data:text/javascript;base64,' + Buffer.from(code).toString('base64'))
const render = text => renderToStaticMarkup(React.createElement(AssistantMessage, { text }))

test('renders Vietnamese headings, emphasis, lists, quote and source markers', () => {
  const html = render('# Cơ chế huấn luyện\n\n**Hai giai đoạn** và *mô hình*. [S1]\n\n1. Giai đoạn một\n2. Giai đoạn hai\n\n- Dữ liệu\n- Mục tiêu\n\n> Chứng minh hiệu quả [S2]')
  for (const tag of ['h1', 'strong', 'em', 'ol', 'ul', 'blockquote']) assert.match(html, new RegExp('<' + tag + '(?:>| )'))
  assert.match(html, /Cơ chế huấn luyện/)
  assert.match(html, /\[S1\]/)
  assert.match(html, /\[S2\]/)
})

test('renders GFM tables and all legacy br variants inside cells', () => {
  const html = render('| Giai đoạn | Nội dung |\n|---|---|\n| Một | Dòng 1<br>Dòng 2<br/>Dòng 3<br />Dòng 4 |')
  assert.match(html, /class="markdown-table-scroll"/)
  assert.match(html, /<thead>/)
  assert.match(html, /<td>Một<\/td>/)
  assert.equal((html.match(/<br\/>/g) || []).length, 3)
  assert.doesNotMatch(html, /&lt;br/)
})

test('legacy breaks work in paragraphs and at the start of a block', () => {
  const html = render('Đoạn một<br>Đoạn hai\n\n<br />\n**Đoạn ba**')
  assert.equal((html.match(/<br\/>/g) || []).length, 2)
  assert.match(html, /<strong>Đoạn ba<\/strong>/)
})

test('preserves br literals inside inline, fenced, indented and table code', () => {
  const text = 'Mẫu: `<br>`\n\n~~~html\n<br/>\n<br />\n~~~\n\n    <br>\n\n| Code |\n|---|\n| `<br />` |'
  const html = render(text)
  assert.match(html, /<code>&lt;br&gt;<\/code>/)
  assert.match(html, /<pre><code class="language-html">&lt;br\/&gt;\n&lt;br \/&gt;/)
  assert.match(html, /<td><code>&lt;br \/&gt;<\/code><\/td>/)
  assert.doesNotMatch(html, /<br\/>/)
})

test('unsafe HTML, event handlers and executable links never become active', () => {
  const html = render('<script>alert(1)</script>\n\n<img src=x onerror="alert(1)">\n\n[bad](javascript:alert%281%29)\n\n[bad](data:text/html,hello)\n\n<iframe src="https://evil.example"></iframe>')
  assert.doesNotMatch(html, /<script|<img|<iframe|onerror=|href="(?:javascript|data):/i)
})

test('safe links get a new tab and secure rel; external images are not fetched', () => {
  const html = render('[Tài liệu](https://example.com/doc)\n\n![Mô tả](https://example.com/tracking.png)')
  assert.match(html, /href="https:\/\/example.com\/doc"/)
  assert.match(html, /rel="noopener noreferrer"/)
  assert.match(html, /target="_blank"/)
  assert.match(html, /Mô tả/)
  assert.doesNotMatch(html, /<img/)
})

test('incomplete Markdown is safe at every streaming boundary', () => {
  const sample = '# Kết quả\n\n**Huấn luyện** [S1]\n\n| Mục | Giá trị |\n|---|---|\n| Một | Dòng<br/>hai |\n\n~~~html\n<br>\n~~~\n[Link](https://example.com)'
  for (let end = 0; end <= sample.length; end++) assert.doesNotThrow(() => render(sample.slice(0, end)))
})

test('copy uses the original message with Markdown and HTML literals unchanged', async () => {
  const original = '**Tiếng Việt**\n\n| A | B |\n|---|---|\n| [S1] | x<br>y |\n\n`<br>`'
  let copied
  await copyAnswer(original, { writeText: async text => { copied = text } })
  assert.equal(copied, original)
})

test('new and historical assistant messages share the renderer and keep source panels', () => {
  const area = fs.readFileSync(new URL('../src/components/chat-area.tsx', import.meta.url), 'utf8')
  assert.match(area, /<AssistantMessage text={message.text}/)
  assert.match(area, /message.sources.map/)
  assert.doesNotMatch(area + source, /dangerouslySetInnerHTML|rehypeRaw/)
})

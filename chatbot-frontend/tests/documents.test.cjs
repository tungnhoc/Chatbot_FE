const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const ts = require('typescript')

function load(fetch, clock = Date) {
  const source = fs.readFileSync(path.join(__dirname, '../src/app/utils/documents.ts'), 'utf8')
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText
  const sandbox = { exports: {}, require: () => ({ authFetch: fetch }), process: { env: {} },
    URL, setTimeout, clearTimeout, Date: clock }
  vm.runInNewContext(code, sandbox)
  return sandbox.exports
}

test('status labels are Vietnamese UTF-8', () => {
  const { statusLabel } = load()
  assert.equal(statusLabel.queued, 'Đang chờ xử lý')
  assert.equal(statusLabel.processing, 'Đang xử lý')
  assert.equal(statusLabel.ready, 'Sẵn sàng')
})

test('uploads use Render directly instead of a Vercel function', () => {
  const { documentUploadUrl } = load()
  assert.equal(documentUploadUrl(42, 'https://chatbot-be-imn0.onrender.com'),
    'https://chatbot-be-imn0.onrender.com/api/conversations/42/documents')
  assert.equal(documentUploadUrl(42, 'https://example.com/api/'),
    'https://example.com/api/conversations/42/documents')
  assert.equal(documentUploadUrl(42, ''), '/api/chat/upload-file/42')
  assert.throws(() => documentUploadUrl(-1, 'https://example.com'))
})

test('polling follows queued, processing and ready', async () => {
  const statuses = ['queued', 'processing', 'ready']
  let calls = 0
  const { pollDocument } = load(async () => ({ ok: true, json: async () => ({ status: statuses[calls++] }) }))
  const updates = []
  await pollDocument('1', status => updates.push(status), new AbortController().signal, { intervalMs: 0 })
  assert.deepEqual(updates, statuses)
})

test('failed credit errors are translated and polling stops', async () => {
  let calls = 0
  const { pollDocument } = load(async () => { calls++; return {
    ok: true, json: async () => ({ status: 'failed', error: 'embedding_credits: provider credits exhausted' })
  } })
  let message
  await pollDocument('1', (_status, error) => { message = error }, new AbortController().signal)
  assert.match(message, /hết hạn mức/)
  assert.equal(calls, 1)
})

test('queue timeout gives an actionable message', async () => {
  const { pollDocument } = load(async () => ({ ok: true, json: async () => ({ status: 'queued' }) }))
  await assert.rejects(pollDocument('1', () => {}, new AbortController().signal, { timeoutMs: 0 }), /chưa bắt đầu xử lý/)
})

test('aborted polling sends no requests', async () => {
  let calls = 0
  const { pollDocument } = load(async () => { calls++ })
  const controller = new AbortController()
  controller.abort()
  await pollDocument('1', () => {}, controller.signal)
  assert.equal(calls, 0)
})

test('unknown status does not spin indefinitely', async () => {
  const { pollDocument } = load(async () => ({ ok: true, json: async () => ({ status: 'unknown' }) }))
  await assert.rejects(pollDocument('1', () => {}, new AbortController().signal), /Không xác định/)
})

test('chat UI has no damaged Vietnamese strings', () => {
  const source = fs.readFileSync(path.join(__dirname, '../src/components/chat-area.tsx'), 'utf8')
  assert.ok(source.includes('Tài liệu đang được xử lý.'))
  assert.ok(source.includes('Nguồn tham khảo'))
  for (const damaged of ['Kh?ng', 'T?i li?u', 'th?t b?i', 'Ngu?n', 'Ki?m tra', 'Th? l?i']) {
    assert.ok(!source.includes(damaged), damaged)
  }
})

test('failed or uncertain attachments cannot silently become general chat', () => {
  const { canSendWithDocuments } = load()
  for (const status of ['uploading', 'queued', 'processing', 'failed', 'error']) {
    assert.equal(canSendWithDocuments([{ key: 'file', id: '1', name: 'a.pdf', status }]), false)
  }
  assert.equal(canSendWithDocuments([{ key: 'file', id: '1', name: 'a.pdf', status: 'ready' }]), true)
  assert.equal(canSendWithDocuments([]), true)
})

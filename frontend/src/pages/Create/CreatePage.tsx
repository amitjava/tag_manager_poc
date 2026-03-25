import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import CodeMirror from '@uiw/react-codemirror'
import { javascript } from '@codemirror/lang-javascript'

export default function CreatePage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', tag_name: '', tag_code: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const newErrors: Record<string, string> = {}
    if (!form.name.trim()) newErrors.name = 'Advertiser name is required'
    if (!form.tag_name.trim()) newErrors.tag_name = 'Tag name is required'
    if (!form.tag_code.trim()) newErrors.tag_code = 'Tag code is required'
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setSubmitting(true)
    const res = await fetch('/api/advertisers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })

    if (res.ok) {
      navigate('/')
      return
    }

    const data = await res.json()
    if (res.status === 409) {
      setErrors({ name: 'An advertiser with this name already exists' })
    } else {
      setErrors({ form: data.error ?? 'Something went wrong' })
    }
    setSubmitting(false)
  }

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif', maxWidth: '720px' }}>
      <h1>Create Tag</h1>
      <form onSubmit={handleSubmit}>
        <Field label="Advertiser Name" error={errors.name}>
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            style={inputStyle}
            placeholder="e.g. Acme Corp"
          />
        </Field>

        <Field label="Tag Name" error={errors.tag_name}>
          <input
            value={form.tag_name}
            onChange={(e) => setForm({ ...form, tag_name: e.target.value })}
            style={inputStyle}
            placeholder="e.g. Homepage Pixel"
          />
        </Field>

        <Field label="Tag Code" error={errors.tag_code}>
          <div
            style={{
              border: errors.tag_code ? '1px solid #ef4444' : '1px solid #d1d5db',
              borderRadius: '4px',
              overflow: 'hidden',
            }}
          >
            <CodeMirror
              value={form.tag_code}
              height="200px"
              extensions={[javascript()]}
              onChange={(value) => setForm({ ...form, tag_code: value })}
              theme="light"
            />
          </div>
        </Field>

        {errors.form && <p style={{ color: '#ef4444' }}>{errors.form}</p>}

        <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
          <button type="submit" disabled={submitting} style={btnPrimary}>
            {submitting ? 'Saving...' : 'Save Tag'}
          </button>
          <button type="button" onClick={() => navigate('/')} style={btnSecondary}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}

function Field({
  label,
  error,
  children,
}: {
  label: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div style={{ marginBottom: '1.25rem' }}>
      <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem' }}>{label}</label>
      {children}
      {error && (
        <p style={{ color: '#ef4444', margin: '0.25rem 0 0', fontSize: '0.875rem' }}>{error}</p>
      )}
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.5rem 0.75rem',
  border: '1px solid #d1d5db',
  borderRadius: '4px',
  fontSize: '1rem',
  boxSizing: 'border-box',
}
const btnPrimary: React.CSSProperties = {
  padding: '0.5rem 1.5rem',
  background: '#2563eb',
  color: '#fff',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  fontWeight: 600,
}
const btnSecondary: React.CSSProperties = {
  padding: '0.5rem 1.5rem',
  background: '#f3f4f6',
  color: '#374151',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  fontWeight: 600,
}

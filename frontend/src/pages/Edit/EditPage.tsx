import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import CodeMirror from '@uiw/react-codemirror'
import { javascript } from '@codemirror/lang-javascript'

interface Advertiser {
  id: number
  name: string
  tag_name: string
  tag_code: string
}

export default function EditPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [advertiser, setAdvertiser] = useState<Advertiser | null>(null)
  const [form, setForm] = useState({ tag_name: '', tag_code: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    fetch(`/api/advertisers/${id}`)
      .then((r) => {
        if (r.status === 404) {
          setNotFound(true)
          return null
        }
        return r.json()
      })
      .then((data) => {
        if (!data) return
        setAdvertiser(data)
        setForm({ tag_name: data.tag_name, tag_code: data.tag_code })
      })
  }, [id])

  if (notFound)
    return (
      <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
        <p>Advertiser not found.</p>
        <button onClick={() => navigate('/')}>Back to table</button>
      </div>
    )
  if (!advertiser) return <p style={{ padding: '2rem' }}>Loading...</p>

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const newErrors: Record<string, string> = {}
    if (!form.tag_name.trim()) newErrors.tag_name = 'Tag name is required'
    if (!form.tag_code.trim()) newErrors.tag_code = 'Tag code is required'
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setSubmitting(true)
    const res = await fetch(`/api/advertisers/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })

    if (res.ok) {
      navigate('/')
      return
    }

    const data = await res.json()
    setErrors({ form: data.error ?? 'Something went wrong' })
    setSubmitting(false)
  }

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif', maxWidth: '720px' }}>
      <h1>Edit Tag</h1>
      <form onSubmit={handleSubmit}>
        <Field label="Advertiser Name">
          <input
            value={advertiser.name}
            readOnly
            style={{
              ...inputStyle,
              background: '#f9fafb',
              color: '#6b7280',
              cursor: 'not-allowed',
            }}
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
            {submitting ? 'Saving...' : 'Save Changes'}
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

import { useState, useEffect, useMemo } from 'react'
import { supabase } from './supabase'

// ── Constants ──────────────────────────────────────────────────────────────
const STATUSES    = ['To Do', 'In Progress', 'In Review', 'Done']
const PRIORITIES  = ['Low (1-10 Days)', 'Medium (1-3 Weeks)', 'High (ASAP)']
const DEPARTMENTS = ['Marketing', 'Design', 'Development', 'Operations', 'Sales', 'Admin']
const ASSIGNEES   = ['Kyle Nauj', 'Cece Rip']
const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const STATUS_COLORS = {
  'To Do':       { bg: '#F1EFE8', text: '#5F5E5A', dot: '#888780' },
  'In Progress': { bg: '#E6F1FB', text: '#185FA5', dot: '#378ADD' },
  'In Review':   { bg: '#FAEEDA', text: '#854F0B', dot: '#EF9F27' },
  'Done':        { bg: '#EAF3DE', text: '#3B6D11', dot: '#639922' },
}
const PRIORITY_COLORS = {
  'Low (1-10 Days)':    { bg: '#EAF3DE', text: '#3B6D11' },
  'Medium (1-3 Weeks)': { bg: '#FAEEDA', text: '#854F0B' },
  'High (ASAP)':        { bg: '#FAECE7', text: '#993C1D' },
}

// Calendar colours — by assignee
const ASSIGNEE_CAL = {
  'Kyle Nauj': { bar: '#185FA5', text: '#fff', light: '#deeaf8' },
  'Cece Rip':  { bar: '#8B3A62', text: '#fff', light: '#f5dcea' },
}

const ICONS = {
  project:  'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
  plus:     'M12 4v16m8-8H4',
  x:        'M6 18L18 6M6 6l12 12',
  check:    'M5 13l4 4L19 7',
  trash:    'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16',
  user:     'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
  dept:     'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
  comment:  'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z',
  meeting:  'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0',
  flag:     'M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9',
  folder:   'M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z',
  link:     'M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1',
  external: 'M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14',
  edit:     'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z',
  save:     'M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4',
  calendar: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
  chevL:    'M15 19l-7-7 7-7',
  chevR:    'M9 5l7 7-7 7',
  alert:    'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
}

// ── Date helpers ───────────────────────────────────────────────────────────
function parseDate(str) {
  if (!str) return null
  const [y, m, d] = str.split('-').map(Number)
  return new Date(y, m - 1, d)
}
function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}
function isOverdue(task) {
  if (!task.dueDate || task.status === 'Done') return false
  const due = parseDate(task.dueDate)
  const today = new Date(); today.setHours(0,0,0,0)
  return due < today
}

// ── Supabase helpers ───────────────────────────────────────────────────────
function rowToTask(row) {
  return {
    id:              row.id,
    name:            row.name           || '',
    assignee:        row.assignee       || 'Kyle Nauj',
    status:          row.status         || 'To Do',
    priority:        row.priority       || 'Medium (1-3 Weeks)',
    department:      row.department     || 'Marketing',
    comments:        row.comments       || '',
    startDate:       row.start_date     || '',
    dueDate:         row.due_date       || '',
    aboutProject:    row.about_project  || '',
    actionItems:     row.action_items   || [],
    sharepointUrl:   row.sharepoint_url    || '',
    sharepointLabel: row.sharepoint_label  || '',
    createdAt:       row.created_at     || '',
  }
}
function taskToRow(task) {
  return {
    id:               task.id,
    name:             task.name,
    assignee:         task.assignee,
    status:           task.status,
    priority:         task.priority,
    department:       task.department,
    comments:         task.comments,
    start_date:       task.startDate,
    due_date:         task.dueDate,
    about_project:    task.aboutProject,
    action_items:     task.actionItems,
    sharepoint_url:   task.sharepointUrl,
    sharepoint_label: task.sharepointLabel,
    created_at:       task.createdAt,
  }
}

async function dbLoadTasks() {
  const { data, error } = await supabase.from('tasks').select('*').order('created_at', { ascending: true })
  if (error) throw error
  return (data || []).map(rowToTask)
}
async function dbUpsertTask(task) {
  const { error } = await supabase.from('tasks').upsert(taskToRow(task), { onConflict: 'id' })
  if (error) throw error
}
async function dbDeleteTask(id) {
  const { error } = await supabase.from('tasks').delete().eq('id', id)
  if (error) throw error
}

// ── Shared UI components ───────────────────────────────────────────────────
function Svg({ d, size = 14, color = 'currentColor', style = {} }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={style}>
      <path d={d} />
    </svg>
  )
}
function StatusBadge({ status }) {
  const c = STATUS_COLORS[status] || STATUS_COLORS['To Do']
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: c.bg, color: c.text, borderRadius: 6, padding: '3px 8px', fontSize: 12, fontWeight: 500, whiteSpace: 'nowrap' }}>
      <span style={{ width: 7, height: 7, borderRadius: '50%', background: c.dot, display: 'inline-block' }} />
      {status}
    </span>
  )
}
function PriorityBadge({ priority }) {
  const c = PRIORITY_COLORS[priority] || PRIORITY_COLORS['Low (1-10 Days)']
  return (
    <span style={{ background: c.bg, color: c.text, borderRadius: 6, padding: '3px 8px', fontSize: 12, fontWeight: 500, whiteSpace: 'nowrap' }}>
      {priority}
    </span>
  )
}
function Avatar({ name, size = 28 }) {
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  const palette  = { 'Kyle Nauj': ['#E6F1FB', '#185FA5'], 'Cece Rip': ['#FBEAF0', '#993556'] }
  const [bg, text] = palette[name] || ['#F1EFE8', '#5F5E5A']
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: bg, color: text, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.38, fontWeight: 600, flexShrink: 0 }}>
      {initials}
    </div>
  )
}

// ── SharePoint section ─────────────────────────────────────────────────────
function SharePointSection({ url, label, onChange }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState({ url: url || '', label: label || '' })
  const save  = () => { onChange(draft.url.trim(), draft.label.trim()); setEditing(false) }
  const clear = () => { onChange('', ''); setDraft({ url: '', label: '' }); setEditing(false) }
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, color: '#333', display: 'flex', alignItems: 'center', gap: 7 }}>
          <Svg d={ICONS.folder} size={15} color="#378ADD" /> SharePoint folder
        </h3>
        {!editing && (
          <button onClick={() => { setDraft({ url: url || '', label: label || '' }); setEditing(true) }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: '#888', display: 'flex', alignItems: 'center', gap: 4 }}>
            <Svg d={ICONS.edit} size={13} color="#aaa" /> {url ? 'Edit' : 'Add link'}
          </button>
        )}
      </div>
      {editing ? (
        <div style={{ background: '#f7f9ff', border: '1px solid #d0e4f7', borderRadius: 10, padding: '14px 16px' }}>
          <div style={{ marginBottom: 10 }}>
            <label style={{ fontSize: 11, color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 4 }}>Folder label (optional)</label>
            <input value={draft.label} onChange={e => setDraft(p => ({ ...p, label: e.target.value }))} placeholder="e.g. Q3 Campaign Assets"
              style={{ width: '100%', border: '1px solid #d0e4f7', borderRadius: 7, padding: '8px 10px', fontSize: 13, boxSizing: 'border-box' }} />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 11, color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 4 }}>SharePoint URL</label>
            <input value={draft.url} onChange={e => setDraft(p => ({ ...p, url: e.target.value }))} placeholder="https://yourcompany.sharepoint.com/sites/..."
              style={{ width: '100%', border: '1px solid #d0e4f7', borderRadius: 7, padding: '8px 10px', fontSize: 13, fontFamily: 'monospace', boxSizing: 'border-box' }} />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={save} style={{ background: '#185FA5', color: 'white', border: 'none', borderRadius: 7, padding: '8px 18px', fontSize: 13, cursor: 'pointer', fontWeight: 600 }}>Save</button>
            <button onClick={() => setEditing(false)} style={{ background: '#f0f0f0', color: '#555', border: 'none', borderRadius: 7, padding: '8px 14px', fontSize: 13, cursor: 'pointer' }}>Cancel</button>
            {url && <button onClick={clear} style={{ background: 'none', color: '#c0392b', border: 'none', fontSize: 13, cursor: 'pointer', marginLeft: 'auto' }}>Remove</button>}
          </div>
        </div>
      ) : url ? (
        <a href={url} target="_blank" rel="noopener noreferrer"
          style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#f0f6ff', border: '1px solid #d0e4f7', borderRadius: 10, padding: '12px 16px', textDecoration: 'none' }}
          onMouseEnter={e => e.currentTarget.style.background = '#e3eeff'}
          onMouseLeave={e => e.currentTarget.style.background = '#f0f6ff'}>
          <div style={{ width: 36, height: 36, background: '#185FA5', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Svg d={ICONS.folder} size={18} color="white" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#185FA5', marginBottom: 2 }}>{label || 'SharePoint Folder'}</div>
            <div style={{ fontSize: 11, color: '#888', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{url}</div>
          </div>
          <Svg d={ICONS.external} size={16} color="#378ADD" />
        </a>
      ) : (
        <button onClick={() => setEditing(true)}
          style={{ width: '100%', border: '1.5px dashed #d0e4f7', borderRadius: 10, padding: '14px', fontSize: 13, color: '#aaa', cursor: 'pointer', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <Svg d={ICONS.link} size={14} color="#bbb" /> Paste SharePoint folder link
        </button>
      )}
    </div>
  )
}

// ── Task detail modal ──────────────────────────────────────────────────────
function TaskModal({ task, onClose, onSave, onDelete, currentUser }) {
  const [t, setT] = useState({ ...task })
  const [newAction, setNewAction] = useState('')
  const [newComment, setNewComment] = useState('')
  const [saving, setSaving] = useState(false)

  const update       = (field, val) => setT(prev => ({ ...prev, [field]: val }))
  const toggleAction = id => setT(prev => ({ ...prev, actionItems: prev.actionItems.map(a => a.id === id ? { ...a, done: !a.done } : a) }))
  const addAction    = () => {
    if (!newAction.trim()) return
    setT(prev => ({ ...prev, actionItems: [...prev.actionItems, { id: Date.now(), text: newAction.trim(), done: false }] }))
    setNewAction('')
  }
  const removeAction = id => setT(prev => ({ ...prev, actionItems: prev.actionItems.filter(a => a.id !== id) }))
  const addComment   = () => {
    if (!newComment.trim()) return
    const stamp = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    const line  = `[${currentUser} · ${stamp}]: ${newComment.trim()}`
    update('comments', t.comments ? t.comments + '\n' + line : line)
    setNewComment('')
  }
  const handleSave = async () => { setSaving(true); await onSave(t); setSaving(false); onClose() }

  const doneCount = t.actionItems.filter(a => a.done).length
  const progress  = t.actionItems.length ? Math.round((doneCount / t.actionItems.length) * 100) : 0

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 1000, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: 40, overflowY: 'auto' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: 'white', borderRadius: 14, width: '100%', maxWidth: 700, margin: '0 16px 40px', boxShadow: '0 8px 40px rgba(0,0,0,0.14)', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ padding: '24px 28px 0', borderBottom: '1px solid #f0f0f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
            <input value={t.name} onChange={e => update('name', e.target.value)}
              style={{ fontSize: 22, fontWeight: 700, border: 'none', outline: 'none', width: '85%', color: '#1a1a1a', fontFamily: 'Georgia, serif', letterSpacing: '-0.3px' }} placeholder="Task name" />
            <button onClick={onClose} style={{ background: '#f5f5f5', border: 'none', borderRadius: 8, padding: 6, cursor: 'pointer' }}><Svg d={ICONS.x} size={18} /></button>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, paddingBottom: 16 }}>
            {[
              { label: 'Status',     field: 'status',     options: STATUSES },
              { label: 'Assignee',   field: 'assignee',   options: ASSIGNEES },
              { label: 'Priority',   field: 'priority',   options: PRIORITIES },
              { label: 'Department', field: 'department', options: DEPARTMENTS },
            ].map(({ label, field, options }) => (
              <div key={field}>
                <div style={{ fontSize: 11, color: '#999', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</div>
                <select value={t[field]} onChange={e => update(field, e.target.value)}
                  style={{ border: '1px solid #e2e2e2', borderRadius: 6, padding: '5px 8px', fontSize: 13, background: 'white', cursor: 'pointer' }}>
                  {options.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
            ))}
            {/* Start + due date side by side */}
            <div>
              <div style={{ fontSize: 11, color: '#999', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Start date</div>
              <input type="date" value={t.startDate} onChange={e => update('startDate', e.target.value)}
                style={{ border: '1px solid #e2e2e2', borderRadius: 6, padding: '5px 8px', fontSize: 13 }} />
            </div>
            <div>
              <div style={{ fontSize: 11, color: '#999', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Due date</div>
              <input type="date" value={t.dueDate} onChange={e => update('dueDate', e.target.value)}
                style={{ border: '1px solid #e2e2e2', borderRadius: 6, padding: '5px 8px', fontSize: 13 }} />
            </div>
          </div>
        </div>

        <div style={{ padding: '20px 28px' }}>
          {/* About */}
          <div style={{ marginBottom: 24 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: '#333', marginBottom: 8 }}>About project</h3>
            <textarea value={t.aboutProject} onChange={e => update('aboutProject', e.target.value)} rows={3}
              style={{ width: '100%', border: '1px solid #e8e8e8', borderRadius: 8, padding: '10px 12px', fontSize: 14, color: '#444', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' }}
              placeholder="Describe this project..." />
          </div>

          {/* SharePoint */}
          <SharePointSection url={t.sharepointUrl} label={t.sharepointLabel}
            onChange={(url, label) => setT(p => ({ ...p, sharepointUrl: url, sharepointLabel: label }))} />

          {/* Action items */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: '#333' }}>Action items</h3>
              {t.actionItems.length > 0 && (
                <span style={{ fontSize: 12, color: '#888', display: 'flex', alignItems: 'center', gap: 8 }}>
                  {doneCount}/{t.actionItems.length} done
                  <span style={{ display: 'inline-block', width: 60, height: 4, background: '#f0f0f0', borderRadius: 2, verticalAlign: 'middle' }}>
                    <span style={{ display: 'block', width: `${progress}%`, height: '100%', background: '#639922', borderRadius: 2 }} />
                  </span>
                </span>
              )}
            </div>
            {t.actionItems.map(a => (
              <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', borderBottom: '1px solid #f5f5f5' }}>
                <button onClick={() => toggleAction(a.id)}
                  style={{ width: 18, height: 18, borderRadius: 4, border: `1.5px solid ${a.done ? '#639922' : '#ccc'}`, background: a.done ? '#639922' : 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, padding: 0 }}>
                  {a.done && <Svg d={ICONS.check} size={11} color="white" />}
                </button>
                <span style={{ fontSize: 14, color: a.done ? '#aaa' : '#333', textDecoration: a.done ? 'line-through' : 'none', flex: 1 }}>{a.text}</span>
                <button onClick={() => removeAction(a.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ddd', padding: 2 }}><Svg d={ICONS.trash} size={14} /></button>
              </div>
            ))}
            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              <input value={newAction} onChange={e => setNewAction(e.target.value)} onKeyDown={e => e.key === 'Enter' && addAction()}
                placeholder="Add action item…" style={{ flex: 1, border: '1px solid #e8e8e8', borderRadius: 6, padding: '7px 10px', fontSize: 13 }} />
              <button onClick={addAction} style={{ background: '#1a1a1a', color: 'white', border: 'none', borderRadius: 6, padding: '7px 14px', fontSize: 13, cursor: 'pointer' }}>Add</button>
            </div>
          </div>

          {/* Comments */}
          <div style={{ marginBottom: 24 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: '#333', marginBottom: 10 }}>Comments</h3>
            {t.comments && (
              <div style={{ background: '#f9f9f9', borderRadius: 8, padding: '10px 14px', marginBottom: 10 }}>
                {t.comments.split('\n').map((line, i) => <p key={i} style={{ fontSize: 13, color: '#555', margin: '4px 0' }}>{line}</p>)}
              </div>
            )}
            <div style={{ display: 'flex', gap: 8 }}>
              <Avatar name={currentUser} size={28} />
              <input value={newComment} onChange={e => setNewComment(e.target.value)} onKeyDown={e => e.key === 'Enter' && addComment()}
                placeholder="Add a comment…" style={{ flex: 1, border: '1px solid #e8e8e8', borderRadius: 6, padding: '7px 10px', fontSize: 13 }} />
              <button onClick={addComment} style={{ background: '#1a1a1a', color: 'white', border: 'none', borderRadius: 6, padding: '7px 14px', fontSize: 13, cursor: 'pointer' }}>Post</button>
            </div>
          </div>

          {/* Footer */}
          <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 16, borderTop: '1px solid #f0f0f0' }}>
            <button onClick={() => onDelete(task.id)}
              style={{ background: '#FAECE7', color: '#993C1D', border: 'none', borderRadius: 8, padding: '9px 16px', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Svg d={ICONS.trash} size={14} color="#993C1D" /> Delete task
            </button>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={onClose} style={{ background: '#f5f5f5', color: '#555', border: 'none', borderRadius: 8, padding: '9px 18px', fontSize: 13, cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleSave} disabled={saving}
                style={{ background: '#1a1a1a', color: 'white', border: 'none', borderRadius: 8, padding: '9px 20px', fontSize: 13, cursor: 'pointer', fontWeight: 600, opacity: saving ? 0.7 : 1 }}>
                {saving ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── New task modal ─────────────────────────────────────────────────────────
function NewTaskModal({ onClose, onAdd, currentUser }) {
  const [t, setT] = useState({
    name: '', assignee: currentUser, status: 'To Do', priority: 'Medium (1-3 Weeks)',
    department: 'Marketing', comments: '', startDate: '', dueDate: '', aboutProject: '',
    actionItems: [], sharepointUrl: '', sharepointLabel: '',
  })
  const [saving, setSaving] = useState(false)
  const update = (f, v) => setT(p => ({ ...p, [f]: v }))
  const handleCreate = async () => {
    if (!t.name.trim()) return
    setSaving(true)
    await onAdd({ ...t, id: Date.now(), createdAt: new Date().toISOString().split('T')[0] })
    setSaving(false)
    onClose()
  }
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: 'white', borderRadius: 14, width: '100%', maxWidth: 520, margin: '0 16px', padding: 28, boxShadow: '0 8px 40px rgba(0,0,0,0.14)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1a1a1a', fontFamily: 'Georgia, serif' }}>New task</h2>
          <button onClick={onClose} style={{ background: '#f5f5f5', border: 'none', borderRadius: 8, padding: 6, cursor: 'pointer' }}><Svg d={ICONS.x} size={16} /></button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <input value={t.name} onChange={e => update('name', e.target.value)} placeholder="Task name *"
            style={{ border: '1px solid #e2e2e2', borderRadius: 8, padding: '10px 14px', fontSize: 15, fontWeight: 500 }} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {[
              { label: 'Assignee', field: 'assignee', options: ASSIGNEES },
              { label: 'Status', field: 'status', options: STATUSES },
              { label: 'Priority', field: 'priority', options: PRIORITIES },
              { label: 'Department', field: 'department', options: DEPARTMENTS },
            ].map(({ label, field, options }) => (
              <div key={field}>
                <label style={{ fontSize: 11, color: '#999', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 4 }}>{label}</label>
                <select value={t[field]} onChange={e => update(field, e.target.value)}
                  style={{ width: '100%', border: '1px solid #e2e2e2', borderRadius: 6, padding: '7px 8px', fontSize: 13, background: 'white' }}>
                  {options.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
            ))}
            <div>
              <label style={{ fontSize: 11, color: '#999', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 4 }}>Start date</label>
              <input type="date" value={t.startDate} onChange={e => update('startDate', e.target.value)}
                style={{ width: '100%', border: '1px solid #e2e2e2', borderRadius: 6, padding: '7px 8px', fontSize: 13, boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ fontSize: 11, color: '#999', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 4 }}>Due date</label>
              <input type="date" value={t.dueDate} onChange={e => update('dueDate', e.target.value)}
                style={{ width: '100%', border: '1px solid #e2e2e2', borderRadius: 6, padding: '7px 8px', fontSize: 13, boxSizing: 'border-box' }} />
            </div>
          </div>
          <textarea value={t.aboutProject} onChange={e => update('aboutProject', e.target.value)}
            placeholder="About this project…" rows={2}
            style={{ border: '1px solid #e2e2e2', borderRadius: 8, padding: '10px 12px', fontSize: 13, fontFamily: 'inherit', resize: 'vertical' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 20 }}>
          <button onClick={onClose} style={{ background: '#f5f5f5', color: '#555', border: 'none', borderRadius: 8, padding: '9px 18px', fontSize: 13, cursor: 'pointer' }}>Cancel</button>
          <button onClick={handleCreate} disabled={saving}
            style={{ background: '#1a1a1a', color: 'white', border: 'none', borderRadius: 8, padding: '9px 20px', fontSize: 13, cursor: 'pointer', fontWeight: 600, opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Creating…' : 'Create task'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Calendar view ──────────────────────────────────────────────────────────
function CalendarView({ tasks, onTaskClick }) {
  const today = new Date(); today.setHours(0,0,0,0)
  const [year,  setYear]  = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())

  const prevMonth = () => { if (month === 0) { setMonth(11); setYear(y => y - 1) } else setMonth(m => m - 1) }
  const nextMonth = () => { if (month === 11) { setMonth(0); setYear(y => y + 1) } else setMonth(m => m + 1) }

  const monthName = new Date(year, month, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  // Build calendar grid — always 6 rows of 7 days
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells = []
  for (let i = 0; i < 42; i++) {
    const dayNum = i - firstDay + 1
    if (dayNum < 1 || dayNum > daysInMonth) { cells.push(null); continue }
    cells.push(new Date(year, month, dayNum))
  }
  const weeks = []
  for (let i = 0; i < 6; i++) weeks.push(cells.slice(i * 7, i * 7 + 7))

  // For each week, compute which tasks have bars
  function getBarsForWeek(weekDays) {
    const validDays = weekDays.filter(Boolean)
    if (!validDays.length) return []
    const weekStart = validDays[0]
    const weekEnd   = validDays[validDays.length - 1]

    const bars = []
    tasks.forEach(task => {
      if (task.status === 'Done') return
      const s = task.startDate ? parseDate(task.startDate) : (task.dueDate ? parseDate(task.dueDate) : null)
      const e = task.dueDate   ? parseDate(task.dueDate)   : (task.startDate ? parseDate(task.startDate) : null)
      if (!s && !e) return
      const start = s || e
      const end   = e || s
      if (start > weekEnd || end < weekStart) return

      // Column span within this week (0–6)
      const colStart = Math.max(0, weekDays.findIndex(d => d && isSameDay(d, start) || (d && d >= start && (!weekDays[weekDays.indexOf(d) - 1] || weekDays[weekDays.indexOf(d) - 1] < start))))
      let cs = 0
      for (let i = 0; i < 7; i++) {
        if (weekDays[i] && weekDays[i] >= start) { cs = i; break }
        if (i === 6) cs = 0
      }
      let ce = 6
      for (let i = 6; i >= 0; i--) {
        if (weekDays[i] && weekDays[i] <= end) { ce = i; break }
        if (i === 0) ce = 6
      }
      bars.push({ task, cs, ce })
    })

    // Assign lanes to prevent overlap
    bars.sort((a, b) => a.cs - b.cs)
    const laneEnds = []
    bars.forEach(bar => {
      let lane = laneEnds.findIndex(e => e < bar.cs)
      if (lane === -1) { lane = laneEnds.length; laneEnds.push(bar.ce) }
      else laneEnds[lane] = bar.ce
      bar.lane = lane
    })
    return bars
  }

  // Legend
  const legend = ASSIGNEES.map(a => ({ name: a, ...ASSIGNEE_CAL[a] }))

  return (
    <div style={{ padding: '24px 0' }}>
      {/* Calendar header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#1a1a1a', fontFamily: 'Georgia, serif', margin: 0 }}>{monthName}</h2>
          <button onClick={() => { setYear(today.getFullYear()); setMonth(today.getMonth()) }}
            style={{ background: '#f5f5f5', border: 'none', borderRadius: 6, padding: '4px 10px', fontSize: 12, cursor: 'pointer', color: '#555' }}>Today</button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Legend */}
          <div style={{ display: 'flex', gap: 12, marginRight: 12 }}>
            {legend.map(l => (
              <div key={l.name} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#666' }}>
                <span style={{ width: 12, height: 12, borderRadius: 3, background: l.bar, display: 'inline-block' }} />
                {l.name}
              </div>
            ))}
          </div>
          <button onClick={prevMonth} style={{ background: '#f5f5f5', border: 'none', borderRadius: 7, padding: '6px 10px', cursor: 'pointer' }}>
            <Svg d={ICONS.chevL} size={16} color="#555" />
          </button>
          <button onClick={nextMonth} style={{ background: '#f5f5f5', border: 'none', borderRadius: 7, padding: '6px 10px', cursor: 'pointer' }}>
            <Svg d={ICONS.chevR} size={16} color="#555" />
          </button>
        </div>
      </div>

      {/* Day-of-week headers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: 2 }}>
        {DAYS_OF_WEEK.map(d => (
          <div key={d} style={{ textAlign: 'center', fontSize: 11, fontWeight: 600, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.5px', padding: '6px 0' }}>{d}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div style={{ border: '1px solid #f0f0f0', borderRadius: 12, overflow: 'hidden', background: 'white' }}>
        {weeks.map((week, wi) => {
          const bars = getBarsForWeek(week)
          const maxLane = bars.reduce((m, b) => Math.max(m, b.lane), -1)
          const barAreaH = (maxLane + 1) * 26 + 8
          const hasAny = week.some(Boolean)
          if (!hasAny && wi > 0) return null

          return (
            <div key={wi} style={{ borderBottom: wi < 5 ? '1px solid #f0f0f0' : 'none' }}>
              {/* Day number row */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
                {week.map((day, di) => {
                  const isToday = day && isSameDay(day, today)
                  const isCurrentMonth = day && day.getMonth() === month
                  return (
                    <div key={di} style={{ borderRight: di < 6 ? '1px solid #f0f0f0' : 'none', padding: '8px 10px 4px', minHeight: 32, background: isToday ? '#f0f6ff' : 'transparent' }}>
                      {day && (
                        <span style={{ fontSize: 13, fontWeight: isToday ? 700 : 400, color: isToday ? '#185FA5' : isCurrentMonth ? '#333' : '#ccc',
                          background: isToday ? '#185FA5' : 'transparent', color: isToday ? 'white' : isCurrentMonth ? '#333' : '#ccc',
                          width: 24, height: 24, borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                          {day.getDate()}
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Task bars */}
              {bars.length > 0 && (
                <div style={{ position: 'relative', height: barAreaH, margin: '0 0 4px' }}>
                  {bars.slice(0, 4).map(({ task, cs, ce, lane }) => {
                    const cal = ASSIGNEE_CAL[task.assignee] || ASSIGNEE_CAL['Kyle Nauj']
                    const leftPct  = (cs / 7) * 100
                    const widthPct = ((ce - cs + 1) / 7) * 100
                    const isStart  = task.startDate ? parseDate(task.startDate) >= (week.find(Boolean) || today) : true
                    const isEnd    = task.dueDate   ? parseDate(task.dueDate)   <= (week.filter(Boolean).slice(-1)[0] || today) : true
                    return (
                      <div key={task.id}
                        onClick={() => onTaskClick(task)}
                        style={{
                          position: 'absolute',
                          left: `calc(${leftPct}% + 3px)`,
                          width: `calc(${widthPct}% - 6px)`,
                          top: lane * 26 + 4,
                          height: 22,
                          background: cal.bar,
                          borderRadius: isStart && isEnd ? 4 : isStart ? '4px 0 0 4px' : isEnd ? '0 4px 4px 0' : 0,
                          display: 'flex', alignItems: 'center', paddingLeft: 6, paddingRight: 4,
                          cursor: 'pointer', overflow: 'hidden',
                          fontSize: 11, color: 'white', fontWeight: 500,
                          whiteSpace: 'nowrap', textOverflow: 'ellipsis',
                        }}
                        title={task.name}
                      >
                        {task.name}
                      </div>
                    )
                  })}
                  {bars.length > 4 && (
                    <div style={{ position: 'absolute', bottom: 2, right: 8, fontSize: 11, color: '#aaa' }}>+{bars.length - 4} more</div>
                  )}
                </div>
              )}
              {bars.length === 0 && <div style={{ height: 8 }} />}
            </div>
          )
        })}
      </div>

      {/* Done tasks note */}
      <p style={{ fontSize: 12, color: '#bbb', marginTop: 12, textAlign: 'center' }}>Completed tasks are hidden from the calendar. Set a start date and due date on any task to see it here.</p>
    </div>
  )
}

// ── Weekly meeting view ────────────────────────────────────────────────────
function MeetingView({ tasks }) {
  const today    = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  const byStatus = STATUSES.reduce((acc, s) => ({ ...acc, [s]: tasks.filter(t => t.status === s) }), {})
  return (
    <div style={{ padding: '24px 0' }}>
      <div style={{ background: '#1a1a1a', borderRadius: 12, padding: '20px 24px', marginBottom: 24, color: 'white' }}>
        <div style={{ fontSize: 11, color: '#888', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 }}>Weekly sync</div>
        <div style={{ fontSize: 20, fontWeight: 700, fontFamily: 'Georgia, serif' }}>{today}</div>
        <div style={{ display: 'flex', gap: 24, marginTop: 16, flexWrap: 'wrap' }}>
          {STATUSES.map(s => (
            <div key={s}>
              <div style={{ fontSize: 22, fontWeight: 700 }}>{byStatus[s].length}</div>
              <div style={{ fontSize: 11, color: '#999' }}>{s}</div>
            </div>
          ))}
        </div>
      </div>
      {STATUSES.map(status => byStatus[status].length > 0 && (
        <div key={status} style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <StatusBadge status={status} />
            <span style={{ fontSize: 13, color: '#aaa' }}>{byStatus[status].length} task{byStatus[status].length !== 1 ? 's' : ''}</span>
          </div>
          {byStatus[status].map(task => {
            const done = task.actionItems.filter(a => a.done).length
            const pct  = task.actionItems.length ? Math.round(done / task.actionItems.length * 100) : 0
            const overdue = isOverdue(task)
            return (
              <div key={task.id} style={{ background: 'white', border: `1px solid ${overdue ? '#f5c4b3' : '#f0f0f0'}`, borderRadius: 10, padding: '14px 18px', marginBottom: 8, display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                <Avatar name={task.assignee} size={32} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <div style={{ fontWeight: 600, fontSize: 14, color: '#1a1a1a' }}>{task.name}</div>
                    {overdue && <span style={{ fontSize: 11, background: '#FAECE7', color: '#993C1D', borderRadius: 4, padding: '2px 6px', fontWeight: 600 }}>Overdue</span>}
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                    <PriorityBadge priority={task.priority} />
                    <span style={{ fontSize: 12, color: '#888' }}>{task.department}</span>
                    {task.startDate && <span style={{ fontSize: 12, color: '#888' }}>Start {task.startDate}</span>}
                    {task.dueDate && <span style={{ fontSize: 12, color: overdue ? '#993C1D' : '#888', fontWeight: overdue ? 600 : 400 }}>Due {task.dueDate}</span>}
                  </div>
                  {task.actionItems.length > 0 && (
                    <div style={{ marginTop: 8 }}>
                      <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>{done}/{task.actionItems.length} action items complete</div>
                      <div style={{ height: 3, background: '#f0f0f0', borderRadius: 2 }}>
                        <div style={{ height: '100%', background: '#639922', borderRadius: 2, width: `${pct}%` }} />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}

// ── Main dashboard ─────────────────────────────────────────────────────────
export default function App() {
  const [tasks,          setTasks]          = useState([])
  const [loading,        setLoading]        = useState(true)
  const [error,          setError]          = useState(null)
  const [saveStatus,     setSaveStatus]     = useState('')
  const [activeTab,      setActiveTab]      = useState('all')
  const [view,           setView]           = useState('list')   // list | calendar | meeting
  const [selectedTask,   setSelectedTask]   = useState(null)
  const [showNewTask,    setShowNewTask]     = useState(false)
  const [filterStatus,   setFilterStatus]   = useState('All')
  const [filterPriority, setFilterPriority] = useState('All')
  const [search,         setSearch]         = useState('')

  const currentUser = activeTab === 'cece' ? 'Cece Rip' : 'Kyle Nauj'

  useEffect(() => {
    dbLoadTasks()
      .then(data => { setTasks(data); setLoading(false) })
      .catch(err  => { setError(err.message); setLoading(false) })
  }, [])

  const showSave = async (fn) => {
    setSaveStatus('saving')
    try { await fn(); setSaveStatus('saved'); setTimeout(() => setSaveStatus(''), 2000) }
    catch { setSaveStatus('error'); setTimeout(() => setSaveStatus(''), 3000) }
  }

  const handleSaveTask   = async (updated) => showSave(async () => { await dbUpsertTask(updated); setTasks(prev => prev.map(t => t.id === updated.id ? updated : t)) })
  const handleDeleteTask = async (id)      => showSave(async () => { await dbDeleteTask(id); setTasks(prev => prev.filter(t => t.id !== id)); setSelectedTask(null) })
  const handleAddTask    = async (task)    => showSave(async () => { await dbUpsertTask(task); setTasks(prev => [...prev, task]) })

  const filtered = useMemo(() => {
    let list = tasks
    if (activeTab === 'mine') list = list.filter(t => t.assignee === 'Kyle Nauj')
    if (activeTab === 'cece') list = list.filter(t => t.assignee === 'Cece Rip')
    if (filterStatus   !== 'All') list = list.filter(t => t.status   === filterStatus)
    if (filterPriority !== 'All') list = list.filter(t => t.priority === filterPriority)
    if (search) list = list.filter(t => t.name.toLowerCase().includes(search.toLowerCase()) || t.department.toLowerCase().includes(search.toLowerCase()))
    return list
  }, [tasks, activeTab, filterStatus, filterPriority, search])

  const counts = {
    all:  tasks.length,
    mine: tasks.filter(t => t.assignee === 'Kyle Nauj').length,
    cece: tasks.filter(t => t.assignee === 'Cece Rip').length,
  }
  const overdueCount = tasks.filter(isOverdue).length

  const TAB = (active) => ({
    padding: '8px 18px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13,
    fontWeight: active ? 600 : 400, background: active ? '#1a1a1a' : 'transparent',
    color: active ? 'white' : '#666', transition: 'all 0.15s',
  })
  const VIEWBTN = (active) => ({
    background: active ? '#1a1a1a' : '#f5f5f5', color: active ? 'white' : '#555',
    border: 'none', borderRadius: 8, padding: '9px 14px', fontSize: 13, cursor: 'pointer',
    display: 'flex', alignItems: 'center', gap: 6, fontWeight: 500,
  })

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', flexDirection: 'column', gap: 12, color: '#aaa', fontSize: 14 }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      <div style={{ width: 32, height: 32, border: '2px solid #f0f0f0', borderTopColor: '#1a1a1a', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      Loading workspace…
    </div>
  )

  if (error) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', flexDirection: 'column', gap: 12, color: '#993C1D', fontSize: 14 }}>
      <p style={{ fontWeight: 600 }}>Could not connect to Supabase</p>
      <p style={{ color: '#888', fontSize: 13 }}>{error}</p>
    </div>
  )

  return (
    <div style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", maxWidth: 1100, margin: '0 auto', padding: '0 20px 60px' }}>

      {/* Header */}
      <div style={{ padding: '32px 0 24px', borderBottom: '1px solid #f0f0f0', marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 800, color: '#1a1a1a', fontFamily: 'Georgia, serif', letterSpacing: '-0.5px', margin: 0 }}>Project Tracker</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}>
              <p style={{ color: '#888', fontSize: 14, margin: 0 }}>Marketing / Graphic Design</p>
              {saveStatus === 'saving' && <span style={{ fontSize: 11, color: '#aaa' }}>Saving…</span>}
              {saveStatus === 'saved'  && <span style={{ fontSize: 11, color: '#639922' }}>✓ Saved</span>}
              {saveStatus === 'error'  && <span style={{ fontSize: 11, color: '#c0392b' }}>Save failed</span>}
              {overdueCount > 0 && (
                <span style={{ fontSize: 11, background: '#FAECE7', color: '#993C1D', borderRadius: 5, padding: '2px 8px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Svg d={ICONS.alert} size={11} color="#993C1D" /> {overdueCount} overdue
                </span>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setView('list')}    style={VIEWBTN(view === 'list')}>
              <Svg d={ICONS.project} size={15} color={view === 'list' ? 'white' : '#555'} /> List
            </button>
            <button onClick={() => setView('calendar')} style={VIEWBTN(view === 'calendar')}>
              <Svg d={ICONS.calendar} size={15} color={view === 'calendar' ? 'white' : '#555'} /> Calendar
            </button>
            <button onClick={() => setView('meeting')}  style={VIEWBTN(view === 'meeting')}>
              <Svg d={ICONS.meeting} size={15} color={view === 'meeting' ? 'white' : '#555'} /> Weekly sync
            </button>
            <button onClick={() => setShowNewTask(true)}
              style={{ background: '#1a1a1a', color: 'white', border: 'none', borderRadius: 8, padding: '9px 16px', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
              <Svg d={ICONS.plus} size={15} color="white" /> New task
            </button>
          </div>
        </div>

        {/* Status summary pills */}
        <div style={{ display: 'flex', gap: 10, marginTop: 20, flexWrap: 'wrap' }}>
          {STATUSES.map(s => {
            const c = STATUS_COLORS[s]
            const n = tasks.filter(t => t.status === s).length
            return (
              <div key={s} style={{ background: c.bg, borderRadius: 8, padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: c.dot }} />
                <span style={{ fontSize: 13, color: c.text, fontWeight: 500 }}>{s}</span>
                <span style={{ fontSize: 15, fontWeight: 700, color: c.text }}>{n}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Views */}
      {view === 'calendar' && <CalendarView tasks={filtered} onTaskClick={setSelectedTask} />}
      {view === 'meeting'  && <MeetingView  tasks={tasks} />}
      {view === 'list'     && (
        <>
          {/* Tabs + filters */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
            <div style={{ display: 'flex', gap: 4, background: '#f5f5f5', borderRadius: 10, padding: 4 }}>
              {[
                { id: 'all',  label: `All tasks (${counts.all})`       },
                { id: 'mine', label: `Kyle's tasks (${counts.mine})`   },
                { id: 'cece', label: `Cece's tasks (${counts.cece})`   },
              ].map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={TAB(activeTab === tab.id)}>{tab.label}</button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search tasks…"
                style={{ border: '1px solid #e2e2e2', borderRadius: 8, padding: '7px 12px', fontSize: 13, width: 160 }} />
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                style={{ border: '1px solid #e2e2e2', borderRadius: 8, padding: '7px 10px', fontSize: 13, background: 'white' }}>
                <option value="All">All statuses</option>
                {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)}
                style={{ border: '1px solid #e2e2e2', borderRadius: 8, padding: '7px 10px', fontSize: 13, background: 'white' }}>
                <option value="All">All priorities</option>
                {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>

          {/* Table */}
          <div style={{ background: 'white', border: '1px solid #f0f0f0', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 120px 120px 170px 100px 90px 90px 40px', padding: '10px 20px', background: '#fafafa', borderBottom: '1px solid #f0f0f0', gap: 8 }}>
              {['Project Name', 'Assignee', 'Status', 'Priority', 'Dept', 'Start', 'Due', ''].map((label, i) => (
                <div key={i} style={{ color: '#aaa', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</div>
              ))}
            </div>
            {filtered.length === 0
              ? <div style={{ padding: 40, textAlign: 'center', color: '#aaa', fontSize: 14 }}>No tasks found.</div>
              : filtered.map((task, i) => {
                const overdue = isOverdue(task)
                return (
                  <div key={task.id} onClick={() => setSelectedTask(task)}
                    style={{ display: 'grid', gridTemplateColumns: '2fr 120px 120px 170px 100px 90px 90px 40px', padding: '12px 20px', gap: 8, borderBottom: i < filtered.length - 1 ? '1px solid #f5f5f5' : 'none', cursor: 'pointer', alignItems: 'center', background: overdue ? '#fffaf9' : 'transparent', transition: 'background 0.1s' }}
                    onMouseEnter={e => e.currentTarget.style.background = overdue ? '#fff5f2' : '#fafafa'}
                    onMouseLeave={e => e.currentTarget.style.background = overdue ? '#fffaf9' : 'transparent'}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                      {overdue && <Svg d={ICONS.alert} size={14} color="#D85A30" style={{ flexShrink: 0 }} />}
                      <span style={{ fontWeight: 500, fontSize: 14, color: '#1a1a1a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{task.name}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Avatar name={task.assignee} size={20} />
                      <span style={{ fontSize: 12, color: '#555', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{task.assignee.split(' ')[0]}</span>
                    </div>
                    <div><StatusBadge status={task.status} /></div>
                    <div><PriorityBadge priority={task.priority} /></div>
                    <div style={{ fontSize: 12, color: '#666' }}>{task.department}</div>
                    <div style={{ fontSize: 12, color: '#888' }}>{task.startDate || <span style={{ color: '#ddd' }}>—</span>}</div>
                    <div style={{ fontSize: 12, color: overdue ? '#993C1D' : '#888', fontWeight: overdue ? 600 : 400 }}>{task.dueDate || <span style={{ color: '#ddd' }}>—</span>}</div>
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                      <Svg d={ICONS.folder} size={15} color={task.sharepointUrl ? '#378ADD' : '#e8e8e8'} />
                    </div>
                  </div>
                )
              })
            }
          </div>
          <button onClick={() => setShowNewTask(true)}
            style={{ background: 'transparent', border: '1.5px dashed #d0d0d0', borderRadius: 8, padding: '10px 24px', fontSize: 13, color: '#aaa', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, width: '100%', marginTop: 12, boxSizing: 'border-box' }}>
            <Svg d={ICONS.plus} size={14} color="#bbb" /> Add new task
          </button>
        </>
      )}

      {selectedTask && (
        <TaskModal task={selectedTask} onClose={() => setSelectedTask(null)}
          onSave={handleSaveTask} onDelete={handleDeleteTask}
          currentUser={currentUser === 'Kyle Nauj' ? 'Kyle' : currentUser} />
      )}
      {showNewTask && (
        <NewTaskModal onClose={() => setShowNewTask(false)} onAdd={handleAddTask} currentUser={currentUser} />
      )}
    </div>
  )
}

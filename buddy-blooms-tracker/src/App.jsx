import { useState, useEffect, useMemo } from 'react'
import { supabase } from './supabase'

// ── Constants ──────────────────────────────────────────────────────────────
const STATUSES    = ['To Do', 'In Progress', 'In Review', 'Done']
const PRIORITIES  = ['Low (1-10 Days)', 'Medium (1-3 Weeks)', 'High (ASAP)']
const DEPARTMENTS = ['Marketing', 'Design', 'Development', 'Operations', 'Sales', 'Admin']
const ASSIGNEES   = ['Kyle Nauj', 'Cece Rip']
const TAGS        = ['Campaign', 'Client Work', 'Internal', 'Social Media', 'Urgent', 'Admin', 'Design', 'Copy']
const RECURRING   = ['Weekly', 'Bi-weekly', 'Monthly']
const DAYS_SHORT  = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
const MONTHS      = ['January','February','March','April','May','June','July','August','September','October','November','December']

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
const ASSIGNEE_CAL = {
  'Kyle Nauj': { bar: '#185FA5', text: '#fff' },
  'Cece Rip':  { bar: '#8B3A62', text: '#fff' },
}
const TAG_COLORS = {
  'Campaign':    { bg: '#EDE9FE', text: '#5B21B6' },
  'Client Work': { bg: '#FEF3C7', text: '#92400E' },
  'Internal':    { bg: '#F1EFE8', text: '#5F5E5A' },
  'Social Media':{ bg: '#DBEAFE', text: '#1E40AF' },
  'Urgent':      { bg: '#FAECE7', text: '#993C1D' },
  'Admin':       { bg: '#F5F5F5', text: '#555'    },
  'Design':      { bg: '#FCE7F3', text: '#9D174D' },
  'Copy':        { bg: '#ECFDF5', text: '#065F46' },
}

const TEMPLATES = {
  'New Campaign': {
    priority: 'High (ASAP)', department: 'Marketing', tags: ['Campaign'],
    actionItems: ['Define goals and KPIs','Create content brief','Design assets','Schedule and publish','Monitor and report'],
  },
  'Social Media Post': {
    priority: 'Medium (1-3 Weeks)', department: 'Marketing', tags: ['Social Media'],
    actionItems: ['Write caption copy','Create graphic or video','Get approval','Schedule post','Track engagement'],
  },
  'Design Project': {
    priority: 'Medium (1-3 Weeks)', department: 'Design', tags: ['Design'],
    actionItems: ['Gather brief and references','Initial concepts','First round review','Revisions','Final delivery'],
  },
  'Client Deliverable': {
    priority: 'High (ASAP)', department: 'Design', tags: ['Client Work'],
    actionItems: ['Client brief received','Internal kickoff','Draft deliverable','Client review','Final approval and send'],
  },
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
  clock:    'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
  repeat:   'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15',
  tag:      'M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z',
  chart:    'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
  copy:     'M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z',
  done:     'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
  note:     'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z',
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
function todayMidnight() {
  const t = new Date(); t.setHours(0,0,0,0); return t
}
function isOverdue(task) {
  if (!task.dueDate || task.status === 'Done') return false
  return parseDate(task.dueDate) < todayMidnight()
}
function isDueThisWeek(task) {
  if (!task.dueDate || task.status === 'Done') return false
  const due = parseDate(task.dueDate)
  const today = todayMidnight()
  const end   = new Date(today); end.setDate(today.getDate() + 7)
  return due >= today && due <= end
}
function relativeTime(isoStr) {
  if (!isoStr) return ''
  const diff = Date.now() - new Date(isoStr).getTime()
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days  = Math.floor(diff / 86400000)
  if (mins < 1)   return 'just now'
  if (mins < 60)  return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 30)  return `${days}d ago`
  return new Date(isoStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
function shiftDate(dateStr, freq) {
  if (!dateStr) return ''
  const d = parseDate(dateStr)
  if (freq === 'Weekly')    d.setDate(d.getDate() + 7)
  if (freq === 'Bi-weekly') d.setDate(d.getDate() + 14)
  if (freq === 'Monthly')   d.setMonth(d.getMonth() + 1)
  return d.toISOString().split('T')[0]
}

// ── Supabase helpers ───────────────────────────────────────────────────────
function rowToTask(row) {
  return {
    id:              row.id,
    name:            row.name             || '',
    assignee:        row.assignee         || 'Kyle Nauj',
    status:          row.status           || 'To Do',
    priority:        row.priority         || 'Medium (1-3 Weeks)',
    department:      row.department       || 'Marketing',
    comments:        row.comments         || '',
    startDate:       row.start_date       || '',
    dueDate:         row.due_date         || '',
    aboutProject:    row.about_project    || '',
    actionItems:     row.action_items     || [],
    sharepointUrl:   row.sharepoint_url   || '',
    sharepointLabel: row.sharepoint_label || '',
    tags:            row.tags             || [],
    timeEstimate:    row.time_estimate    || '',
    isRecurring:     row.is_recurring     || false,
    recurringFreq:   row.recurring_freq   || 'Weekly',
    updatedAt:       row.updated_at       || '',
    createdAt:       row.created_at       || '',
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
    tags:             task.tags,
    time_estimate:    task.timeEstimate,
    is_recurring:     task.isRecurring,
    recurring_freq:   task.recurringFreq,
    updated_at:       new Date().toISOString(),
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
async function dbLoadNote(dateKey) {
  try {
    const { data } = await supabase.from('meeting_notes').select('content').eq('id', dateKey).single()
    return data ? data.content : ''
  } catch { return '' }
}
async function dbSaveNote(dateKey, content) {
  await supabase.from('meeting_notes').upsert({ id: dateKey, content, updated_at: new Date().toISOString() }, { onConflict: 'id' })
}

// ── Shared UI ──────────────────────────────────────────────────────────────
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
      <span style={{ width: 7, height: 7, borderRadius: '50%', background: c.dot }} />{status}
    </span>
  )
}
function PriorityBadge({ priority }) {
  const c = PRIORITY_COLORS[priority] || PRIORITY_COLORS['Low (1-10 Days)']
  return <span style={{ background: c.bg, color: c.text, borderRadius: 6, padding: '3px 8px', fontSize: 12, fontWeight: 500, whiteSpace: 'nowrap' }}>{priority}</span>
}
function TagBadge({ tag }) {
  const c = TAG_COLORS[tag] || { bg: '#f0f0f0', text: '#555' }
  return <span style={{ background: c.bg, color: c.text, borderRadius: 5, padding: '2px 7px', fontSize: 11, fontWeight: 500 }}>{tag}</span>
}
function Avatar({ name, size = 28 }) {
  const initials  = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  const palette   = { 'Kyle Nauj': ['#E6F1FB','#185FA5'], 'Cece Rip': ['#FBEAF0','#993556'] }
  const [bg, txt] = palette[name] || ['#F1EFE8','#5F5E5A']
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: bg, color: txt, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.38, fontWeight: 600, flexShrink: 0 }}>
      {initials}
    </div>
  )
}

// ── SharePoint section ─────────────────────────────────────────────────────
function SharePointSection({ url, label, onChange }) {
  const [editing, setEditing] = useState(false)
  const [draft,   setDraft]   = useState({ url: url || '', label: label || '' })
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

// ── Recurring confirm dialog ───────────────────────────────────────────────
function RecurringDialog({ task, onConfirm, onDismiss }) {
  const nextStart = shiftDate(task.startDate, task.recurringFreq)
  const nextDue   = shiftDate(task.dueDate,   task.recurringFreq)
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: 'white', borderRadius: 14, padding: 28, maxWidth: 400, width: '90%', boxShadow: '0 8px 40px rgba(0,0,0,0.15)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <Svg d={ICONS.repeat} size={20} color="#185FA5" />
          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1a1a1a', margin: 0 }}>Recurring task completed</h3>
        </div>
        <p style={{ fontSize: 14, color: '#555', marginBottom: 16, lineHeight: 1.5 }}>
          <strong>{task.name}</strong> is set to repeat <strong>{task.recurringFreq}</strong>. Create the next occurrence?
        </p>
        {(nextStart || nextDue) && (
          <div style={{ background: '#f5f9ff', border: '1px solid #d0e4f7', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#555' }}>
            {nextStart && <div>Start: <strong>{nextStart}</strong></div>}
            {nextDue   && <div>Due: <strong>{nextDue}</strong></div>}
          </div>
        )}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={onDismiss} style={{ background: '#f5f5f5', color: '#555', border: 'none', borderRadius: 8, padding: '9px 16px', fontSize: 13, cursor: 'pointer' }}>Skip</button>
          <button onClick={() => onConfirm(nextStart, nextDue)} style={{ background: '#185FA5', color: 'white', border: 'none', borderRadius: 8, padding: '9px 20px', fontSize: 13, cursor: 'pointer', fontWeight: 600 }}>Create next</button>
        </div>
      </div>
    </div>
  )
}

// ── Task detail modal ──────────────────────────────────────────────────────
function TaskModal({ task, onClose, onSave, onDelete, currentUser }) {
  const [t,          setT]          = useState({ ...task })
  const [newAction,  setNewAction]  = useState('')
  const [newComment, setNewComment] = useState('')
  const [saving,     setSaving]     = useState(false)
  const [tab,        setTab]        = useState('details') // details | activity

  const update       = (field, val) => setT(prev => ({ ...prev, [field]: val }))
  const toggleAction = id => setT(prev => ({ ...prev, actionItems: prev.actionItems.map(a => a.id === id ? { ...a, done: !a.done } : a) }))
  const addAction    = () => { if (!newAction.trim()) return; setT(prev => ({ ...prev, actionItems: [...prev.actionItems, { id: Date.now(), text: newAction.trim(), done: false }] })); setNewAction('') }
  const removeAction = id => setT(prev => ({ ...prev, actionItems: prev.actionItems.filter(a => a.id !== id) }))
  const addComment   = () => {
    if (!newComment.trim()) return
    const stamp = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    const line  = `[${currentUser} · ${stamp}]: ${newComment.trim()}`
    update('comments', t.comments ? t.comments + '\n' + line : line)
    setNewComment('')
  }
  const toggleTag = (tag) => {
    const tags = t.tags || []
    update('tags', tags.includes(tag) ? tags.filter(x => x !== tag) : [...tags, tag])
  }
  const handleSave = async () => { setSaving(true); await onSave(t); setSaving(false); onClose() }
  const handleDuplicate = () => {
    onClose()
    onSave({ ...t, id: Date.now(), name: t.name + ' (copy)', status: 'To Do', actionItems: t.actionItems.map(a => ({ ...a, done: false })), createdAt: new Date().toISOString().split('T')[0], updatedAt: '' })
  }

  const doneCount = t.actionItems.filter(a => a.done).length
  const progress  = t.actionItems.length ? Math.round((doneCount / t.actionItems.length) * 100) : 0
  const overdue   = isOverdue(t)

  const TABBTN = (active) => ({ padding: '6px 14px', borderRadius: 7, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: active ? 600 : 400, background: active ? '#1a1a1a' : 'transparent', color: active ? 'white' : '#888' })

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 1000, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: 40, overflowY: 'auto' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: 'white', borderRadius: 14, width: '100%', maxWidth: 700, margin: '0 16px 40px', boxShadow: '0 8px 40px rgba(0,0,0,0.14)', overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ padding: '24px 28px 0', borderBottom: '1px solid #f0f0f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
            <input value={t.name} onChange={e => update('name', e.target.value)}
              style={{ fontSize: 22, fontWeight: 700, border: 'none', outline: 'none', width: '80%', color: '#1a1a1a', fontFamily: 'Georgia, serif', letterSpacing: '-0.3px' }} />
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={handleDuplicate} title="Duplicate task"
                style={{ background: '#f5f5f5', border: 'none', borderRadius: 7, padding: '6px 8px', cursor: 'pointer' }}>
                <Svg d={ICONS.copy} size={15} color="#888" />
              </button>
              <button onClick={onClose} style={{ background: '#f5f5f5', border: 'none', borderRadius: 7, padding: '6px 8px', cursor: 'pointer' }}>
                <Svg d={ICONS.x} size={15} />
              </button>
            </div>
          </div>

          {/* Badges row */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12, alignItems: 'center' }}>
            {overdue && <span style={{ fontSize: 11, background: '#FAECE7', color: '#993C1D', borderRadius: 5, padding: '2px 8px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}><Svg d={ICONS.alert} size={11} color="#993C1D" />Overdue</span>}
            {t.isRecurring && <span style={{ fontSize: 11, background: '#EDE9FE', color: '#5B21B6', borderRadius: 5, padding: '2px 8px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}><Svg d={ICONS.repeat} size={11} color="#5B21B6" />{t.recurringFreq}</span>}
            {(t.tags || []).map(tag => <TagBadge key={tag} tag={tag} />)}
            {t.updatedAt && <span style={{ fontSize: 11, color: '#bbb', marginLeft: 'auto' }}>Updated {relativeTime(t.updatedAt)}</span>}
          </div>

          {/* Meta fields */}
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
            <div>
              <div style={{ fontSize: 11, color: '#999', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Start date</div>
              <input type="date" value={t.startDate} onChange={e => update('startDate', e.target.value)}
                style={{ border: '1px solid #e2e2e2', borderRadius: 6, padding: '5px 8px', fontSize: 13 }} />
            </div>
            <div>
              <div style={{ fontSize: 11, color: '#999', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Due date</div>
              <input type="date" value={t.dueDate} onChange={e => update('dueDate', e.target.value)}
                style={{ border: '1px solid #e2e2e2', borderRadius: 6, padding: '5px 8px', fontSize: 13, borderColor: overdue ? '#f5c4b3' : '#e2e2e2' }} />
            </div>
            <div>
              <div style={{ fontSize: 11, color: '#999', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Time estimate</div>
              <input value={t.timeEstimate} onChange={e => update('timeEstimate', e.target.value)} placeholder="e.g. 3 hours"
                style={{ border: '1px solid #e2e2e2', borderRadius: 6, padding: '5px 8px', fontSize: 13, width: 110 }} />
            </div>
          </div>

          {/* Tab bar */}
          <div style={{ display: 'flex', gap: 2, background: '#f5f5f5', borderRadius: 8, padding: 3, width: 'fit-content', marginBottom: 0 }}>
            {['details','tags','recurring'].map(tb => (
              <button key={tb} onClick={() => setTab(tb)} style={TABBTN(tab === tb)}>
                {tb.charAt(0).toUpperCase() + tb.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div style={{ padding: '20px 28px' }}>

          {/* Details tab */}
          {tab === 'details' && (
            <>
              <div style={{ marginBottom: 24 }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, color: '#333', marginBottom: 8 }}>About project</h3>
                <textarea value={t.aboutProject} onChange={e => update('aboutProject', e.target.value)} rows={3}
                  style={{ width: '100%', border: '1px solid #e8e8e8', borderRadius: 8, padding: '10px 12px', fontSize: 14, color: '#444', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' }}
                  placeholder="Describe this project..." />
              </div>

              <SharePointSection url={t.sharepointUrl} label={t.sharepointLabel}
                onChange={(url, label) => setT(p => ({ ...p, sharepointUrl: url, sharepointLabel: label }))} />

              <div style={{ marginBottom: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <h3 style={{ fontSize: 14, fontWeight: 600, color: '#333' }}>Action items</h3>
                  {t.actionItems.length > 0 && (
                    <span style={{ fontSize: 12, color: '#888', display: 'flex', alignItems: 'center', gap: 8 }}>
                      {doneCount}/{t.actionItems.length} done
                      <span style={{ display: 'inline-block', width: 60, height: 4, background: '#f0f0f0', borderRadius: 2 }}>
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
            </>
          )}

          {/* Tags tab */}
          {tab === 'tags' && (
            <div style={{ marginBottom: 24 }}>
              <p style={{ fontSize: 13, color: '#888', marginBottom: 16 }}>Select all tags that apply to this task.</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                {TAGS.map(tag => {
                  const active = (t.tags || []).includes(tag)
                  const c = TAG_COLORS[tag] || { bg: '#f0f0f0', text: '#555' }
                  return (
                    <button key={tag} onClick={() => toggleTag(tag)}
                      style={{ background: active ? c.bg : '#f5f5f5', color: active ? c.text : '#888', border: `1.5px solid ${active ? c.text + '40' : '#e8e8e8'}`, borderRadius: 8, padding: '8px 16px', fontSize: 13, cursor: 'pointer', fontWeight: active ? 600 : 400, display: 'flex', alignItems: 'center', gap: 6 }}>
                      {active && <Svg d={ICONS.check} size={12} color={c.text} />}
                      {tag}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Recurring tab */}
          {tab === 'recurring' && (
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: t.isRecurring ? '#f0f6ff' : '#fafafa', border: '1px solid', borderColor: t.isRecurring ? '#d0e4f7' : '#f0f0f0', borderRadius: 10, padding: '14px 18px', marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#1a1a1a', marginBottom: 2 }}>Recurring task</div>
                  <div style={{ fontSize: 12, color: '#888' }}>When marked Done, a new task will be created automatically</div>
                </div>
                <button onClick={() => update('isRecurring', !t.isRecurring)}
                  style={{ width: 44, height: 24, borderRadius: 12, background: t.isRecurring ? '#185FA5' : '#e0e0e0', border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.2s' }}>
                  <span style={{ position: 'absolute', top: 3, left: t.isRecurring ? 22 : 3, width: 18, height: 18, borderRadius: '50%', background: 'white', transition: 'left 0.2s', display: 'block' }} />
                </button>
              </div>
              {t.isRecurring && (
                <div>
                  <label style={{ fontSize: 11, color: '#999', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 6 }}>Frequency</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {RECURRING.map(freq => (
                      <button key={freq} onClick={() => update('recurringFreq', freq)}
                        style={{ flex: 1, padding: '10px', borderRadius: 8, border: `1.5px solid ${t.recurringFreq === freq ? '#185FA5' : '#e2e2e2'}`, background: t.recurringFreq === freq ? '#E6F1FB' : 'white', color: t.recurringFreq === freq ? '#185FA5' : '#555', fontSize: 13, fontWeight: t.recurringFreq === freq ? 600 : 400, cursor: 'pointer' }}>
                        {freq}
                      </button>
                    ))}
                  </div>
                  {t.dueDate && (
                    <div style={{ marginTop: 14, fontSize: 13, color: '#888', background: '#f5f9ff', borderRadius: 8, padding: '10px 14px' }}>
                      Next occurrence due: <strong>{shiftDate(t.dueDate, t.recurringFreq)}</strong>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Footer */}
          <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 16, borderTop: '1px solid #f0f0f0' }}>
            <button onClick={() => onDelete(task.id)}
              style={{ background: '#FAECE7', color: '#993C1D', border: 'none', borderRadius: 8, padding: '9px 16px', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Svg d={ICONS.trash} size={14} color="#993C1D" /> Delete
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
  const [selectedTemplate, setSelectedTemplate] = useState('')
  const blankTask = () => ({ name: '', assignee: currentUser, status: 'To Do', priority: 'Medium (1-3 Weeks)', department: 'Marketing', comments: '', startDate: '', dueDate: '', aboutProject: '', actionItems: [], sharepointUrl: '', sharepointLabel: '', tags: [], timeEstimate: '', isRecurring: false, recurringFreq: 'Weekly' })
  const [t, setT] = useState(blankTask())
  const [saving, setSaving] = useState(false)
  const update = (f, v) => setT(p => ({ ...p, [f]: v }))

  const applyTemplate = (name) => {
    if (!name) { setT(blankTask()); setSelectedTemplate(''); return }
    const tmpl = TEMPLATES[name]
    setSelectedTemplate(name)
    setT(p => ({
      ...p,
      name: p.name || name,
      priority: tmpl.priority,
      department: tmpl.department,
      tags: tmpl.tags,
      actionItems: tmpl.actionItems.map((text, i) => ({ id: i + 1, text, done: false })),
    }))
  }

  const handleCreate = async () => {
    if (!t.name.trim()) return
    setSaving(true)
    await onAdd({ ...t, id: Date.now(), createdAt: new Date().toISOString().split('T')[0], updatedAt: new Date().toISOString() })
    setSaving(false)
    onClose()
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', overflowY: 'auto', padding: '40px 16px' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: 'white', borderRadius: 14, width: '100%', maxWidth: 540, padding: 28, boxShadow: '0 8px 40px rgba(0,0,0,0.14)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1a1a1a', fontFamily: 'Georgia, serif' }}>New task</h2>
          <button onClick={onClose} style={{ background: '#f5f5f5', border: 'none', borderRadius: 8, padding: 6, cursor: 'pointer' }}><Svg d={ICONS.x} size={16} /></button>
        </div>

        {/* Template picker */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 11, color: '#999', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 6 }}>Start from a template (optional)</label>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {Object.keys(TEMPLATES).map(name => (
              <button key={name} onClick={() => applyTemplate(selectedTemplate === name ? '' : name)}
                style={{ fontSize: 12, padding: '5px 12px', borderRadius: 7, border: '1.5px solid', borderColor: selectedTemplate === name ? '#185FA5' : '#e2e2e2', background: selectedTemplate === name ? '#E6F1FB' : 'white', color: selectedTemplate === name ? '#185FA5' : '#555', cursor: 'pointer', fontWeight: selectedTemplate === name ? 600 : 400 }}>
                {name}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <input value={t.name} onChange={e => update('name', e.target.value)} placeholder="Task name *"
            style={{ border: '1px solid #e2e2e2', borderRadius: 8, padding: '10px 14px', fontSize: 15, fontWeight: 500 }} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {[
              { label: 'Assignee',   field: 'assignee',   options: ASSIGNEES },
              { label: 'Status',     field: 'status',     options: STATUSES },
              { label: 'Priority',   field: 'priority',   options: PRIORITIES },
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
          <input value={t.timeEstimate} onChange={e => update('timeEstimate', e.target.value)} placeholder="Time estimate (e.g. 3 hours, 2 days)"
            style={{ border: '1px solid #e2e2e2', borderRadius: 8, padding: '8px 12px', fontSize: 13 }} />
          <textarea value={t.aboutProject} onChange={e => update('aboutProject', e.target.value)} placeholder="About this project…" rows={2}
            style={{ border: '1px solid #e2e2e2', borderRadius: 8, padding: '10px 12px', fontSize: 13, fontFamily: 'inherit', resize: 'vertical' }} />

          {/* Tags */}
          {selectedTemplate && t.actionItems.length > 0 && (
            <div style={{ background: '#f5f9ff', border: '1px solid #d0e4f7', borderRadius: 8, padding: '10px 14px' }}>
              <div style={{ fontSize: 12, color: '#888', marginBottom: 6 }}>Action items from template:</div>
              {t.actionItems.map(a => <div key={a.id} style={{ fontSize: 13, color: '#555', padding: '2px 0' }}>· {a.text}</div>)}
            </div>
          )}
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
  const today = todayMidnight()
  const [year,  setYear]  = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [calMode, setCalMode] = useState('month') // month | week
  const [weekOffset, setWeekOffset] = useState(0)

  // ── Month helpers ──
  const prevMonth = () => { if (month === 0) { setMonth(11); setYear(y => y - 1) } else setMonth(m => m - 1) }
  const nextMonth = () => { if (month === 11) { setMonth(0); setYear(y => y + 1) } else setMonth(m => m + 1) }
  const monthLabel = `${MONTHS[month]} ${year}`

  // ── Week helpers ──
  const weekStart = useMemo(() => {
    const d = new Date(today); d.setDate(today.getDate() - today.getDay() + weekOffset * 7); d.setHours(0,0,0,0); return d
  }, [weekOffset])
  const weekDays = Array.from({ length: 7 }, (_, i) => { const d = new Date(weekStart); d.setDate(weekStart.getDate() + i); return d })
  const weekLabel = `${weekDays[0].toLocaleDateString('en-US',{month:'short',day:'numeric'})} – ${weekDays[6].toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}`

  function getTasksForDay(day) {
    return tasks.filter(task => {
      const s = task.startDate ? parseDate(task.startDate) : null
      const e = task.dueDate   ? parseDate(task.dueDate)   : null
      if (!s && !e) return false
      const start = s || e; const end = e || s
      return day >= start && day <= end
    })
  }

  function getBarsForWeekRow(weekDaysArr) {
    const ws = weekDaysArr[0]; const we = weekDaysArr[6]
    const bars = []
    tasks.filter(t => t.status !== 'Done').forEach(task => {
      const s = task.startDate ? parseDate(task.startDate) : (task.dueDate ? parseDate(task.dueDate) : null)
      const e = task.dueDate   ? parseDate(task.dueDate)   : (task.startDate ? parseDate(task.startDate) : null)
      if (!s && !e) return
      const start = s || e; const end = e || s
      if (start > we || end < ws) return
      let cs = 0; for (let i = 0; i < 7; i++) { if (weekDaysArr[i] >= start) { cs = i; break } }
      let ce = 6; for (let i = 6; i >= 0; i--) { if (weekDaysArr[i] <= end) { ce = i; break } }
      bars.push({ task, cs, ce })
    })
    bars.sort((a,b) => a.cs - b.cs)
    const laneEnds = []
    bars.forEach(bar => {
      let lane = laneEnds.findIndex(e => e < bar.cs)
      if (lane === -1) { lane = laneEnds.length; laneEnds.push(bar.ce) } else laneEnds[lane] = bar.ce
      bar.lane = lane
    })
    return bars
  }

  const legend = ASSIGNEES.map(a => ({ name: a, ...ASSIGNEE_CAL[a] }))

  // ── Month grid ──
  const firstDay    = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells = []
  for (let i = 0; i < 42; i++) {
    const dayNum = i - firstDay + 1
    cells.push(dayNum >= 1 && dayNum <= daysInMonth ? new Date(year, month, dayNum) : null)
  }
  const weeks = Array.from({ length: 6 }, (_, i) => cells.slice(i * 7, i * 7 + 7))

  const MODBTN = (active) => ({ padding: '5px 14px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: active ? 600 : 400, background: active ? '#1a1a1a' : 'transparent', color: active ? 'white' : '#666' })

  return (
    <div style={{ padding: '24px 0' }}>
      {/* Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#1a1a1a', fontFamily: 'Georgia, serif', margin: 0 }}>
            {calMode === 'month' ? monthLabel : weekLabel}
          </h2>
          <button onClick={() => { setYear(today.getFullYear()); setMonth(today.getMonth()); setWeekOffset(0) }}
            style={{ background: '#f5f5f5', border: 'none', borderRadius: 6, padding: '4px 10px', fontSize: 12, cursor: 'pointer', color: '#555' }}>Today</button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ display: 'flex', gap: 10, marginRight: 8 }}>
            {legend.map(l => (
              <div key={l.name} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#666' }}>
                <span style={{ width: 12, height: 12, borderRadius: 3, background: l.bar, display: 'inline-block' }} />{l.name}
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 2, background: '#f5f5f5', borderRadius: 8, padding: 3 }}>
            <button onClick={() => setCalMode('month')} style={MODBTN(calMode === 'month')}>Month</button>
            <button onClick={() => setCalMode('week')}  style={MODBTN(calMode === 'week')}>Week</button>
          </div>
          <button onClick={() => calMode === 'month' ? prevMonth() : setWeekOffset(o => o - 1)}
            style={{ background: '#f5f5f5', border: 'none', borderRadius: 7, padding: '6px 10px', cursor: 'pointer' }}><Svg d={ICONS.chevL} size={16} color="#555" /></button>
          <button onClick={() => calMode === 'month' ? nextMonth() : setWeekOffset(o => o + 1)}
            style={{ background: '#f5f5f5', border: 'none', borderRadius: 7, padding: '6px 10px', cursor: 'pointer' }}><Svg d={ICONS.chevR} size={16} color="#555" /></button>
        </div>
      </div>

      {/* Day headers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', marginBottom: 2 }}>
        {DAYS_SHORT.map(d => (
          <div key={d} style={{ textAlign: 'center', fontSize: 11, fontWeight: 600, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.5px', padding: '6px 0' }}>{d}</div>
        ))}
      </div>

      {/* Month view */}
      {calMode === 'month' && (
        <div style={{ border: '1px solid #f0f0f0', borderRadius: 12, overflow: 'hidden', background: 'white' }}>
          {weeks.map((week, wi) => {
            if (wi > 0 && !week.some(Boolean)) return null
            const bars = getBarsForWeekRow(week.map(d => d || new Date(0)))
            const maxLane = bars.reduce((m, b) => Math.max(m, b.lane), -1)
            return (
              <div key={wi} style={{ borderBottom: wi < 5 ? '1px solid #f0f0f0' : 'none' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)' }}>
                  {week.map((day, di) => {
                    const isToday = day && isSameDay(day, today)
                    return (
                      <div key={di} style={{ borderRight: di < 6 ? '1px solid #f0f0f0' : 'none', padding: '8px 10px 4px', minHeight: 36, background: isToday ? '#f0f6ff' : 'transparent' }}>
                        {day && (
                          <span style={{ fontSize: 13, width: 24, height: 24, borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: isToday ? '#185FA5' : 'transparent', color: isToday ? 'white' : day.getMonth() === month ? '#333' : '#ccc', fontWeight: isToday ? 700 : 400 }}>
                            {day.getDate()}
                          </span>
                        )}
                      </div>
                    )
                  })}
                </div>
                {bars.length > 0 && (
                  <div style={{ position: 'relative', height: Math.min(bars.length, 3) * 26 + 8 }}>
                    {bars.slice(0, 3).map(({ task, cs, ce, lane }) => {
                      const cal = ASSIGNEE_CAL[task.assignee] || ASSIGNEE_CAL['Kyle Nauj']
                      return (
                        <div key={task.id} onClick={() => onTaskClick(task)}
                          style={{ position: 'absolute', left: `calc(${(cs/7)*100}% + 3px)`, width: `calc(${((ce-cs+1)/7)*100}% - 6px)`, top: lane*26+4, height: 22, background: cal.bar, borderRadius: 4, display: 'flex', alignItems: 'center', paddingLeft: 6, cursor: 'pointer', fontSize: 11, color: 'white', fontWeight: 500, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}
                          title={task.name}>{task.name}</div>
                      )
                    })}
                    {bars.length > 3 && <div style={{ position: 'absolute', bottom: 2, right: 8, fontSize: 11, color: '#aaa' }}>+{bars.length - 3} more</div>}
                  </div>
                )}
                {bars.length === 0 && <div style={{ height: 8 }} />}
              </div>
            )
          })}
        </div>
      )}

      {/* Week view */}
      {calMode === 'week' && (
        <div style={{ border: '1px solid #f0f0f0', borderRadius: 12, overflow: 'hidden', background: 'white' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)' }}>
            {weekDays.map((day, di) => {
              const isToday = isSameDay(day, today)
              const dayTasks = getTasksForDay(day)
              const overdueTasks = dayTasks.filter(t => isOverdue(t))
              return (
                <div key={di} style={{ borderRight: di < 6 ? '1px solid #f0f0f0' : 'none', minHeight: 200, background: isToday ? '#f7faff' : 'transparent' }}>
                  {/* Day header */}
                  <div style={{ padding: '12px 10px 8px', borderBottom: '1px solid #f5f5f5', textAlign: 'center' }}>
                    <div style={{ fontSize: 11, color: isToday ? '#185FA5' : '#aaa', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.5px' }}>{DAYS_SHORT[day.getDay()]}</div>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: isToday ? '#185FA5' : 'transparent', color: isToday ? 'white' : '#333', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: isToday ? 700 : 500, margin: '4px auto 0' }}>
                      {day.getDate()}
                    </div>
                  </div>
                  {/* Tasks */}
                  <div style={{ padding: '6px 4px' }}>
                    {dayTasks.length === 0 && <div style={{ fontSize: 11, color: '#e0e0e0', textAlign: 'center', paddingTop: 12 }}>—</div>}
                    {dayTasks.map(task => {
                      const cal = ASSIGNEE_CAL[task.assignee] || ASSIGNEE_CAL['Kyle Nauj']
                      const od  = isOverdue(task)
                      return (
                        <div key={task.id} onClick={() => onTaskClick(task)}
                          style={{ margin: '3px 2px', padding: '5px 7px', borderRadius: 6, background: od ? '#FAECE7' : cal.bar + '18', borderLeft: `3px solid ${od ? '#D85A30' : cal.bar}`, cursor: 'pointer', fontSize: 11, color: od ? '#993C1D' : '#1a1a1a', fontWeight: 500, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}
                          title={task.name}>
                          <div style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{task.name}</div>
                          <div style={{ fontSize: 10, color: '#888', marginTop: 1 }}>{task.assignee.split(' ')[0]}</div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <p style={{ fontSize: 12, color: '#bbb', marginTop: 12, textAlign: 'center' }}>Completed tasks are hidden. Set start and due dates to see tasks on the calendar.</p>
    </div>
  )
}

// ── Workload view ──────────────────────────────────────────────────────────
function WorkloadView({ tasks, onTaskClick }) {
  const thisWeek = tasks.filter(isDueThisWeek)
  return (
    <div style={{ padding: '24px 0' }}>
      <h2 style={{ fontSize: 20, fontWeight: 700, color: '#1a1a1a', fontFamily: 'Georgia, serif', marginBottom: 24 }}>Team workload</h2>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {ASSIGNEES.map(person => {
          const personTasks   = tasks.filter(t => t.assignee === person && t.status !== 'Done')
          const doneTasks     = tasks.filter(t => t.assignee === person && t.status === 'Done')
          const weekTasks     = personTasks.filter(isDueThisWeek)
          const overdueTasks  = personTasks.filter(isOverdue)
          const cal           = ASSIGNEE_CAL[person]
          const totalEstMins  = personTasks.reduce((sum, t) => {
            if (!t.timeEstimate) return sum
            const m = t.timeEstimate.match(/(\d+\.?\d*)\s*(h|hour|hr|d|day)/i)
            if (!m) return sum
            return sum + (m[2].startsWith('d') ? parseFloat(m[1]) * 8 * 60 : parseFloat(m[1]) * 60)
          }, 0)
          const totalEstStr = totalEstMins > 0 ? (totalEstMins >= 480 ? `${(totalEstMins/480).toFixed(1)} days` : `${(totalEstMins/60).toFixed(1)} hrs`) : null
          const byStatus = STATUSES.filter(s => s !== 'Done').reduce((acc, s) => ({ ...acc, [s]: personTasks.filter(t => t.status === s).length }), {})
          const completionPct = tasks.filter(t => t.assignee === person).length > 0
            ? Math.round(doneTasks.length / tasks.filter(t => t.assignee === person).length * 100) : 0

          return (
            <div key={person} style={{ background: 'white', border: '1px solid #f0f0f0', borderRadius: 14, padding: '22px 24px' }}>
              {/* Person header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                <Avatar name={person} size={40} />
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#1a1a1a' }}>{person}</div>
                  <div style={{ fontSize: 12, color: '#888' }}>{personTasks.length} active · {doneTasks.length} completed</div>
                </div>
                {totalEstStr && (
                  <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                    <div style={{ fontSize: 18, fontWeight: 700, color: cal.bar }}>{totalEstStr}</div>
                    <div style={{ fontSize: 11, color: '#aaa' }}>estimated</div>
                  </div>
                )}
              </div>

              {/* Completion bar */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#888', marginBottom: 6 }}>
                  <span>Overall completion</span><span style={{ fontWeight: 600, color: '#639922' }}>{completionPct}%</span>
                </div>
                <div style={{ height: 8, background: '#f0f0f0', borderRadius: 4 }}>
                  <div style={{ height: '100%', width: `${completionPct}%`, background: '#639922', borderRadius: 4, transition: 'width 0.5s' }} />
                </div>
              </div>

              {/* Status breakdown */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
                {Object.entries(byStatus).map(([status, count]) => {
                  const c = STATUS_COLORS[status]
                  return (
                    <div key={status} style={{ flex: 1, background: c.bg, borderRadius: 8, padding: '10px 8px', textAlign: 'center' }}>
                      <div style={{ fontSize: 20, fontWeight: 700, color: c.text }}>{count}</div>
                      <div style={{ fontSize: 10, color: c.text, opacity: 0.8 }}>{status}</div>
                    </div>
                  )
                })}
              </div>

              {/* Alerts */}
              {overdueTasks.length > 0 && (
                <div style={{ background: '#FAECE7', borderRadius: 8, padding: '8px 12px', marginBottom: 12, fontSize: 12, color: '#993C1D', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Svg d={ICONS.alert} size={13} color="#993C1D" /> {overdueTasks.length} overdue task{overdueTasks.length > 1 ? 's' : ''}
                </div>
              )}
              {weekTasks.length > 0 && (
                <div style={{ background: '#FAEEDA', borderRadius: 8, padding: '8px 12px', marginBottom: 16, fontSize: 12, color: '#854F0B', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Svg d={ICONS.calendar} size={13} color="#854F0B" /> {weekTasks.length} due this week
                </div>
              )}

              {/* Active tasks list */}
              <div>
                <div style={{ fontSize: 12, color: '#aaa', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>Active tasks</div>
                {personTasks.length === 0 && <div style={{ fontSize: 13, color: '#bbb' }}>No active tasks</div>}
                {personTasks.slice(0, 5).map(task => (
                  <div key={task.id} onClick={() => onTaskClick(task)}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid #f5f5f5', cursor: 'pointer' }}
                    onMouseEnter={e => e.currentTarget.style.opacity = '0.7'}
                    onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
                    <StatusBadge status={task.status} />
                    <span style={{ fontSize: 13, color: '#333', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{task.name}</span>
                    {task.dueDate && <span style={{ fontSize: 11, color: isOverdue(task) ? '#993C1D' : '#aaa', fontWeight: isOverdue(task) ? 600 : 400, whiteSpace: 'nowrap' }}>{task.dueDate}</span>}
                    {task.timeEstimate && <span style={{ fontSize: 11, color: '#bbb', whiteSpace: 'nowrap' }}>{task.timeEstimate}</span>}
                  </div>
                ))}
                {personTasks.length > 5 && <div style={{ fontSize: 12, color: '#aaa', paddingTop: 8 }}>+{personTasks.length - 5} more tasks</div>}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Completed log view ─────────────────────────────────────────────────────
function CompletedView({ tasks, onTaskClick, onReopen }) {
  const done = tasks.filter(t => t.status === 'Done').sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''))
  const byMonth = done.reduce((acc, task) => {
    const key = task.updatedAt ? new Date(task.updatedAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'Earlier'
    if (!acc[key]) acc[key] = []
    acc[key].push(task)
    return acc
  }, {})

  return (
    <div style={{ padding: '24px 0' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#1a1a1a', fontFamily: 'Georgia, serif', margin: 0 }}>Completed tasks</h2>
        <span style={{ background: '#EAF3DE', color: '#3B6D11', borderRadius: 6, padding: '3px 10px', fontSize: 13, fontWeight: 600 }}>{done.length}</span>
      </div>
      {done.length === 0 && <div style={{ textAlign: 'center', color: '#aaa', fontSize: 14, paddingTop: 40 }}>No completed tasks yet.</div>}
      {Object.entries(byMonth).map(([month, monthTasks]) => (
        <div key={month} style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 12, color: '#aaa', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10 }}>{month} · {monthTasks.length} completed</div>
          <div style={{ background: 'white', border: '1px solid #f0f0f0', borderRadius: 12, overflow: 'hidden' }}>
            {monthTasks.map((task, i) => (
              <div key={task.id}
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 18px', borderBottom: i < monthTasks.length - 1 ? '1px solid #f5f5f5' : 'none' }}>
                <Svg d={ICONS.done} size={18} color="#639922" />
                <div style={{ flex: 1, minWidth: 0, cursor: 'pointer' }} onClick={() => onTaskClick(task)}>
                  <div style={{ fontSize: 14, fontWeight: 500, color: '#555', textDecoration: 'line-through', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{task.name}</div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 2, alignItems: 'center' }}>
                    <Avatar name={task.assignee} size={16} />
                    <span style={{ fontSize: 12, color: '#aaa' }}>{task.assignee}</span>
                    <span style={{ fontSize: 12, color: '#ccc' }}>{task.department}</span>
                    {task.updatedAt && <span style={{ fontSize: 12, color: '#ccc' }}>· {relativeTime(task.updatedAt)}</span>}
                    {(task.tags || []).map(tag => <TagBadge key={tag} tag={tag} />)}
                  </div>
                </div>
                <button onClick={() => onReopen(task)}
                  style={{ background: '#f5f5f5', color: '#555', border: 'none', borderRadius: 7, padding: '5px 12px', fontSize: 12, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                  Reopen
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Meeting notes component ────────────────────────────────────────────────
function MeetingNotes({ dateKey }) {
  const [content,  setContent]  = useState('')
  const [loading,  setLoading]  = useState(true)
  const [status,   setStatus]   = useState('')

  useEffect(() => {
    setLoading(true)
    dbLoadNote(dateKey).then(c => { setContent(c); setLoading(false) })
  }, [dateKey])

  const save = async () => {
    setStatus('saving')
    await dbSaveNote(dateKey, content)
    setStatus('saved')
    setTimeout(() => setStatus(''), 2000)
  }

  return (
    <div style={{ background: 'white', border: '1px solid #f0f0f0', borderRadius: 12, padding: '20px 24px', marginTop: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, color: '#333', display: 'flex', alignItems: 'center', gap: 7, margin: 0 }}>
          <Svg d={ICONS.note} size={15} color="#888" /> Meeting notes
        </h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {status === 'saving' && <span style={{ fontSize: 11, color: '#aaa' }}>Saving…</span>}
          {status === 'saved'  && <span style={{ fontSize: 11, color: '#639922' }}>✓ Saved</span>}
          <button onClick={save} style={{ background: '#1a1a1a', color: 'white', border: 'none', borderRadius: 7, padding: '6px 14px', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>Save notes</button>
        </div>
      </div>
      {loading
        ? <div style={{ fontSize: 13, color: '#aaa' }}>Loading…</div>
        : <textarea value={content} onChange={e => setContent(e.target.value)}
            placeholder="Jot down decisions, action items, follow-ups from today's meeting…"
            rows={8}
            style={{ width: '100%', border: '1px solid #e8e8e8', borderRadius: 8, padding: '12px 14px', fontSize: 14, color: '#333', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box', lineHeight: 1.6 }} />
      }
    </div>
  )
}

// ── Weekly meeting view ────────────────────────────────────────────────────
function MeetingView({ tasks }) {
  const today       = new Date()
  const dateKey     = today.toISOString().split('T')[0]
  const dateLabel   = today.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  const byStatus    = STATUSES.reduce((acc, s) => ({ ...acc, [s]: tasks.filter(t => t.status === s) }), {})
  const thisWeek    = tasks.filter(t => t.status !== 'Done' && isDueThisWeek(t))
  const overdueAll  = tasks.filter(isOverdue)

  return (
    <div style={{ padding: '24px 0' }}>
      {/* Header card */}
      <div style={{ background: '#1a1a1a', borderRadius: 12, padding: '20px 24px', marginBottom: 24, color: 'white' }}>
        <div style={{ fontSize: 11, color: '#888', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 }}>Weekly sync</div>
        <div style={{ fontSize: 20, fontWeight: 700, fontFamily: 'Georgia, serif' }}>{dateLabel}</div>
        <div style={{ display: 'flex', gap: 24, marginTop: 16, flexWrap: 'wrap' }}>
          {STATUSES.map(s => (
            <div key={s}>
              <div style={{ fontSize: 22, fontWeight: 700 }}>{byStatus[s].length}</div>
              <div style={{ fontSize: 11, color: '#999' }}>{s}</div>
            </div>
          ))}
          {overdueAll.length > 0 && (
            <div>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#EF9F27' }}>{overdueAll.length}</div>
              <div style={{ fontSize: 11, color: '#999' }}>Overdue</div>
            </div>
          )}
          {thisWeek.length > 0 && (
            <div>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#378ADD' }}>{thisWeek.length}</div>
              <div style={{ fontSize: 11, color: '#999' }}>Due this week</div>
            </div>
          )}
        </div>
      </div>

      {/* Due this week spotlight */}
      {thisWeek.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#185FA5' }}>Due this week</span>
          </div>
          {thisWeek.map(task => (
            <div key={task.id} style={{ background: '#f0f6ff', border: '1px solid #d0e4f7', borderRadius: 10, padding: '12px 18px', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 14 }}>
              <Avatar name={task.assignee} size={28} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 14, color: '#1a1a1a' }}>{task.name}</div>
                <div style={{ display: 'flex', gap: 8, marginTop: 4, flexWrap: 'wrap', alignItems: 'center' }}>
                  <StatusBadge status={task.status} />
                  <PriorityBadge priority={task.priority} />
                  {task.dueDate && <span style={{ fontSize: 12, color: '#185FA5', fontWeight: 600 }}>Due {task.dueDate}</span>}
                  {(task.tags || []).map(tag => <TagBadge key={tag} tag={tag} />)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* By status */}
      {STATUSES.map(status => byStatus[status].length > 0 && (
        <div key={status} style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <StatusBadge status={status} />
            <span style={{ fontSize: 13, color: '#aaa' }}>{byStatus[status].length} task{byStatus[status].length !== 1 ? 's' : ''}</span>
          </div>
          {byStatus[status].map(task => {
            const done    = task.actionItems.filter(a => a.done).length
            const pct     = task.actionItems.length ? Math.round(done / task.actionItems.length * 100) : 0
            const overdue = isOverdue(task)
            return (
              <div key={task.id} style={{ background: 'white', border: `1px solid ${overdue ? '#f5c4b3' : '#f0f0f0'}`, borderRadius: 10, padding: '14px 18px', marginBottom: 8, display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                <Avatar name={task.assignee} size={32} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <div style={{ fontWeight: 600, fontSize: 14, color: '#1a1a1a' }}>{task.name}</div>
                    {overdue && <span style={{ fontSize: 11, background: '#FAECE7', color: '#993C1D', borderRadius: 4, padding: '2px 6px', fontWeight: 600 }}>Overdue</span>}
                    {task.isRecurring && <span style={{ fontSize: 11, background: '#EDE9FE', color: '#5B21B6', borderRadius: 4, padding: '2px 6px', fontWeight: 600 }}>{task.recurringFreq}</span>}
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 6 }}>
                    <PriorityBadge priority={task.priority} />
                    <span style={{ fontSize: 12, color: '#888' }}>{task.department}</span>
                    {task.startDate && <span style={{ fontSize: 12, color: '#888' }}>Start {task.startDate}</span>}
                    {task.dueDate   && <span style={{ fontSize: 12, color: overdue ? '#993C1D' : '#888', fontWeight: overdue ? 600 : 400 }}>Due {task.dueDate}</span>}
                    {task.timeEstimate && <span style={{ fontSize: 12, color: '#aaa' }}><Svg d={ICONS.clock} size={11} color="#bbb" style={{ marginRight: 2 }} />{task.timeEstimate}</span>}
                    {(task.tags || []).map(tag => <TagBadge key={tag} tag={tag} />)}
                  </div>
                  {task.actionItems.length > 0 && (
                    <div>
                      <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>{done}/{task.actionItems.length} action items</div>
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

      {/* Meeting notes */}
      <MeetingNotes dateKey={dateKey} />
    </div>
  )
}

// ── Main App ───────────────────────────────────────────────────────────────
export default // ── Auth: Login Screen ────────────────────────────────────────────────────
function LoginScreen() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [authLoading, setAuthLoading] = useState(false)
  const [authError, setAuthError] = useState(null)

  async function handleLogin(e) {
    e.preventDefault()
    setAuthLoading(true)
    setAuthError(null)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setAuthLoading(false)
      setAuthError(error.message)
    } else {
      // sign-in succeeded; onAuthStateChange in App will update session state
    }
  }

  const styles = {
    wrap: { display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100vh', background:'#F9F8F5', fontFamily:'inherit' },
    card: { background:'#fff', borderRadius:'16px', padding:'48px 40px', boxShadow:'0 4px 24px rgba(0,0,0,0.08)', maxWidth:'400px', width:'100%', textAlign:'center' },
    logo: { fontSize:'32px', marginBottom:'8px' },
    title: { fontSize:'22px', fontWeight:'700', color:'#1a1a1a', margin:'0 0 6px' },
    sub: { fontSize:'14px', color:'#888', margin:'0 0 28px' },
    input: { width:'100%', padding:'12px 16px', borderRadius:'8px', border:'1.5px solid #E5E4E0', fontSize:'15px', outline:'none', boxSizing:'border-box', marginBottom:'12px' },
    btn: { width:'100%', padding:'13px', borderRadius:'8px', background:'#1a1a1a', color:'#fff', fontSize:'15px', fontWeight:'600', border:'none', cursor:'pointer', marginTop:'4px' },
    err: { color:'#c0392b', fontSize:'13px', marginTop:'10px' },
  }

  return (
    <div style={styles.wrap}>
      <div style={styles.card}>
        <div style={styles.logo}>🌸</div>
        <h1 style={styles.title}>Buddy Blooms</h1>
        <p style={styles.sub}>Sign in to access the Project Tracker</p>
        <form onSubmit={handleLogin}>
          <input style={styles.input} type="email" placeholder="your@email.com" value={email} onChange={e => setEmail(e.target.value)} required />
          <input style={styles.input} type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required />
          <button style={styles.btn} type="submit" disabled={authLoading}>{authLoading ? 'Signing in…' : 'Sign In'}</button>
          {authError && <p style={styles.err}>{authError}</p>}
        </form>
      </div>
    </div>
  )
}

function App() {
  const [session, setSession] = useState(null)
  const [sessionLoading, setSessionLoading] = useState(true)
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s)
      setSessionLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s)
      setSessionLoading(false)
    })
    return () => subscription.unsubscribe()
  }, [])


  const [tasks,           setTasks]          = useState([])
  const [loading,         setLoading]        = useState(true)
  const [error,           setError]          = useState(null)
  const [saveStatus,      setSaveStatus]     = useState('')
  const [activeTab,       setActiveTab]      = useState('all')
  const [view,            setView]           = useState('list')
  const [selectedTask,    setSelectedTask]   = useState(null)
  const [showNewTask,     setShowNewTask]    = useState(false)
  const [filterStatus,    setFilterStatus]   = useState('All')
  const [filterPriority,  setFilterPriority] = useState('All')
  const [filterTag,       setFilterTag]      = useState('All')
  const [search,          setSearch]         = useState('')
  const [recurringPrompt, setRecurringPrompt]= useState(null) // task that just got completed

  const currentUser = activeTab === 'cece' ? 'Cece Rip' : 'Kyle Nauj'

  useEffect(() => {
    dbLoadTasks().then(data => { setTasks(data); setLoading(false) }).catch(err => { setError(err.message); setLoading(false) })
  }, [])

  const showSave = async (fn) => {
    setSaveStatus('saving')
    try { await fn(); setSaveStatus('saved'); setTimeout(() => setSaveStatus(''), 2000) }
    catch { setSaveStatus('error'); setTimeout(() => setSaveStatus(''), 3000) }
  }

  const handleSaveTask = async (updated) => {
    const prev = tasks.find(t => t.id === updated.id)
    await showSave(async () => {
      await dbUpsertTask(updated)
      setTasks(prev2 => prev2.map(t => t.id === updated.id ? updated : t))
    })
    // Trigger recurring prompt if task just became Done
    if (updated.isRecurring && updated.status === 'Done' && prev && prev.status !== 'Done') {
      setRecurringPrompt(updated)
    }
  }

  const handleDeleteTask = async (id) => {
    await showSave(async () => {
      await dbDeleteTask(id)
      setTasks(prev => prev.filter(t => t.id !== id))
      setSelectedTask(null)
    })
  }

  const handleAddTask = async (task) => {
    await showSave(async () => {
      await dbUpsertTask(task)
      setTasks(prev => [...prev, task])
    })
  }

  const handleReopenTask = async (task) => {
    const updated = { ...task, status: 'In Progress', updatedAt: new Date().toISOString() }
    await handleSaveTask(updated)
    setSelectedTask(null)
  }

  const handleCreateRecurring = async (nextStart, nextDue) => {
    const src = recurringPrompt
    setRecurringPrompt(null)
    const newTask = {
      ...src,
      id: Date.now(),
      status: 'To Do',
      startDate: nextStart,
      dueDate: nextDue,
      comments: '',
      actionItems: src.actionItems.map(a => ({ ...a, done: false })),
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString(),
    }
    await handleAddTask(newTask)
  }

  const filtered = useMemo(() => {
    let list = tasks
    if (activeTab === 'mine') list = list.filter(t => t.assignee === 'Kyle Nauj')
    if (activeTab === 'cece') list = list.filter(t => t.assignee === 'Cece Rip')
    if (filterStatus   !== 'All') list = list.filter(t => t.status   === filterStatus)
    if (filterPriority !== 'All') list = list.filter(t => t.priority === filterPriority)
    if (filterTag      !== 'All') list = list.filter(t => (t.tags || []).includes(filterTag))
    if (search) list = list.filter(t => t.name.toLowerCase().includes(search.toLowerCase()) || t.department.toLowerCase().includes(search.toLowerCase()))
    return list
  }, [tasks, activeTab, filterStatus, filterPriority, filterTag, search])

  // Split filtered into sections for list view
  const overdueList  = filtered.filter(t => isOverdue(t))
  const thisWeekList = filtered.filter(t => isDueThisWeek(t) && !isOverdue(t))
  const restList     = filtered.filter(t => !isOverdue(t) && !isDueThisWeek(t))

  const counts = {
    all:  tasks.filter(t => t.status !== 'Done').length,
    mine: tasks.filter(t => t.assignee === 'Kyle Nauj' && t.status !== 'Done').length,
    cece: tasks.filter(t => t.assignee === 'Cece Rip'  && t.status !== 'Done').length,
  }
  const overdueCount = tasks.filter(isOverdue).length

  const TAB = (active) => ({
    padding: '8px 18px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13,
    fontWeight: active ? 600 : 400, background: active ? '#1a1a1a' : 'transparent', color: active ? 'white' : '#666',
  })
  const VBTN = (active) => ({
    background: active ? '#1a1a1a' : '#f5f5f5', color: active ? 'white' : '#555',
    border: 'none', borderRadius: 8, padding: '8px 14px', fontSize: 13, cursor: 'pointer',
    display: 'flex', alignItems: 'center', gap: 6, fontWeight: active ? 600 : 400,
  })

  if (loading) 
  if (sessionLoading) return <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',fontSize:'16px',color:'#888'}}>Loading…</div>
  if (sessionLoading) return null
  if (!session) return <LoginScreen />
return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', flexDirection: 'column', gap: 12, color: '#aaa', fontSize: 14 }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      <div style={{ width: 32, height: 32, border: '2px solid #f0f0f0', borderTopColor: '#1a1a1a', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      Loading workspace…
    </div>
  )
  if (error) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', flexDirection: 'column', gap: 8, color: '#993C1D', fontSize: 14 }}>
      <p style={{ fontWeight: 600 }}>Could not connect to Supabase</p>
      <p style={{ color: '#888', fontSize: 13 }}>{error}</p>
    </div>
  )

  const renderRow = (task, i, arr) => {
    const overdue = isOverdue(task)
    const dueThisWk = isDueThisWeek(task)
    return (
      <div key={task.id} onClick={() => setSelectedTask(task)}
        style={{ display: 'grid', gridTemplateColumns: '2fr 110px 120px 160px 90px 85px 85px 30px', padding: '11px 20px', gap: 8, borderBottom: i < arr.length - 1 ? '1px solid #f5f5f5' : 'none', cursor: 'pointer', alignItems: 'center', background: overdue ? '#fffaf9' : 'transparent', transition: 'background 0.1s' }}
        onMouseEnter={e => e.currentTarget.style.background = overdue ? '#fff5f2' : '#fafafa'}
        onMouseLeave={e => e.currentTarget.style.background = overdue ? '#fffaf9' : 'transparent'}>
        <div style={{ minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: (task.tags || []).length > 0 ? 4 : 0 }}>
            {overdue && <Svg d={ICONS.alert} size={13} color="#D85A30" style={{ flexShrink: 0 }} />}
            {task.isRecurring && <Svg d={ICONS.repeat} size={12} color="#5B21B6" style={{ flexShrink: 0 }} />}
            <span style={{ fontWeight: 500, fontSize: 14, color: '#1a1a1a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{task.name}</span>
          </div>
          {(task.tags || []).length > 0 && (
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>{(task.tags || []).map(tag => <TagBadge key={tag} tag={tag} />)}</div>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Avatar name={task.assignee} size={20} />
          <span style={{ fontSize: 12, color: '#555', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{task.assignee.split(' ')[0]}</span>
        </div>
        <div><StatusBadge status={task.status} /></div>
        <div><PriorityBadge priority={task.priority} /></div>
        <div style={{ fontSize: 12, color: '#888' }}>{task.department}</div>
        <div style={{ fontSize: 12, color: '#999' }}>{task.startDate || <span style={{ color: '#e0e0e0' }}>—</span>}</div>
        <div style={{ fontSize: 12, color: overdue ? '#993C1D' : dueThisWk ? '#854F0B' : '#999', fontWeight: overdue || dueThisWk ? 600 : 400 }}>{task.dueDate || <span style={{ color: '#e0e0e0' }}>—</span>}</div>
        <div><Svg d={ICONS.folder} size={14} color={task.sharepointUrl ? '#378ADD' : '#e8e8e8'} /></div>
      </div>
    )
  }

  const COL_HEADERS = ['Project Name','Assignee','Status','Priority','Dept','Start','Due','']

  return (
    <div style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", maxWidth: 1140, margin: '0 auto', padding: '0 20px 60px' }}>

      {/* Header */}
      <div style={{ padding: '32px 0 24px', borderBottom: '1px solid #f0f0f0', marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 800, color: '#1a1a1a', fontFamily: 'Georgia, serif', letterSpacing: '-0.5px', margin: 0 }}>Project Tracker</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4, flexWrap: 'wrap' }}>
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
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <button onClick={() => setView('list')}      style={VBTN(view === 'list')}><Svg d={ICONS.project}  size={14} color={view === 'list'      ? 'white' : '#555'} />List</button>
            <button onClick={() => setView('calendar')}  style={VBTN(view === 'calendar')}><Svg d={ICONS.calendar} size={14} color={view === 'calendar'  ? 'white' : '#555'} />Calendar</button>
            <button onClick={() => setView('workload')}  style={VBTN(view === 'workload')}><Svg d={ICONS.chart}    size={14} color={view === 'workload'  ? 'white' : '#555'} />Workload</button>
            <button onClick={() => setView('completed')} style={VBTN(view === 'completed')}><Svg d={ICONS.done}     size={14} color={view === 'completed' ? 'white' : '#555'} />Completed</button>
            <button onClick={() => setView('meeting')}   style={VBTN(view === 'meeting')}><Svg d={ICONS.meeting}   size={14} color={view === 'meeting'   ? 'white' : '#555'} />Weekly sync</button>
            <button onClick={() => setShowNewTask(true)}
              style={{ background: '#1a1a1a', color: 'white', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
              <Svg d={ICONS.plus} size={14} color="white" /> New task
            </button>
          </div>
        </div>

        {/* Status pills */}
        <div style={{ display: 'flex', gap: 10, marginTop: 20, flexWrap: 'wrap' }}>
          {STATUSES.map(s => {
            const c = STATUS_COLORS[s]; const n = tasks.filter(t => t.status === s).length
            return (
              <div key={s} style={{ background: c.bg, borderRadius: 8, padding: '7px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: c.dot }} />
                <span style={{ fontSize: 13, color: c.text, fontWeight: 500 }}>{s}</span>
                <span style={{ fontSize: 15, fontWeight: 700, color: c.text }}>{n}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Views */}
      {view === 'calendar'  && <CalendarView  tasks={filtered}    onTaskClick={setSelectedTask} />}
      {view === 'workload'  && <WorkloadView  tasks={tasks}        onTaskClick={setSelectedTask} />}
      {view === 'completed' && <CompletedView tasks={tasks}        onTaskClick={setSelectedTask} onReopen={handleReopenTask} />}
      {view === 'meeting'   && <MeetingView   tasks={tasks} />}

      {view === 'list' && (
        <>
          {/* Tabs + filters */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
            <div style={{ display: 'flex', gap: 4, background: '#f5f5f5', borderRadius: 10, padding: 4 }}>
              {[
                { id: 'all',  label: `All (${counts.all})`         },
                { id: 'mine', label: `Kyle's (${counts.mine})`     },
                { id: 'cece', label: `Cece's (${counts.cece})`     },
              ].map(tab => <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={TAB(activeTab === tab.id)}>{tab.label}</button>)}
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search…"
                style={{ border: '1px solid #e2e2e2', borderRadius: 8, padding: '7px 12px', fontSize: 13, width: 140 }} />
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                style={{ border: '1px solid #e2e2e2', borderRadius: 8, padding: '7px 8px', fontSize: 13, background: 'white' }}>
                <option value="All">All statuses</option>
                {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)}
                style={{ border: '1px solid #e2e2e2', borderRadius: 8, padding: '7px 8px', fontSize: 13, background: 'white' }}>
                <option value="All">All priorities</option>
                {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              <select value={filterTag} onChange={e => setFilterTag(e.target.value)}
                style={{ border: '1px solid #e2e2e2', borderRadius: 8, padding: '7px 8px', fontSize: 13, background: 'white' }}>
                <option value="All">All tags</option>
                {TAGS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          {/* Column headers */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 110px 120px 160px 90px 85px 85px 30px', padding: '8px 20px', background: '#fafafa', border: '1px solid #f0f0f0', borderRadius: '12px 12px 0 0', gap: 8 }}>
            {COL_HEADERS.map((label, i) => (
              <div key={i} style={{ color: '#aaa', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</div>
            ))}
          </div>

          {/* Overdue section */}
          {overdueList.length > 0 && (
            <div style={{ background: 'white', border: '1px solid #f5c4b3', borderTop: 'none' }}>
              <div style={{ padding: '8px 20px', background: '#FAECE7', fontSize: 11, fontWeight: 700, color: '#993C1D', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Svg d={ICONS.alert} size={12} color="#993C1D" /> Overdue
              </div>
              {overdueList.map((t, i) => renderRow(t, i, overdueList))}
            </div>
          )}

          {/* Due this week section */}
          {thisWeekList.length > 0 && (
            <div style={{ background: 'white', border: '1px solid #f0e4c0', borderTop: 'none' }}>
              <div style={{ padding: '8px 20px', background: '#FEF9EE', fontSize: 11, fontWeight: 700, color: '#854F0B', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Svg d={ICONS.calendar} size={12} color="#854F0B" /> Due this week
              </div>
              {thisWeekList.map((t, i) => renderRow(t, i, thisWeekList))}
            </div>
          )}

          {/* Rest */}
          {restList.length > 0 && (
            <div style={{ background: 'white', border: '1px solid #f0f0f0', borderTop: (overdueList.length > 0 || thisWeekList.length > 0) ? 'none' : '1px solid #f0f0f0', borderRadius: overdueList.length === 0 && thisWeekList.length === 0 ? '0 0 12px 12px' : '0 0 12px 12px', overflow: 'hidden' }}>
              {restList.map((t, i) => renderRow(t, i, restList))}
            </div>
          )}

          {filtered.filter(t => t.status !== 'Done').length === 0 && (
            <div style={{ background: 'white', border: '1px solid #f0f0f0', borderTop: 'none', borderRadius: '0 0 12px 12px', padding: 40, textAlign: 'center', color: '#aaa', fontSize: 14 }}>
              No active tasks found.
            </div>
          )}

          <button onClick={() => setShowNewTask(true)}
            style={{ background: 'transparent', border: '1.5px dashed #d0d0d0', borderRadius: 8, padding: '10px', fontSize: 13, color: '#aaa', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, width: '100%', marginTop: 12, boxSizing: 'border-box' }}>
            <Svg d={ICONS.plus} size={14} color="#bbb" /> Add new task
          </button>
        </>
      )}

      {selectedTask && (
        <TaskModal task={selectedTask} onClose={() => setSelectedTask(null)}
          onSave={handleSaveTask} onDelete={handleDeleteTask}
          currentUser={currentUser === 'Kyle Nauj' ? 'Kyle' : 'Cece'} />
      )}
      {showNewTask && (
        <NewTaskModal onClose={() => setShowNewTask(false)} onAdd={handleAddTask} currentUser={currentUser} />
      )}
      {recurringPrompt && (
        <RecurringDialog task={recurringPrompt} onConfirm={handleCreateRecurring} onDismiss={() => setRecurringPrompt(null)} />
      )}
    </div>
  )
}

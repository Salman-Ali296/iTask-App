import { useEffect, useMemo, useState } from 'react'
import Navbar from './components/Navbar'
import { v4 as uuidv4 } from 'uuid'
import { motion, AnimatePresence } from 'framer-motion'
import { Toaster, toast } from 'react-hot-toast'
import { Edit3, Save, Trash2, Flag, CalendarDays, Filter, Search, Flame } from 'lucide-react'
import confetti from "canvas-confetti"
import { CircularProgressbar, buildStyles } from "react-circular-progressbar"
import "react-circular-progressbar/dist/styles.css"

import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

function SortableTodo({ t, children }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: t.id })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  }
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {children}
    </div>
  )
}

// small helpers
const startOfDayISO = (ts) => new Date(new Date(ts).setHours(0, 0, 0, 0)).toISOString().slice(0, 10)
const todayISO = () => startOfDayISO(Date.now())
const yesterdayISO = () => startOfDayISO(Date.now() - 24 * 60 * 60 * 1000)

// accent themes
const ACCENTS = {
  violet: { hex: '#7c3aed', trail: '#e9d5ff' },
  emerald: { hex: '#10b981', trail: '#d1fae5' },
  sky: { hex: '#0ea5e9', trail: '#e0f2fe' },
  rose: { hex: '#e11d48', trail: '#ffe4e6' },
}

function App() {
  const [todo, setTodo] = useState("")
  const [priority, setPriority] = useState("medium")
  const [dueDate, setDueDate] = useState("")
  const [todos, setTodos] = useState([])
  const [editId, setEditId] = useState(null)
  const [editText, setEditText] = useState("")
  const [filter, setFilter] = useState("all") // all | active | completed
  const [query, setQuery] = useState("")
  const [streak, setStreak] = useState(0)
  const [lastDoneISO, setLastDoneISO] = useState(null)
  const [accent, setAccent] = useState(localStorage.getItem('accent') || 'violet')

  // --- persistence ---
  useEffect(() => {
    const saved = localStorage.getItem("todos")
    const savedStreak = localStorage.getItem("streak")
    const savedLast = localStorage.getItem("lastDoneISO")
    if (saved) {
      try { setTodos(JSON.parse(saved)) } catch { }
    }
    if (savedStreak) setStreak(parseInt(savedStreak, 10) || 0)
    if (savedLast) setLastDoneISO(savedLast)
  }, [])

  useEffect(() => {
    localStorage.setItem("todos", JSON.stringify(todos))
  }, [todos])

  useEffect(() => {
    localStorage.setItem('streak', String(streak))
    if (lastDoneISO) localStorage.setItem('lastDoneISO', lastDoneISO)
  }, [streak, lastDoneISO])

  // set CSS vars for accent
  useEffect(() => {
    const a = ACCENTS[accent] || ACCENTS.violet
    document.documentElement.style.setProperty('--accent', a.hex)
    document.documentElement.style.setProperty('--accent-trail', a.trail)
    localStorage.setItem('accent', accent)
  }, [accent])

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  )

  const handleToggle = (id) => {
    let becameComplete = false
    setTodos(prev =>
      prev.map(t => {
        if (t.id !== id) return t
        const nextComplete = !t.isComplete
        becameComplete = nextComplete
        return {
          ...t,
          isComplete: nextComplete,
          completedAt: nextComplete ? Date.now() : null
        }
      })
    )

    if (becameComplete) {
      confetti({
        particleCount: 90,
        spread: 70,
        origin: { y: 0.6 },
        colors: [ACCENTS[accent].hex]
      })
      // streak logic
      const tISO = todayISO()
      if (lastDoneISO === tISO) {
        // already counted today
      } else if (lastDoneISO === yesterdayISO()) {
        setStreak(s => s + 1)
        setLastDoneISO(tISO)
      } else {
        setStreak(1)
        setLastDoneISO(tISO)
      }
    }
  }

  const handleDelete = (id) => {
    setTodos(prev => prev.filter(t => t.id !== id))
    toast.success("Todo deleted")
  }

  const handleAdd = () => {
    if (todo.trim() === "") {
      toast.error("Write something first")
      return
    }
    const newTodo = {
      id: uuidv4(),
      text: todo.trim(),
      isComplete: false,
      priority,
      dueDate: dueDate || null,
      createdAt: Date.now(),
      completedAt: null,
    }
    setTodos(prev => [newTodo, ...prev])
    setTodo("")
    setDueDate("")
    setPriority("medium")
    toast.success("Todo added")
  }

  const handleEdit = (id, text) => {
    setEditId(id)
    setEditText(text)
  }

  const handleSave = (id) => {
    const trimmed = editText.trim()
    if (!trimmed) return
    setTodos(prev => prev.map(t => (t.id === id ? { ...t, text: trimmed } : t)))
    setEditId(null)
    setEditText("")
    toast.success("Todo updated")
  }

  const handleEnter = (e) => {
    if (e.key === "Enter") handleAdd()
  }

  // DnD reorder
  const onDragEnd = (event) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = todos.findIndex(t => t.id === active.id)
    const newIndex = todos.findIndex(t => t.id === over.id)
    setTodos((items) => arrayMove(items, oldIndex, newIndex))
  }

  // --- derived ---
  const byQuery = (list) => {
    if (!query.trim()) return list
    const q = query.toLowerCase()
    return list.filter(t => t.text.toLowerCase().includes(q))
  }

  const filteredTodos = useMemo(() => {
    let list = todos
    if (filter === "active") list = list.filter(t => !t.isComplete)
    if (filter === "completed") list = list.filter(t => t.isComplete)
    return byQuery(list)
  }, [todos, filter, query])

  const completedCount = todos.filter(t => t.isComplete).length
  const progress = todos.length ? Math.round((completedCount / todos.length) * 100) : 0

  // weekly heat (last 7 days)
  const last7 = Array.from({ length: 7 }, (_, i) => startOfDayISO(Date.now() - i * 24 * 60 * 60 * 1000)).reverse()
  const completeByDay = last7.map(dayISO =>
    todos.some(t => t.completedAt && startOfDayISO(t.completedAt) === dayISO)
  )

  // suggestions
  const dueToday = todos.filter(t => t.dueDate === todayISO() && !t.isComplete).length
  const urgentHigh = todos.filter(t => t.priority === 'high' && !t.isComplete).length
  const suggestion =
    dueToday > 0 ? `You’ve got ${dueToday} due today — tackle those first.`
      : urgentHigh > 0 ? `Prioritize ${urgentHigh} high priority task${urgentHigh > 1 ? 's' : ''} next.`
        : progress < 100 && todos.length ? `Only ${todos.length - completedCount} left — you got this!`
          : "Add tasks to get rolling."

  // --- small helpers ---
  const priorityBadge = (p) => {
    const map = {
      high: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 border border-red-200/60 dark:border-red-800",
      medium: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800",
      low: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800",
    }
    return map[p] || map.medium
  }

  const accentCfg = ACCENTS[accent]

  return (
    <>
      <Navbar />
      <Toaster position="top-center" />

      <main className="container mx-auto px-4 my-6">
        {}
        <div className="rounded-2xl p-5 md:p-6 bg-white dark:bg-neutral-900 shadow-lg border border-violet-100/70 dark:border-neutral-800">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                Plan your day
              </h1>
              <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">{suggestion}</p>
            </div>

            {}
            <div className="flex items-center gap-5">
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800">
                <Flame className="w-4 h-4" />
                <span className="text-sm font-medium">{streak} day streak</span>
              </div>
              <div className="w-20 h-20">
                <CircularProgressbar
                  value={progress}
                  text={`${progress}%`}
                  styles={buildStyles({
                    pathColor: accentCfg.hex,
                    textColor: accentCfg.hex,
                    trailColor: accentCfg.trail,
                  })}
                />
              </div>
            </div>
          </div>

          {}
          <div className="mt-4 flex flex-col md:flex-row items-stretch md:items-center gap-3">
            <div className="inline-flex items-center gap-2">
              <span className="text-sm text-neutral-600 dark:text-neutral-400">Theme:</span>
              {Object.keys(ACCENTS).map(k => (
                <button
                  key={k}
                  onClick={() => setAccent(k)}
                  className={`h-6 w-6 rounded-full border ${accent === k ? 'ring-2 ring-offset-2 ring-[var(--accent)]' : ''}`}
                  style={{ background: ACCENTS[k].hex, borderColor: '#00000022' }}
                  title={k}
                />
              ))}
            </div>

            <div className="flex-1 relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search your tasks..."
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-slate-50 outline-none focus:ring-2"
                style={{ boxShadow: 'none' }}
              />
            </div>
          </div>

          {}
          <div className="mt-4 flex flex-col md:flex-row gap-3 md:items-end">
            <div className="flex-1">
              <label className="block text-sm text-neutral-600 dark:text-neutral-400 mb-1">Todo</label>
              <input
                onChange={(e) => setTodo(e.target.value)}
                onKeyDown={handleEnter}
                value={todo}
                type="text"
                className="w-full border border-violet-300/70 dark:border-neutral-700 rounded-xl px-3 py-2.5 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 outline-none focus:ring-2"
                style={{ '--tw-ring-color': 'var(--accent)' }}
                placeholder="e.g., Finish React assignment"
              />
            </div>

            <div className="grid grid-cols-2 md:flex gap-3">
              <div className="min-w-[140px]">
                <label className="block text-sm text-neutral-600 dark:text-neutral-400 mb-1">
                  <span className="inline-flex items-center gap-1"><Flag className="w-4 h-4" /> Priority</span>
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full border border-violet-300/70 dark:border-neutral-700 rounded-xl px-3 py-2.5 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 focus:ring-2"
                  style={{ '--tw-ring-color': 'var(--accent)' }}
                >
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>

              <div className="min-w-[170px]">
                <label className="block text-sm text-neutral-600 dark:text-neutral-400 mb-1">
                  <span className="inline-flex items-center gap-1"><CalendarDays className="w-4 h-4" /> Due date</span>
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full border border-violet-300/70 dark:border-neutral-700 rounded-xl px-3 py-2.5 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 focus:ring-2"
                  style={{ '--tw-ring-color': 'var(--accent)' }}
                />
              </div>
            </div>

            <button
              onClick={handleAdd}
              className="shrink-0 text-white font-semibold rounded-xl px-5 py-2.5 transition"
              style={{ background: 'var(--accent)' }}
            >
              Add
            </button>
          </div>

          {/* Filters + Weekly heat */}
          <div className="mt-5 flex flex-col md:flex-row md:items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-neutral-500 dark:text-neutral-400" />
              <div className="inline-flex rounded-xl overflow-hidden border border-neutral-200 dark:border-neutral-700">
                {["all", "active", "completed"].map(f => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-3 py-1.5 text-sm transition ${filter === f
                      ? "text-white"
                      : "bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                      }`}
                    style={filter === f ? { background: 'var(--accent)' } : {}}
                  >
                    {f[0].toUpperCase() + f.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Weekly heat (last 7 days) */}
            <div className="flex items-center gap-2">
              {completeByDay.map((done, i) => (
                <div key={i}
                  className="h-3 w-6 rounded-md"
                  style={{ background: done ? 'var(--accent)' : 'var(--accent-trail)' }}
                  title={last7[i]}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Todos */}
        <h2 className="text-lg font-semibold mt-8 mb-3 text-neutral-900 dark:text-neutral-100">
          Your todos
        </h2>

        <div className="space-y-3">
          {filteredTodos.length === 0 && (
            <div className="text-neutral-500 dark:text-neutral-400 text-sm px-1">Nothing here — try adding or clearing filters/search.</div>
          )}

          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext items={filteredTodos.map(t => t.id)} strategy={verticalListSortingStrategy}>
              <AnimatePresence initial={false}>
                {filteredTodos.map((t) => (
                  <SortableTodo key={t.id} t={t}>
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.98 }}
                      transition={{ duration: 0.18 }}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border bg-white dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800 px-3 py-3 cursor-grab active:cursor-grabbing"
                    >
                      <div className="flex items-start gap-3 flex-1">
                        <input
                          type="checkbox"
                          checked={t.isComplete}
                          onChange={() => handleToggle(t.id)}
                          className="mt-1 w-5 h-5"
                          style={{ accentColor: 'var(--accent)' }}
                          aria-label="Toggle complete"
                        />

                        <div className="flex-1">
                          {editId === t.id ? (
                            <input
                              type="text"
                              value={editText}
                              onChange={(e) => setEditText(e.target.value)}
                              className="w-full border border-neutral-300 dark:border-neutral-700 rounded-lg px-2 py-1.5 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 outline-none focus:ring-2"
                              style={{ '--tw-ring-color': 'var(--accent)' }}
                              autoFocus
                            />
                          ) : (
                            <p
                              className={`break-words text-[15px] ${t.isComplete ? "line-through text-neutral-400" : "text-neutral-900 dark:text-neutral-100"
                                }`}
                            >
                              {t.text}
                            </p>
                          )}

                          <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs">
                            <span className={`px-2 py-0.5 rounded-lg ${priorityBadge(t.priority)}`}>
                              {t.priority.charAt(0).toUpperCase() + t.priority.slice(1)}
                            </span>
                            {t.dueDate && (
                              <span className="px-2 py-0.5 rounded-lg border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300">
                                Due: {t.dueDate}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-auto">
                        {editId === t.id ? (
                          <button
                            onClick={() => handleSave(t.id)}
                            className="inline-flex items-center gap-1 text-white text-sm font-semibold px-3 py-1.5 rounded-lg transition"
                            style={{ background: '#059669' }}
                          >
                            <Save className="w-4 h-4" /> Save
                          </button>
                        ) : (
                          <button
                            onClick={() => handleEdit(t.id, t.text)}
                            className="inline-flex items-center gap-1 text-white text-sm font-semibold px-3 py-1.5 rounded-lg transition"
                            style={{ background: 'var(--accent)' }}
                          >
                            <Edit3 className="w-4 h-4" /> Edit
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(t.id)}
                          className="inline-flex items-center gap-1 text-white text-sm font-semibold px-3 py-1.5 rounded-lg transition"
                          style={{ background: '#dc2626' }}
                        >
                          <Trash2 className="w-4 h-4" /> Delete
                        </button>
                      </div>
                    </motion.div>
                  </SortableTodo>
                ))}
              </AnimatePresence>
            </SortableContext>
          </DndContext>
        </div>
      </main>
    </>
  )
}

export default App

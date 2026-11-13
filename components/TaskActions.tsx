'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type Task = {
  id: string
  title: string
  status: string
  priority: string
  due_date: string | null
  project_id?: string
}

export default function TaskActions({ task, projectId }: { task: Task, projectId?: string }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const updateStatus = async (newStatus: string) => {
    setLoading(true)
    await supabase
      .from('tasks')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', task.id)
    
    router.refresh()
    setLoading(false)
  }

  const deleteTask = async () => {
    if (!confirm('Bạn có chắc muốn xóa task này?')) return
    
    setLoading(true)
    await supabase.from('tasks').delete().eq('id', task.id)
    router.refresh()
    setLoading(false)
  }

  const pid = projectId || task.project_id

  return (
    <div className="flex items-center gap-2">
      <select
        value={task.status}
        onChange={(e) => updateStatus(e.target.value)}
        disabled={loading}
        className="text-xs border border-gray-300 rounded px-2 py-1"
      >
        <option value="todo">To Do</option>
        <option value="in_progress">In Progress</option>
        <option value="review">Review</option>
        <option value="done">Done</option>
      </select>

      {pid && (
        <Link
          href={`/projects/${pid}/tasks/${task.id}`}
          className="text-xs text-blue-600 hover:text-blue-800"
        >
          Sửa
        </Link>
      )}

      <button
        onClick={deleteTask}
        disabled={loading}
        className="text-xs text-red-600 hover:text-red-800"
      >
        Xóa
      </button>
    </div>
  )
}
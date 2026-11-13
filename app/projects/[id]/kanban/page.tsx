import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import TaskActions from '@/components/TaskActions'

const STATUSES = [
  { key: 'todo', label: 'To Do', color: 'bg-gray-100' },
  { key: 'in_progress', label: 'In Progress', color: 'bg-blue-100' },
  { key: 'review', label: 'Review', color: 'bg-yellow-100' },
  { key: 'done', label: 'Done', color: 'bg-green-100' },
]

export default async function KanbanPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: project } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .single()

  if (!project) {
    notFound()
  }

  const { data: tasks } = await supabase
    .from('tasks')
    .select('*')
    .eq('project_id', id)
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href={`/projects/${id}`} className="text-blue-600 hover:text-blue-800 text-sm">
              ← Danh sách
            </Link>
            <h1 className="text-xl font-bold text-gray-900">{project.name} - Kanban</h1>
          </div>
          <Link
            href={`/projects/${id}/tasks/new`}
            className="bg-blue-600 text-white px-3 py-1.5 rounded-md hover:bg-blue-700 text-sm"
          >
            + Thêm task
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {STATUSES.map((status) => {
            const columnTasks = tasks?.filter((t) => t.status === status.key) || []
            
            return (
              <div key={status.key} className="bg-gray-50 rounded-lg p-3">
                <div className={`font-semibold text-sm mb-3 px-2 py-1 rounded ${status.color}`}>
                  {status.label} ({columnTasks.length})
                </div>
                
                <div className="space-y-3">
                  {columnTasks.map((task) => (
                    <div key={task.id} className="bg-white rounded-lg shadow p-3">
                      <h3 className="font-medium text-sm text-gray-900 mb-1">
                        {task.title}
                      </h3>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-gray-500 capitalize">
                          {task.priority}
                        </span>
                        <TaskActions task={task} projectId={id} />
                      </div>
                    </div>
                  ))}
                  
                  {columnTasks.length === 0 && (
                    <div className="text-xs text-gray-400 text-center py-4">
                      Trống
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </main>
    </div>
  )
}
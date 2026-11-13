import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import TaskActions from '@/components/TaskActions'

export default async function ProjectPage({
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
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-blue-600 hover:text-blue-800 text-sm">
              ← Quay lại
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <p className="text-gray-600">{project.description || 'Không có mô tả'}</p>
        </div>

        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Danh sách công việc</h2>
          <div className="flex gap-2">
            <Link
              href={`/projects/${id}/members`}
              className="bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 text-sm font-medium"
            >
              Thành viên
            </Link>
            <Link
              href={`/projects/${id}/kanban`}
              className="bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 text-sm font-medium"
            >
              Kanban
            </Link>
            <Link
              href={`/projects/${id}/tasks/new`}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm font-medium"
            >
              + Thêm task
            </Link>
          </div>
        </div>

        {tasks && tasks.length > 0 ? (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tên task</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ưu tiên</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hạn</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hành động</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {tasks.map((task) => (
                  <tr key={task.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{task.title}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      <span className="px-2 py-1 text-xs rounded-full bg-gray-100">
                        {task.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{task.priority}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {task.due_date ? new Date(task.due_date).toLocaleDateString('vi-VN') : '—'}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <TaskActions task={task} projectId={id} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-500">Chưa có task nào trong dự án này.</p>
          </div>
        )}
      </main>
    </div>
  )
}
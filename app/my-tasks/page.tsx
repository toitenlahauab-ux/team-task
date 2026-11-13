import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function MyTasksPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Lấy thông tin profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // Chỉ lấy task được giao cho user hiện tại
  const { data: tasks } = await supabase
    .from('tasks')
    .select(`
      *,
      projects (
        id,
        name
      )
    `)
    .eq('assignee_id', user.id)
    .order('due_date', { ascending: true })

  // Hàm kiểm tra hạn
  const getDeadlineStatus = (dueDate: string | null, status: string) => {
    if (!dueDate || status === 'done') return null
    const due = new Date(dueDate)
    const now = new Date()
    const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

    if (diffDays < 0) return { text: `Quá hạn ${Math.abs(diffDays)} ngày`, color: 'text-red-600 bg-red-50' }
    if (diffDays === 0) return { text: 'Hết hạn hôm nay', color: 'text-red-600 bg-red-50' }
    if (diffDays <= 3) return { text: `Còn ${diffDays} ngày`, color: 'text-orange-600 bg-orange-50' }
    return { text: `Còn ${diffDays} ngày`, color: 'text-gray-600 bg-gray-50' }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-5xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-900">Việc được giao cho tôi</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              Xin chào, {profile?.full_name || user.email}
            </span>
            <Link href="/dashboard" className="text-sm text-blue-600 hover:underline">
              Dashboard
            </Link>
            <form action="/auth/signout" method="post">
              <button type="submit" className="text-sm text-red-600 hover:text-red-800">
                Đăng xuất
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {!tasks || tasks.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-10 text-center">
            <p className="text-gray-500 text-lg">Hiện tại bạn chưa được giao việc nào.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {tasks.map((task: any) => {
              const deadline = getDeadlineStatus(task.due_date, task.status)
              const isDone = task.status === 'done'

              return (
                <div
                  key={task.id}
                  className={`bg-white rounded-lg shadow p-5 border-l-4 ${
                    isDone ? 'border-green-500' : 'border-blue-500'
                  }`}
                >
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className={`font-semibold text-lg ${isDone ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                          {task.title}
                        </h3>
                        {isDone && (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                            Hoàn thành
                          </span>
                        )}
                      </div>

                      <p className="text-sm text-gray-500 mb-2">
                        Dự án: {task.projects?.name || 'Không rõ'}
                      </p>

                      {task.description && (
                        <p className="text-sm text-gray-600 mb-3">{task.description}</p>
                      )}

                      <div className="flex flex-wrap gap-2 items-center">
                        {deadline && (
                          <span className={`text-xs px-2 py-1 rounded ${deadline.color}`}>
                            {deadline.text}
                          </span>
                        )}
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded capitalize">
                          {task.priority}
                        </span>
                      </div>
                    </div>

                    {!isDone && (
                      <div className="flex flex-col gap-2">
                        <Link
                          href={`/my-tasks/${task.id}/report`}
                          className="bg-blue-600 text-white text-sm px-4 py-2 rounded-md hover:bg-blue-700 text-center"
                        >
                          Nộp báo cáo
                        </Link>
                      </div>
                    )}
                  </div>

                  {/* Hiển thị báo cáo nếu đã nộp */}
                  {task.report_link && (
                    <div className="mt-4 pt-3 border-t">
                      <p className="text-sm text-gray-500 mb-1">Báo cáo đã nộp:</p>
                      <a
                        href={task.report_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 text-sm hover:underline"
                      >
                        {task.report_link}
                      </a>
                      {task.report_note && (
                        <p className="text-sm text-gray-600 mt-1">{task.report_note}</p>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
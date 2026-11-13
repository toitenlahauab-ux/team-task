import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const { data: memberProjects } = await supabase
    .from('project_members')
    .select(`
      role,
      projects (
        id,
        name,
        description,
        created_at
      )
    `)
    .eq('user_id', user.id)

  const projects = memberProjects
    ?.map((item: any) => ({
      ...item.projects,
      role: item.role,
    }))
    .filter((p: any) => p.id) || []

  const projectIds = projects.map((p: any) => p.id)

  let tasks: any[] = []
  if (projectIds.length > 0) {
    const { data } = await supabase
      .from('tasks')
      .select('*')
      .in('project_id', projectIds)
    
    tasks = data || []
  }

  const totalTasks = tasks.length
  const todoTasks = tasks.filter(t => t.status === 'todo').length
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress').length
  const doneTasks = tasks.filter(t => t.status === 'done').length

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">
            Quản lý Công việc
          </h1>
          <div className="flex items-center gap-4">
            <Link href="/my-tasks" className="text-sm text-blue-600 hover:underline font-medium">
              Việc của tôi
            </Link>
            <span className="text-sm text-gray-600">
              Xin chào, {profile?.full_name || user.email}
            </span>
            <form action="/auth/signout" method="post">
              <button
                type="submit"
                className="text-sm text-red-600 hover:text-red-800"
              >
                Đăng xuất
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        
        {/* Thống kê */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <div className="text-2xl font-bold text-gray-900">{projects.length}</div>
            <div className="text-sm text-gray-500">Dự án</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <div className="text-2xl font-bold text-gray-900">{totalTasks}</div>
            <div className="text-sm text-gray-500">Tổng task</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{todoTasks}</div>
            <div className="text-sm text-gray-500">To Do</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">{inProgressTasks}</div>
            <div className="text-sm text-gray-500">Đang làm</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{doneTasks}</div>
            <div className="text-sm text-gray-500">Hoàn thành</div>
          </div>
        </div>

        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Dự án của bạn</h2>
          <Link
            href="/projects/new"
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm font-medium"
          >
            + Tạo dự án mới
          </Link>
        </div>

        {projects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project: any) => (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                className="bg-white rounded-lg shadow p-5 hover:shadow-md transition"
              >
                <div className="flex justify-between items-start">
                  <h3 className="font-semibold text-lg text-gray-900">
                    {project.name}
                  </h3>
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded capitalize">
                    {project.role}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                  {project.description || 'Không có mô tả'}
                </p>
              </Link>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-500 mb-4">Bạn chưa có dự án nào.</p>
            <Link
              href="/projects/new"
              className="inline-block bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm"
            >
              Tạo dự án đầu tiên
            </Link>
          </div>
        )}
      </main>
    </div>
  )
}
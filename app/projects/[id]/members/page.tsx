'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

type Member = {
  id: string
  role: string
  profiles: {
    full_name: string | null
    email: string | null
  }
}

export default function MembersPage() {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('member')
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  
  const router = useRouter()
  const params = useParams()
  const projectId = params.id as string
  const supabase = createClient()

  // Lấy danh sách thành viên
  const fetchMembers = async () => {
    const { data } = await supabase
      .from('project_members')
      .select(`
        id,
        role,
        profiles (
          full_name,
          email
        )
      `)
      .eq('project_id', projectId)

    if (data) {
      setMembers(data as any)
    }
  }

  useEffect(() => {
    fetchMembers()
  }, [projectId])

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    // Tìm user theo email trong bảng profiles
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .single()

    if (!profile) {
      setError('Không tìm thấy người dùng với email này. Họ cần đăng ký tài khoản trước.')
      setLoading(false)
      return
    }

    // Kiểm tra đã là thành viên chưa
    const { data: existing } = await supabase
      .from('project_members')
      .select('id')
      .eq('project_id', projectId)
      .eq('user_id', profile.id)
      .single()

    if (existing) {
      setError('Người này đã là thành viên của dự án.')
      setLoading(false)
      return
    }

    // Thêm vào project_members
    const { error: insertError } = await supabase
      .from('project_members')
      .insert({
        project_id: projectId,
        user_id: profile.id,
        role,
      })

    if (insertError) {
      setError(insertError.message)
    } else {
      setMessage('Đã thêm thành viên thành công!')
      setEmail('')
      fetchMembers()
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href={`/projects/${projectId}`} className="text-blue-600 text-sm">
            ← Quay lại dự án
          </Link>
          <h1 className="text-xl font-bold">Thành viên dự án</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Form mời */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4">Mời thành viên</h2>
          
          <form onSubmit={handleInvite} className="flex flex-col sm:flex-row gap-3">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email người muốn mời"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="member">Member</option>
              <option value="admin">Admin</option>
            </select>
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Đang mời...' : 'Mời'}
            </button>
          </form>

          {error && <p className="text-red-600 text-sm mt-3">{error}</p>}
          {message && <p className="text-green-600 text-sm mt-3">{message}</p>}
        </div>

        {/* Danh sách thành viên */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-semibold">Danh sách thành viên ({members.length})</h2>
          </div>
          <ul className="divide-y">
            {members.map((member) => (
              <li key={member.id} className="px-6 py-4 flex justify-between items-center">
                <div>
                  <p className="font-medium">{member.profiles?.full_name || 'Chưa có tên'}</p>
                  <p className="text-sm text-gray-500">{member.profiles?.email}</p>
                </div>
                <span className="text-xs bg-gray-100 px-2 py-1 rounded capitalize">
                  {member.role}
                </span>
              </li>
            ))}
            {members.length === 0 && (
              <li className="px-6 py-8 text-center text-gray-500">
                Chưa có thành viên nào.
              </li>
            )}
          </ul>
        </div>
      </main>
    </div>
  )
}
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

export default function SubmitReportPage() {
  const [file, setFile] = useState<File | null>(null)
  const [reportNote, setReportNote] = useState('')
  const [taskTitle, setTaskTitle] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [uploadProgress, setUploadProgress] = useState('')

  const router = useRouter()
  const params = useParams()
  const taskId = params.taskId as string
  const supabase = createClient()

  useEffect(() => {
    const fetchTask = async () => {
      const { data } = await supabase
        .from('tasks')
        .select('title')
        .eq('id', taskId)
        .single()
      if (data) setTaskTitle(data.title)
    }
    fetchTask()
  }, [taskId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setUploadProgress('')

    if (!file) {
      setError('Vui lòng chọn file báo cáo')
      setLoading(false)
      return
    }

    try {
      // Tạo tên file duy nhất
      const fileExt = file.name.split('.').pop()
      const fileName = `${taskId}-${Date.now()}.${fileExt}`
      const filePath = `${fileName}`

      setUploadProgress('Đang tải file lên...')

      // Upload file lên Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('reports')
        .upload(filePath, file)

      if (uploadError) {
        throw uploadError
      }

      // Lấy link công khai của file
      const { data: { publicUrl } } = supabase.storage
        .from('reports')
        .getPublicUrl(filePath)

      setUploadProgress('Đang lưu báo cáo...')

      // Cập nhật task
      const { error: updateError } = await supabase
        .from('tasks')
        .update({
          report_link: publicUrl,
          report_note: reportNote.trim() || null,
          report_submitted_at: new Date().toISOString(),
          status: 'done',
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', taskId)

      if (updateError) {
        throw updateError
      }

      setSuccess(true)
      setTimeout(() => {
        router.push('/my-tasks')
        router.refresh()
      }, 1500)

    } catch (err: any) {
      setError(err.message || 'Có lỗi xảy ra khi tải file')
      setLoading(false)
      setUploadProgress('')
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-xl shadow text-center max-w-sm">
          <div className="text-green-600 text-5xl mb-4">✓</div>
          <h2 className="text-xl font-bold mb-2">Nộp báo cáo thành công!</h2>
          <p className="text-gray-600">Công việc đã được đánh dấu hoàn thành.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12">
      <div className="max-w-md w-full bg-white rounded-xl shadow-md p-8">
        <Link href="/my-tasks" className="text-sm text-blue-600 hover:underline mb-4 inline-block">
          ← Quay lại
        </Link>

        <h1 className="text-2xl font-bold text-gray-900 mb-1">Nộp báo cáo</h1>
        <p className="text-gray-600 mb-6">{taskTitle}</p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Chọn file báo cáo *
            </label>
            <input
              type="file"
              required
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            {file && (
              <p className="text-xs text-gray-500 mt-1">
                Đã chọn: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ghi chú thêm (nếu có)
            </label>
            <textarea
              value={reportNote}
              onChange={(e) => setReportNote(e.target.value)}
              rows={3}
              placeholder="Mô tả ngắn về báo cáo..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {uploadProgress && (
            <p className="text-blue-600 text-sm">{uploadProgress}</p>
          )}

          {error && (
            <p className="text-red-600 text-sm">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 font-medium"
          >
            {loading ? 'Đang xử lý...' : 'Gửi báo cáo & Hoàn thành'}
          </button>
        </form>
      </div>
    </div>
  )
}
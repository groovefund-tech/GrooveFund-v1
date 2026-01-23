import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/router'
import Link from 'next/link'

interface AuditEntry {
  id: string
  action: string
  user_id: string
  target_user_id: string
  event_id: string
  details: any
  created_at: string
}

export default function AuditLog() {
  const [isAdmin, setIsAdmin] = useState(false)
  const [logs, setLogs] = useState<AuditEntry[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    checkAdminAndLoadLogs()
  }, [])

  const checkAdminAndLoadLogs = async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        router.push('/login')
        return
      }

      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .single()

      if (error || !data) {
        router.push('/dashboard')
        return
      }

      setIsAdmin(true)
      loadLogs()
    } catch (err) {
      console.error('checkAdmin crash:', err)
      router.push('/dashboard')
    }
  }

  const loadLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('audit_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100)

      if (!error) {
        setLogs(data || [])
      }
    } catch (err) {
      console.error('Failed to load logs:', err)
    } finally {
      setLoading(false)
    }
  }

  if (!isAdmin) return <div style={{ padding: 32 }}>Loading...</div>

  return (
    <div style={{ padding: 32, maxWidth: 1200 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <h1 style={{ margin: 0 }}>Audit Log</h1>
        <a href="/dashboard" style={{ 
          padding: '10px 16px',
          background: '#f0f0f0',
          border: '1px solid #ddd',
          borderRadius: 6,
          textDecoration: 'none',
          color: '#333',
          fontWeight: 500,
        }}>
          ← Back to Dashboard
        </a>
      </div>

      {loading ? (
        <p>Loading logs...</p>
      ) : logs.length === 0 ? (
        <p style={{ color: '#666' }}>No audit logs yet</p>
      ) : (
        <div style={{ border: '1px solid #ddd', borderRadius: 8, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ background: '#f5f5f5', borderBottom: '2px solid #ddd' }}>
              <tr>
                <th style={{ padding: 12, textAlign: 'left', fontWeight: 600 }}>Action</th>
                <th style={{ padding: 12, textAlign: 'left', fontWeight: 600 }}>User</th>
                <th style={{ padding: 12, textAlign: 'left', fontWeight: 600 }}>Time</th>
                <th style={{ padding: 12, textAlign: 'left', fontWeight: 600 }}>Details</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: 12, fontSize: 12 }}>
                    <strong>{log.action}</strong>
                  </td>
                  <td style={{ padding: 12, fontSize: 12, color: '#666' }}>
                    {log.user_id ? log.user_id.slice(0, 8) : '-'}
                  </td>
                  <td style={{ padding: 12, fontSize: 12, color: '#666' }}>
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                  <td style={{ padding: 12, fontSize: 12, color: '#666', fontFamily: 'monospace' }}>
                    {JSON.stringify(log.details || {})}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
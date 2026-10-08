'use client'

import * as React from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase/client'
import type { Database } from '@/lib/supabase/database.types'

type Profile = Database['public']['Tables']['profiles']['Row']

interface AuthState {
  /** true cho đến khi biết chắc có phiên đăng nhập hay không */
  loading: boolean
  session: Session | null
  user: User | null
  /** hồ sơ trong bảng profiles; null nếu chưa đăng nhập; role=null nghĩa là chờ duyệt */
  profile: Profile | null
  /** đang tải lại hồ sơ (vd. sau khi admin vừa gán vai trò) */
  refreshProfile: () => Promise<void>
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = React.createContext<AuthState | undefined>(undefined)

async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle()
  if (error) {
    console.error('Không tải được hồ sơ người dùng:', error.message)
    return null
  }
  return data
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = React.useState(true)
  const [session, setSession] = React.useState<Session | null>(null)
  const [profile, setProfile] = React.useState<Profile | null>(null)

  const loadProfile = React.useCallback(async (currentSession: Session | null) => {
    if (!currentSession) {
      setProfile(null)
      return
    }
    const p = await fetchProfile(currentSession.user.id)
    setProfile(p)
  }, [])

  React.useEffect(() => {
    let active = true

    supabase.auth.getSession().then(async ({ data }) => {
      if (!active) return
      setSession(data.session)
      await loadProfile(data.session)
      if (active) setLoading(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        if (!active) return
        setSession(newSession)
        await loadProfile(newSession)
        setLoading(false)
      }
    )

    return () => {
      active = false
      listener.subscription.unsubscribe()
    }
  }, [loadProfile])

  const refreshProfile = React.useCallback(async () => {
    await loadProfile(session)
  }, [session, loadProfile])

  const signInWithGoogle = React.useCallback(async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin + window.location.pathname },
    })
  }, [])

  const signOut = React.useCallback(async () => {
    await supabase.auth.signOut()
  }, [])

  const value: AuthState = {
    loading,
    session,
    user: session?.user ?? null,
    profile,
    refreshProfile,
    signInWithGoogle,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = React.useContext(AuthContext)
  if (!ctx) throw new Error('useAuth phải dùng bên trong AuthProvider')
  return ctx
}

export const ROLE_LABELS: Record<NonNullable<Profile['role']>, string> = {
  admin: 'Quản trị viên',
  brand_manager: 'Quản lý thương hiệu',
  store_manager: 'Quản lý cửa hàng',
  staff: 'Nhân viên',
}

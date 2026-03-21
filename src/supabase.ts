import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseKey)

export interface Property {
  id: string
  created_at: string
  name: string
  address: string | null
  description: string | null
  user_id: string
}

export interface Inspection {
  id: string
  created_at: string
  property_id: string
  type: 'entry' | 'exit'
  status: 'pending' | 'processing' | 'completed' | 'failed'
  user_id: string
  report_url: string | null
}
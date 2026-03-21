import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://nvsqrrqkogzacaenswcj.supabase.co'
const supabaseKey = 'sb_publishable_CzV2Fx5_Rqakmli1vz9dkg__6rmZG_A'

export const supabase = createClient(supabaseUrl, supabaseKey)

// Tipos das tabelas
export type Property = {
  id: string
  created_at: string
  name: string
  address: string | null
  description: string | null
  user_id: string
}

export type Inspection = {
  id: string
  created_at: string
  property_id: string
  type: 'entry' | 'exit'
  status: 'pending' | 'processing' | 'completed' | 'failed'
  user_id: string
  report_url: string | null
}
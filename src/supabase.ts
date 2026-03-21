import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://nvsqrrqkogzacaenswcj.supabase.co'
const supabaseKey = 'sb_publishable_CzV2Fx5_Rqakmli1vz9dkg__6rmZG_A'

export const supabase = createClient(supabaseUrl, supabaseKey)
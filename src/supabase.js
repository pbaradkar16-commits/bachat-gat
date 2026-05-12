import { createClient } from "@supabase/supabase-js"

const SUPABASE_URL = "https://yexkcfduahpembtfppsd.supabase.co"
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlleGtjZmR1YWhlbWJ0ZnBwc2QiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTc0NjgwMTkwNiwiZXhwIjoyMDYyMzc3OTA2fQ.D6MPk4FsPFisUnKwkgUOPM_UymAZxgEfEJe4jd0bgw"

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
export const FIXED_GROUP_ID = "a1e0e13a-595b-4a1b-99b6-a820cac734eb"

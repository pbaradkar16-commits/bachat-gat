import { createClient } from "@supabase/supabase-js";
const SUPABASE_URL = "https://yexkcfduahpembtfppsd.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlleGtjZmR1YWhwZW1idGZwcHNkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1ODQ5NTgsImV4cCI6MjA5NDE2MDk1OH0.nD6MPk4FsPFisUnKwkgU0PM_UymAZxgEfEJe4jd0bgw";
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
export const GROUP_ID = "a1e0e13a-595b-4a1b-99b6-a820cac734eb";

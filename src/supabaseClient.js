import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://gvfndsrdscafolbpbrxw.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd2Zm5kc3Jkc2NhZm9sYnBicnh3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA2MDkxMTgsImV4cCI6MjA5NjE4NTExOH0.6ZzquMAz6gmnJQK_iT39wnXUzTpSAOj6Q8PoVgfZR9A';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
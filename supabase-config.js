// Supabase Configuration for GigsCourt
const SUPABASE_URL = 'https://qifzdrkpxzosdturjpex.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_QfKJ4jT8u_2HuUKmW-xvbQ_9acJvZw-';

// Initialize Supabase client
const { createClient } = supabase;
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log('✅ Supabase client initialized');

import { createClient } from '@supabase/supabase-js';

export const supabaseUrl = 'https://whfjfmcrtmsejggcznun.supabase.co';
export const supabaseKey = 'sb_publishable_jta08DUUrahqbXlv5Q9YFg_JhJttQeH';

export const supabase = createClient(supabaseUrl, supabaseKey);

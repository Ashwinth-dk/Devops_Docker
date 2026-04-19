import pg from "pg";
import dotenv from "dotenv";

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://vfxtqrzpjsjenvdyauwt.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmeHRxcnpwanNqZW52ZHlhdXd0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg5NjQyODgsImV4cCI6MjA3NDU0MDI4OH0.EX916d6JYHjjVK3BWKHUya2C5iR5HsRpqwvOdTzVXuM';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export default supabase;

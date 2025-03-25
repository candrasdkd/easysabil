// supabaseClient.js
import 'react-native-url-polyfill/auto'
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import Config from "react-native-config";

// const SUPABASE_URL = "https://basietnwcoowzjhaftui.supabase.co";
// const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJhc2lldG53Y29vd3pqaGFmdHVpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE4ODMxNDQsImV4cCI6MjA1NzQ1OTE0NH0.2KG5udGi2FDJn3fHGx5XjjkixXFf95Aya35i6mvKpus";

const SUPABASE_URL = Config.SUPABASE_URL as string;
const SUPABASE_ANON_KEY = Config.SUPABASE_KEY as string;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ============================================================
// MILLENNIUM ERA — SUPABASE CONNECTION TESTER
// ============================================================

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '..', '.env');

console.log('🔍 Checking Supabase configuration...');

if (!fs.existsSync(envPath)) {
  console.error('❌ .env file not found at:', envPath);
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf-8');
const urlMatch = envContent.match(/VITE_SUPABASE_URL=(.+)/);
const keyMatch = envContent.match(/VITE_SUPABASE_ANON_KEY=(.+)/);

const url = urlMatch ? urlMatch[1].trim() : '';
const key = keyMatch ? keyMatch[1].trim() : '';

if (!url || url.includes('your-project') || url.includes('placeholder')) {
  console.log('⚠️ VITE_SUPABASE_URL is currently a placeholder.');
  console.log('👉 Please paste your real Supabase Project URL in .env');
  process.exit(0);
}

if (!key || key.includes('your-anon-key') || key.includes('placeholder')) {
  console.log('⚠️ VITE_SUPABASE_ANON_KEY is currently a placeholder.');
  console.log('👉 Please paste your real Supabase anon key in .env');
  process.exit(0);
}

console.log(`📡 Connecting to: ${url}`);

try {
  const res = await fetch(`${url}/rest/v1/categories?select=count`, {
    headers: {
      'apikey': key,
      'Authorization': `Bearer ${key}`
    }
  });

  if (res.status === 200) {
    console.log('🎉 SUCCESS! Connected to Supabase Cloud and verified database tables.');
  } else if (res.status === 404 || res.status === 400) {
    const text = await res.text();
    if (text.includes('Could not find the table')) {
      console.log('✅ Connection to Supabase Cloud is SUCCESSFUL and VALID!');
      console.log('📌 Status: Database is connected, awaiting SQL schema creation.');
      console.log('👉 Run COMPLETE_SETUP.sql in Supabase SQL Editor: https://supabase.com/dashboard/project/vcgkejjnkudffbthvpwx/sql/new');
    } else {
      console.log(`Response (${res.status}):`, text);
    }
  } else {
    console.error(`❌ Unexpected status: ${res.status}`, await res.text());
  }
} catch (err) {
  console.error('❌ Network error:', err.message);
}

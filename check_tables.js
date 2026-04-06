import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function check() {
  console.log('Checking equipe table...');
  const { data: equipeData, error: equipeError } = await supabase.from('equipe').select('*').limit(1);
  console.log('Equipe Data:', equipeData);
  console.log('Equipe Error:', equipeError);

  console.log('Checking chat_messages table...');
  const { data: chatData, error: chatError } = await supabase.from('chat_messages').select('*').limit(1);
  console.log('Chat Data:', chatData);
  console.log('Chat Error:', chatError);
}
check();

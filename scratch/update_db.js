
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function update() {
  await supabase.from('products').update({ images: ['/lehenga_l1.jpg'] }).eq('name', 'Crimson Velvet Bridal Lehenga Set');
  await supabase.from('products').update({ images: ['/salwar_ss1.jpg'] }).eq('name', 'Blush Pink Embroidered Salwar Suit');
  console.log('Done');
}
update();

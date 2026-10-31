/* Configuração única: usada pelo cardápio (index.html) e pelo painel (admin.html) */
const SUPABASE_URL = 'https://rnzjiqduzjxczotqjpjg.supabase.co';
const SUPABASE_KEY = 'sb_publishable_AoBcWlz-Uyx2ExFjGSy-Fg_Ai9hX8RK'; // chave pública (anon); nunca use a service_role aqui
const ZAP = '5586995532914'; // 55 + 86 + 99333-2914, conforme o número indicado na marca
const db = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

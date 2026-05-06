


const supabaseUrl = 'https://aipkazntzhzawtdgjnzx.supabase.co';
const supabaseKey = 'sb_publishable_cZH9WmtxDLVPNRKAClT4Bg_ZQKnkipr';


const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);


console.log("Успешное подключение к Supabase!", supabaseClient);
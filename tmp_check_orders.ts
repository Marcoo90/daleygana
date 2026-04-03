import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
    const { data, error } = await supabase.from('orders').select('*').limit(1);
    console.log("DATA:", JSON.stringify(data, null, 2));
    if (error) console.log("ERROR:", error);
}

main();

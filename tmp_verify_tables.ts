import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
    const { data, error } = await supabase.rpc('get_tables'); // If a custom rpc exists
    if (error) {
        // Fallback: try to query a few known tables
        const tables = ['participants', 'orders', 'payments', 'tickets', 'campaigns', 'campaign_registrations', 'products'];
        for (const t of tables) {
            const { error: tError } = await supabase.from(t).select('count').limit(1);
            console.log(`Table ${t}: ${tError ? 'ERROR: ' + tError.message : 'OK'}`);
        }
    } else {
        console.log("Tables:", data);
    }
}

main();

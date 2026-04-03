import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
    // raw query is not easily available with supabase-js unless using rpc, 
    // but we can just query the rest api.
    const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/orders?limit=1`;
    const res = await fetch(url, {
        headers: {
            'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY!,
            'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`
        }
    });
    const data = await res.json();
    console.log("REST response:", data);
}

main();

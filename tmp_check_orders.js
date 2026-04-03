const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

(async () => {
    try {
        const { data, error } = await supabase.from('orders').select('*').limit(1);
        console.log("SCHEMA OR DATA:", data);
        if (error) console.error("ERR:", error);
    } catch (e) {
        console.error(e);
    }
    process.exit(0);
})();

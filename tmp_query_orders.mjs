import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

(async () => {
    const { data } = await supabase.from('orders').select(`
      *,
      payments ( id, receipt_path, status, amount, created_at )
    `).limit(2);
    console.log("ORDERS WITH PAYMENTS: ", JSON.stringify(data, null, 2));
    process.exit(0);
})();

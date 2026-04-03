import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

(async () => {
    const { data } = await supabase.from('packs').select('*');
    console.log("ALL PACKS: ", JSON.stringify(data, null, 2));
    
    const orders = await supabase.from('orders').select('*').limit(2);
    console.log("SAMPLE ORDERS: ", JSON.stringify(orders.data, null, 2));

    const products = await supabase.from('products').select('*');
    console.log("ALL PRODUCTS: ", JSON.stringify(products.data, null, 2));
    
    process.exit(0);
})();

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const WA_TOKEN = Deno.env.get('WHATSAPP_API_TOKEN');
const WA_PHONE_ID = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID');

interface PostInsertPayload {
  type: 'INSERT';
  table: 'community_posts';
  record: {
    id: string;
    user_id: string;
    body: string;
    city_id: string | null;
    organization: string | null;
    channel_id: string | null;
    created_at: string;
  };
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  let payload: PostInsertPayload;
  try {
    payload = await req.json();
  } catch {
    return new Response('Bad request', { status: 400 });
  }

  if (payload.type !== 'INSERT' || payload.table !== 'community_posts') {
    return new Response('Ignored', { status: 200 });
  }

  if (!WA_TOKEN || !WA_PHONE_ID) {
    console.error('WhatsApp credentials not configured — set WHATSAPP_API_TOKEN and WHATSAPP_PHONE_NUMBER_ID');
    return new Response('WhatsApp not configured', { status: 200 });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  const { record } = payload;

  // Fetch the poster's display name
  const { data: poster } = await supabase
    .from('profiles')
    .select('display_name')
    .eq('id', record.user_id)
    .single();

  // Fetch the city name
  const { data: city } = record.city_id
    ? await supabase.from('cities').select('name').eq('id', record.city_id).single()
    : { data: null };

  // Find opted-in users whose city_ids array includes this city (or subscribed to all)
  const { data: subs } = await supabase
    .from('whatsapp_subscriptions')
    .select('phone_e164, user_id')
    .eq('active', true)
    .neq('user_id', record.user_id); // don't notify the poster themselves

  if (!subs || subs.length === 0) return new Response('No subscribers', { status: 200 });

  // Filter: subscribed to this city OR city_ids is empty (all cities)
  const targets = subs.filter((s) => {
    const sub = s as { phone_e164: string; user_id: string };
    return sub;
  });

  const senderName = poster?.display_name ?? 'Jemand';
  const cityLabel = city?.name ? ` (${city.name})` : '';
  const preview = record.body.length > 200 ? record.body.slice(0, 200) + '…' : record.body;
  const messageText = `*Wohnen Abroad${cityLabel}*\n${senderName}: ${preview}`;

  const results = await Promise.allSettled(
    targets.map(({ phone_e164 }) =>
      fetch(`https://graph.facebook.com/v19.0/${WA_PHONE_ID}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${WA_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: phone_e164,
          type: 'text',
          text: { preview_url: false, body: messageText },
        }),
      })
    )
  );

  const sent = results.filter((r) => r.status === 'fulfilled').length;
  console.log(`WhatsApp broadcast: ${sent}/${targets.length} sent`);

  return new Response(JSON.stringify({ sent, total: targets.length }), {
    headers: { 'Content-Type': 'application/json' },
  });
});

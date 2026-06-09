// Supabase Edge Function — community-to-whatsapp
// Triggered by a Supabase Database Webhook on community_posts INSERT.
// Sends the new post to a configured WhatsApp group via Green-API.
//
// Required env vars (set in Supabase Dashboard → Edge Functions → Secrets):
//   GREEN_API_INSTANCE_ID   — from app.green-api.com, e.g. "7103xxxxxx"
//   GREEN_API_TOKEN         — from app.green-api.com, e.g. "abc123..."
//   WHATSAPP_GROUP_ID       — WhatsApp group chat ID, e.g. "49123456789-1234567890@g.us"
//                             Get it: send a message in the group, then call
//                             https://api.green-api.com/waInstance{id}/getChats/{token}

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CITY_EMOJI: Record<string, string> = {
  paris: '🗼',
  london: '🎡',
};

Deno.serve(async (req: Request) => {
  // Supabase Database Webhooks send POST; ignore anything else
  if (req.method !== 'POST') {
    return new Response('method not allowed', { status: 405 });
  }

  try {
    const body = await req.json();
    const record = body?.record;

    if (!record?.id) {
      return new Response('invalid payload', { status: 400 });
    }

    // ── Fetch display name + city ──────────────────────────────────────────
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const [{ data: profile }, { data: city }] = await Promise.all([
      supabase.from('profiles').select('display_name').eq('id', record.user_id).single(),
      record.city_id
        ? supabase.from('cities').select('name, slug').eq('id', record.city_id).single()
        : Promise.resolve({ data: null }),
    ]);

    const name = profile?.display_name ?? 'Anonym';
    const citySlug = (city as { slug: string } | null)?.slug ?? '';
    const cityName = (city as { name: string } | null)?.name ?? '';
    const emoji = CITY_EMOJI[citySlug] ?? '🌍';
    const cityLine = cityName ? `${emoji} *${cityName}*  ` : '';

    // ── Format message ─────────────────────────────────────────────────────
    const message =
      `${cityLine}*${name}* auf wohnen-abroad.com:\n\n${record.body}`;

    // ── Green-API credentials ──────────────────────────────────────────────
    const instanceId = Deno.env.get('GREEN_API_INSTANCE_ID');
    const token = Deno.env.get('GREEN_API_TOKEN');
    const groupId = Deno.env.get('WHATSAPP_GROUP_ID');

    if (!instanceId || !token || !groupId) {
      console.warn('WhatsApp env vars not set — skipping delivery');
      return new Response('ok (not configured)', { status: 200 });
    }

    // ── Send via Green-API ─────────────────────────────────────────────────
    const url = `https://api.green-api.com/waInstance${instanceId}/sendMessage/${token}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chatId: groupId, message }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error('Green-API error:', res.status, err);
      return new Response(`upstream error: ${res.status}`, { status: 502 });
    }

    console.log(`Forwarded post ${record.id} to WhatsApp group`);
    return new Response('ok', { status: 200 });
  } catch (err) {
    console.error('Edge function error:', err);
    return new Response('internal error', { status: 500 });
  }
});

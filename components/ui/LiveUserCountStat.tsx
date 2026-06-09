'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function LiveUserCountStat() {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase.channel('online-users', {
      config: { presence: { key: Math.random().toString(36).slice(2) } },
    });

    try {
      channel
        .on('presence', { event: 'sync' }, () => {
          setCount(Object.keys(channel.presenceState()).length);
        })
        .subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            await channel.track({ online_at: new Date().toISOString() });
          }
        });
    } catch {
      // already subscribed — safe to ignore
    }

    return () => { supabase.removeChannel(channel); };
  }, []);

  return (
    <span className="inline-flex items-center gap-2 font-serif text-3xl font-semibold text-foreground">
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
      </span>
      {count ?? '—'}
    </span>
  );
}

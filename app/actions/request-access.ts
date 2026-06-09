'use server';

import { createClient } from '@/lib/supabase/server';

export async function requestAccess(_prev: unknown, formData: FormData) {
  const email = (formData.get('email') as string)?.trim().toLowerCase();
  const name = (formData.get('name') as string)?.trim();
  const organization = (formData.get('organization') as string)?.trim();
  const message = (formData.get('message') as string)?.trim();

  if (!email || !name || !organization) {
    return { error: 'Bitte alle Pflichtfelder ausfüllen.' };
  }

  const supabase = await createClient();
  const { error } = await supabase.from('access_requests').insert({
    email,
    name,
    organization,
    message: message || null,
  });

  if (error) return { error: 'Fehler beim Speichern. Bitte erneut versuchen.' };

  // Notify admin via Resend if configured
  const resendKey = process.env.RESEND_API_KEY;
  if (resendKey && resendKey !== 're_PLACEHOLDER') {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'noreply@wohnen-abroad.com',
        to: 'matthias-xaver.huber@hec.edu',
        subject: `Neuer Zugriffsantrag: ${name} (${organization})`,
        html: `<p><strong>${name}</strong> von <strong>${organization}</strong> möchte Zugang zu Wohnen Abroad.</p>
               <p>E-Mail: <a href="mailto:${email}">${email}</a></p>
               ${message ? `<p>Nachricht: ${message}</p>` : ''}
               <p><a href="https://supabase.com/dashboard/project/xnomcmyvdqlnmpdvvbka/editor?table=access_requests">Im Dashboard ansehen →</a></p>`,
      }),
    }).catch(() => {}); // non-critical — don't fail the request if email fails
  }

  return { success: true };
}

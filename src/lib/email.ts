// Sends transactional emails via the Resend API. The API key is stored as a
// Cloudflare Worker secret (RESEND_API_KEY), never in code — see wrangler.jsonc.
import { getCloudflareContext } from "@opennextjs/cloudflare";

export async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
  try {
    const { env } = getCloudflareContext();
    const apiKey = (env as unknown as { RESEND_API_KEY?: string }).RESEND_API_KEY;
    if (!apiKey) {
      console.error("RESEND_API_KEY is not configured; skipping email send.");
      return;
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "منصة التخزين <onboarding@resend.dev>",
        to: [to],
        subject,
        html,
      }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error("Resend API error:", res.status, text);
    }
  } catch (err) {
    // Email failures should never break the underlying business operation
    // (e.g. confirming a receiving order) — just log and move on.
    console.error("sendEmail failed:", err);
  }
}
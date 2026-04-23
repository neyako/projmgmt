// Meta Graph API — Fetch post insights
// Requires META_ACCESS_TOKEN (long-lived page token) in .env
export async function fetchMetaStats(postId: string) {
  const token = process.env.META_ACCESS_TOKEN;
  if (!token || token === "YOUR_META_LONG_LIVED_TOKEN") {
    console.warn("[Meta] No access token configured, skipping.");
    return null;
  }
  try {
    const res = await fetch(
      `https://graph.facebook.com/v19.0/${postId}/insights?metric=post_impressions,post_reactions_like_total,post_comments&access_token=${token}`
    );
    const data = await res.json();
    if (data.error) { console.error("[Meta] API error:", data.error); return null; }
    const getValue = (name: string) => data.data?.find((d: any) => d.name === name)?.values?.[0]?.value || 0;
    return {
      views: getValue("post_impressions"),
      likes: getValue("post_reactions_like_total"),
      comments: getValue("post_comments"),
    };
  } catch (err) {
    console.error("[Meta] Fetch error:", err);
    return null;
  }
}

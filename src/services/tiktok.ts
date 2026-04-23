// TikTok Stats — RapidAPI scraper format with manual fallback
// Requires TIKTOK_RAPIDAPI_KEY in .env
export async function fetchTikTokStats(videoUrl: string) {
  const apiKey = process.env.TIKTOK_RAPIDAPI_KEY;
  if (!apiKey || apiKey === "YOUR_RAPIDAPI_KEY") {
    console.warn("[TikTok] No RapidAPI key configured. Manual entry required.");
    return { error: true, message: "API key not configured", requiresManual: true };
  }
  try {
    const res = await fetch("https://tiktok-scraper7.p.rapidapi.com/video/info", {
      method: "GET",
      headers: {
        "X-RapidAPI-Key": apiKey,
        "X-RapidAPI-Host": "tiktok-scraper7.p.rapidapi.com",
      },
    });
    if (!res.ok) {
      return { error: true, message: `API returned ${res.status}`, requiresManual: true };
    }
    const data = await res.json();
    return {
      views: data.statistics?.playCount || 0,
      likes: data.statistics?.diggCount || 0,
      comments: data.statistics?.commentCount || 0,
      requiresManual: false,
    };
  } catch (err) {
    console.error("[TikTok] Fetch error:", err);
    return { error: true, message: String(err), requiresManual: true };
  }
}

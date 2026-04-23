// YouTube Data API v3 — Fetch video stats
// Requires YOUTUBE_API_KEY in .env
export async function fetchYouTubeStats(videoId: string) {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey || apiKey === "YOUR_YOUTUBE_API_KEY") {
    console.warn("[YouTube] No API key configured, skipping.");
    return null;
  }
  try {
    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${videoId}&key=${apiKey}`
    );
    const data = await res.json();
    const stats = data.items?.[0]?.statistics;
    if (!stats) return null;
    return {
      views: parseInt(stats.viewCount || "0"),
      likes: parseInt(stats.likeCount || "0"),
      comments: parseInt(stats.commentCount || "0"),
    };
  } catch (err) {
    console.error("[YouTube] Fetch error:", err);
    return null;
  }
}

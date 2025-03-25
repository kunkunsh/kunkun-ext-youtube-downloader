import { google } from "googleapis";
import { youtube_v3 } from "googleapis/build/src/apis/youtube/v3";

interface YouTubeComment {
  authorDisplayName: string;
  textDisplay: string;
  publishedAt: string;
  likeCount: number;
}

async function fetchYouTubeComments(
  videoId: string,
  apiKey: string
): Promise<YouTubeComment[]> {
  try {
    const youtube = google.youtube({
      version: "v3",
      auth: apiKey,
    });

    const comments: YouTubeComment[] = [];
    let nextPageToken: string | undefined = undefined;

    do {
      const response: youtube_v3.Schema$CommentThreadListResponse = (
        await youtube.commentThreads.list({
          part: ["snippet"],
          videoId: videoId,
          maxResults: 100,
          pageToken: nextPageToken,
        })
      ).data;

      const items = response.items || [];

      for (const item of items) {
        const comment = item.snippet?.topLevelComment?.snippet;
        if (comment) {
          comments.push({
            authorDisplayName: comment.authorDisplayName || "",
            textDisplay: comment.textDisplay || "",
            publishedAt: comment.publishedAt || "",
            likeCount: comment.likeCount || 0,
          });
        }
      }

      nextPageToken = response.nextPageToken || undefined;
    } while (nextPageToken);

    return comments;
  } catch (error) {
    console.error("Error fetching YouTube comments:", error);
    return [];
  }
}

function extractVideoId(url: string): string {
  const urlObj = new URL(url);
  if (urlObj.hostname === "youtu.be") {
    return urlObj.pathname.slice(1);
  }
  return urlObj.searchParams.get("v") || "";
}

// Example usage
const API_KEY = process.env.YOUTUBE_API_KEY!;
const videoUrl = "https://youtu.be/JN-nme9oF10";
const videoId = extractVideoId(videoUrl);

fetchYouTubeComments(videoId, API_KEY).then((comments) => {
  console.log("Total comments fetched:", comments.length);
  comments.forEach((comment) => {
    console.log(`
      Author: ${comment.authorDisplayName}
      Comment: ${comment.textDisplay}
      Published: ${comment.publishedAt}
      Likes: ${comment.likeCount}
    `);
  });
});

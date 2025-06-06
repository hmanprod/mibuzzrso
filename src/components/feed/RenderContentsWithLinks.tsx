import { ReactNode } from "react";

// Function to check if a URL is from a trusted domain
const isTrustedDomain = (url: string): boolean => {
  try {
    const hostname = new URL(url).hostname;

    // List of trusted domains
    const trustedDomains = [
      "youtube.com",
      "youtu.be",
      "www.youtube.com",
      "facebook.com",
      "www.facebook.com",
      "fb.com",
      "instagram.com",
      "www.instagram.com",
      "twitter.com",
      "www.twitter.com",
      "x.com",
      "tiktok.com",
      "www.tiktok.com",
      "linkedin.com",
      "www.linkedin.com",
      "spotify.com",
      "open.spotify.com",
      "soundcloud.com",
      "www.soundcloud.com",
      "apple.com",
      "music.apple.com",
      "deezer.com",
      "www.deezer.com",
    ];

    return trustedDomains.some((domain) => hostname.endsWith(domain));
  } catch (e) {
    console.error("Invalid URL format:", e);
    return false; // Invalid URL format
  }
};

// Function to render content with clickable links
export const renderContentWithLinks = (content: string): ReactNode[] => {
  if (!content) return [content];

  // Regular expression to find URLs
  const urlRegex = /(https?:\/\/[^\s]+)/g;

  // Create a temporary array to hold all matches
  const matches: { index: number; url: string }[] = [];
  let match;

  // Find all URL matches with their positions
  while ((match = urlRegex.exec(content)) !== null) {
    matches.push({
      index: match.index,
      url: match[0],
    });
  }

  // If no URLs found, return the content as is
  if (matches.length === 0) {
    return [content];
  }

  // Process the content with URLs
  const result: ReactNode[] = [];
  let lastIndex = 0;

  matches.forEach((match, i) => {
    // Add text before the URL
    if (match.index > lastIndex) {
      result.push(content.substring(lastIndex, match.index));
    }

    // Add the URL as a link or text based on trust
    if (isTrustedDomain(match.url)) {
      result.push(
        <a
          key={`link-${i}`}
          href={match.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline"
        >
          {match.url}
        </a>
      );
    } else {
      // For untrusted URLs, just show as text
      result.push(match.url);
    }

    // Update the last index to after this URL
    lastIndex = match.index + match.url.length;
  });

  // Add any remaining text after the last URL
  if (lastIndex < content.length) {
    result.push(content.substring(lastIndex));
  }

  return result;
};
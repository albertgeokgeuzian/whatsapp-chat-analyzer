import { parse, isValid } from "date-fns";

export interface ChatMessage {
  id: string;
  timestamp: Date;
  sender: string;
  content: string;
  hasAttachment: boolean;
  attachmentName?: string;
  attachmentType?: "image" | "video" | "audio" | "document" | "other";
}

export function parseChatLog(text: string): ChatMessage[] {
  const lines = text.split("\n");
  const messages: ChatMessage[] = [];

  // Regex to match: [22/08/2025, 7:40:49 PM] Sender: Message text
  // The timestamp might contain a narrow no-break space (\u202F) before AM/PM
  const messageRegex = /^\[(.*?)\] (.*?): (.*)$/;
  const attachmentRegex = /<attached: (.*?)>/;

  let currentMessage: ChatMessage | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const match = line.match(messageRegex);

    if (match) {
      // Clean up narrow no-break space replacing with normal space for parsing
      const dateString = match[1]
        .replace(/\u202F/g, " ")
        .replace(/\s+/g, " ")
        .trim();
      const sender = match[2];
      const content = match[3];

      // Parse Date
      // Example 1: "22/08/2025, 7:40:49 PM" -> "dd/MM/yyyy, h:mm:ss a"
      // Example 2: "8/22/25, 19:40:48" -> "M/d/yy, H:mm:ss"
      const formats = [
        "dd/MM/yyyy, h:mm:ss a",
        "M/d/yy, H:mm:ss",
        "M/d/yyyy, h:mm:ss a",
        "dd/MM/yyyy, H:mm:ss",
      ];

      let timestamp: Date | null = null;
      for (const fmt of formats) {
        const parsed = parse(dateString, fmt, new Date());
        if (isValid(parsed)) {
          timestamp = parsed;
          break;
        }
      }

      if (!timestamp) {
        // If date parsing fails, maybe it's completely different format,
        // fallback to just storing the raw string as timestamp or skip.
        // For this parser, we assume the format is somewhat consistent with the provided sample.
        console.warn("Invalid date format:", dateString);
        continue;
      }

      const attachmentMatch = content.match(attachmentRegex);
      let hasAttachment = false;
      let attachmentName;
      let attachmentType: ChatMessage["attachmentType"];

      if (attachmentMatch) {
        hasAttachment = true;
        attachmentName = attachmentMatch[1];

        const lowerName = attachmentName.toLowerCase();
        if (
          lowerName.includes(".jpg") ||
          lowerName.includes(".jpeg") ||
          lowerName.includes(".png") ||
          lowerName.includes(".gif") ||
          lowerName.includes(".webp")
        ) {
          attachmentType = "image";
        } else if (
          lowerName.includes(".mp4") ||
          lowerName.includes(".mov") ||
          lowerName.includes(".webm")
        ) {
          attachmentType = "video";
        } else if (
          lowerName.includes(".mp3") ||
          lowerName.includes(".wav") ||
          lowerName.includes(".ogg") ||
          lowerName.includes(".opus")
        ) {
          attachmentType = "audio";
        } else if (
          lowerName.includes(".pdf") ||
          lowerName.includes(".doc") ||
          lowerName.includes(".txt")
        ) {
          attachmentType = "document";
        } else {
          attachmentType = "other";
        }
      }

      currentMessage = {
        id: `msg-${i}`,
        timestamp,
        sender,
        content,
        hasAttachment,
        attachmentName,
        attachmentType,
      };
      messages.push(currentMessage);
    } else {
      // Multi-line message continuation
      if (currentMessage) {
        currentMessage.content += "\n" + line;
      }
    }
  }

  return messages;
}

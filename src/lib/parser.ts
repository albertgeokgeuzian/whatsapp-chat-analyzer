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

export function parseChatLog(
  text: string,
  excludeSystemMessages = false,
): ChatMessage[] {
  const lines = text.split("\n");
  const messages: ChatMessage[] = [];

  // Regex to match iOS format: [22/08/2025, 7:40:49 PM] Sender: Message text
  const iosRegex = /^\[(.*?)\] (.*?): (.*)$/;

  // Regex to match Android format: 8/10/23, 1:51 PM - Sender: Message text
  const androidRegex = /^([^\][]+?)\s+-\s+(.*?):\s+(.*)$/;

  // Regex to match Android system messages: 8/10/23, 1:51 PM - Messages and calls are end-to-end encrypted...
  const androidSystemRegex = /^([^\][]+?)\s+-\s+(.*)$/;

  const attachmentRegex = /<attached: (.*?)>/;

  let currentMessage: ChatMessage | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    let dateString = "";
    let sender = "";
    let content = "";
    let isNewMessage = false;

    const iosMatch = line.match(iosRegex);
    const androidMatch = line.match(androidRegex);

    if (iosMatch) {
      dateString = iosMatch[1];
      sender = iosMatch[2];
      content = iosMatch[3];
      isNewMessage = true;
    } else if (androidMatch) {
      dateString = androidMatch[1];
      sender = androidMatch[2];
      content = androidMatch[3];
      isNewMessage = true;
    } else {
      if (!excludeSystemMessages) {
        const systemMatch = line.match(androidSystemRegex);
        // Ensure the "date" portion actually starts like a date to prevent false positives on random hyphens
        if (systemMatch && /^\d{1,2}\/\d{1,2}\/\d{2,4}/.test(systemMatch[1])) {
          dateString = systemMatch[1];
          sender = "System"; // Fallback sender for system messages
          content = systemMatch[2];
          isNewMessage = true;
        }
      }
    }

    if (isNewMessage) {
      const cleanContent = content
        .replace(/[\u200E\u200F\u202A-\u202E]/g, "")
        .trim();
      if (
        cleanContent.toLowerCase() === "<media omitted>" ||
        /^(image|video|document|sticker|gif|audio|contact card) omitted$/i.test(
          cleanContent,
        )
      ) {
        currentMessage = null;
        continue;
      }

      // Clean up narrow no-break space replacing with normal space for parsing
      dateString = dateString
        .replace(/\u202F/g, " ")
        .replace(/\s+/g, " ")
        .trim();

      // Parse Date with extended formats
      const formats = [
        "dd/MM/yyyy, h:mm:ss a",
        "M/d/yy, H:mm:ss",
        "M/d/yyyy, h:mm:ss a",
        "dd/MM/yyyy, H:mm:ss",
        "M/d/yy, h:mm a", // Added for format: 8/10/23, 1:51 PM
        "M/d/yyyy, h:mm a", // Added for format: 8/10/2023, 1:51 PM
        "dd/MM/yyyy, h:mm a",
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

import type { ChatMessage } from "../lib/parser";
import { format } from "date-fns";
import { Paperclip, Image, Video, FileText, Music } from "lucide-react";

interface Props {
  message: ChatMessage;
  isFirstFromSender: boolean;
  colorClass: string;
  searchQuery?: string;
}

export function MessageBubble({
  message,
  isFirstFromSender,
  colorClass,
  searchQuery,
}: Props) {
  const timeStr = format(message.timestamp, "h:mm a");

  const getAttachmentIcon = () => {
    switch (message.attachmentType) {
      case "image":
        return <Image size={18} />;
      case "video":
        return <Video size={18} />;
      case "audio":
        return <Music size={18} />;
      case "document":
        return <FileText size={18} />;
      default:
        return <Paperclip size={18} />;
    }
  };

  const highlightText = (text: string) => {
    if (!searchQuery || !searchQuery.trim()) return text;

    const query = searchQuery.trim();
    const regex = new RegExp(`(${query})`, "gi");
    const parts = text.split(regex);

    return parts.map((part, index) =>
      regex.test(part) ? (
        <mark key={index} className="search-highlight">
          {part}
        </mark>
      ) : (
        part
      ),
    );
  };

  return (
    <div className={`message-wrapper ${isFirstFromSender ? "mt-3" : "mt-1"}`}>
      {isFirstFromSender && (
        <div className="message-sender-name">{message.sender}</div>
      )}
      <div className={`message-bubble ${colorClass}`}>
        <div className="message-content">
          {message.content.split("\n").map((line, i) => (
            <span key={i}>
              {highlightText(line)}
              <br />
            </span>
          ))}
        </div>

        {message.hasAttachment && (
          <div className="attachment-pill">
            {getAttachmentIcon()}
            <span
              className="attachment-name"
              title={message.attachmentName || "Attachment"}
            >
              {message.attachmentName || "Attachment"}
            </span>
          </div>
        )}

        <div className="message-time">{timeStr}</div>
      </div>
    </div>
  );
}

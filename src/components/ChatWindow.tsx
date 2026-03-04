import { useMemo, useRef, useEffect } from "react";
import type { ChatMessage } from "../lib/parser";
import { MessageBubble } from "./MessageBubble";
import { format, isSameDay } from "date-fns";

interface Props {
  messages: ChatMessage[];
  searchQuery?: string;
}

// Generate deterministic colors for senders
const SENDER_COLORS = [
  "bubble-blue",
  "bubble-pink",
  "bubble-green",
  "bubble-purple",
  "bubble-orange",
];

export function ChatWindow({ messages, searchQuery }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const senderColorMap = useMemo(() => {
    const map: Record<string, string> = {};
    let colorIndex = 0;
    messages.forEach((msg) => {
      if (!map[msg.sender]) {
        map[msg.sender] = SENDER_COLORS[colorIndex % SENDER_COLORS.length];
        colorIndex++;
      }
    });
    return map;
  }, [messages]);

  // Optionally auto-scroll to bottom, or keep at top
  useEffect(() => {
    if (scrollRef.current) {
      // scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="chat-window-container" ref={scrollRef}>
      <div className="chat-content">
        {messages.map((msg, index) => {
          const prevMsg = index > 0 ? messages[index - 1] : null;
          const isFirstFromSender =
            !prevMsg ||
            prevMsg.sender !== msg.sender ||
            msg.timestamp.getTime() - prevMsg.timestamp.getTime() >
              5 * 60 * 1000;

          const showDateDivider =
            !prevMsg || !isSameDay(prevMsg.timestamp, msg.timestamp);

          return (
            <div key={msg.id}>
              {showDateDivider && (
                <div className="date-divider">
                  <span>{format(msg.timestamp, "MMMM d, yyyy")}</span>
                </div>
              )}
              <div
                className={`message-row ${senderColorMap[msg.sender] === SENDER_COLORS[0] ? "row-right" : "row-left"}`}
              >
                <MessageBubble
                  message={msg}
                  isFirstFromSender={isFirstFromSender}
                  colorClass={senderColorMap[msg.sender]}
                  searchQuery={searchQuery}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

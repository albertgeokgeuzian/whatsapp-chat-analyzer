import { useState } from "react";
import type { ChangeEvent } from "react";
import { StatisticsBoard } from "./components/StatisticsBoard";
import { parseChatLog } from "./lib/parser";
import type { ChatMessage } from "./lib/parser";
import { computeStatistics } from "./lib/statistics";
import type { ChatStatistics } from "./lib/statistics";

function App() {
  const [messages, setMessages] = useState<ChatMessage[] | null>(null);
  const [stats, setStats] = useState<ChatStatistics | null>(null);

  const handleFileUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result;
      if (typeof text === "string") {
        const parsedMessages = parseChatLog(text);
        setMessages(parsedMessages);
        setStats(computeStatistics(parsedMessages));
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="app-container">
      {!messages ? (
        <div className="flex flex-col items-center justify-center h-full text-zinc-400 gap-4">
          <div className="text-xl font-medium text-white mb-2">
            Upload your WhatsApp Chat
          </div>
          <p className="max-w-md text-center mb-6 text-zinc-400">
            Export a chat from WhatsApp (without media) and upload the .txt file
            here to see your statistics. All processing is done locally in your
            browser.
          </p>
          <label className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors">
            Select Chat File
            <input
              type="file"
              accept=".txt"
              className="hidden"
              onChange={handleFileUpload}
            />
          </label>
        </div>
      ) : (
        <div className="animate-in app-main-view">
          <header className="top-nav flex justify-between items-center">
            <div>
              <h2>Chat Insights</h2>
              <p>{messages.length.toLocaleString()} messages analyzed</p>
            </div>
            <button
              onClick={() => {
                setMessages(null);
                setStats(null);
              }}
              className="px-4 py-2 text-sm bg-zinc-800 hover:bg-zinc-700 text-white rounded-md transition-colors"
            >
              Upload New Chat
            </button>
          </header>

          <div className="mt-6">
            {stats && <StatisticsBoard stats={stats} />}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;

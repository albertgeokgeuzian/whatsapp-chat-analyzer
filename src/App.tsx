import { useState, useRef, useEffect } from "react";
import type { ChangeEvent } from "react";
import { StatisticsBoard } from "./components/StatisticsBoard";
import type { ChatMessage } from "./lib/parser";
import type { ChatStatistics } from "./lib/statistics";
import { Loader2 } from "lucide-react";

function App() {
  const [messages, setMessages] = useState<ChatMessage[] | null>(null);
  const [stats, setStats] = useState<ChatStatistics | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [excludeSystem, setExcludeSystem] = useState(false);
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    workerRef.current = new Worker(
      new URL("./lib/worker.ts", import.meta.url),
      { type: "module" },
    );
    workerRef.current.onmessage = (e) => {
      const { type, messages, stats, error } = e.data;
      if (type === "success") {
        setMessages(messages);
        setStats(stats);
      } else {
        alert("Error processing file: " + error);
      }
      setIsProcessing(false);

      // Reset the file input so it can be uploaded again if needed
      const fileInput = document.getElementById(
        "chat-upload",
      ) as HTMLInputElement;
      if (fileInput) fileInput.value = "";
    };

    return () => {
      workerRef.current?.terminate();
    };
  }, []);

  const handleFileUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result;
      if (typeof text === "string" && workerRef.current) {
        workerRef.current.postMessage({
          text,
          excludeSystemMessages: excludeSystem,
        });
      } else {
        setIsProcessing(false);
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

          <label className="flex items-center gap-2 mb-4 text-zinc-300 cursor-pointer">
            <input
              type="checkbox"
              checked={excludeSystem}
              onChange={(e) => setExcludeSystem(e.target.checked)}
              className="w-4 h-4 rounded text-blue-600 focus:ring-blue-600 bg-zinc-800 border-zinc-700"
            />
            Exclude System Messages (e.g., encryption notices)
          </label>

          <label
            className={`cursor-pointer bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors ${isProcessing ? "opacity-50 cursor-not-allowed pointer-events-none" : ""}`}
          >
            {isProcessing ? (
              <span className="flex items-center gap-2">
                <Loader2 className="animate-spin" size={20} />
                Processing...
              </span>
            ) : (
              "Select Chat File"
            )}
            <input
              id="chat-upload"
              type="file"
              accept=".txt"
              className="hidden"
              onChange={handleFileUpload}
              disabled={isProcessing}
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

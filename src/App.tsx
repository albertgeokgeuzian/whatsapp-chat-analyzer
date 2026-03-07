import { useState, useRef, useEffect } from "react";
import type { ChangeEvent } from "react";
import { StatisticsBoard } from "./components/StatisticsBoard";
import type { ChatMessage } from "./lib/parser";
import type { ChatStatistics } from "./lib/statistics";
import { UploadCloud, Loader2, ShieldAlert } from "lucide-react";

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
        <div className="flex flex-col items-center justify-center min-h-[80vh] gap-8 animate-in">
          <div className="text-center max-w-2xl mx-auto space-y-4">
            <h1 className="text-5xl font-extrabold tracking-tight mb-4">
              Chat Insights
            </h1>
            <p className="text-lg text-zinc-400 leading-relaxed">
              Export your WhatsApp chat (without media) and drop the raw `.txt`
              file here. We'll instantly visualize your communication patterns.
              <br />
              <span className="text-emerald-400 font-medium opacity-90">
                All processing is 100% local in your browser.
              </span>
            </p>
          </div>

          <label
            htmlFor="chat-upload"
            className={`upload-box relative overflow-hidden ${isProcessing ? "opacity-70 pointer-events-none" : ""}`}
          >
            <div className="upload-icon">
              {isProcessing ? (
                <Loader2 className="w-full h-full animate-spin" />
              ) : (
                <UploadCloud className="w-full h-full" />
              )}
            </div>

            <div className="text-center z-10 space-y-2">
              <h3 className="text-xl font-semibold m-0">
                {isProcessing
                  ? "Analyzing Chat Log..."
                  : "Select or Drop Chat File"}
              </h3>
              <p className="text-zinc-400 text-sm">
                Supports standard WhatsApp `.txt` exports
              </p>
            </div>

            <button className="btn pointer-events-none z-10 mt-2" tabIndex={-1}>
              Browse Files
            </button>
            <input
              id="chat-upload"
              type="file"
              accept=".txt"
              className="hidden"
              onChange={handleFileUpload}
              disabled={isProcessing}
            />
          </label>

          <label className="flex items-center gap-3 text-sm text-zinc-300 cursor-pointer bg-zinc-900/50 backdrop-blur-md px-5 py-3 rounded-full border border-white/5 hover:border-white/10 transition-colors">
            <div
              className={`w-5 h-5 rounded-md flex items-center justify-center border transition-colors ${excludeSystem ? "bg-blue-500 border-blue-500" : "bg-zinc-800 border-zinc-600"}`}
            >
              {excludeSystem && (
                <svg
                  className="text-white shrink-0"
                  width={14}
                  height={14}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              )}
            </div>
            <input
              type="checkbox"
              checked={excludeSystem}
              onChange={(e) => setExcludeSystem(e.target.checked)}
              className="hidden"
            />
            <span className="flex items-center gap-2">
              <ShieldAlert size={16} className="text-zinc-400" />
              Exclude System Messages{" "}
              <span className="text-zinc-500 opacity-80">
                (e.g., encryption notices)
              </span>
            </span>
          </label>

          <div
            className="max-w-3xl mx-auto w-full mt-8 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700 opacity-0"
            style={{ animationFillMode: "forwards", animationDelay: "300ms" }}
          >
            <h3 className="text-xl font-semibold text-center text-zinc-300">
              How to export your chat
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left px-4 md:px-0">
              <div className="bg-zinc-900/50 p-6 rounded-2xl border border-white/5 hover:border-white/10 transition-colors shadow-lg">
                <h4 className="font-semibold text-zinc-200 mb-4 flex items-center gap-2 text-lg">
                  <span>🍎</span> iOS
                </h4>
                <ol className="text-sm text-zinc-400 list-decimal pl-5 space-y-3 marker:text-zinc-600">
                  <li>Go to the specific WhatsApp chat</li>
                  <li>
                    Click on the <strong>profile</strong> or group name at the
                    top
                  </li>
                  <li>
                    Scroll down and click <strong>Export Chat</strong>
                  </li>
                  <li>
                    Choose <strong>Without Media</strong>
                  </li>
                </ol>
              </div>
              <div className="bg-zinc-900/50 p-6 rounded-2xl border border-white/5 hover:border-white/10 transition-colors shadow-lg">
                <h4 className="font-semibold text-zinc-200 mb-4 flex items-center gap-2 text-lg">
                  <span>🤖</span> Android
                </h4>
                <ol className="text-sm text-zinc-400 list-decimal pl-5 space-y-3 marker:text-zinc-600">
                  <li>Go to the specific WhatsApp chat</li>
                  <li>
                    Click on the <strong>3 dots</strong> in the top right
                  </li>
                  <li>
                    Click on <strong>More</strong>
                  </li>
                  <li>
                    Click <strong>Export chat</strong> and select{" "}
                    <strong>Without media</strong>
                  </li>
                </ol>
              </div>
              <div className="md:col-span-2 bg-gradient-to-r from-blue-500/10 to-violet-500/10 p-5 rounded-2xl border border-blue-500/20 text-center shadow-lg px-4 mx-4 md:mx-0">
                <p className="text-sm text-blue-200/90 m-0">
                  <strong>💡 Next Step:</strong> Unzip the exported folder to
                  find the{" "}
                  <code className="bg-blue-500/20 px-1.5 py-0.5 rounded text-blue-100 font-mono">
                    .txt
                  </code>{" "}
                  file, then drop it in the box above!
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="animate-in app-main-view text-zinc-100">
          <header className="top-nav glass-panel p-2 mb-8 flex justify-between items-center z-10">
            <div className="space-y-1">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent m-0">
                Chat Insights
              </h2>
              <p className="text-zinc-400 text-sm m-0 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                {messages.length.toLocaleString()} messages parsed successfully
              </p>
            </div>
            <button
              onClick={() => {
                setMessages(null);
                setStats(null);
              }}
              className="btn btn-secondary h-10 px-5"
            >
              Analyze New Chat
            </button>
          </header>

          <div className="flex-1">
            {stats && <StatisticsBoard stats={stats} />}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;

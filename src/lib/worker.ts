import { parseChatLog } from "./parser";
import { computeStatistics } from "./statistics";

self.onmessage = (e: MessageEvent) => {
  const { text, excludeSystemMessages } = e.data;

  try {
    const messages = parseChatLog(text, excludeSystemMessages);
    const stats = computeStatistics(messages);

    self.postMessage({ type: "success", messages, stats });
  } catch (error) {
    self.postMessage({ type: "error", error: (error as Error).message });
  }
};

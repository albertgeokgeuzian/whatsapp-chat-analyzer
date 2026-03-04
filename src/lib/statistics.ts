import type { ChatMessage } from "./parser";
import {
  getHours,
  getDay,
  format,
  startOfYear,
  endOfYear,
  eachDayOfInterval,
} from "date-fns";

// Used for Linguistic Metrics
const STOP_WORDS = new Set([
  "the",
  "and",
  "a",
  "to",
  "of",
  "in",
  "i",
  "is",
  "that",
  "it",
  "on",
  "you",
  "this",
  "for",
  "but",
  "with",
  "are",
  "have",
  "be",
  "at",
  "or",
  "as",
  "was",
  "so",
  "if",
  "out",
  "not",
  "we",
  "my",
  "me",
  "do",
  "what",
  "just",
  "like",
]);

const PROFANITY_LIST = new Set([
  "fuck",
  "fucking",
  "shit",
  "bitch",
  "ass",
  "asshole",
  "damn",
  "crap",
  "bullshit",
  "motherfucker",
  "dick",
  "pussy",
]);

export interface ChatStatistics {
  totalMessages: number;
  sendersCount: Record<string, number>;
  charactersCount: Record<string, number>;
  activeHours: Record<number, number>;
  activeDaysOfWeek: Record<number, number>;
  messagesPerDay: Record<string, number>;
  topHour: number | null;
  topDay: number | null;
  topDate: string | null;
  totalAttachments: number;
  averageMessageLength: number;

  // Behavioral Metrics
  initiations: Record<string, number>;
  totalInitiations: number;
  avgResponseTime: Record<string, number>; // in ms
  medianResponseTime: Record<string, number>; // in ms
  doubleTextClusters: Record<string, number>;
  questionsCount: Record<string, number>;
  statementsCount: Record<string, number>;
  wordsCount: Record<string, number>;

  // Temporal & Rhythm Metrics
  top3Hours: { hour: number; count: number }[];
  primaryCommunicationStyle: string;
  firstWords: Record<string, number>;
  lastWords: Record<string, number>;
  totalDaysWithSleepGap: number;
  longestStreakDays: number;
  longestStreakStart: string | null;
  longestStreakEnd: string | null;
  longestSilenceDurationMinutes: number;
  longestSilenceStart: string | null;
  longestSilenceEnd: string | null;

  // Content & Linguistic Style Metrics
  topWordsPerSender: Record<string, { word: string; count: number }[]>;
  laughTrackPerSender: Record<string, Record<string, number>>;
  topEmojisPerSender: Record<string, { emoji: string; count: number }[]>;
  mediaSharedPerSender: Record<
    string,
    { photos: number; videos: number; audio: number; links: number }
  >;
  profanityScorePerSender: Record<string, number>;

  // Milestones & Extremes
  busiestDay: {
    date: string;
    totalMessages: number;
    split: Record<string, number>;
  } | null;
  longestMonologue: {
    sender: string;
    messageCount: number;
    wordCount: number;
    date: string;
  } | null;
  mostActiveMonth: { monthYear: string; totalMessages: number } | null;

  // Psychological & Relational Dynamics
  pronounShift: Record<
    string,
    {
      iCount: number;
      weCount: number;
      q1WePct: number;
      q4WePct: number;
      totalWePct: number;
      trend: "UP" | "DOWN" | "FLAT";
    }
  >;
  emotionalContagion: {
    token: string;
    originator: string;
    adopter: string;
    timeDeltaMs: number;
    timeDeltaStr: string;
  }[];
  sentimentArc: {
    baselinePos: number;
    baselineNeg: number;
    mostPositiveMonth: string | null;
    mostNegativeMonth: string | null;
  };
  vulnerabilitySpikes: Record<string, number>;

  // Deep-Dive Linguistic Quirks
  lexicalDiversity: Record<
    string,
    { uniqueWords: number; totalWords: number; percentage: number }
  >;
  punctuationPersonality: Record<
    string,
    { exclamationCount: number; ellipsisCount: number; questionCount: number }
  >;
  asteriskCorrections: Record<string, number>;
  capitalizationHabits: Record<
    string,
    {
      properCase: number;
      lowercase: number;
      allCaps: number;
      totalCategorized: number;
      properCasePct: number;
      lowercasePct: number;
      allCapsPct: number;
    }
  >;

  // Temporary trackers for linguistic metrics
  _tempWords?: Record<string, Record<string, number>>;
  _tempEmojis?: Record<string, Record<string, number>>;
  _tempUniqueWords?: Record<string, Set<string>>;

  // Conversational Roles & Flow
  topicKiller: Record<
    string,
    { count: number; phrases: Record<string, number> }
  >;
  theAnchor: Record<string, number>;
  ghostingThreshold: Record<
    string,
    { totalWaitTimeMs: number; checkInCount: number; averageWaitTimeMs: number }
  >;
}

export function computeStatistics(messages: ChatMessage[]): ChatStatistics {
  const stats: ChatStatistics = {
    totalMessages: messages.length,
    sendersCount: {},
    charactersCount: {},
    activeHours: {},
    activeDaysOfWeek: {},
    messagesPerDay: {},
    topHour: null,
    topDay: null,
    topDate: null,
    totalAttachments: 0,
    averageMessageLength: 0,

    initiations: {},
    totalInitiations: 0,
    avgResponseTime: {},
    medianResponseTime: {},
    doubleTextClusters: {},
    questionsCount: {},
    statementsCount: {},
    wordsCount: {},

    top3Hours: [],
    primaryCommunicationStyle: "",
    firstWords: {},
    lastWords: {},
    totalDaysWithSleepGap: 0,
    longestStreakDays: 0,
    longestStreakStart: null,
    longestStreakEnd: null,
    longestSilenceDurationMinutes: 0,
    longestSilenceStart: null,
    longestSilenceEnd: null,

    topWordsPerSender: {},
    laughTrackPerSender: {},
    topEmojisPerSender: {},
    mediaSharedPerSender: {},
    profanityScorePerSender: {},

    busiestDay: null,
    longestMonologue: null,
    mostActiveMonth: null,

    pronounShift: {},
    emotionalContagion: [],
    sentimentArc: {
      baselinePos: 0,
      baselineNeg: 0,
      mostPositiveMonth: null,
      mostNegativeMonth: null,
    },
    vulnerabilitySpikes: {},

    lexicalDiversity: {},
    punctuationPersonality: {},
    asteriskCorrections: {},
    capitalizationHabits: {},

    topicKiller: {},
    theAnchor: {},
    ghostingThreshold: {},
  };

  if (messages.length === 0) return stats;

  let minTime = Infinity;
  let maxTime = -Infinity;
  for (const m of messages) {
    const t = m.timestamp.getTime();
    if (t < minTime) minTime = t;
    if (t > maxTime) maxTime = t;
  }

  const minDate = new Date(minTime);
  const maxDate = new Date(maxTime);

  const allDays = eachDayOfInterval({
    start: startOfYear(minDate),
    end: endOfYear(maxDate),
  });

  allDays.forEach((day) => {
    stats.messagesPerDay[format(day, "yyyy-MM-dd")] = 0;
  });

  let totalContentLength = 0;

  // Temp storage for response times
  const responseTimes: Record<string, number[]> = {};
  let consecutiveMessages = 0;

  // For streaks and silences
  let currentStreak = 0;
  let streakStart: Date | null = null;
  const sortedDates = Array.from(
    new Set(messages.map((m) => format(m.timestamp, "yyyy-MM-dd"))),
  ).sort();

  // Calculate longest streak
  for (let i = 0; i < sortedDates.length; i++) {
    const d = new Date(sortedDates[i]);
    if (i === 0) {
      currentStreak = 1;
      streakStart = d;
    } else {
      const prevD = new Date(sortedDates[i - 1]);
      const diffDays = Math.round(
        (d.getTime() - prevD.getTime()) / (1000 * 3600 * 24),
      );

      if (diffDays === 1) {
        currentStreak++;
      } else {
        if (currentStreak > stats.longestStreakDays) {
          stats.longestStreakDays = currentStreak;
          stats.longestStreakStart = format(streakStart!, "MMMM d, yyyy");
          stats.longestStreakEnd = format(prevD, "MMMM d, yyyy");
        }
        currentStreak = 1;
        streakStart = d;
      }
    }
  }
  // Check final streak
  if (currentStreak > stats.longestStreakDays) {
    stats.longestStreakDays = currentStreak;
    stats.longestStreakStart = streakStart
      ? format(streakStart, "MMMM d, yyyy")
      : null;
    stats.longestStreakEnd = format(
      new Date(sortedDates[sortedDates.length - 1]),
      "MMMM d, yyyy",
    );
  }

  // Trackers for new milestones
  const messagesPerMonth: Record<string, number> = {};
  const messagesPerDayPerSender: Record<string, Record<string, number>> = {};

  let messagesSinceLastAnchor = 0;

  let currentMonologueSender: string | null = null;
  let currentMonologueCount = 0;
  let currentMonologueWords = 0;
  let currentMonologueDate: string | null = null;

  // Trackers for Psychological Metrics
  const I_WORDS = new Set(["i", "me", "my", "mine"]);
  const WE_WORDS = new Set(["we", "us", "our", "ours"]);
  const PHRASES = [
    "tf",
    "w er",
    "shu",
    "saraha",
    "khls",
    "laken",
    "yh",
    "yhh",
    "bitch",
    "dumbass",
    "bro",
    "bruh",
    "lmao",
    "lol",
    "ayri",
    "sketo",
    "heck",
    "damn",
  ];
  // Map token -> { user, timestamp }
  const firstUsed: Record<string, { user: string; timestamp: Date } | "BOTH"> =
    {};
  const contagionEvents: {
    token: string;
    originator: string;
    adopter: string;
    timeDeltaMs: number;
    timeDeltaStr: string;
    origDate: Date;
  }[] = [];

  const POS_WORDS = new Set([
    "good",
    "great",
    "happy",
    "love",
    "nice",
    "sweet",
    "cute",
    "amazing",
    "fun",
    "best",
    "yay",
    "perfect",
  ]);
  const NEG_WORDS = new Set([
    "bad",
    "sad",
    "hate",
    "stupid",
    "dumb",
    "mad",
    "angry",
    "crazy",
    "fuck",
    "shit",
    "annoying",
  ]);
  const monthlySentiment: Record<string, number[]> = {};
  let totalPosMessages = 0;
  let totalNegMessages = 0;

  const VULN_WORDS = new Set([
    "feel",
    "think",
    "worried",
    "hope",
    "afraid",
    "wish",
  ]);

  const userMessages: Record<string, ChatMessage[]> = {};

  messages.forEach((msg, index) => {
    const sender = msg.sender;
    const prevMsg = index > 0 ? messages[index - 1] : null;

    if (!userMessages[sender]) userMessages[sender] = [];
    userMessages[sender].push(msg);

    // Senders & Characters
    stats.sendersCount[sender] = (stats.sendersCount[sender] || 0) + 1;
    stats.charactersCount[sender] =
      (stats.charactersCount[sender] || 0) + msg.content.length;

    // Linguistic Metric Initialization per Sender
    if (!stats.topWordsPerSender[sender]) stats.topWordsPerSender[sender] = [];
    if (!stats.laughTrackPerSender[sender])
      stats.laughTrackPerSender[sender] = {};
    if (!stats.topEmojisPerSender[sender])
      stats.topEmojisPerSender[sender] = [];
    if (!stats.mediaSharedPerSender[sender])
      stats.mediaSharedPerSender[sender] = {
        photos: 0,
        videos: 0,
        audio: 0,
        links: 0,
      };
    if (!stats.profanityScorePerSender[sender])
      stats.profanityScorePerSender[sender] = 0;

    if (!stats.lexicalDiversity[sender]) {
      stats.lexicalDiversity[sender] = {
        uniqueWords: 0,
        totalWords: 0,
        percentage: 0,
      };
    }
    if (!stats._tempUniqueWords) stats._tempUniqueWords = {};
    if (!stats._tempUniqueWords[sender])
      stats._tempUniqueWords[sender] = new Set();

    if (!stats.punctuationPersonality[sender]) {
      stats.punctuationPersonality[sender] = {
        exclamationCount: 0,
        ellipsisCount: 0,
        questionCount: 0,
      };
    }
    if (!stats.asteriskCorrections[sender]) {
      stats.asteriskCorrections[sender] = 0;
    }
    if (!stats.capitalizationHabits[sender]) {
      stats.capitalizationHabits[sender] = {
        properCase: 0,
        lowercase: 0,
        allCaps: 0,
        totalCategorized: 0,
        properCasePct: 0,
        lowercasePct: 0,
        allCapsPct: 0,
      };
    }

    if (!stats.topicKiller[sender]) {
      stats.topicKiller[sender] = { count: 0, phrases: {} };
    }
    if (!stats.theAnchor[sender]) stats.theAnchor[sender] = 0;
    if (!stats.ghostingThreshold[sender]) {
      stats.ghostingThreshold[sender] = {
        totalWaitTimeMs: 0,
        checkInCount: 0,
        averageWaitTimeMs: 0,
      };
    }

    // 1. Lexical Diversity
    const validWords = msg.content.match(/\b[A-Za-z0-9']+\b/g) || [];
    validWords.forEach((w) => {
      const lw = w.toLowerCase();
      stats._tempUniqueWords![sender].add(lw);
      stats.lexicalDiversity[sender].totalWords++;
    });

    // 2. Punctuation Personality
    stats.punctuationPersonality[sender].exclamationCount += (
      msg.content.match(/!/g) || []
    ).length;
    stats.punctuationPersonality[sender].ellipsisCount += (
      msg.content.match(/\.\.\.|…/g) || []
    ).length;
    stats.punctuationPersonality[sender].questionCount += (
      msg.content.match(/\?/g) || []
    ).length;

    // 3. Asterisk Corrections
    if (prevMsg && prevMsg.sender === sender) {
      const t = msg.content.trim();
      if (
        /^\*[A-Za-z]+$/.test(t) ||
        /^[A-Za-z]+\*$/.test(t) ||
        t.startsWith("*")
      ) {
        stats.asteriskCorrections[sender]++;
      }
    }

    // 4. Capitalization Habits
    const hasUpper = /[A-Z]/.test(msg.content);
    const hasLower = /[a-z]/.test(msg.content);
    if (hasUpper || hasLower) {
      stats.capitalizationHabits[sender].totalCategorized++;
      if (hasUpper && !hasLower) {
        stats.capitalizationHabits[sender].allCaps++;
      } else if (hasLower && !hasUpper) {
        stats.capitalizationHabits[sender].lowercase++;
      } else if (hasUpper && hasLower && /^[A-Z]/.test(msg.content.trim())) {
        stats.capitalizationHabits[sender].properCase++;
      }
    }

    // Words count & Filtering for Top 10 Words + Profanity
    const words = msg.content
      .toLowerCase()
      .trim()
      .split(/\s+/)
      .filter((w) => w.length > 0);

    stats.wordsCount[sender] = (stats.wordsCount[sender] || 0) + words.length;

    words.forEach((word) => {
      // 1. Clean the word from punctuation to match stops and profanity accurately
      const cleanWord = word.replace(/[^\w\s]/g, "");

      if (cleanWord) {
        if (!STOP_WORDS.has(cleanWord)) {
          // Temporarily store word counts in a structure we will sort later
          if (!stats._tempWords) stats._tempWords = {};
          if (!stats._tempWords[sender]) stats._tempWords[sender] = {};
          stats._tempWords[sender][cleanWord] =
            (stats._tempWords[sender][cleanWord] || 0) + 1;
        }

        // Profanity Check
        if (PROFANITY_LIST.has(cleanWord)) {
          stats.profanityScorePerSender[sender] += 1;
        }
      }

      // Laugh Track
      if (cleanWord.includes("haha") || cleanWord.includes("ahah")) {
        stats.laughTrackPerSender[sender]["haha"] =
          (stats.laughTrackPerSender[sender]["haha"] || 0) + 1;
      }
      if (cleanWord.includes("lol")) {
        stats.laughTrackPerSender[sender]["lol"] =
          (stats.laughTrackPerSender[sender]["lol"] || 0) + 1;
      }
      if (cleanWord.includes("lmao") || cleanWord.includes("lmfao")) {
        stats.laughTrackPerSender[sender]["lmao"] =
          (stats.laughTrackPerSender[sender]["lmao"] || 0) + 1;
      }
      if (cleanWord.includes("hehe")) {
        stats.laughTrackPerSender[sender]["hehe"] =
          (stats.laughTrackPerSender[sender]["hehe"] || 0) + 1;
      }
    });

    // --- Psychological & Relational Dynamics ---
    let vulnWordsInMsg = 0;
    let posWordsInMsg = 0;
    let negWordsInMsg = 0;

    const lowerContent = msg.content.toLowerCase();
    const tokenWords = lowerContent.split(/\s+/).filter((w) => w.length > 0);
    const emjRegex = /[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu;
    const msgEmojis = Array.from(msg.content.matchAll(emjRegex)).map(
      (m) => m[0],
    );

    // Add phrases as tokens if present
    const tokensCountSet = new Set([...tokenWords, ...msgEmojis]);
    PHRASES.forEach((p) => {
      if (lowerContent.includes(p)) {
        tokensCountSet.add(p);
      }
    });

    tokensCountSet.forEach((t) => {
      // Vulnerability
      if (VULN_WORDS.has(t)) vulnWordsInMsg++;
      // Sentiment
      if (POS_WORDS.has(t)) posWordsInMsg++;
      if (NEG_WORDS.has(t)) negWordsInMsg++;

      // Emotional Contagion
      if (msgEmojis.includes(t) || PHRASES.includes(t)) {
        if (!firstUsed[t]) {
          firstUsed[t] = { user: sender, timestamp: msg.timestamp };
        } else if (firstUsed[t] !== "BOTH") {
          const orig = firstUsed[t] as { user: string; timestamp: Date };
          if (orig.user !== sender) {
            const timeDiffMs =
              msg.timestamp.getTime() - orig.timestamp.getTime();
            // Adopted!
            contagionEvents.push({
              token: t,
              originator: orig.user,
              adopter: sender,
              timeDeltaMs: timeDiffMs,
              timeDeltaStr: "", // Format later
              origDate: orig.timestamp,
            });
            firstUsed[t] = "BOTH";
          }
        }
      }
    });

    stats.vulnerabilitySpikes[sender] =
      (stats.vulnerabilitySpikes[sender] || 0) + vulnWordsInMsg;

    // Daily/Monthly Sentiment
    let sentimentScore = 0;
    if (posWordsInMsg > negWordsInMsg) {
      sentimentScore = 1;
      totalPosMessages++;
    } else if (negWordsInMsg > posWordsInMsg) {
      sentimentScore = -1;
      totalNegMessages++;
    }

    const monthKey = format(msg.timestamp, "yyyy-MM");
    if (!monthlySentiment[monthKey]) monthlySentiment[monthKey] = [];
    monthlySentiment[monthKey].push(sentimentScore);
    // -------------------------------------------

    // The Anchor
    messagesSinceLastAnchor++;
    const ANCHOR_WORDS = [
      "anyway",
      "back to",
      "so about",
      "anyways",
      "returning to",
    ];
    if (
      messagesSinceLastAnchor > 10 &&
      ANCHOR_WORDS.some((w) => lowerContent.includes(w))
    ) {
      stats.theAnchor[sender]++;
      messagesSinceLastAnchor = 0;
    }

    // Emojis (including Laugh Emojis)
    const emojiRegex = /[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu;
    let emojiMatch;
    while ((emojiMatch = emojiRegex.exec(msg.content)) !== null) {
      const emoji = emojiMatch[0];
      if (!stats._tempEmojis) stats._tempEmojis = {};
      if (!stats._tempEmojis[sender]) stats._tempEmojis[sender] = {};
      stats._tempEmojis[sender][emoji] =
        (stats._tempEmojis[sender][emoji] || 0) + 1;

      // Map laugh emojis to laugh track
      if (["😂", "💀", "😭", "🤣"].includes(emoji)) {
        stats.laughTrackPerSender[sender][emoji] =
          (stats.laughTrackPerSender[sender][emoji] || 0) + 1;
      }
    }

    // Media Shared (Links)
    if (msg.content.match(/https?:\/\/[^\s]+/g)) {
      const links = msg.content.match(/https?:\/\/[^\s]+/g)?.length || 0;
      stats.mediaSharedPerSender[sender].links += links;
    }

    // Media Shared (Attachments)
    if (msg.hasAttachment && msg.attachmentType) {
      stats.totalAttachments++;
      if (msg.attachmentType === "image")
        stats.mediaSharedPerSender[sender].photos++;
      if (msg.attachmentType === "video")
        stats.mediaSharedPerSender[sender].videos++;
      if (msg.attachmentType === "audio")
        stats.mediaSharedPerSender[sender].audio++;
    }

    // Questions vs Statements
    if (msg.content.includes("?")) {
      stats.questionsCount[sender] = (stats.questionsCount[sender] || 0) + 1;
    } else {
      stats.statementsCount[sender] = (stats.statementsCount[sender] || 0) + 1;
    }

    if (prevMsg) {
      const timeDiffMs = msg.timestamp.getTime() - prevMsg.timestamp.getTime();

      // Longest Silence (The Disconnect)
      if (timeDiffMs > stats.longestSilenceDurationMinutes * 60 * 1000) {
        stats.longestSilenceDurationMinutes = Math.floor(
          timeDiffMs / (60 * 1000),
        );
        stats.longestSilenceStart = format(
          prevMsg.timestamp,
          "MMM d, yyyy h:mm a",
        );
        stats.longestSilenceEnd = format(msg.timestamp, "MMM d, yyyy h:mm a");
      }

      // The Topic Killer
      if (timeDiffMs >= 14400000) {
        // 4 hours
        const prevContent = prevMsg.content.trim();
        const prevWords = prevContent.split(/\s+/).filter((w) => w.length > 0);
        if (prevWords.length > 0 && prevWords.length < 5) {
          const lowerPhrase = prevContent.toLowerCase();
          stats.topicKiller[prevMsg.sender].count++;
          stats.topicKiller[prevMsg.sender].phrases[lowerPhrase] =
            (stats.topicKiller[prevMsg.sender].phrases[lowerPhrase] || 0) + 1;
        }
      }

      // First and Last Word (The Sleep Bookends)
      // "sleep gap" = silence >= 6 hours (21600000 ms) starting between 10 PM and 4 AM
      if (timeDiffMs >= 21600000) {
        const prevHour = getHours(prevMsg.timestamp);
        if (prevHour >= 22 || prevHour < 4) {
          stats.lastWords[prevMsg.sender] =
            (stats.lastWords[prevMsg.sender] || 0) + 1;
          stats.firstWords[msg.sender] =
            (stats.firstWords[msg.sender] || 0) + 1;
          stats.totalDaysWithSleepGap++;
        }
      }

      // Initiations (8 hour gap = 8 * 60 * 60 * 1000 ms = 28800000 ms)
      if (timeDiffMs >= 28800000) {
        stats.initiations[sender] = (stats.initiations[sender] || 0) + 1;
        stats.totalInitiations++;
      }

      if (sender === prevMsg.sender) {
        consecutiveMessages++;
        if (consecutiveMessages === 2) {
          // This marks the start of a double-text cluster
          stats.doubleTextClusters[sender] =
            (stats.doubleTextClusters[sender] || 0) + 1;
        }

        // Ghosting Threshold
        if (timeDiffMs >= 3600000) {
          // 1 hour gap between own messages
          stats.ghostingThreshold[sender].checkInCount++;
          stats.ghostingThreshold[sender].totalWaitTimeMs += timeDiffMs;
        }
      } else {
        consecutiveMessages = 1;

        // Response Time (only when sender changes)
        if (!responseTimes[sender]) {
          responseTimes[sender] = [];
        }
        responseTimes[sender].push(timeDiffMs);
      }
    } else {
      consecutiveMessages = 1;
      // First message of the chat is an initiation
      stats.initiations[sender] = (stats.initiations[sender] || 0) + 1;
      stats.totalInitiations++;
    }

    // Hours
    const hour = getHours(msg.timestamp); // 0-23
    stats.activeHours[hour] = (stats.activeHours[hour] || 0) + 1;

    // Days
    const day = getDay(msg.timestamp); // 0 (Sunday) - 6 (Saturday)
    stats.activeDaysOfWeek[day] = (stats.activeDaysOfWeek[day] || 0) + 1;

    // Daily Frequency
    const dateStr = format(msg.timestamp, "yyyy-MM-dd");
    stats.messagesPerDay[dateStr] = (stats.messagesPerDay[dateStr] || 0) + 1;

    // Monthly Frequency
    const monthYear = format(msg.timestamp, "MMMM yyyy");
    messagesPerMonth[monthYear] = (messagesPerMonth[monthYear] || 0) + 1;

    // Daily split for Busiest Day
    if (!messagesPerDayPerSender[dateStr])
      messagesPerDayPerSender[dateStr] = {};
    messagesPerDayPerSender[dateStr][sender] =
      (messagesPerDayPerSender[dateStr][sender] || 0) + 1;

    // Monologue tracking
    if (currentMonologueSender === sender) {
      currentMonologueCount++;
      currentMonologueWords += words.length;
    } else {
      if (
        currentMonologueSender &&
        currentMonologueCount > (stats.longestMonologue?.messageCount || 0)
      ) {
        stats.longestMonologue = {
          sender: currentMonologueSender,
          messageCount: currentMonologueCount,
          wordCount: currentMonologueWords,
          date: currentMonologueDate!,
        };
      }
      currentMonologueSender = sender;
      currentMonologueCount = 1;
      currentMonologueWords = words.length;
      currentMonologueDate = format(msg.timestamp, "MMMM d, yyyy");
    }

    // Attachments
    if (msg.hasAttachment) {
      stats.totalAttachments++;
    }

    // Avg length (exclude attachment tags length if possible, or just raw)
    totalContentLength += msg.content.length;
  });

  // Calculate Median and Average Response Times
  Object.keys(responseTimes).forEach((sender) => {
    const times = responseTimes[sender].sort((a, b) => a - b);
    if (times.length > 0) {
      stats.avgResponseTime[sender] =
        times.reduce((a, b) => a + b, 0) / times.length;

      const mid = Math.floor(times.length / 2);
      stats.medianResponseTime[sender] =
        times.length % 2 !== 0 ? times[mid] : (times[mid - 1] + times[mid]) / 2;
    } else {
      stats.avgResponseTime[sender] = 0;
      stats.medianResponseTime[sender] = 0;
    }
  });

  Object.keys(stats.ghostingThreshold).forEach((sender) => {
    const data = stats.ghostingThreshold[sender];
    if (data.checkInCount > 0) {
      data.averageWaitTimeMs = data.totalWaitTimeMs / data.checkInCount;
    }
  });

  // --- Finalize Psychological Metrics ---

  // 1. Pronoun Shift
  Object.keys(userMessages).forEach((user) => {
    const msgs = userMessages[user];
    const qLen = Math.floor(msgs.length / 4);
    if (qLen === 0) return;

    const getWordCounts = (cm: ChatMessage[]) => {
      let iC = 0,
        weC = 0;
      cm.forEach((m) => {
        const tw = m.content
          .toLowerCase()
          .split(/\s+/)
          .filter((w) => w.length > 0);
        tw.forEach((w) => {
          if (I_WORDS.has(w)) iC++;
          if (WE_WORDS.has(w)) weC++;
        });
      });
      return { iC, weC };
    };

    const q1Msgs = msgs.slice(0, qLen);
    const q4Msgs = msgs.slice(-qLen);
    const totalC = getWordCounts(msgs);
    const q1C = getWordCounts(q1Msgs);
    const q4C = getWordCounts(q4Msgs);

    const q1WePct = (q1C.weC / (q1C.iC + q1C.weC + 0.0001)) * 100;
    const q4WePct = (q4C.weC / (q4C.iC + q4C.weC + 0.0001)) * 100;
    const totalWePct = (totalC.weC / (totalC.iC + totalC.weC + 0.0001)) * 100;

    stats.pronounShift[user] = {
      iCount: totalC.iC,
      weCount: totalC.weC,
      q1WePct,
      q4WePct,
      totalWePct,
      trend: q4WePct > q1WePct ? "UP" : q4WePct < q1WePct ? "DOWN" : "FLAT",
    };
  });

  // 2. Emotional Contagion
  const sortedContagions = contagionEvents
    .sort((a, b) => a.timeDeltaMs - b.timeDeltaMs)
    .slice(0, 3);
  stats.emotionalContagion = sortedContagions.map((c) => {
    // Format ms to days/hours/mins
    const totalMins = Math.floor(c.timeDeltaMs / (1000 * 60));
    const days = Math.floor(totalMins / (24 * 60));
    const hours = Math.floor((totalMins % (24 * 60)) / 60);
    const mins = totalMins % 60;
    let timeStr = "";
    if (days > 0) timeStr += `${days}d `;
    if (hours > 0) timeStr += `${hours}h `;
    if (mins > 0 || timeStr === "") timeStr += `${mins}m`;

    return { ...c, timeDeltaStr: timeStr.trim() };
  });

  // 3. Sentiment Arc
  stats.sentimentArc.baselinePos =
    (totalPosMessages / (totalPosMessages + totalNegMessages + 0.0001)) * 100;
  stats.sentimentArc.baselineNeg =
    (totalNegMessages / (totalPosMessages + totalNegMessages + 0.0001)) * 100;

  let bestMonth = null;
  let worstMonth = null;
  let maxScore = -Infinity;
  let minScore = Infinity;

  Object.keys(monthlySentiment).forEach((monthKey) => {
    const scores = monthlySentiment[monthKey];
    if (scores.length > 50) {
      const ps = scores.filter((s) => s > 0).length;
      const ns = scores.filter((s) => s < 0).length;
      const avg = (ps - ns) / (ps + ns + 0.0001);
      if (avg > maxScore) {
        maxScore = avg;
        bestMonth = monthKey;
      }
      if (avg < minScore) {
        minScore = avg;
        worstMonth = monthKey;
      }
    }
  });
  stats.sentimentArc.mostPositiveMonth = bestMonth;
  stats.sentimentArc.mostNegativeMonth = worstMonth;
  // -----------------------------------------

  let topHour = -1;
  const hourEntries = Object.entries(stats.activeHours).map(([h, c]) => ({
    hour: parseInt(h, 10),
    count: c,
  }));
  hourEntries.sort((a, b) => b.count - a.count);

  stats.top3Hours = hourEntries.slice(0, 3);
  if (stats.top3Hours.length > 0) {
    topHour = stats.top3Hours[0].hour;
  }

  let maxDayCount = -1;
  let topDay = -1;
  Object.entries(stats.activeDaysOfWeek).forEach(([dayStr, count]) => {
    if (count > maxDayCount) {
      maxDayCount = count;
      topDay = parseInt(dayStr, 10);
    }
  });

  let maxDateCount = -1;
  let topDate: string | null = null;
  Object.entries(stats.messagesPerDay).forEach(([dateStr, count]) => {
    if (count > maxDateCount) {
      maxDateCount = count;
      topDate = dateStr;
    }
  });

  // Finalize Longest Monologue
  if (
    currentMonologueSender &&
    currentMonologueCount > (stats.longestMonologue?.messageCount || 0)
  ) {
    stats.longestMonologue = {
      sender: currentMonologueSender,
      messageCount: currentMonologueCount,
      wordCount: currentMonologueWords,
      date: currentMonologueDate!,
    };
  }

  // Finalize Most Active Month
  let maxMonthCount = -1;
  Object.entries(messagesPerMonth).forEach(([my, count]) => {
    if (count > maxMonthCount) {
      maxMonthCount = count;
      stats.mostActiveMonth = { monthYear: my, totalMessages: count };
    }
  });

  // Finalize Busiest Day
  if (topDate) {
    const split = messagesPerDayPerSender[topDate] || {};
    const splitPercentages: Record<string, number> = {};
    Object.entries(split).forEach(([s, count]) => {
      splitPercentages[s] = Math.round((count / maxDateCount) * 100);
    });

    stats.busiestDay = {
      date: format(new Date(topDate), "MMMM d, yyyy"),
      totalMessages: maxDateCount,
      split: splitPercentages,
    };
  }

  // Post-process Linguistic Metrics to top formats
  Object.keys(stats.sendersCount).forEach((sender) => {
    // Process Top Words
    if ((stats as any)._tempWords?.[sender]) {
      const sortedWords = Object.entries(
        (stats as any)._tempWords[sender] as Record<string, number>,
      )
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([word, count]) => ({ word, count }));
      stats.topWordsPerSender[sender] = sortedWords;
    } else {
      stats.topWordsPerSender[sender] = [];
    }

    // Process Top Emojis
    if ((stats as any)._tempEmojis?.[sender]) {
      const sortedEmojis = Object.entries(
        (stats as any)._tempEmojis[sender] as Record<string, number>,
      )
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([emoji, count]) => ({ emoji, count }));
      stats.topEmojisPerSender[sender] = sortedEmojis;
    } else {
      stats.topEmojisPerSender[sender] = [];
    }
  });

  Object.keys(stats.lexicalDiversity).forEach((sender) => {
    const data = stats.lexicalDiversity[sender];
    if (stats._tempUniqueWords && stats._tempUniqueWords[sender]) {
      data.uniqueWords = stats._tempUniqueWords[sender].size;
    }
    data.percentage =
      data.totalWords > 0 ? (data.uniqueWords / data.totalWords) * 100 : 0;
  });

  Object.keys(stats.capitalizationHabits).forEach((sender) => {
    const data = stats.capitalizationHabits[sender];
    if (data.totalCategorized > 0) {
      data.properCasePct = (data.properCase / data.totalCategorized) * 100;
      data.lowercasePct = (data.lowercase / data.totalCategorized) * 100;
      data.allCapsPct = (data.allCaps / data.totalCategorized) * 100;
    }
  });

  // Clean up temp keys
  delete (stats as any)._tempWords;
  delete (stats as any)._tempEmojis;
  delete (stats as any)._tempUniqueWords;

  stats.topHour = topHour;
  stats.topDay = topDay;
  stats.topDate = topDate;
  stats.averageMessageLength = Math.round(totalContentLength / messages.length);

  // Determine Primary Communication Style based on top hours or days
  // E.g. "Workday Chatters", "Late-Night Texters", "Weekend Catch-ups", "Evening Decompressors"
  if (topDay === 0 || topDay === 6) {
    stats.primaryCommunicationStyle = "Weekend Catch-ups";
  } else if (topHour >= 22 || topHour < 4) {
    stats.primaryCommunicationStyle = "Late-Night Texters";
  } else if (topHour >= 17 && topHour <= 21) {
    stats.primaryCommunicationStyle = "Evening Decompressors";
  } else if (topHour >= 9 && topHour <= 16) {
    stats.primaryCommunicationStyle = "Workday Chatters";
  } else {
    stats.primaryCommunicationStyle = "All-Day Connectors";
  }

  return stats;
}

// Helper to format hour (0-23) to 12h format
export function formatHour(hour: number): string {
  const d = new Date();
  d.setHours(hour, 0, 0, 0);
  return format(d, "h a"); // e.g., '1 PM'
}

// Helper to format day of week (0-6)
export function formatDay(day: number): string {
  const days = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  return days[day];
}

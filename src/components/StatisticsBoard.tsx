import { InfoTooltip } from "./InfoTooltip";
import { useMemo } from "react";
import type { ChatStatistics } from "../lib/statistics";
import { formatDay, formatHour } from "../lib/statistics";
import { format } from "date-fns";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  AreaChart,
  Area,
  Brush,
} from "recharts";
import {
  Users,
  Clock,
  Calendar,
  Paperclip,
  MessageSquare,
  CalendarDays,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";

interface Props {
  stats: ChatStatistics;
}

function formatDuration(ms: number) {
  if (!ms) return "0s";
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const remainingMins = minutes % 60;
  if (hours < 24) return `${hours}h ${remainingMins}m`;
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  return `${days}d ${remainingHours}h`;
}

export function StatisticsBoard({ stats }: Props) {
  // Format data for Recharts
  const { hourlyData, topSenders, topCharacters, dailyData } = useMemo(() => {
    const hData = Object.entries(stats.activeHours)
      .sort((a, b) => parseInt(a[0]) - parseInt(b[0]))
      .map(([hour, count]) => ({
        name: formatHour(parseInt(hour)),
        count,
      }));

    const sData = Object.entries(stats.sendersCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5); // top 5

    const cData = Object.entries(stats.charactersCount || {})
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5); // top 5

    const dData = Object.entries(stats.messagesPerDay)
      .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
      .map(([dateStr, count]) => ({
        name: format(new Date(dateStr), "MMM d, yy"),
        count,
      }));

    return {
      hourlyData: hData,
      topSenders: sData,
      topCharacters: cData,
      dailyData: dData,
    };
  }, [stats]);

  return (
    <div className="stats-board-container">
      <div className="stats-header">
        <h3>Overview</h3>
      </div>

      <div className="stats-cards">
        <div className="stat-card">
          <div className="stat-icon">
            <MessageSquare size={20} />
          </div>
          <div className="stat-info">
            <span className="stat-label">
              Total Messages{" "}
              <InfoTooltip text="The total number of messages sent in the chat." />
            </span>
            <span className="stat-value">
              {stats.totalMessages.toLocaleString()}
            </span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <Users size={20} />
          </div>
          <div className="stat-info">
            <span className="stat-label">
              Participants{" "}
              <InfoTooltip text="The total number of unique users who have sent at least one message." />
            </span>
            <span className="stat-value">
              {Object.keys(stats.sendersCount).length}
            </span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <Paperclip size={20} />
          </div>
          <div className="stat-info">
            <span className="stat-label">
              Media Shared{" "}
              <InfoTooltip text="The total number of media attachments (images, videos, audio, etc.) and links shared." />
            </span>
            <span className="stat-value">
              {stats.totalAttachments.toLocaleString()}
            </span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <Clock size={20} />
          </div>
          <div className="stat-info">
            <span className="stat-label">
              Most Active Hour{" "}
              <InfoTooltip text="The single hour of the day (0-23) with the highest total message volume." />
            </span>
            <span className="stat-value">
              {stats.topHour !== null ? formatHour(stats.topHour) : "-"}
            </span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <Calendar size={20} />
          </div>
          <div className="stat-info">
            <span className="stat-label">
              Most Active Day{" "}
              <InfoTooltip text="The day of the week with the most messages sent overall." />
            </span>
            <span className="stat-value">
              {stats.topDay !== null ? formatDay(stats.topDay) : "-"}
            </span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <CalendarDays size={20} />
          </div>
          <div className="stat-info">
            <span className="stat-label">
              Most Active Date{" "}
              <InfoTooltip text="The specific calendar date with the highest volume of messages." />
            </span>
            <span className="stat-value">
              {stats.topDate
                ? format(new Date(stats.topDate), "MMM d, yyyy")
                : "-"}
            </span>
          </div>
        </div>
      </div>

      <div className="stats-header">
        <h3>Conversational Roles & Flow</h3>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: "1rem",
        }}
      >
        {/* The Topic Killer */}
        <div className="stats-section" style={{ margin: 0 }}>
          <h4>
            The Topic Killer (Conversation Ender){" "}
            <InfoTooltip text="The participant who sends the last message in a conversation most often, followed by a long pause." />
          </h4>
          <div className="contributors-list">
            {Object.entries(stats.topicKiller || {})
              .filter(([_, data]) => data.count > 0)
              .sort((a, b) => b[1].count - a[1].count)
              .map(([sender, data]) => {
                const topPhrase = Object.entries(data.phrases).sort(
                  (a, b) => (b[1] as number) - (a[1] as number),
                )[0];
                const hasRecurringPhrase = topPhrase && topPhrase[1] > 1;
                return (
                  <div
                    key={sender}
                    className="contributor-item"
                    style={{
                      flexDirection: "column",
                      alignItems: "flex-start",
                      gap: "0.5rem",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        width: "100%",
                      }}
                    >
                      <span className="contributor-name">{sender}</span>
                      <span
                        className="contributor-count"
                        style={{ color: "var(--primary)" }}
                      >
                        Ended {data.count} times
                      </span>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        width: "100%",
                        fontSize: "0.85rem",
                        color: "#94a3b8",
                      }}
                    >
                      <span>
                        Most used phrase:{" "}
                        {hasRecurringPhrase ? `"${topPhrase[0]}"` : "None"}
                      </span>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* The Curator */}
        <div className="stats-section" style={{ margin: 0 }}>
          <h4>
            The Curator (Media Broadcaster){" "}
            <InfoTooltip text="The participant who shares the most photos, videos, and links." />
          </h4>
          <div className="contributors-list">
            {Object.entries(stats.mediaSharedPerSender || {})
              .filter(
                ([_, media]) =>
                  media.photos + media.videos + media.audio + media.links > 0,
              )
              .sort((a, b) => {
                const totalA =
                  a[1].photos + a[1].videos + a[1].audio + a[1].links;
                const totalB =
                  b[1].photos + b[1].videos + b[1].audio + b[1].links;
                return totalB - totalA;
              })
              .map(([sender, media]) => {
                const totalMedia = media.photos + media.videos + media.audio;
                return (
                  <div
                    key={sender}
                    className="contributor-item"
                    style={{
                      flexDirection: "column",
                      alignItems: "flex-start",
                      gap: "0.5rem",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        width: "100%",
                      }}
                    >
                      <span className="contributor-name">{sender}</span>
                      <span
                        className="contributor-count"
                        style={{ color: "var(--primary)" }}
                      >
                        {totalMedia + media.links} total items
                      </span>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        width: "100%",
                        fontSize: "0.85rem",
                        color: "#94a3b8",
                      }}
                    >
                      <span>{totalMedia} Uploads</span>
                      <span>{media.links} Links</span>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* The Anchor */}
        <div className="stats-section" style={{ margin: 0 }}>
          <h4>
            The Anchor (The Rerouter){" "}
            <InfoTooltip text="The participant who redirects the conversation to a new topic most frequently after a lull." />
          </h4>
          <div className="contributors-list">
            {Object.entries(stats.theAnchor || {})
              .filter(([_, count]) => count > 0)
              .sort((a, b) => b[1] - a[1])
              .map(([sender, count]) => (
                <div
                  key={sender}
                  className="contributor-item"
                  style={{ justifyContent: "space-between" }}
                >
                  <span className="contributor-name">{sender}</span>
                  <span
                    className="contributor-count"
                    style={{ color: "var(--primary)" }}
                  >
                    Redirected {count} times
                  </span>
                </div>
              ))}
          </div>
        </div>

        {/* Ghosting Threshold */}
        <div className="stats-section" style={{ margin: 0 }}>
          <h4>
            Ghosting Threshold (Check-In Timer){" "}
            <InfoTooltip text="The average time a participant waits after being left on read before sending a follow-up message." />
          </h4>
          <div className="contributors-list">
            {Object.entries(stats.ghostingThreshold || {})
              .filter(([_, data]) => data.checkInCount > 0)
              .sort((a, b) => b[1].averageWaitTimeMs - a[1].averageWaitTimeMs)
              .map(([sender, data]) => (
                <div
                  key={sender}
                  className="contributor-item"
                  style={{
                    flexDirection: "column",
                    alignItems: "flex-start",
                    gap: "0.5rem",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      width: "100%",
                    }}
                  >
                    <span className="contributor-name">{sender}</span>
                    <span
                      className="contributor-count"
                      style={{ color: "var(--primary)" }}
                    >
                      Wait: {formatDuration(data.averageWaitTimeMs)}
                    </span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      width: "100%",
                      fontSize: "0.85rem",
                      color: "#94a3b8",
                    }}
                  >
                    <span>Triggered {data.checkInCount} check-ins</span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>

      <div className="stats-header">
        <h3>Psychological & Relational Dynamics</h3>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: "1rem",
        }}
      >
        {/* The Pronoun Shift */}
        <div className="stats-section" style={{ margin: 0 }}>
          <h4>
            The Pronoun Shift ("I" vs. "We"){" "}
            <InfoTooltip text="The shift in ratio of singular (I/me/my) vs. plural (we/us/our) pronouns over the history of the chat." />
          </h4>
          <div className="contributors-list">
            {Object.entries(stats.pronounShift || {})
              .sort((a, b) => b[1].totalWePct - a[1].totalWePct)
              .map(([sender, data]) => (
                <div
                  key={sender}
                  className="contributor-item"
                  style={{
                    flexDirection: "column",
                    alignItems: "flex-start",
                    gap: "0.5rem",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      width: "100%",
                    }}
                  >
                    <span className="contributor-name">{sender}</span>
                    <span
                      className="contributor-count"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        color:
                          data.trend === "UP"
                            ? "#4ade80"
                            : data.trend === "DOWN"
                              ? "#f87171"
                              : "#94a3b8",
                      }}
                    >
                      {data.trend === "UP" && <TrendingUp size={16} />}
                      {data.trend === "DOWN" && <TrendingDown size={16} />}
                      {data.trend === "FLAT" && <Minus size={16} />}
                      {data.trend === "UP"
                        ? "Upwards"
                        : data.trend === "DOWN"
                          ? "Downwards"
                          : "Flat"}
                    </span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      width: "100%",
                      fontSize: "0.85rem",
                      color: "#94a3b8",
                    }}
                  >
                    <span>
                      {(100 - data.totalWePct).toFixed(1)}% "I" |{" "}
                      {data.totalWePct.toFixed(1)}% "We"
                    </span>
                    <span>
                      Q1: {data.q1WePct.toFixed(1)}% → Q4:{" "}
                      {data.q4WePct.toFixed(1)}%
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Emotional Contagion */}
        <div className="stats-section" style={{ margin: 0 }}>
          <h4>
            Emotional Contagion (The Mirror Effect){" "}
            <InfoTooltip text="How often one participant adopts a specific phrase, laughing style, or emoji newly introduced by another." />
          </h4>
          <div className="contributors-list">
            {(stats.emotionalContagion || []).map((data, index) => (
              <div
                key={index}
                className="contributor-item"
                style={{
                  flexDirection: "column",
                  alignItems: "flex-start",
                  gap: "0.5rem",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    width: "100%",
                  }}
                >
                  <span
                    className="contributor-name"
                    style={{ fontSize: "1.1rem" }}
                  >
                    "{data.token}"
                  </span>
                  <span
                    className="contributor-count"
                    style={{
                      color: "var(--primary)",
                      fontSize: "0.9rem",
                    }}
                  >
                    {data.timeDeltaStr}
                  </span>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    width: "100%",
                    fontSize: "0.85rem",
                    color: "#94a3b8",
                  }}
                >
                  <span>
                    {data.originator} → {data.adopter}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sentiment Arc */}
        <div className="stats-section" style={{ margin: 0 }}>
          <h4>
            Sentiment Arc (The Vibe Over Time){" "}
            <InfoTooltip text="The baseline mood (optimistic vs. pessimistic) based on sentiment analysis of the vocabulary used." />
          </h4>
          <div className="contributors-list">
            <div
              className="contributor-item"
              style={{
                flexDirection: "column",
                alignItems: "flex-start",
                gap: "0.5rem",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  width: "100%",
                }}
              >
                <span className="contributor-name">Baseline Vibe</span>
                <span className="contributor-count">
                  {stats.sentimentArc?.baselinePos >
                  stats.sentimentArc?.baselineNeg
                    ? "Optimistic"
                    : "Pessimistic"}
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  width: "100%",
                  fontSize: "0.85rem",
                  color: "#94a3b8",
                }}
              >
                <span>
                  Pos: {stats.sentimentArc?.baselinePos?.toFixed(1) || 0}%
                </span>
                <span>
                  Neg: {stats.sentimentArc?.baselineNeg?.toFixed(1) || 0}%
                </span>
              </div>
            </div>

            <div
              className="contributor-item"
              style={{ justifyContent: "space-between" }}
            >
              <span className="contributor-name">Most Positive 🌞</span>
              <span className="contributor-count">
                {stats.sentimentArc?.mostPositiveMonth || "-"}
              </span>
            </div>

            <div
              className="contributor-item"
              style={{ justifyContent: "space-between" }}
            >
              <span className="contributor-name">Most Negative 🌧️</span>
              <span className="contributor-count">
                {stats.sentimentArc?.mostNegativeMonth || "-"}
              </span>
            </div>
          </div>
        </div>

        {/* Vulnerability Spikes */}
        <div className="stats-section" style={{ margin: 0 }}>
          <h4>
            Vulnerability Spikes (The Deep Talkers){" "}
            <InfoTooltip text="Participants with the highest word count in single, deeply reflective or profound messages." />
          </h4>
          <div className="contributors-list">
            {Object.entries(stats.vulnerabilitySpikes || {})
              .filter(([_, count]) => count > 0)
              .sort((a, b) => b[1] - a[1])
              .map(([sender, count], index) => (
                <div
                  key={sender}
                  className="contributor-item"
                  style={{ justifyContent: "space-between" }}
                >
                  <span className="contributor-name">
                    {index === 0 && "🏆 "}
                    {sender}
                  </span>
                  <span className="contributor-count">{count} words</span>
                </div>
              ))}
          </div>
        </div>
      </div>

      <div className="stats-header">
        <h3>Milestones & Extremes</h3>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: "1rem",
        }}
      >
        {/* The Busiest Day */}
        <div className="stats-section" style={{ margin: 0 }}>
          <h4>
            The Busiest Day (Peak Interaction){" "}
            <InfoTooltip text="The single date with the absolute highest message volume, and how participation was split." />
          </h4>
          <div className="contributors-list">
            <div
              className="contributor-item"
              style={{
                flexDirection: "column",
                alignItems: "flex-start",
                gap: "0.5rem",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  width: "100%",
                }}
              >
                <span className="contributor-name">
                  {stats.busiestDay?.date || "-"}
                </span>
                <span
                  className="contributor-count"
                  style={{
                    color: "var(--primary)",
                    fontSize: "1.2rem",
                    fontWeight: "bold",
                  }}
                >
                  {stats.busiestDay?.totalMessages.toLocaleString() || 0} msgs
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "1rem",
                  width: "100%",
                  fontSize: "0.85rem",
                  color: "#94a3b8",
                }}
              >
                {stats.busiestDay &&
                  Object.entries(stats.busiestDay.split).map(
                    ([sender, pct]) => (
                      <span
                        key={sender}
                        style={{
                          background: "rgba(255,255,255,0.05)",
                          padding: "2px 8px",
                          borderRadius: "12px",
                        }}
                      >
                        {sender}: {pct}%
                      </span>
                    ),
                  )}
              </div>
            </div>
          </div>
        </div>

        {/* The Longest Monologue */}
        <div className="stats-section" style={{ margin: 0 }}>
          <h4>
            The Longest Monologue (Ultimate Soapbox){" "}
            <InfoTooltip text="The longest unbroken stream of text or consecutive messages sent by a single participant without interruption." />
          </h4>
          <div className="contributors-list">
            <div
              className="contributor-item"
              style={{
                flexDirection: "column",
                alignItems: "flex-start",
                gap: "0.5rem",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  width: "100%",
                }}
              >
                <span className="contributor-name">
                  {stats.longestMonologue?.sender || "-"}
                </span>
                <span
                  className="contributor-count"
                  style={{
                    color: "var(--primary)",
                    fontSize: "1.2rem",
                    fontWeight: "bold",
                  }}
                >
                  {stats.longestMonologue?.messageCount.toLocaleString() || 0}{" "}
                  msgs
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  width: "100%",
                  fontSize: "0.85rem",
                  color: "#94a3b8",
                }}
              >
                <span>
                  {stats.longestMonologue?.wordCount.toLocaleString() || 0}{" "}
                  words
                </span>
                <span>{stats.longestMonologue?.date || "-"}</span>
              </div>
              {stats.longestMonologue?.text && (
                <div
                  style={{
                    width: "100%",
                    marginTop: "0.5rem",
                    background: "var(--primary)",
                    color: "#1e293b",
                    padding: "0.75rem 1rem",
                    borderRadius: "16px 16px 16px 4px", // chat bubble look
                    fontSize: "0.85rem",
                    lineHeight: "1.4",
                    maxHeight: "200px",
                    overflowY: "auto",
                    wordBreak: "break-word",
                  }}
                >
                  {stats.longestMonologue.text}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* The Most Active Month/Year */}
        <div className="stats-section" style={{ margin: 0 }}>
          <h4>
            The Golden Era (Most Active Month){" "}
            <InfoTooltip text="The specific month and year with the highest total message frequency." />
          </h4>
          <div className="contributors-list">
            <div
              className="contributor-item"
              style={{
                flexDirection: "column",
                alignItems: "flex-start",
                gap: "0.5rem",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  width: "100%",
                }}
              >
                <span className="contributor-name">
                  {stats.mostActiveMonth?.monthYear || "-"}
                </span>
                <span
                  className="contributor-count"
                  style={{
                    color: "var(--primary)",
                    fontSize: "1.2rem",
                    fontWeight: "bold",
                  }}
                >
                  {stats.mostActiveMonth?.totalMessages.toLocaleString() || 0}{" "}
                  msgs
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: "1rem",
        }}
      >
        <div className="stats-section" style={{ margin: 0 }}>
          <h4>
            Top Contributors{" "}
            <InfoTooltip text="Participants ranked by the total number of messages they have sent." />
          </h4>
          <div className="contributors-list">
            {topSenders.map(([sender, count], index) => (
              <div key={sender} className="contributor-item">
                <span className="contributor-rank">#{index + 1}</span>
                <span className="contributor-name">{sender}</span>
                <span className="contributor-count">
                  {count.toLocaleString()} msgs
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="stats-section" style={{ margin: 0 }}>
          <h4>
            Top Characters Sent{" "}
            <InfoTooltip text="Participants ranked by the total number of characters they have typed." />
          </h4>
          <div className="contributors-list">
            {topCharacters.map(([sender, count], index) => (
              <div key={sender} className="contributor-item">
                <span className="contributor-rank">#{index + 1}</span>
                <span className="contributor-name">{sender}</span>
                <span className="contributor-count">
                  {count.toLocaleString()} chars
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="stats-header">
        <h3>Behavioral & Relational Quirks</h3>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: "1rem",
        }}
      >
        {/* The Heat Check (Argument Index) */}
        <div className="stats-section" style={{ margin: 0 }}>
          <h4>
            The Heat Check (Argument Index){" "}
            <InfoTooltip text="Measures episodes of rapid, dense messaging containing absolute or intense words to detect potential arguments." />
          </h4>
          <div className="contributors-list">
            {Object.entries(stats.argumentIndex || {})
              .sort((a, b) => b[1].score - a[1].score)
              .map(([sender, data]) => (
                <div
                  key={sender}
                  className="contributor-item"
                  style={{
                    flexDirection: "column",
                    alignItems: "flex-start",
                    gap: "0.5rem",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      width: "100%",
                    }}
                  >
                    <span className="contributor-name">{sender}</span>
                    <span
                      className="contributor-count"
                      style={{ color: "#ef4444" }} /* red color for heat */
                    >
                      Score: {data.score}
                    </span>
                  </div>
                  {data.score > 0 && data.maxIntensityMessage && (
                    <div
                      style={{
                        width: "100%",
                        background: "rgba(239, 68, 68, 0.1)",
                        padding: "0.5rem",
                        borderRadius: "8px",
                        borderLeft: "3px solid #ef4444",
                        fontSize: "0.85rem",
                        color: "#f87171",
                        fontStyle: "italic",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                      }}
                    >
                      "{data.maxIntensityMessage}"
                    </div>
                  )}
                </div>
              ))}
          </div>
        </div>

        {/* The Apology Tracker */}
        <div className="stats-section" style={{ margin: 0 }}>
          <h4>
            The Apology Tracker{" "}
            <InfoTooltip text="Tracks the frequency of apology words (like 'sorry', 'my bad', 'apologies') used by each participant." />
          </h4>
          <div className="contributors-list">
            {Object.entries(stats.apologyTracker || {})
              .sort((a, b) => b[1] - a[1])
              .map(([sender, count]) => (
                <div
                  key={sender}
                  className="contributor-item"
                  style={{ justifyContent: "space-between" }}
                >
                  <span className="contributor-name">{sender}</span>
                  <span
                    className="contributor-count"
                    style={{ color: "#3b82f6" }} /* blue color */
                  >
                    {count} apologies
                  </span>
                </div>
              ))}
          </div>
        </div>

        {/* The Caretaker */}
        <div className="stats-section" style={{ margin: 0 }}>
          <h4>
            The Caretaker (Check-ins){" "}
            <InfoTooltip text="Scores participants based on how frequently they send check-in questions (like 'how are you', 'you okay?')." />
          </h4>
          <div className="contributors-list">
            {Object.entries(stats.careAndAffection || {})
              .sort((a, b) => b[1].score - a[1].score)
              .map(([sender, data]) => {
                const topPhrasesList = Object.entries(data.topPhrases)
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 3);

                return (
                  <div
                    key={sender}
                    className="contributor-item"
                    style={{
                      flexDirection: "column",
                      alignItems: "flex-start",
                      gap: "0.5rem",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        width: "100%",
                      }}
                    >
                      <span className="contributor-name">{sender}</span>
                      <span
                        className="contributor-count"
                        style={{ color: "#10b981" }} /* green */
                      >
                        {data.score} check-ins
                      </span>
                    </div>
                    {topPhrasesList.length > 0 && (
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "0.2rem",
                          width: "100%",
                          fontSize: "0.8rem",
                          color: "#94a3b8",
                        }}
                      >
                        <span>Top Questions:</span>
                        {topPhrasesList.map(([phrase, count]) => (
                          <span key={phrase} style={{ paddingLeft: "0.5rem" }}>
                            • "{phrase}" ({count}x)
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        </div>

        {/* The Advisor vs The Seeker */}
        <div className="stats-section" style={{ margin: 0 }}>
          <h4>
            The Advisor vs. The Seeker{" "}
            <InfoTooltip text="The ratio of statements offering advice/opinions versus messages asking questions." />
          </h4>
          <div className="contributors-list">
            {Object.entries(stats.advisorVsOpinionated || {}).map(
              ([sender, data]) => {
                const role =
                  data.opinions > data.questions
                    ? "The Advisor"
                    : data.questions > data.opinions
                      ? "The Seeker"
                      : "Balanced";
                const ratio =
                  data.questions === 0
                    ? "∞"
                    : (data.opinions / data.questions).toFixed(2);

                return (
                  <div
                    key={sender}
                    className="contributor-item"
                    style={{
                      flexDirection: "column",
                      alignItems: "flex-start",
                      gap: "0.5rem",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        width: "100%",
                      }}
                    >
                      <span className="contributor-name">{sender}</span>
                      <span
                        className="contributor-count"
                        style={{ color: "var(--primary)" }}
                      >
                        {role}
                      </span>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        width: "100%",
                        fontSize: "0.85rem",
                        color: "#94a3b8",
                      }}
                    >
                      <span>
                        {data.opinions} Opinions | {data.questions} Qs
                      </span>
                      <span>Ratio: {ratio}</span>
                    </div>
                  </div>
                );
              },
            )}
          </div>
        </div>

        {/* Average Conversation Length */}
        <div className="stats-section" style={{ margin: 0 }}>
          <h4>
            The Session Tracker{" "}
            <InfoTooltip text="The average number of messages and duration of an active conversation before a significant pause occurs." />
          </h4>
          <div className="contributors-list">
            <div
              className="contributor-item"
              style={{
                flexDirection: "column",
                alignItems: "flex-start",
                gap: "0.5rem",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  width: "100%",
                }}
              >
                <span className="contributor-name">Average Chat Session</span>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  width: "100%",
                  fontSize: "1.2rem",
                  color: "var(--primary)",
                  fontWeight: "bold",
                }}
              >
                {stats.conversationSessions?.avgMessages || 0} messages
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  width: "100%",
                  fontSize: "0.85rem",
                  color: "#94a3b8",
                }}
              >
                <span>
                  Duration:{" "}
                  {formatDuration(
                    stats.conversationSessions?.avgDurationMs || 0,
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* The Gossip & Focus Matrix */}
        <div className="stats-section" style={{ margin: 0 }}>
          <h4>
            The Gossip & Focus Matrix{" "}
            <InfoTooltip text="Categorizes the dominant conversation topics between gossip (people), grind (work/study), or venting (complaints)." />
          </h4>
          <div className="contributors-list">
            <div
              className="contributor-item"
              style={{
                flexDirection: "column",
                alignItems: "flex-start",
                gap: "0.5rem",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  width: "100%",
                }}
              >
                <span className="contributor-name">Dominant Topic</span>
                <span
                  className="contributor-count"
                  style={{ color: "var(--primary)" }}
                >
                  {Math.max(
                    stats.gossipFocusMatrix?.gossip || 0,
                    stats.gossipFocusMatrix?.grind || 0,
                    stats.gossipFocusMatrix?.complaint || 0,
                  ) === (stats.gossipFocusMatrix?.gossip || 0)
                    ? "Gossip (People)"
                    : Math.max(
                          stats.gossipFocusMatrix?.gossip || 0,
                          stats.gossipFocusMatrix?.grind || 0,
                          stats.gossipFocusMatrix?.complaint || 0,
                        ) === (stats.gossipFocusMatrix?.grind || 0)
                      ? "The Grind (Work/Study)"
                      : "Complaining (Venting)"}
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  width: "100%",
                  fontSize: "0.85rem",
                  color: "#94a3b8",
                }}
              >
                <span>Gossip: {stats.gossipFocusMatrix?.gossip || 0}</span>
                <span>Grind: {stats.gossipFocusMatrix?.grind || 0}</span>
                <span>
                  Complaint: {stats.gossipFocusMatrix?.complaint || 0}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Conversation Initiators */}
        <div className="stats-section" style={{ margin: 0 }}>
          <h4>
            Conversation Initiators (8h+ gap){" "}
            <InfoTooltip text="The participants who most often send the first message after a silence of 8 hours or more." />
          </h4>
          <div className="contributors-list">
            {Object.keys(stats.sendersCount)
              .sort(
                (a, b) =>
                  (stats.initiations?.[b] || 0) - (stats.initiations?.[a] || 0),
              )
              .map((sender) => {
                const count = stats.initiations?.[sender] || 0;
                const percentage =
                  stats.totalInitiations > 0
                    ? ((count / stats.totalInitiations) * 100).toFixed(1)
                    : "0.0";
                return (
                  <div
                    key={sender}
                    className="contributor-item"
                    style={{ justifyContent: "space-between" }}
                  >
                    <span className="contributor-name">{sender}</span>
                    <span className="contributor-count">
                      {count} ({percentage}%)
                    </span>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Response Time Analysis */}
        <div className="stats-section" style={{ margin: 0 }}>
          <h4>
            Response Time Analysis{" "}
            <InfoTooltip text="The average and median amount of time a participant takes to reply to a message in active conversations." />
          </h4>
          <div className="contributors-list">
            {Object.keys(stats.sendersCount)
              .sort(
                (a, b) =>
                  (stats.avgResponseTime?.[b] || 0) -
                  (stats.avgResponseTime?.[a] || 0),
              )
              .map((sender) => (
                <div
                  key={sender}
                  className="contributor-item"
                  style={{
                    flexDirection: "column",
                    alignItems: "flex-start",
                    gap: "0.5rem",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      width: "100%",
                    }}
                  >
                    <span className="contributor-name">{sender}</span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      width: "100%",
                      fontSize: "0.85rem",
                      color: "#94a3b8",
                    }}
                  >
                    <span>
                      Avg:{" "}
                      {formatDuration(stats.avgResponseTime?.[sender] || 0)}
                    </span>
                    <span>
                      Median:{" "}
                      {formatDuration(stats.medianResponseTime?.[sender] || 0)}
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Double Text Ratio */}
        <div className="stats-section" style={{ margin: 0 }}>
          <h4>
            Double Text Ratio{" "}
            <InfoTooltip text="The percentage of times a participant sends multiple consecutive messages before getting a reply." />
          </h4>
          <div className="contributors-list">
            {Object.keys(stats.sendersCount)
              .sort((a, b) => {
                const ratioA =
                  (stats.doubleTextClusters?.[a] || 0) /
                  (stats.sendersCount[a] || 1);
                const ratioB =
                  (stats.doubleTextClusters?.[b] || 0) /
                  (stats.sendersCount[b] || 1);
                return ratioB - ratioA;
              })
              .map((sender) => {
                const dt = stats.doubleTextClusters?.[sender] || 0;
                const total = stats.sendersCount[sender];
                const ratio = ((dt / total) * 100).toFixed(1);
                return (
                  <div
                    key={sender}
                    className="contributor-item"
                    style={{ justifyContent: "space-between" }}
                  >
                    <span className="contributor-name">{sender}</span>
                    <span className="contributor-count">
                      {dt} ({ratio}%)
                    </span>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Question-to-Statement Ratio */}
        <div className="stats-section" style={{ margin: 0 }}>
          <h4>
            Question-to-Statement Ratio{" "}
            <InfoTooltip text="The proportion of messages each participant sends that are questions versus statements." />
          </h4>
          <div className="contributors-list">
            {Object.keys(stats.sendersCount)
              .sort((a, b) => {
                const rA =
                  (stats.questionsCount?.[a] || 0) /
                  (stats.statementsCount?.[a] || 1);
                const rB =
                  (stats.questionsCount?.[b] || 0) /
                  (stats.statementsCount?.[b] || 1);
                return rB - rA;
              })
              .map((sender) => {
                const q = stats.questionsCount?.[sender] || 0;
                const s = stats.statementsCount?.[sender] || 0;
                const ratio = s === 0 ? "∞" : (q / s).toFixed(2);
                return (
                  <div
                    key={sender}
                    className="contributor-item"
                    style={{
                      flexDirection: "column",
                      alignItems: "flex-start",
                      gap: "0.5rem",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        width: "100%",
                      }}
                    >
                      <span className="contributor-name">{sender}</span>
                      <span className="contributor-count">{ratio} ratio</span>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        width: "100%",
                        fontSize: "0.85rem",
                        color: "#94a3b8",
                      }}
                    >
                      <span>{q} Questions</span>
                      <span>{s} Statements</span>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Average Message Length */}
        <div className="stats-section" style={{ margin: 0 }}>
          <h4>
            Average Message Length{" "}
            <InfoTooltip text="The typical number of words and characters per message for each participant." />
          </h4>
          <div className="contributors-list">
            {Object.keys(stats.sendersCount)
              .sort((a, b) => {
                const lA =
                  (stats.wordsCount?.[a] || 0) / (stats.sendersCount[a] || 1);
                const lB =
                  (stats.wordsCount?.[b] || 0) / (stats.sendersCount[b] || 1);
                return lB - lA;
              })
              .map((sender) => {
                const msgs = stats.sendersCount[sender];
                const words = stats.wordsCount?.[sender] || 0;
                const chars = stats.charactersCount?.[sender] || 0;
                return (
                  <div
                    key={sender}
                    className="contributor-item"
                    style={{
                      flexDirection: "column",
                      alignItems: "flex-start",
                      gap: "0.5rem",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        width: "100%",
                      }}
                    >
                      <span className="contributor-name">{sender}</span>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        width: "100%",
                        fontSize: "0.85rem",
                        color: "#94a3b8",
                      }}
                    >
                      <span>{(words / msgs).toFixed(1)} words/msg</span>
                      <span>{(chars / msgs).toFixed(1)} chars/msg</span>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>

      <div className="stats-header">
        <h3>Timing & Rhythms</h3>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: "1rem",
        }}
      >
        {/* Activity Heatmap */}
        <div className="stats-section" style={{ margin: 0 }}>
          <h4>
            Activity Heatmap (The Daily Routine){" "}
            <InfoTooltip text="The primary communication style and an overview of the most active times of day." />
          </h4>
          <div className="contributors-list">
            <div
              className="contributor-item"
              style={{
                flexDirection: "column",
                alignItems: "flex-start",
                gap: "0.5rem",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  width: "100%",
                }}
              >
                <span className="contributor-name">Communication Style</span>
                <span
                  className="contributor-count"
                  style={{ color: "var(--primary)" }}
                >
                  {stats.primaryCommunicationStyle}
                </span>
              </div>
            </div>

            <div
              className="contributor-item"
              style={{
                flexDirection: "column",
                alignItems: "flex-start",
                gap: "0.5rem",
              }}
            >
              <span className="contributor-name">Top 3 Most Active Hours</span>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  width: "100%",
                  fontSize: "0.85rem",
                  color: "#94a3b8",
                }}
              >
                {stats.top3Hours.map((h, i) => (
                  <span key={i}>
                    {formatHour(h.hour)} ({h.count})
                  </span>
                ))}
              </div>
            </div>

            <div
              className="contributor-item"
              style={{ justifyContent: "space-between" }}
            >
              <span className="contributor-name">Most Active Day</span>
              <span className="contributor-count">
                {stats.topDay !== null ? formatDay(stats.topDay) : "-"}
              </span>
            </div>
          </div>
        </div>

        {/* First and Last Word */}
        <div className="stats-section" style={{ margin: 0 }}>
          <h4>
            First and Last Word (The Sleep Bookends){" "}
            <InfoTooltip text="Who typically sends the first message of the day (morning) and the last message at night before a long gap." />
          </h4>
          <div className="contributors-list">
            {Object.keys(stats.sendersCount)
              .sort((a, b) => {
                const pctA =
                  stats.totalDaysWithSleepGap > 0
                    ? (stats.firstWords?.[a] || 0) / stats.totalDaysWithSleepGap
                    : 0;
                const pctB =
                  stats.totalDaysWithSleepGap > 0
                    ? (stats.firstWords?.[b] || 0) / stats.totalDaysWithSleepGap
                    : 0;
                return pctB - pctA;
              })
              .map((sender) => {
                const first = stats.firstWords?.[sender] || 0;
                const last = stats.lastWords?.[sender] || 0;

                const firstPct =
                  stats.totalDaysWithSleepGap > 0
                    ? ((first / stats.totalDaysWithSleepGap) * 100).toFixed(1)
                    : "0.0";
                const lastPct =
                  stats.totalDaysWithSleepGap > 0
                    ? ((last / stats.totalDaysWithSleepGap) * 100).toFixed(1)
                    : "0.0";

                return (
                  <div
                    key={sender}
                    className="contributor-item"
                    style={{
                      flexDirection: "column",
                      alignItems: "flex-start",
                      gap: "0.5rem",
                    }}
                  >
                    <span className="contributor-name">{sender}</span>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        width: "100%",
                        fontSize: "0.85rem",
                        color: "#94a3b8",
                      }}
                    >
                      <span>First Word (Morning): {firstPct}%</span>
                      <span>Last Word (Night): {lastPct}%</span>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Longest Streak */}
        <div className="stats-section" style={{ margin: 0 }}>
          <h4>
            Longest Streak (Consistency){" "}
            <InfoTooltip text="The maximum number of consecutive days where at least one message was exchanged." />
          </h4>
          <div className="contributors-list">
            <div
              className="contributor-item"
              style={{
                flexDirection: "column",
                alignItems: "flex-start",
                gap: "0.5rem",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  width: "100%",
                }}
              >
                <span className="contributor-name">Max Consecutive Days</span>
                <span
                  className="contributor-count"
                  style={{
                    color: "var(--primary)",
                    fontSize: "1.2rem",
                    fontWeight: "bold",
                  }}
                >
                  {stats.longestStreakDays}
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  width: "100%",
                  fontSize: "0.85rem",
                  color: "#94a3b8",
                }}
              >
                <span>From: {stats.longestStreakStart || "-"}</span>
                <span>To: {stats.longestStreakEnd || "-"}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Longest Silence */}
        <div className="stats-section" style={{ margin: 0 }}>
          <h4>
            Longest Silence (The Disconnect){" "}
            <InfoTooltip text="The longest continuous period of time with zero messages sent in the chat." />
          </h4>
          <div className="contributors-list">
            <div
              className="contributor-item"
              style={{
                flexDirection: "column",
                alignItems: "flex-start",
                gap: "0.5rem",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  width: "100%",
                }}
              >
                <span className="contributor-name">Largest Time Gap</span>
                <span
                  className="contributor-count"
                  style={{ color: "var(--primary)" }}
                >
                  {Math.floor(stats.longestSilenceDurationMinutes / (24 * 60))}d{" "}
                  {Math.floor(
                    (stats.longestSilenceDurationMinutes % (24 * 60)) / 60,
                  )}
                  h {stats.longestSilenceDurationMinutes % 60}m
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  width: "100%",
                  fontSize: "0.85rem",
                  color: "#94a3b8",
                  gap: "0.2rem",
                }}
              >
                <span>Started: {stats.longestSilenceStart || "-"}</span>
                <span>Ended: {stats.longestSilenceEnd || "-"}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="stats-section" style={{ height: "450px" }}>
        <h4>
          Activity by Hour{" "}
          <InfoTooltip text="The total message volume distributed across the 24 hours of the day." />
        </h4>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={hourlyData}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.1)"
              vertical={false}
            />
            <XAxis
              dataKey="name"
              stroke="#94a3b8"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="#94a3b8"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              cursor={{ fill: "rgba(255,255,255,0.05)" }}
              contentStyle={{
                backgroundColor: "#1e293b",
                border: "none",
                borderRadius: "8px",
                color: "#fff",
              }}
            />
            <Bar dataKey="count" fill="var(--primary)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="stats-section" style={{ height: "450px" }}>
        <h4>
          Activity Over Time{" "}
          <InfoTooltip text="The total message volume distributed across all dates in the chat history." />
        </h4>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={dailyData}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.1)"
              vertical={false}
            />
            <XAxis
              dataKey="name"
              stroke="#94a3b8"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              minTickGap={30}
            />
            <YAxis
              stroke="#94a3b8"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              cursor={{ fill: "rgba(255,255,255,0.05)" }}
              contentStyle={{
                backgroundColor: "#1e293b",
                border: "none",
                borderRadius: "8px",
                color: "#fff",
              }}
            />
            <Area
              type="monotone"
              dataKey="count"
              stroke="var(--primary)"
              fillOpacity={0.3}
              fill="var(--primary)"
            />
            <Brush
              dataKey="name"
              height={30}
              stroke="var(--primary)"
              fill="rgba(0,0,0,0.2)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="stats-header">
        <h3>Content & Linguistic Style</h3>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: "1rem",
        }}
      >
        {/* Most Used Words (Top 10) */}
        <div className="stats-section" style={{ margin: 0 }}>
          <h4>
            Most Used Words (The Core Vocabulary){" "}
            <InfoTooltip text="The most frequently used terms by each participant." />
          </h4>
          <div className="contributors-list">
            {Object.keys(stats.sendersCount)
              .sort((a, b) => stats.sendersCount[b] - stats.sendersCount[a])
              .map((sender) => {
                const topWords = stats.topWordsPerSender[sender] || [];
                return (
                  <div
                    key={sender}
                    className="contributor-item"
                    style={{
                      flexDirection: "column",
                      alignItems: "flex-start",
                      gap: "0.5rem",
                    }}
                  >
                    <span
                      className="contributor-name"
                      style={{ color: "var(--primary)" }}
                    >
                      {sender}
                    </span>
                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: "0.5rem",
                      }}
                    >
                      {topWords.length > 0 ? (
                        topWords.map((w, idx) => (
                          <span
                            key={idx}
                            style={{
                              background: "rgba(255,255,255,0.05)",
                              padding: "2px 8px",
                              borderRadius: "12px",
                              fontSize: "0.85rem",
                            }}
                          >
                            {w.word} ({w.count})
                          </span>
                        ))
                      ) : (
                        <span style={{ fontSize: "0.85rem", color: "#94a3b8" }}>
                          No data
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Most Used Phrases (Top 3) */}
        <div className="stats-section" style={{ margin: 0 }}>
          <h4>
            Most Used Phrases (The Catchphrases){" "}
            <InfoTooltip text="The top 3 most common complete messages sent by each participant." />
          </h4>
          <div className="contributors-list">
            {Object.keys(stats.sendersCount)
              .sort((a, b) => stats.sendersCount[b] - stats.sendersCount[a])
              .map((sender) => {
                const topPhrases = stats.topPhrasesPerSender[sender] || [];
                return (
                  <div
                    key={sender}
                    className="contributor-item"
                    style={{
                      flexDirection: "column",
                      alignItems: "flex-start",
                      gap: "0.5rem",
                    }}
                  >
                    <span
                      className="contributor-name"
                      style={{ color: "var(--primary)" }}
                    >
                      {sender}
                    </span>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.4rem",
                        width: "100%",
                        fontSize: "0.85rem",
                      }}
                    >
                      {topPhrases.length > 0 ? (
                        topPhrases.map((p, idx) => (
                          <div
                            key={idx}
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              background: "rgba(255,255,255,0.05)",
                              padding: "4px 8px",
                              borderRadius: "6px",
                            }}
                          >
                            <span>"{p.phrase}"</span>
                            <span style={{ color: "#94a3b8" }}>{p.count}x</span>
                          </div>
                        ))
                      ) : (
                        <span style={{ color: "#94a3b8" }}>No data</span>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* The Laugh Track */}
        <div className="stats-section" style={{ margin: 0 }}>
          <h4>
            The "Laugh Track" (Amusement Styles){" "}
            <InfoTooltip text="How each participant expresses laughter (e.g., 'haha', 'lol', emojis)." />
          </h4>
          <div className="contributors-list">
            {Object.keys(stats.sendersCount)
              .sort((a, b) => stats.sendersCount[b] - stats.sendersCount[a])
              .map((sender) => {
                const laughs = stats.laughTrackPerSender[sender] || {};
                const topLaughs = Object.entries(laughs)
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 5);
                return (
                  <div
                    key={sender}
                    className="contributor-item"
                    style={{
                      flexDirection: "column",
                      alignItems: "flex-start",
                      gap: "0.5rem",
                    }}
                  >
                    <span
                      className="contributor-name"
                      style={{ color: "var(--primary)" }}
                    >
                      {sender}
                    </span>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        width: "100%",
                        fontSize: "0.85rem",
                        color: "#94a3b8",
                      }}
                    >
                      {topLaughs.length > 0 ? (
                        topLaughs.map(([term, count], idx) => (
                          <span key={idx}>
                            {term} ({count})
                          </span>
                        ))
                      ) : (
                        <span>No laughs detected</span>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Top Emojis */}
        <div className="stats-section" style={{ margin: 0 }}>
          <h4>
            Top Emojis (The Emotional Tone){" "}
            <InfoTooltip text="The most frequently used emojis by each participant." />
          </h4>
          <div className="contributors-list">
            {Object.keys(stats.sendersCount).map((sender) => {
              const topEmojis = stats.topEmojisPerSender[sender] || [];
              return (
                <div
                  key={sender}
                  className="contributor-item"
                  style={{
                    flexDirection: "column",
                    alignItems: "flex-start",
                    gap: "0.5rem",
                  }}
                >
                  <span
                    className="contributor-name"
                    style={{ color: "var(--primary)" }}
                  >
                    {sender}
                  </span>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      width: "100%",
                      fontSize: "1.2rem",
                    }}
                  >
                    {topEmojis.length > 0 ? (
                      topEmojis.map((e, idx) => (
                        <span key={idx} title={`Count: ${e.count}`}>
                          {e.emoji}
                        </span>
                      ))
                    ) : (
                      <span style={{ fontSize: "0.85rem", color: "#94a3b8" }}>
                        No emojis
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Media Shared */}
        <div className="stats-section" style={{ margin: 0 }}>
          <h4>
            Media Shared (The Broadcasters){" "}
            <InfoTooltip text="A breakdown of specific media types (photos, videos, audio, links) shared per person." />
          </h4>
          <div className="contributors-list">
            {Object.keys(stats.sendersCount).map((sender) => {
              const media = stats.mediaSharedPerSender[sender] || {
                photos: 0,
                videos: 0,
                audio: 0,
                links: 0,
              };
              return (
                <div
                  key={sender}
                  className="contributor-item"
                  style={{
                    flexDirection: "column",
                    alignItems: "flex-start",
                    gap: "0.5rem",
                  }}
                >
                  <span
                    className="contributor-name"
                    style={{ color: "var(--primary)" }}
                  >
                    {sender}
                  </span>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      width: "100%",
                      gap: "0.5rem",
                      fontSize: "0.85rem",
                      color: "#94a3b8",
                    }}
                  >
                    <span>📷 Photos: {media.photos}</span>
                    <span>🎥 Videos: {media.videos}</span>
                    <span>🎵 Voice: {media.audio}</span>
                    <span>🔗 Links: {media.links}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Profanity Index */}
        <div className="stats-section" style={{ margin: 0 }}>
          <h4>
            Profanity Index (The Colorful Vocabulary){" "}
            <InfoTooltip text="The frequency of swear words used by each participant." />
          </h4>
          <div className="contributors-list">
            {Object.keys(stats.sendersCount).map((sender) => {
              const profanityCount = stats.profanityScorePerSender[sender] || 0;
              return (
                <div
                  key={sender}
                  className="contributor-item"
                  style={{ justifyContent: "space-between" }}
                >
                  <span
                    className="contributor-name"
                    style={{ color: "var(--primary)" }}
                  >
                    {sender}
                  </span>
                  <span className="contributor-count">
                    {profanityCount} swear words
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="stats-header">
        <h3>Deep-Dive Linguistic Quirks</h3>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: "1rem",
        }}
      >
        {/* Lexical Diversity */}
        <div className="stats-section" style={{ margin: 0 }}>
          <h4>
            Lexical Diversity (Vocabulary Breadth){" "}
            <InfoTooltip text="The percentage of unique words used relative to the total number of words typed." />
          </h4>
          <div className="contributors-list">
            {Object.entries(stats.lexicalDiversity || {})
              .sort((a, b) => b[1].percentage - a[1].percentage)
              .map(([sender, data], index) => (
                <div
                  key={sender}
                  className="contributor-item"
                  style={{
                    flexDirection: "column",
                    alignItems: "flex-start",
                    gap: "0.5rem",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      width: "100%",
                    }}
                  >
                    <span className="contributor-name">
                      {sender}
                      <span
                        style={{
                          marginLeft: "0.5rem",
                          fontSize: "0.8rem",
                          color: "var(--primary)",
                        }}
                      >
                        {index === 0
                          ? "(Varied Vocabulary)"
                          : "(Standard Phrases)"}
                      </span>
                    </span>
                    <span className="contributor-count">
                      {data.percentage.toFixed(1)}%
                    </span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      width: "100%",
                      fontSize: "0.85rem",
                      color: "#94a3b8",
                    }}
                  >
                    <span>
                      {data.uniqueWords.toLocaleString()} unique words
                    </span>
                    <span>{data.totalWords.toLocaleString()} total words</span>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Punctuation Personality */}
        <div className="stats-section" style={{ margin: 0 }}>
          <h4>
            Punctuation Personality (Expressiveness){" "}
            <InfoTooltip text="The unique way each participant uses exclamation marks, question marks, and ellipses." />
          </h4>
          <div className="contributors-list">
            {Object.entries(stats.punctuationPersonality || {}).map(
              ([sender, data]) => {
                const isEnthusiast =
                  data.exclamationCount ===
                    Math.max(
                      ...Object.values(stats.punctuationPersonality || {}).map(
                        (d) => d.exclamationCount,
                      ),
                    ) && data.exclamationCount > 0;

                const isPonderer =
                  data.ellipsisCount ===
                    Math.max(
                      ...Object.values(stats.punctuationPersonality || {}).map(
                        (d) => d.ellipsisCount,
                      ),
                    ) && data.ellipsisCount > 0;

                const isQuestioner =
                  data.questionCount ===
                    Math.max(
                      ...Object.values(stats.punctuationPersonality || {}).map(
                        (d) => d.questionCount,
                      ),
                    ) && data.questionCount > 0;

                return (
                  <div
                    key={sender}
                    className="contributor-item"
                    style={{
                      flexDirection: "column",
                      alignItems: "flex-start",
                      gap: "0.5rem",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        width: "100%",
                      }}
                    >
                      <span className="contributor-name">
                        {sender}
                        <span
                          style={{
                            marginLeft: "0.5rem",
                            fontSize: "0.8rem",
                            color: "var(--primary)",
                          }}
                        >
                          {isEnthusiast ? " (The Enthusiast)" : ""}
                          {isPonderer ? " (The Ponderer)" : ""}
                          {isQuestioner ? " (The Inquirer)" : ""}
                        </span>
                      </span>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        width: "100%",
                        fontSize: "0.85rem",
                        color: "#94a3b8",
                      }}
                    >
                      <span>! : {data.exclamationCount}</span>
                      <span>... : {data.ellipsisCount}</span>
                      <span>? : {data.questionCount}</span>
                    </div>
                  </div>
                );
              },
            )}
          </div>
        </div>

        {/* The Correction Rate */}
        <div className="stats-section" style={{ margin: 0 }}>
          <h4>
            The Correction Rate (Typo Tracker){" "}
            <InfoTooltip text="How often a participant corrects a previous typo using an asterisk (e.g., '*word')." />
          </h4>
          <div className="contributors-list">
            {Object.entries(stats.asteriskCorrections || {})
              .sort((a, b) => b[1] - a[1])
              .map(([sender, count], index) => (
                <div
                  key={sender}
                  className="contributor-item"
                  style={{ justifyContent: "space-between" }}
                >
                  <span className="contributor-name">
                    {sender}
                    {index === 0 && count > 0 && (
                      <span
                        style={{
                          marginLeft: "0.5rem",
                          fontSize: "0.8rem",
                          color: "var(--primary)",
                        }}
                      >
                        (Most Meticulous)
                      </span>
                    )}
                  </span>
                  <span className="contributor-count">{count} corrections</span>
                </div>
              ))}
          </div>
        </div>

        {/* Capitalization Habits */}
        <div className="stats-section" style={{ margin: 0 }}>
          <h4>
            Capitalization Habits (Volume Knob){" "}
            <InfoTooltip text="The ratio of proper case, lowercase, and ALL CAPS text used by each participant." />
          </h4>
          <div className="contributors-list">
            {Object.entries(stats.capitalizationHabits || {}).map(
              ([sender, data]) => (
                <div
                  key={sender}
                  className="contributor-item"
                  style={{
                    flexDirection: "column",
                    alignItems: "flex-start",
                    gap: "0.5rem",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      width: "100%",
                    }}
                  >
                    <span className="contributor-name">{sender}</span>
                    <span
                      className="contributor-count"
                      style={{ color: "var(--primary)", fontSize: "0.8rem" }}
                    >
                      {data.properCasePct > 50
                        ? "Formal"
                        : data.lowercasePct > 50
                          ? "Casual"
                          : data.allCapsPct > 5
                            ? "Loud"
                            : "Mixed"}
                    </span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      width: "100%",
                      fontSize: "0.85rem",
                      color: "#94a3b8",
                    }}
                  >
                    <span>Proper: {data.properCasePct.toFixed(1)}%</span>
                    <span>lower: {data.lowercasePct.toFixed(1)}%</span>
                    <span>CAPS: {data.allCapsPct.toFixed(1)}%</span>
                  </div>
                </div>
              ),
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

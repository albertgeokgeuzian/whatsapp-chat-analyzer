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
            <span className="stat-label">Total Messages</span>
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
            <span className="stat-label">Participants</span>
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
            <span className="stat-label">Media Shared</span>
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
            <span className="stat-label">Most Active Hour</span>
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
            <span className="stat-label">Most Active Day</span>
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
            <span className="stat-label">Most Active Date</span>
            <span className="stat-value">
              {stats.topDate
                ? format(new Date(stats.topDate), "MMM d, yyyy")
                : "-"}
            </span>
          </div>
        </div>
      </div>

      <div className="stats-header" style={{ marginTop: "2rem" }}>
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
          <h4>The Topic Killer (Conversation Ender)</h4>
          <div className="contributors-list">
            {Object.entries(stats.topicKiller || {})
              .sort((a, b) => b[1].count - a[1].count)
              .map(([sender, data]) => {
                const topPhrase = Object.entries(data.phrases).sort(
                  (a, b) => b[1] - a[1],
                )[0];
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
                        {data.count} times
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
                        Most used phrase: "{topPhrase ? topPhrase[0] : "N/A"}"
                      </span>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* The Curator */}
        <div className="stats-section" style={{ margin: 0 }}>
          <h4>The Curator (Media Broadcaster)</h4>
          <div className="contributors-list">
            {Object.entries(stats.mediaSharedPerSender || {})
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
          <h4>The Anchor (The Rerouter)</h4>
          <div className="contributors-list">
            {Object.entries(stats.theAnchor || {})
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
          <h4>Ghosting Threshold (Check-In Timer)</h4>
          <div className="contributors-list">
            {Object.entries(stats.ghostingThreshold || {})
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

      <div className="stats-header" style={{ marginTop: "2rem" }}>
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
          <h4>The Pronoun Shift ("I" vs. "We")</h4>
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
          <h4>Emotional Contagion (The Mirror Effect)</h4>
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
          <h4>Sentiment Arc (The Vibe Over Time)</h4>
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
          <h4>Vulnerability Spikes (The Deep Talkers)</h4>
          <div className="contributors-list">
            {Object.entries(stats.vulnerabilitySpikes || {})
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

      <div className="stats-header" style={{ marginTop: "2rem" }}>
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
          <h4>The Busiest Day (Peak Interaction)</h4>
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
          <h4>The Longest Monologue (Ultimate Soapbox)</h4>
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
            </div>
          </div>
        </div>

        {/* The Most Active Month/Year */}
        <div className="stats-section" style={{ margin: 0 }}>
          <h4>The Golden Era (Most Active Month)</h4>
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
          <h4>Top Contributors</h4>
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
          <h4>Top Characters Sent</h4>
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

      <div className="stats-header" style={{ marginTop: "2rem" }}>
        <h3>Behavioral Analysis</h3>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: "1rem",
        }}
      >
        {/* Conversation Initiators */}
        <div className="stats-section" style={{ margin: 0 }}>
          <h4>Conversation Initiators (8h+ gap)</h4>
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
          <h4>Response Time Analysis</h4>
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
          <h4>Double Text Ratio</h4>
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
          <h4>Question-to-Statement Ratio</h4>
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
          <h4>Average Message Length</h4>
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

      <div className="stats-header" style={{ marginTop: "2rem" }}>
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
          <h4>Activity Heatmap (The Daily Routine)</h4>
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
          <h4>First and Last Word (The Sleep Bookends)</h4>
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
          <h4>Longest Streak (Consistency)</h4>
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
          <h4>Longest Silence (The Disconnect)</h4>
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

      <div
        className="stats-section"
        style={{ height: "450px", marginTop: "1.5rem", marginBottom: "1rem" }}
      >
        <h4>Activity by Hour</h4>
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

      <div
        className="stats-section"
        style={{ height: "450px", marginTop: "1.5rem", marginBottom: "1rem" }}
      >
        <h4>Activity Over Time</h4>
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

      <div className="stats-header" style={{ marginTop: "2rem" }}>
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
          <h4>Most Used Words (The Core Vocabulary)</h4>
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

        {/* The Laugh Track */}
        <div className="stats-section" style={{ margin: 0 }}>
          <h4>The "Laugh Track" (Amusement Styles)</h4>
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
          <h4>Top Emojis (The Emotional Tone)</h4>
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
          <h4>Media Shared (The Broadcasters)</h4>
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
          <h4>Profanity Index (The Colorful Vocabulary)</h4>
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

      <div className="stats-header" style={{ marginTop: "2rem" }}>
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
          <h4>Lexical Diversity (Vocabulary Breadth)</h4>
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
          <h4>Punctuation Personality (Expressiveness)</h4>
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
          <h4>The Correction Rate (Typo Tracker)</h4>
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
          <h4>Capitalization Habits (Volume Knob)</h4>
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

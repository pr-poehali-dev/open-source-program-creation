import { useState, useRef, useEffect } from "react";
import Icon from "@/components/ui/icon";

const AI_API = "https://functions.poehali.dev/daefa87e-0693-4de5-9191-bbc918e1d241";

interface Message {
  role: "user" | "assistant";
  text: string;
  time: string;
  suggestions?: string[];
  loading?: boolean;
  fromCpvoa?: boolean;
}

// Данные ЦПВОА которые можно передать в чат
export interface CpvoaContext {
  incidents: { id: string; category: string; threat: string; location: string; source: string; time: string; description: string }[];
  sensors: Record<string, boolean>;
  connection: string;
  mode: string;
  query?: string;
}

const getTime = () => {
  const d = new Date();
  return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
};

const genSession = () => `session_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

const TOPIC_GROUPS = [
  {
    label: "⚖️ Право",
    color: "#3b82f6",
    items: ["Права обвиняемого", "Как подать иск?", "Что такое УПК?"],
  },
  {
    label: "🌐 ЕЦСУ",
    color: "#a855f7",
    items: ["Критические инциденты", "Что умеет ЕЦСУ?", "Статистика системы"],
  },
  {
    label: "📡 ЦПВОА",
    color: "#4CAF50",
    items: ["Что такое ЦПВОА?", "Как анализировать аномалии?", "Режимы мониторинга"],
  },
  {
    label: "🔍 Анализ",
    color: "#f59e0b",
    items: ["Объясни МГП", "Международное право", "Нефтяной разлив Нигерия"],
  },
];

const CPVOA_QUICK = [
  "ЦПВОА: объясни критический инцидент",
  "ЦПВОА: дай рекомендации по реагированию",
  "ЦПВОА: правовая квалификация аномалий",
  "ЦПВОА: что делать при обнаружении сигнала?",
];

function renderMarkdown(text: string) {
  return text
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`(.+?)`/g, '<code style="background:rgba(255,255,255,0.1);padding:1px 4px;border-radius:4px;font-size:0.85em">$1</code>')
    .replace(/^> (.+)$/gm, '<blockquote style="border-left:2px solid rgba(168,85,247,0.5);padding-left:8px;color:rgba(255,255,255,0.6);margin:4px 0">$1</blockquote>')
    .replace(/^• (.+)$/gm, '<div style="display:flex;gap:6px;margin:2px 0"><span style="color:#a855f7;flex-shrink:0">•</span><span>$1</span></div>')
    .replace(/^(\d+)\. (.+)$/gm, '<div style="display:flex;gap:6px;margin:2px 0"><span style="color:#3b82f6;flex-shrink:0;font-weight:bold">$1.</span><span>$2</span></div>')
    .replace(/✓ (.+)/g, '<div style="display:flex;gap:6px;align-items:flex-start"><span style="color:#00ff87;flex-shrink:0">✓</span><span>$1</span></div>')
    .replace(/\n\n/g, '<div style="height:8px"></div>')
    .replace(/\n/g, "<br/>");
}

interface Props {
  onClose: () => void;
  initialCpvoaContext?: CpvoaContext;
  initialMessage?: string;
}

export default function AiChat({ onClose, initialCpvoaContext, initialMessage }: Props) {
  const [tab, setTab] = useState<"chat" | "cpvoa">(initialCpvoaContext ? "cpvoa" : "chat");
  const [cpvoaContext, setCpvoaContext] = useState<CpvoaContext | null>(initialCpvoaContext ?? null);
  const [cpvoaSynced, setCpvoaSynced] = useState(!!initialCpvoaContext);

  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      text: initialCpvoaContext
        ? `**Синхронизация с ЦПВОА выполнена** ✅\n\nПолучено **${initialCpvoaContext.incidents.length}** инцидентов. Режим: *${initialCpvoaContext.mode}* · Связь: *${initialCpvoaContext.connection}*.\n\nМогу проанализировать данные, дать рекомендации или ответить на вопросы по обнаруженным аномалиям.`
        : "Привет! Я ИИ-ассистент ЕЦСУ 2.0 на базе **Google Gemini**, интегрированный с модулем **ЦПВОА**.\n\nМогу помочь с правовыми вопросами, анализом инцидентов и мониторингом аномалий.\n\nВыбери тему или напиши сам:",
      time: getTime(),
      suggestions: initialCpvoaContext
        ? ["Проанализируй инциденты", "Дай рекомендации", "Критические угрозы"]
        : ["Что ты умеешь?", "Подключить ЦПВОА", "Критические инциденты"],
      fromCpvoa: !!initialCpvoaContext,
    },
  ]);
  const [input, setInput] = useState(initialMessage ?? "");
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(genSession);
  const [showTopics, setShowTopics] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Если пришёл initialMessage — отправляем сразу
  useEffect(() => {
    if (initialMessage && initialMessage.trim()) {
      setTimeout(() => send(initialMessage), 300);
    }
  }, []);

  const buildHistory = () =>
    messages
      .filter(m => !m.loading)
      .map(m => ({ role: m.role, content: m.text }));

  const send = async (overrideText?: string, withCpvoa?: boolean) => {
    const text = (overrideText ?? input).trim();
    if (!text || loading) return;

    setInput("");
    setShowTopics(false);

    const useCpvoa = withCpvoa ?? (cpvoaContext !== null && cpvoaSynced);
    const userMsg: Message = {
      role: "user",
      text: useCpvoa ? `📡 [ЦПВОА] ${text}` : text,
      time: getTime(),
      fromCpvoa: useCpvoa,
    };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const history = buildHistory();
      const body: Record<string, unknown> = {
        message: text,
        session_id: sessionId,
        history,
      };
      if (useCpvoa && cpvoaContext) {
        body.cpvoa_context = cpvoaContext;
      }

      const res = await fetch(AI_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      let reply = "";
      let suggestions: string[] = [];

      if (typeof data === "string") {
        try { const parsed = JSON.parse(data); reply = parsed.reply || data; suggestions = parsed.suggestions || []; }
        catch { reply = data; }
      } else {
        reply = data.reply || "Не получил ответ от сервера.";
        suggestions = data.suggestions || [];
      }

      setMessages(prev => [
        ...prev,
        { role: "assistant", text: reply, time: getTime(), suggestions, fromCpvoa: useCpvoa },
      ]);
    } catch {
      setMessages(prev => [
        ...prev,
        {
          role: "assistant",
          text: "⚠️ Нет связи с сервером. Проверьте соединение и попробуйте ещё раз.",
          time: getTime(),
          suggestions: ["Попробовать снова", "Правовая база", "Инциденты ЕЦСУ"],
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  };

  const clearChat = () => {
    setMessages([{
      role: "assistant",
      text: "Диалог очищен. Чем могу помочь?",
      time: getTime(),
      suggestions: ["Правовой вопрос", "Инциденты", "Совет дня"],
    }]);
    setCpvoaContext(null);
    setCpvoaSynced(false);
  };

  const syncCpvoa = () => {
    // Симулируем синхронизацию — в реальности данные придут с страницы ЦПВОА
    const mockCtx: CpvoaContext = {
      incidents: [
        { id: "1", category: "Радиоэфир", threat: "high", location: "53.2°N 83.7°E", source: "FM 101.2 МГц", time: getTime(), description: "Нестандартная модуляция сигнала, отклонение +23 дБ" },
        { id: "2", category: "Визуальный", threat: "medium", location: "53.1°N 83.8°E", source: "Камера #4", time: getTime(), description: "Световые вспышки с кодированным паттерном" },
        { id: "4", category: "Кибер", threat: "critical", location: "Внешний IP", source: "Брандмауэр", time: getTime(), description: "Попытка несанкционированного доступа к буферу сообщений" },
      ],
      sensors: { radio: true, camera: false, mesh: true },
      connection: "online",
      mode: "advanced",
      query: "ЦПВОА: статус системы",
    };
    setCpvoaContext(mockCtx);
    setCpvoaSynced(true);
    setMessages(prev => [...prev, {
      role: "assistant",
      text: `**Синхронизация с ЦПВОА выполнена** ✅\n\nПолучено **${mockCtx.incidents.length}** инцидентов (1 критический). Датчики: радио ✓, меш ✓.\n\nТеперь все мои ответы будут учитывать данные ЦПВОА.`,
      time: getTime(),
      suggestions: ["Проанализируй инциденты", "Критическая угроза", "Рекомендации"],
      fromCpvoa: true,
    }]);
  };

  return (
    <div
      className="fixed bottom-6 right-6 z-50 flex flex-col rounded-2xl overflow-hidden"
      style={{
        width: 420,
        maxWidth: "calc(100vw - 2rem)",
        height: 640,
        background: "#0a0f1a",
        border: "1px solid rgba(168,85,247,0.35)",
        boxShadow: "0 0 60px rgba(168,85,247,0.15), 0 20px 40px rgba(0,0,0,0.5)",
      }}
    >
      {/* ── HEADER ── */}
      <div
        className="flex items-center justify-between px-4 py-3 shrink-0"
        style={{ background: "rgba(168,85,247,0.12)", borderBottom: "1px solid rgba(168,85,247,0.2)" }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center relative"
            style={{ background: cpvoaSynced ? "linear-gradient(135deg, #4CAF50, #3b82f6)" : "linear-gradient(135deg, #a855f7, #3b82f6)" }}
          >
            <Icon name="Bot" size={16} className="text-white" />
            <span
              className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2"
              style={{ background: cpvoaSynced ? "#4CAF50" : "#00ff87", borderColor: "#0a0f1a" }}
            />
          </div>
          <div>
            <div className="text-white font-bold text-sm leading-none">ИИ-Ассистент ЕЦСУ</div>
            <div className="text-[10px]" style={{ color: cpvoaSynced ? "#4CAF50" : "rgba(255,255,255,0.35)" }}>
              {cpvoaSynced ? "📡 ЦПВОА синхронизирован" : "Gemini · онлайн"}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowTopics(p => !p)}
            title="Темы"
            className="w-7 h-7 rounded-lg flex items-center justify-center text-white/40 hover:text-white/80 transition-colors"
            style={{ background: showTopics ? "rgba(168,85,247,0.2)" : "transparent" }}
          >
            <Icon name="LayoutGrid" size={14} />
          </button>
          <button
            onClick={clearChat}
            title="Очистить чат"
            className="w-7 h-7 rounded-lg flex items-center justify-center text-white/40 hover:text-white/80 transition-colors"
          >
            <Icon name="Trash2" size={14} />
          </button>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-white/40 hover:text-white/80 transition-colors"
          >
            <Icon name="X" size={16} />
          </button>
        </div>
      </div>

      {/* ── TABS ── */}
      <div className="flex shrink-0" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        {([
          { id: "chat", label: "💬 Диалог" },
          { id: "cpvoa", label: "📡 ЦПВОА" },
        ] as { id: typeof tab; label: string }[]).map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className="flex-1 py-2 text-xs font-semibold transition-all"
            style={{
              color: tab === t.id ? (t.id === "cpvoa" ? "#4CAF50" : "#a855f7") : "rgba(255,255,255,0.3)",
              borderBottom: tab === t.id ? `2px solid ${t.id === "cpvoa" ? "#4CAF50" : "#a855f7"}` : "2px solid transparent",
              background: tab === t.id ? "rgba(255,255,255,0.03)" : "transparent",
            }}>
            {t.label}
            {t.id === "cpvoa" && cpvoaSynced && (
              <span className="ml-1.5 inline-block w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            )}
          </button>
        ))}
      </div>

      {/* ── TOPICS PANEL ── */}
      {showTopics && tab === "chat" && (
        <div
          className="shrink-0 p-3 grid grid-cols-2 gap-2"
          style={{ background: "rgba(255,255,255,0.02)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}
        >
          {TOPIC_GROUPS.map(g => (
            <div key={g.label}>
              <div className="text-[10px] uppercase tracking-widest mb-1.5" style={{ color: g.color }}>{g.label}</div>
              {g.items.map(item => (
                <button
                  key={item}
                  onClick={() => { send(item); setShowTopics(false); }}
                  className="block w-full text-left text-xs text-white/60 hover:text-white/90 py-0.5 transition-colors"
                >
                  {item}
                </button>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* ── TAB: ЦПВОА ── */}
      {tab === "cpvoa" && (
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4" style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(76,175,80,0.3) transparent" }}>
          {/* Статус синхронизации */}
          <div className="rounded-xl p-3" style={{ background: cpvoaSynced ? "rgba(76,175,80,0.08)" : "rgba(255,255,255,0.04)", border: `1px solid ${cpvoaSynced ? "rgba(76,175,80,0.25)" : "rgba(255,255,255,0.08)"}` }}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-sm">📡</span>
                <span className="text-sm font-bold" style={{ color: cpvoaSynced ? "#4CAF50" : "rgba(255,255,255,0.6)" }}>
                  {cpvoaSynced ? "ЦПВОА синхронизирован" : "ЦПВОА не подключён"}
                </span>
              </div>
              <button onClick={syncCpvoa}
                className="text-xs px-3 py-1 rounded-lg font-semibold transition-all hover:scale-105"
                style={{ background: "rgba(76,175,80,0.15)", color: "#4CAF50", border: "1px solid rgba(76,175,80,0.3)" }}>
                {cpvoaSynced ? "🔄 Обновить" : "Подключить"}
              </button>
            </div>
            {cpvoaContext && (
              <div className="text-xs space-y-1" style={{ color: "rgba(255,255,255,0.5)" }}>
                <div>Режим: <span className="text-white/70">{cpvoaContext.mode}</span> · Связь: <span className="text-white/70">{cpvoaContext.connection}</span></div>
                <div>Инцидентов: <span style={{ color: "#F44336" }}>{cpvoaContext.incidents.length}</span> · Датчики: {Object.entries(cpvoaContext.sensors).filter(([, v]) => v).map(([k]) => k).join(", ") || "нет"}</div>
              </div>
            )}
          </div>

          {/* Инциденты */}
          {cpvoaContext && cpvoaContext.incidents.length > 0 && (
            <div>
              <div className="text-[10px] uppercase tracking-widest text-white/30 mb-2">Текущие инциденты ЦПВОА</div>
              <div className="space-y-2">
                {cpvoaContext.incidents.map(inc => (
                  <div key={inc.id} className="rounded-lg px-3 py-2.5"
                    style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold text-white/80">{inc.category}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold"
                        style={{
                          color: inc.threat === "critical" ? "#F44336" : inc.threat === "high" ? "#FF9800" : inc.threat === "medium" ? "#FFC107" : "#4CAF50",
                          background: inc.threat === "critical" ? "rgba(244,67,54,0.15)" : "rgba(255,255,255,0.06)",
                        }}>
                        {inc.threat}
                      </span>
                    </div>
                    <p className="text-[11px] text-white/45 leading-relaxed">{inc.description}</p>
                    <button
                      onClick={() => { setTab("chat"); send(`Проанализируй этот инцидент ЦПВОА: [${inc.threat.toUpperCase()}] ${inc.category} — ${inc.description}. Источник: ${inc.source}. Геолокация: ${inc.location}`, true); }}
                      className="mt-1.5 text-[10px] px-2 py-0.5 rounded-md transition-all hover:opacity-80"
                      style={{ background: "rgba(76,175,80,0.12)", color: "#4CAF50", border: "1px solid rgba(76,175,80,0.2)" }}>
                      Спросить ИИ →
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Быстрые запросы к ИИ через ЦПВОА */}
          <div>
            <div className="text-[10px] uppercase tracking-widest text-white/30 mb-2">Запросы ИИ по данным ЦПВОА</div>
            <div className="space-y-1.5">
              {CPVOA_QUICK.map(q => (
                <button key={q} onClick={() => { setTab("chat"); send(q, true); }}
                  className="w-full text-left px-3 py-2 rounded-lg text-xs transition-all hover:bg-white/5"
                  style={{ color: "rgba(255,255,255,0.55)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <span style={{ color: "#4CAF50" }}>📡</span> {q}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB: ЧАТ ── */}
      {tab === "chat" && (
        <>
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3" style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(168,85,247,0.3) transparent" }}>
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div style={{ maxWidth: "88%" }}>
                  {msg.role === "assistant" && (
                    <div className="flex items-center gap-1.5 mb-1">
                      <div className="w-5 h-5 rounded-md flex items-center justify-center"
                        style={{ background: msg.fromCpvoa ? "linear-gradient(135deg, #4CAF50, #3b82f6)" : "linear-gradient(135deg, #a855f7, #3b82f6)" }}>
                        <Icon name="Bot" size={11} className="text-white" />
                      </div>
                      <span className="text-white/25 text-[10px]">{msg.time}</span>
                      {msg.fromCpvoa && <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold" style={{ background: "rgba(76,175,80,0.15)", color: "#4CAF50" }}>ЦПВОА</span>}
                    </div>
                  )}

                  <div
                    className="rounded-xl px-3 py-2.5 text-sm leading-relaxed"
                    style={msg.role === "user"
                      ? {
                          background: msg.fromCpvoa
                            ? "linear-gradient(135deg, rgba(76,175,80,0.2), rgba(59,130,246,0.2))"
                            : "linear-gradient(135deg, rgba(168,85,247,0.25), rgba(59,130,246,0.25))",
                          color: "rgba(255,255,255,0.92)",
                          border: `1px solid ${msg.fromCpvoa ? "rgba(76,175,80,0.3)" : "rgba(168,85,247,0.3)"}`,
                        }
                      : { background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.87)", border: "1px solid rgba(255,255,255,0.08)" }
                    }
                  >
                    {msg.role === "user"
                      ? <span>{msg.text}</span>
                      : <span dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.text) }} />
                    }
                  </div>

                  {msg.role === "user" && (
                    <div className="text-right mt-0.5">
                      <span className="text-white/20 text-[10px]">{msg.time}</span>
                    </div>
                  )}

                  {msg.role === "assistant" && msg.suggestions && msg.suggestions.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {msg.suggestions.map((s, si) => (
                        <button
                          key={si}
                          onClick={() => send(s)}
                          disabled={loading}
                          className="text-xs px-2.5 py-1 rounded-lg transition-all hover:scale-105 disabled:opacity-40"
                          style={{
                            background: msg.fromCpvoa ? "rgba(76,175,80,0.12)" : "rgba(168,85,247,0.12)",
                            color: msg.fromCpvoa ? "#86efac" : "#c4b5fd",
                            border: `1px solid ${msg.fromCpvoa ? "rgba(76,175,80,0.25)" : "rgba(168,85,247,0.25)"}`,
                          }}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-5 rounded-md flex items-center justify-center"
                    style={{ background: cpvoaSynced ? "linear-gradient(135deg, #4CAF50, #3b82f6)" : "linear-gradient(135deg, #a855f7, #3b82f6)" }}>
                    <Icon name="Bot" size={11} className="text-white" />
                  </div>
                  <div className="flex items-center gap-1 px-3 py-2 rounded-xl"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
                    {[0, 1, 2].map(d => (
                      <span
                        key={d}
                        className="w-1.5 h-1.5 rounded-full"
                        style={{
                          background: cpvoaSynced ? "#4CAF50" : "#a855f7",
                          animation: `bounce 1s ease-in-out ${d * 0.15}s infinite`,
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* ── INPUT ── */}
          <div
            className="shrink-0 px-3 py-3"
            style={{ borderTop: "1px solid rgba(255,255,255,0.07)", background: "rgba(0,0,0,0.2)" }}
          >
            {cpvoaSynced && (
              <div className="flex items-center gap-1.5 mb-2 px-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                <span className="text-[10px]" style={{ color: "#4CAF50" }}>ЦПВОА активен · данные инцидентов передаются в ИИ</span>
              </div>
            )}
            <div
              className="flex items-end gap-2 rounded-xl px-3 py-2"
              style={{
                background: "rgba(255,255,255,0.05)",
                border: `1px solid ${cpvoaSynced ? "rgba(76,175,80,0.3)" : "rgba(168,85,247,0.25)"}`,
              }}
            >
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder={cpvoaSynced ? "Спросите ИИ о данных ЦПВОА..." : "Напишите сообщение... (Enter — отправить)"}
                rows={1}
                disabled={loading}
                className="flex-1 bg-transparent text-white text-sm outline-none resize-none placeholder-white/25 leading-relaxed"
                style={{ maxHeight: 96, minHeight: 22 }}
                onInput={e => {
                  const t = e.currentTarget;
                  t.style.height = "auto";
                  t.style.height = Math.min(t.scrollHeight, 96) + "px";
                }}
              />
              <button
                onClick={() => send()}
                disabled={!input.trim() || loading}
                className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:scale-110 disabled:opacity-30 shrink-0"
                style={{ background: cpvoaSynced ? "linear-gradient(135deg, #4CAF50, #3b82f6)" : "linear-gradient(135deg, #a855f7, #3b82f6)" }}
              >
                <Icon name="Send" size={14} className="text-white" />
              </button>
            </div>
            <div className="flex items-center justify-between mt-1.5 px-1">
              <span className="text-white/15 text-[10px]">Shift+Enter — перенос</span>
              <span className="text-[10px]" style={{ color: cpvoaSynced ? "rgba(76,175,80,0.5)" : "rgba(255,255,255,0.15)" }}>
                {cpvoaSynced ? "📡 Gemini + ЦПВОА" : "Gemini AI · ЕЦСУ 2.0"}
              </span>
            </div>
          </div>
        </>
      )}

      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); opacity: 0.4; }
          50% { transform: translateY(-4px); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

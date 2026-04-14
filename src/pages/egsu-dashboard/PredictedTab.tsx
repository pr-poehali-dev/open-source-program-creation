import { useState } from "react";
import Icon from "@/components/ui/icon";

const PREDICTED_INCIDENTS = [
  {
    id: "PRD-001", type: "ecology", title: "Возможная вырубка леса в бассейне Амазонки", country: "Бразилия",
    probability: 87, severity: "high", horizon: "7 дней", source: "Спутниковые данные + тренд",
    signals: ["Рост активности лесозаготовительной техники", "Снижение индекса NDVI на 12%", "Исторический паттерн апрель–май"],
    response: "Направить запрос в ОГР-Экология, уведомить МС ЕЦСУ",
  },
  {
    id: "PRD-002", type: "cyber", title: "Кибератака на энергосистему ЕС", country: "Германия / Польша",
    probability: 74, severity: "critical", horizon: "3 дня", source: "Threat Intelligence + аномалии трафика",
    signals: ["Рост сканирований портов АСУ ТП на 340%", "Известная группировка активизировалась", "Аналог атаки 2022 года"],
    response: "Предупредить ОГР-Киберзащита, рекомендовать изоляцию сегментов сети",
  },
  {
    id: "PRD-003", type: "water", title: "Загрязнение водоёма промышленными стоками", country: "Индия",
    probability: 91, severity: "high", horizon: "24 часа", source: "IoT-датчики + жалобы населения",
    signals: ["pH воды упал до 4.2 (норма 6.5–8.5)", "Запах серы зафиксирован 3 датчиками", "Завод работает в сверхурочном режиме"],
    response: "Экстренный мониторинг ОГР-Водные ресурсы, запрос документов у предприятия",
  },
  {
    id: "PRD-004", type: "air", title: "Превышение CO₂ в промышленном регионе", country: "Китай",
    probability: 68, severity: "medium", horizon: "14 дней", source: "Прогноз погоды + данные выбросов",
    signals: ["Штиль ожидается 5–10 дней", "Выбросы выше нормы на 28% последние 2 недели", "Аналогичный эпизод был в 2024 году"],
    response: "Предупредить местные органы, подготовить рекомендации по ограничению выбросов",
  },
  {
    id: "PRD-005", type: "ecology", title: "Браконьерство в сезон миграции", country: "Кения / Танзания",
    probability: 82, severity: "medium", horizon: "10 дней", source: "Сезонный анализ + агентурные данные",
    signals: ["Сезон миграции гну начинается", "Активность браконьерских групп возросла", "Слабый контроль на границе"],
    response: "Усилить патрулирование ОГР-Экология, координация с местными властями",
  },
];

const PRED_TYPE_COLORS: Record<string, string> = { ecology: "#00ff87", water: "#3b82f6", air: "#f59e0b", cyber: "#f43f5e" };
const PRED_TYPE_LABELS: Record<string, string> = { ecology: "Экология", water: "Вода", air: "Воздух", cyber: "Кибер" };
const PRED_SEV_COLORS: Record<string, string> = { critical: "#f43f5e", high: "#f59e0b", medium: "#3b82f6" };
const PRED_SEV_LABELS: Record<string, string> = { critical: "Критический", high: "Высокий", medium: "Средний" };

type PredIncident = typeof PREDICTED_INCIDENTS[0];

export default function PredictedTab() {
  const [selected, setSelected] = useState<PredIncident | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ title: "", country: "", type: "ecology", severity: "medium", horizon: "", probability: "70", signals: "", response: "" });
  const [custom, setCustom] = useState<PredIncident[]>([]);
  const [reacted, setReacted] = useState<Set<string>>(new Set());

  const all = [...PREDICTED_INCIDENTS, ...custom];

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const newInc: PredIncident = {
      id: `PRD-C${custom.length + 1}`.padEnd(7, "0"),
      type: form.type,
      title: form.title,
      country: form.country,
      probability: Number(form.probability),
      severity: form.severity,
      horizon: form.horizon,
      source: "Создан вручную оператором",
      signals: form.signals.split("\n").filter(Boolean),
      response: form.response,
    };
    setCustom(prev => [newInc, ...prev]);
    setCreateOpen(false);
    setForm({ title: "", country: "", type: "ecology", severity: "medium", horizon: "", probability: "70", signals: "", response: "" });
  }

  return (
    <div className="space-y-5 animate-fade-up">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-2xl font-bold text-white uppercase">Предполагаемые инциденты</h1>
          <p className="text-white/30 text-sm mt-0.5">ИИ-прогнозы угроз · Ранее предупреждение · Реагирование</p>
        </div>
        <button
          onClick={() => setCreateOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-black transition-all hover:scale-105"
          style={{ background: "linear-gradient(135deg, #a855f7, #3b82f6)" }}>
          <Icon name="Plus" size={15} />
          Добавить прогноз
        </button>
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Всего прогнозов", value: all.length, color: "#a855f7", icon: "BrainCircuit" },
          { label: "Критические", value: all.filter(i => i.severity === "critical").length, color: "#f43f5e", icon: "AlertOctagon" },
          { label: "Среднее P(%)", value: Math.round(all.reduce((s, i) => s + i.probability, 0) / all.length) + "%", color: "#f59e0b", icon: "Percent" },
          { label: "Отработано", value: reacted.size, color: "#00ff87", icon: "CheckCircle" },
        ].map((stat) => (
          <div key={stat.label} className="p-4 rounded-2xl"
            style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${stat.color}20` }}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-2"
              style={{ background: `${stat.color}15` }}>
              <Icon name={stat.icon as "BrainCircuit"} size={16} style={{ color: stat.color }} />
            </div>
            <div className="font-display text-2xl font-bold" style={{ color: stat.color }}>{stat.value}</div>
            <div className="text-white/40 text-xs mt-0.5">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Список */}
      <div className="space-y-3">
        {all.map((inc) => (
          <div key={inc.id}
            className="rounded-2xl p-4 cursor-pointer transition-all"
            style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${PRED_TYPE_COLORS[inc.type]}20` }}
            onClick={() => setSelected(selected?.id === inc.id ? null : inc)}>
            <div className="flex items-center gap-3">
              {/* Вероятность */}
              <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 font-display font-bold text-sm"
                style={{ background: `${PRED_SEV_COLORS[inc.severity]}15`, color: PRED_SEV_COLORS[inc.severity] }}>
                {inc.probability}%
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                    style={{ background: `${PRED_TYPE_COLORS[inc.type]}15`, color: PRED_TYPE_COLORS[inc.type] }}>
                    {PRED_TYPE_LABELS[inc.type]}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                    style={{ background: `${PRED_SEV_COLORS[inc.severity]}15`, color: PRED_SEV_COLORS[inc.severity] }}>
                    {PRED_SEV_LABELS[inc.severity]}
                  </span>
                  <span className="text-[10px] text-white/30">⏱ {inc.horizon}</span>
                </div>
                <div className="text-white font-semibold text-sm">{inc.title}</div>
                <div className="text-white/40 text-xs mt-0.5">{inc.country} · {inc.source}</div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {reacted.has(inc.id)
                  ? <span className="text-xs px-2 py-1 rounded-lg font-semibold" style={{ background: "rgba(0,255,135,0.12)", color: "#00ff87" }}>✓ Отработан</span>
                  : <button
                      onClick={e => { e.stopPropagation(); setReacted(prev => new Set([...prev, inc.id])); }}
                      className="text-xs px-3 py-1.5 rounded-lg font-semibold text-black transition-all hover:scale-105"
                      style={{ background: "linear-gradient(135deg, #f43f5e, #f59e0b)" }}>
                      Реагировать
                    </button>
                }
                <Icon name={selected?.id === inc.id ? "ChevronUp" : "ChevronDown"} size={14} className="text-white/30" />
              </div>
            </div>

            {/* Детали */}
            {selected?.id === inc.id && (
              <div className="mt-4 pt-4 grid md:grid-cols-2 gap-4" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-white/30 mb-2">Сигналы тревоги</div>
                  <div className="space-y-1.5">
                    {inc.signals.map((s, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-white/60">
                        <span style={{ color: "#f59e0b" }}>▲</span>{s}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="rounded-xl p-3" style={{ background: "rgba(168,85,247,0.08)", border: "1px solid rgba(168,85,247,0.2)" }}>
                  <div className="text-[10px] uppercase tracking-widest text-white/30 mb-2">Рекомендуемые меры</div>
                  <div className="text-xs text-white/70 leading-relaxed">{inc.response}</div>
                  {!reacted.has(inc.id) && (
                    <button
                      onClick={() => setReacted(prev => new Set([...prev, inc.id]))}
                      className="mt-3 w-full py-2 rounded-lg text-xs font-semibold text-black transition-all hover:scale-105"
                      style={{ background: "linear-gradient(135deg, #a855f7, #3b82f6)" }}>
                      Применить меры реагирования
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Модал создания */}
      {createOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)" }}>
          <div className="w-full max-w-lg rounded-2xl p-6 max-h-[90vh] overflow-y-auto"
            style={{ background: "#0d1321", border: "1px solid rgba(168,85,247,0.3)" }}>
            <div className="flex items-center justify-between mb-5">
              <div className="font-display text-lg font-bold text-white">Новый прогноз инцидента</div>
              <button onClick={() => setCreateOpen(false)} className="text-white/40 hover:text-white/70">
                <Icon name="X" size={18} />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="text-xs text-white/40 mb-1 block">Название угрозы *</label>
                <input required value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                  placeholder="Например: Возможный разлив нефти..."
                  className="w-full px-3 py-2 rounded-xl text-sm text-white placeholder-white/20 outline-none"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-white/40 mb-1 block">Страна / Регион *</label>
                  <input required value={form.country} onChange={e => setForm(p => ({ ...p, country: e.target.value }))}
                    placeholder="Россия, ЕС..."
                    className="w-full px-3 py-2 rounded-xl text-sm text-white placeholder-white/20 outline-none"
                    style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }} />
                </div>
                <div>
                  <label className="text-xs text-white/40 mb-1 block">Горизонт (срок)</label>
                  <input value={form.horizon} onChange={e => setForm(p => ({ ...p, horizon: e.target.value }))}
                    placeholder="7 дней, 24 часа..."
                    className="w-full px-3 py-2 rounded-xl text-sm text-white placeholder-white/20 outline-none"
                    style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-white/40 mb-1 block">Тип</label>
                  <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl text-sm text-white outline-none"
                    style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
                    <option value="ecology">Экология</option>
                    <option value="water">Вода</option>
                    <option value="air">Воздух</option>
                    <option value="cyber">Кибер</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-white/40 mb-1 block">Угроза</label>
                  <select value={form.severity} onChange={e => setForm(p => ({ ...p, severity: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl text-sm text-white outline-none"
                    style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
                    <option value="critical">Критический</option>
                    <option value="high">Высокий</option>
                    <option value="medium">Средний</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-white/40 mb-1 block">Вероятность %</label>
                  <input type="number" min="1" max="99" value={form.probability}
                    onChange={e => setForm(p => ({ ...p, probability: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl text-sm text-white outline-none"
                    style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }} />
                </div>
              </div>
              <div>
                <label className="text-xs text-white/40 mb-1 block">Сигналы тревоги (каждый с новой строки)</label>
                <textarea value={form.signals} onChange={e => setForm(p => ({ ...p, signals: e.target.value }))}
                  rows={3} placeholder={"Рост активности...\nАномалия датчиков..."}
                  className="w-full px-3 py-2 rounded-xl text-sm text-white placeholder-white/20 outline-none resize-none"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }} />
              </div>
              <div>
                <label className="text-xs text-white/40 mb-1 block">Рекомендуемые меры реагирования</label>
                <textarea value={form.response} onChange={e => setForm(p => ({ ...p, response: e.target.value }))}
                  rows={2} placeholder="Направить запрос в ОГР..."
                  className="w-full px-3 py-2 rounded-xl text-sm text-white placeholder-white/20 outline-none resize-none"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }} />
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setCreateOpen(false)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white/50 transition-all"
                  style={{ border: "1px solid rgba(255,255,255,0.1)" }}>
                  Отмена
                </button>
                <button type="submit"
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-black transition-all hover:scale-105"
                  style={{ background: "linear-gradient(135deg, #a855f7, #3b82f6)" }}>
                  Создать прогноз
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import IncidentModal from "@/components/IncidentModal";
import DashboardLayout from "./egsu-dashboard/DashboardLayout";
import DashboardOverview from "./egsu-dashboard/DashboardOverview";
import DashboardIncidents from "./egsu-dashboard/DashboardIncidents";
import PredictedTab from "./egsu-dashboard/PredictedTab";

const API = "https://functions.poehali.dev/c71047de-6e10-499a-aa1c-e9fdba33e7bd";

const DEMO_INCIDENTS = [
  { id: "INC-001", type: "ecology", title: "Незаконная вырубка леса", country: "Бразилия", status: "active", severity: "high", date: "12.04.2026", responsible: "ОГР-Экология", ai: 92 },
  { id: "INC-002", type: "water", title: "Загрязнение реки Рейн", country: "Германия", status: "investigating", severity: "medium", date: "11.04.2026", responsible: "ОГР-Водные ресурсы", ai: 87 },
  { id: "INC-003", type: "air", title: "Выброс CO₂ сверх нормы", country: "Китай", status: "resolved", severity: "high", date: "10.04.2026", responsible: "ОГР-Атмосфера", ai: 95 },
  { id: "INC-004", type: "ecology", title: "Браконьерство в заповеднике", country: "Кения", status: "active", severity: "medium", date: "09.04.2026", responsible: "ОГР-Экология", ai: 76 },
  { id: "INC-005", type: "cyber", title: "Кибератака на инфраструктуру", country: "Норвегия", status: "investigating", severity: "critical", date: "08.04.2026", responsible: "ОГР-Киберзащита", ai: 88 },
  { id: "INC-006", type: "water", title: "Нефтяной разлив", country: "Нигерия", status: "active", severity: "critical", date: "07.04.2026", responsible: "ОГР-Водные ресурсы", ai: 91 },
  { id: "INC-007", type: "air", title: "Лесные пожары", country: "Канада", status: "resolved", severity: "high", date: "06.04.2026", responsible: "ОГР-Атмосфера", ai: 83 },
  { id: "INC-008", type: "ecology", title: "Незаконный сброс отходов", country: "Индия", status: "active", severity: "medium", date: "05.04.2026", responsible: "ОГР-Экология", ai: 79 },
];

function normalizeIncident(raw: any) {
  return {
    id: raw.incident_code || raw.id,
    type: raw.type,
    title: raw.title,
    country: raw.country,
    status: raw.status === "verified" ? "active" : raw.status === "pending_verification" ? "investigating" : raw.status,
    severity: raw.severity,
    date: raw.created_at ? new Date(raw.created_at).toLocaleDateString("ru-RU") : "",
    responsible: raw.responsible_organ || "ОГР-Общий",
    ai: raw.ai_confidence || 0,
    actions: raw.actions || [],
    _raw: raw,
  };
}

type NavTab = "overview" | "incidents" | "predicted" | "ai" | "organs";

export default function EgsuDashboard() {
  const [activeTab, setActiveTab] = useState<NavTab>("overview");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedIncident, setSelectedIncident] = useState<any | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [dbIncidents, setDbIncidents] = useState<any[]>([]);
  const [loadingDb, setLoadingDb] = useState(true);

  useEffect(() => {
    fetch(API)
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setDbIncidents(data.map(normalizeIncident));
        }
      })
      .catch(() => {})
      .finally(() => setLoadingDb(false));
  }, []);

  const INCIDENTS = dbIncidents.length > 0 ? dbIncidents : DEMO_INCIDENTS;

  void loadingDb;

  return (
    <DashboardLayout
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      chatOpen={chatOpen}
      setChatOpen={setChatOpen}
    >
      {/* OVERVIEW */}
      {activeTab === "overview" && (
        <DashboardOverview
          incidents={INCIDENTS}
          onShowAll={() => setActiveTab("incidents")}
          onSelectIncident={setSelectedIncident}
        />
      )}

      {/* INCIDENTS */}
      {activeTab === "incidents" && (
        <DashboardIncidents
          incidents={INCIDENTS}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          onSelectIncident={setSelectedIncident}
        />
      )}

      {/* PREDICTED */}
      {activeTab === "predicted" && <PredictedTab />}

      {/* AI */}
      {activeTab === "ai" && (
        <div className="space-y-5 animate-fade-up">
          <div>
            <h1 className="font-display text-2xl font-bold text-white uppercase">ИИ-аналитика</h1>
            <p className="text-white/30 text-sm mt-0.5">Состояние алгоритмов · Открытый код</p>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              { name: "Классификатор инцидентов", accuracy: 78, status: "active", model: "CNN v2.1", processed: "12 847" },
              { name: "Детектор аномалий", accuracy: 84, status: "active", model: "LSTM v1.8", processed: "9 203" },
              { name: "Генератор отчётов (NLP)", accuracy: 91, status: "active", model: "Transformer v3", processed: "4 512" },
            ].map((ai) => (
              <div key={ai.name} className="p-5 rounded-2xl"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(168,85,247,0.15)" }}>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: "#00ff87" }} />
                  <span className="text-white/60 text-xs font-semibold uppercase">{ai.status}</span>
                </div>
                <h3 className="text-white font-semibold text-sm mb-1">{ai.name}</h3>
                <p className="text-white/30 text-xs mb-4">{ai.model}</p>
                <div className="mb-1 flex justify-between text-xs">
                  <span className="text-white/40">Точность</span>
                  <span style={{ color: ai.accuracy >= 85 ? "#00ff87" : "#f59e0b" }}>{ai.accuracy}%</span>
                </div>
                <div className="h-2 rounded-full mb-3" style={{ background: "rgba(255,255,255,0.06)" }}>
                  <div className="h-2 rounded-full" style={{ width: `${ai.accuracy}%`, background: "linear-gradient(to right, #a855f7, #3b82f6)" }} />
                </div>
                <div className="text-white/30 text-xs">Обработано: <span className="text-white/60">{ai.processed}</span></div>
              </div>
            ))}
          </div>
          <div className="p-5 rounded-2xl" style={{ background: "rgba(0,255,135,0.04)", border: "1px solid rgba(0,255,135,0.1)" }}>
            <h3 className="font-display text-sm font-semibold text-white/70 uppercase tracking-wider mb-3">Принципы использования ИИ (ЕЦСУ 2.0)</h3>
            <div className="grid md:grid-cols-2 gap-2">
              {["Прозрачность: открытый исходный код алгоритмов", "Подотчётность: чёткая ответственность за ошибки", "Этика: запрет на слежку и дискриминацию", "Безопасность: многоуровневая защита данных", "Инклюзивность: поддержка разных языков", "Гибкость: возможность перехода на ручное управление"].map((p) => (
                <div key={p} className="flex items-start gap-2 text-xs text-white/50">
                  <Icon name="Check" size={12} style={{ color: "#00ff87" }} className="mt-0.5 shrink-0" />
                  {p}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ORGANS */}
      {activeTab === "organs" && (
        <div className="space-y-5 animate-fade-up">
          <div>
            <h1 className="font-display text-2xl font-bold text-white uppercase">Органы ЕЦСУ</h1>
            <p className="text-white/30 text-sm mt-0.5">Структура системы управления</p>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              { name: "Глобальный совет безопасности (ГСБ)", members: 45, color: "#a855f7", icon: "Shield", desc: "Стратегическое планирование, утверждение бюджета" },
              { name: "Международный суд справедливости (МС)", members: 15, color: "#3b82f6", icon: "Scale", desc: "Рассмотрение дел о нарушениях международного права" },
              { name: "Оперативная группа расследования (ОГР)", members: 120, color: "#f59e0b", icon: "Search", desc: "Фиксация фактов, сбор доказательств, расследования" },
              { name: "Силы быстрого реагирования (СБР)", members: 5000, color: "#f43f5e", icon: "Zap", desc: "Пресечение нарушений, защита гражданского населения" },
              { name: "Межпарламентский совет (МПСТУ)", members: 94, color: "#00ff87", icon: "Users", desc: "Мониторинг технологической устойчивости" },
              { name: "Комиссия по этике и науке (КЭН)", members: 24, color: "#06b6d4", icon: "Microscope", desc: "Оценка угроз, разработка стандартов ИИ" },
            ].map((org) => (
              <div key={org.name} className="p-5 rounded-2xl"
                style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${org.color}20` }}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{ background: `${org.color}15` }}>
                    <Icon name={org.icon as any} size={18} style={{ color: org.color }} />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold text-sm leading-tight">{org.name}</h3>
                    <span className="text-xs" style={{ color: org.color }}>{org.members} участников</span>
                  </div>
                </div>
                <p className="text-white/40 text-xs">{org.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Incident detail modal */}
      {selectedIncident && (
        <IncidentModal incident={selectedIncident} onClose={() => setSelectedIncident(null)} />
      )}
    </DashboardLayout>
  );
}

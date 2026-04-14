/* eslint-disable @typescript-eslint/no-explicit-any */
import Icon from "@/components/ui/icon";

const TYPE_COLORS: Record<string, string> = { ecology: "#00ff87", water: "#3b82f6", air: "#f59e0b", cyber: "#f43f5e" };
const TYPE_LABELS: Record<string, string> = { ecology: "Экология", water: "Вода", air: "Воздух", cyber: "Кибер" };
const STATUS_COLORS: Record<string, string> = { active: "#f43f5e", investigating: "#f59e0b", resolved: "#00ff87" };
const STATUS_LABELS: Record<string, string> = { active: "Активен", investigating: "Расследование", resolved: "Решён" };
const SEVERITY_COLORS: Record<string, string> = { critical: "#f43f5e", high: "#f59e0b", medium: "#3b82f6" };
const SEVERITY_LABELS: Record<string, string> = { critical: "Критический", high: "Высокий", medium: "Средний" };

type Props = {
  incidents: any[];
  statusFilter: string;
  setStatusFilter: (s: string) => void;
  onSelectIncident: (inc: any) => void;
};

export default function DashboardIncidents({ incidents, statusFilter, setStatusFilter, onSelectIncident }: Props) {
  const filtered = statusFilter === "all" ? incidents : incidents.filter((i: any) => i.status === statusFilter);

  return (
    <div className="space-y-4 animate-fade-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-white uppercase">Инциденты</h1>
          <p className="text-white/30 text-sm mt-0.5">{incidents.length} записей</p>
        </div>
        <div className="flex gap-2">
          {["all", "active", "investigating", "resolved"].map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
              style={{
                background: statusFilter === s ? "rgba(168,85,247,0.15)" : "rgba(255,255,255,0.04)",
                color: statusFilter === s ? "#a855f7" : "rgba(255,255,255,0.4)",
                border: statusFilter === s ? "1px solid rgba(168,85,247,0.3)" : "1px solid transparent",
              }}>
              {s === "all" ? "Все" : STATUS_LABELS[s]}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-2xl overflow-hidden"
        style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                {["№", "Тип", "Инцидент", "Страна", "Угроза", "Статус", "ИИ %", "Ответственный"].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-white/30 text-xs font-semibold uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((inc) => (
                <tr key={inc.id}
                  onClick={() => onSelectIncident(inc)}
                  className="transition-colors cursor-pointer"
                  style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "rgba(168,85,247,0.07)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                  <td className="px-4 py-3 text-white/30 text-xs">{inc.id}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs px-2 py-0.5 rounded-full"
                      style={{ background: `${TYPE_COLORS[inc.type]}15`, color: TYPE_COLORS[inc.type] }}>
                      {TYPE_LABELS[inc.type]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-white/80 whitespace-nowrap">{inc.title}</td>
                  <td className="px-4 py-3 text-white/50 whitespace-nowrap">{inc.country}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-semibold" style={{ color: SEVERITY_COLORS[inc.severity] }}>
                      {SEVERITY_LABELS[inc.severity]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs px-2 py-0.5 rounded-full"
                      style={{ background: `${STATUS_COLORS[inc.status]}15`, color: STATUS_COLORS[inc.status] }}>
                      {STATUS_LABELS[inc.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span style={{ color: inc.ai >= 85 ? "#00ff87" : inc.ai >= 75 ? "#f59e0b" : "#f43f5e" }}
                      className="text-sm font-semibold">{inc.ai}%</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-white/40 text-xs whitespace-nowrap">{inc.responsible}</span>
                      <Icon name="ChevronRight" size={12} className="text-purple-400 opacity-60" />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

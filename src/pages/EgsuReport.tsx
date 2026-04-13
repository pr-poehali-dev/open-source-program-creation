/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "@/components/ui/icon";

const INCIDENT_TYPES = [
  { key: "ecology", label: "Вырубка леса", icon: "Leaf", color: "#00ff87" },
  { key: "water", label: "Загрязнение воды", icon: "Droplets", color: "#3b82f6" },
  { key: "air", label: "Загрязнение воздуха", icon: "Wind", color: "#f59e0b" },
  { key: "cyber", label: "Кибератака", icon: "Shield", color: "#f43f5e" },
  { key: "human", label: "Права человека", icon: "Users", color: "#a855f7" },
  { key: "other", label: "Другое", icon: "AlertCircle", color: "#6b7280" },
];

const SEVERITIES = [
  { key: "low", label: "Низкий", color: "#6b7280" },
  { key: "medium", label: "Средний", color: "#3b82f6" },
  { key: "high", label: "Высокий", color: "#f59e0b" },
  { key: "critical", label: "Критический", color: "#f43f5e" },
];

export default function EgsuReport() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    type: "",
    severity: "",
    title: "",
    description: "",
    country: "",
    location: "",
    useGeo: false,
    photo: null as string | null,
    contact: "",
    anonymous: false,
  });
  const [submitted, setSubmitted] = useState(false);
  const [incidentId] = useState(`INC-${String(Math.floor(Math.random() * 9000) + 1000)}`);

  const handleGeo = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setForm(f => ({ ...f, location: `${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`, useGeo: true }));
      });
    }
  };

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setForm(f => ({ ...f, photo: ev.target?.result as string }));
      reader.readAsDataURL(file);
    }
  };

  const canNext1 = form.type && form.severity;
  const canNext2 = form.title && form.description && form.country;

  const handleSubmit = () => setSubmitted(true);

  if (submitted) {
    return (
      <div className="min-h-screen font-body flex items-center justify-center px-4" style={{ background: "#060a12" }}>
        <div className="max-w-sm w-full text-center animate-fade-up">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{ background: "rgba(0,255,135,0.1)", border: "2px solid rgba(0,255,135,0.3)" }}>
            <Icon name="CheckCircle" size={40} style={{ color: "#00ff87" }} />
          </div>
          <h2 className="font-display text-2xl font-bold text-white uppercase mb-2">Сообщение принято!</h2>
          <p className="text-white/40 text-sm mb-6">ИИ-система ЕГСУ обрабатывает ваше сообщение. Ответственная группа будет уведомлена в течение 2 часов.</p>
          <div className="p-4 rounded-2xl mb-6" style={{ background: "rgba(0,255,135,0.06)", border: "1px solid rgba(0,255,135,0.15)" }}>
            <div className="text-white/40 text-xs mb-1">Номер вашего обращения</div>
            <div className="font-display text-2xl font-bold" style={{ color: "#00ff87" }}>{incidentId}</div>
            <div className="text-white/30 text-xs mt-1">Сохраните для отслеживания</div>
          </div>
          <div className="flex flex-col gap-2">
            <button onClick={() => navigate("/egsu")}
              className="w-full py-3 rounded-xl font-semibold text-black text-sm"
              style={{ background: "linear-gradient(135deg, #00ff87, #3b82f6)" }}>
              На главную карту
            </button>
            <button onClick={() => { setSubmitted(false); setStep(1); setForm({ type: "", severity: "", title: "", description: "", country: "", location: "", useGeo: false, photo: null, contact: "", anonymous: false }); }}
              className="w-full py-3 rounded-xl font-semibold text-white/60 text-sm"
              style={{ background: "rgba(255,255,255,0.05)" }}>
              Подать ещё одно сообщение
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen font-body" style={{ background: "#060a12" }}>
      {/* NAV */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center gap-3 px-4 py-3"
        style={{ background: "rgba(6,10,18,0.97)", borderBottom: "1px solid rgba(244,63,94,0.15)", backdropFilter: "blur(20px)" }}>
        <button onClick={() => step > 1 ? setStep(s => s - 1) : navigate("/egsu")}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-white/40 hover:text-white transition-colors"
          style={{ background: "rgba(255,255,255,0.05)" }}>
          <Icon name="ChevronLeft" size={16} />
        </button>
        <div className="flex-1">
          <div className="font-display text-base font-bold text-white leading-none">Сообщить о нарушении</div>
          <div className="text-white/30 text-[10px]">ЕГСУ 2.0 · Шаг {step} из 3</div>
        </div>
        {/* Progress */}
        <div className="flex gap-1.5">
          {[1, 2, 3].map(n => (
            <div key={n} className="h-1.5 w-8 rounded-full transition-all"
              style={{ background: n <= step ? "#f43f5e" : "rgba(255,255,255,0.1)" }} />
          ))}
        </div>
      </nav>

      <div className="pt-16 px-4 pb-8 max-w-lg mx-auto">

        {/* STEP 1 — тип и серьёзность */}
        {step === 1 && (
          <div className="space-y-6 animate-fade-up">
            <div className="pt-4">
              <h2 className="font-display text-xl font-bold text-white uppercase">Тип нарушения</h2>
              <p className="text-white/40 text-sm mt-1">Выберите категорию инцидента</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {INCIDENT_TYPES.map((t) => (
                <button key={t.key} onClick={() => setForm(f => ({ ...f, type: t.key }))}
                  className="p-4 rounded-2xl text-left transition-all hover:scale-[1.02]"
                  style={{
                    background: form.type === t.key ? `${t.color}12` : "rgba(255,255,255,0.03)",
                    border: form.type === t.key ? `2px solid ${t.color}50` : "2px solid rgba(255,255,255,0.06)",
                  }}>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3"
                    style={{ background: `${t.color}18` }}>
                    <Icon name={t.icon as any} size={18} style={{ color: t.color }} />
                  </div>
                  <div className="text-white/80 text-sm font-medium">{t.label}</div>
                </button>
              ))}
            </div>

            <div>
              <h3 className="font-display text-sm font-semibold text-white/60 uppercase tracking-wider mb-3">Уровень угрозы</h3>
              <div className="grid grid-cols-2 gap-2">
                {SEVERITIES.map((s) => (
                  <button key={s.key} onClick={() => setForm(f => ({ ...f, severity: s.key }))}
                    className="flex items-center gap-3 p-3 rounded-xl transition-all"
                    style={{
                      background: form.severity === s.key ? `${s.color}12` : "rgba(255,255,255,0.03)",
                      border: form.severity === s.key ? `2px solid ${s.color}50` : "2px solid rgba(255,255,255,0.06)",
                    }}>
                    <div className="w-3 h-3 rounded-full" style={{ background: s.color }} />
                    <span className="text-sm font-medium" style={{ color: form.severity === s.key ? s.color : "rgba(255,255,255,0.6)" }}>
                      {s.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <button onClick={() => setStep(2)} disabled={!canNext1}
              className="w-full py-4 rounded-xl font-bold text-sm transition-all"
              style={{
                background: canNext1 ? "linear-gradient(135deg, #f43f5e, #f59e0b)" : "rgba(255,255,255,0.06)",
                color: canNext1 ? "#000" : "rgba(255,255,255,0.2)",
              }}>
              Далее →
            </button>
          </div>
        )}

        {/* STEP 2 — описание */}
        {step === 2 && (
          <div className="space-y-4 animate-fade-up">
            <div className="pt-4">
              <h2 className="font-display text-xl font-bold text-white uppercase">Описание</h2>
              <p className="text-white/40 text-sm mt-1">Опишите что произошло</p>
            </div>

            <div>
              <label className="text-white/40 text-xs mb-1.5 block font-semibold uppercase tracking-wider">Заголовок *</label>
              <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl text-sm text-white outline-none transition-all"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
                placeholder="Кратко опишите нарушение" />
            </div>

            <div>
              <label className="text-white/40 text-xs mb-1.5 block font-semibold uppercase tracking-wider">Подробное описание *</label>
              <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                rows={4}
                className="w-full px-4 py-3 rounded-xl text-sm text-white outline-none resize-none transition-all"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
                placeholder="Что произошло? Когда? Какой масштаб ущерба?" />
            </div>

            <div>
              <label className="text-white/40 text-xs mb-1.5 block font-semibold uppercase tracking-wider">Страна *</label>
              <input value={form.country} onChange={e => setForm(f => ({ ...f, country: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl text-sm text-white outline-none"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
                placeholder="Например: Россия, Бразилия..." />
            </div>

            <div>
              <label className="text-white/40 text-xs mb-1.5 block font-semibold uppercase tracking-wider">Местоположение</label>
              <div className="flex gap-2">
                <input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                  className="flex-1 px-4 py-3 rounded-xl text-sm text-white outline-none"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
                  placeholder="Адрес или координаты" />
                <button onClick={handleGeo}
                  className="px-3 py-3 rounded-xl transition-all hover:scale-105"
                  style={{ background: form.useGeo ? "rgba(0,255,135,0.15)" : "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
                  title="Определить геолокацию">
                  <Icon name="MapPin" size={16} style={{ color: form.useGeo ? "#00ff87" : "rgba(255,255,255,0.4)" }} />
                </button>
              </div>
            </div>

            <div>
              <label className="text-white/40 text-xs mb-1.5 block font-semibold uppercase tracking-wider">Фото / видео</label>
              <label className="flex flex-col items-center justify-center p-6 rounded-xl cursor-pointer transition-all hover:bg-white/3"
                style={{ background: "rgba(255,255,255,0.03)", border: "2px dashed rgba(255,255,255,0.1)" }}>
                {form.photo ? (
                  <img src={form.photo} alt="preview" className="max-h-40 rounded-lg object-cover" />
                ) : (
                  <>
                    <Icon name="Upload" size={24} className="text-white/20 mb-2" />
                    <span className="text-white/30 text-xs">Нажмите для загрузки</span>
                  </>
                )}
                <input type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
              </label>
            </div>

            <button onClick={() => setStep(3)} disabled={!canNext2}
              className="w-full py-4 rounded-xl font-bold text-sm transition-all"
              style={{
                background: canNext2 ? "linear-gradient(135deg, #f43f5e, #f59e0b)" : "rgba(255,255,255,0.06)",
                color: canNext2 ? "#000" : "rgba(255,255,255,0.2)",
              }}>
              Далее →
            </button>
          </div>
        )}

        {/* STEP 3 — контакт и отправка */}
        {step === 3 && (
          <div className="space-y-4 animate-fade-up">
            <div className="pt-4">
              <h2 className="font-display text-xl font-bold text-white uppercase">Отправка</h2>
              <p className="text-white/40 text-sm mt-1">Проверьте данные и отправьте</p>
            </div>

            {/* Preview */}
            <div className="p-4 rounded-2xl space-y-2" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
              {[
                { label: "Тип", value: INCIDENT_TYPES.find(t => t.key === form.type)?.label },
                { label: "Угроза", value: SEVERITIES.find(s => s.key === form.severity)?.label },
                { label: "Заголовок", value: form.title },
                { label: "Страна", value: form.country },
                { label: "Локация", value: form.location || "Не указана" },
              ].map(row => (
                <div key={row.label} className="flex justify-between text-sm">
                  <span className="text-white/30">{row.label}</span>
                  <span className="text-white/70 text-right max-w-[60%] truncate">{row.value}</span>
                </div>
              ))}
            </div>

            <div>
              <label className="text-white/40 text-xs mb-1.5 block font-semibold uppercase tracking-wider">Контактный email (необязательно)</label>
              <input value={form.contact} onChange={e => setForm(f => ({ ...f, contact: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl text-sm text-white outline-none"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
                placeholder="для уведомления о статусе" />
            </div>

            <button onClick={() => setForm(f => ({ ...f, anonymous: !f.anonymous }))}
              className="flex items-center gap-3 w-full p-4 rounded-xl transition-all"
              style={{ background: form.anonymous ? "rgba(168,85,247,0.08)" : "rgba(255,255,255,0.03)", border: `1px solid ${form.anonymous ? "rgba(168,85,247,0.3)" : "rgba(255,255,255,0.07)"}` }}>
              <div className="w-5 h-5 rounded flex items-center justify-center"
                style={{ background: form.anonymous ? "#a855f7" : "rgba(255,255,255,0.08)" }}>
                {form.anonymous && <Icon name="Check" size={12} className="text-white" />}
              </div>
              <div className="text-left">
                <div className="text-white/70 text-sm font-medium">Анонимная подача</div>
                <div className="text-white/30 text-xs">Ваши данные не будут переданы третьим лицам</div>
              </div>
            </button>

            <div className="p-3 rounded-xl flex items-start gap-2" style={{ background: "rgba(0,255,135,0.05)", border: "1px solid rgba(0,255,135,0.1)" }}>
              <Icon name="Info" size={14} style={{ color: "#00ff87" }} className="mt-0.5 shrink-0" />
              <p className="text-white/40 text-xs">Ваше сообщение будет обработано ИИ-системой ЕГСУ и передано ответственной группе расследования в течение 2 часов.</p>
            </div>

            <button onClick={handleSubmit}
              className="w-full py-4 rounded-xl font-bold text-black text-sm transition-all hover:scale-[1.02]"
              style={{ background: "linear-gradient(135deg, #f43f5e, #f59e0b)", boxShadow: "0 0 30px rgba(244,63,94,0.3)" }}>
              Отправить сообщение
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

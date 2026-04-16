import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "@/components/ui/icon";

const GATEWAY = "https://functions.poehali.dev/417cb87f-8717-4563-a698-6e3f5bb17500";
const AI_API = "https://functions.poehali.dev/daefa87e-0693-4de5-9191-bbc918e1d241";

const OWNER = {
  name: "Николаев Владимир Владимирович",
  email: "nikolaevvladimir77@yandex.ru",
  system: "ЕЦСУ 2.0",
  status: "Гражданин РФ, автор системы (в стадии разработки)",
};

type Tariff = {
  id: number; code: string; name_ru: string; description: string;
  price_rub: number; price_usd: number; period: string;
  features_list: string[]; is_default: boolean;
};

function parse(d: unknown) {
  if (typeof d === "string") { try { return JSON.parse(d); } catch { return d; } }
  return d;
}

const LEGAL_FUNCTIONS = [
  {
    id: "appeal", icon: "FileText", color: "#a855f7",
    title: "Обращения в ведомства",
    desc: "Составление и отправка официальных обращений в МЧС, МВД, Прокуратуру, ФСБ и другие органы РФ и международные организации",
    legal: "Конституция РФ ст. 33; ФЗ №59 «О порядке рассмотрения обращений граждан»",
    how: "Меню → Обращения в ведомства → выберите орган → опишите ситуацию → ИИ составит текст",
  },
  {
    id: "incident", icon: "AlertTriangle", color: "#f43f5e",
    title: "Подача инцидентов",
    desc: "Фиксация экологических, кибер-, гуманитарных нарушений с доказательной базой в международной системе мониторинга",
    legal: "ФЗ №7 «Об охране окружающей среды»; Орхусская конвенция; Будапештская конвенция",
    how: "Меню → Новый инцидент → заполните форму → система проверит и направит в ЕЦСУ",
  },
  {
    id: "reward", icon: "Coins", color: "#00ff87",
    title: "Запрос вознаграждения",
    desc: "Подача заявок на получение официального вознаграждения за выявление коррупции, экологических нарушений, киберугроз",
    legal: "ФЗ №273 «О противодействии коррупции»; ФЗ №7; ФЗ №149; ФЗ №68",
    how: "Меню → Вознаграждения → выберите тип → укажите реквизиты → заявка направляется в орган",
  },
  {
    id: "monitor", icon: "Radar", color: "#f59e0b",
    title: "Мониторинг бездействия",
    desc: "ИИ отслеживает ответы ведомств. При бездействии более 30 дней — автоматическая эскалация в прокуратуру с расчётом штрафа",
    legal: "КоАП РФ ст. 5.59 (штраф 5–10 тыс. руб.); УК РФ ст. 293, 285, 315",
    how: "Меню → Вознаграждения → Мониторинг бездействия → укажите ведомство и срок",
  },
  {
    id: "emergency", icon: "ShieldAlert", color: "#ef4444",
    title: "Экстренные службы",
    desc: "Контакты реальных ведомств РФ с адресами, прямыми телефонами и интернет-приёмными. Работает офлайн.",
    legal: "Работает без интернета. Звонки 112, 101, 102, 103, 104 — всегда доступны",
    how: "Меню → Экстренные службы → выберите ведомство → позвоните или напишите",
  },
  {
    id: "ai_consult", icon: "Bot", color: "#3b82f6",
    title: "ИИ-консультации",
    desc: "Юридические консультации от ИИ-администратора ЕЦСУ 2.0 по вопросам права РФ и международного законодательства",
    legal: "Носит консультационный характер. Не заменяет адвоката.",
    how: "Кнопка ИИ-чата в любом разделе → задайте вопрос → получите ответ со ссылками на законы",
  },
  {
    id: "countries", icon: "Globe", color: "#06b6d4",
    title: "Международные обращения",
    desc: "Направление обращений в ООН, ЕС, Интерпол, МУС и ведомства 10 стран-участниц системы",
    legal: "Устав ООН; ЕКПЧ; Римский статут; Будапештская конвенция",
    how: "Меню → Вознаграждения → Страны-участницы → выберите страну → отправьте обращение",
  },
  {
    id: "morse", icon: "Radio", color: "#ffc107",
    title: "Офлайн-связь (Азбука Морзе)",
    desc: "Кодировщик/декодировщик Морзе с аудио-воспроизведением для экстренной связи без интернета",
    legal: "Не требует лицензии для личного использования в экстренных ситуациях",
    how: "Меню → Экстренные службы → раздел Азбука Морзе → введите текст → воспроизведите",
  },
];

const PRIVACY_POINTS = [
  {
    icon: "Lock", color: "#22c55e",
    title: "Данные не передаются третьим лицам",
    desc: "Ваши обращения, описания инцидентов и персональные данные используются исключительно для направления в государственные органы по вашему запросу.",
  },
  {
    icon: "Eye", color: "#3b82f6",
    title: "Анонимные обращения разрешены",
    desc: "Вы можете подавать обращения анонимно. Система не требует регистрации. Данные сессии хранятся только в вашем браузере.",
  },
  {
    icon: "Database", color: "#a855f7",
    title: "Банковские реквизиты — только для выплат",
    desc: "Если вы указываете реквизиты для вознаграждения — они хранятся в зашифрованном виде и передаются только в орган, производящий выплату.",
  },
  {
    icon: "Shield", color: "#f59e0b",
    title: "Соответствие законодательству РФ",
    desc: "Система соответствует требованиям ФЗ №152 «О персональных данных» и GDPR для международных обращений.",
  },
  {
    icon: "UserX", color: "#ef4444",
    title: "Право на удаление данных",
    desc: "По запросу на nikolaevvladimir77@yandex.ru все ваши данные в системе удаляются в течение 72 часов.",
  },
  {
    icon: "Wifi", color: "#06b6d4",
    title: "Офлайн-режим — данные на вашем устройстве",
    desc: "В офлайн-режиме все данные остаются только на вашем устройстве и не передаются на серверы.",
  },
];

export default function EgsuForUsers() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<"functions" | "tariffs" | "privacy" | "legal_portal">("functions");
  const [tariffs, setTariffs] = useState<Tariff[]>([]);
  const [loading, setLoading] = useState(false);
  const [legalForm, setLegalForm] = useState({ name: "", email: "", question: "", type: "general" });
  const [legalResult, setLegalResult] = useState("");
  const [legalLoading, setLegalLoading] = useState(false);
  const [toast, setToast] = useState("");

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 3500); };

  useEffect(() => {
    if (tab === "tariffs") {
      setLoading(true);
      fetch(`${GATEWAY}/tariffs`).then(r => r.json()).then(parse)
        .then(d => setTariffs((d as { tariffs: Tariff[] }).tariffs || []))
        .finally(() => setLoading(false));
    }
  }, [tab]);

  const askLegal = async () => {
    if (!legalForm.question.trim()) return;
    setLegalLoading(true);
    try {
      const resp = await fetch(AI_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `Правовая консультация для пользователя ЕЦСУ 2.0.\nВопрос: ${legalForm.question}\nТип: ${legalForm.type}\n\nДай развёрнутый ответ с конкретными ссылками на статьи законов РФ. Если применимо — международное право. В конце укажи в какие органы можно обратиться.`,
          session_id: `user_legal_${Date.now()}`,
          history: [],
          provider: "auto",
        }),
      });
      const data = parse(await resp.json()) as { reply?: string };
      setLegalResult(data.reply || "Ошибка получения ответа");

      // Сохраняем запрос в БД
      await fetch(`${GATEWAY}/legal-request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_name: legalForm.name || "Пользователь",
          request_type: legalForm.type,
          description: legalForm.question,
          legal_basis: "",
          session_id: `user_${Date.now()}`,
        }),
      }).catch(() => {});
    } catch {
      setLegalResult("ИИ временно недоступен. Обратитесь напрямую: nikolaevvladimir77@yandex.ru");
    }
    setLegalLoading(false);
  };

  const G = (s: string) => `linear-gradient(135deg, ${s})`;

  const TABS = [
    { id: "functions", label: "⚖️ Правовые функции" },
    { id: "tariffs", label: "💳 Тарифы" },
    { id: "privacy", label: "🔒 Конфиденциальность" },
    { id: "legal_portal", label: "💬 Правовой портал" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#060a12", color: "#e0e8ff", fontFamily: "monospace" }}>
      {toast && (
        <div style={{ position: "fixed", top: 80, right: 20, zIndex: 100, background: "rgba(0,255,135,0.95)", color: "#000", padding: "12px 20px", borderRadius: 10, fontWeight: 700, fontSize: 13 }}>
          {toast}
        </div>
      )}

      <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 50, background: "rgba(6,10,18,0.98)", borderBottom: "1px solid rgba(0,255,135,0.2)", padding: "12px 20px", display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={() => navigate("/egsu/dashboard")} style={{ background: "none", border: "none", color: "#60a5fa", cursor: "pointer" }}>
          <Icon name="ChevronLeft" size={18} />
        </button>
        <div style={{ width: 32, height: 32, borderRadius: 10, background: G("#00ff87, #3b82f6"), display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon name="Users" size={16} style={{ color: "#000" }} />
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 14, letterSpacing: 2, color: "#fff" }}>ЕЦСУ 2.0 ДЛЯ ПОЛЬЗОВАТЕЛЕЙ</div>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>Правовые функции · Тарифы · Конфиденциальность</div>
        </div>
        <div style={{ marginLeft: "auto", fontSize: 12 }}>
          <a href="mailto:nikolaevvladimir77@yandex.ru" style={{ color: "#00ff87", textDecoration: "none" }}>
            ✉ {OWNER.email}
          </a>
        </div>
      </nav>

      <div style={{ paddingTop: 72, maxWidth: 900, margin: "0 auto", padding: "72px 16px 40px" }}>

        {/* Заголовок */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 28, fontWeight: 900, color: "#fff", marginBottom: 8 }}>ЕЦСУ 2.0</div>
          <div style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", marginBottom: 4 }}>Единая Центральная Система Управления</div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.3)" }}>Автор: {OWNER.name} · Гражданская инициатива · В стадии разработки</div>
        </div>

        {/* Табы */}
        <div style={{ display: "flex", gap: 8, marginBottom: 28, flexWrap: "wrap", justifyContent: "center" }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id as typeof tab)}
              style={{ background: tab === t.id ? "rgba(0,255,135,0.15)" : "rgba(255,255,255,0.03)", border: `1px solid ${tab === t.id ? "rgba(0,255,135,0.5)" : "rgba(255,255,255,0.08)"}`, borderRadius: 10, padding: "8px 18px", color: tab === t.id ? "#00ff87" : "rgba(255,255,255,0.45)", cursor: "pointer", fontWeight: tab === t.id ? 700 : 400, fontSize: 13 }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ПРАВОВЫЕ ФУНКЦИИ */}
        {tab === "functions" && (
          <div>
            <div style={{ background: "rgba(0,255,135,0.06)", border: "1px solid rgba(0,255,135,0.2)", borderRadius: 12, padding: 16, marginBottom: 24, fontSize: 13, color: "rgba(255,255,255,0.6)", lineHeight: 1.7 }}>
              <div style={{ fontWeight: 700, color: "#00ff87", marginBottom: 6 }}>Что вы можете делать в системе ЕЦСУ 2.0</div>
              Система предоставляет гражданам инструменты для реализации конституционных прав в соответствии с законодательством РФ и международным правом. Всё взаимодействие происходит от имени автора системы — <strong style={{ color: "#e0e8ff" }}>{OWNER.name}</strong>, на гражданском уровне.
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(380px, 1fr))", gap: 14 }}>
              {LEGAL_FUNCTIONS.map(f => (
                <div key={f.id} style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${f.color}20`, borderRadius: 14, padding: 18 }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 10 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: `${f.color}15`, border: `1px solid ${f.color}30`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Icon name={f.icon as "FileText"} size={18} style={{ color: f.color }} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14, color: "#fff", marginBottom: 4 }}>{f.title}</div>
                      <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", lineHeight: 1.5 }}>{f.desc}</div>
                    </div>
                  </div>
                  <div style={{ fontSize: 11, color: "#a855f7", marginBottom: 6, paddingLeft: 52 }}>⚖ {f.legal}</div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", paddingLeft: 52 }}>→ {f.how}</div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 24, padding: 16, background: "rgba(59,130,246,0.06)", border: "1px solid rgba(59,130,246,0.2)", borderRadius: 12, fontSize: 12, color: "rgba(255,255,255,0.5)", lineHeight: 1.7 }}>
              <div style={{ fontWeight: 700, color: "#60a5fa", marginBottom: 6 }}>Важно: система в стадии разработки</div>
              ЕЦСУ 2.0 является гражданской инициативой. Все обращения, инциденты и заявки на вознаграждение направляются от имени автора системы — {OWNER.name} — на правах гражданина РФ. ИИ-консультации носят информационный характер и не заменяют юридическую помощь лицензированного адвоката. Контакт: {OWNER.email}
            </div>
          </div>
        )}

        {/* ТАРИФЫ */}
        {tab === "tariffs" && (
          <div>
            {loading ? (
              <div style={{ textAlign: "center", padding: 60, color: "rgba(255,255,255,0.3)" }}>Загружаю тарифы...</div>
            ) : (
              <>
                <div style={{ textAlign: "center", marginBottom: 24 }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: "#fff", marginBottom: 6 }}>Тарифные планы ЕЦСУ 2.0</div>
                  <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)" }}>Базовый тариф — всегда бесплатно. Дополнительные возможности — от 199 ₽/мес</div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16, marginBottom: 24 }}>
                  {tariffs.map(t => {
                    const colors: Record<string, string> = { free: "#22c55e", citizen: "#3b82f6", professional: "#a855f7" };
                    const c = colors[t.code] || "#60a5fa";
                    return (
                      <div key={t.code} style={{ background: t.is_default ? "rgba(34,197,94,0.06)" : "rgba(255,255,255,0.02)", border: `2px solid ${t.is_default ? "rgba(34,197,94,0.4)" : `${c}20`}`, borderRadius: 16, padding: 20, position: "relative" }}>
                        {t.is_default && (
                          <div style={{ position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)", background: "#22c55e", color: "#000", fontSize: 10, fontWeight: 900, padding: "3px 12px", borderRadius: 20, whiteSpace: "nowrap" }}>
                            ДЛЯ ВСЕХ · БЕСПЛАТНО
                          </div>
                        )}
                        <div style={{ fontWeight: 800, fontSize: 17, color: "#fff", marginBottom: 6 }}>{t.name_ru}</div>
                        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", marginBottom: 14 }}>{t.description}</div>
                        <div style={{ marginBottom: 16 }}>
                          {t.price_rub === 0 ? (
                            <span style={{ fontSize: 28, fontWeight: 900, color: "#22c55e" }}>Бесплатно</span>
                          ) : (
                            <div>
                              <span style={{ fontSize: 28, fontWeight: 900, color: c }}>{t.price_rub.toLocaleString("ru-RU")} ₽</span>
                              <span style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginLeft: 6 }}>/ месяц</span>
                            </div>
                          )}
                        </div>
                        <div style={{ display: "grid", gap: 6, marginBottom: 16 }}>
                          {(t.features_list || []).map((f, i) => (
                            <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 12, color: "rgba(255,255,255,0.65)" }}>
                              <span style={{ color: c, flexShrink: 0, marginTop: 1 }}>✓</span>
                              <span>{f}</span>
                            </div>
                          ))}
                        </div>
                        {t.price_rub === 0 ? (
                          <div style={{ padding: "10px 16px", background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)", borderRadius: 8, textAlign: "center", fontSize: 13, fontWeight: 700, color: "#22c55e" }}>
                            Доступно прямо сейчас
                          </div>
                        ) : (
                          <a href={`mailto:${OWNER.email}?subject=Подписка ЕЦСУ 2.0 — ${t.name_ru}&body=Прошу подключить тариф «${t.name_ru}» для системы ЕЦСУ 2.0.%0A%0AМоё имя:%0AEmail:%0AТелефон:`}
                            style={{ display: "block", padding: "10px 16px", background: `${c}20`, border: `1px solid ${c}40`, borderRadius: 8, textAlign: "center", fontSize: 13, fontWeight: 700, color: c, textDecoration: "none" }}>
                            Запросить подключение →
                          </a>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div style={{ padding: 14, background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 12, fontSize: 12, color: "rgba(255,255,255,0.45)", lineHeight: 1.7 }}>
                  <strong style={{ color: "#f59e0b" }}>Об оплате:</strong> Оплата производится напрямую автору системы на реквизиты, предоставляемые по запросу на {OWNER.email}. Система в стадии разработки — возможно изменение тарифов.
                </div>
              </>
            )}
          </div>
        )}

        {/* КОНФИДЕНЦИАЛЬНОСТЬ */}
        {tab === "privacy" && (
          <div>
            <div style={{ background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: 12, padding: 20, marginBottom: 24 }}>
              <div style={{ fontWeight: 800, fontSize: 16, color: "#22c55e", marginBottom: 8 }}>Политика конфиденциальности ЕЦСУ 2.0</div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", lineHeight: 1.8 }}>
                Система ЕЦСУ 2.0 является гражданской инициативой в стадии разработки. Автор и администратор системы — <strong style={{ color: "#e0e8ff" }}>{OWNER.name}</strong>. Контакт: <a href="mailto:nikolaevvladimir77@yandex.ru" style={{ color: "#00ff87" }}>nikolaevvladimir77@yandex.ru</a>
                <br /><br />
                Используя систему, вы соглашаетесь с данной политикой. Система соответствует ФЗ №152 «О персональных данных» РФ.
              </div>
            </div>

            <div style={{ display: "grid", gap: 12, marginBottom: 24 }}>
              {PRIVACY_POINTS.map((p, i) => (
                <div key={i} style={{ display: "flex", gap: 14, padding: 16, background: "rgba(255,255,255,0.02)", border: `1px solid ${p.color}15`, borderRadius: 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: `${p.color}15`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Icon name={p.icon as "Lock"} size={16} style={{ color: p.color }} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13, color: "#fff", marginBottom: 4 }}>{p.title}</div>
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", lineHeight: 1.6 }}>{p.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ background: "rgba(168,85,247,0.06)", border: "1px solid rgba(168,85,247,0.2)", borderRadius: 12, padding: 16, fontSize: 12, color: "rgba(255,255,255,0.5)", lineHeight: 1.8 }}>
              <div style={{ fontWeight: 700, color: "#a855f7", marginBottom: 8 }}>Что система НЕ делает:</div>
              • Не продаёт ваши данные рекламодателям<br />
              • Не передаёт данные иностранным спецслужбам<br />
              • Не хранит пароли (системы паролей нет)<br />
              • Не отслеживает геолокацию без разрешения<br />
              • Не использует данные для профилирования<br /><br />
              <div style={{ fontWeight: 700, color: "#a855f7", marginBottom: 8 }}>Как удалить свои данные:</div>
              Напишите на {OWNER.email} с темой «Удаление данных ЕЦСУ». Все данные удаляются в течение 72 часов.
            </div>
          </div>
        )}

        {/* ПРАВОВОЙ ПОРТАЛ */}
        {tab === "legal_portal" && (
          <div>
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontWeight: 700, fontSize: 16, color: "#fff", marginBottom: 6 }}>Правовой портал пользователя</div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)" }}>Задайте юридический вопрос — ИИ-администратор ЕЦСУ даст ответ со ссылками на законы</div>
            </div>

            <div style={{ display: "grid", gap: 12, marginBottom: 20 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", display: "block", marginBottom: 6, textTransform: "uppercase" }}>Ваше имя (опц.)</label>
                  <input value={legalForm.name} onChange={e => setLegalForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="Имя или анонимно"
                    style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "10px 12px", color: "#fff", fontSize: 13, outline: "none" }} />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", display: "block", marginBottom: 6, textTransform: "uppercase" }}>Тип вопроса</label>
                  <select value={legalForm.type} onChange={e => setLegalForm(f => ({ ...f, type: e.target.value }))}
                    style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "10px 12px", color: "#fff", fontSize: 13, outline: "none" }}>
                    <option value="general" style={{ background: "#0d1b2e" }}>Общий правовой</option>
                    <option value="ecology" style={{ background: "#0d1b2e" }}>Экологическое право</option>
                    <option value="cyber" style={{ background: "#0d1b2e" }}>Кибербезопасность</option>
                    <option value="human_rights" style={{ background: "#0d1b2e" }}>Права человека</option>
                    <option value="corruption" style={{ background: "#0d1b2e" }}>Коррупция</option>
                    <option value="reward" style={{ background: "#0d1b2e" }}>Вознаграждение / выплаты</option>
                    <option value="emergency" style={{ background: "#0d1b2e" }}>ЧС / МЧС</option>
                    <option value="international" style={{ background: "#0d1b2e" }}>Международное право</option>
                  </select>
                </div>
              </div>
              <div>
                <label style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", display: "block", marginBottom: 6, textTransform: "uppercase" }}>Ваш вопрос *</label>
                <textarea value={legalForm.question} onChange={e => setLegalForm(f => ({ ...f, question: e.target.value }))}
                  placeholder="Опишите вашу ситуацию или задайте правовой вопрос..."
                  rows={4}
                  style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "10px 12px", color: "#fff", fontSize: 13, outline: "none", resize: "vertical" }} />
              </div>
              <button onClick={askLegal} disabled={legalLoading || !legalForm.question.trim()}
                style={{ padding: 13, background: legalLoading ? "rgba(255,255,255,0.05)" : G("#a855f7, #3b82f6"), border: "none", borderRadius: 10, color: legalLoading ? "rgba(255,255,255,0.4)" : "#fff", fontWeight: 700, fontSize: 14, cursor: legalLoading ? "wait" : "pointer" }}>
                {legalLoading ? "ИИ анализирует..." : "Получить правовую консультацию →"}
              </button>
            </div>

            {legalResult && (
              <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(168,85,247,0.2)", borderRadius: 12, padding: 20 }}>
                <div style={{ fontSize: 11, color: "#a855f7", fontWeight: 700, marginBottom: 12, textTransform: "uppercase", letterSpacing: 1 }}>Консультация ИИ-администратора ЕЦСУ 2.0</div>
                <div style={{ fontSize: 13, color: "rgba(255,255,255,0.75)", lineHeight: 1.8, whiteSpace: "pre-wrap" }}
                  dangerouslySetInnerHTML={{ __html: legalResult.replace(/\*\*(.+?)\*\*/g, '<strong style="color:#fff">$1</strong>').replace(/\n/g, '<br/>') }} />
                <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid rgba(255,255,255,0.06)", fontSize: 11, color: "rgba(255,255,255,0.3)" }}>
                  Консультация носит информационный характер. Для юридической помощи — обратитесь к лицензированному адвокату. Контакт: {OWNER.email}
                </div>
              </div>
            )}

            {/* Быстрые правовые темы */}
            <div style={{ marginTop: 24 }}>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: 2, marginBottom: 12 }}>Частые вопросы</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {[
                  "Как подать жалобу на бездействие МВД?",
                  "Как получить вознаграждение за коррупцию?",
                  "Куда жаловаться на экологическое нарушение?",
                  "Как зафиксировать кибератаку официально?",
                  "Что делать при отказе в медпомощи?",
                  "Как обратиться в Интерпол от гражданина?",
                  "Права граждан при ЧС — ФЗ №68",
                  "Международная защита прав — ЕКПЧ",
                ].map(q => (
                  <button key={q} onClick={() => setLegalForm(f => ({ ...f, question: q }))}
                    style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 8, padding: "8px 12px", color: "rgba(255,255,255,0.55)", fontSize: 12, cursor: "pointer", textAlign: "left" }}>
                    {q}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        <div style={{ marginTop: 32, textAlign: "center", fontSize: 11, color: "rgba(255,255,255,0.2)", lineHeight: 1.7 }}>
          ЕЦСУ 2.0 · Автор: {OWNER.name} · {OWNER.email}<br />
          Гражданская инициатива в стадии разработки · © 2024 · Все права защищены
        </div>
      </div>
    </div>
  );
}

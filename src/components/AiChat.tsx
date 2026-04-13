import { useState, useRef, useEffect } from "react";
import Icon from "@/components/ui/icon";

interface Message {
  role: "user" | "assistant";
  text: string;
  time: string;
}

const getTime = () => {
  const d = new Date();
  return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
};

// Встроенная база знаний ассистента ЕЦСУ
const KB: { pattern: RegExp; answer: string }[] = [
  {
    pattern: /привет|здравствуй|добрый/i,
    answer: "Добро пожаловать в систему ЕЦСУ 2.0! Я — ваш ИИ-ассистент координатора. Могу помочь с анализом инцидентов, рекомендациями по реагированию и информацией о системе. Что вас интересует?",
  },
  {
    pattern: /сколько.*инцидент|инцидент.*сколько|активн|всего инцидент/i,
    answer: "По данным на апрель 2026: всего зарегистрировано 1 247 инцидентов. Из них активных — 241 (+12% к прошлому месяцу), расследуется — 113, решено — 893. Наибольшая активность в регионах Южной Америки и Африки.",
  },
  {
    pattern: /бразили|лес|вырубк/i,
    answer: "Инцидент INC-001 'Незаконная вырубка леса' (Бразилия) — статус АКТИВЕН, угроза ВЫСОКАЯ. Уверенность ИИ: 92%. Ответственная группа: ОГР-Южная Америка. Рекомендуемые действия: уведомить природоохранные органы Бразилии, установить спутниковый мониторинг зоны, сформировать доказательный отчёт для ЮНЕП.",
  },
  {
    pattern: /рейн|германи|вода.*загрязн|загрязн.*вод/i,
    answer: "Инцидент INC-002 'Загрязнение реки Рейн' (Германия) — статус РАССЛЕДОВАНИЕ, угроза СРЕДНЯЯ. Уверенность ИИ: 87%. Группа ОГР-Европа уже проводит анализ проб воды. Приоритет — установить источник загрязнения и оповестить население вниз по течению (Нидерланды).",
  },
  {
    pattern: /норвег|кибер|атак/i,
    answer: "Инцидент INC-005 'Кибератака на инфраструктуру' (Норвегия) — статус РАССЛЕДОВАНИЕ, угроза КРИТИЧЕСКАЯ. Уверенность ИИ: 88%. Это наиболее приоритетный инцидент. Рекомендации: немедленная изоляция скомпрометированных систем, трассировка атаки, уведомление NorCERT. Правовая основа: Директива NIS2.",
  },
  {
    pattern: /нигери|нефт|разлив/i,
    answer: "Инцидент INC-006 'Нефтяной разлив' (Нигерия) — статус АКТИВЕН, угроза КРИТИЧЕСКАЯ. Уверенность ИИ: 91%. Требует немедленного реагирования! Рекомендую активировать протокол МАРПОЛ, направить группу ОГР-Африка на место, запросить ликвидационные ресурсы через ЮНЕП.",
  },
  {
    pattern: /кени|браконьер|заповедник/i,
    answer: "Инцидент INC-004 'Браконьерство в заповеднике' (Кения) — статус АКТИВЕН, угроза СРЕДНЯЯ. Уверенность ИИ: 76%. Рекомендации: уведомить Kenya Wildlife Service, оповестить местные НКО, запросить усиление патрулирования. Правовая база: CITES (Конвенция о международной торговле дикими животными).",
  },
  {
    pattern: /канада|пожар/i,
    answer: "Инцидент INC-007 'Лесные пожары' (Канада) — статус РЕШЁН. Угроза была ВЫСОКОЙ. Инцидент успешно закрыт группой ОГР-Сев. Америка. Уверенность ИИ составила 83%. Отчёт по итогам расследования доступен в архиве.",
  },
  {
    pattern: /китай|CO2|выброс|воздух/i,
    answer: "Инцидент INC-003 'Выброс CO₂ сверх нормы' (Китай) — статус РЕШЁН. Угроза была ВЫСОКОЙ, уверенность ИИ 95% — самый точный прогноз в системе. Применённые меры: инспекция источника выброса, штрафные санкции по Парижскому соглашению. Инцидент закрыт.",
  },
  {
    pattern: /индия|отход|сброс/i,
    answer: "Инцидент INC-008 'Незаконный сброс отходов' (Индия) — статус АКТИВЕН, угроза СРЕДНЯЯ. Уверенность ИИ: 79%. Ответственная группа: ОГР-Азия. Рекомендую: официальный запрос в Министерство окружающей среды Индии, пробы почвы, оповещение местных НКО.",
  },
  {
    pattern: /критическ|приоритет|срочн/i,
    answer: "Критических инцидентов сейчас 2: INC-005 (Кибератака, Норвегия) и INC-006 (Нефтяной разлив, Нигерия). Оба требуют немедленного внимания. Рекомендую перейти во вкладку 'Инциденты', выбрать фильтр и применить автоматические действия.",
  },
  {
    pattern: /uptime|доступност|работ/i,
    answer: "Текущий uptime системы ЕЦСУ 2.0: 99.9%. Задержка API: менее 48 мс. За сегодня обработано 10.2 миллиона запросов. Все подсистемы работают в штатном режиме.",
  },
  {
    pattern: /орган|совет|суд|группа реагировани/i,
    answer: "Активные органы ЕЦСУ: Глобальный совет безопасности (45 участников), Международный суд справедливости (15 судей), Оперативная группа расследования (120 агентов), Силы быстрого реагирования (5000 специалистов), Межпарламентский совет (94 представителя), Комиссия по этике и науке (24 эксперта).",
  },
  {
    pattern: /ии|искусственный интеллект|модел|нейросет/i,
    answer: "В ЕЦСУ 2.0 работают 3 ИИ-модели: 1) Классификатор инцидентов (CNN v2.1) — точность 78%, 2) Детектор аномалий (LSTM v1.8) — точность 84%, 3) Генератор отчётов NLP (Transformer v3) — точность 91%. Все модели проходят регулярный аудит прозрачности.",
  },
  {
    pattern: /закон|право|конвенц|легальн/i,
    answer: "Все действия ЕЦСУ основаны на: Парижском соглашении, Конвенции о биологическом разнообразии, Орхусской конвенции, Будапештской конвенции по киберпреступности, Директиве NIS2 (ЕС), протоколах ЮНЕП и МАРПОЛ. Принудительные меры применяются только с санкции уполномоченных органов.",
  },
  {
    pattern: /помог|что умеш|что можеш|функции/i,
    answer: "Я могу:\n• Рассказать о любом инциденте (INC-001 — INC-008)\n• Дать рекомендации по реагированию\n• Показать статистику системы\n• Объяснить правовую базу действий\n• Сообщить о критических угрозах\n• Описать органы ЕЦСУ\n\nПросто спросите меня об интересующем инциденте или теме!",
  },
  {
    pattern: /статистик|отчёт|данные|аналитик/i,
    answer: "Статистика ЕЦСУ за апрель 2026: Экология — 45 инцидентов (45%), Вода — 28 (28%), Воздух — 19 (19%), Кибер — 8 (8%). Пиковый день недели: четверг (24 инцидента). Средняя скорость реагирования — 2.3 часа. Процент успешного закрытия — 71.6%.",
  },
];

const DEFAULT_ANSWER = "Понял ваш вопрос. По данной теме у меня недостаточно информации в текущей базе знаний ЕЦСУ. Попробуйте уточнить: спросите о конкретном инциденте (например, 'расскажи про Нигерию'), статистике, органах системы или правовой базе.";

function getBotAnswer(text: string): string {
  for (const item of KB) {
    if (item.pattern.test(text)) return item.answer;
  }
  return DEFAULT_ANSWER;
}

interface Props {
  onClose: () => void;
}

export default function AiChat({ onClose }: Props) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      text: "Система ЕЦСУ 2.0 онлайн. Я — ИИ-ассистент координатора. Готов помочь с анализом инцидентов и рекомендациями по реагированию.",
      time: getTime(),
    },
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  const send = () => {
    const text = input.trim();
    if (!text) return;
    const userMsg: Message = { role: "user", text, time: getTime() };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setTyping(true);
    setTimeout(() => {
      const answer = getBotAnswer(text);
      setTyping(false);
      setMessages(prev => [...prev, { role: "assistant", text: answer, time: getTime() }]);
    }, 900 + Math.random() * 600);
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  };

  const QUICK = ["Критические инциденты", "Статистика системы", "Что ты умеешь?", "Нефтяной разлив Нигерия"];

  return (
    <div className="fixed bottom-6 right-6 z-50 w-[360px] max-w-[calc(100vw-2rem)] rounded-2xl overflow-hidden flex flex-col"
      style={{ background: "#0d1220", border: "1px solid rgba(168,85,247,0.35)", boxShadow: "0 0 40px rgba(168,85,247,0.2)", height: "520px" }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 flex-shrink-0"
        style={{ background: "linear-gradient(135deg, rgba(168,85,247,0.2), rgba(59,130,246,0.15))", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg, #a855f7, #3b82f6)" }}>
            <Icon name="Bot" size={16} className="text-white" />
          </div>
          <div>
            <div className="text-white text-sm font-bold leading-none">ИИ-ассистент ЕЦСУ</div>
            <div className="flex items-center gap-1 mt-0.5">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              <span className="text-white/40 text-[10px]">онлайн</span>
            </div>
          </div>
        </div>
        <button onClick={onClose} className="text-white/30 hover:text-white/70 transition-colors">
          <Icon name="X" size={18} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            {msg.role === "assistant" && (
              <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mr-2 mt-1"
                style={{ background: "linear-gradient(135deg, #a855f7, #3b82f6)" }}>
                <Icon name="Bot" size={12} className="text-white" />
              </div>
            )}
            <div className="max-w-[80%]">
              <div className="px-3 py-2 rounded-xl text-sm leading-relaxed whitespace-pre-wrap"
                style={{
                  background: msg.role === "user" ? "rgba(168,85,247,0.25)" : "rgba(255,255,255,0.05)",
                  color: msg.role === "user" ? "#e9d5ff" : "rgba(255,255,255,0.85)",
                  border: msg.role === "user" ? "1px solid rgba(168,85,247,0.3)" : "1px solid rgba(255,255,255,0.07)",
                  borderRadius: msg.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                }}>
                {msg.text}
              </div>
              <div className="text-white/20 text-[10px] mt-1 px-1">{msg.time}</div>
            </div>
          </div>
        ))}
        {typing && (
          <div className="flex justify-start">
            <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mr-2 mt-1"
              style={{ background: "linear-gradient(135deg, #a855f7, #3b82f6)" }}>
              <Icon name="Bot" size={12} className="text-white" />
            </div>
            <div className="px-4 py-3 rounded-xl flex items-center gap-1"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.07)" }}>
              {[0, 1, 2].map(i => (
                <div key={i} className="w-1.5 h-1.5 rounded-full bg-purple-400"
                  style={{ animation: `bounce 1s infinite ${i * 0.2}s` }} />
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Quick replies */}
      <div className="px-4 pb-2 flex gap-1.5 overflow-x-auto flex-shrink-0">
        {QUICK.map(q => (
          <button key={q} onClick={() => { setInput(q); }}
            className="text-[10px] px-2.5 py-1 rounded-full whitespace-nowrap transition-all hover:scale-105 flex-shrink-0"
            style={{ background: "rgba(168,85,247,0.12)", color: "#c084fc", border: "1px solid rgba(168,85,247,0.2)" }}>
            {q}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="px-4 pb-4 flex-shrink-0">
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Спросите об инциденте..."
            className="flex-1 bg-transparent text-white text-sm outline-none placeholder:text-white/25"
          />
          <button onClick={send} disabled={!input.trim()}
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-all hover:scale-110 disabled:opacity-30"
            style={{ background: "linear-gradient(135deg, #a855f7, #3b82f6)" }}>
            <Icon name="Send" size={13} className="text-white" />
          </button>
        </div>
      </div>

      <style>{`@keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-4px)} }`}</style>
    </div>
  );
}
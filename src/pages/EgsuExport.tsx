import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "@/components/ui/icon";

const API = "https://functions.poehali.dev/570f8cf2-4aa5-4054-a1e4-1aac6d4f345b";

const OWNER = {
  name: "Николаев Владимир Владимирович",
  email: "nikolaevvladimir77@yandex.ru",
  system: "ECSU 2.0",
};

type License = { licenses: string[]; descriptions: Record<string, string> };
type Template = { id: string; name: string; desc: string; deps: string[] };

const G = (s: string) => `linear-gradient(135deg, ${s})`;

const LICENSE_COLORS: Record<string, string> = {
  "MIT": "#22c55e",
  "Apache-2.0": "#3b82f6",
  "GPL-3.0": "#f59e0b",
  "Proprietary": "#a855f7",
};

export default function EgsuExport() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<"generator" | "license" | "setup" | "delivery">("generator");
  const [licenses, setLicenses] = useState<License | null>(null);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [apiUrl, setApiUrl] = useState<string>("");
  const [toast, setToast] = useState("");
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<{
    zip_base64?: string; zip_filename?: string; status?: string;
    files?: string[]; message?: string; instructions?: string[];
    content?: string; filename?: string; text?: string; license_type?: string;
  } | null>(null);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 3500); };

  const [form, setForm] = useState({
    project_name: "my-ecsu-project",
    version: "1.0.0",
    author: OWNER.name,
    author_email: OWNER.email,
    description: "Проект создан через ECSU 2.0 — Единая Центральная Система Управления",
    license_type: "MIT",
    github_url: "https://github.com/user/my-ecsu-project",
    python_requires: ">=3.8",
    dependencies: "Flask>=2.0.0\nJinja2>=3.0.0",
    template: "web-app",
    include_delivery: true,
  });

  // Загружаем URL функции из func2url или используем заглушку
  useEffect(() => {
    setApiUrl(API);
    Promise.all([
      fetch(`${API}/licenses`).then(r => r.json()),
      fetch(`${API}/templates`).then(r => r.json()),
    ]).then(([lic, tmpl]) => {
      const parsedLic = typeof lic === "string" ? JSON.parse(lic) : lic;
      const parsedTmpl = typeof tmpl === "string" ? JSON.parse(tmpl) : tmpl;
      if (parsedLic && !parsedLic.error) setLicenses(parsedLic);
      if (parsedTmpl?.templates) setTemplates(parsedTmpl.templates);
    }).catch(() => {});
  }, []);

  const generate = async (endpoint: string, body: object) => {
    setGenerating(true);
    setResult(null);
    try {
      const resp = await fetch(`${apiUrl}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await resp.json();
      const parsed = typeof data === "string" ? JSON.parse(data) : data;
      if (parsed.error) { showToast(`✗ ${parsed.error}`); }
      else { setResult(parsed); showToast("✓ Готово!"); }
    } catch {
      showToast("✗ Ошибка генерации");
    }
    setGenerating(false);
  };

  const generateFull = () => generate("/generate", {
    ...form,
    dependencies: form.dependencies.split("\n").map(d => d.trim()).filter(Boolean),
  });

  const generateLicense = () => generate("/license", {
    license_type: form.license_type,
    author: form.author,
    author_email: form.author_email,
  });

  const generateSetup = () => generate("/setup", {
    ...form,
    dependencies: form.dependencies.split("\n").map(d => d.trim()).filter(Boolean),
  });

  const downloadZip = () => {
    if (!result?.zip_base64 || !result?.zip_filename) return;
    const bytes = atob(result.zip_base64);
    const arr = new Uint8Array(bytes.length);
    for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
    const blob = new Blob([arr], { type: "application/zip" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = result.zip_filename; a.click();
    URL.revokeObjectURL(url);
  };

  const copyText = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast("✓ Скопировано!");
  };

  const downloadText = (content: string, filename: string) => {
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  };

  const TABS = [
    { id: "generator", label: "📦 Генератор пакета", icon: "Package" },
    { id: "license", label: "⚖️ Лицензия", icon: "FileCheck" },
    { id: "setup", label: "⚙️ setup.py", icon: "Settings" },
    { id: "delivery", label: "🚀 Доставка", icon: "Rocket" },
  ];

  const F = (label: string, key: keyof typeof form, type: "text" | "textarea" | "select" | "check" = "text", opts?: string[]) => (
    <div key={key}>
      <label style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", display: "block", marginBottom: 5, textTransform: "uppercase", letterSpacing: 1 }}>{label}</label>
      {type === "textarea" ? (
        <textarea value={form[key] as string} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
          rows={4} style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "8px 12px", color: "#fff", fontSize: 12, outline: "none", resize: "vertical" }} />
      ) : type === "select" ? (
        <select value={form[key] as string} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
          style={{ width: "100%", background: "#0d1b2e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "8px 12px", color: "#fff", fontSize: 12, outline: "none" }}>
          {opts?.map(o => <option key={o} value={o} style={{ background: "#0d1b2e" }}>{o}</option>)}
        </select>
      ) : type === "check" ? (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <input type="checkbox" checked={form[key] as boolean}
            onChange={e => setForm(f => ({ ...f, [key]: e.target.checked }))}
            style={{ width: 16, height: 16, cursor: "pointer" }} />
          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }}>Включить модуль веб-доставки (web_delivery.py)</span>
        </div>
      ) : (
        <input value={form[key] as string} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
          style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "8px 12px", color: "#fff", fontSize: 12, outline: "none" }} />
      )}
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#060a12", color: "#e0e8ff", fontFamily: "monospace" }}>
      {toast && (
        <div style={{ position: "fixed", top: 80, right: 20, zIndex: 100, background: toast.startsWith("✓") ? "rgba(0,255,135,0.95)" : "rgba(244,63,94,0.95)", color: "#000", padding: "12px 20px", borderRadius: 10, fontWeight: 700, fontSize: 13 }}>
          {toast}
        </div>
      )}

      {/* NAV */}
      <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 50, background: "rgba(6,10,18,0.98)", borderBottom: "1px solid rgba(168,85,247,0.2)", padding: "12px 20px", display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={() => navigate("/egsu/dashboard")} style={{ background: "none", border: "none", color: "#60a5fa", cursor: "pointer" }}>
          <Icon name="ChevronLeft" size={18} />
        </button>
        <div style={{ width: 32, height: 32, borderRadius: 10, background: G("#a855f7, #3b82f6"), display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon name="Package" size={16} style={{ color: "#fff" }} />
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 14, letterSpacing: 2, color: "#fff" }}>МЕНЕДЖЕР ЭКСПОРТА</div>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>ECSU 2.0 · Упаковка · Лицензии · Доставка</div>
        </div>
        <div style={{ marginLeft: "auto", fontSize: 11, color: "rgba(255,255,255,0.3)" }}>
          {OWNER.name} · <a href={`mailto:${OWNER.email}`} style={{ color: "#00ff87", textDecoration: "none" }}>{OWNER.email}</a>
        </div>
      </nav>

      <div style={{ paddingTop: 72, maxWidth: 960, margin: "0 auto", padding: "72px 16px 40px" }}>

        {/* Заголовок */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#fff", marginBottom: 6 }}>Конструктор дистрибутивов</div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", lineHeight: 1.6 }}>
            Генерация <code style={{ color: "#a855f7" }}>setup.py</code>, <code style={{ color: "#3b82f6" }}>README.md</code>, лицензий, скриптов установки и веб-доставки.
            ZIP-архив готов к публикации на GitHub или распространению.
          </div>
        </div>

        {/* Табы */}
        <div style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id as typeof tab)}
              style={{ background: tab === t.id ? "rgba(168,85,247,0.15)" : "rgba(255,255,255,0.03)", border: `1px solid ${tab === t.id ? "rgba(168,85,247,0.4)" : "rgba(255,255,255,0.08)"}`, borderRadius: 10, padding: "8px 16px", color: tab === t.id ? "#a855f7" : "rgba(255,255,255,0.45)", cursor: "pointer", fontWeight: tab === t.id ? 700 : 400, fontSize: 13 }}>
              {t.label}
            </button>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, alignItems: "start" }}>

          {/* Левая колонка — форма */}
          <div style={{ display: "grid", gap: 14 }}>

            {/* Базовые поля для всех табов */}
            {F("Название пакета / проекта", "project_name")}
            {F("Версия", "version")}
            {F("Автор", "author")}
            {F("Email автора", "author_email")}

            {(tab === "generator" || tab === "setup") && <>
              {F("Описание", "description", "textarea")}
              {F("GitHub URL", "github_url")}
              {F("Python версия (минимум)", "python_requires", "select", [">=3.8", ">=3.9", ">=3.10", ">=3.11"])}
              {F("Зависимости (по одной на строку)", "dependencies", "textarea")}
            </>}

            {F("Лицензия", "license_type", "select", ["MIT", "Apache-2.0", "GPL-3.0", "Proprietary"])}

            {tab === "generator" && <>
              {F("Шаблон проекта", "template", "select", templates.length > 0 ? templates.map(t => t.id) : ["web-app", "api-service", "data-tool", "cli-tool", "ecsu-module"])}
              {F("", "include_delivery", "check")}
            </>}

            {/* Кнопка действия */}
            {tab === "generator" && (
              <button onClick={generateFull} disabled={generating}
                style={{ padding: 14, background: generating ? "rgba(255,255,255,0.05)" : G("#a855f7, #3b82f6"), border: "none", borderRadius: 10, color: generating ? "rgba(255,255,255,0.4)" : "#fff", fontWeight: 700, fontSize: 14, cursor: generating ? "wait" : "pointer" }}>
                {generating ? "Генерирую..." : "📦 Создать ZIP-дистрибутив →"}
              </button>
            )}
            {tab === "license" && (
              <button onClick={generateLicense} disabled={generating}
                style={{ padding: 14, background: generating ? "rgba(255,255,255,0.05)" : G("#22c55e, #16a34a"), border: "none", borderRadius: 10, color: generating ? "rgba(255,255,255,0.4)" : "#fff", fontWeight: 700, fontSize: 14, cursor: generating ? "wait" : "pointer" }}>
                {generating ? "Генерирую..." : "⚖️ Создать LICENSE →"}
              </button>
            )}
            {tab === "setup" && (
              <button onClick={generateSetup} disabled={generating}
                style={{ padding: 14, background: generating ? "rgba(255,255,255,0.05)" : G("#3b82f6, #1d4ed8"), border: "none", borderRadius: 10, color: generating ? "rgba(255,255,255,0.4)" : "#fff", fontWeight: 700, fontSize: 14, cursor: generating ? "wait" : "pointer" }}>
                {generating ? "Генерирую..." : "⚙️ Создать setup.py →"}
              </button>
            )}
          </div>

          {/* Правая колонка — результат / доставка */}
          <div>
            {tab === "delivery" ? (
              <div style={{ display: "grid", gap: 14 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#fff", marginBottom: 4 }}>Способы доставки дистрибутива</div>

                {[
                  { icon: "Github", color: "#e0e8ff", title: "GitHub Releases", desc: "Загрузите ZIP в раздел Releases репозитория. Пользователи смогут скачать через pip install или wget.", cmd: "pip install git+https://github.com/user/project.git" },
                  { icon: "Globe", color: "#3b82f6", title: "PyPI (pip install)", desc: "Опубликуйте на pypi.org через twine. Самый удобный способ для Python-сообщества.", cmd: "pip install twine\ntwine upload dist/*" },
                  { icon: "Server", color: "#00ff87", title: "Веб-доставка (web_delivery.py)", desc: "Flask-сервер из пакета. Пользователи скачивают через браузер или wget.", cmd: "python builder/web_delivery.py" },
                  { icon: "Mail", color: "#a855f7", title: "Email / Telegram", desc: `Отправьте ZIP-архив напрямую. Контакт владельца: ${OWNER.email}`, cmd: `zip -r project.zip ./project/` },
                  { icon: "HardDrive", color: "#f59e0b", title: "Локальная установка", desc: "Распакуйте ZIP и запустите install.py. Работает без интернета.", cmd: "python install.py" },
                ].map((d, i) => (
                  <div key={i} style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${d.color}20`, borderRadius: 12, padding: 14 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                      <Icon name={d.icon as "Globe"} size={18} style={{ color: d.color }} />
                      <div style={{ fontWeight: 700, fontSize: 13, color: "#fff" }}>{d.title}</div>
                    </div>
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: 8, lineHeight: 1.6 }}>{d.desc}</div>
                    <div style={{ background: "rgba(0,0,0,0.4)", borderRadius: 6, padding: "8px 12px", fontSize: 11, color: "#00ff87", fontFamily: "monospace", cursor: "pointer" }}
                      onClick={() => copyText(d.cmd)}>
                      {d.cmd}
                    </div>
                  </div>
                ))}
              </div>
            ) : result ? (
              <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(168,85,247,0.2)", borderRadius: 14, padding: 20 }}>
                <div style={{ fontSize: 11, color: "#a855f7", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 14 }}>
                  ✓ {result.message || "Готово"}
                </div>

                {/* ZIP — полный пакет */}
                {result.zip_base64 && (
                  <>
                    <button onClick={downloadZip}
                      style={{ width: "100%", padding: 13, background: G("#a855f7, #3b82f6"), border: "none", borderRadius: 10, color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer", marginBottom: 14 }}>
                      ⬇ Скачать {result.zip_filename}
                    </button>

                    {result.files && (
                      <div style={{ marginBottom: 14 }}>
                        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginBottom: 8 }}>Содержимое архива ({result.files.length} файлов):</div>
                        <div style={{ display: "grid", gap: 4 }}>
                          {result.files.map(f => (
                            <div key={f} style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", display: "flex", alignItems: "center", gap: 6 }}>
                              <span style={{ color: "#a855f7" }}>▸</span> {f}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {result.instructions && (
                      <div style={{ background: "rgba(0,255,135,0.06)", border: "1px solid rgba(0,255,135,0.15)", borderRadius: 8, padding: 12 }}>
                        <div style={{ fontSize: 11, color: "#00ff87", fontWeight: 700, marginBottom: 8 }}>Инструкция по установке</div>
                        {result.instructions.map((ins, i) => (
                          <div key={i} style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", marginBottom: 4 }}>{ins}</div>
                        ))}
                      </div>
                    )}
                  </>
                )}

                {/* Одиночный файл (лицензия / setup.py) */}
                {(result.content || result.text) && (
                  <>
                    <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                      <button onClick={() => copyText(result.content || result.text || "")}
                        style={{ flex: 1, padding: 10, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "rgba(255,255,255,0.7)", cursor: "pointer", fontSize: 12 }}>
                        📋 Копировать
                      </button>
                      <button onClick={() => downloadText(result.content || result.text || "", result.filename || "file.txt")}
                        style={{ flex: 1, padding: 10, background: "rgba(168,85,247,0.1)", border: "1px solid rgba(168,85,247,0.3)", borderRadius: 8, color: "#a855f7", cursor: "pointer", fontSize: 12 }}>
                        ⬇ Скачать {result.filename}
                      </button>
                    </div>
                    <pre style={{ background: "rgba(0,0,0,0.5)", borderRadius: 8, padding: 14, fontSize: 11, color: "rgba(255,255,255,0.65)", overflow: "auto", maxHeight: 360, whiteSpace: "pre-wrap", lineHeight: 1.5 }}>
                      {result.content || result.text}
                    </pre>
                  </>
                )}
              </div>
            ) : (
              <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: 24, textAlign: "center" }}>
                <Icon name="Package" size={40} style={{ color: "rgba(255,255,255,0.1)", marginBottom: 12 }} />
                <div style={{ fontSize: 13, color: "rgba(255,255,255,0.3)", marginBottom: 8 }}>
                  Заполните форму и нажмите кнопку генерации
                </div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", lineHeight: 1.7 }}>
                  Система создаст готовый дистрибутив<br />
                  с setup.py, README, лицензией,<br />
                  скриптами установки и доставки
                </div>

                {/* Инфо о лицензиях */}
                {licenses && (
                  <div style={{ marginTop: 20, display: "grid", gap: 8, textAlign: "left" }}>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", textTransform: "uppercase", marginBottom: 4 }}>Доступные лицензии</div>
                    {licenses.licenses?.map(lic => (
                      <div key={lic} style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: 10, background: "rgba(255,255,255,0.02)", borderRadius: 8, border: `1px solid ${LICENSE_COLORS[lic] || "#fff"}20` }}>
                        <div style={{ width: 8, height: 8, borderRadius: "50%", background: LICENSE_COLORS[lic] || "#fff", marginTop: 3, flexShrink: 0 }} />
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: LICENSE_COLORS[lic] || "#fff" }}>{lic}</div>
                          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", lineHeight: 1.5 }}>{licenses.descriptions?.[lic]}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Подвал */}
        <div style={{ marginTop: 32, textAlign: "center", fontSize: 11, color: "rgba(255,255,255,0.2)", lineHeight: 1.7 }}>
          ECSU 2.0 · Менеджер экспорта · Автор: {OWNER.name} · {OWNER.email}<br />
          Гражданская инициатива в стадии разработки · © 2024 · Все права защищены
        </div>
      </div>
    </div>
  );
}
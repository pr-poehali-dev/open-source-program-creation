"""
ECSU 2.0 — Менеджер экспорта и упаковки конструктора
Управляет созданием дистрибутивов, setup.py, скриптов установки и доставки.
Автор: Николаев Владимир Владимирович
"""
import json
import os
import base64
import zipfile
import io
from datetime import datetime, timezone

try:
    import psycopg2
    from psycopg2.extras import RealDictCursor
    HAS_DB = True
except ImportError:
    HAS_DB = False

S = "t_p38294978_open_source_program_"

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-User-Id",
}

OWNER = "Николаев Владимир Владимирович"
SYSTEM = "ECSU 2.0"
EMAIL = "nikolaevvladimir77@yandex.ru"

LICENSE_TEMPLATES = {
    "MIT": """MIT License

Copyright (c) {year} {author}

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.""",

    "Apache-2.0": """Apache License
Version 2.0, January 2004

Copyright {year} {author}

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.""",

    "GPL-3.0": """GNU GENERAL PUBLIC LICENSE
Version 3, 29 June 2007

Copyright (C) {year} {author}

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU General Public License for more details.""",

    "Proprietary": """PROPRIETARY SOFTWARE LICENSE

Copyright (c) {year} {author}
All Rights Reserved.

NOTICE: This software and associated documentation files are the exclusive
property of {author}. Unauthorized copying, distribution, modification,
or use of this software, via any medium, is strictly prohibited.

Contact: {email}""",
}


def get_db():
    if not HAS_DB:
        return None
    return psycopg2.connect(os.environ["DATABASE_URL"])


def ok(data, code=200):
    return {"statusCode": code, "headers": CORS, "body": json.dumps(data, ensure_ascii=False, default=str)}


def err(msg, code=400):
    return {"statusCode": code, "headers": CORS, "body": json.dumps({"error": msg}, ensure_ascii=False)}


def generate_setup_py(project_name: str, version: str, author: str,
                      author_email: str, description: str, license_type: str,
                      github_url: str, python_requires: str, dependencies: list) -> str:
    deps_str = "\n        ".join([f'"{d}",' for d in dependencies])
    return f'''from setuptools import setup, find_packages

with open("README.md", "r", encoding="utf-8") as fh:
    long_description = fh.read()

setup(
    name="{project_name}",
    version="{version}",
    author="{author}",
    author_email="{author_email}",
    description="{description}",
    long_description=long_description,
    long_description_content_type="text/markdown",
    url="{github_url}",
    packages=find_packages(),
    classifiers=[
        "Development Status :: 4 - Beta",
        "Intended Audience :: Developers",
        "License :: OSI Approved :: {license_type} License",
        "Operating System :: OS Independent",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: {python_requires.replace(">=", "")}",
    ],
    python_requires="{python_requires}",
    install_requires=[
        {deps_str}
    ],
    include_package_data=True,
    entry_points={{
        "console_scripts": [
            "{project_name.replace("-", "_")}=app.main:main",
        ]
    }}
)
'''


def generate_readme(project_name: str, description: str, author: str,
                    author_email: str, license_type: str, github_url: str) -> str:
    return f'''# {project_name}

{description}

## Установка

```bash
pip install {project_name}
```

Или из исходников:

```bash
git clone {github_url}
cd {project_name}
pip install -e .
```

## Быстрый старт

```python
from app.main import main
main()
```

## Структура проекта

```
{project_name}/
├── app/
│   ├── __init__.py
│   └── main.py
├── builder/
│   ├── app_constructor.py
│   ├── delivery_manager.py
│   └── web_delivery.py
├── setup.py
├── README.md
└── LICENSE
```

## Требования

- Python 3.8+
- Flask >= 2.0.0

## Автор

**{author}** — {author_email}

## Лицензия

{license_type} — см. файл LICENSE

---
*Создано с помощью ECSU 2.0 — Единая Центральная Система Управления*
*{EMAIL}*
'''


def generate_app_constructor(project_name: str, author: str, license_type: str) -> str:
    return f'''"""
{project_name} — Конструктор веб-приложений
Автор: {author}
Лицензия: {license_type}
Создано через ECSU 2.0
"""
import os
import shutil
from pathlib import Path


class WebAppConstructor:
    """Основной класс конструктора веб-приложений с поддержкой лицензий и установщиков"""

    def __init__(self):
        self.current_project = None

    def create_new_project(self, project_name: str, target_path: str,
                           license_type: str = "{license_type}", author: str = "{author}"):
        """Создание нового проекта с лицензией"""
        project_path = Path(target_path) / project_name
        project_path.mkdir(parents=True, exist_ok=True)
        self.current_project = {{
            "name": project_name,
            "path": project_path,
            "license": license_type,
            "author": author,
            "components": []
        }}
        print(f"Проект {{project_name}} создан в: {{project_path}}")
        return project_path

    def export_application(self, export_path: str) -> Path:
        """Экспорт текущего проекта"""
        if not self.current_project:
            raise ValueError("Нет активного проекта")
        export_dir = Path(export_path) / self.current_project["name"]
        export_dir.mkdir(parents=True, exist_ok=True)
        if self.current_project["path"].exists():
            shutil.copytree(self.current_project["path"], export_dir, dirs_exist_ok=True)
        return export_dir


def main():
    constructor = WebAppConstructor()
    print("ECSU 2.0 — Конструктор веб-приложений")
    print(f"Автор: {author}")
    name = input("Введите название проекта: ").strip() or "{project_name}"
    path = input("Путь для создания (Enter = текущая папка): ").strip() or "."
    constructor.create_new_project(name, path)


if __name__ == "__main__":
    main()
'''


def generate_delivery_manager() -> str:
    return '''"""
delivery_manager.py — Упаковка и доставка конструктора
"""
import os
import zipfile
import shutil
import json
from pathlib import Path
from datetime import datetime


class DeliveryManager:
    """Модуль для упаковки, доставки и установки конструкторов"""

    def package_constructor(self, constructor_path: Path, output_path: Path) -> Path:
        """Упаковка конструктора в дистрибутив"""
        dist_name = f"constructor_{datetime.now().strftime(\'%Y%m%d_%H%M%S\')}"
        dist_path = output_path / dist_name
        dist_path.mkdir(parents=True, exist_ok=True)

        shutil.copytree(constructor_path, dist_path, dirs_exist_ok=True)

        meta_data = {
            "name": constructor_path.name,
            "version": "1.0.0",
            "created_at": datetime.now().isoformat(),
            "type": "web-app-constructor",
            "install_script": "install.py"
        }
        with open(dist_path / "constructor_meta.json", "w", encoding="utf-8") as f:
            json.dump(meta_data, f, indent=2, ensure_ascii=False)

        self._create_install_script(dist_path)

        zip_path = output_path / f"{dist_name}.zip"
        with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zipf:
            for root, dirs, files in os.walk(dist_path):
                for file in files:
                    file_path = Path(root) / file
                    arcname = file_path.relative_to(dist_path)
                    zipf.write(file_path, arcname)

        return zip_path

    def _create_install_script(self, dist_path: Path):
        """Создание скрипта установки"""
        install_script = \'\'\'import os
import shutil
from pathlib import Path

def install_constructor(target_path=None):
    if target_path is None:
        target_path = input("Введите путь для установки: ") or "./installed_constructor"
    target_path = Path(target_path).resolve()
    target_path.mkdir(parents=True, exist_ok=True)
    current_dir = Path(__file__).parent
    for item in current_dir.iterdir():
        if item.is_file() and item.name != "install.py":
            shutil.copy2(item, target_path / item.name)
        elif item.is_dir() and item.name not in [".git", "__pycache__"]:
            shutil.copytree(item, target_path / item.name, dirs_exist_ok=True)
    print(f"Конструктор установлен в: {target_path}")
    print("Запустите: python setup.py install")

if __name__ == "__main__":
    install_constructor()
\'\'\'
        with open(dist_path / "install.py", "w", encoding="utf-8") as f:
            f.write(install_script)
'''


def generate_web_delivery() -> str:
    return '''"""
web_delivery.py — Веб-сервис для скачивания конструкторов
"""
from flask import Flask, send_file, jsonify, abort
import os
from pathlib import Path

app = Flask(__name__)
DELIVERY_FOLDER = Path(os.environ.get("DELIVERY_FOLDER", "./deliverables"))


@app.route("/download/<filename>")
def download_constructor(filename: str):
    """Скачивание конструктора по имени файла"""
    if not filename.endswith(".zip") or "/" in filename or ".." in filename:
        abort(400)
    file_path = DELIVERY_FOLDER / filename
    if not file_path.exists():
        abort(404)
    return send_file(file_path, as_attachment=True, download_name=filename)


@app.route("/list")
def list_constructors():
    """Список доступных конструкторов"""
    if not DELIVERY_FOLDER.exists():
        return jsonify({"files": []})
    files = [
        {"name": f.name, "size": f.stat().st_size, "created": f.stat().st_ctime}
        for f in DELIVERY_FOLDER.iterdir()
        if f.suffix == ".zip"
    ]
    return jsonify({"files": files, "total": len(files)})


@app.route("/health")
def health():
    return jsonify({"status": "ok", "service": "ECSU Web Delivery"})


def start_web_delivery(host="0.0.0.0", port=5000):
    app.run(host=host, port=port)


if __name__ == "__main__":
    start_web_delivery()
'''


def build_zip_package(files: dict) -> str:
    """Создаёт ZIP-архив в памяти и возвращает base64"""
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as zf:
        for filename, content in files.items():
            zf.writestr(filename, content)
    buf.seek(0)
    return base64.b64encode(buf.read()).decode("utf-8")


def handler(event: dict, context) -> dict:
    """ECSU 2.0 — Менеджер экспорта: создание дистрибутивов, лицензий, скриптов установки."""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    method = event.get("httpMethod", "GET")
    path = event.get("path", "/")
    body = {}
    if event.get("body"):
        try:
            body = json.loads(event["body"])
        except Exception:
            pass

    # ── GET / — информация о модуле ───────────────────────────────────────────
    if method == "GET" and path in ("/", ""):
        return ok({
            "module": "ECSU Export Manager",
            "version": "1.0.0",
            "author": OWNER,
            "email": EMAIL,
            "endpoints": {
                "GET /licenses": "Список доступных лицензий",
                "POST /generate": "Генерация полного пакета (setup.py + README + скрипты)",
                "POST /license": "Только текст лицензии",
                "POST /setup": "Только setup.py",
                "GET /templates": "Шаблоны проектов",
            }
        })

    # ── GET /licenses — список лицензий ───────────────────────────────────────
    if method == "GET" and "/licenses" in path:
        return ok({
            "licenses": list(LICENSE_TEMPLATES.keys()),
            "recommended": "MIT",
            "descriptions": {
                "MIT": "Простая разрешительная лицензия. Можно использовать в коммерческих проектах.",
                "Apache-2.0": "Разрешительная с защитой патентов. Популярна в корпоративном секторе.",
                "GPL-3.0": "Copyleft — производные работы тоже должны быть открытыми.",
                "Proprietary": "Проприетарная — все права защищены. Для коммерческих систем."
            }
        })

    # ── GET /templates — шаблоны проектов ────────────────────────────────────
    if method == "GET" and "/templates" in path:
        return ok({
            "templates": [
                {"id": "web-app", "name": "Веб-приложение", "desc": "Flask + Jinja2 конструктор", "deps": ["Flask>=2.0.0", "Jinja2>=3.0.0"]},
                {"id": "api-service", "name": "API-сервис", "desc": "REST API на Flask", "deps": ["Flask>=2.0.0", "flask-restful>=0.3.9"]},
                {"id": "data-tool", "name": "Инструмент данных", "desc": "Анализ и обработка данных", "deps": ["pandas>=1.3.0", "requests>=2.25.0"]},
                {"id": "cli-tool", "name": "CLI-утилита", "desc": "Консольный инструмент", "deps": ["click>=8.0.0"]},
                {"id": "ecsu-module", "name": "Модуль ECSU 2.0", "desc": "Совместимый модуль для системы ECSU", "deps": ["psycopg2-binary>=2.9.0", "Flask>=2.0.0"]},
            ]
        })

    # ── POST /license — сгенерировать текст лицензии ─────────────────────────
    if method == "POST" and "/license" in path:
        license_type = body.get("license_type", "MIT")
        author = body.get("author", OWNER)
        email = body.get("email", EMAIL)
        year = body.get("year", str(datetime.now(timezone.utc).year))

        if license_type not in LICENSE_TEMPLATES:
            return err(f"Неизвестный тип лицензии. Доступны: {list(LICENSE_TEMPLATES.keys())}")

        text = LICENSE_TEMPLATES[license_type].format(year=year, author=author, email=email)
        return ok({"license_type": license_type, "text": text, "filename": "LICENSE"})

    # ── POST /setup — сгенерировать setup.py ─────────────────────────────────
    if method == "POST" and path.endswith("/setup"):
        project_name = body.get("project_name", "my-project")
        version = body.get("version", "1.0.0")
        author = body.get("author", OWNER)
        author_email = body.get("author_email", EMAIL)
        description = body.get("description", "Проект созданный через ECSU 2.0")
        license_type = body.get("license_type", "MIT")
        github_url = body.get("github_url", "https://github.com/user/project")
        python_requires = body.get("python_requires", ">=3.8")
        dependencies = body.get("dependencies", ["Flask>=2.0.0"])

        content = generate_setup_py(
            project_name, version, author, author_email,
            description, license_type, github_url, python_requires, dependencies
        )
        return ok({"filename": "setup.py", "content": content})

    # ── POST /generate — полный пакет дистрибутива ───────────────────────────
    if method == "POST" and "/generate" in path:
        project_name = body.get("project_name", "my-ecsu-project")
        version = body.get("version", "1.0.0")
        author = body.get("author", OWNER)
        author_email = body.get("author_email", EMAIL)
        description = body.get("description", "Проект создан через ECSU 2.0")
        license_type = body.get("license_type", "MIT")
        github_url = body.get("github_url", "https://github.com/user/project")
        python_requires = body.get("python_requires", ">=3.8")
        dependencies = body.get("dependencies", ["Flask>=2.0.0", "Jinja2>=3.0.0"])
        template = body.get("template", "web-app")
        include_delivery = body.get("include_delivery", True)

        # Собираем все файлы пакета
        year = str(datetime.now(timezone.utc).year)
        license_text = LICENSE_TEMPLATES.get(license_type, LICENSE_TEMPLATES["MIT"]).format(
            year=year, author=author, email=author_email
        )

        files = {
            "setup.py": generate_setup_py(
                project_name, version, author, author_email,
                description, license_type, github_url, python_requires, dependencies
            ),
            "README.md": generate_readme(
                project_name, description, author, author_email, license_type, github_url
            ),
            "LICENSE": license_text,
            "builder/app_constructor.py": generate_app_constructor(
                project_name, author, license_type
            ),
            "builder/__init__.py": f'"""Пакет конструктора {project_name}. Автор: {author}."""\n',
            "builder/delivery_manager.py": generate_delivery_manager(),
            "app/__init__.py": f'"""Основной модуль {project_name}."""\n',
            "app/main.py": f'''"""
{project_name} — точка входа
Автор: {author}
"""

def main():
    print("{project_name} v{version}")
    print("Автор: {author}")
    print("Создано с помощью ECSU 2.0")

if __name__ == "__main__":
    main()
''',
            "requirements.txt": "\n".join(dependencies) + "\n",
            ".gitignore": "__pycache__/\n*.pyc\n*.pyo\n.env\ndist/\nbuild/\n*.egg-info/\n",
        }

        if include_delivery:
            files["builder/web_delivery.py"] = generate_web_delivery()
            files["install.py"] = f'''"""
Скрипт установки {project_name}
"""
import shutil
from pathlib import Path

def install(target_path=None):
    if target_path is None:
        target_path = input("Путь для установки (Enter = ./installed): ").strip() or "./installed"
    target = Path(target_path).resolve()
    target.mkdir(parents=True, exist_ok=True)
    src = Path(__file__).parent
    for item in src.iterdir():
        if item.name in ["install.py", ".git", "__pycache__"]:
            continue
        if item.is_file():
            shutil.copy2(item, target / item.name)
        elif item.is_dir():
            shutil.copytree(item, target / item.name, dirs_exist_ok=True)
    print(f"✓ Установлено в: {{target}}")
    print("Запустите: pip install -e .")

if __name__ == "__main__":
    install()
'''

        # Упаковываем в ZIP
        zip_b64 = build_zip_package(files)

        # Логируем в БД (опционально)
        if HAS_DB:
            try:
                conn = get_db()
                if conn:
                    cur = conn.cursor()
                    cur.execute(f"""
                        INSERT INTO {S}.egsu_system_log (event_type, source, message, data)
                        VALUES ('export_package', 'export-manager', %s, %s)
                    """, (
                        f"Создан пакет: {project_name} v{version} ({license_type})",
                        json.dumps({"project": project_name, "license": license_type,
                                    "author": author, "template": template, "files": list(files.keys())})
                    ))
                    conn.commit()
                    conn.close()
            except Exception:
                pass

        return ok({
            "status": "success",
            "project_name": project_name,
            "version": version,
            "author": author,
            "license": license_type,
            "files_count": len(files),
            "files": list(files.keys()),
            "zip_base64": zip_b64,
            "zip_filename": f"{project_name}-{version}.zip",
            "message": f"Пакет {project_name} v{version} успешно сформирован. {len(files)} файлов.",
            "instructions": [
                f"1. Скачайте ZIP-архив {project_name}-{version}.zip",
                "2. Распакуйте в нужную директорию",
                "3. Запустите: pip install -e . (установка зависимостей)",
                "4. Запустите: python install.py (опционально, для копирования)",
                "5. Для веб-доставки: python builder/web_delivery.py",
            ]
        }, 201)

    return err("Маршрут не найден", 404)
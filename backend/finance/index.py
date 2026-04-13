"""
Финансовый модуль ЕЦСУ 2.0 — управление счетами, картами, транзакциями и правилами распределения.
"""
import json
import os
import psycopg2

S = "t_p38294978_open_source_program_"
CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
}


def conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def ok(data, code=200):
    return {"statusCode": code, "headers": CORS, "body": json.dumps(data, ensure_ascii=False, default=str)}


def err(msg, code=400):
    return {"statusCode": code, "headers": CORS, "body": json.dumps({"error": msg}, ensure_ascii=False)}


def rows(cur, cols):
    return [dict(zip(cols, r)) for r in cur.fetchall()]


def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    method = event.get("httpMethod", "GET")
    path = event.get("path", "/")
    params = event.get("queryStringParameters") or {}
    body = {}
    if event.get("body"):
        body = json.loads(event["body"])

    db = conn()
    cur = db.cursor()

    # ── GET / — сводка ──────────────────────────────────────────────────────
    if method == "GET" and path.endswith("/finance") or (method == "GET" and path == "/"):
        cur.execute(f"SELECT COUNT(*) FROM {S}.egsu_finance_accounts WHERE is_active=true")
        acc_count = cur.fetchone()[0]
        cur.execute(f"SELECT COUNT(*) FROM {S}.egsu_finance_cards WHERE is_active=true")
        card_count = cur.fetchone()[0]
        cur.execute(f"SELECT COALESCE(SUM(amount),0) FROM {S}.egsu_finance_transactions WHERE tx_type='income' AND currency='USD'")
        total_in = float(cur.fetchone()[0])
        cur.execute(f"SELECT COALESCE(SUM(amount),0) FROM {S}.egsu_finance_transactions WHERE tx_type='outcome' AND currency='USD'")
        total_out = float(cur.fetchone()[0])
        return ok({"accounts": acc_count, "cards": card_count, "total_income_usd": total_in, "total_outcome_usd": total_out})

    # ── ACCOUNTS ─────────────────────────────────────────────────────────────

    if method == "GET" and "/accounts" in path and "/accounts/" not in path:
        cur.execute(f"""
            SELECT a.id, a.owner_name, a.account_type, a.account_number, a.bank_name,
                   a.currency, a.label, a.is_active, a.is_primary,
                   a.distribution_percent, a.balance, a.created_at,
                   COUNT(c.id) as cards_count
            FROM {S}.egsu_finance_accounts a
            LEFT JOIN {S}.egsu_finance_cards c ON c.account_id = a.id AND c.is_active = true
            WHERE a.is_active = true
            GROUP BY a.id ORDER BY a.is_primary DESC, a.created_at
        """)
        cols = ["id","owner_name","account_type","account_number","bank_name",
                "currency","label","is_active","is_primary","distribution_percent","balance","created_at","cards_count"]
        return ok(rows(cur, cols))

    if method == "POST" and "/accounts" in path:
        name = body.get("owner_name","").strip()
        atype = body.get("account_type","bank")
        number = body.get("account_number","")
        bank = body.get("bank_name","")
        currency = body.get("currency","RUB")
        label = body.get("label","")
        dist = float(body.get("distribution_percent", 0))
        if not name:
            return err("owner_name обязателен")
        cur.execute(f"""
            INSERT INTO {S}.egsu_finance_accounts
              (owner_name, account_type, account_number, bank_name, currency, label, distribution_percent)
            VALUES (%s,%s,%s,%s,%s,%s,%s) RETURNING id
        """, (name, atype, number, bank, currency, label, dist))
        new_id = cur.fetchone()[0]
        db.commit()
        return ok({"id": new_id, "message": "Счёт добавлен"}, 201)

    if method == "PUT" and "/accounts/" in path:
        acc_id = int(path.split("/accounts/")[1].split("/")[0])
        sets = []
        vals = []
        for field in ["owner_name","bank_name","label","currency","distribution_percent","is_primary","is_active","balance"]:
            if field in body:
                sets.append(f"{field}=%s")
                vals.append(body[field])
        if not sets:
            return err("Нет данных для обновления")
        vals.append(acc_id)
        cur.execute(f"UPDATE {S}.egsu_finance_accounts SET {', '.join(sets)}, updated_at=NOW() WHERE id=%s", vals)
        db.commit()
        return ok({"message": "Счёт обновлён"})

    # ── CARDS ─────────────────────────────────────────────────────────────────

    if method == "GET" and "/cards" in path and "/cards/" not in path:
        acc_id = params.get("account_id")
        q = f"""
            SELECT c.id, c.account_id, c.card_holder, c.card_last4, c.card_type,
                   c.expiry_month, c.expiry_year, c.is_active, c.created_at,
                   a.label as account_label, a.bank_name
            FROM {S}.egsu_finance_cards c
            JOIN {S}.egsu_finance_accounts a ON a.id = c.account_id
            WHERE c.is_active = true
        """
        if acc_id:
            q += f" AND c.account_id = {int(acc_id)}"
        q += " ORDER BY c.created_at DESC"
        cur.execute(q)
        cols = ["id","account_id","card_holder","card_last4","card_type","expiry_month","expiry_year","is_active","created_at","account_label","bank_name"]
        return ok(rows(cur, cols))

    if method == "POST" and "/cards" in path:
        acc_id = body.get("account_id")
        holder = body.get("card_holder","").strip()
        last4 = str(body.get("card_last4","")).strip()[-4:]
        ctype = body.get("card_type","visa")
        month = body.get("expiry_month")
        year = body.get("expiry_year")
        if not acc_id or not holder or len(last4) != 4:
            return err("account_id, card_holder и card_last4 (4 цифры) обязательны")
        cur.execute(f"""
            INSERT INTO {S}.egsu_finance_cards (account_id, card_holder, card_last4, card_type, expiry_month, expiry_year)
            VALUES (%s,%s,%s,%s,%s,%s) RETURNING id
        """, (int(acc_id), holder, last4, ctype, month, year))
        new_id = cur.fetchone()[0]
        db.commit()
        return ok({"id": new_id, "message": "Карта добавлена"}, 201)

    if method == "PUT" and "/cards/" in path:
        card_id = int(path.split("/cards/")[1].split("/")[0])
        sets, vals = [], []
        for field in ["card_holder","card_type","is_active"]:
            if field in body:
                sets.append(f"{field}=%s")
                vals.append(body[field])
        if not sets:
            return err("Нет данных")
        vals.append(card_id)
        cur.execute(f"UPDATE {S}.egsu_finance_cards SET {', '.join(sets)} WHERE id=%s", vals)
        db.commit()
        return ok({"message": "Карта обновлена"})

    # ── TRANSACTIONS ──────────────────────────────────────────────────────────

    if method == "GET" and "/transactions" in path:
        acc_id = params.get("account_id")
        limit = min(int(params.get("limit", 50)), 200)
        q = f"""
            SELECT t.id, t.account_id, t.tx_type, t.amount, t.currency,
                   t.description, t.source, t.status, t.created_at,
                   a.label as account_label
            FROM {S}.egsu_finance_transactions t
            JOIN {S}.egsu_finance_accounts a ON a.id = t.account_id
        """
        if acc_id:
            q += f" WHERE t.account_id = {int(acc_id)}"
        q += f" ORDER BY t.created_at DESC LIMIT {limit}"
        cur.execute(q)
        cols = ["id","account_id","tx_type","amount","currency","description","source","status","created_at","account_label"]
        return ok(rows(cur, cols))

    if method == "POST" and "/transactions" in path:
        acc_id = body.get("account_id")
        tx_type = body.get("tx_type","income")
        amount = float(body.get("amount", 0))
        currency = body.get("currency","RUB")
        desc = body.get("description","")
        source = body.get("source","")
        if not acc_id or amount <= 0:
            return err("account_id и amount > 0 обязательны")
        cur.execute(f"""
            INSERT INTO {S}.egsu_finance_transactions
              (account_id, tx_type, amount, currency, description, source)
            VALUES (%s,%s,%s,%s,%s,%s) RETURNING id
        """, (int(acc_id), tx_type, amount, currency, desc, source))
        new_id = cur.fetchone()[0]
        # Обновляем баланс
        if tx_type == "income":
            cur.execute(f"UPDATE {S}.egsu_finance_accounts SET balance=balance+%s WHERE id=%s", (amount, int(acc_id)))
        elif tx_type == "outcome":
            cur.execute(f"UPDATE {S}.egsu_finance_accounts SET balance=balance-%s WHERE id=%s", (amount, int(acc_id)))
        db.commit()
        return ok({"id": new_id, "message": "Транзакция записана"}, 201)

    # ── RULES ─────────────────────────────────────────────────────────────────

    if method == "GET" and "/rules" in path:
        cur.execute(f"""
            SELECT r.id, r.name, r.account_id, r.percent, r.description, r.is_active,
                   a.label as account_label, a.currency
            FROM {S}.egsu_finance_rules r
            JOIN {S}.egsu_finance_accounts a ON a.id = r.account_id
            ORDER BY r.percent DESC
        """)
        cols = ["id","name","account_id","percent","description","is_active","account_label","currency"]
        return ok(rows(cur, cols))

    if method == "POST" and "/rules" in path:
        name = body.get("name","").strip()
        acc_id = body.get("account_id")
        percent = float(body.get("percent", 0))
        desc = body.get("description","")
        if not name or not acc_id or percent <= 0:
            return err("name, account_id и percent обязательны")
        cur.execute(f"""
            INSERT INTO {S}.egsu_finance_rules (name, account_id, percent, description)
            VALUES (%s,%s,%s,%s) RETURNING id
        """, (name, int(acc_id), percent, desc))
        new_id = cur.fetchone()[0]
        db.commit()
        return ok({"id": new_id, "message": "Правило добавлено"}, 201)

    return err("Маршрут не найден", 404)

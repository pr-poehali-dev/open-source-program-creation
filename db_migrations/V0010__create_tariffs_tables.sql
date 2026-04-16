CREATE TABLE IF NOT EXISTS t_p38294978_open_source_program_.egsu_tariffs (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) NOT NULL UNIQUE,
  name_ru VARCHAR(200) NOT NULL,
  description TEXT,
  price_rub NUMERIC(10,2) DEFAULT 0,
  price_usd NUMERIC(10,2) DEFAULT 0,
  period VARCHAR(20) DEFAULT 'month',
  features TEXT,
  limits_json TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  is_default BOOLEAN DEFAULT FALSE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS t_p38294978_open_source_program_.egsu_user_subscriptions (
  id SERIAL PRIMARY KEY,
  session_id VARCHAR(200),
  user_name VARCHAR(300),
  user_email VARCHAR(200),
  user_phone VARCHAR(50),
  tariff_code VARCHAR(50) DEFAULT 'free',
  status VARCHAR(50) DEFAULT 'active',
  started_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS t_p38294978_open_source_program_.egsu_legal_requests (
  id SERIAL PRIMARY KEY,
  session_id VARCHAR(200),
  user_name VARCHAR(300),
  request_type VARCHAR(100),
  description TEXT,
  country VARCHAR(10) DEFAULT 'RUS',
  agency_target VARCHAR(300),
  legal_basis TEXT,
  ai_response TEXT,
  status VARCHAR(50) DEFAULT 'pending',
  appeal_sent BOOLEAN DEFAULT FALSE,
  reward_eligible BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

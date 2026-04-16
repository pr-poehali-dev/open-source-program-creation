UPDATE t_p38294978_open_source_program_.egsu_owner_settings
SET setting_value = 'nikolaevvladimir77@yandex.ru'
WHERE setting_key = 'owner_email';

INSERT INTO t_p38294978_open_source_program_.egsu_owner_settings (setting_key, setting_value, setting_type, description)
SELECT 'owner_email', 'nikolaevvladimir77@yandex.ru', 'string', 'Email владельца для уведомлений о вознаграждениях'
WHERE NOT EXISTS (
  SELECT 1 FROM t_p38294978_open_source_program_.egsu_owner_settings WHERE setting_key = 'owner_email'
);

ALTER TABLE t_p38294978_open_source_program_.egsu_reward_requests
  ADD COLUMN IF NOT EXISTS owner_email VARCHAR(200) DEFAULT 'nikolaevvladimir77@yandex.ru';
ALTER TABLE t_p38294978_open_source_program_.egsu_reward_requests
  ADD COLUMN IF NOT EXISTS notification_sent BOOLEAN DEFAULT FALSE;

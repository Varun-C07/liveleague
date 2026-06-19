-- ============================================================================
-- Supabase pg_cron setup for the prediction lock + scoring engine.
--
-- Run this ONCE, AFTER production is live with a publicly reachable /api/cron/*
-- (Supabase cron cannot reach localhost, and the prod URL must not be behind
-- Vercel Deployment Protection for these POSTs — or use a protection-bypass
-- token in the header). Replace <SITE_URL> and <CRON_SECRET> before running.
-- ============================================================================

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Lock predictions at kickoff — every minute.
select cron.schedule('ll-lock', '* * * * *', $job$
  select net.http_post(
    url     := '<SITE_URL>/api/cron/lock',
    headers := jsonb_build_object('Authorization', 'Bearer <CRON_SECRET>')
  );
$job$);

-- Score finished matches — every 5 minutes.
select cron.schedule('ll-score', '*/5 * * * *', $job$
  select net.http_post(
    url     := '<SITE_URL>/api/cron/score',
    headers := jsonb_build_object('Authorization', 'Bearer <CRON_SECRET>')
  );
$job$);

-- Generate kickoff / full-time notifications for followed teams — every minute.
-- Idempotent (unique user_id+match_id+type), so frequent runs never duplicate.
select cron.schedule('ll-notify', '* * * * *', $job$
  select net.http_post(
    url     := '<SITE_URL>/api/cron/notify',
    headers := jsonb_build_object('Authorization', 'Bearer <CRON_SECRET>')
  );
$job$);

-- Inspect / remove:
--   select * from cron.job;
--   select cron.unschedule('ll-lock');
--   select cron.unschedule('ll-score');
--   select cron.unschedule('ll-notify');

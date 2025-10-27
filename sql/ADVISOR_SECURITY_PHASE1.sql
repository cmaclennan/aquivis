-- Security Advisor Phase 1
-- 1) Make flagged views run as security invoker (respect caller perms/RLS if used)
-- 2) Revoke direct access to views (we use Admin client in server code)
-- 3) Enable RLS on public.schedule_executions and revoke direct access

-- Set security_invoker on flagged views
ALTER VIEW public.dashboard_stats                 SET (security_invoker = true);
ALTER VIEW public.technician_today_services       SET (security_invoker = true);
ALTER VIEW public.units_optimized                 SET (security_invoker = true);
ALTER VIEW public.services_with_details           SET (security_invoker = true);
ALTER VIEW public.services_optimized              SET (security_invoker = true);
ALTER VIEW public.customers_optimized             SET (security_invoker = true);
ALTER VIEW public.properties_optimized            SET (security_invoker = true);
ALTER VIEW public.services_summary                SET (security_invoker = true);
ALTER VIEW public.compliance_summary              SET (security_invoker = true);
ALTER VIEW public.dashboard_stats_optimized       SET (security_invoker = true);

-- Lock down views (direct access not required; server uses Admin client)
REVOKE ALL ON TABLE public.dashboard_stats           FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.technician_today_services FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.units_optimized           FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.services_with_details     FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.services_optimized        FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.customers_optimized       FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.properties_optimized      FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.services_summary          FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.compliance_summary        FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.dashboard_stats_optimized FROM PUBLIC, anon, authenticated;

-- Enable RLS and lock down direct access to schedule_executions
ALTER TABLE public.schedule_executions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.schedule_executions FROM PUBLIC, anon, authenticated;

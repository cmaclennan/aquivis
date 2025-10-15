-- Lock down optimized views to authenticated users only
-- Revoke public/anon access; grant only to authenticated

REVOKE ALL ON TABLE public.dashboard_stats_optimized FROM PUBLIC, anon;
REVOKE ALL ON TABLE public.services_optimized FROM PUBLIC, anon;
REVOKE ALL ON TABLE public.properties_optimized FROM PUBLIC, anon;
REVOKE ALL ON TABLE public.units_optimized FROM PUBLIC, anon;
REVOKE ALL ON TABLE public.customers_optimized FROM PUBLIC, anon;

GRANT SELECT ON TABLE public.dashboard_stats_optimized TO authenticated;
GRANT SELECT ON TABLE public.services_optimized TO authenticated;
GRANT SELECT ON TABLE public.properties_optimized TO authenticated;
GRANT SELECT ON TABLE public.units_optimized TO authenticated;
GRANT SELECT ON TABLE public.customers_optimized TO authenticated;

-- Optional: ensure owner remains postgres and security definer is not required for simple SELECT views
-- ALTER VIEW ... OWNER TO postgres;



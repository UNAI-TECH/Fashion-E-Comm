import { useEffect } from "react";
import { Outlet, ScrollRestoration, useLocation } from "react-router";
import { trackPageView, trackSiteVisit } from "../../lib/analytics";

export function RootLayout() {
  const location = useLocation();

  useEffect(() => {
    // Track site visit for this session
    trackSiteVisit();
  }, []);

  useEffect(() => {
    // Track pageview across all routes in real-time and GA4
    trackPageView(location.pathname + location.search, document.title);
  }, [location.pathname, location.search]);

  return (
    <>
      <ScrollRestoration />
      <Outlet />
    </>
  );
}

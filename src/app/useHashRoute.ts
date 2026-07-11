import { useEffect, useState } from "react";

export type Route = "home" | "quiz" | "result";

export function useHashRoute() {
  const [route, setRoute] = useState<Route>(() => readRoute());

  useEffect(() => {
    const handleHashChange = () => {
      setRoute(readRoute());
      window.scrollTo({ top: 0 });
    };
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  function navigate(next: Route) {
    window.location.hash = next === "home" ? "#/" : `#/${next}`;
    setRoute(next);
    window.scrollTo({ top: 0 });
  }

  return { route, navigate };
}

function readRoute(): Route {
  const route = window.location.hash.replace(/^#\/?/, "") || "home";
  if (route === "quiz" || route === "result") return route;
  return "home";
}

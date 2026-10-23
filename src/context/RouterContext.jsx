import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

const RouterContext = createContext(null);

export const RouterProvider = ({ children }) => {
  const [currentPath, setCurrentPath] = useState(() => {
    if (typeof window !== "undefined") {
      return window.location.pathname || "/";
    }
    return "/";
  });

  const [queryParams, setQueryParams] = useState(() => {
    if (typeof window !== "undefined") {
      return new URLSearchParams(window.location.search);
    }
    return new URLSearchParams();
  });

  // Track in-app history to determine if valid internal back navigation is possible
  const [historyStack, setHistoryStack] = useState(() => [
    typeof window !== "undefined" ? window.location.pathname || "/" : "/",
  ]);

  // Sync state on popstate (browser Back and Forward buttons)
  useEffect(() => {
    const handlePopState = () => {
      const newPath = window.location.pathname || "/";
      setCurrentPath(newPath);
      setQueryParams(new URLSearchParams(window.location.search));
      setHistoryStack((prev) => {
        // Pop current or adjust history
        if (prev.length > 1) {
          return prev.slice(0, prev.length - 1);
        }
        return [newPath];
      });
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const navigate = useCallback((to, { replace = false, state = null } = {}) => {
    if (typeof window === "undefined") return;

    const url = new URL(to, window.location.origin);
    const targetPath = url.pathname;
    const targetSearch = url.search;

    if (replace) {
      window.history.replaceState(state, "", `${targetPath}${targetSearch}`);
      setHistoryStack((prev) => {
        const next = [...prev];
        next[next.length - 1] = targetPath;
        return next;
      });
    } else {
      window.history.pushState(state, "", `${targetPath}${targetSearch}`);
      setHistoryStack((prev) => [...prev, targetPath]);
    }

    setCurrentPath(targetPath);
    setQueryParams(new URLSearchParams(targetSearch));

    // Scroll to top on navigation unless anchor hash present
    if (!url.hash) {
      window.scrollTo(0, 0);
    }
  }, []);

  /**
   * Navigates to previous in-app route if internal history exists.
   * If user landed directly on page (no internal history), navigates to fallback route.
   */
  const goBack = useCallback((fallback = "/") => {
    if (typeof window === "undefined") return;

    if (historyStack.length > 1) {
      window.history.back();
    } else {
      navigate(fallback, { replace: true });
    }
  }, [historyStack, navigate]);

  return (
    <RouterContext.Provider
      value={{
        currentPath,
        queryParams,
        historyStack,
        hasHistory: historyStack.length > 1,
        navigate,
        goBack,
      }}
    >
      {children}
    </RouterContext.Provider>
  );
};

export const useRouter = () => {
  const context = useContext(RouterContext);
  if (!context) {
    throw new Error("useRouter must be used within a RouterProvider");
  }
  return context;
};

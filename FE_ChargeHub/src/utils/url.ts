const stripTrailingSlash = (value: string) => value.replace(/\/+$/, "");

export const getFrontendBaseUrl = (): string => {
  const envUrl =
    import.meta.env.VITE_FRONTEND_BASE_URL ||
    import.meta.env.VITE_APP_BASE_URL ||
    import.meta.env.VITE_APP_URL;

  if (envUrl && typeof envUrl === "string") {
    return stripTrailingSlash(envUrl);
  }

  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin;
  }

  return "";
};

export const buildFrontendUrl = (path: string): string => {
  const trimmedPath = path.startsWith("/") ? path : `/${path}`;
  const baseUrl = getFrontendBaseUrl();

  if (!baseUrl) {
    return trimmedPath;
  }

  return `${baseUrl}${trimmedPath}`;
};



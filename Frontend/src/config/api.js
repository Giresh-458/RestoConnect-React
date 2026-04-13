const ABSOLUTE_URL_RE = /^[a-z][a-z\d+.-]*:\/\//i;
const LOCAL_BACKEND_ORIGIN_RE = /^https?:\/\/(?:localhost|127\.0\.0\.1):3000/i;
const BACKEND_ASSET_PREFIXES = ["/uploads", "/profile-pictures", "/restaurant-images"];

const rawApiBaseUrl = (import.meta.env.VITE_API_BASE_URL || "").trim();

export const API_BASE_URL = rawApiBaseUrl.replace(/\/+$/, "");

export const toApiUrl = (value = "") => {
  if (!value) {
    return value;
  }

  if (ABSOLUTE_URL_RE.test(value)) {
    if (!LOCAL_BACKEND_ORIGIN_RE.test(value)) {
      return value;
    }

    const backendPath = value.replace(LOCAL_BACKEND_ORIGIN_RE, "") || "/";
    return API_BASE_URL ? `${API_BASE_URL}${backendPath}` : backendPath;
  }

  const normalizedPath = value.startsWith("/") ? value : `/${value}`;
  return API_BASE_URL ? `${API_BASE_URL}${normalizedPath}` : normalizedPath;
};

export const toBackendAssetUrl = (assetPath = "", folder = "uploads") => {
  if (!assetPath) {
    return assetPath;
  }

  if (ABSOLUTE_URL_RE.test(assetPath)) {
    return LOCAL_BACKEND_ORIGIN_RE.test(assetPath) ? toApiUrl(assetPath) : assetPath;
  }

  if (assetPath.startsWith("/")) {
    const isBackendAsset = BACKEND_ASSET_PREFIXES.some(
      (prefix) => assetPath === prefix || assetPath.startsWith(`${prefix}/`),
    );

    return isBackendAsset ? toApiUrl(assetPath) : assetPath;
  }

  return toApiUrl(`/${folder}/${assetPath}`);
};

import { toApiUrl } from "./api";

export const apiFetch = (input, init = {}) =>
  fetch(toApiUrl(input), {
    credentials: init.credentials || "include",
    ...init,
  });

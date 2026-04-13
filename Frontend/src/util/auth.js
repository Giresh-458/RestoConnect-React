import { redirect } from "react-router-dom";
import { apiFetch } from "../config/fetch";

export async function logout() {
  sessionStorage.clear();
  localStorage.clear();
  await apiFetch("/api/auth/logout", {
    method: "get",
  });
  // Clear the session cookie to ensure it's removed client-side
  document.cookie =
    "connect.sid=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
  return redirect("/login");
}

export async function isLogin() {
  try {
    const res = await apiFetch("/api/auth/check-session", {
      method: "get",
    });

    if (!res.ok) {
      console.error("Auth check failed", res.status, res.statusText);
      throw redirect("/login?message=Authentication check failed");
    }

    const result = await res.json();

    if (!result || !result.valid) {
      throw redirect("/login?message=Please login first");
    }

    return result.role;
  } catch (err) {
    // If it's already a redirect Response from React Router, re-throw as-is
    if (err instanceof Response) {
      throw err;
    }
    console.error("Error during isLogin:", err);
    throw redirect("/login?message=Auth service unavailable");
  }
}

// Role-specific loaders that verify both authentication AND authorization
export function requireRole(...allowedRoles) {
  return async () => {
    const role = await isLogin();
    if (!allowedRoles.includes(role)) {
      throw redirect(`/${role}?message=Access denied`);
    }
    return role;
  };
}

export const customerLoader = requireRole("customer");
export const ownerLoader = requireRole("owner");
export const staffLoader = requireRole("staff");

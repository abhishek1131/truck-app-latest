import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

export async function fetchClient(
  url: string,
  options: RequestInit = {},
  router?: AppRouterInstance
): Promise<Response> {
  try {
    const response = await fetch(url, {
      ...options,
      credentials: "include",
    });

    // Try to parse JSON for global forbidden check
    let data: any = null;
    try {
      data = await response.clone().json();
    } catch {
      // not JSON → ignore
    }

    // 🔹 Global forbidden check
    if (response.status === 403 || data?.error === "Forbidden") {
      localStorage.clear();
      if (router) {
        router.push("/login");
      } else if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
      throw new Error("Forbidden");
    }

    return response; // ✅ return Response object, not parsed JSON
  } catch (error) {
    console.error("fetchClient error:", error);
    throw error;
  }
}

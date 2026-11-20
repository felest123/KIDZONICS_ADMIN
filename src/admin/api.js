import { useCallback, useEffect, useRef, useState } from "react";
import { base44 } from "@/api/base44Client";

// Every screen talks to ONE backend function of this Admin app ("admin").
// That function checks the ADMIN role, then signs and forwards the request to
// the KidZonics main system. No keys or main-system URLs exist in this browser code.
export async function call(action, params = {}) {
  try {
    const response = await base44.functions.invoke("admin", { action, params });
    const body = response?.data;
    if (!body?.ok) throw new Error(body?.error || "Request failed");
    return body.data;
  } catch (error) {
    const message = error?.response?.data?.error || error?.message || "Request failed";
    const wrapped = new Error(message);
    wrapped.status = error?.response?.status || error?.status;
    throw wrapped;
  }
}

/** Loads `action` and exposes { data, error, loading, reload }. */
export function useAdminData(action, params = {}, { refreshMs = 0 } = {}) {
  const key = JSON.stringify(params);
  const [state, setState] = useState({ data: null, error: "", loading: true });
  const alive = useRef(true);

  const reload = useCallback(async () => {
    setState((s) => ({ ...s, loading: true }));
    try {
      const data = await call(action, JSON.parse(key));
      if (alive.current) setState({ data, error: "", loading: false });
    } catch (error) {
      if (alive.current) setState((s) => ({ ...s, error: error.message, loading: false }));
    }
  }, [action, key]);

  useEffect(() => {
    alive.current = true;
    reload();
    const id = refreshMs ? window.setInterval(reload, refreshMs) : 0;
    return () => {
      alive.current = false;
      if (id) window.clearInterval(id);
    };
  }, [reload, refreshMs]);

  return { ...state, reload };
}

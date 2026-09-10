import { useCallback, useEffect, useRef } from "react";

export const isAbortError = (error: unknown): boolean =>
  (error instanceof DOMException && error.name === "AbortError") ||
  (error instanceof Error && error.name === "AbortError");

type UseAbortControllerOptions = {
  autoAbort?: boolean;
};

export const useAbortController = (
  options: UseAbortControllerOptions = {},
) => {
  const { autoAbort = true } = options;
  const controllerRef = useRef<AbortController | null>(null);

  const abort = useCallback(() => {
    if (controllerRef.current) {
      controllerRef.current.abort();
      controllerRef.current = null;
    }
  }, []);

  const renew = useCallback(() => {
    abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    return controller;
  }, [abort]);

  useEffect(() => {
    if (!autoAbort) return;
    return () => {
      if (controllerRef.current) {
        controllerRef.current.abort();
        controllerRef.current = null;
      }
    };
  }, [autoAbort]);

  return {
    controller: controllerRef.current,
    signal: controllerRef.current?.signal,
    abort,
    renew,
  };
};

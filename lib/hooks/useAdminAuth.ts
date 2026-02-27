"use client";

import { useState, useEffect } from "react";

const ADMIN_PASSWORD_KEY = "admin_auth_v1";

/**
 * Hook que maneja la autenticación simple del admin.
 * La contraseña se lee de NEXT_PUBLIC_ADMIN_PASSWORD (o fallback "admin1234").
 * El estado se persiste en sessionStorage (se cierra al cerrar el navegador).
 */
export function useAdminAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null); // null = cargando

  useEffect(() => {
    const stored = sessionStorage.getItem(ADMIN_PASSWORD_KEY);
    setIsAuthenticated(stored === "true");
  }, []);

  const login = (password: string): boolean => {
    const correctPassword =
      process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "admin1234";
    if (password === correctPassword) {
      sessionStorage.setItem(ADMIN_PASSWORD_KEY, "true");
      setIsAuthenticated(true);
      return true;
    }
    return false;
  };

  const logout = () => {
    sessionStorage.removeItem(ADMIN_PASSWORD_KEY);
    setIsAuthenticated(false);
  };

  return { isAuthenticated, login, logout };
}

"use client";

import { useState } from "react";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Props {
  onLogin: (password: string) => boolean;
}

export function AdminLoginScreen({ onLogin }: Props) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(false);

    setTimeout(() => {
      const ok = onLogin(password);
      if (!ok) {
        setError(true);
        setPassword("");
      }
      setIsLoading(false);
    }, 400);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4">
      <Card className="w-full max-w-sm border-zinc-800 bg-zinc-900/50">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-orange-600/20">
            <Lock className="h-7 w-7 text-orange-500" />
          </div>
          <CardTitle className="text-2xl font-black text-white">Dashboard Admin</CardTitle>
          <p className="text-sm text-zinc-400">Ingresá la contraseña para continuar</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError(false);
              }}
              placeholder="Contraseña"
              autoFocus
              className={`border-zinc-700 bg-zinc-800 text-white ${error ? "border-red-500" : ""}`}
            />
            {error && (
              <p className="text-sm text-red-400">Contraseña incorrecta. Intentá de nuevo.</p>
            )}
            <Button
              type="submit"
              disabled={isLoading || !password}
              className="w-full bg-orange-600 hover:bg-orange-700 disabled:opacity-50"
            >
              {isLoading ? "Verificando…" : "Ingresar"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

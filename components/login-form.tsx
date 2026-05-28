'use client';

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Field,
  FieldGroup,
  FieldSeparator,
} from "@/components/ui/field"
import { useRouter } from "next/navigation"
import { useRole } from "@/app/context/RoleContext"
import { toast } from "sonner"
import { useEffect, useState } from "react"
import { Fingerprint, KeyRound, LogIn } from "lucide-react"
import { ForgotPasswordForm } from "./forgot-password-form"
import { FirstPasswordForm } from "./first-password-form"
import {
  describePasskeyError,
  hasPlatformAuthenticator,
  isPasskeySupported,
} from "@/lib/passkey"

interface LoginFormProps extends React.ComponentProps<"form"> {
  onModeChange?: (isSpecialMode: boolean) => void;
}

export function LoginForm({
  className,
  onModeChange,
  ...props
}: LoginFormProps) {
  const { login, loginWithPasskey, isLoading } = useRole();
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showFirstPassword, setShowFirstPassword] = useState(false);
  const [passkeyAvailable, setPasskeyAvailable] = useState(false);
  const [passkeyLoading, setPasskeyLoading] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!isPasskeySupported()) return;
      const ok = await hasPlatformAuthenticator();
      if (active) setPasskeyAvailable(ok);
    })();
    return () => {
      active = false;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username || !password) {
      toast.error('Kérlek add meg a felhasználónevet és a jelszót!');
      return;
    }

    try {
      await login(username, password);
      toast.success('Sikeres bejelentkezés!');
      router.replace('/dashboard');
    } catch (error) {
      const errorMessage = (error as Error)?.message || 'Bejelentkezési hiba';
      toast.error(errorMessage);
      console.error('Login error:', error);
    }
  };

  const handlePasskeyLogin = async () => {
    if (passkeyLoading || isLoading) return;
    setPasskeyLoading(true);
    try {
      await loginWithPasskey(username || undefined);
      toast.success('Sikeres bejelentkezés!');
      router.replace('/dashboard');
    } catch (error) {
      toast.error(describePasskeyError(error));
    } finally {
      setPasskeyLoading(false);
    }
  };

  const handleForgotPassword = () => {
    setShowForgotPassword(true);
    onModeChange?.(true);
  };

  const handleFirstPassword = () => {
    setShowFirstPassword(true);
    onModeChange?.(true);
  };

  const handleBackToLogin = () => {
    setShowForgotPassword(false);
    setShowFirstPassword(false);
    setUsername('');
    setPassword('');
    onModeChange?.(false);
  };

  if (showForgotPassword) {
    return (
      <ForgotPasswordForm
        className={className}
        onBack={handleBackToLogin}
      />
    );
  }

  if (showFirstPassword) {
    return (
      <FirstPasswordForm
        className={className}
        onBack={handleBackToLogin}
      />
    );
  }

  return (
    <form
      className={cn("flex flex-col gap-6", className)}
      onSubmit={handleSubmit}
      {...props}
    >
      <FieldGroup>
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-2xl font-bold">Bejelentkezés</h1>
          <p className="text-muted-foreground text-sm text-balance">
            Add meg a felhasználóneved vagy e-mail címed és jelszavad
          </p>
        </div>

        {passkeyAvailable && (
          <>
            <Field>
              <Button
                type="button"
                variant="default"
                size="lg"
                disabled={passkeyLoading || isLoading}
                onClick={handlePasskeyLogin}
                className="w-full"
              >
                <Fingerprint className="mr-2 h-4 w-4" />
                {passkeyLoading ? 'Hitelesítés…' : 'Bejelentkezés jelkulccsal'}
              </Button>
              <p className="text-muted-foreground mt-1 text-center text-xs">
                Touch ID, Windows Hello vagy biometrikus hitelesítő használata.
              </p>
            </Field>
            <FieldSeparator className="*:data-[slot=field-separator-content]:bg-background">
              vagy jelszóval
            </FieldSeparator>
          </>
        )}

        <Field>
          <Label htmlFor="username">Felhasználónév vagy E-mail cím</Label>
          <Input
            id="username"
            type="text"
            placeholder="felhasználónév vagy e-mail"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={isLoading}
            required
            autoComplete="username"
          />
        </Field>

        <Field>
          <Label htmlFor="password">Jelszó</Label>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
            required
            autoComplete="current-password"
          />
        </Field>

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full"
          size="lg"
        >
          {isLoading ? (
            <>Bejelentkezés...</>
          ) : (
            <>
              <LogIn className="mr-2 h-4 w-4" />
              Bejelentkezés
            </>
          )}
        </Button>

        <FieldSeparator className="*:data-[slot=field-separator-content]:bg-background">
          vagy
        </FieldSeparator>

        <Field>
          <Button
            variant="outline"
            type="button"
            onClick={handleFirstPassword}
          >
            <KeyRound className="mr-2 h-4 w-4" />
            Még nincs jelszavam
          </Button>
        </Field>

        <div className="text-center">
          <Button
            type="button"
            variant="link"
            onClick={handleForgotPassword}
            className="text-sm text-muted-foreground hover:text-primary transition-colors duration-200"
          >
            Elfelejtett jelszó?
          </Button>
        </div>
      </FieldGroup>
    </form>
  )
}

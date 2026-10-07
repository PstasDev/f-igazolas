"use client"

import Link from "next/link"
import Image from "next/image"
import { useEffect, useState, lazy, Suspense } from "react"
import { useRouter } from "next/navigation"
import { LoginForm } from "@/components/login-form"
import { useRole } from "@/app/context/RoleContext"
import { useTheme } from "@/app/context/ThemeContext"
import { Spinner } from "@/components/ui/spinner"
import { toast } from "sonner"

// Lazy load Hyperspeed to reduce initial bundle size
const Hyperspeed = lazy(() => import("@/components/Hyperspeed"))

const SSO_ERROR_MESSAGES: Record<string, string> = {
  sso_not_configured: 'Az SSO-bejelentkezés még nincs konfigurálva.',
  sso_unavailable: 'Az SSO-szolgáltatás jelenleg nem érhető el.',
  sso_invalid_state: 'A bejelentkezési kérés lejárt vagy érvénytelen. Próbáld újra.',
  sso_cancelled: 'A központi bejelentkezést megszakítottad.',
  sso_email_not_verified: 'Az SZLG+ fiók e-mail-címe nincs megerősítve.',
  sso_account_not_linked: 'Ehhez az SZLG+ fiókhoz nem található egyértelmű helyi felhasználó.',
  sso_account_disabled: 'A helyi felhasználói fiók le van tiltva.',
  sso_token_rejected: 'Az SZLG+ elutasította az alkalmazás klienshitelesítését. Ellenőrizd az SSO kliens beállításait.',
  sso_exchange_failed: 'A bejelentkezés nem fejeződött be. Próbáld újra.',
  sso_failed: 'Az SSO-bejelentkezés sikertelen. Próbáld újra.',
}

export default function LoginPage() {
  const { isAuthenticated, isLoading } = useRole()
  const { isDark } = useTheme()
  const router = useRouter()
  const [shouldRender, setShouldRender] = useState(false)
  const [isSpecialMode, setIsSpecialMode] = useState(false)

  useEffect(() => {
    const url = new URL(window.location.href)
    const ssoError = url.searchParams.get('sso_error')
    if (ssoError) {
      toast.error(SSO_ERROR_MESSAGES[ssoError] || SSO_ERROR_MESSAGES.sso_failed)
      url.searchParams.delete('sso_error')
      window.history.replaceState(null, '', url.toString())
    }

    // Only check authentication after loading is complete
    if (!isLoading) {
      if (isAuthenticated) {
        const params = new URLSearchParams(window.location.search)
        const editId = params.get('editIgazolas')
        router.replace(editId ? `/dashboard?editIgazolas=${editId}` : '/dashboard')
      } else {
        setShouldRender(true)
      }
    }
  }, [isAuthenticated, isLoading, router])

  // Show loading while checking auth status or during login
  if (isLoading || !shouldRender) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Spinner className="w-8 h-8" />
      </div>
    )
  }

  // Custom colors for first password and forgot password modes
  const specialModeColors = {
    roadColor: 0x080808,
    islandColor: 0x0a0a0a,
    background: 0x000000,
    shoulderLines: 0x131318,
    brokenLines: 0x131318,
    leftCars: [0xff102a, 0xeb383e, 0xff102a],
    rightCars: [0xdadafa, 0xbebae3, 0x8f97e4],
    sticks: 0xdadafa
  }

  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
          <Link href="/" className="flex items-center gap-2 font-medium">
            <Image
              src="/logo.svg"
              alt="Szent László Gimnázium"
              width={32}
              height={32}
              className="w-8 h-8 md:w-8 md:h-8 transition-all"
              priority
              style={
                isDark
                  ? { filter: 'brightness(0) saturate(100%) invert(100%)' }
                  : { filter: 'brightness(0) saturate(100%) invert(19%) sepia(9%) saturate(879%) hue-rotate(137deg) brightness(95%) contrast(91%)' }
              }
            />
            <span className="font-serif">Igazoláskezelő</span>
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">
            <LoginForm onModeChange={setIsSpecialMode} />
          </div>
        </div>
        <div className="text-center text-xs text-muted-foreground space-y-1">
          <div className="flex items-center justify-center gap-3">
            <Link href="/utmutato/tanuloi" className="hover:underline hover:text-foreground transition-colors">
              Tanulói útmutató
            </Link>
            <span>•</span>
            <Link href="/utmutato/osztalyfonoki" className="hover:underline hover:text-foreground transition-colors">
              Osztályfőnöki útmutató
            </Link>
          </div>
        </div>
      </div>
      <div className="bg-black relative hidden lg:block overflow-hidden lg:sticky lg:top-0 lg:h-svh lg:self-start">
        <div className="absolute inset-0 w-full h-full overflow-hidden">
          <Suspense fallback={<div className="w-full h-full bg-black" />}>
            <Hyperspeed 
              effectOptions={
                isSpecialMode ? {
                  colors: specialModeColors
                } : {}
              }/>
          </Suspense>
          <div className="absolute inset-0 flex h-full items-center justify-center p-10 bg-black/30 z-10">
            <div className="max-w-md text-white">
              <h2 className="text-3xl font-bold mb-4 font-serif">Szent László Gimnázium</h2>
              <p className="text-lg mb-4">F Tagozat - Igazoláskezelő Rendszer</p>
              <p className="text-white/80">
                Digitális igazoláskezelő rendszer az F tagozat diákjai és osztályfőnökei számára.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

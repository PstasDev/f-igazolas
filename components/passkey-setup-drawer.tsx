"use client"

/**
 * Bottom drawer that prompts the user — *once*, after login — to set up a
 * passkey for passwordless sign-in.
 */

import * as React from "react"
import { Fingerprint, Loader2, ShieldCheck } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import { apiClient } from "@/lib/api"
import {
  describePasskeyError,
  enrollPasskey,
  hasPlatformAuthenticator,
  isPasskeySupported,
} from "@/lib/passkey"
import { haptics } from "@/lib/haptics"

const DISMISS_KEY = "passkey_setup_dismissed"

function defaultPasskeyName(): string {
  if (typeof navigator === "undefined") return "Passkey"
  const ua = navigator.userAgent
  if (/iPhone|iPad|iPod/i.test(ua)) return "iPhone / iPad"
  if (/Mac/i.test(ua)) return "Mac"
  if (/Windows/i.test(ua)) return "Windows eszköz"
  if (/Android/i.test(ua)) return "Android telefon"
  return "Eszköz"
}

export function PasskeySetupDrawer() {
  const [open, setOpen] = React.useState(false)
  const [submitting, setSubmitting] = React.useState(false)
  const checkRanRef = React.useRef(false)

  React.useEffect(() => {
    if (checkRanRef.current) return
    checkRanRef.current = true

    let cancelled = false

    const check = async () => {
      try {
        if (!isPasskeySupported()) return
        const hasPlatform = await hasPlatformAuthenticator()
        if (!hasPlatform) return

        if (typeof window !== "undefined" && window.localStorage.getItem(DISMISS_KEY) === "true") {
          return
        }

        const { has_passkey } = await apiClient.listPasskeys()
        if (cancelled) return
        if (!has_passkey) setOpen(true)
      } catch (err) {
        console.debug("PasskeySetupDrawer probe failed:", err)
      }
    }

    void check()
    return () => {
      cancelled = true
    }
  }, [])

  const handleDismiss = () => {
    try {
      window.localStorage.setItem(DISMISS_KEY, "true")
    } catch {
      /* ignore */
    }
    setOpen(false)
  }

  const handleEnroll = async () => {
    if (submitting) return
    setSubmitting(true)
    try {
      await enrollPasskey(defaultPasskeyName())
      haptics.thud()
      try {
        window.localStorage.removeItem(DISMISS_KEY)
      } catch {
        /* ignore */
      }
      toast.success("Passkey beállítva", {
        description:
          "Legközelebb biometrikusan léphetsz be az eszközöd hitelesítőjével.",
      })
      setOpen(false)
    } catch (err) {
      toast.error("Nem sikerült beállítani a jelkulcsot", {
        description: describePasskeyError(err),
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Drawer open={open} onOpenChange={(next) => !submitting && setOpen(next)}>
      <DrawerContent>
        <div className="mx-auto w-full max-w-md">
          <DrawerHeader>
            <div className="bg-primary/10 text-primary mx-auto mb-2 flex size-12 items-center justify-center rounded-full">
              <Fingerprint className="size-6" />
            </div>
            <DrawerTitle className="text-center">Állíts be egy jeulkulcsot</DrawerTitle>
            <DrawerDescription className="text-center">
              Lépj be jelszó nélkül a Touch ID, Windows Hello, vagy az eszközöd
              biometrikus hitelesítőjével. Gyorsabb és biztonságosabb a jelszónál.
            </DrawerDescription>
          </DrawerHeader>

          <div className="text-muted-foreground flex flex-col gap-2 px-4 text-sm">
            <div className="flex items-start gap-2">
              <ShieldCheck className="text-primary mt-0.5 size-4 shrink-0" />
              <span>Az eszközöd biometrikus adatai sosem hagyják el a készüléket.</span>
            </div>
            <div className="flex items-start gap-2">
              <ShieldCheck className="text-primary mt-0.5 size-4 shrink-0" />
              <span>Bármikor törölheted a Beállítások &gt; Fiók menüpontban.</span>
            </div>
          </div>

          <DrawerFooter>
            <Button onClick={handleEnroll} disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Beállítás folyamatban…
                </>
              ) : (
                <>
                  <Fingerprint className="size-4" />
                  Jelkulcs beállítása
                </>
              )}
            </Button>
            <Button variant="ghost" onClick={handleDismiss} disabled={submitting}>
              Most nem
            </Button>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  )
}

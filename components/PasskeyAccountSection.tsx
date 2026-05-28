"use client"

import * as React from "react"
import { Fingerprint, Loader2, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item"
import { apiClient } from "@/lib/api"
import {
  describePasskeyError,
  enrollPasskey,
  hasPlatformAuthenticator,
  isPasskeySupported,
} from "@/lib/passkey"

interface PasskeyEntry {
  id: number
  name: string
  created_at: string
  last_used_at: string | null
}

function defaultName(): string {
  if (typeof navigator === "undefined") return "Passkey"
  const ua = navigator.userAgent
  if (/iPhone|iPad|iPod/i.test(ua)) return "iPhone / iPad"
  if (/Mac/i.test(ua)) return "Mac"
  if (/Windows/i.test(ua)) return "Windows eszköz"
  if (/Android/i.test(ua)) return "Android telefon"
  return "Eszköz"
}

function formatDate(value: string | null): string {
  if (!value) return "Sosem"
  try {
    return new Date(value).toLocaleString("hu-HU")
  } catch {
    return value
  }
}

export function PasskeyAccountSection() {
  const [passkeys, setPasskeys] = React.useState<PasskeyEntry[]>([])
  const [loading, setLoading] = React.useState(true)
  const [enrolling, setEnrolling] = React.useState(false)
  const [removingId, setRemovingId] = React.useState<number | null>(null)
  const [supported, setSupported] = React.useState(false)

  const load = React.useCallback(async () => {
    setLoading(true)
    try {
      const res = await apiClient.listPasskeys()
      setPasskeys(res.passkeys)
    } catch (err) {
      console.error("Failed to load passkeys", err)
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    let active = true
    void load()
    ;(async () => {
      if (!isPasskeySupported()) return
      const ok = await hasPlatformAuthenticator()
      if (active) setSupported(ok)
    })()
    return () => {
      active = false
    }
  }, [load])

  const handleEnroll = async () => {
    if (enrolling) return
    setEnrolling(true)
    try {
      await enrollPasskey(defaultName())
      toast.success("Passkey hozzáadva.")
      try {
        window.localStorage.removeItem("passkey_setup_dismissed")
      } catch {
        /* ignore */
      }
      await load()
    } catch (err) {
      toast.error("Nem sikerült beállítani a jelkulcsot", {
        description: describePasskeyError(err),
      })
    } finally {
      setEnrolling(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (removingId !== null) return
    setRemovingId(id)
    try {
      await apiClient.deletePasskey(id)
      toast.success("Jelkulcs törölve.")
      await load()
    } catch (err) {
      toast.error("Nem sikerült törölni a jelkulcsot", {
        description: err instanceof Error ? err.message : String(err),
      })
    } finally {
      setRemovingId(null)
    }
  }

  return (
    <div className="space-y-3 pt-2">
      <div>
        <h2 className="text-lg font-semibold">Jelkulcs</h2>
        <p className="text-muted-foreground text-sm">
          Jelszó nélküli bejelentkezés Touch ID-val, Windows Hello-val vagy más biometrikus
          hitelesítővel.
        </p>
      </div>

      {!isPasskeySupported() && (
        <p className="text-muted-foreground text-sm">
          Ez a böngésző nem támogatja a jelkulcsokat.
        </p>
      )}

      {loading ? (
        <div className="text-muted-foreground flex items-center gap-2 text-sm">
          <Loader2 className="size-4 animate-spin" /> Betöltés…
        </div>
      ) : (
        <ItemGroup className="gap-2">
          {passkeys.length === 0 && (
            <Item variant="outline">
              <ItemMedia>
                <Fingerprint className="h-5 w-5" />
              </ItemMedia>
              <ItemContent>
                <ItemTitle>Még nincs jelkulcs beállítva</ItemTitle>
                <ItemDescription>
                  Adj hozzá egyet a gyorsabb és biztonságosabb bejelentkezéshez.
                </ItemDescription>
              </ItemContent>
            </Item>
          )}
          {passkeys.map((p) => (
            <Item key={p.id} variant="outline">
              <ItemMedia>
                <Fingerprint className="h-5 w-5" />
              </ItemMedia>
              <ItemContent>
                <ItemTitle>{p.name}</ItemTitle>
                <ItemDescription>
                  Hozzáadva: {formatDate(p.created_at)} · Utolsó használat: {formatDate(p.last_used_at)}
                </ItemDescription>
              </ItemContent>
              <ItemActions>
                <Button
                  variant="ghost"
                  size="icon"
                  disabled={removingId === p.id}
                  onClick={() => handleDelete(p.id)}
                  aria-label="Törlés"
                >
                  {removingId === p.id ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Trash2 className="size-4" />
                  )}
                </Button>
              </ItemActions>
            </Item>
          ))}
        </ItemGroup>
      )}

      <Button
        onClick={handleEnroll}
        disabled={!supported || enrolling}
        className="w-full sm:w-auto"
      >
        {enrolling ? (
          <>
            <Loader2 className="mr-2 size-4 animate-spin" /> Beállítás…
          </>
        ) : (
          <>
            <Plus className="mr-2 size-4" /> Új Jelkulcs hozzáadása
          </>
        )}
      </Button>
    </div>
  )
}

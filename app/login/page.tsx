"use client"

import Link from "next/link"
import Image from "next/image"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { LoginForm } from "@/components/login-form"
import { useRole } from "@/app/context/RoleContext"
import { useTheme } from "@/app/context/ThemeContext"
import Hyperspeed from "@/components/Hyperspeed"
import { Spinner } from "@/components/ui/spinner"

export default function LoginPage() {
  const { isAuthenticated, isLoading } = useRole()
  const { isDark } = useTheme()
  const router = useRouter()
  const [shouldRender, setShouldRender] = useState(false)
  const [isSpecialMode, setIsSpecialMode] = useState(false)

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        router.replace('/dashboard')
      } else {
        setShouldRender(true)
      }
    }
  }, [isAuthenticated, isLoading, router])

  // Show loading while checking auth status
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
    <div className="grid min-h-svh lg:grid-cols-2 overflow-hidden">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
          <Link href="/" className="flex items-center gap-2 font-medium">
            <Image
              src="/logo.svg"
              alt="Szent László Gimnázium"
              width={32}
              height={32}
              className="w-8 h-8 md:w-8 md:h-8 transition-all"
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
        {/* <div className="text-center text-xs text-muted-foreground">
            <Link href="/" className="hover:underline">
              ← Vissza a főoldalra
            </Link>
          </div> */}
      </div>
      <div className="bg-black relative hidden lg:block overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <Hyperspeed 
            effectOptions={
              isSpecialMode ? {
                colors: specialModeColors
              } : {}
            }/>
          <div className="absolute inset-0 flex h-full items-center justify-center p-10 bg-black/30">
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

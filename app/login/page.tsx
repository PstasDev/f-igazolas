"use client"

import Link from "next/link"
import Image from "next/image"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { LoginForm } from "@/components/login-form"
import { useRole } from "@/app/context/RoleContext"
import Hyperspeed from "@/components/Hyperspeed"

export default function LoginPage() {
  const { isAuthenticated } = useRole()
  const router = useRouter()

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard')
    }
  }, [isAuthenticated, router])

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
              className="size-8"
            />
            <span className="font-serif">Igazoláskezelő</span>
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">
            <LoginForm />
          </div>
        </div>
        <div className="text-center text-xs text-muted-foreground">
          <Link href="/" className="hover:underline">
            ← Vissza a főoldalra
          </Link>
        </div>
      </div>
      <div className="bg-black relative hidden lg:block overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <Hyperspeed 
            effectOptions={
              {

              }

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

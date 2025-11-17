"use client"

import { useState } from "react"
import { AdminView } from "./AdminView"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import {  Users, BarChart3, School, Clock, AlertCircle } from "lucide-react"

interface AdminMenuItem {
  id: string
  label: string
  icon: React.ReactNode
  description: string
}

const ADMIN_MENU_ITEMS: AdminMenuItem[] = [
  {
    id: 'user-mgmt',
    label: 'Felhasználókezelés',
    icon: <Users className="w-5 h-5" />,
    description: 'Jelszavak, tanárok, engedélyek'
  },
  {
    id: 'login-stats',
    label: 'Bejelentkezés',
    icon: <BarChart3 className="w-5 h-5" />,
    description: 'Bejelentkezési statisztikák'
  },
  {
    id: 'classes',
    label: 'Osztályok',
    icon: <School className="w-5 h-5" />,
    description: 'FTV szinkronizáció'
  },
  {
    id: 'breaks',
    label: 'Tanítási szünetek',
    icon: <Clock className="w-5 h-5" />,
    description: 'Szünetek kezelése'
  },
  {
    id: 'overrides',
    label: 'Kivételek',
    icon: <AlertCircle className="w-5 h-5" />,
    description: 'Napi kivételek'
  },
]

export function AdminViewWrapper() {
  const [activeTab, setActiveTab] = useState('user-mgmt')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Adminisztráció</h1>
        <p className="text-muted-foreground mt-2">
          Iskola-szintű beállítások és szinkronizáció kezelése
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block">
          <nav className="space-y-2 sticky top-4">
            {ADMIN_MENU_ITEMS.map((item) => (
              <Button
                key={item.id}
                variant={activeTab === item.id ? "default" : "outline"}
                className={cn(
                  "w-full justify-start text-left h-auto py-3 px-4",
                  activeTab === item.id && "bg-primary text-primary-foreground"
                )}
                onClick={() => setActiveTab(item.id)}
              >
                <span className="mr-3 flex-shrink-0">{item.icon}</span>
                <div className="flex-1 text-left">
                  <div className="font-semibold text-sm">{item.label}</div>
                  <div className={cn(
                    "text-xs hidden sm:block",
                    activeTab === item.id ? "opacity-80" : "text-muted-foreground"
                  )}>
                    {item.description}
                  </div>
                </div>
              </Button>
            ))}
          </nav>
        </div>

        {/* Mobile Dropdown */}
        <div className="lg:hidden">
          <Select value={activeTab} onValueChange={setActiveTab}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Válassz menüpontot..." />
            </SelectTrigger>
            <SelectContent>
              {ADMIN_MENU_ITEMS.map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          <AdminView activeTab={activeTab} />
        </div>
      </div>
    </div>
  )
}

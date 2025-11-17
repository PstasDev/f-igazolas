"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"

export interface AdminTab {
  id: string
  label: string
  icon?: string
  description?: string
  component: React.ReactNode
}

interface AdminLayoutProps {
  tabs: AdminTab[]
  activeTab: string
  onTabChange: (tabId: string) => void
  title: string
  subtitle?: string
}

export function AdminLayout({
  tabs,
  activeTab,
  onTabChange,
  title,
  subtitle,
}: AdminLayoutProps) {
  const [, setMobileMenuOpen] = useState(false)

  const activeTabData = tabs.find((t) => t.id === activeTab)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        {subtitle && <p className="text-muted-foreground mt-2">{subtitle}</p>}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block">
          <nav className="space-y-2 sticky top-4">
            {tabs.map((tab) => (
              <Button
                key={tab.id}
                variant={activeTab === tab.id ? "default" : "ghost"}
                className={cn(
                  "w-full justify-start text-left",
                  activeTab === tab.id && "bg-primary text-primary-foreground"
                )}
                onClick={() => {
                  onTabChange(tab.id)
                  setMobileMenuOpen(false)
                }}
              >
                <span className="text-lg mr-2">{tab.icon}</span>
                <div>
                  <div className="font-semibold">{tab.label}</div>
                  {tab.description && (
                    <div className="text-xs opacity-70 hidden sm:block">{tab.description}</div>
                  )}
                </div>
              </Button>
            ))}
          </nav>
        </div>

        {/* Mobile Dropdown */}
        <div className="lg:hidden">
          <Select value={activeTab} onValueChange={onTabChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Válassz menüpontot..." />
            </SelectTrigger>
            <SelectContent>
              {tabs.map((tab) => (
                <SelectItem key={tab.id} value={tab.id}>
                  {tab.icon} {tab.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          {activeTabData && (
            <div className="space-y-4">
              {activeTabData.component}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

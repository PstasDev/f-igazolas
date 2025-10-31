"use client"

import * as React from "react"
import {
  User,
  Paintbrush,
  FileText,
  FlaskConical,
  Settings,
  Moon,
  Sun,
  BadgeCheck,
  Mail,
  School,
  UserCircle,
  Check,
  X,
  FlaskConicalIcon,
  FlaskConicalOff,
  Clapperboard,
} from "lucide-react"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from "@/components/ui/sidebar"
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
  ItemActions,
} from "@/components/ui/item"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSet,
  FieldTitle,
} from "@/components/ui/field"
import {
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui/radio-group"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Switch } from "@/components/ui/switch"
import { useTheme } from "../context/ThemeContext"
import { useRole } from "../context/RoleContext"
import { apiClient } from "@/lib/api"
import type { IgazolasTipus, Osztaly } from "@/lib/types"
import { getIgazolasType } from "@/app/dashboard/types"
import { toast } from "sonner"
import { IconFolderCode } from "@tabler/icons-react"
import { ArrowUpRightIcon } from "lucide-react"
import BKKLogo from "@/components/icons/BKKLogo"

type PageId = "account" | "appearance" | "verification-types" | "experimental"

interface NavItem {
  id: PageId
  name: string
  icon: React.ComponentType<{ className?: string }>
  teacherOnly?: boolean
}

const navItems: NavItem[] = [
  { id: "account", name: "Fiók", icon: User },
  { id: "appearance", name: "Kinézet", icon: Paintbrush },
  { id: "verification-types", name: "Igazolástípusok", icon: FileText, teacherOnly: true },
  { id: "experimental", name: "Kísérleti", icon: FlaskConical },
]

export function SettingsDialog() {
  const [open, setOpen] = React.useState(false)
  const [activePage, setActivePage] = React.useState<PageId>("account")
  const { theme, toggleTheme } = useTheme()
  const { user } = useRole()
  const [igazolasTipusok, setIgazolasTipusok] = React.useState<IgazolasTipus[]>([])
  const [myClass, setMyClass] = React.useState<Osztaly | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [togglingTipus, setTogglingTipus] = React.useState<number | null>(null)
  
  const isTeacher = user?.role === 'teacher'

  // Fetch igazolástípusok when dialog opens and verification-types page is active
  React.useEffect(() => {
    if (open && activePage === 'verification-types' && isTeacher) {
      setLoading(true)
      Promise.all([
        apiClient.listIgazolasTipus(),
        apiClient.getMyProfile()
      ])
        .then(([tipusok, profile]) => {
          setIgazolasTipusok(tipusok)
          
          // Get the teacher's class information
          if (profile.osztalyom) {
            return apiClient.getOsztaly(profile.osztalyom.id)
          }
          return null
        })
        .then((osztaly) => {
          if (osztaly) {
            setMyClass(osztaly)
          }
        })
        .catch(console.error)
        .finally(() => setLoading(false))
    }
  }, [open, activePage, isTeacher])

  const handleToggleIgazolasTipus = async (tipusId: number, currentlyEnabled: boolean) => {
    if (!myClass) {
      toast.error('Nem található osztály')
      return
    }

    setTogglingTipus(tipusId)
    
    try {
      const result = await apiClient.toggleIgazolasTipus({
        tipus_id: tipusId,
        enabled: !currentlyEnabled, // Toggle the current state
      })
      
      toast.success(result.message)
      
      // Refresh the class data to get updated nem_fogadott_igazolas_tipusok
      const updatedClass = await apiClient.getOsztaly(myClass.id)
      setMyClass(updatedClass)
    } catch (error) {
      console.error('Failed to toggle igazolás tipus:', error)
      
      let errorMessage = 'Hiba történt a típus módosításakor'
      if (error instanceof Error) {
        errorMessage = error.message
      }
      
      toast.error(errorMessage)
    } finally {
      setTogglingTipus(null)
    }
  }

  const filteredNavItems = navItems.filter(item => !item.teacherOnly || isTeacher)

  const renderPageContent = () => {
    switch (activePage) {
      case "account":
        return (
          <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
            <h2 className="text-lg font-semibold">Profil adatok</h2>
            <ItemGroup className="gap-2">
              <Item variant="outline">
                <ItemMedia>
                  <UserCircle className="h-5 w-5" />
                </ItemMedia>
                <ItemContent>
                  <ItemTitle>Név</ItemTitle>
                  <ItemDescription>{user?.name || "Felhasználó"}{user?.username ? ` (@${user?.username})` : ""}</ItemDescription>
                </ItemContent>
              </Item>
              <Item variant="outline">
                <ItemMedia>
                  <Mail className="h-5 w-5" />
                </ItemMedia>
                <ItemContent>
                  <ItemTitle>Email cím</ItemTitle>
                  <span className="text-muted-foreground">{user?.email || "Nincs megadva"}</span>
                  <span className="inline-flex text-green-500 dark:text-green-400 gap-2 items-center"><BadgeCheck className="size-4"/> E-mail cím megerősítve</span>
                </ItemContent>
              </Item>
              <Item variant="outline">
                <ItemMedia>
                  <School className="h-5 w-5" />
                </ItemMedia>
                <ItemContent>
                  <ItemTitle>Intézmény</ItemTitle>
                  <ItemDescription>Kőbányai Szent László Gimnázium, Budapest X.</ItemDescription>
                </ItemContent>
              </Item>
            </ItemGroup>
          </div>
        )
      
      case "appearance":
        return (
          <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
            <FieldGroup>
              <FieldSet>
                <FieldLabel htmlFor="theme-selector">
                  Téma
                </FieldLabel>
                <FieldDescription>
                  Válaszd ki az alkalmazás témáját.
                </FieldDescription>
                <RadioGroup 
                  value={theme} 
                  onValueChange={(value: string) => {
                    if (value !== theme) {
                      toggleTheme()
                    }
                  }}
                >
                  <FieldLabel className="cursor-pointer" htmlFor="light-theme">
                    <Field orientation="horizontal">
                      <FieldContent>
                        <div className="flex items-center gap-2">
                          <Sun className="h-4 w-4" />
                          <FieldTitle>Világos</FieldTitle>
                        </div>
                        <FieldDescription>
                          Világos téma használata az alkalmazásban.
                        </FieldDescription>
                      </FieldContent>
                      <RadioGroupItem value="light" id="light-theme" />
                    </Field>
                  </FieldLabel>
                  <FieldLabel className="cursor-pointer" htmlFor="dark-theme">
                    <Field orientation="horizontal">
                      <FieldContent>
                        <div className="flex items-center gap-2">
                          <Moon className="h-4 w-4" />
                          <FieldTitle>Sötét</FieldTitle>
                        </div>
                        <FieldDescription>
                          Sötét téma használata az alkalmazásban.
                        </FieldDescription>
                      </FieldContent>
                      <RadioGroupItem value="dark" id="dark-theme" />
                    </Field>
                  </FieldLabel>
                </RadioGroup>
              </FieldSet>
            </FieldGroup>
          </div>
        )
      
      case "verification-types":
        return (
          <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
            <div>
              <h2 className="text-lg font-semibold">Igazolástípusok kezelése</h2>
              <p className="text-sm text-muted-foreground">
                Engedélyezd vagy tiltsd le az egyes igazolástípusokat az osztályod számára.
              </p>
              {myClass && (
                <p className="text-sm font-medium text-blue-600 dark:text-blue-400 mt-2">
                  Osztály: {myClass.nev}
                </p>
              )}
            </div>
            
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <p className="text-sm text-muted-foreground">Betöltés...</p>
              </div>
            ) : !myClass ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-center space-y-2">
                  <p className="text-sm text-muted-foreground">Nem található osztály.</p>
                  <p className="text-xs text-muted-foreground">
                    Ez a funkció csak osztályfőnökök számára érhető el.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {igazolasTipusok.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    Nincsenek elérhető igazolástípusok
                  </div>
                ) : (
                  igazolasTipusok.map((tipus) => {
                    const typeConfig = getIgazolasType(tipus.nev)
                    const isDisabled = myClass.nem_fogadott_igazolas_tipusok?.some(t => t.id === tipus.id) || false
                    const isEnabled = !isDisabled
                    const isToggling = togglingTipus === tipus.id
                    
                    return (
                      <div 
                        key={tipus.id}
                        className={`p-4 rounded-lg border transition-all ${
                          isEnabled 
                            ? 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800' 
                            : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2">
                              <span className="text-xl">{typeConfig.emoji}</span>
                              <span className={`inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors ${typeConfig.color}`}>
                                {tipus.nev}
                              </span>
                              {isEnabled ? (
                                <span className="inline-flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                                  <Check className="h-3 w-3" />
                                  Engedélyezve
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                                  <X className="h-3 w-3" />
                                  Tiltva
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {typeConfig.description}
                            </p>
                            <div className="flex gap-3 text-xs">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div className="flex items-center gap-1">
                                      {tipus.beleszamit ? (
                                        <Check className="h-3 w-3 text-green-600 dark:text-green-400" />
                                      ) : (
                                        <X className="h-3 w-3 text-red-600 dark:text-red-400" />
                                      )}
                                      <span className="text-muted-foreground">Beleszámít</span>
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent className="dark:bg-gray-900 dark:text-white max-w-xs">
                                    <p>Ha igaz, akkor ez az igazolástípus beleszámít a hivatalos mulasztások számába.</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                              
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div className="flex items-center gap-1">
                                      {tipus.iskolaerdeku ? (
                                        <Check className="h-3 w-3 text-green-600 dark:text-green-400" />
                                      ) : (
                                        <X className="h-3 w-3 text-red-600 dark:text-red-400" />
                                      )}
                                      <span className="text-muted-foreground">Iskolaérdekű</span>
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent className="dark:bg-gray-900 dark:text-white max-w-xs">
                                    <p>Ha igaz, akkor az ilyen típusú igazolás elutasításakor megerősítést kér a rendszer.</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={isEnabled}
                              disabled={isToggling}
                              onCheckedChange={() => handleToggleIgazolasTipus(tipus.id, isEnabled)}
                              aria-label={`Toggle ${tipus.nev}`}
                            />
                          </div>
                        </div>
                        
                        {!isEnabled && (
                          <div className="mt-3 p-2 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 rounded text-xs text-amber-800 dark:text-amber-200">
                            ⚠️ Az osztályod diákjai nem fogják látni ezt a típust az igazolás beküldő űrlapon.
                          </div>
                        )}
                      </div>
                    )
                  })
                )}
              </div>
            )}
          </div>
        )
      
      case "experimental":
        return (
          <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
            <h2 className="text-lg font-semibold">Kísérleti funkciók</h2>
            {/* <div className="">
              <Empty>
                <EmptyHeader>
                  <EmptyMedia variant="icon" className="bg-teal-500/30 dark:bg-teal-300/30 text-teal-500 dark:text-teal-300">
                    <FlaskConicalOff className="" />
                  </EmptyMedia>
                  <EmptyTitle>Nincsenek kísérleti funkciók</EmptyTitle>
                  <EmptyDescription>
                    Jelenleg nincsenek elérhető kísérleti funkciók a számodra.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            </div> */}
            <ItemGroup className="gap-4">
              <Item variant="outline" className="bg-teal-50 dark:bg-teal-950/30 border-teal-200 dark:border-teal-800">
                <ItemContent>
                  <ItemMedia className="mb-2">
                    <BKKLogo />
                  </ItemMedia>
                  <ItemTitle>BKK Élő Forgalmi Zavar Információk</ItemTitle>
                  <ItemDescription>
                    Integráció a BKK élő forgalmi zavar információival az alkalmazásban.
                  </ItemDescription>
                </ItemContent>
                <ItemActions>
                  <Switch checked={true} disabled />
                </ItemActions>
              </Item>

              <Item variant="outline" className="bg-teal-50 dark:bg-teal-950/30 border-teal-200 dark:border-teal-800">
                <ItemContent>
                  <ItemMedia className="mb-2">
                    <BKKLogo />
                  </ItemMedia>
                  <ItemTitle>BKK Élő Jármű Menetmódosítási Információk</ItemTitle>
                  <ItemDescription>
                    Integráció a BKK élő jármű menetmódosítási információival az alkalmazásban.
                  </ItemDescription>
                </ItemContent>
                <ItemActions>
                  <Switch checked={true} disabled />
                </ItemActions>
              </Item>

              <Item variant="outline" className="bg-teal-50 dark:bg-teal-950/30 border-teal-200 dark:border-teal-800">
                <ItemContent>
                  <ItemMedia className="mb-2">
                    <div className="inline-flex items-center gap-1">
                      <Clapperboard className="text-blue-500 drop-shadow-md shadow-blue-500 size-5" />
                      <span className="text-blue-500 font-semibold">FTV</span><span className="text-blue-500 font-light">Sync </span></div>
                  </ItemMedia>
                  <ItemTitle>Forgatásszervezési adatok közvetlen integrációja</ItemTitle>
                  <ItemDescription>
                    Az FTV - Forgatásszervező Platform adatainak közvetlen integrációja az alkalmazásban.
                  </ItemDescription>
                </ItemContent>
                <ItemActions>
                  <Switch checked={true} disabled />
                </ItemActions>
              </Item>

            </ItemGroup>
          </div>
        )
      
      default:
        return null
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="icon" variant="ghost">
          <Settings className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="overflow-hidden p-0 md:max-h-[500px] md:max-w-[700px] lg:max-w-[800px]">
        <DialogTitle className="sr-only">Beállítások</DialogTitle>
        <DialogDescription className="sr-only">
          Itt tudod testreszabni a beállításokat.
        </DialogDescription>
        <SidebarProvider className="items-start">
          <Sidebar collapsible="none" className="hidden md:flex">
            <SidebarContent>
              <SidebarGroup>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {filteredNavItems.map((item) => (
                      <SidebarMenuItem key={item.id}>
                        <SidebarMenuButton
                          isActive={activePage === item.id}
                          onClick={() => setActivePage(item.id)}
                        >
                          <item.icon className="h-4 w-4" />
                          <span>{item.name}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </SidebarContent>
          </Sidebar>
          <main className="flex h-[480px] flex-1 flex-col overflow-hidden">
            <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
              <div className="flex items-center gap-2 px-4 w-full">
                {/* Mobile dropdown selector */}
                <div className="md:hidden w-full">
                  <Select value={activePage} onValueChange={(value) => setActivePage(value as PageId)}>
                    <SelectTrigger className="w-full">
                      <SelectValue>
                        {filteredNavItems.find(item => item.id === activePage)?.name}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {filteredNavItems.map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          <div className="flex items-center gap-2">
                            <item.icon className="h-4 w-4" />
                            <span>{item.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Desktop breadcrumb */}
                <Breadcrumb className="hidden md:block">
                  <BreadcrumbList>
                    <BreadcrumbItem className="hidden md:block">
                      <BreadcrumbLink>Beállítások</BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator className="hidden md:block" />
                    <BreadcrumbItem>
                      <BreadcrumbPage>
                        {filteredNavItems.find(item => item.id === activePage)?.name}
                      </BreadcrumbPage>
                    </BreadcrumbItem>
                  </BreadcrumbList>
                </Breadcrumb>
              </div>
            </header>
            <div className="flex flex-1 flex-col overflow-y-auto">
              {renderPageContent()}
            </div>
          </main>
        </SidebarProvider>
      </DialogContent>
    </Dialog>
  )
}

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
  ItemSeparator,
  ItemTitle,
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useTheme } from "../context/ThemeContext"
import { useRole } from "../context/RoleContext"
import { apiClient } from "@/lib/api"
import type { IgazolasTipus } from "@/lib/types"
import { getIgazolasType } from "@/app/dashboard/types"

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
  const [loading, setLoading] = React.useState(false)
  
  const isTeacher = user?.role === 'teacher'

  // Fetch igazolástípusok when dialog opens and verification-types page is active
  React.useEffect(() => {
    if (open && activePage === 'verification-types' && isTeacher) {
      setLoading(true)
      apiClient.listIgazolasTipus()
        .then(setIgazolasTipusok)
        .catch(console.error)
        .finally(() => setLoading(false))
    }
  }, [open, activePage, isTeacher])

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
              <h2 className="text-lg font-semibold">Igazolástípusok</h2>
              <p className="text-sm text-muted-foreground">
                Az alábbi igazolástípusok használhatóak a rendszerben.
              </p>
            </div>
            
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <p className="text-sm text-muted-foreground">Betöltés...</p>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Név</TableHead>
                      <TableHead className="text-center">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="cursor-help">Beleszámít</span>
                            </TooltipTrigger>
                            <TooltipContent className="dark:bg-gray-900 dark:text-white max-w-xs">
                              <p>Ha igaz, akkor ez az igazolástípus beleszámít a hivatalos mulasztások számába. Ha hamis, akkor jelenlétként számít az év végi bizonyítványban.</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </TableHead>
                      <TableHead className="text-center">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="cursor-help">Iskolaérdekű</span>
                            </TooltipTrigger>
                            <TooltipContent className="dark:bg-gray-900 dark:text-white max-w-xs">
                              <p>Ha igaz, akkor az ilyen típusú igazolás elutasításakor megerősítést kér a rendszer, mivel a tanuló hivatalos iskolaérdekű okból volt távol.</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {igazolasTipusok.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center text-muted-foreground">
                          Nincsenek elérhető igazolástípusok
                        </TableCell>
                      </TableRow>
                    ) : (
                      igazolasTipusok.map((tipus) => {
                        const typeConfig = getIgazolasType(tipus.nev)
                        return (
                          <TableRow key={tipus.id}>
                            <TableCell>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div className="flex items-center gap-2 cursor-help">
                                      <span className="text-lg">{typeConfig.emoji}</span>
                                      <span className={`inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors ${typeConfig.color}`}>
                                        {tipus.nev}
                                      </span>
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent className="dark:bg-gray-900 dark:text-white max-w-xs">
                                    <p>{typeConfig.description}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </TableCell>
                            <TableCell className="text-center">
                              {tipus.beleszamit ? (
                                <Check className="h-5 w-5 mx-auto text-green-600 dark:text-green-400" />
                              ) : (
                                <X className="h-5 w-5 mx-auto text-red-600 dark:text-red-400" />
                              )}
                            </TableCell>
                            <TableCell className="text-center">
                              {tipus.iskolaerdeku ? (
                                <Check className="h-5 w-5 mx-auto text-green-600 dark:text-green-400" />
                              ) : (
                                <X className="h-5 w-5 mx-auto text-red-600 dark:text-red-400" />
                              )}
                            </TableCell>
                          </TableRow>
                        )
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        )
      
      case "experimental":
        return (
          <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
            <h2 className="text-lg font-semibold">Kísérleti funkciók</h2>
            <p className="text-sm text-muted-foreground">
              Ezek a funkciók még fejlesztés alatt állnak és nem stabil működésűek lehetnek.
            </p>
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
              <div className="flex items-center gap-2 px-4">
                <Breadcrumb>
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

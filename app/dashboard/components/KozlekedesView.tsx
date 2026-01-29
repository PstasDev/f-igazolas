"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BKKJSONGenerator } from "./BKKJSONGenerator"
import { BKKJSONVerifier } from "./BKKJSONVerifier"

export function KozlekedesView() {
  const [activeTab, setActiveTab] = useState("generator")

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Közlekedés - BKK eszközök</CardTitle>
          <CardDescription>
            BKK JSON generálás és ellenőrzés - csak szuperfelhasználóknak
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="generator">JSON Generátor</TabsTrigger>
              <TabsTrigger value="verifier">JSON Ellenőrző</TabsTrigger>
            </TabsList>
            
            <TabsContent value="generator" className="mt-6">
              <BKKJSONGenerator />
            </TabsContent>
            
            <TabsContent value="verifier" className="mt-6">
              <BKKJSONVerifier />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

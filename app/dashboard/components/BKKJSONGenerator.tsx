"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { IconCopy, IconDownload, IconPlus, IconTrash } from "@tabler/icons-react"

interface BKKRecord {
  id: string
  timestamp: string
  latitude: string
  longitude: string
  route: string
  stopName: string
  vehicleId: string
}

export function BKKJSONGenerator() {
  const [records, setRecords] = useState<BKKRecord[]>([
    {
      id: "1",
      timestamp: new Date().toISOString(),
      latitude: "47.4979",
      longitude: "19.0402",
      route: "4-6",
      stopName: "Széll Kálmán tér M",
      vehicleId: "BKK_1234"
    }
  ])
  const [generatedJSON, setGeneratedJSON] = useState<string>("")
  const [copySuccess, setCopySuccess] = useState(false)

  const addRecord = () => {
    const newRecord: BKKRecord = {
      id: String(records.length + 1),
      timestamp: new Date().toISOString(),
      latitude: "47.5",
      longitude: "19.0",
      route: "",
      stopName: "",
      vehicleId: ""
    }
    setRecords([...records, newRecord])
  }

  const removeRecord = (id: string) => {
    setRecords(records.filter(r => r.id !== id))
  }

  const updateRecord = (id: string, field: keyof BKKRecord, value: string) => {
    setRecords(records.map(r => 
      r.id === id ? { ...r, [field]: value } : r
    ))
  }

  const generateJSON = () => {
    const bkkData = {
      header: {
        gtfs_realtime_version: "2.0",
        incrementality: "FULL_DATASET",
        timestamp: Math.floor(Date.now() / 1000)
      },
      entity: records.map(record => ({
        id: record.vehicleId || `vehicle_${record.id}`,
        vehicle: {
          trip: {
            trip_id: `trip_${record.id}`,
            start_date: new Date(record.timestamp).toISOString().split('T')[0].replace(/-/g, ''),
            schedule_relationship: "SCHEDULED",
            route_id: record.route
          },
          position: {
            latitude: parseFloat(record.latitude) || 0,
            longitude: parseFloat(record.longitude) || 0,
            bearing: 0,
            speed: 0
          },
          current_stop_sequence: 1,
          current_status: "IN_TRANSIT_TO",
          timestamp: Math.floor(new Date(record.timestamp).getTime() / 1000),
          stop_id: `stop_${record.id}`,
          vehicle: {
            id: record.vehicleId || `vehicle_${record.id}`,
            label: record.route,
            license_plate: ""
          }
        }
      }))
    }
    
    const jsonString = JSON.stringify(bkkData, null, 2)
    setGeneratedJSON(jsonString)
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedJSON)
    setCopySuccess(true)
    setTimeout(() => setCopySuccess(false), 2000)
  }

  const downloadJSON = () => {
    const blob = new Blob([generatedJSON], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `bkk-data-${Date.now()}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">BKK járműpozíciós rekordok</h3>
          <Button onClick={addRecord} size="sm">
            <IconPlus className="mr-2 h-4 w-4" />
            Új rekord
          </Button>
        </div>

        {records.map((record, index) => (
          <Card key={record.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Rekord #{index + 1}</CardTitle>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => removeRecord(record.id)}
                  disabled={records.length === 1}
                >
                  <IconTrash className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor={`timestamp-${record.id}`}>Időbélyeg</Label>
                <Input
                  id={`timestamp-${record.id}`}
                  type="datetime-local"
                  value={record.timestamp.slice(0, 16)}
                  onChange={(e) => updateRecord(record.id, "timestamp", new Date(e.target.value).toISOString())}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor={`route-${record.id}`}>Járat</Label>
                <Input
                  id={`route-${record.id}`}
                  placeholder="4-6, M2, 7"
                  value={record.route}
                  onChange={(e) => updateRecord(record.id, "route", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`lat-${record.id}`}>Szélesség (Latitude)</Label>
                <Input
                  id={`lat-${record.id}`}
                  type="number"
                  step="0.000001"
                  placeholder="47.4979"
                  value={record.latitude}
                  onChange={(e) => updateRecord(record.id, "latitude", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`lon-${record.id}`}>Hosszúság (Longitude)</Label>
                <Input
                  id={`lon-${record.id}`}
                  type="number"
                  step="0.000001"
                  placeholder="19.0402"
                  value={record.longitude}
                  onChange={(e) => updateRecord(record.id, "longitude", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`stop-${record.id}`}>Megálló neve</Label>
                <Input
                  id={`stop-${record.id}`}
                  placeholder="Széll Kálmán tér M"
                  value={record.stopName}
                  onChange={(e) => updateRecord(record.id, "stopName", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`vehicle-${record.id}`}>Jármű azonosító</Label>
                <Input
                  id={`vehicle-${record.id}`}
                  placeholder="BKK_1234"
                  value={record.vehicleId}
                  onChange={(e) => updateRecord(record.id, "vehicleId", e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
        ))}

        <Button onClick={generateJSON} className="w-full">
          JSON generálása
        </Button>
      </div>

      {generatedJSON && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Generált JSON</h3>
            <div className="flex gap-2">
              <Button onClick={copyToClipboard} size="sm" variant="outline">
                <IconCopy className="mr-2 h-4 w-4" />
                {copySuccess ? "Másolva!" : "Másolás"}
              </Button>
              <Button onClick={downloadJSON} size="sm" variant="outline">
                <IconDownload className="mr-2 h-4 w-4" />
                Letöltés
              </Button>
            </div>
          </div>
          
          <Textarea 
            value={generatedJSON}
            readOnly
            className="font-mono text-xs min-h-[400px]"
          />
        </div>
      )}
    </div>
  )
}

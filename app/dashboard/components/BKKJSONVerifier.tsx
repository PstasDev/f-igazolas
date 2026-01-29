"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { 
  IconCheck, 
  IconAlertCircle, 
  IconX, 
  IconInfoCircle,
  IconAlertTriangle 
} from "@tabler/icons-react"
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface VerificationResult {
  isValidJSON: boolean
  syntaxError?: string
  structure: {
    isValid: boolean
    errors: string[]
  }
  fraudAnalysis: {
    suspiciousPatterns: SuspiciousPattern[]
    riskScore: number
    riskLevel: 'low' | 'medium' | 'high' | 'critical'
  }
  statistics?: {
    totalRecords: number
    uniqueLocations: number
    uniqueTimestamps: number
    uniqueVehicles: number
    timeRange?: {
      start: string
      end: string
      durationMinutes: number
    }
  }
}

interface SuspiciousPattern {
  type: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
  affectedRecords?: string[]
  details?: Record<string, unknown>
}

export function BKKJSONVerifier() {
  const [jsonInput, setJsonInput] = useState<string>("")
  const [result, setResult] = useState<VerificationResult | null>(null)
  const [isVerifying, setIsVerifying] = useState(false)

  const verifyJSON = () => {
    setIsVerifying(true)
    
    try {
      // Step 1: Parse JSON
      const data = JSON.parse(jsonInput)
      
      // Step 2: Validate structure
      const structureValidation = validateBKKStructure(data)
      
      // Step 3: Analyze for fraud patterns
      const fraudAnalysis = analyzeFraudPatterns(data)
      
      // Step 4: Calculate statistics
      const statistics = calculateStatistics(data)
      
      setResult({
        isValidJSON: true,
        structure: structureValidation,
        fraudAnalysis,
        statistics
      })
    } catch (error) {
      setResult({
        isValidJSON: false,
        syntaxError: error instanceof Error ? error.message : 'Unknown error',
        structure: { isValid: false, errors: [] },
        fraudAnalysis: {
          suspiciousPatterns: [],
          riskScore: 0,
          riskLevel: 'low'
        }
      })
    } finally {
      setIsVerifying(false)
    }
  }

  const validateBKKStructure = (data: Record<string, unknown>): { isValid: boolean; errors: string[] } => {
    const errors: string[] = []
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const header = data.header as any
    if (!header) {
      errors.push("Hiányzó 'header' mező")
    } else {
      if (!header.gtfs_realtime_version) {
        errors.push("Hiányzó 'header.gtfs_realtime_version'")
      }
      if (!header.timestamp) {
        errors.push("Hiányzó 'header.timestamp'")
      }
    }
    
    if (!data.entity || !Array.isArray(data.entity)) {
      errors.push("Hiányzó vagy érvénytelen 'entity' tömb")
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data.entity.forEach((entity: any, index: number) => {
        if (!entity.id) {
          errors.push(`entity[${index}]: Hiányzó 'id'`)
        }
        if (!entity.vehicle) {
          errors.push(`entity[${index}]: Hiányzó 'vehicle'`)
        } else {
          if (!entity.vehicle.position) {
            errors.push(`entity[${index}]: Hiányzó 'vehicle.position'`)
          } else {
            if (entity.vehicle.position.latitude === undefined) {
              errors.push(`entity[${index}]: Hiányzó 'vehicle.position.latitude'`)
            }
            if (entity.vehicle.position.longitude === undefined) {
              errors.push(`entity[${index}]: Hiányzó 'vehicle.position.longitude'`)
            }
          }
          if (!entity.vehicle.timestamp) {
            errors.push(`entity[${index}]: Hiányzó 'vehicle.timestamp'`)
          }
        }
      })
    }
    
    return {
      isValid: errors.length === 0,
      errors
    }
  }

  const analyzeFraudPatterns = (data: Record<string, unknown>): VerificationResult['fraudAnalysis'] => {
    const patterns: SuspiciousPattern[] = []
    let riskScore = 0
    
    if (!data.entity || !Array.isArray(data.entity)) {
      return {
        suspiciousPatterns: patterns,
        riskScore: 0,
        riskLevel: 'low'
      }
    }
    
    // Check for duplicate coordinates
    const coordinateMap = new Map<string, string[]>()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data.entity.forEach((entity: any) => {
      if (entity.vehicle?.position) {
        const key = `${entity.vehicle.position.latitude},${entity.vehicle.position.longitude}`
        if (!coordinateMap.has(key)) {
          coordinateMap.set(key, [])
        }
        coordinateMap.get(key)!.push(entity.id)
      }
    })
    
    coordinateMap.forEach((ids, coords) => {
      if (ids.length > 1) {
        patterns.push({
          type: 'duplicate_coordinates',
          severity: ids.length > 3 ? 'high' : 'medium',
          description: `${ids.length} jármű pontosan ugyanazon a koordinátán (${coords})`,
          affectedRecords: ids,
          details: { coordinates: coords, count: ids.length }
        })
        riskScore += ids.length > 3 ? 30 : 15
      }
    })
    
    // Check for exact timestamp duplicates
    const timestampMap = new Map<number, string[]>()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data.entity.forEach((entity: any) => {
      if (entity.vehicle?.timestamp) {
        const ts = entity.vehicle.timestamp
        if (!timestampMap.has(ts)) {
          timestampMap.set(ts, [])
        }
        timestampMap.get(ts)!.push(entity.id)
      }
    })
    
    timestampMap.forEach((ids, timestamp) => {
      if (ids.length > 2) {
        const date = new Date(timestamp * 1000).toLocaleString('hu-HU')
        patterns.push({
          type: 'duplicate_timestamps',
          severity: ids.length > 5 ? 'high' : 'medium',
          description: `${ids.length} rekord pontosan ugyanazzal az időbélyeggel (${date})`,
          affectedRecords: ids,
          details: { timestamp, count: ids.length }
        })
        riskScore += ids.length > 5 ? 25 : 12
      }
    })
    
    // Check for impossible speeds (if we have sequential data)
    const sortedEntities = [...data.entity].sort((a, b) => 
      (a.vehicle?.timestamp || 0) - (b.vehicle?.timestamp || 0)
    )
    
    for (let i = 1; i < sortedEntities.length; i++) {
      const prev = sortedEntities[i - 1]
      const curr = sortedEntities[i]
      
      if (prev.vehicle?.position && curr.vehicle?.position && 
          prev.vehicle?.timestamp && curr.vehicle?.timestamp) {
        const distance = calculateDistance(
          prev.vehicle.position.latitude,
          prev.vehicle.position.longitude,
          curr.vehicle.position.latitude,
          curr.vehicle.position.longitude
        )
        
        const timeDiff = (curr.vehicle.timestamp - prev.vehicle.timestamp) / 3600 // hours
        if (timeDiff > 0) {
          const speed = distance / timeDiff // km/h
          
          if (speed > 150) { // Unrealistic speed for public transport
            patterns.push({
              type: 'impossible_speed',
              severity: speed > 300 ? 'critical' : 'high',
              description: `Irreálisan magas sebesség: ${speed.toFixed(0)} km/h (${prev.id} → ${curr.id})`,
              affectedRecords: [prev.id, curr.id],
              details: { speed: speed.toFixed(2), distance: distance.toFixed(2), timeDiff: timeDiff.toFixed(2) }
            })
            riskScore += speed > 300 ? 40 : 20
          }
        }
      }
    }
    
    // Check for coordinates outside Budapest
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data.entity.forEach((entity: any) => {
      if (entity.vehicle?.position) {
        const lat = entity.vehicle.position.latitude
        const lon = entity.vehicle.position.longitude
        
        // Budapest approximate bounds
        if (lat < 47.35 || lat > 47.65 || lon < 18.95 || lon > 19.35) {
          patterns.push({
            type: 'outside_budapest',
            severity: 'medium',
            description: `Budapesten kívüli koordináta (${lat.toFixed(4)}, ${lon.toFixed(4)})`,
            affectedRecords: [entity.id],
            details: { latitude: lat, longitude: lon }
          })
          riskScore += 10
        }
      }
    })
    
    // Check for static positions (no movement over time)
    const vehiclePositions = new Map<string, Array<{lat: number, lon: number, time: number}>>()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data.entity.forEach((entity: any) => {
      if (entity.vehicle?.vehicle?.id && entity.vehicle?.position && entity.vehicle?.timestamp) {
        const vehicleId = entity.vehicle.vehicle.id
        if (!vehiclePositions.has(vehicleId)) {
          vehiclePositions.set(vehicleId, [])
        }
        vehiclePositions.get(vehicleId)!.push({
          lat: entity.vehicle.position.latitude,
          lon: entity.vehicle.position.longitude,
          time: entity.vehicle.timestamp
        })
      }
    })
    
    vehiclePositions.forEach((positions, vehicleId) => {
      if (positions.length > 2) {
        const isStatic = positions.every((pos, idx) => {
          if (idx === 0) return true
          const prev = positions[idx - 1]
          return pos.lat === prev.lat && pos.lon === prev.lon
        })
        
        if (isStatic) {
          const timeSpan = positions[positions.length - 1].time - positions[0].time
          if (timeSpan > 600) { // More than 10 minutes
            patterns.push({
              type: 'static_vehicle',
              severity: 'medium',
              description: `Jármű (${vehicleId}) ${positions.length} rekordban ugyanazon a helyen ${(timeSpan / 60).toFixed(0)} percen át`,
              affectedRecords: [vehicleId],
              details: { vehicleId, recordCount: positions.length, durationMinutes: timeSpan / 60 }
            })
            riskScore += 15
          }
        }
      }
    })
    
    // Determine risk level
    let riskLevel: 'low' | 'medium' | 'high' | 'critical'
    if (riskScore >= 80) {
      riskLevel = 'critical'
    } else if (riskScore >= 50) {
      riskLevel = 'high'
    } else if (riskScore >= 25) {
      riskLevel = 'medium'
    } else {
      riskLevel = 'low'
    }
    
    return {
      suspiciousPatterns: patterns,
      riskScore: Math.min(100, riskScore),
      riskLevel
    }
  }

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371 // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLon = (lon2 - lon1) * Math.PI / 180
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  const calculateStatistics = (data: Record<string, unknown>): VerificationResult['statistics'] => {
    if (!data.entity || !Array.isArray(data.entity)) {
      return undefined
    }
    
    const locations = new Set<string>()
    const timestamps = new Set<number>()
    const vehicles = new Set<string>()
    let minTime = Infinity
    let maxTime = -Infinity
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data.entity.forEach((entity: any) => {
      if (entity.vehicle?.position) {
        locations.add(`${entity.vehicle.position.latitude},${entity.vehicle.position.longitude}`)
      }
      if (entity.vehicle?.timestamp) {
        timestamps.add(entity.vehicle.timestamp)
        minTime = Math.min(minTime, entity.vehicle.timestamp)
        maxTime = Math.max(maxTime, entity.vehicle.timestamp)
      }
      if (entity.vehicle?.vehicle?.id) {
        vehicles.add(entity.vehicle.vehicle.id)
      }
    })
    
    return {
      totalRecords: data.entity.length,
      uniqueLocations: locations.size,
      uniqueTimestamps: timestamps.size,
      uniqueVehicles: vehicles.size,
      timeRange: minTime !== Infinity ? {
        start: new Date(minTime * 1000).toLocaleString('hu-HU'),
        end: new Date(maxTime * 1000).toLocaleString('hu-HU'),
        durationMinutes: (maxTime - minTime) / 60
      } : undefined
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'text-blue-600 dark:text-blue-400'
      case 'medium': return 'text-yellow-600 dark:text-yellow-400'
      case 'high': return 'text-orange-600 dark:text-orange-400'
      case 'critical': return 'text-red-600 dark:text-red-400'
      default: return ''
    }
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'low': return <IconInfoCircle className="h-4 w-4" />
      case 'medium': return <IconAlertCircle className="h-4 w-4" />
      case 'high': return <IconAlertTriangle className="h-4 w-4" />
      case 'critical': return <IconX className="h-4 w-4" />
      default: return null
    }
  }

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      case 'high': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
      case 'critical': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      default: return ''
    }
  }

  const getRiskLevelText = (level: string) => {
    switch (level) {
      case 'low': return 'Alacsony kockázat'
      case 'medium': return 'Közepes kockázat'
      case 'high': return 'Magas kockázat'
      case 'critical': return 'Kritikus kockázat'
      default: return 'Ismeretlen'
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold mb-2">JSON beillesztése</h3>
          <Textarea
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
            placeholder='Illessze be a BKK JSON adatokat ide...'
            className="font-mono text-xs min-h-[300px]"
          />
        </div>
        
        <Button 
          onClick={verifyJSON} 
          className="w-full"
          disabled={!jsonInput.trim() || isVerifying}
        >
          {isVerifying ? 'Ellenőrzés...' : 'JSON ellenőrzése és elemzése'}
        </Button>
      </div>

      {result && (
        <div className="space-y-6">
          {/* Syntax Check */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {result.isValidJSON ? (
                  <IconCheck className="h-5 w-5 text-green-600" />
                ) : (
                  <IconX className="h-5 w-5 text-red-600" />
                )}
                Szintaxis ellenőrzés
              </CardTitle>
            </CardHeader>
            <CardContent>
              {result.isValidJSON ? (
                <Alert>
                  <IconCheck className="h-4 w-4" />
                  <AlertTitle>Érvényes JSON</AlertTitle>
                  <AlertDescription>
                    A JSON szintaxis helyes és a fájl sikeresen feldolgozható.
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert variant="destructive">
                  <IconX className="h-4 w-4" />
                  <AlertTitle>Érvénytelen JSON</AlertTitle>
                  <AlertDescription>
                    {result.syntaxError}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Structure Validation */}
          {result.isValidJSON && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {result.structure.isValid ? (
                    <IconCheck className="h-5 w-5 text-green-600" />
                  ) : (
                    <IconAlertCircle className="h-5 w-5 text-yellow-600" />
                  )}
                  Struktúra ellenőrzés
                </CardTitle>
              </CardHeader>
              <CardContent>
                {result.structure.isValid ? (
                  <Alert>
                    <IconCheck className="h-4 w-4" />
                    <AlertTitle>Helyes BKK struktúra</AlertTitle>
                    <AlertDescription>
                      Az adatok megfelelnek a BKK GTFS Realtime formátumnak.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="space-y-2">
                    <Alert variant="destructive">
                      <IconAlertCircle className="h-4 w-4" />
                      <AlertTitle>Struktúra hibák találhatók</AlertTitle>
                    </Alert>
                    <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                      {result.structure.errors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Statistics */}
          {result.statistics && (
            <Card>
              <CardHeader>
                <CardTitle>Statisztikák</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Összes rekord</div>
                    <div className="text-2xl font-bold">{result.statistics.totalRecords}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Egyedi helyszínek</div>
                    <div className="text-2xl font-bold">{result.statistics.uniqueLocations}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Egyedi időpontok</div>
                    <div className="text-2xl font-bold">{result.statistics.uniqueTimestamps}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Egyedi járművek</div>
                    <div className="text-2xl font-bold">{result.statistics.uniqueVehicles}</div>
                  </div>
                </div>
                {result.statistics.timeRange && (
                  <div className="mt-4 p-4 bg-muted rounded-lg">
                    <div className="text-sm font-semibold mb-2">Időintervallum</div>
                    <div className="text-sm space-y-1">
                      <div><span className="text-muted-foreground">Kezdés:</span> {result.statistics.timeRange.start}</div>
                      <div><span className="text-muted-foreground">Befejezés:</span> {result.statistics.timeRange.end}</div>
                      <div><span className="text-muted-foreground">Időtartam:</span> {result.statistics.timeRange.durationMinutes.toFixed(1)} perc</div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Fraud Analysis */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Hamisítás-elemzés</CardTitle>
                <Badge className={getRiskLevelColor(result.fraudAnalysis.riskLevel)}>
                  {getRiskLevelText(result.fraudAnalysis.riskLevel)} ({result.fraudAnalysis.riskScore}/100)
                </Badge>
              </div>
              <CardDescription>
                Automatikus elemzés gyanús minták és adatmanipuláció felderítésére
              </CardDescription>
            </CardHeader>
            <CardContent>
              {result.fraudAnalysis.suspiciousPatterns.length === 0 ? (
                <Alert>
                  <IconCheck className="h-4 w-4" />
                  <AlertTitle>Nem találhatók gyanús minták</AlertTitle>
                  <AlertDescription>
                    Az adatok nem mutatnak nyilvánvaló jeleit az adatmanipulációnak vagy hamisításnak.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-4">
                  <Alert variant="destructive">
                    <IconAlertTriangle className="h-4 w-4" />
                    <AlertTitle>Gyanús minták észlelve</AlertTitle>
                    <AlertDescription>
                      {result.fraudAnalysis.suspiciousPatterns.length} potenciális problémát találtunk az adatokban.
                    </AlertDescription>
                  </Alert>
                  
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Típus</TableHead>
                        <TableHead>Súlyosság</TableHead>
                        <TableHead>Leírás</TableHead>
                        <TableHead>Érintett rekordok</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {result.fraudAnalysis.suspiciousPatterns.map((pattern, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">
                            {pattern.type.replace(/_/g, ' ')}
                          </TableCell>
                          <TableCell>
                            <div className={`flex items-center gap-1 ${getSeverityColor(pattern.severity)}`}>
                              {getSeverityIcon(pattern.severity)}
                              <span className="capitalize">{pattern.severity}</span>
                            </div>
                          </TableCell>
                          <TableCell>{pattern.description}</TableCell>
                          <TableCell>
                            {pattern.affectedRecords && pattern.affectedRecords.length > 0 ? (
                              <div className="text-xs">
                                {pattern.affectedRecords.slice(0, 3).join(', ')}
                                {pattern.affectedRecords.length > 3 && ` +${pattern.affectedRecords.length - 3} további`}
                              </div>
                            ) : (
                              '-'
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

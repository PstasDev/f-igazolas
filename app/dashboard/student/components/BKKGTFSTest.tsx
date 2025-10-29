'use client';

import { useState, useEffect } from 'react';
import { BKKDataProcessor } from '@/lib/bkk-processor';
import { ProcessedBKKAlert } from '@/lib/bkk-types';
import RouteBadge from '@/components/ui/RouteBadge';
import VehicleIcon from '@/components/ui/VehicleIcon';



export default function BKKGTFSTest() {
  const [alerts, setAlerts] = useState<ProcessedBKKAlert[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gtfsLoaded, setGtfsLoaded] = useState(false);

  useEffect(() => {
    const loadGTFS = async () => {
      try {
        await BKKDataProcessor.loadGTFSData();
        setGtfsLoaded(true);
      } catch (err) {
        setError('GTFS adatok betöltése sikertelen: ' + (err as Error).message);
      }
    };

    loadGTFS();
  }, []);

  const loadTestAlerts = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Load test data from the example file
      const response = await fetch('/BKK Examples/Alerts.txt');
      if (!response.ok) {
        throw new Error('Test adatok betöltése sikertelen');
      }
      
      const alertsText = await response.text();
      const processedAlerts = await BKKDataProcessor.parseAlertsFromText(alertsText);
      
      setAlerts(processedAlerts);
    } catch (err) {
      setError('Hiba történt: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const testRouteDetails = () => {
    // Test some known route IDs
    const testRoutes = ['1280', '3580', '5100', '5200'];
    
    console.log('GTFS Route Details Test:');
    testRoutes.forEach(routeId => {
      const details = BKKDataProcessor.getRouteDetails(routeId);
      console.log(`Route ${routeId}:`, details);
    });
  };

  return (
    <div className="p-6 space-y-4">
      <div className="bg-white rounded-lg shadow p-4">
        <h2 className="text-xl font-bold mb-4">BKK GTFS Teszt</h2>
        
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2">
            <span className={`w-3 h-3 rounded-full ${gtfsLoaded ? 'bg-green-500' : 'bg-red-500'}`}></span>
            <span>GTFS adatok betöltése: {gtfsLoaded ? 'Sikeres' : 'Várakozás...'}</span>
          </div>
        </div>

        <div className="flex gap-2 mb-4">
          <button
            onClick={loadTestAlerts}
            disabled={loading || !gtfsLoaded}
            className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white px-4 py-2 rounded"
          >
            {loading ? 'Betöltés...' : 'Riasztások tesztelése'}
          </button>
          
          <button
            onClick={testRouteDetails}
            disabled={!gtfsLoaded}
            className="bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white px-4 py-2 rounded"
          >
            Route részletek tesztelése
          </button>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {alerts.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Betöltött riasztások ({alerts.length} db):</h3>
            {alerts.map((alert) => (
              <div key={alert.id} className="border rounded-lg p-4 bg-gray-50">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-semibold text-lg">{alert.title}</h4>
                  <div className={`px-3 py-2 rounded-full text-sm text-white flex items-center gap-2 ${
                    alert.category === 'metro' ? 'bg-gray-700' :
                    alert.category === 'busz' ? 'bg-blue-600' :
                    alert.category === 'villamos' ? 'bg-yellow-500' :
                    alert.category === 'troli' ? 'bg-red-600' :
                    alert.category === 'hev' ? 'bg-green-600' :
                    alert.category === 'hajo' ? 'bg-cyan-500' :
                    'bg-purple-600'
                  }`}>
                    <VehicleIcon vehicleType={alert.category} size={16} />
                    <span>{alert.category}</span>
                  </div>
                </div>
                
                {alert.description && (
                  <p className="text-gray-700 mb-2">{alert.description}</p>
                )}
                
                <div className="flex flex-wrap gap-2 mb-2">
                  <span className="text-sm font-medium">Érintett járatok:</span>
                  {alert.affectedRoutes.map((route, index) => (
                    <RouteBadge 
                      key={index} 
                      routeNumber={route}
                      vehicleType={alert.category}
                    />
                  ))}
                </div>
                
                <div className="text-sm text-gray-600 space-y-1">
                  <div>ID: {alert.id}</div>
                  <div>Prioritás: {alert.priority}</div>
                  <div>Hatás: {alert.effect}</div>
                  <div>Ok: {alert.cause}</div>
                  {alert.startTime && (
                    <div>Kezdés: {alert.startTime.toLocaleString('hu-HU')}</div>
                  )}
                  {alert.endTime && (
                    <div>Befejezés: {alert.endTime.toLocaleString('hu-HU')}</div>
                  )}
                  {alert.url && (
                    <div>
                      <a href={alert.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                        További info
                      </a>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
import React from 'react';
import { MetroIcon } from './icons/MetroIcon';
import { HevIcon } from './icons/HevIcon';
import { HajoIcon } from './icons/HajoIcon';
import RouteBadge from './ui/RouteBadge';

export default function TransportIconTest() {
  return (
    <div className="p-6 space-y-6 bg-white">
      <h2 className="text-2xl font-bold mb-4">BKK Transport Icons Test</h2>
      
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Metro Lines</h3>
        <div className="flex flex-wrap gap-4">
          <MetroIcon size={32} routeNumber="M1" lineColor="#FFD800" />
          <MetroIcon size={32} routeNumber="M2" lineColor="#E41F18" />
          <MetroIcon size={32} routeNumber="M3" lineColor="#005CA5" />
          <MetroIcon size={32} routeNumber="M4" lineColor="#4CA22F" />
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">HÉV Lines</h3>
        <div className="flex flex-wrap gap-4">
          <HevIcon size={32} routeNumber="H5" lineColor="#821066" />
          <HevIcon size={32} routeNumber="H6" lineColor="#824B00" />
          <HevIcon size={32} routeNumber="H7" lineColor="#EE7203" />
          <HevIcon size={32} routeNumber="H8" lineColor="#ED677E" />
          <HevIcon size={32} routeNumber="H9" lineColor="#ED677E" />
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Boat Lines</h3>
        <div className="flex flex-wrap gap-4">
          <HajoIcon size={32} routeNumber="D11" lineColor="#E50475" />
          <HajoIcon size={32} routeNumber="D12" lineColor="#9A1915" />
          <HajoIcon size={32} routeNumber="D13" lineColor="#63140E" />
          <HajoIcon size={32} routeNumber="D14" lineColor="#D0033F" />
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Route Badges (All Types)</h3>
        <div className="flex flex-wrap gap-2">
          <RouteBadge routeNumber="4" vehicleType="busz" />
          <RouteBadge routeNumber="6" vehicleType="villamos" />
          <RouteBadge routeNumber="72" vehicleType="troli" />
          <RouteBadge routeNumber="M1" vehicleType="metro" />
          <RouteBadge routeNumber="H5" vehicleType="hev" />
          <RouteBadge routeNumber="D11" vehicleType="hajo" />
          <RouteBadge routeNumber="900" vehicleType="ejszakai" />
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Different Sizes</h3>
        <div className="flex items-center gap-4">
          <MetroIcon size={16} routeNumber="M3" lineColor="#005CA5" />
          <MetroIcon size={24} routeNumber="M3" lineColor="#005CA5" />
          <MetroIcon size={32} routeNumber="M3" lineColor="#005CA5" />
          <MetroIcon size={48} routeNumber="M3" lineColor="#005CA5" />
        </div>
      </div>
    </div>
  );
}
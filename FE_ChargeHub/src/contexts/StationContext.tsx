import React, { createContext, useContext, useState, ReactNode } from 'react';

interface Station {
  id: string;
  name: string;
  shortName: string;
  location: string;
  address: string;
  pillarsCount: {
    available: number;
    inUse: number;
    offline: number;
    total: number;
  };
}

interface StationContextType {
  currentStation: Station;
  setCurrentStation: (station: Station) => void;
  updatePillarStatus: (pillarId: string, status: 'available' | 'in_use' | 'offline') => void;
}

const StationContext = createContext<StationContextType | undefined>(undefined);

export const useStation = () => {
  const context = useContext(StationContext);
  if (context === undefined) {
    throw new Error('useStation must be used within a StationProvider');
  }
  return context;
};

interface StationProviderProps {
  children: ReactNode;
}

export function StationProvider({ children }: StationProviderProps) {
  // Default station data - in real app, this would be fetched from API
  const [currentStation, setCurrentStation] = useState<Station>({
    id: 'VFS-001-HCM',
    name: 'VinFast Station HCM',
    shortName: 'VFS-HCM',
    location: 'Quận 7, TP.HCM',
    address: '123 Đường Nguyễn Văn Linh, Quận 7, TP.HCM',
    pillarsCount: {
      available: 5,
      inUse: 3,
      offline: 1,
      total: 9
    }
  });

  const updatePillarStatus = (pillarId: string, status: 'available' | 'in_use' | 'offline') => {
    // In real app, this would make API call to update pillar status
    console.log(`Updating pillar ${pillarId} to status: ${status}`);
    
    // For now, just trigger a re-render by updating station data
    setCurrentStation(prev => ({
      ...prev,
      pillarsCount: {
        ...prev.pillarsCount,
        // Recalculate counts based on new status - simplified logic
        available: status === 'available' ? prev.pillarsCount.available + 1 : prev.pillarsCount.available,
        inUse: status === 'in_use' ? prev.pillarsCount.inUse + 1 : prev.pillarsCount.inUse,
        offline: status === 'offline' ? prev.pillarsCount.offline + 1 : prev.pillarsCount.offline
      }
    }));
  };

  const value = {
    currentStation,
    setCurrentStation,
    updatePillarStatus
  };

  return (
    <StationContext.Provider value={value}>
      {children}
    </StationContext.Provider>
  );
}
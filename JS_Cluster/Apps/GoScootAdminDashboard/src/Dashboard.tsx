import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import Map from "./Map";
import { useState } from "react";

export default function Dashboard() {
  const [selectedBikeLocation, setSelectedBikeLocation] = useState<[number, number] | null>(null);
  const [selectedBikeId, setSelectedBikeId] = useState<string | undefined>(undefined);

  const handleNavigate = (page: string, bikeLocation?: [number, number], bikeId?: string) => {
    if (bikeLocation) {
      setSelectedBikeLocation(bikeLocation);
    }
    if (bikeId) {
      setSelectedBikeId(bikeId);
    }
  };

  return (
    <div className="bike-details-container">
      <Header title="Dashboard - Live Map" />
      <div className="main-content">
        <Sidebar />
        <Map 
          onNavigate={handleNavigate}
          centerOnLocation={selectedBikeLocation}
        />
      </div>
    </div>
  );
}
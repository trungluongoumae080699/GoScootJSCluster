import Map from "../components/module/Map"
import { useEffect, useState } from "react";
import { useGlobalContext, WebScreen } from "../context/GlobalContext";

export default function Dashboard() {
  const globalContext = useGlobalContext()
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

  useEffect(()=>{
    globalContext.setCurrentPage(WebScreen.DASHBOARD)
  },[])

  return (
    <div style={{
        width: "100vw",
        height: "100vh",
        overflow: "hidden"
      }}>
        <Map 
          onNavigate={handleNavigate}
          centerOnLocation={selectedBikeLocation}
        />
      </div>
  );
}
 
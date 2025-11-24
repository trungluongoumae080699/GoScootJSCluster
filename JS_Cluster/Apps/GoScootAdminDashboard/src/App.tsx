// // src/App.tsx
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Dashboard from "./Dashboard";
import Bikes from "./Bikes";
import BikeDetails from "./BikeDetails";
import Header from "./components/Header";
import { useState } from "react";

function App() {
  const [pageTitle, setPageTitle] = useState("");
  // Track current page (simple client-side routing)
  const [currentPage, setCurrentPage] = useState<string>("bike-detail");

  // Store bike location when navigating from BikeDetails to Map
  const [selectedBikeLocation, setSelectedBikeLocation] = useState<
    [number, number] | null
  >(null);

  /**
   * Handle navigation between pages
   * @param page - Page identifier to navigate to
   * @param bikeLocation - Optional bike location to center map on
   */
  const handleNavigate = (page: string, bikeLocation?: [number, number]) => {
    setCurrentPage(page);
    if (bikeLocation) {
      setSelectedBikeLocation(bikeLocation);
    }
  };

  return (
    <Router>
      <Header title={pageTitle} />
      <div className="app-ctn">
        <Sidebar onNavigate={setPageTitle} />
        <div className="page-ctn">
          <Routes>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/bikes" element={<Bikes />} />
            <Route
              path="/bike-detail"
              element={<BikeDetails onNavigate={handleNavigate} />}
            />
            <Route path="/" element={<Dashboard />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;

import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useParams } from "react-router-dom";
import ToastContainer from "./components/alert/Toast";
import { useGlobalContext, WebScreen } from "./context/GlobalContext";
import Bikes from "./screens/BikeMangement/Bikes";
import Login from "./screens/Login";
import SignUp from "./screens/SignUp";
import { websocketManager } from "./services/websocketService";
import { formlessSignIn } from "./services/authService";
import { BikeManagementContextProvider } from "./context/BikeManagementContext";



// Keep your ProtectedRoute local to routing
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuth } = useGlobalContext();
  if (!isAuth) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

// Wrapper component to get bikeId from params
/* function BikeDetailsWrapper({
  onNavigate,
}: {
  onNavigate: (page: string, bikeLocation?: [number, number]) => void;
}) {
  const { bikeId } = useParams<{ bikeId: string }>();
  return <BikeDetails onNavigate={onNavigate} bikeId={bikeId} />;
}
 */
export default function Root() {
  const globalContext = useGlobalContext();

  // If you still need these (you had them before)


  useEffect(() => {
    const checkExistingSession = async () => {
      try {
        console.log("Loggin In.....")
        // Try formless sign-in if session ID exists
        const response = await formlessSignIn();

        if (response) {
          globalContext.setIsAuth(true);
        } else {
          globalContext.setIsAuth(false);
        }
      } catch (error) {
        globalContext.setIsAuth(false);
      } finally {
        globalContext.setIsCheckingAuth(false);
      }
    };

    checkExistingSession();

  }, []);


  useEffect(() => {
    if (!globalContext.isAuth) return;
    websocketManager.connect();
    return () => websocketManager.disconnect();
  }, [globalContext.isAuth]);

  const handleNavigate = (page: WebScreen, bikeLocation?: [number, number]) => {

    // if you actually use these somewhere, keep them;
    // otherwise you can remove
    globalContext.setCurrentPage(page);
    //if (bikeLocation) setSelectedBikeLocation(bikeLocation);
    // you had currentPage too; remove unless you use it
  };

  if (globalContext.isCheckingAuth) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          fontSize: "18px",
          color: "#666",
        }}
      >
        Loading...
      </div>
    );
  }

  return (
    <Router>
      <ToastContainer />
      <Routes>
        {/* Public routes */}
        <Route
          path="/login"
          element={globalContext.isAuth ? <Navigate to="/" replace /> : <Login />}
        />
        <Route path="/signup" element={globalContext.isAuth ? <Navigate to="/" replace /> : <SignUp />} />

        {/* Protected routes */}
        {/*  <Route
          path="/"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        /> */}
        <Route
          path="/"
          element={
            <BikeManagementContextProvider>
              <Bikes />
            </BikeManagementContextProvider>
          }
        />
        {/*         <Route
          path="/bike-detail"
          element={
            <ProtectedRoute>
              <BikeDetails onNavigate={handleNavigate} />
            </ProtectedRoute>
          }
        /> */}
        {/*         <Route
          path="/bike/:bikeId"
          element={
            <ProtectedRoute>
              <BikeDetailsWrapper onNavigate={handleNavigate} />
            </ProtectedRoute>
          }
        /> */}
        {/*         <Route
          path="/trips"
          element={
            <ProtectedRoute>
              <Trips />
            </ProtectedRoute>
          }
        /> */}
        {/*         <Route
          path="/trips/:bikeId/:tripId"
          element={
            <ProtectedRoute>
              <TripDetails />
            </ProtectedRoute>
          }
        /> */}
        {/*         <Route
          path="/alert"
          element={
            <ProtectedRoute>
              <Alert />
            </ProtectedRoute>
          }
        /> */}
      </Routes>
    </Router>
  );
}
import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useParams, useNavigate } from "react-router-dom";
import ToastContainer from "./components/alert/Toast";
import { useGlobalContext, WebScreen } from "./context/GlobalContext";
import Bikes from "./screens/BikeMangement/Bikes";
import Login from "./screens/Login";
import SignUp from "./screens/SignUp";
import { websocketManager } from "./services/websocketService";
import { formlessSignIn } from "./services/authService";
import { BikeManagementContextProvider } from "./context/BikeManagementContext";
import Alert from "./screens/Alert";
import "./index.css"

import Sidebar from "./components/module/Sidebar";
import Header from "./components/module/Header";
import Trips from "./screens/TripManagement/Trips";
import BikeDetails from "./screens/BikeMangement/BikeDetails";
import Loader from "./components/module/LoadingModule";
import Snackbar from "./components/module/Snackbar";
import TripDetails from "./screens/TripManagement/TripDetails";



// Keep your ProtectedRoute local to routing
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuth } = useGlobalContext();
  if (!isAuth) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function Root() {
  const globalContext = useGlobalContext();
  const navigate = useNavigate();

  useEffect(() => {
    const checkExistingSession = async () => {
      try {
        console.log("Loggin In.....")
        // Try formless sign-in if session ID exists
        const response = await formlessSignIn();
        console.log("Sent Log In Request")
        if (response) {
          console.log("Use has been authenticated")
          globalContext.setAlertCount(response.totalAlerts)
          globalContext.setBikeCount(response.totalBikes)
          globalContext.setIsAuth(true);
        } else {
          console.log("User has not been authenticated")
          globalContext.setIsAuth(false);
        }
      }
      catch (error) {
        globalContext.setIsAuth(false);
      } finally {
        globalContext.setIsCheckingAuth(false);
      }
    };

    checkExistingSession();

  }, []);

  useEffect(() => {
    if (!globalContext.isAuth) {
      navigate("/login", { replace: true });
    }
  }, [globalContext.isAuth])

  useEffect(() => {
    if (!globalContext.isAuth) return;
    websocketManager.connect();
    return () => websocketManager.disconnect();
  }, [globalContext.isAuth]);

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
        <Loader></Loader>
      </div>
    );
  }

  return (
    <div className="app-container">
      {
        globalContext.currentPage === WebScreen.LOGIN ? undefined : <Header title={globalContext.currentHeader}></Header>
      }
      {
        globalContext.currentPage === WebScreen.LOGIN ? undefined : <Sidebar></Sidebar>
      }

      <div
        className={`main-content-container ${globalContext.isAuth ? "main-content-container-post-auth" : ""
          }`}
      >

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
              <Bikes />
            }
          />
          <Route
            path="/bike"
            element={
              <ProtectedRoute>
                <BikeDetails />
              </ProtectedRoute>
            }
          />

          <Route
            path="/trips"
            element={
              <ProtectedRoute>
                <Trips />
              </ProtectedRoute>
            }
          />
          <Route
            path="/trip"
            element={
              <ProtectedRoute>
                <TripDetails />
              </ProtectedRoute>
            }
          />
          <Route
            path="/alerts"
            element={
              <ProtectedRoute>
                <Alert />
              </ProtectedRoute>
            }
          />
        </Routes>
      </div>
      <Snackbar duration={4000}></Snackbar>

    </div>
  );
}
// // src/App.tsx
import { BrowserRouter as Router, Routes, Route, Navigate, useParams } from "react-router-dom";
import Dashboard from "./Dashboard";
import Bikes from "./Bikes";
import BikeDetails from "./BikeDetails";
import { useState, useEffect } from "react";
import Login from "./Login";
import SignUp from "./SignUp";
import { formlessSignIn } from "./services/authService";

/**
 * Protected Route wrapper
 * Redirects to login if user is not authenticated
 */
function ProtectedRoute({ children, isAuth }: { children: React.ReactNode; isAuth: boolean }) {
  if (!isAuth) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

/**
 * Wrapper component to get bike ID from route params
 */
function BikeDetailsWrapper({ onNavigate }: { onNavigate: (page: string, bikeLocation?: [number, number]) => void }) {
  const { bikeId } = useParams<{ bikeId: string }>();
  return <BikeDetails onNavigate={onNavigate} bikeId={bikeId} />;
}

function App() {
  const [pageTitle, setPageTitle] = useState("");
  // Track current page (simple client-side routing)
  const [currentPage, setCurrentPage] = useState<string>("bike-detail");

  // Store bike location when navigating from BikeDetails to Map
  const [selectedBikeLocation, setSelectedBikeLocation] = useState<
    [number, number] | null
  >(null);

  // Authentication state
  const [isAuth, setIsAuth] = useState<boolean>(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState<boolean>(true);

  /**
   * Attempt formless sign-in on app load
   * If user has a valid session stored, they will be logged in automatically
   */
  useEffect(() => {
    const checkExistingSession = async () => {
      
      try {
        // Try formless sign-in if session ID exists
        const response = await formlessSignIn();
        
        if (response) {
          setIsAuth(true);
        } else {
          setIsAuth(false);
        }
      } catch (error) {
        setIsAuth(false);
      } finally {
        setIsCheckingAuth(false);
      }
    };

    checkExistingSession();
  }, []);

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

  // Show loading while checking authentication
  if (isCheckingAuth) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontSize: '18px',
        color: '#666'
      }}>
        Loading...
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route 
          path="/login" 
          element={isAuth ? <Navigate to="/" replace /> : <Login onLoginSuccess={() => setIsAuth(true)} />} 
        />
        <Route 
          path="/signup" 
          element={isAuth ? <Navigate to="/" replace /> : <SignUp />} 
        />
        
        {/* Protected routes */}
        <Route 
          path="/" 
          element={
            <ProtectedRoute isAuth={isAuth}>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/bikes" 
          element={
            <ProtectedRoute isAuth={isAuth}>
              <Bikes />
            </ProtectedRoute>
          } 
        />
        <Route
          path="/bike-detail"
          element={
            <ProtectedRoute isAuth={isAuth}>
              <BikeDetails onNavigate={handleNavigate} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/bike/:bikeId"
          element={
            <ProtectedRoute isAuth={isAuth}>
              <BikeDetailsWrapper onNavigate={handleNavigate} />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
// import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
// import Login from './Login';
// import SignUp from './SignUp';
// import Map from './Map';
// import WebSocketTest from './TestingScreens/WebSocketTestPage';

// function App() {
//   // TODO: Add proper authentication state management
//   const isAuthenticated = false;

//   return (
//     <WebSocketTest></WebSocketTest>

//   );
// }

// // src/App.tsx
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useParams,
} from "react-router-dom";
import { GlobalProvider } from "./context/GlobalContext";
import Root from "./NavigationTree";
import { BikeManagementContextProvider } from "./context/BikeManagementContext";
import { TripManagementContext, TripManagementContextProvider } from "./context/TripManagementContext";

/**
 * Protected Route wrapper
 * Redirects to login if user is not authenticated
 */
function ProtectedRoute({
  children,
  isAuth,
}: {
  children: React.ReactNode;
  isAuth: boolean;
}) {
  if (!isAuth) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

/**
 * Wrapper component to get bike ID from route params
 */
/* function BikeDetailsWrapper({
  onNavigate,
}: {
  onNavigate: (page: string, bikeLocation?: [number, number]) => void;
}) {
  const { bikeId } = useParams<{ bikeId: string }>();
  return <BikeDetails onNavigate={onNavigate} bikeId={bikeId} />;
}
 */
function App() {

  return (
    <GlobalProvider>
      <BikeManagementContextProvider>
        <TripManagementContextProvider>
          <Root></Root>
        </TripManagementContextProvider>

      </BikeManagementContextProvider>

    </GlobalProvider>
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

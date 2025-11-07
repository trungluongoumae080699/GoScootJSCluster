import { MobileAppCustomer, MobileAppTrip } from "@trungthao/mobile_app_dto"
import { createContext, Dispatch, SetStateAction, useContext, useMemo, useState } from "react"

type GlobalAppContextProps = {
    pendingTrip: MobileAppTrip | null
    setPendingTrip: Dispatch<SetStateAction<MobileAppTrip | null>>
    userProfile: MobileAppCustomer | null
    setUserProfile: Dispatch<SetStateAction<MobileAppCustomer | null>>
    sessionId: string | null
    setSessionId: Dispatch<SetStateAction<string | null>>
}

const GlobalAppContext = createContext<GlobalAppContextProps | undefined>(undefined)

export const AppProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [pendingTrip, setPendingTrip] = useState<MobileAppTrip | null>(null);
  const [userProfile, setUserProfile] = useState<MobileAppCustomer | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null)

  const value: GlobalAppContextProps = {
    pendingTrip,
    setPendingTrip,
    userProfile,
    setUserProfile,
    sessionId,
    setSessionId
  };

  return <GlobalAppContext.Provider value={value}>{children}</GlobalAppContext.Provider>;
};

// Convenient hook
export const useApp = (): GlobalAppContextProps => {
  const ctx = useContext(GlobalAppContext);
  if (!ctx) throw new Error('useApp must be used within <AppProvider>');
  return ctx;
};
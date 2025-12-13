import { createContext, useContext, useState } from "react";

interface Notification {
  id: string;
  message: string;
  time: string;
}

const NotificationContext = createContext<any>(null);

export function NotificationProvider({ children }: any) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [toastQueue, setToastQueue] = useState<Notification[]>([]);

  const addNotification = (msg: string) => {
    const newNotif: Notification = {
      id: Date.now().toString(),
      message: msg,
      time: new Date().toLocaleTimeString(),
    };

    // Save to history
    setNotifications((prev) => [newNotif, ...prev]);

    // Show toast
    setToastQueue([newNotif]); // always replace old toasts
    setTimeout(() => {
      setToastQueue([]);
    }, 4000); // auto-hide after 4s
  };

  return (
    <NotificationContext.Provider
      value={{ notifications, toastQueue, addNotification }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotifications = () => useContext(NotificationContext);

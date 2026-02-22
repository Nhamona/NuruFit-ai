

export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!("Notification" in window)) {
    console.log("This browser does not support desktop notification");
    return false;
  }

  if (Notification.permission === "granted") {
    return true;
  }

  if (Notification.permission !== "denied") {
    const permission = await Notification.requestPermission();
    return permission === "granted";
  }

  return false;
};

export const sendNotification = (title: string, body: string) => {
  if (!("Notification" in window)) return;

  if (Notification.permission === "granted") {
    try {
      // Tentar usar Service Worker se disponível (melhor para PWA/Mobile)
      if (navigator.serviceWorker && navigator.serviceWorker.ready) {
        navigator.serviceWorker.ready.then((registration) => {
          registration.showNotification(title, {
            body,
            icon: 'https://cdn-icons-png.flaticon.com/512/2964/2964514.png', // Generic fitness icon
            vibrate: [200, 100, 200],
            tag: 'nuru-fit-notification'
          } as any);
        });
      } else {
        // Fallback para notificação padrão do navegador
        new Notification(title, {
          body,
          icon: 'https://cdn-icons-png.flaticon.com/512/2964/2964514.png',
        });
      }
    } catch (e) {
      console.error("Error sending notification", e);
    }
  }
};

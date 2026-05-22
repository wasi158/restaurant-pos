import { useState, useEffect } from 'react';

export function useElectron() {
  const [isElectron, setIsElectron] = useState(false);

  useEffect(() => {
    const userAgent = navigator.userAgent.toLowerCase();
    if (userAgent.indexOf(' electron/') > -1) {
      setIsElectron(true);
    }
  }, []);

  return { isElectron };
}

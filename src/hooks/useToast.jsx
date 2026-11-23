import { createContext, useCallback, useContext, useRef, useState } from 'react';

const Ctx = createContext(null);
export const useToast = () => useContext(Ctx);

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);
  const timer = useRef(0);
  const hide = useCallback(() => { clearTimeout(timer.current); setToast(null); }, []);
  const show = useCallback((kind, title, sub = '', ms = 4500) => {
    setToast({ kind, title, sub }); clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(null), ms);
  }, []);
  return <Ctx.Provider value={{ toast, show, hide }}>{children}</Ctx.Provider>;
}

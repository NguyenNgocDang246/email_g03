import { createContext, useContext } from "react";

export const MailContext = createContext<any>(null);
export const useMail = () => useContext(MailContext);

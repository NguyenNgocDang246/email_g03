import { createContext, useContext } from "react";

interface MailContextValue {
  selectOnNewMail: boolean;
  setSelectOnNewMail: (value: boolean) => void;
  searchSuggestions: string[];
  setSearchSuggestions: (value: string[]) => void;
}

export const MailContext = createContext<MailContextValue | undefined>(undefined);

export const useMail = (): MailContextValue => {
  const context = useContext(MailContext);
  if (!context) {
    throw new Error("useMail must be used within a MailContext.Provider");
  }
  return context;
};

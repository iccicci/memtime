import { createContext, useContext } from "react";

import type { Api } from "./api";

export interface ApiContextValue {
  api: Api;
  serverBusy: boolean;
}

export const ApiContext = createContext<ApiContextValue | null>(null);

export const useApiContext = (): ApiContextValue => {
  const value = useContext(ApiContext);

  if(value === null) throw new Error("useApiContext must be used within App");

  return value;
};

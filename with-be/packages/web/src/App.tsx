import { useMemo, useState } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";

import { Api } from "./api";
import { ApiContext } from "./ApiContext";
import { Browse } from "./Browse";
import { Home } from "./Home";
import { TimeEntries } from "./TimeEntries";
import { TimeEntryForm } from "./TimeEntryForm";

export const App = () => {
  const [serverBusy, setServerBusy] = useState(false);
  const [api] = useState(() => new Api(setServerBusy));
  const context = useMemo(() => ({ api, serverBusy }), [api, serverBusy]);

  return <ApiContext.Provider value={context}>
    <BrowserRouter>
      <Routes>
        <Route element={<Home />} index />
        <Route element={<Browse />} path="browse" />
        <Route element={<TimeEntries />} path="time-entries" />
        <Route element={<TimeEntryForm />} path="time-entries/new" />
        <Route element={<TimeEntryForm />} path="time-entries/:id/edit" />
      </Routes>
    </BrowserRouter>
    {serverBusy ? <p className="server-busy">Server is busy. Please try again later.</p> : null}
  </ApiContext.Provider>;
};

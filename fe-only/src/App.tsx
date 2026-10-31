import { useCallback, useMemo, useState } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";

import { Api } from "./api";
import { ApiContext } from "./ApiContext";
import { Browse } from "./Browse";
import { Home } from "./Home";
import { LoginForm } from "./LoginForm";
import { TimeEntries } from "./TimeEntries";
import { TimeEntryForm } from "./TimeEntryForm";

export const App = () => {
  const [serverBusy, setServerBusy] = useState(false);
  const [api] = useState(() => new Api(setServerBusy));
  const [loggedIn, setLoggedIn] = useState(() => api.isLoggedIn());
  const context = useMemo(() => ({ api, serverBusy }), [api, serverBusy]);

  const handleLogin = useCallback(() => {
    setLoggedIn(true);
  }, []);

  const handleLogout = useCallback(() => {
    api.logout();
    setLoggedIn(false);
  }, [api]);

  return <ApiContext.Provider value={context}>
    {loggedIn ? <BrowserRouter>
      <button className="logout-button" onClick={handleLogout} type="button">
        {"Logout"}
      </button>
      <Routes>
        <Route element={<Home />} index />
        <Route element={<Browse />} path="browse" />
        <Route element={<TimeEntries />} path="time-entries" />
        <Route element={<TimeEntryForm />} path="time-entries/new" />
        <Route element={<TimeEntryForm />} path="time-entries/:id/edit" />
      </Routes>
    </BrowserRouter> : <LoginForm onLogin={handleLogin} />}
    {serverBusy ? <p className="server-busy">Server is busy. Please try again later.</p> : null}
  </ApiContext.Provider>;
};

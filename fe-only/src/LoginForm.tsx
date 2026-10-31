import { type SubmitEvent, useState } from "react";

import { useApiContext } from "./ApiContext";

export const LoginForm = ({ onLogin }: { onLogin: () => void }) => {
  const { api } = useApiContext();
  const [apiKey, setApiKey] = useState("");
  const [error, setError] = useState(false);
  const [pending, setPending] = useState(false);

  const handleSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPending(true);
    setError(false);

    const ok = await api.login(apiKey.trim());

    setPending(false);

    if(ok) onLogin();
    else setError(true);
  };

  return <form
    className="login-form"
    onSubmit={event => {
      void handleSubmit(event);
    }}
  >
    <h1>Memtime</h1>
    <p>Enter your API key to continue.</p>

    <label className="login-form__field" htmlFor="api-key">
        API key
      <input
        autoComplete="off"
        disabled={pending}
        id="api-key"
        name="apiKey"
        onChange={event => {
          setApiKey(event.target.value);
          if(error) setError(false);
        }}
        required
        type="text"
        value={apiKey}
      />
    </label>

    {error ? <p className="login-form__error" role="alert">
      {"The API key is invalid."}
    </p> : null}

    <button disabled={pending || apiKey.trim() === ""} type="submit">
      {pending ? "Checking..." : "Login"}
    </button>
  </form>;
};

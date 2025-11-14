// src/context/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from "react";
import client from "../api/client";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(undefined); // undefined = loading
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("ss.jwt");
    if (token) {
      client
        .get("/auth/me")
        .then((res) => setUser(res.data))
        .catch(() => {
          localStorage.removeItem("ss.jwt");
          localStorage.removeItem("ss.user");
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
      setUser(null);
    }
  }, []);

  const login = async (credentials) => {
    const res = await client.post("/auth/login", credentials);
    const { token, user } = res.data;

    localStorage.setItem("ss.jwt", token);
    localStorage.setItem("ss.user", JSON.stringify(user));
    setUser(user);
    return user;
  };

  const logout = () => {
    localStorage.removeItem("ss.jwt");
    localStorage.removeItem("ss.user");
    setUser(null);
    window.location.href = "/login";
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

// THIS LINE WAS MISSING — THIS IS THE FINAL FIX
export { AuthContext };

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (ctx === undefined) {
    throw new Error("useAuth must be used inside <AuthProvider>");
  }
  return ctx;
};
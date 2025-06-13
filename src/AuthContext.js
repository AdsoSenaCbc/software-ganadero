import React, { createContext, useContext, useState } from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  const login = (role, name, email) => {
    setUser({ role, name, email, profileImage: user?.profileImage || null });
  };

  const logout = () => {
    setUser(null);
  };

  const updateProfileImage = (image) => {
    setUser((prevUser) => ({ ...prevUser, profileImage: image }));
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, updateProfileImage }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import {
  authAPI,
} from "../services/api";

// ========================================
// CONTEXT
// ========================================

const AuthContext =
  createContext();

// ========================================
// AUTH PROVIDER
// ========================================

export const AuthProvider = ({
  children,
}) => {
  // USER

  const [user, setUser] =
    useState(() => {
      const savedUser =
        localStorage.getItem(
          "user"
        );

      return savedUser
        ? JSON.parse(
            savedUser
          )
        : null;
    });

  // TOKEN

  const [token, setToken] =
    useState(
      localStorage.getItem(
        "token"
      )
    );

  // LOADING

  const [loading, setLoading] =
    useState(true);

  // ========================================
  // LOAD USER
  // ========================================

  useEffect(() => {
    const loadUser =
      async () => {
        if (!token) {
          setLoading(false);

          return;
        }

        try {
          const res =
            await authAPI.getMe();

          // SAVE USER

          setUser(res.data);

          localStorage.setItem(
            "user",

            JSON.stringify(
              res.data
            )
          );
        } catch (err) {
          // CLEAR STORAGE

          localStorage.removeItem(
            "token"
          );

          localStorage.removeItem(
            "user"
          );

          setToken(null);

          setUser(null);
        } finally {
          setLoading(false);
        }
      };

    loadUser();
  }, [token]);

  // ========================================
  // LOGIN
  // ========================================

  const login =
    async (
      email,
      password
    ) => {
      const res =
        await authAPI.login({
          email,
          password,
        });

      // SAVE TOKEN

      localStorage.setItem(
        "token",
        res.data.token
      );

      // SAVE USER

      localStorage.setItem(
        "user",

        JSON.stringify(
          res.data.user
        )
      );

      // UPDATE STATE

      setToken(
        res.data.token
      );

      setUser(
        res.data.user
      );

      return res.data;
    };

  // ========================================
  // REGISTER
  // ========================================

  const register =
    async (data) => {
      const res =
        await authAPI.register(
          data
        );

      // SAVE TOKEN

      localStorage.setItem(
        "token",
        res.data.token
      );

      // SAVE USER

      localStorage.setItem(
        "user",

        JSON.stringify(
          res.data.user
        )
      );

      // UPDATE STATE

      setToken(
        res.data.token
      );

      setUser(
        res.data.user
      );

      return res.data;
    };

  // ========================================
  // LOGOUT
  // ========================================

  const logout = () => {
    // CLEAR STORAGE

    localStorage.removeItem(
      "token"
    );

    localStorage.removeItem(
      "user"
    );

    // CLEAR STATE

    setToken(null);

    setUser(null);
  };

  // ========================================
  // UPDATE PROFILE
  // ========================================

  const updateProfile =
    async (data) => {
      const res =
        await authAPI.updateMe(
          data
        );

      // UPDATE USER

      setUser(res.data);

      // UPDATE STORAGE

      localStorage.setItem(
        "user",

        JSON.stringify(
          res.data
        )
      );

      return res.data;
    };

  // ========================================
  // CONTEXT VALUE
  // ========================================

  const value = {
    user,

    token,

    loading,

    login,

    register,

    logout,

    updateProfile,

    isAuthenticated:
      !!token,
  };

  return (
    <AuthContext.Provider
      value={value}
    >
      {children}
    </AuthContext.Provider>
  );
};

// ========================================
// USE AUTH
// ========================================

export const useAuth = () =>
  useContext(AuthContext);

export default AuthContext;
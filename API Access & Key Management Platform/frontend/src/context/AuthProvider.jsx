import { useEffect, useState, useCallback, useRef } from "react";
import { AuthContext } from "./AuthContext";
import { authService, hasSession, clearTokens } from "../services";

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [authLoading, setAuthLoading] = useState(hasSession());
    const [authMode, setAuthMode] = useState("login");

    const restorePromiseRef = useRef(null);

    const restoreSession = useCallback(() => {
        if (!hasSession()) {
            setAuthLoading(false);
            return Promise.resolve(null);
        }

        // Reuse an ongoing session restoration request.
        if (restorePromiseRef.current) {
            return restorePromiseRef.current;
        }

        const request = (async () => {
            try {
                const currentUser = await authService.me();
                setUser(currentUser);
                return currentUser;
            } catch {
                clearTokens();
                setUser(null);
                return null;
            } finally {
                setAuthLoading(false);
            }
        })();

        restorePromiseRef.current = request;

        const clearRequest = () => {
            if (restorePromiseRef.current === request) {
                restorePromiseRef.current = null;
            }
        };

        request.then(clearRequest, clearRequest);

        return request;
    }, []);

    useEffect(() => {
        void restoreSession();

        const onExpired = () => {
            setUser(null);
        };

        window.addEventListener("session-expired", onExpired);
        return () => {
            window.removeEventListener("session-expired", onExpired);
        };
    }, [restoreSession]);

    const login = useCallback(async (email, password) => {
        await authService.login(email, password);
        const currentUser = await authService.me();
        setUser(currentUser);
        return currentUser;
    }, []);

    const register = useCallback(async (email, password) => {
        const result = await authService.register(email, password);
        setAuthMode("login");
        return result;
    }, []);

    const logout = useCallback(async () => {
        try {
            await authService.logout();
        } catch {
            clearTokens();
        } finally {
            setUser(null);
        }
    }, []);

    return (
        <AuthContext.Provider
            value={{
                user,
                setUser,
                authLoading,
                authMode,
                setAuthMode,
                login,
                register,
                logout,
                restoreSession,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export default AuthProvider;


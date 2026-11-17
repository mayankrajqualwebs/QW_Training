import { useState } from "react";
import { KeyRound } from "lucide-react";
import { useAuth } from "../../../hooks/useAuth";
import { errorMessage } from "../../../utils/error";

export function AuthScreen() {
    const { authMode, setAuthMode, login, register } = useAuth();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");

    async function submitAuth(event) {
        event.preventDefault();
        setError("");
        setLoading(true);
        try {
            if (authMode === "register") {
                await register(email, password);
                setNotice("Account created successfully! Please sign in with your credentials.");
            } else {
                await login(email, password);
                setNotice("Signed in successfully.");
            }
        } catch (e) {
            setError(errorMessage(e));
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="auth-screen">
            <form className="auth-card" onSubmit={submitAuth}>
                <div className="brand-mark">
                    <KeyRound size={24} />
                </div>
                <p className="auth-kicker">KEYFLOW PLATFORM</p>
                <h1>{authMode === "login" ? "Welcome back" : "Create developer account"}</h1>
                <p className="auth-subtitle">
                    {authMode === "login"
                        ? "Sign in to manage your organizations, API keys, and monitor usage."
                        : "Register to start provisioning API keys with fine-grained scopes."}
                </p>
                {error && <div className="alert alert-error">{error}</div>}
                {notice && <div className="alert alert-success">{notice}</div>}
                <label>Email address</label>
                <input
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="developer@example.com"
                />
                <label>Password</label>
                <input
                    type="password"
                    autoComplete={authMode === "login" ? "current-password" : "new-password"}
                    minLength={12}
                    maxLength={128}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 12 characters"
                />
                <button className="primary-button full-width" disabled={loading}>
                    {loading ? "Authenticating…" : authMode === "login" ? "Sign in" : "Create account"}
                </button>
                <p className="auth-switch">
                    {authMode === "login" ? "New to the platform?" : "Already registered?"}{" "}
                    <button
                        type="button"
                        onClick={() => {
                            setAuthMode(authMode === "login" ? "register" : "login");
                            setError("");
                            setNotice("");
                        }}
                    >
                        {authMode === "login" ? "Create an account" : "Sign in"}
                    </button>
                </p>
                {authMode === "register" && (
                    <p className="auth-footnote">
                        Password must contain at least 12 characters for secure credential hashing.
                    </p>
                )}
            </form>
        </div>
    );
}

export default AuthScreen;


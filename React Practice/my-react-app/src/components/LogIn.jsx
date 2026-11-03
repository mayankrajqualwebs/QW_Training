// Filename - LogIn.js
import { useState } from "react";
import { useNavigate } from "react-router-dom";
function authenticateUser(userName, password) {
    return userName === "admin" && password === "1234";
}

export default function Login() {
    const [userName, setUserName] = useState("");
    const [password, setPassword] = useState("");
    const navigate = useNavigate();

    const handleClick = () => {
        const isValid = authenticateUser(userName, password);

        if (isValid) {
            navigate(`/profile/${userName}`);
        } else {
            alert("Invalid login");
        }
    };

    return (
        <div>
            <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
            />
            <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
            />
            <button type="button" onClick={handleClick}>
                Log In
            </button>
        </div>
    );
}
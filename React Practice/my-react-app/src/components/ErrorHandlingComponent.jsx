// ErrorHandlingComponent 
import React, { useState } from "react";

const ErrorHandlingComponent = () => {
    const [message, setMessage] = useState("");

    const handleClick = () => {
        try {
            const randomNum = Math.random();
            if (randomNum > 0.5) {
                throw new Error("You can't click twice!");
            }
            setMessage("Operation successful ✅");
        } catch (error) {
            setMessage(`Error: ${error.message} ❌`);
        }
    };

    return (
        <div style={{ textAlign: "center", marginTop: "20px" }}>
            <h2>Try-Catch in React Event Handler</h2>
            <button onClick={handleClick}
                style={{ padding: "10px", fontSize: "16px" }}>
                Click Me
            </button>
            <p>{message}</p>
        </div>
    );
};

export default ErrorHandlingComponent;
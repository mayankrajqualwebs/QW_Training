// BuggyComponent.js

import React, { useState } from "react";

const BuggyComponent = () => {
    const [count, setCount] = useState(0);

    const handleClick = () => {
        if (count >= 2) {
            throw new Error("You clicked too many times! 🚨");
        }
        setCount(count + 1);
    };

    return (
        <div style={{ marginLeft: "20px", marginTop: "20px" }}>
            <div style={{
                display: "flex", flexDirection: "column",
                alignItems: "flex-start", gap: "20px"
            }}>
                <h2>Click the button, but not too much! 😁</h2>
                <button onClick={handleClick} style={{
                    padding: "10px",
                    fontSize: "16px"
                }}>
                    Click Me ({count})
                </button>
            </div>
        </div>
    );
};

export default BuggyComponent;
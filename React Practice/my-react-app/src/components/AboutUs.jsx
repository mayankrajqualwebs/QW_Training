import React from "react";

const About = () => {
    return (
        <div style={{ textAlign: "center", maxWidth: "600px" }}>
            <h2 style={{ color: "#2c3e50" }}>About Us</h2>
            <p style={{ fontSize: "18px", fontWeight: "bold" }}>
                GeeksforGeeks is a computer science portal. You can visit it here:
                <a
                    href="https://www.geeksforgeeks.org/"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                        textDecoration: "none",
                        color: "#007bff",
                        fontWeight: "bold",
                    }}
                >
                    GeeksforGeeks
                </a>
            </p>
        </div>
    );
};

export default About;
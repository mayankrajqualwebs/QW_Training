//ApiComponent.js
import React, { useState } from "react";
import { fetchData } from "../services/ApiService";

const ApiComponent = () => {
    const [data, setData] = useState(null);
    const [error, setError] = useState("");

    const handleFetch = async () => {
        try {
            setError("");
            setData(null);
            const result = await fetchData();
            setData(result);
        } catch (error) {
            setError(error.message);
        }
    };

    return (
        <div style={{ textAlign: "center", marginTop: "20px" }}>
            <h2>API Error Handling in React</h2>
            <button onClick={handleFetch} style={{ padding: "10px", fontSize: "16px" }}>
                Fetch Data
            </button>
            {error && <p style={{ color: "red", fontWeight: "bold" }}>❌ {error}</p>}
            {data && (
                <div>
                    <h3>✅ Data Fetched Successfully:</h3>
                    <p><strong>Title:</strong> {data.title}</p>
                </div>
            )}
        </div>
    );
};

export default ApiComponent;
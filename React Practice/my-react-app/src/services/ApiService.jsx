//ApiService.js
export const fetchData = async () => {
    try {

        const response = await fetch("https://jsonplaceholder.typicode.com/invalid-url");

        if (!response.ok) {
            throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        throw new Error(`Failed to fetch data: ${error.message}`);
    }
};
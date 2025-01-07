import React, { createContext, useState, useEffect } from "react";

export const GlobalContext = createContext();

export const GlobalProvider = ({ children }) => {
    const [variables, setVariables] = useState({});

    const [ip, setIp] = useState("");

    // Fetch the variables from the API
    const fetchVariables = async () => {
        try {
            const response = await fetch("/get-vars");
            const data = await response.json();
            console.log('Fetched data:', data);
            setVariables(data); // Set fetched data to the global state
        } catch (error) {
            console.error("Error fetching variables:", error);
        }
    };

    // Call the fetch on component mount
    useEffect(() => {
        fetchVariables();
    }, []);

    // Function to update variables by re-fetching the API
    const updateVariables = async () => {
        await fetchVariables();  // Re-fetch from the API

    };

    return (
        <GlobalContext.Provider value={{ variables, setVariables, updateVariables }}>
            {children}
        </GlobalContext.Provider>
    );
};

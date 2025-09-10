import React, { useState } from "react";

const Dashboard = () => {
    const [sidebarOpen, setSidebarOpen] = useState(true);

    const toggleSidebar = () => {
        setSidebarOpen(!sidebarOpen);
    };

    return (
        <div className="flex h-screen w-screen bg-white">
            {/* Sidebar */}
            <div className={`${sidebarOpen ? "w-64" : "w-20"} bg-gradient-to-r from-blue-500 to-purple-600 text-white transition-all duration-300`} >
                <div className="p-4 flex items-center justify-between">
                    <h1 className={`text-xl font-bold ${!sidebarOpen && "hidden"}`}>Cámaras</h1>
                    <button onClick={toggleSidebar} className="text-white focus:outline-none">
                        {sidebarOpen ? "←" : "→"}
                    </button>
                </div>
                <ul className="mt-4">
                    {Array.from({ length: 5 }, (_, i) => (
                        <li
                            key={i}
                            className="p-4 hover:bg-blue-700 cursor-pointer text-center"
                        >
                            Opción {i + 1}
                        </li>
                    ))}
                </ul>
            </div>

            {/* Main Content */}
            <div className="flex-1 p-6">
                <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Array.from({ length: 6 }, (_, i) => (
                        <div
                            key={i}
                            className="bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300"
                        >
                            <h2 className="text-lg font-semibold">Cámara {i + 1}</h2>
                            <p className="text-gray-600">Descripción de la cámara {i + 1}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
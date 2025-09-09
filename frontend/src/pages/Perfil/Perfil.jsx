import React, { useState } from "react";

const profiles = [
    { id: 1, name: "Usuario 1", avatar: "https://via.placeholder.com/150", pin: "1234" },
    { id: 2, name: "Usuario 2", avatar: "https://via.placeholder.com/150", pin: "5678" },
    { id: 3, name: "Usuario 3", avatar: "https://via.placeholder.com/150", pin: "9101" },
    { id: 4, name: "Usuario 4", avatar: "https://via.placeholder.com/150", pin: "1122" },
];

const Perfil = () => {
    const [selectedProfile, setSelectedProfile] = useState(null);
    const [enteredPin, setEnteredPin] = useState("");
    const [error, setError] = useState("");

    const handleProfileClick = (profile) => {
        setSelectedProfile(profile);
        setEnteredPin("");
        setError("");
    };

    const handlePinSubmit = () => {
        if (enteredPin === selectedProfile.pin) {
            alert(`Bienvenido, ${selectedProfile.name}`);
            // Aquí puedes redirigir al usuario a otra página o realizar alguna acción
        } else {
            setError("PIN incorrecto. Inténtalo de nuevo.");
        }
    };

    return (
        <div className="h-screen w-screen bg-gradient-to-r from-blue-500 to-purple-600 flex flex-col items-center justify-center text-white">
            {!selectedProfile ? (
                <>
                    <h1 className="text-4xl font-bold mb-8">Selecciona tu perfil</h1>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        {profiles.map((profile) => (
                            <div
                                key={profile.id}
                                className="flex flex-col items-center cursor-pointer hover:scale-105 transition-transform duration-300"
                                onClick={() => handleProfileClick(profile)}
                            >
                                <img
                                    src={profile.avatar}
                                    alt={profile.name}
                                    className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-white shadow-lg"
                                />
                                <p className="mt-4 text-lg font-medium">{profile.name}</p>
                            </div>
                        ))}
                    </div>
                </>
            ) : (
                <div className="flex flex-col items-center">
                    <h2 className="text-2xl font-bold mb-4">Introduce el PIN para {selectedProfile.name}</h2>
                    <input
                        type="password"
                        value={enteredPin}
                        onChange={(e) => setEnteredPin(e.target.value)}
                        maxLength={4}
                        className="text-black px-4 py-2 rounded-lg text-center text-xl"
                        placeholder="****"
                    />
                    {error && <p className="text-red-500 mt-2">{error}</p>}
                    <button
                        onClick={handlePinSubmit}
                        className="mt-4 bg-white text-blue-600 font-semibold py-2 px-6 rounded-lg shadow-lg hover:bg-gray-100 focus:outline-none focus:ring-4 focus:ring-white focus:ring-opacity-50 transition-all duration-300"
                    >
                        Confirmar
                    </button>
                </div>
            )}
        </div>
    );
};

export default Perfil;
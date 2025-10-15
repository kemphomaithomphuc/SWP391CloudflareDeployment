import React, { useState, useEffect } from "react";
import axios from "axios";
import { Edit, Save, ArrowLeft, Trash, Plus, X, RefreshCw } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { useLanguage } from "../contexts/LanguageContext";
import { toast } from "react-hot-toast";


interface VehicleViewProps {
    onBack: () => void;
}

interface Vehicle {
    plateNumber: string;
    brand: string;
    model: string;
    capacity: number;
    productYear: number;
}

export default function VehicleView({ onBack }: VehicleViewProps) {
    const { t } = useLanguage();
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [editingPlate, setEditingPlate] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const userId = localStorage.getItem("userId");
    const token = localStorage.getItem("token");

    const [newVehicle, setNewVehicle] = useState<Vehicle>({
        plateNumber: "",
        brand: "",
        model: "",
        capacity: 0,
        productYear: new Date().getFullYear(),
    });

    const [showAddForm, setShowAddForm] = useState(false);

    // Load vehicles khi component mount
    useEffect(() => {
        const fetchVehicles = async () => {
            if (!token || !userId) {
                setError("Missing token or userId");
                return;
            }
            try {
                setLoading(true);
                setError(null);
                console.log("Fetching vehicles for userId:", userId);
                const response = await axios.get(`http://localhost:8080/api/vehicles/user/${userId}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const data = response.data.data || response.data;  // Nested nếu BE APIResponse
                setVehicles(data || []);  // Fallback [] nếu no data
                console.log("Vehicles fetched:", data);
            } catch (err: any) {
                console.error("Fetch vehicles error:", err);
                if (err.response?.status === 500) {
                    setError("BE server error (500). Check /api/vehicles/user/{id} endpoint or DB query.");
                } else if (err.response?.status === 404) {
                    setError("Endpoint not found (404). Check BE mapping for /api/vehicles/user/{id}.");
                } else {
                    setError(t("Failed to load Vehicle") + ": " + (err.response?.data?.message || err.message));
                }
                setVehicles([]);  // Fallbackempty list
            } finally {
                setLoading(false);
            }
        };

        fetchVehicles();
    }, [t, token, userId]);

    // Save vehicle (edit)
    const handleSave = async (vehicle: Vehicle) => {
        if (!token || !userId) return;
        try {
            setLoading(true);
            setError(null);
            const response = await axios.put(
                `http://localhost:8080/api/vehicles/${vehicle.plateNumber}`,
                { ...vehicle, userId: parseInt(userId) },
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            setEditingPlate(null);
            setVehicles((prev) =>
                prev.map((v) => (v.plateNumber === vehicle.plateNumber ? vehicle : v))
            );
            console.log("Vehicle saved:", response.data);
        } catch (err: any) {
            console.error("Save vehicle error:", err);
            setError(t("Failed to save vehicle") + ": " + (err.response?.data?.message || err.message));
        } finally {
            setLoading(false);
        }
    };

    // Add vehicle
    const handleAdd = async () => {
        if (!token || !userId) return;
        try {
            setLoading(true);
            setError(null);
            const vehicleToAdd = { ...newVehicle, userId: parseInt(userId) };  // Thêm userId vào body
            const response = await axios.post(
                "http://localhost:8080/api/vehicles",
                vehicleToAdd,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            const newVeh = response.data.data || response.data;  // Nested
            setVehicles([...vehicles, newVeh]);
            setNewVehicle({
                plateNumber: "",
                brand: "",
                model: "",
                capacity: 0,
                productYear: new Date().getFullYear(),
            });
            setShowAddForm(false);
            console.log("Vehicle added:", newVeh);
        } catch (err: any) {
            console.error("Add vehicle error:", err);
            toast.error("You're adding duplicate Data.");
        } finally {
            setLoading(false);
        }
    };

    // Delete vehicle
    const handleDelete = async (plateNumber: string) => {
        if (!token || !userId) return;
        try {
            setLoading(true);
            setError(null);
            const response = await axios.delete(
                `http://localhost:8080/api/vehicles/user/${userId}/vehicle/${plateNumber}`,  // Singular "vehicle" từ BE controller
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            setVehicles((prev) => prev.filter((v) => v.plateNumber !== plateNumber));
            console.log("Vehicle deleted:", response.data);
        } catch (err: any) {
            console.error("Delete vehicle error:", err);
            setError(t("Failed to delete vehicle") + ": " + (err.response?.data?.message || err.message));
        } finally {
            setLoading(false);
        }
    };

    const handleVehicleChange = (
        plateNumber: string,
        field: keyof Vehicle,
        value: string | number
    ) => {
        setVehicles((prev) =>
            prev.map((v) =>
                v.plateNumber === plateNumber ? { ...v, [field]: value } : v
            )
        );
    };

    const handleNewVehicleChange = (
        field: keyof Vehicle,
        value: string | number
    ) => {
        setNewVehicle((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    if (loading && vehicles.length === 0) return <p>{t("loading")}...</p>;
    if (error) return (
        <div className="p-6">
            <p style={{ color: "red" }}>{error}</p>
            <Button onClick={() => window.location.reload()} className="mt-2 flex items-center space-x-2">
                <RefreshCw className="w-4 h-4" />
                <span>Retry</span>
            </Button>
        </div>
    );

    return (
        <div className="space-y-6">
            {/* Nút toggle form thêm mới */}
            <div className="flex justify-end">
                <Button
                    onClick={() => setShowAddForm(!showAddForm)}
                    className="flex items-center space-x-2"
                >
                    {showAddForm ? (
                        <>
                            <X className="w-4 h-4" />
                            <span>{t("Close Form")}</span>
                        </>
                    ) : (
                        <>
                            <Plus className="w-4 h-4" />
                            <span>{t("Add Vehicle")}</span>
                        </>
                    )}
                </Button>
            </div>

            {/* Form thêm mới (chỉ hiện khi bật showAddForm) */}
            {showAddForm && (
                <Card className="p-4 space-y-4">
                    <h2 className="text-lg font-semibold">{t("add_vehicle")}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="plateNumber">{t("Plate_number")}</Label>
                            <Input
                                id="plateNumber"
                                value={newVehicle.plateNumber}
                                onChange={(e) =>
                                    handleNewVehicleChange("plateNumber", e.target.value)
                                }
                            />
                        </div>

                        <div>
                            <Label htmlFor="brand">{t("Brand")}</Label>
                            <Input
                                id="brand"
                                value={newVehicle.brand}
                                onChange={(e) =>
                                    handleNewVehicleChange("brand", e.target.value)
                                }
                            />
                        </div>

                        <div>
                            <Label htmlFor="model">{t("Model")}</Label>
                            <Input
                                id="model"
                                value={newVehicle.model}
                                onChange={(e) =>
                                    handleNewVehicleChange("model", e.target.value)
                                }
                            />
                        </div>

                        <div>
                            <Label htmlFor="capacity">{t("Capacity")}</Label>
                            <Input
                                id="capacity"
                                type="number"
                                value={newVehicle.capacity}
                                onChange={(e) =>
                                    handleNewVehicleChange("capacity", Number(e.target.value))
                                }
                            />
                        </div>

                        <div>
                            <Label htmlFor="productYear">{t("Product_Year")}</Label>
                            <Input
                                id="productYear"
                                type="number"
                                value={newVehicle.productYear}
                                onChange={(e) =>
                                    handleNewVehicleChange(
                                        "productYear",
                                        Number(e.target.value)
                                    )
                                }
                            />
                        </div>
                    </div>

                    <Button onClick={handleAdd} className="flex items-center space-x-2">
                        <Plus className="w-4 h-4" />
                        <span>{t("Save Vehicle")}</span>
                    </Button>
                </Card>
            )}

            {/* Danh sách vehicle */}
            <div className="min-h-screen bg-background">
                <div className="p-6 max-w-4xl mx-auto">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center space-x-4">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={onBack}
                                className="flex items-center space-x-2"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                <span>{t("Back to Dashboard")}</span>
                            </Button>
                            <h1 className="text-2xl font-semibold text-foreground">
                                {t("Your Vehicles")}
                            </h1>
                        </div>
                    </div>

                    {vehicles.length > 0 ? (
                        vehicles.map((vehicle) => (
                            <Card key={vehicle.plateNumber} className="mb-4">
                                <CardHeader>
                                    <CardTitle>{vehicle.plateNumber}</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>{t("brand")}</Label>
                                            {editingPlate === vehicle.plateNumber ? (
                                                <Input
                                                    value={vehicle.brand}
                                                    onChange={(e) =>
                                                        handleVehicleChange(
                                                            vehicle.plateNumber,
                                                            "brand",
                                                            e.target.value
                                                        )
                                                    }
                                                />
                                            ) : (
                                                <p className="py-2 px-3 bg-muted rounded-md">
                                                    {vehicle.brand}
                                                </p>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <Label>{t("model")}</Label>
                                            {editingPlate === vehicle.plateNumber ? (
                                                <Input
                                                    value={vehicle.model}
                                                    onChange={(e) =>
                                                        handleVehicleChange(
                                                            vehicle.plateNumber,
                                                            "model",
                                                            e.target.value
                                                        )
                                                    }
                                                />
                                            ) : (
                                                <p className="py-2 px-3 bg-muted rounded-md">
                                                    {vehicle.model}
                                                </p>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <Label>{t("capacity")}</Label>
                                            {editingPlate === vehicle.plateNumber ? (
                                                <Input
                                                    type="number"
                                                    value={vehicle.capacity}
                                                    onChange={(e) =>
                                                        handleVehicleChange(
                                                            vehicle.plateNumber,
                                                            "capacity",
                                                            Number(e.target.value)
                                                        )
                                                    }
                                                />
                                            ) : (
                                                <p className="py-2 px-3 bg-muted rounded-md">
                                                    {vehicle.capacity}
                                                </p>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <Label>{t("product_year")}</Label>
                                            {editingPlate === vehicle.plateNumber ? (
                                                <Input
                                                    type="number"
                                                    value={vehicle.productYear}
                                                    onChange={(e) =>
                                                        handleVehicleChange(
                                                            vehicle.plateNumber,
                                                            "productYear",
                                                            Number(e.target.value)
                                                        )
                                                    }
                                                />
                                            ) : (
                                                <p className="py-2 px-3 bg-muted rounded-md">
                                                    {vehicle.productYear}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex space-x-2">
                                        {editingPlate === vehicle.plateNumber ? (
                                            <Button
                                                onClick={() => handleSave(vehicle)}
                                                className="flex items-center space-x-2"
                                            >
                                                <Save className="w-4 h-4" />
                                                <span>{t("Save Changes")}</span>
                                            </Button>
                                        ) : (
                                            <Button
                                                onClick={() => setEditingPlate(vehicle.plateNumber)}
                                                className="flex items-center space-x-2"
                                            >
                                                <Edit className="w-4 h-4" />
                                                <span>{t("Edit Vehicle")}</span>
                                            </Button>
                                        )}

                                        <Button
                                            variant="destructive"
                                            onClick={() => handleDelete(vehicle.plateNumber)}
                                            className="flex items-center space-x-2"
                                        >
                                            <Trash className="w-4 h-4" />
                                            <span>{t("Delete")}</span>
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    ) : (
                        <p>{t("No Vehicle Found")}</p>
                    )}
                </div>
            </div>
        </div>
    );
}

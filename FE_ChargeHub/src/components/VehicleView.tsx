import React, { useEffect, useState } from "react";
import axios from "axios";
import { Edit, Save, ArrowLeft, Trash, Plus, X } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { useLanguage } from "../contexts/LanguageContext";
import { toast } from "react-hot-toast";
import { api } from "../services/api";

// ------------------------- INTERFACES -------------------------
interface CarModel {
    carModelId: number;
    brand: string;
    model: string;
    capacity: number;
    productYear: number;
    imageUrl?: string;
}

interface Vehicle {
    plateNumber: string;
    brand: string;
    carModel?: CarModel;
    capacity?: number;
    productYear?: number;
}

interface VehicleViewProps {
    onBack: () => void;
}

// ------------------------- COMPONENT -------------------------
export default function VehicleView({ onBack }: VehicleViewProps) {
    const { t } = useLanguage();
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [newVehicle, setNewVehicle] = useState<Partial<Vehicle>>({
        plateNumber: "",
        brand: "",
        carModel: undefined,
    });
    const [editingPlate, setEditingPlate] = useState<string | null>(null);
    const [editVehicle, setEditVehicle] = useState<Partial<Vehicle>>({});
    const [carModels, setCarModels] = useState<CarModel[]>([]);
    const [showAddForm, setShowAddForm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [fetchingModels, setFetchingModels] = useState(false);

    const userId = localStorage.getItem("userId");
    const token = localStorage.getItem("token");

    const plateRegex = /^[A-Za-z0-9\s\-]{3,12}$/; // regex kiểm tra plate number

    // ------------------------- FETCH FUNCTIONS -------------------------
    const fetchVehicles = async () => {
        if (!token || !userId) {
            toast.error("Missing token or user ID.");
            return;
        }
        try {
            setLoading(true);
            const res = await api.get(`/api/vehicles/user/${userId}`);
            const data = res.data?.data ?? res.data;
            setVehicles(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Fetch vehicles error:", err);
            toast.error("Failed to load vehicles.");
        } finally {
            setLoading(false);
        }
    };

    const fetchCarModelsByBrand = async (brand: string) => {
        setFetchingModels(true);
        try {
            // Sử dụng endpoint đúng: /api/carModel (không có dấu gạch ngang)
            const res = await api.get(`/api/carModel`);
            const data = res.data?.data ?? res.data;
            const allCarModels = Array.isArray(data) ? data : [];
            
            // Filter car models theo brand ở frontend
            const filteredModels = allCarModels.filter((model: any) => 
                model.brand && model.brand.toLowerCase().includes(brand.toLowerCase())
            );
            
            setCarModels(filteredModels);
        } catch (err) {
            console.error("Fetch car models error:", err);
            toast.error("Could not fetch car models for selected brand.");
            setCarModels([]);
        } finally {
            setFetchingModels(false);
        }
    };

    useEffect(() => {
        fetchVehicles();
    }, []);

    // ------------------------- ADD VEHICLE -------------------------
    const handleAddVehicle = async () => {
        if (!token || !userId) {
            toast.error("Not authenticated.");
            return;
        }

        const plate = (newVehicle.plateNumber ?? "").trim();
        const brand = (newVehicle.brand ?? "").trim();
        const model = newVehicle.carModel;

        if (!plateRegex.test(plate)) return toast.error("Invalid plate number format.");
        if (!brand) return toast.error("Brand is required.");
        if (!model) return toast.error("Please select a car model.");

        try {
            setLoading(true);
            const body = {
                plateNumber: plate,
                brand,
                // Không gửi carModel field - có thể backend không cần
                userId: parseInt(userId as string),
            };
            const res = await api.post("/api/vehicles", body);

            const created = res.data?.data ?? res.data;
            const newVeh: Vehicle = {
                plateNumber: created.plateNumber ?? plate,
                brand,
                carModel: model,
                capacity: model.capacity,
                productYear: model.productYear,
            };

            setVehicles((prev) => [...prev, newVeh]);
            toast.success("Vehicle added successfully.");
            setNewVehicle({ plateNumber: "", brand: "", carModel: undefined });
            setCarModels([]);
            setShowAddForm(false);
        } catch (err: any) {
            console.error("Add vehicle error:", err);
            toast.error(err.response?.data?.message ?? "Failed to add vehicle.");
        } finally {
            setLoading(false);
        }
    };

    // ------------------------- EDIT VEHICLE -------------------------
    const handleEdit = (vehicle: Vehicle) => {
        setEditingPlate(vehicle.plateNumber);
        setEditVehicle({ ...vehicle });
        if (vehicle.brand) fetchCarModelsByBrand(vehicle.brand);
    };

    const handleSaveEdit = async () => {
        if (!editingPlate || !token || !userId) return;

        const brand = editVehicle.brand?.trim() ?? "";
        const model = editVehicle.carModel;
        if (!brand) return toast.error("Brand is required.");
        if (!model) return toast.error("Please select a car model.");

        try {
            setLoading(true);
            const body = {
                plateNumber: editingPlate,
                brand,
                // Không gửi carModel field - có thể backend không cần
                userId: parseInt(userId as string),
            };

            console.log("=== Vehicle Update Debug ===");
            console.log("Payload:", body);
            console.log("Model object:", model);

            const res = await api.put(`/api/vehicles/${editingPlate}/user/${userId}`, body);

            const updated = res.data?.data ?? res.data;
            setVehicles((prev) =>
                prev.map((v) =>
                    v.plateNumber === editingPlate
                        ? { ...v, brand, carModel: model, capacity: model.capacity, productYear: model.productYear }
                        : v
                )
            );
            toast.success("Vehicle updated successfully.");
            setEditingPlate(null);
            setEditVehicle({});
        } catch (err: any) {
            console.error("Update vehicle error:", err);
            toast.error(err.response?.data?.message ?? "Failed to update vehicle.");
        } finally {
            setLoading(false);
        }
    };

    // ------------------------- DELETE VEHICLE -------------------------
    const handleDeleteVehicle = async (plateNumber: string) => {
        if (!token || !userId) {
            toast.error("Not authenticated.");
            return;
        }
        try {
            setLoading(true);
            await api.delete(`/api/vehicles/user/${userId}/vehicle/${encodeURIComponent(plateNumber)}`);
            setVehicles((prev) => prev.filter((v) => v.plateNumber !== plateNumber));
            toast.success("Vehicle deleted.");
        } catch (err: any) {
            console.error("Delete vehicle error:", err);
            toast.error(err.response?.data?.message ?? "Delete failed.");
        } finally {
            setLoading(false);
        }
    };

    // ------------------------- RENDER -------------------------
    return (
        <div className="space-y-6">
            <div className="flex justify-end">
                <Button onClick={() => setShowAddForm(!showAddForm)}>
                    {showAddForm ? <><X className="w-4 h-4" /><span>Close Form</span></> : <><Plus className="w-4 h-4" /><span>Add Vehicle</span></>}
                </Button>
            </div>

            {/* ADD VEHICLE FORM */}
            {showAddForm && (
                <Card className="p-4 space-y-4">
                    <h2 className="text-lg font-semibold">Add Vehicle</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label>Plate Number</Label>
                            <Input value={newVehicle.plateNumber ?? ""} onChange={(e) => setNewVehicle((p) => ({ ...p, plateNumber: e.target.value }))} />
                        </div>
                        <div>
                            <Label>Brand</Label>
                            <Input
                                value={newVehicle.brand ?? ""}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    setNewVehicle((p) => ({ ...p, brand: val }));
                                    if (val.length > 0) fetchCarModelsByBrand(val);
                                }}
                            />
                        </div>
                    </div>

                    {carModels.length > 0 && (
                        <div>
                            <Label>Available Models</Label>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {carModels.map((m) => (
                                    <div
                                        key={m.carModelId}
                                        className={`p-3 border rounded cursor-pointer ${newVehicle.carModel?.carModelId === m.carModelId ? "border-primary bg-primary/5" : ""}`}
                                        onClick={() => setNewVehicle((p) => ({ ...p, carModel: m }))}
                                    >
                                        <div className="flex items-center space-x-3">
                                            <img src={m.imageUrl || "https://via.placeholder.com/80"} alt={m.model} className="w-16 h-10 object-cover rounded" />
                                            <div>
                                                <div className="font-medium">{m.model}</div>
                                                <div className="text-sm text-muted">{m.capacity} kW • {m.productYear}</div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <Button onClick={handleAddVehicle} className="bg-primary text-white">Save Vehicle</Button>
                </Card>
            )}

            {/* VEHICLE LIST */}
            <div className="p-6 max-w-4xl mx-auto">
                <Button variant="outline" size="sm" onClick={onBack} className="mb-4">
                    <ArrowLeft className="w-4 h-4" /><span>Back</span>
                </Button>

                {vehicles.length > 0 ? (
                    vehicles.map((v) => (
                        <Card key={v.plateNumber} className="mb-4">
                            <CardHeader><CardTitle>{v.plateNumber}</CardTitle></CardHeader>
                            <CardContent>
                                {editingPlate === v.plateNumber ? (
                                    <>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <Label>Brand</Label>
                                                <Input value={editVehicle.brand ?? ""} onChange={(e) => { const val = e.target.value; setEditVehicle((p) => ({ ...p, brand: val })); if (val) fetchCarModelsByBrand(val); }} />
                                            </div>

                                            <div>
                                                <Label>Model</Label>
                                                {carModels.length > 0 && (
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                                                        {carModels.map((m) => (
                                                            <div
                                                                key={m.carModelId}
                                                                className={`p-3 border rounded cursor-pointer ${editVehicle.carModel?.carModelId === m.carModelId ? "border-primary bg-primary/5" : ""}`}
                                                                onClick={() => setEditVehicle((p) => ({ ...p, carModel: m }))}
                                                            >
                                                                <div className="flex items-center space-x-3">
                                                                    <img src={m.imageUrl || "https://via.placeholder.com/80"} alt={m.model} className="w-16 h-10 object-cover rounded" />
                                                                    <div>
                                                                        <div className="font-medium">{m.model}</div>
                                                                        <div className="text-sm text-muted">{m.capacity} kW • {m.productYear}</div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {editVehicle.carModel?.imageUrl && (
                                            <div className="mt-4">
                                                <Label>Preview</Label>
                                                <img src={editVehicle.carModel.imageUrl} alt="Preview" className="w-48 rounded-md mt-2 shadow" />
                                            </div>
                                        )}

                                        <div className="flex space-x-2 mt-4">
                                            <Button onClick={handleSaveEdit} className="bg-green-600 text-white"><Save className="w-4 h-4" /><span>Save</span></Button>
                                            <Button variant="outline" onClick={() => setEditingPlate(null)}>Cancel</Button>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div><Label>Brand</Label><p className="py-2 px-3 bg-muted rounded">{v.brand}</p></div>
                                            <div><Label>Model</Label><p className="py-2 px-3 bg-muted rounded">{v.carModel?.model ?? "N/A"}</p></div>
                                            <div><Label>Capacity</Label><p className="py-2 px-3 bg-muted rounded">{v.capacity ?? "-"}</p></div>
                                            <div><Label>Year</Label><p className="py-2 px-3 bg-muted rounded">{v.productYear ?? "-"}</p></div>
                                        </div>

                                        {v.carModel?.imageUrl && (
                                            <img src={v.carModel.imageUrl} alt="car" className="w-48 mt-3 rounded shadow" />
                                        )}

                                        <div className="flex space-x-2 mt-4">
                                            <Button onClick={() => handleEdit(v)}><Edit className="w-4 h-4" /><span>Edit</span></Button>
                                            <Button variant="destructive" onClick={() => handleDeleteVehicle(v.plateNumber)}>
                                                <Trash className="w-4 h-4" /><span>Delete</span>
                                            </Button>
                                        </div>
                                    </>
                                )}
                            </CardContent>
                        </Card>
                    ))
                ) : (
                    <p>No vehicles found.</p>
                )}
            </div>
        </div>
    );
}

import React, { useEffect, useState } from "react";
import { Edit, Save, ArrowLeft, Trash, Plus, X } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog";
import { useLanguage } from "../contexts/LanguageContext";
import { toast } from "sonner";
import { api } from "../services/api";

// ------------------------- INTERFACES -------------------------
interface CarModel {
    carModelId: number;
    brand: string;
    model: string;
    capacity: number;
    productYear: number;
    imageUrl?: string;
    carModelImage?: string;
    connectorTypeId?: string;
}

interface Vehicle {
    plateNumber: string;
    brand: string;
    carModel?: CarModel;
    capacity?: number;
    productYear?: number;
    connectorTypeName?: string;
}

interface VehicleViewProps {
    onBack: () => void;
}
interface ConnectorType {
    TypeName: string;
    ConnectorTypeId: string;
    PowerOutput?: number;
    PricePerKwh?: number;
}

// ------------------------- COMPONENT -------------------------
export default function VehicleView({ onBack }: VehicleViewProps) {
    const { t, language } = useLanguage();
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [newVehicle, setNewVehicle] = useState<Partial<Vehicle>>({
        plateNumber: "",
        brand: "",
    });
    const [editingPlate, setEditingPlate] = useState<string | null>(null);
    const [editVehicle, setEditVehicle] = useState<Partial<Vehicle>>({});
    const [showAddForm, setShowAddForm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedBrand, setSelectedBrand] = useState<string>("");
    const [selectedModel, setSelectedModel] = useState<string>("");
    const [carModels, setCarModels] = useState<CarModel[]>([]);
    const [selectedCarModel, setSelectedCarModel] = useState<CarModel | null>(null);
    const [selectedCarModelId, setSelectedCarModelId] = useState<number | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const vehiclesPerPage = 2;
    
    // 🆕 Delete confirmation dialog state
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [vehicleToDelete, setVehicleToDelete] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isCheckingStatus, setIsCheckingStatus] = useState(false);

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
            const vehiclesData = await getVehicleOfDriver(userId);
            if (vehiclesData) {
                setVehicles(vehiclesData);
            }
        } catch (err) {
            console.error("Fetch vehicles error:", err);
            toast.error("Failed to load vehicles.");
        }
    };

    const getVehicleOfDriver = async (userId: string): Promise<Vehicle[] | null> => {
        setLoading(true);
        setError(null);
        try {
            const res = await api.get(`/api/user/${userId}/vehicles`);
            if (res.data.success && res.data.data) {
                const vehiclesData = res.data.data;
                
                // Fetch connector type names for each vehicle that has carModel
                const vehiclesWithConnectorTypes = await Promise.all(
                    vehiclesData.map(async (vehicle: any) => {
                        if (vehicle.carModel?.connectorTypeIds?.[0]) {
                            const connectorType = await fetchConnectorTypeById(vehicle.carModel.connectorTypeIds[0].toString());
                            return {
                                plateNumber: vehicle.plateNumber,
                                brand: vehicle.carModel?.brand || "Unknown",
                                carModel: vehicle.carModel ? {
                                    carModelId: vehicle.carModel.carModelId,
                                    brand: vehicle.carModel.brand,
                                    model: vehicle.carModel.model,
                                    capacity: vehicle.carModel.capacity,
                                    productYear: vehicle.carModel.productYear,
                                    carModelImage: vehicle.carModel.carModelImage,
                                    imageUrl: vehicle.carModel.carModelImage,
                                    connectorTypeId: vehicle.carModel.connectorTypeIds[0].toString()
                                } : undefined,
                                capacity: vehicle.carModel?.capacity,
                                productYear: vehicle.carModel?.productYear,
                                connectorTypeName: connectorType?.TypeName || "Unknown",
                                vehicleId: vehicle.vehicleId || vehicle.id, // Add vehicleId
                                id: vehicle.id // Add id for compatibility
                            };
                        }
                        return {
                            plateNumber: vehicle.plateNumber,
                            brand: vehicle.carModel?.brand || "Unknown",
                            carModel: vehicle.carModel ? {
                                carModelId: vehicle.carModel.carModelId,
                                brand: vehicle.carModel.brand,
                                model: vehicle.carModel.model,
                                capacity: vehicle.carModel.capacity,
                                productYear: vehicle.carModel.productYear,
                                carModelImage: vehicle.carModel.carModelImage,
                                imageUrl: vehicle.carModel.carModelImage,
                                connectorTypeId: vehicle.carModel.connectorTypeIds?.[0]?.toString()
                            } : undefined,
                            capacity: vehicle.carModel?.capacity,
                            productYear: vehicle.carModel?.productYear,
                            connectorTypeName: "Unknown",
                            vehicleId: vehicle.vehicleId || vehicle.id, // Add vehicleId
                            id: vehicle.id // Add id for compatibility
                        };
                    })
                );
                
                return vehiclesWithConnectorTypes;
            }
        } catch (err) {
            console.error("Error fetching vehicles:", err);
            setError("Failed to load vehicles.");
            return null;
        } finally {
            setLoading(false);
        }
        return null;
    }

    const fetchConnectorTypeById = async (connectorTypeId: string): Promise<ConnectorType | null> => {
        try {
            const res = await api.get(`/api/connector-types/${connectorTypeId}`);
            if (res.status === 200) {
                const connector = res.data;
                return {
                    TypeName: connector.typeName,
                    ConnectorTypeId: connector.connectorTypeId,
                    PowerOutput: connector.powerOutput,
                    PricePerKwh: connector.pricePerKwh,
                } as ConnectorType;
            }
        } catch (err) {
            console.error("Error fetching connector type:", err);
            return null;
        }
        return null;
    }

    const fetchConnectorType = async(): Promise<ConnectorType[] | null> => {
        try {
            const res = await api.get("/api/connector-types");
            if (res.status === 200) {
                return (res.data as any[]).map((connector) => ({ 
                    TypeName: connector.TypeName,
                    ConnectorTypeId: connector.connectorTypeId
                })) as ConnectorType[];
            }
        } catch (err) {
            console.error("Error fetching connector types:", err);
        }
        return null;
    };

    const fetchCarModels = async(): Promise<CarModel[] | null> => {
        setLoading(true);
        setError(null);
        try {
            const res = await api.get("/api/carModel");
            if (res.status === 200 && res.data.success) {
                const validModels = res.data.data.filter((model: any) => 
                    model.brand && model.model && model.brand !== null && model.model !== null
                );
                
                return validModels.map((model: any) => ({
                    carModelId: model.carModelId,
                    brand: model.brand,
                    model: model.model,
                    capacity: model.capacity || 0,
                    productYear: model.productYear || 0,
                    connectorTypeId: model.connectorTypeIds?.[0],
                    carModelImage: model.carModelImage,
                    imageUrl: model.carModelImage
                })) as CarModel[];
            }
        } catch (err) {
            console.error("Error fetching car models:", err);
            setError(language === 'vi' ? 'Lỗi khi tải danh sách xe' : 'Error loading car models');
            return null;
        }
        return null;
    }

    const filterCarModesByConnector = async(): Promise<CarModel[] | null> => {
        setLoading(true);
        setError(null);
        try {
            const connectorTypes = await fetchConnectorType();
            const carModelsData = await fetchCarModels();
            
            if (connectorTypes && carModelsData) {
                const filteredModels = carModelsData.filter((car) =>
                    car.connectorTypeId && connectorTypes.some((connector) => 
                        connector.ConnectorTypeId === car.connectorTypeId
                    )
                );
                return filteredModels;
            }
            
            return carModelsData;
        } catch (err) {
            console.error("Error filtering car models:", err);
            setError(language === 'vi' ? 'Lỗi khi lọc danh sách xe' : 'Error filtering car models');
            return null;
        }
    }



    // Get unique brands from carModels
    const getUniqueBrands = (): string[] => {
        if (!carModels || carModels.length === 0) return [];
        const brands = [...new Set(carModels.map(model => model.brand))];
        return brands.sort();
    };

    // Get models filtered by selected brand
    const getModelsByBrand = (brand: string): string[] => {
        console.log("=== GET MODELS BY BRAND DEBUG ===");
        console.log("Requested brand:", brand);
        console.log("Car models available:", carModels?.length || 0);
        
        if (!carModels || !brand) {
            console.log("No car models or brand, returning empty array");
            return [];
        }
        
        const models = carModels
            .filter(model => model.brand === brand)
            .map(model => model.model);
        
        const uniqueModels = [...new Set(models)].sort();
        console.log("Found models for brand", brand, ":", uniqueModels);
        
        return uniqueModels;
    };

    // Handle brand selection
    const handleBrandChange = (brand: string) => {
        setSelectedBrand(brand);
        setSelectedModel(""); // Reset model when brand changes
        setSelectedCarModel(null); // Reset selected car model
        setSelectedCarModelId(null); // Reset selected car model ID
        setNewVehicle(prev => ({ ...prev, brand }));
        setError(null);
    };

    // Handle model selection
    const handleModelChange = (model: string) => {
        setSelectedModel(model);
        setError(null);
        
        // Find and set the selected car model for image display and ID
        if (carModels && selectedBrand) {
            const carModel = carModels.find(car => 
                car.brand === selectedBrand && car.model === model
            );
            if (carModel) {
                setSelectedCarModel(carModel);
                setSelectedCarModelId(carModel.carModelId);
                setNewVehicle(prev => ({ ...prev, carModel }));
            }
        }
    };



    useEffect(() => {
        fetchVehicles();
        loadCarModels();
    }, []);

    const loadCarModels = async() => {
        try {
            setLoading(true);
            console.log("=== LOADING CAR MODELS ===");
            const models = await filterCarModesByConnector();
            console.log("Loaded car models:", models?.length || 0);
            if (models) {
                setCarModels(models);
                console.log("Car models set in state:", models.length);
            }
        } catch (err) {
            console.error("Error loading car models:", err);
            setError(language === 'vi' ? 'Lỗi khi tải dữ liệu xe' : 'Error loading car data');
        } finally {
            setLoading(false);
        }
    };

    // Pagination logic
    const totalPages = Math.ceil(vehicles.length / vehiclesPerPage);
    const startIndex = (currentPage - 1) * vehiclesPerPage;
    const endIndex = startIndex + vehiclesPerPage;
    const currentVehicles = vehicles.slice(startIndex, endIndex);

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    const handlePreviousPage = () => {
        if (currentPage > 1) {
            setCurrentPage(currentPage - 1);
        }
    };

    const handleNextPage = () => {
        if (currentPage < totalPages) {
            setCurrentPage(currentPage + 1);
        }
    };

    // ------------------------- ADD VEHICLE -------------------------
    const handleAddVehicle = async () => {
        if (!token || !userId) {
            toast.error("Not authenticated.");
            return;
        }

        const plate = (newVehicle.plateNumber ?? "").trim();
        const brand = (newVehicle.brand ?? "").trim();

        if (!plateRegex.test(plate)) return toast.error("Invalid plate number format.");
        if (!brand) return toast.error("Brand is required.");
        if (!selectedCarModelId) return toast.error("Please select a car model.");

        try {
            setLoading(true);
            const body = {
                plateNumber: plate,
                userId: parseInt(userId as string),
                carModelId: selectedCarModelId
            };
            const res = await api.post("/api/vehicles", body);

            const created = res.data?.data ?? res.data;
            
            // Fetch connector type name for the new vehicle
            let connectorTypeName = "Unknown";
            if (selectedCarModel?.connectorTypeId) {
                const connectorType = await fetchConnectorTypeById(selectedCarModel.connectorTypeId.toString());
                connectorTypeName = connectorType?.TypeName || "Unknown";
            }
            
            const newVeh: Vehicle = {
                plateNumber: created.plateNumber ?? plate,
                brand,
                ...(selectedCarModel && { carModel: selectedCarModel }),
                ...(selectedCarModel?.capacity && { capacity: selectedCarModel.capacity }),
                ...(selectedCarModel?.productYear && { productYear: selectedCarModel.productYear }),
                connectorTypeName
            };

            setVehicles((prev) => [...prev, newVeh]);
            toast.success("Xe đã được thêm thành công.");
            setNewVehicle({ plateNumber: "", brand: "" });
            setSelectedBrand("");
            setSelectedModel("");
            setSelectedCarModel(null);
            setSelectedCarModelId(null);
            setShowAddForm(false);
            // Reset to last page if needed
            const newTotalPages = Math.ceil((vehicles.length + 1) / vehiclesPerPage);
            if (currentPage < newTotalPages) {
                setCurrentPage(newTotalPages);
            }
        } catch (err: any) {
            console.error("Add vehicle error:", err);
            toast.error(err.response?.data?.message ?? "Failed to add vehicle.");
        } finally {
            setLoading(false);
        }
    };

    // ------------------------- EDIT VEHICLE -------------------------
    const handleEdit = (vehicle: Vehicle) => {
        console.log("=== EDIT VEHICLE DEBUG ===");
        console.log("Vehicle to edit:", vehicle);
        console.log("Vehicle brand:", vehicle.brand);
        console.log("Vehicle carModel:", vehicle.carModel);
        
        setEditingPlate(vehicle.plateNumber);
        setEditVehicle({ ...vehicle });
        
        // Set the selected brand and model for the edit form
        if (vehicle.brand) {
            setSelectedBrand(vehicle.brand);
        }
        if (vehicle.carModel?.model) {
            setSelectedModel(vehicle.carModel.model);
            setSelectedCarModel(vehicle.carModel);
            setSelectedCarModelId(vehicle.carModel.carModelId);
        }
        
        console.log("Edit state set - brand:", vehicle.brand, "model:", vehicle.carModel?.model);
    };

    const handleSaveEdit = async () => {
        if (!editingPlate || !token || !userId) return;

        const brand = editVehicle.brand?.trim() ?? "";
        if (!brand) return toast.error("Brand is required.");

        if (!editVehicle.carModel?.carModelId) {
            return toast.error("Please select a car model.");
        }

        console.log("=== SAVE EDIT DEBUG ===");
        console.log("Edit vehicle data:", editVehicle);
        console.log("Brand:", brand);
        console.log("Car model:", editVehicle.carModel);

        try {
            setLoading(true);
            const body = {
                plateNumber: editingPlate,
                carModelId: editVehicle.carModel?.carModelId, // Only send car model ID
                userId: parseInt(userId as string),
            };

            console.log("Sending body to API:", body);

            const res = await api.put(`/api/vehicles/${editingPlate}/user/${userId}`, body);

            console.log("API response:", res.data);

            const updated = res.data?.data ?? res.data;
            setVehicles((prev) =>
                prev.map((v) => {
                    if (v.plateNumber === editingPlate) {
                        const newCarModel = editVehicle.carModel || v.carModel;
                        const updatedVehicle: Vehicle = {
                            ...v,
                            brand: editVehicle.carModel?.brand || v.brand,
                            ...(newCarModel && { carModel: newCarModel })
                        };
                        return updatedVehicle;
                    }
                    return v;
                })
            );
            toast.success("Xe đã được cập nhật thành công.");
            setEditingPlate(null);
            setEditVehicle({});
        } catch (err: any) {
            console.error("Update vehicle error:", err);
            const errorMessage = err.response?.data?.message ?? err.response?.data ?? "Failed to update vehicle.";
            
            // Check if it's a booking-related error
            if (errorMessage.includes("currently booked") || errorMessage.includes("active order")) {
                toast.error("Không thể cập nhật xe. Xe này đang được sử dụng trong một đơn đặt chỗ đang hoạt động.", {
                    duration: 5000,
                    style: {
                        background: '#fee2e2',
                        color: '#dc2626',
                        border: '1px solid #fecaca'
                    }
                });
            } else {
                toast.error(errorMessage);
            }
        } finally {
            setLoading(false);
        }
    };

    // 🆕 Check vehicle order status before deletion
    const checkVehicleOrderStatus = async (vehicleId: string): Promise<boolean> => {
        try {
            console.log("=== CHECKING VEHICLE ORDER STATUS ===");
            console.log("Vehicle ID:", vehicleId);
            
            // Try different possible API endpoints for checking vehicle status
            const possibleEndpoints = [
                `/api/orders/vehicle/${vehicleId}/status`,
                `/api/vehicles/${vehicleId}/orders/status`,
                `/api/vehicles/${vehicleId}/active-orders`,
                `/api/orders/vehicle/${vehicleId}/active`
            ];
            
            for (const endpoint of possibleEndpoints) {
                try {
                    console.log(`Trying endpoint: ${endpoint}`);
                    const response = await api.get(endpoint);
                    console.log("Response:", response.data);
                    
                    // Check if response contains orders with active status
                    const orders = response.data?.data || response.data?.orders || response.data;
                    if (Array.isArray(orders)) {
                        const activeOrders = orders.filter((order: any) => 
                            order.status === "Booked" || 
                            order.status === "Charging" ||
                            order.status === "booked" ||
                            order.status === "charging"
                        );
                        
                        if (activeOrders.length > 0) {
                            console.log("Active orders found:", activeOrders);
                            return false; // Cannot delete - has active orders
                        }
                    }
                    
                    // If we get here, no active orders found
                    return true; // Can delete
                } catch (endpointError) {
                    console.log(`Endpoint ${endpoint} failed:`, endpointError);
                    continue; // Try next endpoint
                }
            }
            
            // If all endpoints fail, assume it's safe to delete (allow deletion)
            console.log("All endpoints failed, allowing deletion");
            return true;
        } catch (error) {
            console.error("Error checking vehicle order status:", error);
            // On error, allow deletion to proceed
            return true;
        }
    };

    // 🆕 Open delete confirmation dialog
    const handleDeleteClick = (plateNumber: string) => {
        setVehicleToDelete(plateNumber);
        setDeleteDialogOpen(true);
    };

    // 🆕 Close delete confirmation dialog
    const handleCloseDeleteDialog = () => {
        setDeleteDialogOpen(false);
        setVehicleToDelete(null);
        setIsDeleting(false);
        setIsCheckingStatus(false);
    };

    // 🆕 Confirm vehicle deletion with backend validation
    const handleConfirmDelete = async () => {
        if (!vehicleToDelete || !token || !userId) {
            toast.error("Missing required information.");
            return;
        }

        try {
            setIsCheckingStatus(true);
            toast.loading("Checking vehicle status...", { id: "checking-status" });

            // Find the vehicle to get its ID
            const vehicle = vehicles.find(v => v.plateNumber === vehicleToDelete);
            if (!vehicle) {
                toast.error("Vehicle not found.");
                return;
            }

            // Get vehicle ID (try different possible ID fields)
            const vehicleId = (vehicle as any).vehicleId || (vehicle as any).id || vehicleToDelete;
            console.log("Vehicle to delete:", vehicle);
            console.log("Vehicle ID:", vehicleId);

            // Check if vehicle has active orders
            const canDelete = await checkVehicleOrderStatus(vehicleId);
            
            if (!canDelete) {
                toast.dismiss("checking-status");
                toast.error("Không thể xóa xe. Xe này đang được sử dụng trong một đơn đặt chỗ đang hoạt động.", {
                    duration: 5000,
                    style: {
                        background: '#fee2e2',
                        color: '#dc2626',
                        border: '1px solid #fecaca'
                    }
                });
                handleCloseDeleteDialog();
                return;
            }

            // Proceed with deletion
            toast.dismiss("checking-status");
            setIsCheckingStatus(false);
            setIsDeleting(true);
            toast.loading("Deleting vehicle...", { id: "deleting" });

            await api.delete(`/api/vehicles/user/${userId}/vehicle/${encodeURIComponent(vehicleToDelete)}`);
            
            setVehicles((prev) => prev.filter((v) => v.plateNumber !== vehicleToDelete));
            
            toast.dismiss("deleting");
            toast.success("Xe đã được xóa thành công.");
            
            // Adjust current page if needed after deletion
            const newTotalPages = Math.ceil((vehicles.length - 1) / vehiclesPerPage);
            if (currentPage > newTotalPages && newTotalPages > 0) {
                setCurrentPage(newTotalPages);
            }
            
            handleCloseDeleteDialog();
        } catch (err: any) {
            console.error("Delete vehicle error:", err);
            toast.dismiss("checking-status");
            toast.dismiss("deleting");
            
            const errorMessage = err.response?.data?.message ?? err.response?.data ?? "Failed to delete vehicle.";
            
            // Check if it's a booking-related error
            if (errorMessage.includes("currently booked") || errorMessage.includes("active order")) {
                toast.error("Không thể xóa xe. Xe này đang được sử dụng trong một đơn đặt chỗ đang hoạt động.", {
                    duration: 5000,
                    style: {
                        background: '#fee2e2',
                        color: '#dc2626',
                        border: '1px solid #fecaca'
                    }
                });
            } else {
                toast.error(errorMessage);
            }
            
            handleCloseDeleteDialog();
        } finally {
            setIsDeleting(false);
            setIsCheckingStatus(false);
        }
    };

    // ------------------------- DELETE VEHICLE (LEGACY - KEPT FOR REFERENCE) -------------------------
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
            
            // Adjust current page if needed after deletion
            const newTotalPages = Math.ceil((vehicles.length - 1) / vehiclesPerPage);
            if (currentPage > newTotalPages && newTotalPages > 0) {
                setCurrentPage(newTotalPages);
            }
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
                            <Input 
                                value={newVehicle.plateNumber ?? ""} 
                                onChange={(e) => setNewVehicle((p) => ({ ...p, plateNumber: e.target.value }))} 
                            />
                        </div>
                        <div>
                            <Label>Brand</Label>
                            <Select value={selectedBrand} onValueChange={handleBrandChange} disabled={loading}>
                                <SelectTrigger>
                                    <SelectValue placeholder={loading ? "Loading..." : "Select Brand"} />
                                </SelectTrigger>
                                <SelectContent>
                                    {getUniqueBrands().map((brand) => (
                                        <SelectItem key={brand} value={brand}>
                                            {brand}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label>Model</Label>
                            <Select 
                                value={selectedModel} 
                                onValueChange={handleModelChange}
                                disabled={!selectedBrand || loading}
                            >
                                <SelectTrigger>
                                    <SelectValue 
                                        placeholder={
                                            !selectedBrand 
                                                ? "Select brand first" 
                                                : "Select Model"
                                        } 
                                    />
                                </SelectTrigger>
                                <SelectContent>
                                    {getModelsByBrand(selectedBrand).map((model) => (
                                        <SelectItem key={model} value={model}>
                                            {model}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {selectedCarModel && (
                        <div className="mt-4">
                            <Label>Selected Vehicle Preview</Label>
                            <div className="p-4 border rounded-lg mt-2">
                                <div className="w-2/3 max-w-md mx-auto mb-4">
                                    <div className="relative w-full h-64 bg-gray-100 rounded overflow-hidden">
                                        {selectedCarModel.carModelImage ? (
                                            <img 
                                                src={selectedCarModel.carModelImage} 
                                                alt={selectedCarModel.model} 
                                                className="w-full h-full object-contain" 
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                No Image
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="text-center">
                                    <div className="font-medium text-lg">{selectedCarModel.brand} {selectedCarModel.model}</div>
                                    <div className="text-sm text-gray-500">
                                        {selectedCarModel.capacity} kW • {selectedCarModel.productYear}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <Button onClick={handleAddVehicle} className="bg-primary text-white">Save Vehicle</Button>
                </Card>
            )}

            {/* VEHICLE LIST */}
            <div className="p-6 max-w-4xl mx-auto">
                <Button variant="outline" size="sm" onClick={onBack} className="mb-4">
                    <ArrowLeft className="w-4 h-4" /><span>Back to Dashboard</span>
                </Button>

                {currentVehicles.length > 0 ? (
                    currentVehicles.map((v) => (
                        <Card key={v.plateNumber} className="mb-4">
                            <CardHeader>
                                <CardTitle className="flex items-center justify-between">
                                    <div className="flex space-x-2">
                                        <Button onClick={() => handleEdit(v)} size="sm">
                                            <Edit className="w-4 h-4" />
                                        </Button>
                                        <Button variant="destructive" onClick={() => handleDeleteClick(v.plateNumber)} size="sm">
                                            <Trash className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {editingPlate === v.plateNumber ? (
                                    <>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <Label>Brand</Label>
                                                <Select value={editVehicle.brand ?? ""} onValueChange={(brand: string) => {
                                                    console.log("=== EDIT BRAND CHANGE DEBUG ===");
                                                    console.log("Selected brand:", brand);
                                                    console.log("Previous edit vehicle:", editVehicle);
                                                    
                                                    setEditVehicle(prev => {
                                                        const { carModel, ...rest } = prev;
                                                        return { 
                                                            ...rest, 
                                                            brand
                                                        };
                                                    });
                                                    
                                                    console.log("Updated edit vehicle brand to:", brand);
                                                }}>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select Brand" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {getUniqueBrands().map((brand) => (
                                                            <SelectItem key={brand} value={brand}>
                                                                {brand}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div>
                                                <Label>Model</Label>
                                                <Select 
                                                    value={editVehicle.carModel?.model ?? ""} 
                                                    onValueChange={(model: string) => {
                                                        console.log("=== EDIT MODEL CHANGE DEBUG ===");
                                                        console.log("Selected model:", model);
                                                        console.log("Edit vehicle brand:", editVehicle.brand);
                                                        console.log("Available car models:", carModels.length);
                                                        
                                                        const carModel = carModels.find(car => 
                                                            car.brand === editVehicle.brand && car.model === model
                                                        );
                                                        console.log("Found car model:", carModel);
                                                        
                                                        if (carModel) {
                                                            setEditVehicle(prev => ({ ...prev, carModel }));
                                                            console.log("Updated edit vehicle with car model");
                                                        } else {
                                                            console.log("No car model found for brand:", editVehicle.brand, "model:", model);
                                                        }
                                                    }}
                                                    disabled={!editVehicle.brand}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder={!editVehicle.brand ? "Select brand first" : "Select Model"} />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {getModelsByBrand(editVehicle.brand ?? "").map((model) => (
                                                            <SelectItem key={model} value={model}>
                                                                {model}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>

                                        {editVehicle.carModel && (
                                            <div className="mt-4">
                                                <Label>Preview</Label>
                                                <div className="p-4 border rounded-lg mt-2">
                                                    <div className="w-2/3 max-w-md mx-auto mb-4">
                                                        <div className="relative w-full h-64 bg-gray-100 rounded overflow-hidden">
                                                            {editVehicle.carModel.carModelImage ? (
                                                                <img 
                                                                    src={editVehicle.carModel.carModelImage} 
                                                                    alt={editVehicle.carModel.model} 
                                                                    className="w-full h-full object-contain" 
                                                                />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                                    No Image
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="text-center">
                                                        <div className="font-medium text-lg">{editVehicle.carModel.brand} {editVehicle.carModel.model}</div>
                                                        <div className="text-sm text-gray-500">
                                                            {editVehicle.carModel.capacity} kW • {editVehicle.carModel.productYear}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        <div className="flex space-x-2 mt-4">
                                            <Button onClick={handleSaveEdit} className="bg-green-600 text-white">
                                                <Save className="w-4 h-4" /><span>Save</span>
                                            </Button>
                                            <Button variant="outline" onClick={() => setEditingPlate(null)}>Cancel</Button>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        {/* Vehicle Image */}
                                        <div className="mb-4">
                                            <div className="w-2/3 max-w-md mx-auto">
                                                <div className="relative w-full h-64 bg-gray-100 rounded-lg overflow-hidden">
                                                    {v.carModel?.carModelImage ? (
                                                        <img 
                                                            src={v.carModel.carModelImage} 
                                                            alt={`${v.brand} ${v.carModel?.model}`} 
                                                            className="w-full h-full object-contain" 
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                            No Image
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        
                                        {/* Vehicle Details */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <Label className="text-sm font-medium text-gray-600">Plate Number</Label>
                                                <p className="text-lg font-semibold">{v.plateNumber}</p>
                                            </div>
                                            <div>
                                                <Label className="text-sm font-medium text-gray-600">Brand</Label>
                                                <p className="text-lg">{v.brand}</p>
                                            </div>
                                            <div>
                                                <Label className="text-sm font-medium text-gray-600">Model</Label>
                                                <p className="text-lg">{v.carModel?.model ?? "N/A"}</p>
                                            </div>
                                            <div>
                                                <Label className="text-sm font-medium text-gray-600">Connector Type</Label>
                                                <p className="text-lg">{v.connectorTypeName ?? "Unknown"}</p>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </CardContent>
                        </Card>
                    ))
                ) : (
                    <p>No vehicles found.</p>
                )}

                {/* Pagination Controls */}
                {vehicles.length > vehiclesPerPage && (
                    <div className="flex items-center justify-center space-x-4 mt-6">
                        <Button 
                            variant="outline" 
                            onClick={handlePreviousPage}
                            disabled={currentPage === 1}
                            className="flex items-center space-x-2"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            <span>Previous</span>
                        </Button>
                        
                        <div className="flex items-center space-x-2">
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                <Button
                                    key={page}
                                    variant={currentPage === page ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => handlePageChange(page)}
                                    className="w-10 h-10"
                                >
                                    {page}
                                </Button>
                            ))}
                        </div>
                        
                        <Button 
                            variant="outline" 
                            onClick={handleNextPage}
                            disabled={currentPage === totalPages}
                            className="flex items-center space-x-2"
                        >
                            <span>Next</span>
                            <ArrowLeft className="w-4 h-4 rotate-180" />
                        </Button>
                    </div>
                )}

                {/* Pagination Info */}
                {vehicles.length > 0 && (
                    <div className="text-center text-sm text-gray-500 mt-4">
                        Showing {startIndex + 1} to {Math.min(endIndex, vehicles.length)} of {vehicles.length} vehicles
                    </div>
                )}
            </div>

            {/* 🆕 Delete Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-semibold">
                            Delete Vehicle Confirmation
                        </DialogTitle>
                    </DialogHeader>
                    
                    <div className="py-4">
                        <p className="text-gray-700">
                            Are you sure you want to delete this vehicle?
                        </p>
                        {vehicleToDelete && (
                            <p className="text-sm text-gray-500 mt-2">
                                Vehicle: <span className="font-medium">{vehicleToDelete}</span>
                            </p>
                        )}
                    </div>
                    
                    <DialogFooter className="gap-2">
                        <Button
                            variant="outline"
                            onClick={handleCloseDeleteDialog}
                            disabled={isDeleting || isCheckingStatus}
                        >
                            No
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleConfirmDelete}
                            disabled={isDeleting || isCheckingStatus}
                            className="min-w-[100px]"
                        >
                            {isCheckingStatus ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                    Checking...
                                </>
                            ) : isDeleting ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                    Processing...
                                </>
                            ) : (
                                "Yes"
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

export interface VehicleModel {
  id: string;
  brand: string;
  model: string;
  year: number;
  image: string;
  connectorTypes: string[];
  availableColors: string[];
  batteryCapacity: string;
  range: string;
}

export const vehicleDatabase: VehicleModel[] = [
  // Tesla
  {
    id: "tesla-model-3-2023",
    brand: "Tesla",
    model: "Model 3",
    year: 2023,
    image: "https://images.unsplash.com/photo-1617788138017-80ad40651399?w=400&h=250&fit=crop&crop=center",
    connectorTypes: ["Tesla Supercharger", "CCS"],
    availableColors: ["Pearl White", "Solid Black", "Midnight Silver", "Deep Blue", "Pearl Red"],
    batteryCapacity: "75 kWh",
    range: "358 miles"
  },
  {
    id: "tesla-model-s-2023",
    brand: "Tesla",
    model: "Model S",
    year: 2023,
    image: "https://images.unsplash.com/photo-1617814076367-b759c7d7e738?w=400&h=250&fit=crop&crop=center",
    connectorTypes: ["Tesla Supercharger", "CCS"],
    availableColors: ["Pearl White", "Solid Black", "Midnight Silver", "Deep Blue", "Pearl Red"],
    batteryCapacity: "100 kWh",
    range: "405 miles"
  },
  {
    id: "tesla-model-y-2023",
    brand: "Tesla",
    model: "Model Y",
    year: 2023,
    image: "https://images.unsplash.com/photo-1617469165786-8007eda4cfd7?w=400&h=250&fit=crop&crop=center",
    connectorTypes: ["Tesla Supercharger", "CCS"],
    availableColors: ["Pearl White", "Solid Black", "Midnight Silver", "Deep Blue", "Pearl Red"],
    batteryCapacity: "75 kWh",
    range: "330 miles"
  },

  // BMW
  {
    id: "bmw-i3-2022",
    brand: "BMW",
    model: "i3",
    year: 2022,
    image: "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=400&h=250&fit=crop&crop=center",
    connectorTypes: ["CCS", "CHAdeMO"],
    availableColors: ["Alpine White", "Mineral Black", "Storm Bay", "Imperial Blue", "Capparis White"],
    batteryCapacity: "42.2 kWh",
    range: "153 miles"
  },
  {
    id: "bmw-ix-2023",
    brand: "BMW",
    model: "iX",
    year: 2023,
    image: "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=400&h=250&fit=crop&crop=center",
    connectorTypes: ["CCS"],
    availableColors: ["Alpine White", "Mineral Black", "Storm Bay", "Phytonic Blue", "Mineral Bronze"],
    batteryCapacity: "111.5 kWh",
    range: "324 miles"
  },

  // Audi
  {
    id: "audi-etron-2023",
    brand: "Audi",
    model: "e-tron",
    year: 2023,
    image: "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=400&h=250&fit=crop&crop=center",
    connectorTypes: ["CCS"],
    availableColors: ["Glacier White", "Mythos Black", "Floret Silver", "Plasma Blue", "Catalunya Red"],
    batteryCapacity: "95 kWh",
    range: "222 miles"
  },

  // Nissan
  {
    id: "nissan-leaf-2023",
    brand: "Nissan",
    model: "Leaf",
    year: 2023,
    image: "https://images.unsplash.com/photo-1617469165786-8007eda4cfd7?w=400&h=250&fit=crop&crop=center",
    connectorTypes: ["CHAdeMO", "CCS"],
    availableColors: ["Pearl White", "Super Black", "Gun Metallic", "Electric Blue", "Scarlet Ember"],
    batteryCapacity: "62 kWh",
    range: "226 miles"
  },

  // Chevrolet
  {
    id: "chevrolet-bolt-2023",
    brand: "Chevrolet",
    model: "Bolt EV",
    year: 2023,
    image: "https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?w=400&h=250&fit=crop&crop=center",
    connectorTypes: ["CCS"],
    availableColors: ["Summit White", "Mosaic Black", "Oasis Blue", "Bolt Gray", "Cherry Red"],
    batteryCapacity: "65 kWh",
    range: "259 miles"
  },

  // Ford
  {
    id: "ford-mustang-mache-2023",
    brand: "Ford",
    model: "Mustang Mach-E",
    year: 2023,
    image: "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=400&h=250&fit=crop&crop=center",
    connectorTypes: ["CCS"],
    availableColors: ["Oxford White", "Shadow Black", "Rapid Red", "Infinite Blue", "Space White"],
    batteryCapacity: "91 kWh",
    range: "314 miles"
  },

  // Hyundai
  {
    id: "hyundai-ioniq5-2023",
    brand: "Hyundai",
    model: "IONIQ 5",
    year: 2023,
    image: "https://images.unsplash.com/photo-1617469165786-8007eda4cfd7?w=400&h=250&fit=crop&crop=center",
    connectorTypes: ["CCS"],
    availableColors: ["Digital Teal", "Phantom Black", "Gravity Gold", "Lucid Blue", "Atlas White"],
    batteryCapacity: "77.4 kWh",
    range: "303 miles"
  },

  // Volkswagen
  {
    id: "volkswagen-id4-2023",
    brand: "Volkswagen",
    model: "ID.4",
    year: 2023,
    image: "https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?w=400&h=250&fit=crop&crop=center",
    connectorTypes: ["CCS"],
    availableColors: ["Glacier White", "Mythos Black", "Kings Red", "Moonstone Gray", "Dusk Blue"],
    batteryCapacity: "82 kWh",
    range: "275 miles"
  }
];

export const searchVehicles = (query: string): VehicleModel[] => {
  if (!query.trim()) return [];
  
  const searchTerm = query.toLowerCase().trim();
  
  return vehicleDatabase.filter(vehicle => 
    vehicle.brand.toLowerCase().includes(searchTerm) ||
    vehicle.model.toLowerCase().includes(searchTerm) ||
    `${vehicle.brand} ${vehicle.model}`.toLowerCase().includes(searchTerm)
  ).slice(0, 5); // Limit to 5 results for performance
};

export const getVehicleById = (id: string): VehicleModel | undefined => {
  return vehicleDatabase.find(vehicle => vehicle.id === id);
};
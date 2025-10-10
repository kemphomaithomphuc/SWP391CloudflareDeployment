import React from "react";
import { Poi } from "../services/poi";

interface PoiInfoPanelProps {
  poi: Poi | null;
  hasStation: boolean;
  stationInfo?: { numberOfPort: number; status: string };
  onAddStation?: () => void;
}

export const PoiInfoPanel: React.FC<PoiInfoPanelProps> = ({
  poi,
  hasStation,
  stationInfo,
  onAddStation,
}) => {
  if (!poi) return null;

  return (
    <div className="absolute top-4 left-4 bg-white p-4 rounded shadow w-72">
      <h2 className="text-lg font-semibold">{poi.name}</h2>
      <p className="text-sm text-gray-600">{poi.addressFull}</p>
      <p className="text-xs text-gray-500">
        {poi.latitude.toFixed(6)}, {poi.longitude.toFixed(6)}
      </p>
      <div className="mt-2 text-sm">
        {hasStation ? (
          <p className="text-green-600">
            Đã có trạm sạc (số trụ: {stationInfo?.numberOfPort ?? "?"}) –{" "}
            {stationInfo?.status}
          </p>
        ) : (
          <p className="text-gray-600">Chỗ này chưa có trạm sạc</p>
        )}
      </div>
      <button
        onClick={onAddStation}
        disabled={!onAddStation}
        className="mt-3 w-full bg-blue-500 text-white py-1 rounded hover:bg-blue-600 disabled:bg-gray-300"
      >
        Thêm trạm tại đây
      </button>
    </div>
  );
};

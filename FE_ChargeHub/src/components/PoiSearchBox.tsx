import React from "react";

interface PoiSearchBoxProps {
  value: string;
  onChange: (val: string) => void;
  suggestions: { id: string; name: string; addressFull: string }[];
  onSelect: (id: string) => void;
  loading?: boolean;
}

export const PoiSearchBox: React.FC<PoiSearchBoxProps> = ({
  value,
  onChange,
  suggestions,
  onSelect,
  loading,
}) => {
  return (
    <div className="relative w-full max-w-sm">
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Tìm địa điểm..."
        className="w-full border rounded px-3 py-2"
      />
      {loading && <div className="absolute right-2 top-2">...</div>}
      {suggestions.length > 0 && (
        <ul className="absolute left-0 right-0 mt-1 bg-white border rounded shadow">
          {suggestions.map((s) => (
            <li
              key={s.id}
              className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
              onClick={() => onSelect(s.id)}
            >
              <div className="font-medium">{s.name}</div>
              <div className="text-sm text-gray-500">{s.addressFull}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

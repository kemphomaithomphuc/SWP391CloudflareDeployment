import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ChevronDown,
  ChevronUp,
  Loader2,
  MapPin,
  Navigation,
  Sparkles,
} from "lucide-react";
import { getNearbyPlacesByStation, type NearbyPlaceInfo } from "../api/nearbyPlaces";
import { Button } from "./ui/button";

interface NearbyPlacesWidgetProps {
  stationId: number | string;
  stationName?: string;
  initialCollapsed?: boolean;
}

const DRAG_BOUNDS = 640;

const formatDistance = (place: NearbyPlaceInfo): string => {
  if (typeof place.distanceText === "string" && place.distanceText.trim().length > 0) {
    return place.distanceText;
  }

  if (typeof place.distanceKm === "number") {
    return `${place.distanceKm.toFixed(1)} km`;
  }

  if (typeof place.distanceMeters === "number") {
    if (place.distanceMeters >= 1000) {
      return `${(place.distanceMeters / 1000).toFixed(1)} km`;
    }
    return `${Math.round(place.distanceMeters)} m`;
  }

  return "—";
};

const formatTravelTime = (place: NearbyPlaceInfo): string | null => {
  if (typeof place.travelTimeMinutes === "number" && !Number.isNaN(place.travelTimeMinutes)) {
    if (place.travelTimeMinutes < 1) {
      return "< 1 phút";
    }

    if (place.travelTimeMinutes < 60) {
      return `${Math.round(place.travelTimeMinutes)} phút`;
    }

    const hours = Math.floor(place.travelTimeMinutes / 60);
    const minutes = Math.round(place.travelTimeMinutes % 60);
    return `${hours}h${minutes > 0 ? ` ${minutes}p` : ""}`.trim();
  }

  return null;
};

const rankPlaces = (places: NearbyPlaceInfo[]): NearbyPlaceInfo[] => {
  return [...places].sort((a, b) => {
    const distanceA = a.distanceMeters ?? a.distanceKm ?? Number.POSITIVE_INFINITY;
    const distanceB = b.distanceMeters ?? b.distanceKm ?? Number.POSITIVE_INFINITY;

    const ratingA = typeof a.rating === "number" ? a.rating : 0;
    const ratingB = typeof b.rating === "number" ? b.rating : 0;

    if (distanceA !== distanceB) {
      return distanceA - distanceB;
    }

    return ratingB - ratingA;
  });
};

export const NearbyPlacesWidget: React.FC<NearbyPlacesWidgetProps> = ({
  stationId,
  stationName,
  initialCollapsed = false,
}) => {
  const [places, setPlaces] = useState<NearbyPlaceInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState(initialCollapsed);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    let isMounted = true;

    const fetchPlaces = async () => {
      setLoading(true);
      setError(null);

      try {
        const data = await getNearbyPlacesByStation(stationId);
        console.log("[NearbyPlacesWidget] Nearby amenities response:", data);
        if (!isMounted) return;
        setPlaces(rankPlaces(data).slice(0, 6));
      } catch (err) {
        if (!isMounted) return;
        console.error("Failed to fetch nearby places:", err);
        setError("Không thể tải danh sách địa điểm lân cận. Vui lòng thử lại sau.");
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchPlaces();

    return () => {
      isMounted = false;
    };
  }, [stationId]);

  const accentGradient = useMemo(
    () =>
      "bg-gradient-to-br from-emerald-500 via-cyan-500 to-blue-500 dark:from-emerald-500/80 dark:via-cyan-500/70 dark:to-blue-500/80",
    []
  );

  return (
    <motion.div
      className="fixed bottom-6 right-6 z-50"
      style={{ x: position.x, y: position.y }}
      drag
      dragElastic={0.2}
      dragMomentum={false}
      dragTransition={{ bounceStiffness: 300, bounceDamping: 20 }}
      dragConstraints={{ top: -DRAG_BOUNDS, left: -DRAG_BOUNDS, right: DRAG_BOUNDS, bottom: DRAG_BOUNDS }}
      onDragEnd={(event, info) => {
        setPosition((prev) => ({
          x: prev.x + info.offset.x,
          y: prev.y + info.offset.y,
        }));
      }}
    >
      <div
        className={[
          "group shadow-2xl rounded-3xl border border-white/20 backdrop-blur-xl",
          "bg-white/90 dark:bg-slate-950/90",
          "transition-all duration-300 ease-out",
          collapsed ? "w-60" : "w-[360px]",
        ].join(" ")}
      >
        <div
          className={[
            "cursor-grab active:cursor-grabbing select-none",
            "px-6 py-4 flex items-center justify-between gap-3",
            "border-b border-white/10",
            accentGradient,
          ].join(" ")}
        >
          <div className="flex items-start gap-3 text-white">
            <div className="relative grid h-11 w-11 place-items-center rounded-2xl bg-white/10">
              <Sparkles className="h-5 w-5" />
              <div className="absolute -bottom-2 flex items-center justify-center rounded-full bg-white/80 px-2 py-0.5 text-xs font-semibold text-slate-900">
                {loading ? "…" : places.length}
              </div>
            </div>
            <div className="leading-tight">
              <p className="text-sm font-medium uppercase tracking-wider text-white/70">
                Khám phá quanh bạn
              </p>
              <p className="text-lg font-semibold">
                Gần {stationName || "trạm sạc"}
              </p>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            className="rounded-full border border-white/30 bg-white/20 text-white hover:bg-white/30"
            onClick={() => setCollapsed((prev) => !prev)}
          >
            {collapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </Button>
        </div>

        {!collapsed && (
          <div className="space-y-4 p-5">
            {loading ? (
              <div className="flex items-center justify-center gap-3 rounded-2xl bg-slate-100/80 p-4 text-slate-500 dark:bg-slate-900/60 dark:text-slate-300">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Đang tải địa điểm thú vị...</span>
              </div>
            ) : error ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50/80 p-4 text-sm text-rose-500 dark:border-rose-900/70 dark:bg-rose-950/40 dark:text-rose-200">
                {error}
              </div>
            ) : places.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 text-center text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-300">
                Chưa có địa điểm nào được gợi ý quanh trạm sạc này.
              </div>
            ) : (
              <div className="space-y-3">
                {places.map((place, index) => (
                  <div
                    key={`${place.id ?? place.name ?? index}-${index}`}
                    className="group flex gap-3 rounded-2xl bg-slate-100/70 p-4 transition hover:-translate-y-1 hover:bg-white dark:bg-slate-900/60 dark:hover:bg-slate-800/80"
                  >
                    <div
                      className={[
                        "mt-1 grid h-10 w-10 place-items-center rounded-2xl text-white",
                        accentGradient,
                      ].join(" ")}
                    >
                      <MapPin className="h-4 w-4" />
                    </div>

                    <div className="flex-1 space-y-1.5">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-base font-semibold text-slate-900 dark:text-white">
                          {place.name ?? "Địa điểm chưa rõ tên"}
                        </p>
                        <span className="rounded-full bg-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                          #{index + 1}
                        </span>
                      </div>

                      {place.address && (
                        <p className="text-sm text-slate-500 dark:text-slate-300">
                          {place.address}
                        </p>
                      )}

                      <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-300">
                        <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 shadow-sm dark:bg-slate-900/80">
                          <Navigation className="h-3 w-3" />
                          {formatDistance(place)}
                        </span>

                        {formatTravelTime(place) && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 shadow-sm dark:bg-slate-900/80">
                            ⏱ {formatTravelTime(place)}
                          </span>
                        )}

                        {place.category && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 shadow-sm dark:bg-slate-900/80">
                            ✨ {place.category}
                          </span>
                        )}

                        {typeof place.rating === "number" && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 shadow-sm dark:bg-slate-900/80">
                            ⭐ {place.rating.toFixed(1)}
                          </span>
                        )}
                      </div>

                      {Array.isArray(place.highlights) && place.highlights.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {place.highlights.slice(0, 3).map((highlight, idx) => (
                            <span
                              key={`${highlight}-${idx}`}
                              className="rounded-full bg-emerald-100/80 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                            >
                              {highlight}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default NearbyPlacesWidget;


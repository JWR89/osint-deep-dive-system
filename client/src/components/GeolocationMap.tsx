import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Home, Briefcase, Globe, AlertTriangle } from "lucide-react";
import { MapView } from "@/components/Map";
import { useRef, useCallback } from "react";

interface GeoLocation {
  location: string;
  type: string;
  source: string;
  label: string;
}

const typeConfig: Record<string, { icon: any; color: string; bgColor: string; markerColor: string }> = {
  known_address: { icon: Home, color: "text-blue-400", bgColor: "bg-blue-400/10", markerColor: "#60a5fa" },
  public_records: { icon: MapPin, color: "text-emerald-400", bgColor: "bg-emerald-400/10", markerColor: "#34d399" },
  social_media: { icon: Globe, color: "text-purple-400", bgColor: "bg-purple-400/10", markerColor: "#a78bfa" },
  professional: { icon: Briefcase, color: "text-amber-400", bgColor: "bg-amber-400/10", markerColor: "#fbbf24" },
  criminal: { icon: AlertTriangle, color: "text-red-400", bgColor: "bg-red-400/10", markerColor: "#f87171" },
  identity: { icon: MapPin, color: "text-cyan-400", bgColor: "bg-cyan-400/10", markerColor: "#22d3ee" },
  dating: { icon: MapPin, color: "text-pink-400", bgColor: "bg-pink-400/10", markerColor: "#f472b6" },
  breaches: { icon: MapPin, color: "text-orange-400", bgColor: "bg-orange-400/10", markerColor: "#fb923c" },
  dark_web: { icon: MapPin, color: "text-red-500", bgColor: "bg-red-500/10", markerColor: "#ef4444" },
};

export function GeolocationMap({ locations }: { locations: GeoLocation[] }) {
  const mapRef = useRef<google.maps.Map | null>(null);

  const handleMapReady = useCallback((map: google.maps.Map) => {
    mapRef.current = map;

    if (!locations || locations.length === 0) return;

    const geocoder = new google.maps.Geocoder();
    const bounds = new google.maps.LatLngBounds();
    let markersPlaced = 0;

    locations.forEach((loc) => {
      const config = typeConfig[loc.type] || typeConfig.identity;

      geocoder.geocode({ address: loc.location }, (results, status) => {
        if (status === "OK" && results && results[0]) {
          const position = results[0].geometry.location;
          bounds.extend(position);

          // Create a custom marker element with color
          const pinElement = document.createElement("div");
          pinElement.style.width = "24px";
          pinElement.style.height = "24px";
          pinElement.style.borderRadius = "50%";
          pinElement.style.backgroundColor = config.markerColor;
          pinElement.style.border = "3px solid white";
          pinElement.style.boxShadow = "0 2px 6px rgba(0,0,0,0.4)";

          new google.maps.marker.AdvancedMarkerElement({
            map,
            position,
            title: `${loc.label} — ${loc.location}`,
            content: pinElement,
          });

          markersPlaced++;
          if (markersPlaced === locations.length || markersPlaced > 0) {
            map.fitBounds(bounds);
            if (locations.length === 1) {
              map.setZoom(12);
            }
          }
        }
      });
    });
  }, [locations]);

  if (!locations || locations.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <MapPin className="w-10 h-10 mx-auto mb-3 opacity-50" />
        <p className="text-sm">No geolocation data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Location Summary Header */}
      <div className="flex items-center gap-4 flex-wrap">
        <Badge variant="secondary" className="bg-blue-400/10 text-blue-400">
          {locations.length} Location{locations.length !== 1 ? "s" : ""} Identified
        </Badge>
        <Badge variant="secondary" className="bg-emerald-400/10 text-emerald-400">
          {new Set(locations.map(l => l.location.split(",").pop()?.trim())).size} Region{new Set(locations.map(l => l.location.split(",").pop()?.trim())).size !== 1 ? "s" : ""}
        </Badge>
      </div>

      {/* Interactive Map */}
      <div className="rounded-xl overflow-hidden border border-border/50">
        <MapView
          className="w-full h-[400px]"
          initialCenter={{ lat: 39.8283, lng: -98.5795 }}
          initialZoom={4}
          onMapReady={handleMapReady}
        />
      </div>

      {/* Location Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {locations.map((loc, idx) => {
          const config = typeConfig[loc.type] || typeConfig.identity;
          const Icon = config.icon;

          return (
            <Card key={idx} className="border-border/50 hover:border-border transition-colors">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${config.bgColor}`}>
                    <Icon className={`w-4 h-4 ${config.color}`} />
                  </div>
                  <div className="flex-1 min-w-0 space-y-1">
                    <p className="text-sm font-semibold text-foreground">{loc.location}</p>
                    <p className="text-xs text-muted-foreground">{loc.label}</p>
                    <p className="text-[10px] text-muted-foreground/70">Source: {loc.source}</p>
                  </div>
                  {loc.type === "known_address" && (
                    <Badge variant="secondary" className="text-[10px] bg-blue-400/10 text-blue-400 shrink-0">
                      Primary
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Geographic Spread Summary */}
      <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
        <p className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Geographic Spread:</span>{" "}
          {locations.map(l => l.location).join(" • ")}
        </p>
      </div>
    </div>
  );
}

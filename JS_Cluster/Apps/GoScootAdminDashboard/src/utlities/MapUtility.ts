const SERVICE_POLYGON: GeoJSON.Feature<GeoJSON.Polygon> = {
    type: "Feature",
    properties: { name: "core-service-area" },
    geometry: {
        type: "Polygon",
        coordinates: [[
            [106.63, 10.88], // Tan Binh (north-west, airport edge)
            [106.66, 10.90], // Go Vap / Tan Binh north
            [106.70, 10.91], // Go Vap / Phu Nhuan north
            [106.74, 10.90], // Phu Nhuan / Thu Duc edge
            [106.79, 10.90], // Thu Duc / District 9 north
            [106.86, 10.83], // District 9 east
            [106.86, 10.75], // ⬇️ District 9 south-east
            [106.84, 10.72], // ⬇️ Q7 east (Phu My Hung)
            [106.80, 10.70], // ⬅️ Q7 south
            [106.77, 10.69], // ⬅️ Nha Be edge (limit)
            [106.75, 10.70], // Q7 west
            [106.73, 10.71], // Q4 south
            [106.72, 10.72], // Q4 central
            [106.71, 10.73], // Q4 north
            [106.72, 10.75], // Q1 / Q4 bridge area
            [106.69, 10.75], // Q5
            [106.66, 10.78], // Binh Thanh
            [106.64, 10.82], // Phu Nhuan south
            [106.63, 10.85], // Tan Binh inner
            [106.63, 10.88], // close
        ]]
    }
};

export function ensureServicePolygonUtil(map: mapboxgl.Map, sourceId: string, fillId: string, outlineId: string) {
    const SOURCE_ID = sourceId;
    const FILL_ID = fillId;
    const OUTLINE_ID = outlineId;

    // Source exists → just update data
    const existingSource = map.getSource(SOURCE_ID) as mapboxgl.GeoJSONSource | undefined;
    if (existingSource) {
        existingSource.setData(SERVICE_POLYGON);
        return;
    }

    map.addSource(SOURCE_ID, {
        type: "geojson",
        data: SERVICE_POLYGON,
    });

    map.addLayer({
        id: FILL_ID,
        type: "fill",
        source: SOURCE_ID,
        paint: {
            "fill-color": "#DF6C20",
            "fill-opacity": 0.18,
        },
    });

    map.addLayer({
        id: OUTLINE_ID,
        type: "line",
        source: SOURCE_ID,
        paint: {
            "line-color": "#DF6C20",
            "line-width": 2,
            "line-opacity": 0.9,
        },
    });
}

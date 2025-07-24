function parseGeoJSONToSVG(data, bounds, scale, width, height) {
    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("width", width);
    svg.setAttribute("height", height);
    svg.setAttribute("viewBox", `0 0 ${width} ${height}`);

    // 计算边界的像素坐标
    const [minLng, minLat] = bounds[0];
    const [maxLng, maxLat] = bounds[1];
    const xOffset = -minLng * scale + width / 2;
    const yOffset = -minLat * scale + height / 2;

    data.features.forEach(feature => {

        const { geometry, properties } = feature;
        if(geometry.type === "Polygon"){
            const pathData = parseCoordinatesToPathData(geometry.coordinates, scale, xOffset, yOffset);
            const path = document.createElementNS(svgNS, "path");
            path.setAttribute("d", pathData);
            path.setAttribute("fill", "none");
            path.setAttribute("stroke", "black");
            svg.appendChild(path);
        }
        else if(geometry.type === "MultiPolygon"){
            console.log(geometry.coordinates);  
            geometry.coordinates.forEach(coordinate => {
                const pathData = parseCoordinatesToPathData(coordinate, scale, xOffset, yOffset);
                const path = document.createElementNS(svgNS, "path");
                path.setAttribute("d", pathData);
                path.setAttribute("fill", "none");
                path.setAttribute("stroke", "black");
                svg.appendChild(path);
            })
        }
    });

    return svg;
}

function parseCoordinatesToPathData(coordinates, scale, xOffset, yOffset) {
    let pathData = "M"; // 移动命令
    coordinates.forEach(ring => {
        ring.forEach(coord => {
            const [lng, lat] = coord;
            const x = (lng * scale + xOffset).toFixed(2);
            const y = (lat * scale + yOffset).toFixed(2);
            pathData += `${x} ${y}`;
            pathData += " L"; // 直线命令
        });
        pathData = pathData.slice(0, -2) + " Z"; // 关闭路径命令，并移除最后一个" L"
    });
    return pathData;
}



const init = async ()=>{
    const response = await fetch('data/china.geojson');
    const geoJson = await response.json();

    const svg = document.getElementById('map');
    const bounds = [[113.6, 34.4], [116.45, 39.55]];
    const scale = 10;
    const width = 800;
    const height = 600;

    const svgMap = parseGeoJSONToSVG(geoJson, bounds, scale, width, height);
    svg.appendChild(svgMap);
    
}


init();
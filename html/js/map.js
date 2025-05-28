let map = null;

// 初始化地图
let localFontFamily = "'system-ui', sans-serif"; // 使用本地字体

// 判断是 iOS MacOS
if (/(iPhone|iPad|iPod|iOS|Mac OS X)/i.test(navigator.userAgent)) {
	localFontFamily = "'PingFang SC', sans-serif";
}
const Lazy = {}
const lazy = (name,fn,ms) => {
    if(Lazy[name]){
        clearTimeout(Lazy[name]);
    }
    Lazy[name] = setTimeout(()=>{
        fn();
        delete Lazy[name];
    });
}

const style = {
    version: 8,
    glyphs: 'http://fonts/mapbox/{fontstack}/{range}.pbf',
    sources: {
        'china-province': {
            type: 'geojson',
            data: {
                type: 'FeatureCollection',
                features: []
            }
        },
        'china-province-label': {
            type: 'geojson',
            data: {
                type: 'FeatureCollection',
                features: []
            }
        }
    },
    layers: [
        {
            id: 'china-fill',
            type: 'fill',
            source: 'china-province',
            paint: {
                'fill-color': '#E4521D',
                // 'fill-opacity': 0.6
            }
        },
        {
            id: 'china-border',
            type: 'line',
            source: 'china-province',
            layout: {
                'line-join': 'round',
                'line-cap': 'round'
            },
            paint: {
                'line-color': '#ffc2ab',
                'line-width': 1,
            }
        },
        // {
        //     id: 'china-label',
        //     type: 'symbol',
        //     source: 'china-province-label',
        //     layout: {
        //         'text-field': '{name}',
        //         'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
        //         'text-offset': [0, 0.6],
        //         'text-anchor': 'top',
        //         'text-size': 12,
        //         'text-justify': 'auto',
        //         'text-max-width': 100
        //     },
        //     paint: {
        //         'text-color': '#000',
        //         'text-halo-color': '#fff',
        //         'text-halo-width': 1
        //     }
        // }
    ]
};

const chinaBounds = [[71.7177311879606,16.581442709256834],[136.73479793729985,54.801279415121996]];
const initMap = async ()=> {
    map = new maplibregl.Map({
        container: 'map',
        localFontFamily,
        style,
        center: [104.1954, 35.8617], // 中国中心坐标
        zoom: 4,
        // 仅允许在中国范围内拖动
        // maxBounds: chinaBounds,
        maxZoom: 6,
    });
    
    const chinaGeojsonFetch = await fetch('data/china.geojson');
    const chinaGeojson = await chinaGeojsonFetch.json();
    console.log(chinaGeojson);

    map.getSource('china-province').setData(chinaGeojson);

    // 根据区域算出中心点 用于 china-province-label
    const chinaGeojsonFeatures = chinaGeojson.features;
    const chinaGeojsonFeaturesCenter = chinaGeojsonFeatures.map(feature => {
        // const coordinates = feature.geometry.coordinates;
        const { 
            geometry,
            properties
        } = feature;
    
        if(!properties) return;
        if(!properties.name) return;

        console.log(properties.name,properties.center);
        const labelFeature = {
            type: 'Feature',
            properties: {
                name: properties.name
            },
            geometry:{
                type: 'Point',
                coordinates: properties.center
            }
        }
        return labelFeature;
    }).filter(feature => feature);

    console.log(chinaGeojsonFeaturesCenter);
    const chinaGeojsonFeaturesCenterGeoJson = {
        type: 'FeatureCollection',
        features: chinaGeojsonFeaturesCenter
    }
    map.getSource('china-province-label').setData(chinaGeojsonFeaturesCenterGeoJson);


    // 添加导航控件
    // map.addControl(new maplibregl.NavigationControl());
    
    const setChinaBounds = () => {
        // 无动画
        lazy('setChinaBounds',()=>{
            map.fitBounds(chinaBounds, {
                padding: 10,
                duration: 100
            })
        },300);
    };
    // 加载群组数据并添加标记
    map.on('load', async () => {
        try {
            await loadAndAddGroups(map,chinaGeojson);
        } catch (error) {
            console.error('加载群组数据失败:', error);
        }
        // 加载完成后设置中国边界
        setChinaBounds();
    });

    window.addEventListener('resize', () => {
        setChinaBounds();
    });

}

const loadAndAddGroups = async (map, chinaGeojson) => {
    const response = await fetch('data/groups.json');
    const {groups} = await response.json();

    console.log(groups);
    const Regions = {};
    // 按照省份分组
    for(const group of groups){
        const {
            name,
            number,
            region,
            city,
        } = group;
        if(!Regions[region]){
            Regions[region] = [];
        }

        Regions[region].push(group);
    }

    for(let region in Regions){
        const groups = Regions[region];


        const feature = chinaGeojson.features.find(feature => {
            if(feature.properties.name.includes(region)){
                return true;
            }
            return false;
        });

        if(!feature) continue;

        const el = document.createElement('div');
        el.className ='marker-region-box';
        el.innerHTML = `
            <div class="marker-content">
                <h4>${region}</h4>
                <div class="group-list">
                ${
                    groups.map(group => {
                        const {
                            name,
                            number,
                            city,
                        } = group;
                        return `<div class="group-item">
                            <b>${city}</b>
                            <span>${number}</span>
                        </a>`;
                    }).join('')
                }
            </div>`;

        const marker = new maplibregl.Marker({
            element: el,
            color: '#E4521D',
            // dragg able: false,
            anchor: 'bottom',
        })
        .setLngLat(feature.properties.center)
        .addTo(map);

    }
}
initMap();
// 全局地图实例
let map = null;

// 初始化地图相关配置
let localFontFamily = "'system-ui', sans-serif"; // 默认使用系统字体

// 判断是否为 iOS 或 MacOS 设备，如果是则使用苹果系统字体
if (/(iPhone|iPad|iPod|iOS|Mac OS X)/i.test(navigator.userAgent)) {
	localFontFamily = "'PingFang SC', sans-serif";
}
// 防抖工具对象，用于存储定时器
const Lazy = {}

/**
 * 防抖函数 - 防止频繁触发操作
 * @param {string} name - 防抖标识名称
 * @param {function} fn - 要执行的函数
 * @param {number} ms - 延迟时间（毫秒）
 */
const lazy = (name,fn,ms) => {
    // 如果已有同名定时器，清除它
    if(Lazy[name]){
        clearTimeout(Lazy[name]);
    }
    // 设置新的定时器
    Lazy[name] = setTimeout(()=>{
        fn();
        delete Lazy[name];
    });
}

// MapLibre GL 地图样式配置
const style = {
    version: 8,
    glyphs: 'http://fonts/mapbox/{fontstack}/{range}.pbf', // 字体资源路径
    sources: {
        // 中国省份几何数据源
        'china-province': {
            type: 'geojson',
            data: {
                type: 'FeatureCollection',
                features: []
            }
        },
        // 中国省份标签数据源（省份名称显示用）
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
            // 中国省份填充图层
            id: 'china-fill',
            type: 'fill',
            source: 'china-province',
            paint: {
                'fill-color': '#E4521D', // 填充颜色为橙红色
                // 'fill-opacity': 0.6 // 填充透明度（已注释）
            }
        },
        {
            // 中国省份边界线图层
            id: 'china-border',
            type: 'line',
            source: 'china-province',
            layout: {
                'line-join': 'round', // 线条连接样式为圆角
                'line-cap': 'round'   // 线条端点样式为圆角
            },
            paint: {
                'line-color': '#ffc2ab', // 边界线颜色为浅橙色
                'line-width': 1,         // 边界线宽度
            }
        },
        // 省份标签图层（已注释掉）
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

// 中国地图边界坐标范围 [西南角, 东北角]
const chinaBounds = [[71.7177311879606,16.581442709256834],[136.73479793729985,54.801279415121996]];

/**
 * 初始化地图
 * 加载中国地图数据，设置样式和交互行为
 */
const initMap = async ()=> {
    // 创建 MapLibre GL 地图实例
    map = new maplibregl.Map({
        container: 'map',          // 地图容器 DOM ID
        localFontFamily,           // 本地字体设置
        style,                     // 地图样式配置
        center: [104.1954, 35.8617], // 中国中心坐标（经度，纬度）
        zoom: 4,                   // 初始缩放级别
        // maxBounds: chinaBounds, // 限制地图拖动范围（已注释）
        maxZoom: 6,                // 最大缩放级别
    });
    
    // 异步加载中国地理数据
    const chinaGeojsonFetch = await fetch('data/china.geojson');
    const chinaGeojson = await chinaGeojsonFetch.json();
    console.log(chinaGeojson);

    // 将中国地理数据设置到地图数据源
    map.getSource('china-province').setData(chinaGeojson);

    // 根据省份几何区域计算中心点，用于省份标签的数据源
    const chinaGeojsonFeatures = chinaGeojson.features;
    const chinaGeojsonFeaturesCenter = chinaGeojsonFeatures.map(feature => {
        // const coordinates = feature.geometry.coordinates; // 几何坐标（未使用）
        const { 
            geometry,    // 几何信息
            properties   // 属性信息
        } = feature;
    
        // 检查是否有有效的属性和名称
        if(!properties) return;
        if(!properties.name) return;

        console.log(properties.name,properties.center);
        
        // 创建省份标签要素点
        const labelFeature = {
            type: 'Feature',
            properties: {
                name: properties.name  // 省份名称
            },
            geometry:{
                type: 'Point',
                coordinates: properties.center  // 省份中心点坐标
            }
        }
        return labelFeature;
    }).filter(feature => feature);  // 过滤掉无效的要素

    console.log(chinaGeojsonFeaturesCenter);
    
    // 构建省份标签的 GeoJSON 数据
    const chinaGeojsonFeaturesCenterGeoJson = {
        type: 'FeatureCollection',
        features: chinaGeojsonFeaturesCenter
    }
    // 将省份标签数据设置到地图数据源
    map.getSource('china-province-label').setData(chinaGeojsonFeaturesCenterGeoJson);


    // 添加地图导航控件（已注释）
    // map.addControl(new maplibregl.NavigationControl());
    
    /**
     * 设置地图视野到中国边界范围
     * 使用防抖函数避免频繁调用
     */
    const setChinaBounds = () => {
        // 使用防抖延迟执行，避免频繁触发
        lazy('setChinaBounds',()=>{
            map.fitBounds(chinaBounds, {
                padding: 10,    // 边界内边距
                duration: 1000   // 动画持续时间（毫秒）
            })
        },300);  // 延迟300毫秒执行
    };
    
    // 地图加载完成后的事件处理
    map.on('load', async () => {
        try {
            // 加载并添加群组标记到地图
            await loadAndAddGroups(map,chinaGeojson);
        } catch (error) {
            console.error('加载群组数据失败:', error);
        }
        // 加载完成后设置地图视野到中国边界
        setChinaBounds();
    });

    // 监听窗口大小变化，重新调整地图视野
    window.addEventListener('resize', () => {
        setChinaBounds();
    });

}

const loadGroups = async ()=>{
    const res = await fetch('data/group.csv');
    const text = await res.text();
    const groups = csvParse(text,{
        名称:'name',
        群号码:'number',
        省份:'region',
        地区:'city',
       ' 联络人（可留空）':'contact',
    }).data;

    // const response = await fetch('data/groups.json');
    // const {groups} = await response.json();

    console.log(groups);

    return groups;
}

/**
 * 加载群组数据并在地图上添加标记
 * @param {maplibregl.Map} map - 地图实例
 * @param {Object} chinaGeojson - 中国地理数据
 */
const loadAndAddGroups = async (map, chinaGeojson) => {
    const groups = await loadGroups();
    // 用于按省份分组存储群组数据
    const Regions = {};
    
    // 遍历所有群组，按照省份进行分组
    for(const group of groups){
        const {
            name,    // 群组名称
            number,  // 群组编号
            region,  // 所属省份/地区
            city,    // 所属城市
        } = group;
        
        // 如果该省份还没有群组数组，则初始化
        if(!Regions[region]){
            Regions[region] = [];
        }

        // 将群组添加到对应省份的数组中
        Regions[region].push(group);
    }

    // 遍历每个省份，为其创建地图标记
    for(let region in Regions){
        const groups = Regions[region];  // 该省份的所有群组


        // 在中国地理数据中查找对应的省份要素
        const feature = chinaGeojson.features.find(feature => {
            if(feature.properties.name.includes(region)){
                return true;
            }
            return false;
        });

        // 如果找不到对应的省份数据，跳过
        if(!feature) continue;

        // 创建标记的 DOM 元素
        const el = document.createElement('div');
        el.className ='marker-region-box';  // 设置 CSS 类名
        
        // 设置标记的 HTML 内容
        el.innerHTML = `
            <div class="marker-content">
                <h4>${region}</h4>
                <div class="group-list">
                ${
                    // 遍历该省份的所有群组，生成列表项
                    groups.map(group => {
                        const {
                            name,
                            number,
                            city,
                        } = group;
                        return `<div class="group-item">
                            <b>${city}</b>
                            <span class="value" onclick="copyGroupNum(this)">${number}</span>
                        </div>`;  // 注意：这里的 </a> 标签有误，应该是 </div>
                    }).join('')
                }
            </div>`;

        // 创建 MapLibre GL 标记
        const marker = new maplibregl.Marker({
            element: el,           // 使用自定义 DOM 元素
            color: '#E4521D',      // 标记颜色（橙红色）
            // dragg able: false,  // 是否可拖拽（已注释，且拼写错误）
            anchor: 'bottom',      // 锚点位置（底部对齐）
        })
        .setLngLat(feature.properties.center)  // 设置标记位置为省份中心点
        .addTo(map);  // 添加到地图

    }
}

// 启动地图初始化
initMap();







const copyGroupNum = el=>{
    const valueEl = el.querySelector('.value') || el;
    const text = valueEl.innerText.trim();
    console.log(text);
    alert('群号已复制到剪贴板');
}
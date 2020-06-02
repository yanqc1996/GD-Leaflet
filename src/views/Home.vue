<template>
    <div class="gisMap" :class="styleChange?'':'plane'">
        <div id="map" class="mapContainer">
            <div class='map-button'>
                <el-button @click="initCircle">绘制圆</el-button>
                <el-button @click='initMarker'>绘制Marker(重叠点）</el-button>
                <el-button @click='canvasMarker'>绘制Marker(canvas）</el-button>
                <el-button @click='initPolygon'>绘制多边形</el-button>
                <el-button @click='initLine'>绘制线</el-button>
                <el-button @click='reset'>重置高亮</el-button>
                <el-button @click='remove'>清除图层</el-button>
                <el-button @click='styleChange=!styleChange'>marker高亮</el-button>
                <el-button @click='changetext2'>改变marker高亮</el-button>
                <el-button @click='center'>中心点</el-button>
            </div>
        </div>
    </div>
</template>

<script>
import * as L from 'leaflet' //地图组件中引入leaflet
import 'leaflet.chinatmsproviders' //Leaflet常用地图切换加载（用于地图底图切换）
import '@geoman-io/leaflet-geoman-free' //左上操作栏引入
import '@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css'
import * as turf from '@turf/turf' //truf.js引入（空间地理函数）
import 'leaflet-canvas-marker/dist/leaflet.canvas-markers.js'
import markerIcon from '../assets/img/location.png'

import 'leaflet.markercluster/dist/MarkerCluster.css'
import 'leaflet.markercluster/dist/MarkerCluster.Default.css'
import 'leaflet.markercluster'
var map,
    baseLayers,
    Circle,
    mapGroup,
    targetCfg,
    redIcon = new L.Icon({
        iconUrl: markerIcon,
        iconSize: [41, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34]
    }) // marker图标
export default {
    name: 'home',
    data() {
        return {
            styleChange: true,
            changetext: 1
        }
    },
    mounted() {
        this.initMap() //地图初始化
        this.dataMap()
    },
    computed: {},
    methods: {
        center() {
            // console.log(L.latLng([28,120]))
            // map.setView(L.latLng([28.120]),13)
            map.setView([28, 120], 13)
        },
        dataMap() {
            let data = [
                {
                    start: [120, 30],
                    end: [120, 40]
                },
                {
                    start: [120, 40],
                    end: [120, 50]
                },
                {
                    start: [120, 60],
                    end: [120, 70]
                },
                {
                    start: [120, 50],
                    end: [120, 60]
                },
                {
                    start: [120, 80],
                    end: [120, 90]
                },
                {
                    start: [120, 70],
                    end: [120, 80]
                }
            ]
            let dataCfg = []
            var NetworkError = function() {
                for (let i = 0; i < data.length; i++) {
                    let test = data.some(e => {
                        return JSON.stringify(e.end) === JSON.stringify(data[i].start)
                    })
                    if (!test) {
                        dataCfg.push(data[i].start)
                        data.splice(i, 1)
                        if (data.length > 0) {
                            NetworkError()
                        } else {
                            return false
                        }
                    }
                    // arr.splice(i,1);
                }
                // for (let i of data) {
                //     let test = data.some(e => {
                //         return JSON.stringify(e.end) === JSON.stringify(i.start)
                //     })
                //     if (!test) {
                //         dataCfg.push(i.start)
                //         console.log(data)
                //         data.slice(0, 1)
                //         console.log(data)
                //         console.log(dataCfg)
                //         if(data.length>0){
                //             // NetworkError()
                //         }
                //         else{
                //             return false
                //         }
                //     }
                //     // every
                //     // for(let j of data){
                //     //     if()
                //     // }
                // }
            }
            NetworkError()
        },
        delay(e) {
            // 转化为延迟多少秒
            return this.changetext === e ? 'live' : ''
        },
        changetext2() {
            this.changetext = 2
        },
        initMap() {
            let normal = L.tileLayer.chinaProvider('Google.Normal.Map', {
                maxZoom: 21,
                minZoom: 3
            }) //引入地图底图（街道图）
            let satellite = L.tileLayer.chinaProvider('Google.Satellite.Map', {
                maxZoom: 21,
                minZoom: 3
            }) //引入地图底图（三维图）
            map = L.map('map', {
                preferCanvas: true, //将图层的默认渲染改为canvas渲染，海量点的时候不会引起卡顿,false时默认渲染方式为svg
                center: [30.28, 120.15], //设置地图中心点
                zoom: 12, //默认缩放级别
                zoomSnap: 0.5, //滚动缩放时每次改变的粒度，0.5表示表示放大速度比原来慢一倍，并不会改变最小的缩放粒度
                boxZoom: true, //是否允许按住shift同时按住鼠标来支持对选中区域的方法，默认为true
                fullscreenControl: true, //全屏控件
                layers: [normal], //默认添加到地图上的图层
                dragging: true //是否可以拖拽
            })
            baseLayers = {
                街道图: normal,
                卫星图: satellite
            } //初始化图层组
            map.pm.addControls({
                position: 'topleft',
                drawCircle: true
            }) //地图左上角操作增加
            L.control.layers(baseLayers).addTo(map) //基础图层组增加
            L.control.scale().addTo(map) //比例尺增加
            mapGroup = new L.layerGroup().addTo(map)
            // console.log(map.getPixelBounds())
            // console.log(map.distance([120,30],[121,31]))
            // console.log(map.latLngToContainerPoint([30.28,120.15]))
            // var imageUrl = 'http://www.lib.utexas.edu/maps/historical/newark_nj_1922.jpg',
            //     imageBounds = [
            //         [30.712216, 120.22655],
            //         [30.773941, 120.12544]
            //     ]
            // L.imageOverlay(imageUrl, imageBounds).addTo(map)
        }, //地图初始化方法

        //地图绘制方法，根据不同类型可以考虑分为marker类型，多边形类型等
        initCircle() {
            let buffered = turf.circle([120.15, 30.28], 1, {
                steps: 64,
                units: 'kilometers',
                properties: { foo: 'bar', boderColor: 'red', filledColor: 'green' }
            })
            console.log(buffered)
            let Circle = L.geoJson(buffered, {
                style: function(feature) {
                    return {
                        weight: 1.5,
                        opacity: 1,
                        color: feature.properties.boderColor,
                        dashArray: '2',
                        fillOpacity: 1,
                        fillColor: feature.properties.filledColor
                    }
                }
            })
            Circle.addTo(mapGroup)
            // map.addLayer(Circle)
        }, //绘制圆
        initMarker() {
            var heatMarkerLayer = L.markerClusterGroup({
                spiderfyOnMaxZoom: true,
                showCoverageOnHover: true,
                zoomToBoundsOnClick: true,
                removeOutsideVisibleBounds: true,
                singleMarkerMode: false,
                animateAddingMarkers: false,
                // singleMarkerMode:true,
                // disableClusteringAtZoom:true,
                maxClusterRadius: 10, //这个属性设置距离为0.即重复点才会进行聚类
                spiderLegPolylineOptions: {
                    weight: 1.5,
                    color: '#222',
                    opacity: 0
                }
            })
            heatMarkerLayer.addTo(map)
            for (let i = 0; i < 3000; i++) {
                // let data = L.marker([30.28, 120.15], { icon: redIcon })
                //     .addTo(map)
                //     .on('click', function(e) {
                //         console.log(e, i)
                //     })

                // heatMarkerLayer.addLayer(data)
                // let data2 = L.marker([30.38 + i / 10000000, 120.15 + i / 10000000], {
                //     icon: redIcon
                // })
                //     .addTo(map)
                //     .on('click', function(e) {
                //         console.log(e)
                //     })

                // heatMarkerLayer.addLayer(data2)
                L.marker([30.28 + i / 1000, 120.15 + i / 1000], { icon: redIcon }).addTo(map)
                L.marker([30.38 + i / 1000, 120.15 + i / 1000], { icon: redIcon }).addTo(map)
            }
            // baseLayers.addOverlay(heatMarkerLayer, '整改点检测点位图')
            // console.log(data.getLatLng())
            // console.log(data.toGeoJSON())
            // L.marker([30.38, 120.15], { icon: redIcon }).addTo(map)
        }, //绘制marker标记
        canvasMarker() {
            var ciLayer = L.canvasIconLayer({}).addTo(map)
            for (let i = 0; i < 100000; i++) {
                // marker渲染成canvas
                let marker1 = L.marker([30.28 + i / 1000, 120.15 + i / 1000], {
                    icon: redIcon
                }).bindTooltip('123')
                ciLayer.addMarker(marker1)
                let marker2 = L.marker([30.38 + i / 1000, 120.15 + i / 1000], {
                    icon: redIcon
                }).bindTooltip('123')
                ciLayer.addMarker(marker2)
            }
            ciLayer.addOnClickListener(function(e) {
                console.log(e)
            })
        },
        initPolygon() {
            let polygon = turf.polygon(
                [
                    [
                        [120.15, 30.28],
                        [120.25, 30.28],
                        [120.25, 30.38],
                        [120.35, 30.38],
                        [120.05, 30.48],
                        [120.15, 30.28]
                    ]
                ],
                { name: 'poly1', boderColor: 'yellow', filledColor: 'green' }
            )
            Circle = L.geoJson(polygon, {
                style: function(feature) {
                    return {
                        weight: 1.5,
                        opacity: 1,
                        color: feature.properties.boderColor,
                        dashArray: '2',
                        fillOpacity: 1,
                        fillColor: '#2c3e5094'
                    }
                },
                pmIgnore: true,
                onEachFeature: (feature, layer) => {
                    layer.on('click', function(e) {
                        targetCfg = e.target
                        let layer = e.target
                        layer.setStyle({
                            weight: 6,
                            color: '#ff171a'
                        })
                        //如果不是 ie/opera/edge 浏览器，就将修改过的，带粗灰色边框的图层，提到最前面来
                        if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
                            layer.bringToFront()
                        }
                    })
                }
            })
            Circle.addTo(mapGroup)
        }, //绘制多边形
        initLine() {
            let latlngs = [
                [30.28, 120.15],
                [30.28, 120.25]
            ]
            let line = L.polyline(latlngs, { color: 'red' })
            line.addTo(mapGroup)
        }, //绘制线
        remove() {
            mapGroup.clearLayers()
        }, //图层清除
        reset() {
            if (targetCfg) {
                Circle.resetStyle(targetCfg)
            }
        } //高亮重置
    }
}
</script>
<style lang='less'>
.mapContainer {
    height: 100vh;
    width: 100%;
}
.gisMap {
    position: relative;
    .map-button {
        position: absolute;
        z-index: 999;
        left: 70px;
        top: 20px;
    }
}
.live {
}

/*s模式下动画状态*/
@keyframes s-living {
    0% {
        transform: scale(1);
    }

    25% {
        transform: scale(1.5);
        border-color: rgba(255, 255, 255, 0.9);
    }

    50% {
        transform: scale(2);
        border-color: rgba(255, 255, 255, 0.75);
    }

    75% {
        transform: scale(2.5);
        border-color: rgba(255, 255, 255, 0.5);
    }

    100% {
        transform: scale(3);
        border-color: rgba(255, 255, 255, 0.1);
    }
}
/*p模式下动画状态*/
@keyframes p-living {
    0% {
        transform: scale(1);
    }

    25% {
        transform: scale(1.5);
        border-color: rgba(41, 129, 202, 0.9);
    }

    50% {
        transform: scale(2);
        border-color: rgba(41, 129, 202, 0.75);
    }

    75% {
        transform: scale(2.5);
        border-color: rgba(41, 129, 202, 0.5);
    }

    100% {
        transform: scale(3);
        border-color: rgba(41, 129, 202, 0.1);
    }
}

.satellite .live span {
    position: absolute;
    width: 18px;
    height: 18px;
    left: 9px;
    bottom: 0;
    border: 1px solid #fff;
    border-radius: 50%;
    -webkit-animation: s-living 3s linear infinite;
    z-index: 50;
}
.plane .live span {
    position: absolute;
    width: 18px;
    height: 18px;
    left: 9px;
    bottom: 0;
    border: 1px solid #2981ca;
    border-radius: 50%;
    -webkit-animation: p-living 3s linear infinite;
    z-index: 50;
}

.live span:nth-child(2) {
    -webkit-animation-delay: 1.5s;
}
// .marker-cluster-small{
//     opacity: 0 !important
// }
</style>




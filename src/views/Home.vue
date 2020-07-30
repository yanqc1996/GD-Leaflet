<template>
    <div class="gisMap" :class="styleChange?'':'plane'">
        <div id="map" class="mapContainer">
            <div class='map-button'>
                <el-button @click="initCircle">绘制圆</el-button>
                <el-button @click="marker">绘制marker</el-button>
                <el-button @click='initMarker'>绘制Marker(重叠点）</el-button>
                <el-button @click='canvasMarker'>绘制Marker(canvas）</el-button>
                <el-button @click='removecanvasMarker'>清除Marker(canvas）</el-button>
                <el-button @click='initPolygon'>绘制多边形</el-button>
                <el-button @click='initLine'>绘制线</el-button>
                <el-button @click='reset'>重置高亮</el-button>
                <el-button @click='remove'>清除图层</el-button>
                <el-button @click='styleChange=!styleChange'>marker高亮</el-button>
                <el-button @click='changetext2'>改变marker高亮</el-button>
                <el-button @click='center'>中心点</el-button>
                <el-button @click='heat'>热力图</el-button>
            </div>
        </div>
    </div>
</template>

<script>
import * as L from 'leaflet' //地图组件中引入leaflet
import '@geoman-io/leaflet-geoman-free'
import '@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css'
import 'leaflet.chinatmsproviders' //Leaflet常用地图切换加载（用于地图底图切换）
import '@geoman-io/leaflet-geoman-free' //左上操作栏引入
import '@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css'
import * as turf from 'turf' //turf.js引入（空间地理函数）
// import 'leaflet-canvas-marker/dist/leaflet.canvas-markers.js'
import markerIcon from '../assets/img/location.png'
import rbush from 'rbush'
import 'leaflet.markercluster/dist/MarkerCluster.css'
import 'leaflet.markercluster/dist/MarkerCluster.Default.css'
import 'leaflet.markercluster'

// import 'heatmap.js'
// import HeatmapOverlay from '@/assets/leaflet-heat.js'
var map,
    baseLayers,
    ciLayer,
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
        // this.layerFactory(L)
        this.initMap() //地图初始化
        // this.dataMap()
        // this.heatlayer()
    },
    computed: {},
    methods: {
        heatlayer() {
            L.HeatLayer = (L.Layer ? L.Layer : L.Class).extend({
                // options: {
                //     minOpacity: 0.05,
                //     maxZoom: 18,
                //     radius: 25,
                //     blur: 15,
                //     max: 1.0
                // },

                initialize: function(latlngs, options) {
                    this._latlngs = latlngs
                    L.setOptions(this, options)
                },

                setLatLngs: function(latlngs) {
                    this._latlngs = latlngs
                    return this.redraw()
                },

                addLatLng: function(latlng) {
                    this._latlngs.push(latlng)
                    return this.redraw()
                },

                setOptions: function(options) {
                    L.setOptions(this, options)
                    if (this._heat) {
                        this._updateOptions()
                    }
                    return this.redraw()
                },

                redraw: function() {
                    if (this._heat && !this._frame && this._map && !this._map._animating) {
                        this._frame = L.Util.requestAnimFrame(this._redraw, this)
                    }
                    return this
                },

                onAdd: function(map) {
                    this._map = map

                    if (!this._canvas) {
                        this._initCanvas()
                    }

                    if (this.options.pane) {
                        this.getPane().appendChild(this._canvas)
                    } else {
                        map._panes.overlayPane.appendChild(this._canvas)
                    }

                    map.on('moveend', this._reset, this)

                    if (map.options.zoomAnimation && L.Browser.any3d) {
                        map.on('zoomanim', this._animateZoom, this)
                    }

                    this._reset()
                },

                onRemove: function(map) {
                    if (this.options.pane) {
                        this.getPane().removeChild(this._canvas)
                    } else {
                        map.getPanes().overlayPane.removeChild(this._canvas)
                    }

                    map.off('moveend', this._reset, this)

                    if (map.options.zoomAnimation) {
                        map.off('zoomanim', this._animateZoom, this)
                    }
                },

                addTo: function(map) {
                    map.addLayer(this)
                    return this
                },

                _initCanvas: function() {
                    var canvas = (this._canvas = L.DomUtil.create(
                        'canvas',
                        'leaflet-heatmap-layer leaflet-layer'
                    ))

                    var originProp = L.DomUtil.testProp([
                        'transformOrigin',
                        'WebkitTransformOrigin',
                        'msTransformOrigin'
                    ])
                    canvas.style[originProp] = '50% 50%'

                    var size = this._map.getSize()
                    canvas.width = size.x
                    canvas.height = size.y

                    var animated = this._map.options.zoomAnimation && L.Browser.any3d
                    L.DomUtil.addClass(canvas, 'leaflet-zoom-' + (animated ? 'animated' : 'hide'))

                    // this._heat = simpleheat(canvas)
                    this._updateOptions()
                },

                _updateOptions: function() {
                    this._heat.radius(
                        this.options.radius || this._heat.defaultRadius,
                        this.options.blur
                    )

                    if (this.options.gradient) {
                        this._heat.gradient(this.options.gradient)
                    }
                    if (this.options.max) {
                        this._heat.max(this.options.max)
                    }
                },

                _reset: function() {
                    var topLeft = this._map.containerPointToLayerPoint([0, 0])
                    L.DomUtil.setPosition(this._canvas, topLeft)

                    var size = this._map.getSize()

                    if (this._heat._width !== size.x) {
                        this._canvas.width = this._heat._width = size.x
                    }
                    if (this._heat._height !== size.y) {
                        this._canvas.height = this._heat._height = size.y
                    }

                    this._redraw()
                },

                _redraw: function() {
                    if (!this._map) {
                        return
                    }
                    var data = [],
                        r = this._heat._r,
                        size = this._map.getSize(),
                        bounds = new L.Bounds(L.point([-r, -r]), size.add([r, r])),
                        max = this.options.max === undefined ? 1 : this.options.max,
                        maxZoom =
                            this.options.maxZoom === undefined
                                ? this._map.getMaxZoom()
                                : this.options.maxZoom,
                        v =
                            1 /
                            Math.pow(2, Math.max(0, Math.min(maxZoom - this._map.getZoom(), 12))),
                        cellSize = r / 2,
                        grid = [],
                        panePos = this._map._getMapPanePos(),
                        offsetX = panePos.x % cellSize,
                        offsetY = panePos.y % cellSize,
                        i,
                        len,
                        p,
                        cell,
                        x,
                        y,
                        j,
                        len2,
                        k

                    // console.time('process');
                    for (i = 0, len = this._latlngs.length; i < len; i++) {
                        p = this._map.latLngToContainerPoint(this._latlngs[i])
                        if (bounds.contains(p)) {
                            x = Math.floor((p.x - offsetX) / cellSize) + 2
                            y = Math.floor((p.y - offsetY) / cellSize) + 2

                            var alt =
                                this._latlngs[i].alt !== undefined
                                    ? this._latlngs[i].alt
                                    : this._latlngs[i][2] !== undefined
                                    ? +this._latlngs[i][2]
                                    : 1
                            k = alt * v

                            grid[y] = grid[y] || []
                            cell = grid[y][x]

                            if (!cell) {
                                grid[y][x] = [p.x, p.y, k]
                            } else {
                                cell[0] = (cell[0] * cell[2] + p.x * k) / (cell[2] + k) // x
                                cell[1] = (cell[1] * cell[2] + p.y * k) / (cell[2] + k) // y
                                cell[2] += k // cumulated intensity value
                            }
                        }
                    }

                    for (i = 0, len = grid.length; i < len; i++) {
                        if (grid[i]) {
                            for (j = 0, len2 = grid[i].length; j < len2; j++) {
                                cell = grid[i][j]
                                if (cell) {
                                    data.push([
                                        Math.round(cell[0]),
                                        Math.round(cell[1]),
                                        Math.min(cell[2], max)
                                    ])
                                }
                            }
                        }
                    }
                    // console.timeEnd('process');

                    // console.time('draw ' + data.length);
                    this._heat.data(data).draw(this.options.minOpacity)
                    // console.timeEnd('draw ' + data.length);

                    this._frame = null
                },

                _animateZoom: function(e) {
                    var scale = this._map.getZoomScale(e.zoom),
                        offset = this._map
                            ._getCenterOffset(e.center)
                            ._multiplyBy(-scale)
                            .subtract(this._map._getMapPanePos())

                    if (L.DomUtil.setTransform) {
                        L.DomUtil.setTransform(this._canvas, offset, scale)
                    } else {
                        this._canvas.style[L.DomUtil.TRANSFORM] =
                            L.DomUtil.getTranslateString(offset) + ' scale(' + scale + ')'
                    }
                }
            })

            L.heatLayer = function(latlngs, options) {
                return new L.HeatLayer(latlngs, options)
            }
        },
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
            // map.pm.addControls({
            //     position: 'topleft',
            //     drawCircle: true
            // }) //地图左上角操作增加
            map.pm.addControls({
                position: 'topleft',
                drawCircle: true,
                drawCircleMarker: true,
                drawPolyline: false,
                drawMarker: false
            })
            L.control.layers(baseLayers).addTo(map) //基础图层组增加
            L.control.scale().addTo(map) //比例尺增加
            mapGroup = new L.layerGroup().addTo(map)
            console.log(map)
            // this.hahha()
        }, //地图初始化方法
        // hahha() {
        //     ciLayer = L.canvasIconLayer({}).addTo(map)
        // },
        //地图绘制方法，根据不同类型可以考虑分为marker类型，多边形类型等
        initCircle() {
            console.log(turf.sector)
            let buffered = turf.sector([120.15, 30.28], 30, 10, 20, {
                units: 'kilometers',
                steps: 12,
                properties: { foo: 'bar', boderColor: 'red', filledColor: 'green' }
            })
            // let buffered = turf.circle([120.15, 30.28], 1, {
            //     steps: 64,
            //     units: 'kilometers',
            //     properties: { foo: 'bar', boderColor: 'red', filledColor: 'green' }
            // })
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
        }, //绘制圆marker
        marker() {
            L.marker(map.getCenter(), { icon: redIcon }).addTo(map)
        },
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
            ciLayer = L.canvasIconLayer({}).addTo(map)
            console.log(ciLayer)
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
        layerFactory(L) {
            var CanvasIconLayer = (L.Layer ? L.Layer : L.Class).extend({
                //Add event listeners to initialized section.
                initialize: function(options) {
                    L.setOptions(this, options)
                    this._onClickListeners = []
                    this._onHoverListeners = []
                },

                setOptions: function(options) {
                    L.setOptions(this, options)
                    return this.redraw()
                },

                redraw: function() {
                    this._redraw(true)
                },

                //Multiple layers at a time for rBush performance
                addMarkers: function(markers) {
                    var self = this
                    var tmpMark = []
                    var tmpLatLng = []

                    markers.forEach(function(marker) {
                        if (!(marker.options.pane == 'markerPane' && marker.options.icon)) {
                            console.error("Layer isn't a marker")
                            return
                        }

                        var latlng = marker.getLatLng()
                        var isDisplaying = self._map.getBounds().contains(latlng)
                        var s = self._addMarker(marker, latlng, isDisplaying)

                        //Only add to Point Lookup if we are on map
                        if (isDisplaying === true) tmpMark.push(s[0])

                        tmpLatLng.push(s[1])
                    })

                    self._markers.load(tmpMark)
                    self._latlngMarkers.load(tmpLatLng)
                },

                //Adds single layer at a time. Less efficient for rBush
                addMarker: function(marker) {
                    var self = this
                    var latlng = marker.getLatLng()
                    var isDisplaying = self._map.getBounds().contains(latlng)
                    var dat = self._addMarker(marker, latlng, isDisplaying)

                    //Only add to Point Lookup if we are on map
                    if (isDisplaying === true) self._markers.insert(dat[0])

                    self._latlngMarkers.insert(dat[1])
                },

                addLayer: function(layer) {
                    if (layer.options.pane == 'markerPane' && layer.options.icon)
                        this.addMarker(layer)
                    else console.error("Layer isn't a marker")
                },

                addLayers: function(layers) {
                    this.addMarkers(layers)
                },

                removeLayer: function(layer) {
                    this.removeMarker(layer, true)
                },

                removeMarker: function(marker, redraw) {
                    var self = this

                    //If we are removed point
                    if (marker['minX']) marker = marker.data

                    var latlng = marker.getLatLng()
                    var isDisplaying = self._map.getBounds().contains(latlng)

                    var markerData = {
                        minX: latlng.lng,
                        minY: latlng.lat,
                        maxX: latlng.lng,
                        maxY: latlng.lat,
                        data: marker
                    }

                    self._latlngMarkers.remove(markerData, function(a, b) {
                        return a.data._leaflet_id === b.data._leaflet_id
                    })

                    self._latlngMarkers.total--
                    self._latlngMarkers.dirty++

                    if (isDisplaying === true && redraw === true) {
                        self._redraw(true)
                    }
                },

                onAdd: function(map) {
                    this._map = map

                    if (!this._canvas) this._initCanvas()

                    if (this.options.pane) this.getPane().appendChild(this._canvas)
                    else map._panes.overlayPane.appendChild(this._canvas)

                    map.on('moveend', this._reset, this)
                    map.on('resize', this._reset, this)

                    map.on('click', this._executeListeners, this)
                    map.on('mousemove', this._executeListeners, this)
                },

                onRemove: function(map) {
                    if (this.options.pane) this.getPane().removeChild(this._canvas)
                    else map.getPanes().overlayPane.removeChild(this._canvas)

                    map.off('click', this._executeListeners, this)
                    map.off('mousemove', this._executeListeners, this)

                    map.off('moveend', this._reset, this)
                    map.off('resize', this._reset, this)
                },

                addTo: function(map) {
                    map.addLayer(this)
                    return this
                },

                clearLayers: function() {
                    this._latlngMarkers = null
                    this._markers = null
                    this._redraw(true)
                },

                _addMarker: function(marker, latlng, isDisplaying) {
                    var self = this
                    //Needed for pop-up & tooltip to work.
                    marker._map = self._map

                    //_markers contains Points of markers currently displaying on map
                    if (!self._markers) self._markers = new rbush()

                    //_latlngMarkers contains Lat\Long coordinates of all markers in layer.
                    if (!self._latlngMarkers) {
                        self._latlngMarkers = new rbush()
                        self._latlngMarkers.dirty = 0
                        self._latlngMarkers.total = 0
                    }

                    L.Util.stamp(marker)

                    var pointPos = self._map.latLngToContainerPoint(latlng)
                    var iconSize = marker.options.icon.options.iconSize

                    var adj_x = iconSize[0] / 2
                    var adj_y = iconSize[1] / 2
                    var ret = [
                        {
                            minX: pointPos.x - adj_x,
                            minY: pointPos.y - adj_y,
                            maxX: pointPos.x + adj_x,
                            maxY: pointPos.y + adj_y,
                            data: marker
                        },
                        {
                            minX: latlng.lng,
                            minY: latlng.lat,
                            maxX: latlng.lng,
                            maxY: latlng.lat,
                            data: marker
                        }
                    ]

                    self._latlngMarkers.dirty++
                    self._latlngMarkers.total++

                    //Only draw if we are on map
                    if (isDisplaying === true) self._drawMarker(marker, pointPos)

                    return ret
                },

                _drawMarker: function(marker, pointPos) {
                    var self = this

                    if (!this._imageLookup) this._imageLookup = {}
                    if (!pointPos) {
                        pointPos = self._map.latLngToContainerPoint(marker.getLatLng())
                    }

                    var iconUrl = marker.options.icon.options.iconUrl

                    if (marker.canvas_img) {
                        self._drawImage(marker, pointPos)
                    } else {
                        if (self._imageLookup[iconUrl]) {
                            marker.canvas_img = self._imageLookup[iconUrl][0]

                            if (self._imageLookup[iconUrl][1] === false) {
                                self._imageLookup[iconUrl][2].push([marker, pointPos])
                            } else {
                                self._drawImage(marker, pointPos)
                            }
                        } else {
                            var i = new Image()
                            i.src = iconUrl
                            marker.canvas_img = i

                            //Image,isLoaded,marker\pointPos ref
                            self._imageLookup[iconUrl] = [i, false, [[marker, pointPos]]]

                            i.onload = function() {
                                self._imageLookup[iconUrl][1] = true
                                self._imageLookup[iconUrl][2].forEach(function(e) {
                                    self._drawImage(e[0], e[1])
                                })
                            }
                        }
                    }
                },

                _drawImage: function(marker, pointPos) {
                    var options = marker.options.icon.options

                    this._context.drawImage(
                        marker.canvas_img,
                        pointPos.x - options.iconAnchor[0],
                        pointPos.y - options.iconAnchor[1],
                        options.iconSize[0],
                        options.iconSize[1]
                    )
                },

                _reset: function() {
                    var topLeft = this._map.containerPointToLayerPoint([0, 0])
                    L.DomUtil.setPosition(this._canvas, topLeft)

                    var size = this._map.getSize()

                    this._canvas.width = size.x
                    this._canvas.height = size.y

                    this._redraw()
                },

                _redraw: function(clear) {
                    var self = this

                    if (clear)
                        this._context.clearRect(0, 0, this._canvas.width, this._canvas.height)
                    if (!this._map || !this._latlngMarkers) return

                    var tmp = []

                    //If we are 10% individual inserts\removals, reconstruct lookup for efficiency
                    if (self._latlngMarkers.dirty / self._latlngMarkers.total >= 0.1) {
                        self._latlngMarkers.all().forEach(function(e) {
                            tmp.push(e)
                        })

                        self._latlngMarkers.clear()
                        self._latlngMarkers.load(tmp)
                        self._latlngMarkers.dirty = 0
                        tmp = []
                    }

                    var mapBounds = self._map.getBounds()

                    //Only re-draw what we are showing on the map.

                    var mapBoxCoords = {
                        minX: mapBounds.getWest(),
                        minY: mapBounds.getSouth(),
                        maxX: mapBounds.getEast(),
                        maxY: mapBounds.getNorth()
                    }

                    self._latlngMarkers.search(mapBoxCoords).forEach(function(e) {
                        //Readjust Point Map
                        var pointPos = self._map.latLngToContainerPoint(e.data.getLatLng())

                        var iconSize = e.data.options.icon.options.iconSize
                        var adj_x = iconSize[0] / 2
                        var adj_y = iconSize[1] / 2

                        var newCoords = {
                            minX: pointPos.x - adj_x,
                            minY: pointPos.y - adj_y,
                            maxX: pointPos.x + adj_x,
                            maxY: pointPos.y + adj_y,
                            data: e.data
                        }

                        tmp.push(newCoords)

                        //Redraw points
                        self._drawMarker(e.data, pointPos)
                    })

                    //Clear rBush & Bulk Load for performance
                    this._markers.clear()
                    this._markers.load(tmp)
                },

                _initCanvas: function() {
                    this._canvas = L.DomUtil.create(
                        'canvas',
                        'leaflet-canvas-icon-layer leaflet-layer'
                    )
                    var originProp = L.DomUtil.testProp([
                        'transformOrigin',
                        'WebkitTransformOrigin',
                        'msTransformOrigin'
                    ])
                    this._canvas.style[originProp] = '50% 50%'

                    var size = this._map.getSize()
                    this._canvas.width = size.x
                    this._canvas.height = size.y

                    this._context = this._canvas.getContext('2d')

                    var animated = this._map.options.zoomAnimation && L.Browser.any3d
                    L.DomUtil.addClass(
                        this._canvas,
                        'leaflet-zoom-' + (animated ? 'animated' : 'hide')
                    )
                },

                addOnClickListener: function(listener) {
                    this._onClickListeners.push(listener)
                },

                addOnHoverListener: function(listener) {
                    this._onHoverListeners.push(listener)
                },

                _executeListeners: function(event) {
                    if (!this._markers) return

                    var me = this
                    var x = event.containerPoint.x
                    var y = event.containerPoint.y

                    if (me._openToolTip) {
                        me._openToolTip.closeTooltip()
                        delete me._openToolTip
                    }

                    var ret = this._markers.search({ minX: x, minY: y, maxX: x, maxY: y })

                    if (ret && ret.length > 0) {
                        me._map._container.style.cursor = 'pointer'

                        if (event.type === 'click') {
                            var hasPopup = ret[0].data.getPopup()
                            if (hasPopup) ret[0].data.openPopup()

                            me._onClickListeners.forEach(function(listener) {
                                listener(event, ret)
                            })
                        }

                        if (event.type === 'mousemove') {
                            var hasTooltip = ret[0].data.getTooltip()
                            if (hasTooltip) {
                                me._openToolTip = ret[0].data
                                ret[0].data.openTooltip()
                            }

                            me._onHoverListeners.forEach(function(listener) {
                                listener(event, ret)
                            })
                        }
                    } else {
                        me._map._container.style.cursor = ''
                    }
                }
            })

            L.canvasIconLayer = function(options) {
                return new CanvasIconLayer(options)
            }
        },
        removecanvasMarker() {
            console.log(ciLayer)
            // map.removeLayer(ciLayer)
            // this.canvasMarker()
            ciLayer.clearLayers()
            //   ciLayer = L.canvasIconLayer({}).addTo(map)
        },
        initPolygon() {
            for (let i = 0; i < 100; i++) {
                let polygon = turf.polygon(
                    [
                        [
                            [120.15 + i / 10000, 30.28 + i / 10000],
                            [120.25 + i / 10000, 30.28 + i / 10000],
                            [120.25 + i / 10000, 30.38 + i / 10000],
                            [120.35 + i / 10000, 30.38 + i / 10000],
                            [120.05 + i / 10000, 30.48 + i / 10000],
                            [120.15 + i / 10000, 30.28 + i / 10000]
                        ]
                    ],
                    { name: 'poly1', boderColor: 'yellow', filledColor: 'green' }
                )
                let linestring1 = turf.lineString(
                    [
                        [120.15 + i / 10000, 30.28 + i / 10000],
                        [120.25 + i / 10000, 30.28 + i / 10000]
                    ],
                    { name: 'line 1' }
                )
                var collection = turf.featureCollection([linestring1, polygon])
                Circle = L.geoJson(collection, {
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
            }
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
        }, //高亮重置
        heat() {
            let option = {
                //热力图的配置项
                radius: 0.5, //设置每一个热力点的半径
                maxOpacity: 0.9, //设置最大的不透明度 //minOpacity:0.3,//设置最小的不透明度
                scaleRadius: true, //设置热力点是否平滑过渡
                blur: 0.95, //系数越高，渐变越平滑，默认是0.85, //滤镜系数将应用于所有热点数据。
                useLocalExtrema: true, //使用局部极值
                latField: 'lat', //维度
                lngField: 'lng', //经度
                valueField: 'count', //热力点的值
                gradient: {
                    '0.99': 'rgba(255,0,0,1)',
                    '0.9': 'rgba(255,255,0,1)',
                    '0.8': 'rgba(0,255,0,1)',
                    '0.5': 'rgba(0,255,255,1)',
                    '0': 'rgba(0,0,255,1)'
                }
            }
            this.heatmapLayer = L.heatLayer(option)
            this.heatmapLayer.addTo(map)
            let data = {
                max: 15,
                data: [{ lng: 124.044449, lat: 31.662711, count: 3 }]
            }
            this.heatmapLayer.setData(data)
        }
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




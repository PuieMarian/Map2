
import 'ol/ol.css';
import DragAndDrop from 'ol/interaction/DragAndDrop';
import Draw from 'ol/interaction/Draw';
import GeoJSON from 'ol/format/GeoJSON';
import Map from 'ol/Map';
import Modify from 'ol/interaction/Modify';
import Snap from 'ol/interaction/Snap';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import View from 'ol/View';
import sync from 'ol-hashed';
import { Fill, Stroke, Style } from 'ol/style';
import { getArea } from 'ol/sphere';
import colormap from 'colormap';


//Color
const min = 1e8; // the smallest area
const max = 2e13; // the biggest area
const steps = 50;
const ramp = colormap({
    colormap: 'blackbody',
    nshades: steps
});

function clamp(value, low, high) {
    return Math.max(low, Math.min(value, high));
}

function getColor(feature) {
    const area = getArea(feature.getGeometry());
    const f = Math.pow(clamp((area - min) / (max - min), 0, 1), 1 / 2);
    const index = Math.round(f * (steps - 1));
    return ramp[index];
}


const map = new Map({
    target: 'map-container',
    layers: [
        new VectorLayer({
            source: new VectorSource({
                format: new GeoJSON(),
                url: './data/countries.json'
            })
        })
    ],
    view: new View({
        center: [0, 0],
        zoom: 2
    })
});

sync(map);


const source = new VectorSource();
const layer = new VectorLayer({
    source: source,
    style: function (feature) {
        return new Style({
            fill: new Fill({
                color: getColor(feature)
            }),
            stroke: new Stroke({
                color: 'rgba(255,255,255,0.8)'
            })
        });
    }
});


map.addLayer(layer);

//drag and drop
map.addInteraction(new DragAndDrop({
    source: source,
    formatConstructors: [GeoJSON]
}));

// modifying
map.addInteraction(new Modify({
    source: source
}));

//draw
map.addInteraction(new Draw({
    type: 'Polygon',
    source: source
}));

//snapping
map.addInteraction(new Snap({
    source: source
}));

//Clear
const clear = document.getElementById('clear');
clear.addEventListener('click', function () {
    source.clear();
});


//Download
const format = new GeoJSON({ featureProjection: 'EPSG:3857' });
const download = document.getElementById('download');
source.on('change', function () {
    const features = source.getFeatures();
    const json = format.writeFeatures(features);
    download.href = 'data:text/json;charset=utf-8,' + json;
});

import rp from 'request-promise';
import {toLatLon} from 'utm';

const baseUrl = 'https://reisapi.ruter.no';


function parseStopInfo(info) {
    return {
        id: info.ID,
        name: info.Name.trim(),
        shortName: info.ShortName,
        zone: info.Zone,
        utmX: info.X,
        utmY: info.Y,
        geoLocation: toLatLon(info.X, info.Y, 32, null, true), // should be "V"?
        utmLocation: {x: info.X, y: info.Y},
        isHub: info.IsHub,
        district: info.District,
        placeType: info.PlaceType
    };
}

function parseLineInfo(info) {
    return {
        id: info.ID,
        name: info.Name.trim(),
        transitType: info.Transportation,
        color: info.LineColour
    };
}


function getJson(url) {
    return rp({ uri: url, json: true });
}

export function linesForStop(id) {
    console.log("fetchin lines for stop", id);
    return getJson(`${baseUrl}/Line/GetLinesByStopID/${id}`)
               .then(e => e.map(parseLineInfo));
}

export function stopsForLine(id) {
    console.log("fetchin stops for line", id);
    return getJson(`${baseUrl}/Line/GetStopsByLineID/${id}`)
        .then(function(e) {
            return e.map(parseStopInfo)
        });
}

export function lineInfo(id) {
    console.log("fetchin lines info for", id);
    return getJson(`${baseUrl}/Line/GetDataByLineID/${id}`)
        .then(parseLineInfo);
}

export function stopInfo(id) {
    console.log("fetchin stop info for", id);
    return getJson(`${baseUrl}/Place/GetStop/${id}`)
            .then(parseStopInfo);
}


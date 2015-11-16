import rp from 'request-promise';
import {toLatLon} from 'utm';
import LRU from 'lru-cache';

const cache = LRU();
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
        placeType: info.PlaceType || "Stop"
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

function parseDeviations(e) {
    return e ? e.map(parseDeviation) : [];
}

function parseDeviation(e) {
    return { 
        id: e.ID,
        header: e.Header
    };
}

function parseVisit(e) { 
    return {
        stopId: parseInt(e.MonitoringRef, 10),
        lineId: parseInt(e.MonitoredVehicleJourney.LineRef),
        destinationName: e.MonitoredVehicleJourney.DestinationName,
        name: e.MonitoredVehicleJourney.PublishedLineName,
        direction: e.MonitoredVehicleJourney.DirectionRef,
        recordedAtTime: new Date(e.RecordedAtTime).toString(),
        expectedArrival: new Date(e.MonitoredVehicleJourney.MonitoredCall.ExpectedArrivalTime).toString(),
        deviations: parseDeviations(e.Extensions.Deviations),
        lineColour: e.Extensions.LineColour,
        platform: e.MonitoredVehicleJourney.MonitoredCall.DeparturePlatformName,
    };
}

function parsePlace(e) {
    return {
        id: e.ID,
        name: e.Name,
        district: e.District,
        placeType: e.PlaceType
    }
}

function getJson(url, query) {
    const key = url + ":" + JSON.stringify(query || {});
    const data = cache.get(key);
    if (data) { 
        console.log("cache hit:  ", key);
        return data;
    } 
    else {
        console.log("cache miss: ", key);
    }

    const response = rp({ uri: url, json: true, qs: query });
    cache.set(key, response)
    return response;
}

export function linesForStop(id) {
    console.log("fetching lines for stop", id);
    return getJson(`${baseUrl}/Line/GetLinesByStopID/${id}`)
               .then(e => e.map(parseLineInfo));
}

export function stopsForLine(id) {
    console.log("fetching stops for line", id);
    return getJson(`${baseUrl}/Line/GetStopsByLineID/${id}`)
        .then(e => e.map(parseStopInfo))
}

export function lineInfo(id) {
    console.log("fetching lines info for", id);
    return getJson(`${baseUrl}/Line/GetDataByLineID/${id}`)
        .then(parseLineInfo);
}

export function stopInfo(id) {
    console.log("fetching stop info for", id);
    return getJson(`${baseUrl}/Place/GetStop/${id}`)
            .then(parseStopInfo);
}

export function stopVisits(id, transporttypes, linenames) {
    console.log("fetching stop info for", id);
    return getJson(
        `${baseUrl}/StopVisit/GetDepartures/${id}`, {transporttypes, linenames}
    ).then(e => e.map(parseVisit));

}

export function placesForName(name, counties) {
    console.log("fetching places for", name);
    return getJson(
        `${baseUrl}/Place/GetPlaces/${name}`, {counties}
    ).then(e => e.map(parsePlace));
}

export function closestStops(x, y, maxDistance) {
    const url = `${baseUrl}/Place/GetClosestStops`;
    const query = {
        coordinates: `(X=${x},Y=${y})`
    }
    return getJson(url, query).then(e =>  e.map(parseStopInfo));
}

export function areaStops(sw, ne) {
    const url = `${baseUrl}/Place/GetStopsByArea`;
    const query = {
        xmin: sw.x,
        ymin: sw.y,
        xmax: ne.x,
        ymax: ne.y
    }
    return getJson(url, query).then(e =>  e.map(parseStopInfo));
}


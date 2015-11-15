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

function getJson(url, query) {
    const key = url + ":" + JSON.stringify(query || {});
    const data = cache.get(key);
    if (data) { 
        console.log("cache hit!")
        return data;
    } 

    const response = rp({ uri: url, json: true, qs: query });
    if (!query) {
        cache.set(key, response)
    }
    return response;
}

export function linesForStop(id) {
    console.log("fetchin lines for stop", id);
    return getJson(`${baseUrl}/Line/GetLinesByStopID/${id}`)
               .then(e => e.map(parseLineInfo));
}

export function stopsForLine(id) {
    console.log("fetchin stops for line", id);
    return getJson(`${baseUrl}/Line/GetStopsByLineID/${id}`)
        .then(e => e.map(parseStopInfo))
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

function parseVisit(e) { 
    return {
        stopId: parseInt(e.MonitoringRef, 10),
        lineId: parseInt(e.MonitoredVehicleJourney.LineRef),
        destinationName: e.MonitoredVehicleJourney.DestinationName,
        name: e.MonitoredVehicleJourney.PublishedLineName,
        direction: e.MonitoredVehicleJourney.DirectionRef,
        recordedAtTime: new Date(e.RecordedAtTime).toString(),
        expectedArrival: new Date(e.MonitoredVehicleJourney.MonitoredCall.ExpectedArrivalTime).toString(),
        deviations: e.Extensions.Deviations,
        lineColour: e.Extensions.LineColour,
        platform: e.MonitoredVehicleJourney.MonitoredCall.DeparturePlatformName,
    };
}

export function stopVisits(id, transporttypes, linenames) {
    console.log("fetchin stop info for", id);
    return getJson(
        `${baseUrl}/StopVisit/GetDepartures/${id}`, {transporttypes, linenames}
    ).then(e => e.map(parseVisit));

}

function parsePlace(e) {
    //console.log(e);
    const x = {
        id: e.ID,
        name: e.Name,
        district: e.District,
        placeType: e.PlaceType
    }
    console.log(x)
    return x
}

export function placesForName(name, counties) {
    console.log("fetchin places for", name);
    return getJson(
        `${baseUrl}/Place/GetPlaces/${name}`, {counties}
    ).then(e => e.map(parsePlace));

}


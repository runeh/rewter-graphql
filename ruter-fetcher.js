import debug from 'debug';
import {format as urlFormat, parse as urlParse} from 'url';
import rp from 'request-promise';
import {toLatLon} from 'utm';

const urlDebug = debug('rewter:fetcher:http');
const getDebug = debug('rewter:fetcher:get');

const baseUrl = 'https://reisapi.ruter.no';

// mapper between how transport type is represented in
// realtime api and line api.
// http://reisapi.ruter.no/Help/ResourceModel?modelName=VehicleModeEnum
// http://reisapi.ruter.no/Help/ResourceModel?modelName=TransportationType
const vehicleModeToTransportType = {
    0: 2,
    1: 5,
    2: 6,
    3: 7,
    4: 8
};

function utmToGeo(x, y) {
    const loc = toLatLon(x, y, 32, null, true);
    return { lat: loc.latitude, lng: loc.longitude };
}

function parseStopInfo(info) {
    return {
        id: info.ID,
        name: info.Name.trim(),
        shortName: info.ShortName,
        zone: info.Zone,
        geoLocation: utmToGeo(info.X, info.Y),
        utmLocation: {x: info.X, y: info.Y},
        isHub: info.IsHub,
        district: info.District,
        placeType: info.PlaceType || "Stop",
        walkingTimeMins: info.WalkingMinutes || null
    };
}

function parsePoiInfo(info) {
    return {
        id: info.ID,
        name: info.Name.trim(),
        geoLocation: utmToGeo(info.X, info.Y),
        utmLocation: {x: info.X, y: info.Y},
        district: info.District,
        placeType: "POI",
        nearbyStops: info.Stops
            .filter(e => e.ID !== 0)
            .map(parseStopInfo)
    };
}

function parseAreaInfo(info) {
    return {
        id: info.ID,
        name: info.Name.trim(),
        geoLocation: utmToGeo(info.Center.X, info.Center.Y),
        utmLocation: {x: info.Center.X, y: info.Center.Y},
        district: info.District,
        placeType: "Area",
        stops: info.Stops.map(parseStopInfo)
    };
}


function parseLineInfo(info) {
    return {
        id: info.ID,
        name: info.Name.trim(),
        transportationType: info.Transportation,
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
        inCongestion: e.MonitoredVehicleJourney.InCongestion,
        monitored: e.MonitoredVehicleJourney.Monitored,
        transportationType: vehicleModeToTransportType[e.MonitoredVehicleJourney.VehicleMode],
        lowFloor: e.MonitoredVehicleJourney.VehicleFeatureRef 
                    ? e.MonitoredVehicleJourney.VehicleFeatureRef == 'lowFloor'
                    : false
    };
}

function parsePlace(e) {
    if (e.PlaceType == "Stop") {
        return parseStopInfo(e);
    }
    else if (e.PlaceType == "POI") {
        return parsePoiInfo(e);
    }
    else if (e.PlaceType == "Street") {
        return {
            id: e.ID,
            name: e.Name,
            district: e.District,
            placeType: e.PlaceType
        };
    }
    else if (e.PlaceType == "Area") {
        return parseAreaInfo(e);
    }
    else {
        return {
            id: e.ID,
            name: e.Name,
            district: e.District,
            placeType: e.PlaceType
        }; 
    }
}

function sanitizeUrl(url) {
    return urlFormat(urlParse(url));
}

function getJson(url, query = null) {
    url = sanitizeUrl(url);
    urlDebug(`fetching url "${url}"`);
    return rp({ uri: url, json: true, qs: query });
}

export function linesForStop(id) {
    getDebug(`fetching lines for stop ${id}`);
    return getJson(`${baseUrl}/Line/GetLinesByStopID/${id}`)
               .then(e => e.map(parseLineInfo));
}

export function stopsForLine(id) {
    getDebug(`fetching stops for line ${id}`);
    return getJson(`${baseUrl}/Line/GetStopsByLineID/${id}`)
        .then(e => e.map(parseStopInfo));
}

export function lineInfo(id) {
    getDebug(`fetching line info for ${id}`);
    return getJson(`${baseUrl}/Line/GetDataByLineID/${id}`)
        .then(parseLineInfo);
}

export function stopInfo(id) {
    getDebug(`fetching stop info for ${id}`);
    return getJson(`${baseUrl}/Place/GetStop/${id}`)
            .then(parseStopInfo);
}

export function stopVisits(id, transporttypes, linenames) {
    getDebug(`fetching stop visits for ${id}`);
    return getJson(
        `${baseUrl}/StopVisit/GetDepartures/${id}`, {transporttypes, linenames}
    ).then(e => e.map(parseVisit));
}

export function placesForName(name, counties) {
    getDebug(`fetching places for ${name}`);
    return getJson(
        `${baseUrl}/Place/GetPlaces/${name}`, {counties}
    ).then(e => e.map(parsePlace));
}

export function closestStops(x, y, maxDistance) {
    const url = `${baseUrl}/Place/GetClosestStops`;
    const query = {
        coordinates: `(X=${x},Y=${y})`
    };
    return getJson(url, query).then(e =>  e.map(parseStopInfo));
}

export function areaStops(sw, ne) {
    const url = `${baseUrl}/Place/GetStopsByArea`;
    const query = {
        xmin: sw.x,
        ymin: sw.y,
        xmax: ne.x,
        ymax: ne.y
    };
    return getJson(url, query).then(e =>  e.map(parseStopInfo));
}

function parseTravelPlans(plans) {
    return plans.TravelProposals.map(parseTravelPlan);
}

function parseDurationString(duration) {
    const [hours, mins, _] = duration.split(":").map(e => parseInt(e));
    return (hours * 60) + mins;
}

function parseTravelStage(stage) {    
    const typedStage = stage.Transportation == 0
             ? parseWalkingTravelStage(stage)
             : parseTransitTravelStage(stage);

    return Object.assign(typedStage, {
        departureTime: stage.DepartureTime,
        arrivalTime: stage.ArrivalTime,
        travelTimeMins: parseDurationString(stage.TravelTime || stage.WalkingTime),
        transportationType: stage.Transportation
    });
}

function parseWalkingTravelStage(stage) {
    return {
        arrivalGeoLocation: utmToGeo(stage.ArrivalPoint.X, stage.ArrivalPoint.Y),
        arrivalUtmLocation: {x: stage.ArrivalPoint.X, y: stage.ArrivalPoint.Y},
        departureGeoLocation: utmToGeo(stage.DeparturePoint.X, stage.DeparturePoint.Y),
        departureUtmLocation: {x: stage.DeparturePoint.X, y: stage.DeparturePoint.Y}
    };
}

function parseTransitTravelStage(stage) {
    return {
        line: stage.LineId,
        destinationName: stage.Destination,
        departureStop: parseStopInfo(stage.DepartureStop),
        arrivalStop: parseStopInfo(stage.ArrivalStop),
        lineName: stage.LineName,
        color: stage.LineColour
    };
}

function parseTravelPlan(plan) {
    return {
        departureTime: plan.DepartureTime,
        arrivalTime: plan.ArrivalTime,
        travelTimeMins: parseDurationString(plan.TotalTravelTime),
        remarks: plan.Remarks,
        zones: [],
        stages: plan.Stages.map(parseTravelStage)
    };
}

function locInputToQuery(loc) {
    return loc.id ? loc.id : `(X=${loc.x},Y=${loc.y})`;
}

export function getTravelPlan(origin, destination) {
    getDebug("fetching travel plan for", origin, destination);
    const fromplace = locInputToQuery(origin);
    const toplace = locInputToQuery(destination);

    const url = `${baseUrl}/Travel/GetTravels`;
    const query = {
        toplace: toplace,
        fromplace: fromplace,
        isafter: true,
        time: 10122015173000
    };
    return getJson(url, query).then(parseTravelPlans);
}

function parseStreetHouses(houses) {
    return houses.Houses.map(e => ({
                streetName: houses.Name,
                streetId: houses.ID,
                district: houses.District,
                name: e.Name,
                geoLocation: utmToGeo(e.X, e.Y),
                utmLocation: {x: e.X, y: e.Y},
            }));
}

export function streetHouses(id) {
    getDebug(`houses for street ${id}`);
    const url = `${baseUrl}/Street/GetStreet/${id}`;
    return getJson(url).then(parseStreetHouses);
}

import {
    areaStops,
    closestStops,
    getTravelPlan,
    lineInfo,
    linesForStop,
    placesForName,
    streetHouses,
    stopInfo,
    stopsForLine,
    stopVisits,
} from './ruter-fetcher';

import {
    assoc,
    flatten,
    groupBy,
    head,
    map as mapObj,
    map,
    pick,
    pipe,
    pluck,
    prop,
    toPairs,
    uniq,
    values,
    zip,
} from 'ramda';

import {fromLatLon} from 'utm';

export function resolveStopInfo(id) {
    return stopInfo(id);
}

export function resolveLineInfo(id) {
    return lineInfo(id);
}

export function resolveStopsForLine(id) {
    return stopsForLine(id);
}

export function resolveLinesForStop(id) {
    return linesForStop(id);
}

export function resolveStopVisits(id) {
    // fixme: supprts more args
    return stopVisits(id);
}

export function resolveStreetHouses(id) {
    return streetHouses(id);
}

export function resolveVisitsToDestinations(visits) {
    const grouper = e => `${e.lineId}:${e.destinationName}`;
    const lineVisits = values(groupBy(grouper, visits));
    const lineInfo = lineVisits
                        .map(head)
                        .map(pick(['stopId', 'lineId', 'name', 'destinationName', 'lineColour', 'transportationType']));
    return zip(lineInfo, lineVisits).map(([i, v]) => assoc('visits', v, i));
}

export function resolvePlatformsFromVisits(visits) {
    visits = visits.filter(prop('platform'));
    const platformVisits = groupBy(prop('platform'), visits);
    return toPairs(platformVisits)
            .map(([name, visits]) => ({name, visits}));
}

/*
 * Checks that loc contains either a utm location or a lat/lon location.
 * If that is not the case, it throws an error.
 * This is neccessary because union types are not valid as input types
 * in graphql currently, and we can't have both the utm and latlon 
 * members of the input object be non-nullable, without requiring both
 * of them to be present.
 */
function geoLocationInputToUtm(loc) {
    if (loc.utmLocation) {
        return { easting: loc.utmLocation.x, northing: loc.utmLocation.y };
    }
    else if (loc.geoLocation) {
        const {easting, northing} = fromLatLon(loc.geoLocation.lat, loc.geoLocation.lng)
        return {easting: parseInt(easting), northing: parseInt(northing)};
    }
    else {
        throw new Error("GeoLocationInput must have either utmLocation or geoLocation property");
    }
}

// todo: more args
export function resolveClosestStops(point) {
    const {easting, northing} = geoLocationInputToUtm(location);
    return closestStops(easting, northing);    
}

// todo: more args
export function resolveAreaStops(sw, ne) {
    sw = geoLocationInputToUtm(sw);
    ne = geoLocationInputToUtm(ne);
    return areaStops(
        {x: sw.easting, y: sw.northing},
        {x: ne.easting, y: ne.northing}
    );
}

export const resolveUniqueDeviations = pipe(pluck('deviations'), flatten, uniq);

/*
 * todo: wrap utm method to parseint and add correct datum
 *
 * todo: add a validation step that can live with schema and run
 * with resolveWithPrecondition(fun, 'actualResolver') or similar
 */
function plannerLocationInputToObject(ploc) {
    if (ploc.geo) {
        const {easting, northing} = fromLatLon(ploc.geo.lat, ploc.geo.lng);
        return {x: parseInt(easting), y: parseInt(northing)};
    }
    else if (ploc.utm) {
        return {x: ploc.utm.x, y: ploc.utm.y};
    }
    else if (ploc.stop) {
        return {id: ploc.stop.id};
    }
    else if (ploc.area) {
        return {id: ploc.area.id};
    }
    else {
        throw new Error("PlannerLocationInput must have one of utm, geo, stop or area set");
    }
}

export function resolveGetTravelPlan(origin, destination) {
    origin = plannerLocationInputToObject(origin);
    destination = plannerLocationInputToObject(destination);
    return getTravelPlan(origin, destination);    
}

export function resolvePlacesForName(name, type = null) {
    let p = placesForName(name);
    if (type) {
        p = p.then(e => e.filter(y => type.indexOf(y.placeType) != -1));
    }
    return p;
}


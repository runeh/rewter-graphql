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

export const resolveUniqueDeviations = pipe(pluck('deviations'), flatten, uniq);


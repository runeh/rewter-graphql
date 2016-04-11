import {
    GraphQLNonNull,
    GraphQLObjectType,
    GraphQLString,
    GraphQLList,
    GraphQLBoolean,
    GraphQLID,
    GraphQLInt
} from 'graphql';

import {
    resolveStopInfo,
    resolveLineInfo,
    resolveUniqueDeviations,
    resolveVisitsToDestinations,
    resolvePlatformsFromVisits
} from '../resolvers'

import {
    Stop
} from './place'

import {
    Line,
    TransportationType
} from './core'


export const RealtimeDestination = new GraphQLObjectType({
    name: 'RealtimeDestination',
    description: 'A line, as represented by the realtime system',
    fields: () => ({
        name: {
            type: new GraphQLNonNull(GraphQLString)
        },
        stop: {
            type: new GraphQLNonNull(Stop),
            resolve: ({stopId}) => resolveStopInfo(stopId)
        },
        line: {
            type: new GraphQLNonNull(Line),
            resolve: ({lineId}) => resolveLineInfo(lineId)
        },
        color: {
            type: new GraphQLNonNull(GraphQLString),
            resolve: ({lineColour}) => "#" + lineColour
        },
        destinationName: {
            type: new GraphQLNonNull(GraphQLString)
        },
        transportationType: {
            type: new GraphQLNonNull(TransportationType)
        },
        visits: {
            type: new GraphQLList(RealtimeVisit)
        },
        deviations: {
            type: new GraphQLList(Deviation),
            resolve: ({visits}) => resolveUniqueDeviations(visits)
        }
    })
});


export const RealtimePlatform = new GraphQLObjectType({
    name: 'RealtimePlatform',
    description: 'A platform connected to a stop, valid for realtime departure info only, thus volatile based on time of day etc.',
    fields: () => ({
        name: {
            type: GraphQLString
        },
        visits: {
            type: new GraphQLList(RealtimeVisit)
        },
        destinations: {
            type: new GraphQLList(RealtimeDestination),
            resolve: ({visits}) => resolveVisitsToDestinations(visits)
        },
        deviations: {
            type: new GraphQLList(Deviation),
            resolve: ({visits}) => resolveUniqueDeviations(visits)
        }
    })
});


export const Realtime = new GraphQLObjectType({
    name: 'Realtime',
    description: 'Bag of holding for realtime info attached to a stop',
    fields: () => ({
        visits: {
            type: new GraphQLList(RealtimeVisit),
            args: {
                limit: {
                    type: GraphQLInt
                },
                direction: {
                    type: GraphQLString
                },
            },
            resolve: function(visits, {limit, direction}) {
                if (direction) {
                    visits = visits.filter(e => e.direction == direction)
                }

                if (limit) {
                    visits = visits.slice(0, limit);
                }
                return visits;
            }
        },
        platforms: {
            type: new GraphQLList(RealtimePlatform),
            resolve: (visits) => resolvePlatformsFromVisits(visits)
        },
        destinations: {
            type: new GraphQLList(RealtimeDestination),
            resolve: (visits) => resolveVisitsToDestinations(visits)
        },
        deviations: {
            type: new GraphQLList(Deviation),
            resolve: (visits) => resolveUniqueDeviations(visits)
        }
    })
});


export const RealtimeVisit = new GraphQLObjectType({
    name: 'RealtimeVisit',
    description: 'Realtime visit, that is realtime data for a transport visiting a stop',
    fields: () => ({
        expectedArrival: {
            type: new GraphQLNonNull(GraphQLString),
        },
        name: {
            type: new GraphQLNonNull(GraphQLString),
        },
        destinationName: {
            type: new GraphQLNonNull(GraphQLString),
        },
        direction: {
            type: GraphQLString
        },
        platform: {
            type: GraphQLString
        },
        lowFloor: {
            type: new GraphQLNonNull(GraphQLBoolean)
        },
        inCongestion: {
            type: new GraphQLNonNull(GraphQLBoolean)
        },
        monitored: {
            type: new GraphQLNonNull(GraphQLBoolean)
        },
        transportationType: {
            type: new GraphQLNonNull(TransportationType)
        },
        deviations: {
            type: new GraphQLList(Deviation)
        },
        stop: {
            type: new GraphQLNonNull(Stop),
            resolve: ({stopId}) => resolveStopInfo(stopId)
        },
        line: {
            type: new GraphQLNonNull(Line),
            resolve: ({lineId}) => resolveLineInfo(lineId)
        }
    })
});

export const Deviation = new GraphQLObjectType({
    name: 'Deviation',
    description: 'Notice about a deviation from regular service',
    fields: {
        id: {
            type: GraphQLID,
        },
        header: {
            type: new GraphQLNonNull(GraphQLString),
            description: "Short summary of deviation"
        }
    }
});

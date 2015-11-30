import {
    GraphQLBoolean,
    GraphQLEnumType,
    GraphQLID,
    GraphQLInt,
    GraphQLInterfaceType,
    GraphQLList,
    GraphQLNonNull,
    GraphQLObjectType,
    GraphQLString,
} from 'graphql';

import {
    GeoLocation,
    Line,
    TransportationType,
    UTMLocation,
} from './core'

import {
    Realtime,
} from './realtime'

import {
    resolveLinesForStop,
    resolveStopVisits,
    resolveStreetHouses,
} from '../resolvers'


export const PlaceType = new GraphQLEnumType({
    name: 'PlaceType',
    description: 'A kind of place',
    values: {
        AREA: {
            value: "Area",
            description: "An area"
        },
        STOP: {
            value: "Stop",
            description: "A public transportation stop"
        },
        STREET: {
            value: "Street",
            description: "A street"
        },
        POI: {
            value: "POI",
            description: "Point of interest"
        }
    }
});

export const PlaceInterface = new GraphQLInterfaceType({
    name: 'PlaceInterface',
    description: 'A place of some kind',
    fields: {
       id: {
            type: GraphQLID,
            description: 'Unique ID for a place'
        },
        name: {
            type: new GraphQLNonNull(GraphQLString),
            description: 'Name of place'
        },
        district: {
            type: new GraphQLNonNull(GraphQLString),
            description: 'District place belongs to'
        },
        placeType: {
            type: new GraphQLNonNull(PlaceType),
            description: 'Type of place'
        }
    }
});


export const Street = new GraphQLObjectType({
    name: 'Street',
    description: 'A Street',
    interfaces: [ PlaceInterface ],
    isTypeOf: e => e.placeType == "Street", // fixme, use enum somehow
    fields: () => ({
        // fields for PlaceInterface
        id: {
            type: GraphQLID,
        },
        name: {
            type: new GraphQLNonNull(GraphQLString),
        },
        placeType: {
            type: new GraphQLNonNull(PlaceType),
        },
        district: {
            type: new GraphQLNonNull(GraphQLString),
        },

        // own fields
        houses: {
            type: new GraphQLList(House),
            resolve: ({id}) => resolveStreetHouses(id)
        }
    })
});


export const POI = new GraphQLObjectType({
    name: 'POI',
    description: 'A place of interest',
    interfaces: [ PlaceInterface ],
    isTypeOf: e => e.placeType == "POI", // fixme, use enum somehow
    fields: () => ({
        // fields for PlaceInterface
        id: {
            type: GraphQLID,
        },
        name: {
            type: new GraphQLNonNull(GraphQLString),
        },
        placeType: {
            type: new GraphQLNonNull(PlaceType),
        },
        district: {
            type: new GraphQLNonNull(GraphQLString),
        },

        // own fields
        geoLocation: {
            type: new GraphQLNonNull(GeoLocation)
        },
        utmLocation: {
            type: new GraphQLNonNull(UTMLocation)
        },
        nearbyStops: {
            type: new GraphQLList(NearbyStop),
            resolve: ({nearbyStops}) => nearbyStops.map(e => ({walkingTimeMins: e.walkingTimeMins, stop: e}))
        }
    })
});


export const Area = new GraphQLObjectType({
    name: 'Area',
    description: 'An area',
    interfaces: [ PlaceInterface ],
    isTypeOf: e => e.placeType == "Area", // fixme, use enum somehow
    fields: () => ({
        // fields for PlaceInterface
        id: {
            type: GraphQLID,
        },
        name: {
            type: new GraphQLNonNull(GraphQLString),
        },
        placeType: {
            type: new GraphQLNonNull(PlaceType),
        },
        district: {
            type: new GraphQLNonNull(GraphQLString),
        },

        // own fields
        geoLocation: {
            type: new GraphQLNonNull(GeoLocation)
        },
        utmLocation: {
            type: new GraphQLNonNull(UTMLocation)
        },
        stops: {
            type: new GraphQLList(Stop)
        }
    })
});


export const Stop = new GraphQLObjectType({
    name: 'Stop',
    description: 'A stop',
    interfaces: [ PlaceInterface ],
    isTypeOf: e => e.placeType == "Stop", // fixme, use enum somehow
    fields: () => ({

        // fields for PlaceInterface
        id: {
            type: GraphQLID,
        },
        name: {
            type: new GraphQLNonNull(GraphQLString),
        },
        placeType: {
            type: new GraphQLNonNull(PlaceType),
        },
        district: {
            type: new GraphQLNonNull(GraphQLString),
        },

        // Other fields
        shortName: {
            type: new GraphQLNonNull(GraphQLString),
            description: 'desc'
        },
        zone: {
            type: new GraphQLNonNull(GraphQLString),
            description: 'desc'
        },
        isHub: {
            type: new GraphQLNonNull(GraphQLBoolean),
            description: 'desc'
        },
        utmLocation: {
            type: new GraphQLNonNull(UTMLocation)
        },
        geoLocation: {
            type: new GraphQLNonNull(GeoLocation),
        },
        lines: {
            type: new GraphQLList(Line),
            description: 'lines serviced by from stop by type',
            args: {
                transportationType: {
                    name: 'transportationType',
                    type: new GraphQLList(TransportationType)
                },
                id: {
                    name: 'id',
                    type: GraphQLID,
                }
            },
            resolve: ({id: stopId}, {transportationType, id: lineId}) => {
                let p = resolveLinesForStop(stopId);

                if (transportationType) {
                    p = p.then(e => e.filter(y => transportationType.indexOf(y.transportationType) != -1));
                }

                if (lineId) {
                    p = p.then(e => {
                        return e.filter(y => lineId.indexOf(y.id) != -1 );
                    });
                }

                return p;

            }
        },

        realtime: {
            type: Realtime,
            resolve: ({id}) => resolveStopVisits(id)
        }
    })
});


export const NearbyStop = new GraphQLObjectType({
    name: 'NearbyStop',
    description: 'A record of a stop within walking distance of a POI or address',
    fields: () => ({
        walkingTimeMins: {
            type: new GraphQLNonNull(GraphQLInt),
        },
        stop: {
            type: new GraphQLNonNull(Stop),
        }
    })
});


export const House = new GraphQLObjectType({
    name: 'House',
    description: 'A house',
    fields: () => ({
        streetName: {
            type: new GraphQLNonNull(GraphQLString)
        },
        name: {
            type: new GraphQLNonNull(GraphQLString)
        },
        geoLocation: {
            type: new GraphQLNonNull(GeoLocation)
        },
        utmLocation: {
            type: new GraphQLNonNull(UTMLocation)
        }

        // todo: from house to stops and sales points
    })
});


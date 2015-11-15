import {
    stopInfo,
    lineInfo,
    linesForStop,
    stopsForLine,
    stopVisits,
    placesForName
} from './ruter-fetcher';

import {
    GraphQLEnumType,
    GraphQLInterfaceType,
    GraphQLObjectType,
    GraphQLList,
    GraphQLNonNull,
    GraphQLSchema,
    GraphQLString,
    GraphQLInt,
    GraphQLFloat,
    GraphQLBoolean,
} from 'graphql';


const TransitType = new GraphQLEnumType({
    name: 'TransitType',
    description: 'One of the types of transit operated by ruter',
    values: {
        TRAM: {
            value: 7,
            description: 'Tram'
        },
        BUS: {
            value: 2,
            description: 'Bus'
        },
        SUBWAY: {
            value: 6,
            description: 'Subway'
        },
        FERRY: {
            value: 1,
            description: 'Ferry'
        }
    }
});

const PlaceType = new GraphQLEnumType({
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

const PlaceInterface = new GraphQLInterfaceType({
    name: 'PlaceInterface',
    description: 'A place of some kind',
    fields: () => ({
        id: {
            type: new GraphQLNonNull(GraphQLInt),
            description: 'place id'
        },
        name: {
            type: new GraphQLNonNull(GraphQLString),
            description: 'place name'
        },
        district: {
            type: new GraphQLNonNull(GraphQLString),
            description: 'place district'
        },
        placeType: {
            type: new GraphQLNonNull(PlaceType),
            description: 'place type'
        }
    })
});

const GeoLocation = new GraphQLObjectType({
    name: 'GeoLocation',
    description: 'geo type',
    fields: {
        latitude: {
            type: GraphQLFloat,
            description: 'latitude'
        },
        longitude: {
            type: GraphQLFloat,
            description: 'longitude'
        }
    }
});

const Line = new GraphQLObjectType({
    name: 'Line',
    description: 'A public transit line',
    fields: () => ({
        id: {
            type: new GraphQLNonNull(GraphQLInt),
            description: 'The id of the line.',
        },
        name: {
            type: new GraphQLNonNull(GraphQLString),
            description: 'The name of the line.',
        },
        transitType: {
            type: new GraphQLNonNull(TransitType),
            description: 'The type or transport of the line.',
        },
        color: {
            type: new GraphQLNonNull(GraphQLString),
            description: 'The color of the line.',
        },
        stops: {
            type: new GraphQLList(new GraphQLNonNull(Stop)),
            description: 'Stops serviced by this line',
            resolve: ({id}, args, source) => stopsForLine(id)
        },
        endPoints: {
            type: GraphQLString,
            description: 'End points for line',
            resolve: ({id}) => stopsForLine(id).then(e => {
                return e[0].name + ' / ' + e[e.length - 1].name;
            })

        }
    }),
    interfaces: [ ]
});

const Stop = new GraphQLObjectType({
    name: 'Stop',
    description: 'A stop',
    interfaces: [ PlaceInterface ],
    isTypeOf: e => e.placeType == "Stop", // fixme, use enum somehow
    fields: () => ({
        id: {
            type: new GraphQLNonNull(GraphQLInt),
            description: 'stop id'
        },
        name: {
            type: new GraphQLNonNull(GraphQLString),
            description: 'desc'
        },
        shortName: {
            type: new GraphQLNonNull(GraphQLString),
            description: 'desc'
        },
        zone: {
            type: new GraphQLNonNull(GraphQLString),
            description: 'desc'
        },
        placeType: {
            type: new GraphQLNonNull(PlaceType),
            description: 'desc'
        },
        district: {
            type: new GraphQLNonNull(GraphQLString),
            description: 'desc'
        },
        isHub: {
            type: new GraphQLNonNull(GraphQLBoolean),
            description: 'desc'
        },
        utmX: {
            type: new GraphQLNonNull(GraphQLInt),
            description: 'desc'
        },
        utmY: {
            type: new GraphQLNonNull(GraphQLInt),
            description: 'desc'
        },
        geoLocation: {
            type: GeoLocation,
            description: 'geo point'
        },
        lines: {
            type: new GraphQLList(Line),
            description: 'lines serviced by from stop by type',
            args: {
                transitType: {
                    name: 'transitType',
                    type: new GraphQLList(TransitType)
                },
                id: {
                    name: 'id',
                    type: new GraphQLList(GraphQLInt),
                }
            },
            resolve: ({id: stopId}, {transitType, id: lineId}) => {
                console.log('ergs', transitType, lineId)

                let p = linesForStop(stopId);

                if (transitType) {
                    p = p.then(e => e.filter(y => transitType.indexOf(y.transitType) != -1));
                }

                if (lineId) {
                    p = p.then(e => {
                        console.log(e);
                        return e.filter(y => lineId.indexOf(y.id) != -1 );
                    })
                }

                return p;

            }
        },
        departures: {
            type: new GraphQLList(StopVisit),
            description: 'Pending visits for stop. This is the reealtime info',
            resolve: function({id}) {
                console.log(id);
                return stopVisits(id)
                return null
            }
        }
    })
});


const StopVisit = new GraphQLObjectType({
    name: 'StopVisit',
    description: 'Stop visit',
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
        stop: {
            type: new GraphQLNonNull(Stop),
            resolve: ({stopId}) => stopInfo(stopId)
        },
        line: {
            type: new GraphQLNonNull(Line),
            resolve: ({lineId}) => lineInfo(lineId)
        },
        destinationName: {
            type: new GraphQLNonNull(GraphQLString)
        },
        direction: {
            type: GraphQLString
        },
        platform: {
            type: new GraphQLNonNull(GraphQLString)
        },
        deviations: {
            type: GraphQLString
        }
    })
});



const Place = new GraphQLObjectType({
    name: 'Place',
    description: 'A place of some kind',
    interfaces: [ PlaceInterface ],
    isTypeOf: e => e.placeType != "Stop", // fixme, use enum somehow

    fields: () => ({
        id: {
            type: new GraphQLNonNull(GraphQLInt),
            description: 'place id'
        },
        name: {
            type: new GraphQLNonNull(GraphQLString),
            description: 'place name'
        },
        district: {
            type: new GraphQLNonNull(GraphQLString),
            description: 'place district'
        },
        placeType: {
            type: new GraphQLNonNull(PlaceType),
            description: 'place type'
        }
    })
});


export const schema = new GraphQLSchema({
    query: new GraphQLObjectType({
        name: 'Query',
        fields: {
            version: {
                type: GraphQLString,
                resolve: function() {
                    return '1.0';
                }
            },
            utcTime: {
                type: GraphQLString,
                resolve: function() {
                    return new Date().toString();
                }
            },
            stop: {
                type: Stop,
                args: {
                    id: { name: 'id', type: new GraphQLNonNull(GraphQLInt) }
                },
                resolve: (root, {id}, source) => stopInfo(id)
            },
            line: {
                type: Line,
                args: {
                    id: { name: 'id', type: new GraphQLNonNull(GraphQLInt) }
                },
                resolve: (root, {id}, source) => lineInfo(id)
            },
            places: {
                type: new GraphQLList(PlaceInterface),
                args: {
                    name: {
                        name: 'name',
                        type: new GraphQLNonNull(GraphQLString)
                    }
                    // add counties and type
                },
                resolve: (root, {name}) => placesForName(name)
            }
        }
    })
});


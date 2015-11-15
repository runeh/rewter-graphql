import {stopInfo, lineInfo, linesForStop, stopsForLine} from './ruter-fetcher';

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

var GeoLocation = new GraphQLObjectType({
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

var Line = new GraphQLObjectType({
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

var Stop = new GraphQLObjectType({
    name: 'Stop',
    description: 'A stop',
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
            type: GraphQLString,
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
        stopVisits: {
            type: new GraphQLList(StopVisit),
            description: 'Pending visits for stop. This is the reealtime info'
        }
    })
});

var StopVisit = new GraphQLObjectType({
    name: 'Visit',
    description: 'llalaaalallalalala',
    fields: () => ({
        journeys: {
            type: new GraphQLNonNull(GraphQLString),
            description: 'desc'
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
            }

        }
    })
});


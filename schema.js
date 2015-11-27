import {
    areaStops,
    closestStops,
    getTravelPlan,
    lineInfo,
    linesForStop,
    placesForName,
    stopInfo,
    stopsForLine,
    stopVisits,
} from './ruter-fetcher';

import {
    GraphQLBoolean,
    GraphQLEnumType,
    GraphQLFloat,
    GraphQLInputObjectType,
    GraphQLInt,
    GraphQLInterfaceType,
    GraphQLList,
    GraphQLNonNull,
    GraphQLObjectType,
    GraphQLSchema,
    GraphQLString,
} from 'graphql';

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


const GeoLocationInput = new GraphQLInputObjectType({
    name: 'GeoLocationInput',
    fields: {
        lat: { type: new GraphQLNonNull(GraphQLFloat) },
        lng: { type: new GraphQLNonNull(GraphQLFloat) },
    }
});

const UtmLocationInput = new GraphQLInputObjectType({
    name: 'UtmLocationInput',
    fields: {
        x: { type: new GraphQLNonNull(GraphQLFloat) },
        y: { type: new GraphQLNonNull(GraphQLFloat) },
    }
});

const HybridLocationInput = new GraphQLInputObjectType({
    name: 'HybridLocationInput',
    description: "Either UTM, with .x and .y, or .lat and .lon. Exists because UnionTypes are not InputObjectTypes yet",
    fields: {
        lat: { type: GraphQLFloat },
        lng: { type: GraphQLFloat },
        x: { type: GraphQLFloat },
        y: { type: GraphQLFloat }
    }
});

const TransportationType = new GraphQLEnumType({
    name: 'TransportationType',
    description: 'A mode of transport, or walking',
    values: {
        WALKING: {
            value: 0,
            description: 'Walking'
        },
        AIRPORT_BUS: {
            value: 1,
            description: 'Airport bus'
        },
        BUS: {
            value: 2,
            description: 'Bus'
        },
        DUMMY: {
            value: 3,
            description: 'Dummy'
        },
        AIRPORT_TRAIN: {
            value: 4,
            description: 'Airport train'
        },
        BOAT: {
            value: 5,
            description: 'Boat'
        },
        TRAIN: {
            value: 6,
            description: 'Train'
        },
        TRAM: {
            value: 7,
            description: 'Tram'
        },
        METRO: {
            value: 8,
            description: 'Metro'
        },
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
    fields: {
       id: {
            type: new GraphQLNonNull(GraphQLInt),
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

// fixme: add UTMLocation ?
const GeoLocation = new GraphQLObjectType({
    name: 'GeoLocation',
    description: 'Lat/Lon location',
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
    description: 'A public transportation line',
    fields: () => ({
        id: {
            type: new GraphQLNonNull(GraphQLInt),
            description: 'The id of the line.',
        },
        name: {
            type: new GraphQLNonNull(GraphQLString),
            description: 'The name of the line.',
        },
        transportationType: {
            type: new GraphQLNonNull(TransportationType),
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

const Deviation = new GraphQLObjectType({
    name: 'Deviation',
    description: 'Notice about a deviation from regular service',
    fields: {
        id: {
            type: new GraphQLNonNull(GraphQLInt),
        },
        header: {
            type: new GraphQLNonNull(GraphQLString),
            description: "Short summary of deviation"
        }
    }
});

const Stop = new GraphQLObjectType({
    name: 'Stop',
    description: 'A stop',
    interfaces: [ PlaceInterface ],
    isTypeOf: e => e.placeType == "Stop", // fixme, use enum somehow
    fields: () => ({

        // fields for PlaceInterface
        id: {
            type: new GraphQLNonNull(GraphQLInt),
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
                transportationType: {
                    name: 'transportationType',
                    type: new GraphQLList(TransportationType)
                },
                id: {
                    name: 'id',
                    type: new GraphQLList(GraphQLInt),
                }
            },
            resolve: ({id: stopId}, {transportationType, id: lineId}) => {
                let p = linesForStop(stopId);

                if (transportationType) {
                    p = p.then(e => e.filter(y => transportationType.indexOf(y.transportationType) != -1));
                }

                if (lineId) {
                    p = p.then(e => {
                        return e.filter(y => lineId.indexOf(y.id) != -1 );
                    })
                }

                return p;

            }
        },

        realtime: {
            type: Realtime,
            resolve: ({id}) => stopVisits(id)
        }
    })
});


const RealtimeDestination = new GraphQLObjectType({
    name: 'RealtimeDestination',
    description: 'A line, as represented by the realtime system',
    fields: () => ({
        name: {
            type: new GraphQLNonNull(GraphQLString)
        },
        stop: {
            type: new GraphQLNonNull(Stop),
            resolve: ({stopId}) => stopInfo(stopId)
        },
        line: {
            type: new GraphQLNonNull(Line),
            resolve: ({lineId}) => lineInfo(lineId)
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
            resolve: ({visits}) => collectUniqueDeviations(visits)
        }
    })
});

const collectUniqueDeviations = pipe(pluck('deviations'), flatten, uniq);

function visitsToDestinations(visits) {
    const grouper = e => `${e.lineId}:${e.destinationName}`;
    const lineVisits = values(groupBy(grouper, visits));
    const lineInfo = lineVisits
                        .map(head)
                        .map(pick(['stopId', 'lineId', 'name', 'destinationName', 'lineColour', 'transportationType']));
    return zip(lineInfo, lineVisits).map(([i, v]) => assoc('visits', v, i));
}

const RealtimePlatform = new GraphQLObjectType({
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
            resolve: ({visits}) => visitsToDestinations(visits)
        },
        deviations: {
            type: new GraphQLList(Deviation),
            resolve: ({visits}) => collectUniqueDeviations(visits)
        }
    })
});

function platformsFromVisits(visits) {
    visits = visits.filter(prop('platform'));
    const platformVisits = groupBy(prop('platform'), visits);
    return toPairs(platformVisits)
            .map(([name, visits]) => ({name, visits}));
}

const Realtime = new GraphQLObjectType({
    name: 'Realtime',
    description: 'Bag of holding for realtime info attached to a stop',
    fields: () => ({
        visits: {
            type: new GraphQLList(RealtimeVisit),
            resolve: (visits) => visits
        },
        platforms: {
            type: new GraphQLList(RealtimePlatform),
            resolve: (visits) => platformsFromVisits(visits)
        },
        destinations: {
            type: new GraphQLList(RealtimeDestination),
            resolve: (visits) => visitsToDestinations(visits)
        },
        deviations: {
            type: new GraphQLList(Deviation),
            resolve: (visits) => collectUniqueDeviations(visits)
        }
    })
});


const RealtimeVisit = new GraphQLObjectType({
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
            resolve: ({stopId}) => stopInfo(stopId)
        },
        line: {
            type: new GraphQLNonNull(Line),
            resolve: ({lineId}) => lineInfo(lineId)
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
    })
});





const TravelProposal = new GraphQLObjectType({
    name: 'TravelProposal',
    description: 'A travel proposal',

    fields: () => ({
        departureTime: {
            type: new GraphQLNonNull(GraphQLString)
        },
        arrivalTime: {
            type: new GraphQLNonNull(GraphQLString)            
        },
        travelTimeMins: {
            type: new GraphQLNonNull(GraphQLInt)
        },
        remarks: {
            type: new GraphQLList(GraphQLString)
        },
        zones: {
            type: new GraphQLList(GraphQLString)
        },
        stages: {
            type: new GraphQLList((TravelStageInterface))
            //type: new GraphQLList(new GraphQLNonNull(TravelStageInterface))
        }
    })
});


const TravelStageInterface = new GraphQLInterfaceType({
    name: 'TravelStageInterface',
    description: 'A stage of a travel proposal',

    fields: () => ({
        departureTime: {
            type: new GraphQLNonNull(GraphQLString)
        },
        arrivalTime: {
            type: new GraphQLNonNull(GraphQLString)            
        },
        travelTimeMins: {
            type: new GraphQLNonNull(GraphQLInt)
        },
        transportationType: {
            type: new GraphQLNonNull(TransportationType)
        }
    })
});


const WalkingTravelStage = new GraphQLObjectType({
    name: 'WalkingTravelStage',
    description: 'A travel stage that has to be walked',
    interfaces: [ TravelStageInterface ],
    isTypeOf: e => e.transportationType == 0, // fixme, use enum somehow

    fields: () => ({
        // from TravelStageInterface:
        departureTime: {
            type: new GraphQLNonNull(GraphQLString)
        },
        arrivalTime: {
            type: new GraphQLNonNull(GraphQLString)            
        },
        travelTimeMins: {
            type: new GraphQLNonNull(GraphQLInt)
        },
        transportationType: {
            type: new GraphQLNonNull(TransportationType)
        },
        // own:

        // arrival point and departure point

    })
})


const TransitTravelStage = new GraphQLObjectType({
    name: 'TransitTravelStage',
    description: 'A stage of a travel proposal',
    interfaces: [ TravelStageInterface ],
    isTypeOf: e => e.transportationType != 0, // fixme, use enum somehow

    fields: () => ({
        // from TravelStageInterface:
        departureTime: {
            type: new GraphQLNonNull(GraphQLString)
        },
        arrivalTime: {
            type: new GraphQLNonNull(GraphQLString)            
        },
        travelTimeMins: {
            type: new GraphQLNonNull(GraphQLInt)
        },
        transportationType: {
            type: new GraphQLNonNull(TransportationType)
        },

        // own:
        // line: {
        //     type: new GraphQLNonNull(Line)
        // },
        destinationName: {
            type: new GraphQLNonNull(GraphQLString)
        },
        lineName: {
            type: new GraphQLNonNull(GraphQLString)
        },
        color: {
            type: new GraphQLNonNull(GraphQLString)
        },
        departureStop: {
            type: new GraphQLNonNull(Stop)
        },
        arrivalStop: {
            type: new GraphQLNonNull(Stop)
        },
        line: {
            type: new GraphQLNonNull(Line),
            resolve: ({line}) => lineInfo(line)
        }

    })
});






function ensureUtmInHybridPosition(pos) {
    if (pos.x && pos.y) {
        return pos
    }
    else if (pos.lat && pos.lng) {
        const {easting, northing} = fromLatLon(pos.lat, pos.lng)
        pos.x = parseInt(easting);
        pos.y = parseInt(northing);
        return pos
    }
    else {
        throw new Error("bad invariant. Need either x and y or lat and lng on a HybridPosition")
    }
}

export const schema = new GraphQLSchema({
    query: new GraphQLObjectType({
        name: 'Query',
        fields: {
            serverVersion: {
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
                    },
                    type: {
                        name: 'type',
                        type: new GraphQLList(PlaceType)
                    }
                    // add counties and type
                },
                resolve: (root, {name, type}) => {
                    let p = placesForName(name);
                    if (type) {
                        p = p.then(e => e.filter(y => type.indexOf(y.placeType) != -1));
                    }
                    return p;
                }
            },

            pointStops: {
                type: new GraphQLList(Stop),
                args: {
                    location: {
                        name: "location",
                        type: new GraphQLNonNull(HybridLocationInput)
                    },
                    maxDistance: {
                        names: "maxDistance",
                        type: GraphQLInt
                    }
                    // proposals as well?
                },
                resolve: (root, {location}) => {
                    ensureUtmInHybridPosition(location);
                    return closestStops(location.x, location.y)
                }
            },

            areaStops: {
                type: new GraphQLList(Stop),
                args: {
                    sw: {
                        name: "sw",
                        type: new GraphQLNonNull(HybridLocationInput)
                    },
                    ne: {
                        name: "ne",
                        type: new GraphQLNonNull(HybridLocationInput)
                    },
                },
                resolve: (root, {sw, ne}) => {
                    ensureUtmInHybridPosition(sw);
                    ensureUtmInHybridPosition(ne);
                    return areaStops(sw, ne)
                }
            },

            travelPlanner: {
                type: new GraphQLList(TravelProposal),
                // args: {
                //     sw: {
                //         name: "sw",
                //         type: new GraphQLNonNull(HybridLocationInput)
                //     },
                //     ne: {
                //         name: "ne",
                //         type: new GraphQLNonNull(HybridLocationInput)
                //     },
                // },
                resolve: (root, {sw, ne}) => {
                    return getTravelPlan();
                }
            }

        },



    })
});

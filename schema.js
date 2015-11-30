import {
    GraphQLBoolean,
    GraphQLEnumType,
    GraphQLFloat,
    GraphQLID,
    GraphQLInputObjectType,
    GraphQLInt,
    GraphQLInterfaceType,
    GraphQLList,
    GraphQLNonNull,
    GraphQLObjectType,
    GraphQLSchema,
    GraphQLString,
    GraphQLUnionType,
} from 'graphql';

import {
    resolveStopInfo,
    resolveLineInfo,
    resolveStopsForLine,
    resolveLinesForStop,
    resolveStopVisits,
    resolveUniqueDeviations,
    resolveStreetHouses,
    resolveVisitsToDestinations,
    resolvePlatformsFromVisits,
    resolveClosestStops,
    resolveAreaStops,
    resolveGetTravelPlan,
    resolvePlacesForName
} from './resolvers'

// todo: use custom scalars for color and transporttime, maybe date?
// new type for geolocations?

const GeoLocationInput = new GraphQLInputObjectType({
    name: 'GeoLocationInput',
    description: 'A location in lat/lon format',
    fields: {
        lat: { type: new GraphQLNonNull(GraphQLFloat) },
        lng: { type: new GraphQLNonNull(GraphQLFloat) },
    }
});


const UtmLocationInput = new GraphQLInputObjectType({
    name: 'UtmLocationInput',
    description: 'A location in UTM32 format',
    fields: {
        x: { type: new GraphQLNonNull(GraphQLFloat) },
        y: { type: new GraphQLNonNull(GraphQLFloat) },
    }
});


const LocationInput = new GraphQLInputObjectType({
    name: 'LocationInput',
    description: 'A location in either lat/lon or UTM32 format. Note no safety that either is present!',
    fields: {
        geoLocation: { type: GeoLocationInput },
        utmLocation: { type: UtmLocationInput },
    }
});


const StopIdInput = new GraphQLInputObjectType({
    name: 'StopIdInput',
    description: "id of a stop",
    fields: {
        id: { type: GraphQLID }
    }
});


const AreaIdInput = new GraphQLInputObjectType({
    name: 'AreaIdInput',
    description: "id of an area",
    fields: {
        id: { type: GraphQLID }
    }
});


const PlannerLocationInput = new GraphQLInputObjectType({
    name: "PlannerLocationInput",
    fields: {
        geo: {
            type: GeoLocationInput
        },
        utm: {
            type: UtmLocationInput
        },
        stop: {
            type: StopIdInput
        },
        area: {
            type: AreaIdInput
        }
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


const UTMLocation = new GraphQLObjectType({
    name: 'UTMLocation',
    description: 'Location in UTM 32 format',
    fields: {
        x: {
            type: GraphQLInt,
            description: 'Northing'
        },
        y: {
            type: GraphQLInt,
            description: 'Easting'
        }
    }
});


const Line = new GraphQLObjectType({
    name: 'Line',
    description: 'A public transportation line',
    fields: () => ({
        id: {
            type: GraphQLID,
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
            resolve: ({id}, args, source) => resolveStopsForLine(id)
        }
    }),
    interfaces: [ ]
});


const Deviation = new GraphQLObjectType({
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


const Stop = new GraphQLObjectType({
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


const NearbyStop = new GraphQLObjectType({
    name: 'NearbyStop',
    description: 'A record of a stop within walking distance of a POI or address',
    fields: () => ({
        // fields for PlaceInterface
        walkingTimeMins: {
            type: new GraphQLNonNull(GraphQLInt),
        },
        stop: {
            type: new GraphQLNonNull(Stop),
        }
    })
});


const POI = new GraphQLObjectType({
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


const Area = new GraphQLObjectType({
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


const House = new GraphQLObjectType({
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


const Street = new GraphQLObjectType({
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


const RealtimeDestination = new GraphQLObjectType({
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
            resolve: ({visits}) => resolveVisitsToDestinations(visits)
        },
        deviations: {
            type: new GraphQLList(Deviation),
            resolve: ({visits}) => resolveUniqueDeviations(visits)
        }
    })
});


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
            resolve: ({stopId}) => resolveStopInfo(stopId)
        },
        line: {
            type: new GraphQLNonNull(Line),
            resolve: ({lineId}) => resolveLineInfo(lineId)
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
            type: new GraphQLList(TravelStageInterface)
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
        arrivalGeoLocation: {
            type: new GraphQLNonNull(GeoLocation)
        },

        arrivalUtmLocation: {
            type: new GraphQLNonNull(UTMLocation)
        },

        departureGeoLocation: {
            type: new GraphQLNonNull(GeoLocation)
        },

        departureUtmLocation: {
            type: new GraphQLNonNull(UTMLocation)
        }

    })
});


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
            resolve: ({line}) => resolveLineInfo(line)
        }
    })
});


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
                    id: { name: 'id', type: GraphQLID }
                },
                resolve: (_, {id}, __) => resolveStopInfo(id)
            },
            line: {
                type: Line,
                args: {
                    id: { name: 'id', type: GraphQLID }
                },
                resolve: (root, {id}, source) => resolveLineInfo(id)
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
                resolve: (root, {name, type}) => resolvePlacesForName(name, type)
            },

            pointStops: {
                type: new GraphQLList(Stop),
                args: {
                    location: {
                        name: "location",
                        type: new GraphQLNonNull(LocationInput)
                    },
                    maxDistance: {
                        names: "maxDistance",
                        type: GraphQLInt
                    }
                    // proposals as well?
                },
                resolve: (root, {location}) => resolveClosestStops(location) // fixme: add a validation function here?
            },

            areaStops: {
                type: new GraphQLList(Stop),
                args: {
                    sw: {
                        name: "sw",
                        type: new GraphQLNonNull(LocationInput)
                    },
                    ne: {
                        name: "ne",
                        type: new GraphQLNonNull(LocationInput)
                    },
                },
                resolve: (root, {sw, ne}) => resolveAreaStops(sw, ne)
            },

            travelPlanner: {
                type: new GraphQLList(TravelProposal),
                args: {
                    origin: {
                        type: new GraphQLNonNull(PlannerLocationInput)
                    },
                    destination: {
                        type: new GraphQLNonNull(PlannerLocationInput)
                    }
                },
                resolve: (root, {origin, destination}) => {
                    return resolveGetTravelPlan(origin, destination);
                }
            }
        },

    })
});

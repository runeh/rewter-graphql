import {
    GraphQLEnumType,
    GraphQLFloat,
    GraphQLID,
    GraphQLInt,
    GraphQLList,
    GraphQLNonNull,
    GraphQLObjectType,
    GraphQLString,
} from 'graphql';


import {
    Stop
} from './place'


import {
    resolveStopsForLine
} from '../resolvers'


export const TransportationType = new GraphQLEnumType({
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


export const GeoLocation = new GraphQLObjectType({
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


export const UTMLocation = new GraphQLObjectType({
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


export const Line = new GraphQLObjectType({
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
    })
});


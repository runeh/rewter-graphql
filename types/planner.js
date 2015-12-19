import {
    GraphQLInt,
    GraphQLInterfaceType,
    GraphQLList,
    GraphQLNonNull,
    GraphQLObjectType,
    GraphQLString,
} from 'graphql';


import {
    Stop
} from './place';


import {
    TransportationType,
    UTMLocation,
    GeoLocation,
    Line
} from './core'


import {
    resolveLineInfo
} from '../resolvers'


export const TravelProposal = new GraphQLObjectType({
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


const TravelStageImpl = {
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
}


export const TravelStageInterface = new GraphQLInterfaceType({
    name: 'TravelStageInterface',
    description: 'A stage of a travel proposal',
    fields: () => ({
        ...TravelStageImpl
    })
});


export const WalkingTravelStage = new GraphQLObjectType({
    name: 'WalkingTravelStage',
    description: 'A travel stage that has to be walked',
    interfaces: [ TravelStageInterface ],
    isTypeOf: e => e.transportationType == 0, // fixme, use enum somehow

    fields: () => ({
        ...TravelStageImpl,

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


export const TransitTravelStage = new GraphQLObjectType({
    name: 'TransitTravelStage',
    description: 'A stage of a travel proposal',
    interfaces: [ TravelStageInterface ],
    isTypeOf: e => e.transportationType != 0, // fixme, use enum somehow

    fields: () => ({
        ...TravelStageImpl,

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

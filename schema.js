import {
    GraphQLID,
    GraphQLInt,
    GraphQLList,
    GraphQLNonNull,
    GraphQLObjectType,
    GraphQLSchema,
    GraphQLString,
} from 'graphql';

import {
    resolveAreaStops,
    resolveClosestStops,
    resolveGetTravelPlan,
    resolveLineInfo,
    resolvePlacesForName,
    resolveStopInfo,
} from './resolvers'


import {
    Line,
} from './types/core'

import {
    PlaceInterface,
    PlaceType,
    Stop,
} from './types/place'

import {
    LocationInput,
    PlannerLocationInput
} from './types/input'

import {
    TravelProposal,
} from './types/planner'

// todo: use custom scalars for color and transporttime, maybe date?
// new type for geolocations?


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
            
            //todo : echo the search term back?
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


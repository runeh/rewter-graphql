import {
    GraphQLFloat,
    GraphQLID,
    GraphQLInputObjectType,
    GraphQLNonNull,
} from 'graphql';


import {
    LatLngImpl,
    UTMImpl
} from './core.js';

export const GeoLocationInput = new GraphQLInputObjectType({
    name: 'GeoLocationInput',
    description: 'A location in lat/lng format',
    fields: {
        ...LatLngImpl
    }
});


export const UtmLocationInput = new GraphQLInputObjectType({
    name: 'UtmLocationInput',
    description: 'A location in UTM32 format',
    fields: {
        ...UTMImpl

    }
});


export const LocationInput = new GraphQLInputObjectType({
    name: 'LocationInput',
    description: 'A location in either lat/lon or UTM32 format. Note no safety that either is present!',
    fields: {
        geoLocation: { type: GeoLocationInput },
        utmLocation: { type: UtmLocationInput },
    }
});


export const StopIdInput = new GraphQLInputObjectType({
    name: 'StopIdInput',
    description: "id of a stop",
    fields: {
        id: { type: GraphQLID }
    }
});


export const AreaIdInput = new GraphQLInputObjectType({
    name: 'AreaIdInput',
    description: "id of an area",
    fields: {
        id: { type: GraphQLID }
    }
});


export const PlannerLocationInput = new GraphQLInputObjectType({
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

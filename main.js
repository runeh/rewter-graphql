
import {graphql} from 'graphql';
import {schema} from './schema';
import {stopInfo, lineInfo} from './ruter-fetcher';
import express from 'express';
import graphqlHTTP from 'express-graphql';

 var query = `
        query IntrospectionTypeQuery {
          __schema {
            types {
              name
            }
          }
        }
      `;

// graphql(schema, query).then(e => {
//     console.log(JSON.stringify(e, null, 4))

// })

// console.log("slsls")
// stopInfo("3010050").then(console.log).catch(console.log)
// getStopsByLineId("18").then(console.log).catch(console.log)
// var graphqlHTTP = require('express-graphql');

const app = express();
app.use('/graphql', graphqlHTTP({ schema: schema, graphiql: true }));

app.listen(3011)

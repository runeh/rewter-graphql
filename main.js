import {graphql} from 'graphql';
import {schema} from './schema';
import express from 'express';
import graphqlHTTP from 'express-graphql';

const app = express();
app.set('port', (process.env.PORT || 3011));
app.use('/', graphqlHTTP({
	schema: schema,
	graphiql: true,
	formatError: error => error
}));

app.listen(app.get('port'), function() {
    console.log('rewter is running on port', app.get('port'));
});

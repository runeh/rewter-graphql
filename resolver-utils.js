
/**
 * @param {function} resolver resolving function
 * @param {Array.<string>} paths 'paths' into 
 */
export function resolveWithArgs(resolver, contextPaths, rootPaths, argPaths) {
    return function(root, args, context) {
        const funArgs = R.unnest([
            pathsToValues(contextPaths, context),
            pathsToValues(rootPaths, root),
            pathsToValues(argPaths, args)
        ]);
        return fun.call(null, funArgs);
    }
}

function resolveWith(resolver, rootPaths, argPaths) {
    return resolveWithArgs(fun, [], rootPaths, argPaths);
}

function resolveWithFetcher(resolver, fetcherName, rootPaths, argPaths) {
    return resolveWithArgs(resolver, [`fetchers.${fetcherName}`], rootPaths, argPaths);
}

function pathsToValues(paths, map) {
    paths = paths || [];
    return paths
        .map(R.split('.'))
        .map(R.path(R.__, map));    
}
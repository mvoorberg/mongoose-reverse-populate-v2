'use strict';
const debug = require('debug')('mongoose-reverse-populate-v2');
const { keyBy, checkRequired, buildQuery, populateResult } = require('./lib/populateUtils');

function reversePopulate(opts, cb) {
    // Check required fields have been provided
    try {
        checkRequired(opts);
    } catch (err) {
        return cb(err);
    }

    // If empty array passed, there's nothing to do!
    if (opts.modelArray.length === 0) {
		debug('Array is empty, nothing to do.');
        return cb(null, opts.modelArray);
    }

    // Transform the model array for easy lookups
    const modelIndex = keyBy(opts.modelArray, '_id');
    const popResult = populateResult.bind(this, opts.storeWhere, opts.arrayPop);
	const query = buildQuery(opts);

    debug(`Executing query for reverse-populate.`);
    query.exec(function(err, results) {
        if (err) {
            debug(`Reverse-populate query failed:`, err.errmsg);
            return cb(err);
        }
        // Map over results (models to be populated)
		debug(`Populating ${results.length} results on ${opts.modelArray.length} items.`);
        results.forEach((result) => {
            const resultIds = result[opts.idField];
			const resultArray = resultIds instanceof Array ? resultIds : [resultIds];
            resultArray.map(resultId => {
                const match = modelIndex[resultId];
                // If match found, populate the result inside the match
                if (match) {
                    popResult(match, result);
                }
            });
        });
		debug(`Finished populating items.`);
        cb(null, opts.modelArray);
    });
}

module.exports = reversePopulate;

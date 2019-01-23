'use strict';
const assert = require('assert');
const debug = require('debug')('mongoose-reverse-populate-v2');

module.exports = (function populateUtils() {
    // Return an Object where the array items are keyed by the value of the named key field.
    const keyBy = function(array, key) {
        const reducer = (result, next) => {
            result[next[key]] = next;
            return result;
        };
        return array.reduce(reducer, {});
    };

    // Compare two mongoose objects using _id
    const idMatch = function(obj1, obj2) {
        const compare = obj1._id.equals(obj2._id);
        assert(compare);
    };

    // Return an array of just the stringified _ids.
    const pluckIds = function(array) {
        return array.map(obj => obj._id.toString());
    };

    // Compare an array of mongoose objects
    const idsMatch = function(arr1, arr2) {
        assert.equal(arr1.length, arr2.length);
        const arr1IDs = pluckIds(arr1);
        const arr2IDs = pluckIds(arr2);
        const diff = arr1IDs.filter(x => !arr2IDs.includes(x));
        assert.equal(diff.length, 0);
    };

    // Create some random strings for testing
    const rando = function() {
        return Math.floor(Math.random() * (1 << 24)).toString(16);
    };
    
    // Check all mandatory fields have been provided
    const checkRequired = function(opts) {
        const requiredFields = [
            'modelArray',
            'storeWhere',
            'arrayPop',
            'mongooseModel',
            'idField'
        ];
        requiredFields.forEach(fieldName => {
            if (opts[fieldName] == null) {
                throw new Error(`Missing mandatory field '${fieldName}'.`);
            }
        });
    };

    // Ensure the select option always includes the required id field to populate the relationship
    const getSelectString = function(selectStr, requiredId) {
        const selected = selectStr.split(' ');
        if (!selected.includes(requiredId)) {
            debug(`Adding ${requiredId} to the select list.`);
            return selectStr + ' ' + requiredId;
        }
        return selectStr;
    };

    // Build the query string with user provided options
    const buildQuery = function(options) {
        const conditions = options.filters || {};
        const ids = options.modelArray.map(m => m._id);
        conditions[options.idField] = { $in: ids };

        const query = options.mongooseModel.find(conditions);
        if (options.select) {
            const select = getSelectString(options.select, options.idField);
            query.select(select);
        }
        if (options.populate) {
            query.populate(options.populate);
        }
        if (options.sort) {
            query.sort(options.sort);
        }
        if (options.lean) {
            query.lean();
        }
        return query;
    };

    // Populate the result against the match
    const populateResult = function(storeWhere, arrayPop, match, result) {
        // If this is a one to many relationship
        if (arrayPop) {
            // Check if array exists, if not create one
            if (typeof match[storeWhere] === 'undefined')
                match[storeWhere] = [];
            // Push the result into the array
            match[storeWhere].push(result);
        } else {
            // This is a one to one relationship
            // Save the results
            match[storeWhere] = result;
        }
    };

    return {
        keyBy,
        idMatch,
        pluckIds,
        idsMatch,
        rando, 
        checkRequired,
        getSelectString,
        buildQuery,
        populateResult
    };
})();

/**
 *  file: localForageKeys.js
 * 
 *  localForageKeys.js holds the database key names for each part of the system.
 *  However, the system (through exports) only has access to each database.
 */

let localForageKeys;
if (!localForageKeys) {
    localForageKeys = {};
}

// Default Database Name
// localForageKeys.db = 'Axcenddb';

// Saved Stacks
localForageKeys.savedStacks = exports.savedStacks = 'savedStacks';
// Saved Methods
localForageKeys.savedMethods = exports.savedMethods = 'savedMethods';
// Saved Data
localForageKeys.savedData = exports.savedData = 'savedData';

// Database Suffix
localForageKeys.suffix = exports.suffix = '_db';



let localforage = require('../../lib/localforage');

for (let [, value] of Object.entries(localForageKeys)) {
    exports[value + localForageKeys.suffix] = localforage.createInstance({
        name: value
    });
}
exports[localForageKeys.savedStacks + localForageKeys.suffix].keys().then(function (keys) {
    // An array of all the key names.
//    console.log('savedStacks keys', keys);
}).catch(function (err) {
    // This code runs if there were any errors
    console.log(err);
});
exports[localForageKeys.savedMethods + localForageKeys.suffix].keys().then(function (keys) {
    // An array of all the key names.
//    console.log('savedMethods keys', keys);
}).catch(function (err) {
    // This code runs if there were any errors
    console.log(err);
});
exports[localForageKeys.savedData + localForageKeys.suffix].keys().then(function (keys) {
    // An array of all the key names.
//    console.log('savedData keys', keys);
}).catch(function (err) {
    // This code runs if there were any errors
    console.log(err);
});

/**
 * This is  proof of concept.
 * 
 * Since localForage works asynchronously,
 *  we used the wait code to grab the data
 *  from the databases after 1 second
 */
if (false) {
    const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
    for (let [, value] of Object.entries(localForageKeys)) {
        exports[value].setItem(value, 'MyBigAwesomeValue', function (err) {
            if (err) {
                console.log('set', value, 'err', err);
            }
            // if err is non-null, we got an error
            // localforage.getItem(localForageKeys.savedStacks, function (err, readValue) {
            //     // if err is non-null, we got an error. otherwise, value is the value
            //     console.log('Read: ', readValue);
            // });
        });
        setTimeout(() => {
//            console.log('reading fromm', value);
            exports[value].getItem(value, function (err, readValue) {
                if (err) {
                    console.log('err', err);
                }
                // if err is non-null, we got an error. otherwise, value is the value
//                console.log('Read: ', readValue);
            });
        }, 1000);


    }
}

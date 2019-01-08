let mergeSortByEnyoJSModelObjectProperty = module.exports = function (data, COLUMN_NAME, ASC = true) {
    /**
     * function: mergeSortByEnyoJSModelObjectProperty
     * 
     * This is an EnyoJS Model variation of the Merge Sort Algorithm.
    */
    // Split arrays in half recursively
    let mergeSort = function (arr) {
        if (arr.length < 2) { return arr; }

        let middle = Math.floor(arr.length / 2);
        let left = arr.slice(0, middle);
        let right = arr.slice(middle);

        return merge(mergeSort(left), mergeSort(right));
    };
    // Compare and return cocatenation of results
    let merge = function (left, right) {
        var result = [];
        let indexLeft = 0;
        let indexRight = 0;

        if (ASC) {
            while (indexLeft < left.length && indexRight < right.length) {
                if (left[indexLeft].get(COLUMN_NAME) <= right[indexRight].get(COLUMN_NAME)) {
                    result.push(left[indexLeft]);
                    indexLeft++;
                } else {
                    result.push(right[indexRight]);
                    indexRight++;
                }
            }
        } else {
            while (indexLeft < left.length && indexRight < right.length) {
                if (left[indexLeft].get(COLUMN_NAME) >= right[indexRight].get(COLUMN_NAME)) {
                    result.push(left[indexLeft]);
                    indexLeft++;
                } else {
                    result.push(right[indexRight]);
                    indexRight++;
                }
            }
        }
        return result.concat(left.slice(indexLeft)).concat(right.slice(indexRight));
    };

    return mergeSort(data);
}


function subdivideBy(arr, n){
const groups = [];

  while(arr.length) {
    const groupSize = Math.ceil(arr.length / n--);
    const group = arr.slice(0, groupSize);
    groups.push(group);
    arr = arr.slice(groupSize);
  }
  return groups;
}

function findMedian(arr){
	var median = 0, len = arr.length;
	arr.sort(); 

	if (len % 2 === 0){
		median = (arr[len / 2 - 1] + arr[len / 2]) / 2;
	} else {
		median = arr[(len - 1) / 2];
	}
	return median; 
}

function kthSmallest(arr, l, r, k){
	var pivot = arr[end];
	var left = l;
	var right = r;
	while (true){
		while (arr[left] < pivot && left < right){
			left++;
		}
		while (arr[right] >= pivot && right > left){
			right--;
		}
		if (left == right) {
			break;
		}
		swap(arr, left, right);
	}
	swap(arr, left , l);

	if (k == left + 1){
		return pivot;
	} else if (k < left + 1){
		return kthSmallest(arr, l, left - 1, k);
	} else {
		return kthSmallest(arr, left + 1, r, k);
	}
}

function swap(arr,i,j) {
    var temp = arr[i];
    arr[i] = arr[j];
    arr[j]= temp;
}

 function partition(arr, pivot, left, right){
   var pivotValue = arr[pivot],
       partitionIndex = left;
   for(var i = left; i < right; i++){
    if(arr[i] < pivotValue){
      swap(arr, i, partitionIndex);
      partitionIndex++;
    }
  }
  swap(arr, right, partitionIndex);
  return partitionIndex;
}


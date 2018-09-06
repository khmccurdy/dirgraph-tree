function arraySum(a1, a2){
    return a1.map((d,i)=>d+a2[i])
}

Object.equals = function( x, y ) {
    if ( x === y ) return true;  
    if ( ! ( x instanceof Object ) || ! ( y instanceof Object ) ) return false;
    if ( x.constructor !== y.constructor ) return false;
  
    for ( var p in x ) {
      if ( ! x.hasOwnProperty( p ) ) continue;
      if ( ! y.hasOwnProperty( p ) ) return false;
      if ( x[ p ] === y[ p ] ) continue;
      if ( typeof( x[ p ] ) !== "object" ) return false;
      if ( ! Object.equals( x[ p ],  y[ p ] ) ) return false;
    }
  
    for ( p in y ) {
      if ( y.hasOwnProperty( p ) && ! x.hasOwnProperty( p ) ) return false;
    }
    return true;
}

Object.clone = function (obj) {
    if (typeof obj != "object") return obj;
    if (obj.constructor == Array){
        var clone = [];
    } else {
        var clone = {};
    }
    
    for(var i in obj) {
        if(obj[i] != null && typeof(obj[i])=="object")
            clone[i] = Object.clone(obj[i]);
        else
            clone[i] = obj[i];
    }
    return clone;
}

Object.includesObj = function(obj, element){
    for (var i in obj){
        if (Object.equals(obj[i], element)){
            return true;
        }
    }
    return false;
}

Array.includesObj = function(array, element) {
    return array.some(d=>Object.equals(d, element));
}

Array.indexOfObj = function(array, element){
    for (var i=0; i<array.length; i++){
        if (Object.equals(element, array[i])) return i;
    }
    return -1;
}
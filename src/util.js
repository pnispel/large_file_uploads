const Util = {
  extend (dest, source) {
    for (var k in source) {
        if (source.hasOwnProperty(k)) {
            var value = source[k];
            if (dest.hasOwnProperty(k) && typeof dest[k] === "object" &&
                typeof value === "object") {

                extend(dest[k], value);
            } else {
                dest[k] = value;
            }
        }
    }

    return dest;
  }
}

export default Util

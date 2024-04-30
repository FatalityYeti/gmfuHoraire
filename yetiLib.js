const yetiLib = {
  downloadAsJSON: (data, filename, prettyprint = false) => {
    const downloaddata = encodeURI('data:text/json;charset=utf-8,' + JSON.stringify({
      data
    }, null, prettyprint ? 2 : undefined));
    const link = document.createElement('a');
    link.setAttribute('href', downloaddata);
    link.setAttribute('download', filename);
    link.click();
    link.remove();
  },
  uploadJSON: () => {
    return new Promise((resolve, reject) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.onchange = () => {
        let file = Array.from(input.files)[0];
        let fr = new FileReader();
        fr.onloadend = function(e) {
          resolve(JSON.parse(e.target.result).data);
        }
        fr.onerror = function(e) {
          reject(e);
        };
        fr.readAsText(file)
      };
    input.click();
    });
  },
  clone: (source) => {
    if (Object.prototype.toString.call(source) === '[object Array]') {
        var clone = [];
        for (var i=0; i<source.length; i++) {
            clone[i] = yetiLib.clone(source[i]);
        }
        return clone;
    } else if (typeof(source)=="object") {
        var clone = {};
        for (var prop in source) {
            if (source.hasOwnProperty(prop)) {
                clone[prop] = yetiLib.clone(source[prop]);
            }
        }
        return clone;
    } else {
        return source;
    }
}

}
Object.defineProperty(Object.prototype, 'objmap', {
  value: function(cb) { return Object.keys(this).map((key, i) => {return cb(this[key], key, i)}); }
});
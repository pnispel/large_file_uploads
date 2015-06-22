(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.Uploader = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
// (c) copyright unscriptable.com / John Hann
// License MIT
// For more robust promises, see https://github.com/briancavalier/when.js.

'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});
function Promise() {
  this._thens = [];
}

Promise.all = function (promises) {
  var p = new Promise();
  var size = promises.length;
  var returned = 0;
  var returns = [];

  promises.forEach(function (promise) {
    promise.then((function (promise) {
      return function () {
        returned++;

        returns.push(arguments);

        if (returned === size) {
          p.resolve(returns);
        }
      };
    })(promise));
  });

  setTimeout((function (size) {
    return function () {
      if (size === 0) {
        p.resolve();
      }
    };
  })(size));

  return p;
};

Promise.prototype = {

  /* This is the "front end" API. */

  // then(onResolve, onReject): Code waiting for this promise uses the
  // then() method to be notified when the promise is complete. There
  // are two completion callbacks: onReject and onResolve. A more
  // robust promise implementation will also have an onProgress handler.
  then: function then(onResolve, onReject) {
    // capture calls to then()
    this._thens.push({ resolve: onResolve, reject: onReject });
  },

  // Some promise implementations also have a cancel() front end API that
  // calls all of the onReject() callbacks (aka a "cancelable promise").
  // cancel: function (reason) {},

  /* This is the "back end" API. */

  // resolve(resolvedValue): The resolve() method is called when a promise
  // is resolved (duh). The resolved value (if any) is passed by the resolver
  // to this method. All waiting onResolve callbacks are called
  // and any future ones are, too, each being passed the resolved value.
  resolve: function resolve(val) {
    this._complete('resolve', val);
  },

  // reject(exception): The reject() method is called when a promise cannot
  // be resolved. Typically, you'd pass an exception as the single parameter,
  // but any other argument, including none at all, is acceptable.
  // All waiting and all future onReject callbacks are called when reject()
  // is called and are passed the exception parameter.
  reject: function reject(ex) {
    this._complete('reject', ex);
  },

  // Some promises may have a progress handler. The back end API to signal a
  // progress "event" has a single parameter. The contents of this parameter
  // could be just about anything and is specific to your implementation.
  // progress: function (data) {},

  /* "Private" methods. */

  _complete: function _complete(which, arg) {
    // switch over to sync then()
    this.then = which === 'resolve' ? function (resolve, reject) {
      resolve && resolve(arg);
    } : function (resolve, reject) {
      reject && reject(arg);
    };
    // disallow multiple calls to resolve or reject
    this.resolve = this.reject = function () {
      throw new Error('Promise already completed.');
    };
    // complete all waiting (async) then()s
    var aThen,
        i = 0;
    while (aThen = this._thens[i++]) {
      aThen[which] && aThen[which](arg);
    }
    delete this._thens;
  }

};

exports['default'] = Promise;
module.exports = exports['default'];

},{}],2:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _libPromise = require("../lib/promise");

var _libPromise2 = _interopRequireDefault(_libPromise);

var _util = require("./util");

var _util2 = _interopRequireDefault(_util);

// source: http://creativejs.com/tutorials/advanced-uploading-techniques-part-1/

/* -------------------------------------------------------------------------- */

var FileUploader = (function () {
  function FileUploader(file, options) {
    _classCallCheck(this, FileUploader);

    this.file = file;

    this.options = _util2["default"].extend({
      url: "/upload",
      chunk_size: 100 * 1024 // 100 KB
    }, options);

    this.file_size = file.size;

    this.range_start = 0;
    this.range_end = this.options.chunk_size;

    if ("mozSlice" in this.file) {
      this.slice_method = "mozSlice";
    } else if ("webkitSlice" in this.file) {
      this.slice_method = "webkitSlice";
    } else {
      this.slice_method = "slice";
    }

    this.upload_request = new XMLHttpRequest();
    this.upload_request.onload = this.__onChunkComplete.bind(this);

    this.is_paused = false;
    this.__upload();
  }

  _createClass(FileUploader, [{
    key: "__onUploadComplete",
    value: function __onUploadComplete() {
      console.log("upload complete");
    }
  }, {
    key: "__upload",
    value: function __upload() {
      var chunk = undefined;

      if (this.range_end > this.file_size) {
        this.range_end = this.file_size;
      }

      chunk = this.file[this.slice_method](this.range_start, this.range_end);

      this.upload_request.open("POST", this.options.url, true);
      this.upload_request.overrideMimeType("application/octet-stream");

      if (this.range_start !== 0) {
        this.upload_request.setRequestHeader("Content-Range", "bytes " + this.range_start + "-" + this.range_end + "/" + this.file_size);
      }

      this.upload_request.send(chunk);
    }
  }, {
    key: "__onChunkComplete",
    value: function __onChunkComplete() {
      if (this.range_end >= this.file_size) {
        this.__onUploadComplete();
        return;
      }

      this.range_start = this.range_end;
      this.range_end = this.range_start + this.options.chunk_size;

      if (!this.is_paused) {
        this.__upload();
      }
    }
  }]);

  return FileUploader;
})();

/* -------------------------------------------------------------------------- */

exports["default"] = FileUploader;
module.exports = exports["default"];

},{"../lib/promise":1,"./util":4}],3:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var _libPromise = require("../lib/promise");

var _libPromise2 = _interopRequireDefault(_libPromise);

var _file_uploader = require("./file_uploader");

var _file_uploader2 = _interopRequireDefault(_file_uploader);

var _util = require("./util");

var _util2 = _interopRequireDefault(_util);

/* -------------------------------------------------------------------------- */

var Uploader = {
  __inputs: {},
  __uploads: [],

  watch: function watch(fileInput, key) {
    var self = this;

    var handleFiles = (function (key) {
      return function () {
        var fileList = this.files;

        if (fileList.length) {
          self.__inputs[key] = fileList;
        }
      };
    })(key);

    this.__inputs[key] = [];

    fileInput.addEventListener("change", handleFiles, false);
  },

  remove: function remove(key) {},

  startUpload: function startUpload(key) {
    var files = this.__inputs[key];

    for (var i = 0; i < files.length; i++) {
      var file = files[i];

      this.__uploads.push(new _file_uploader2["default"](file));
    }
  }
};

/* -------------------------------------------------------------------------- */

exports["default"] = Uploader;
module.exports = exports["default"];

},{"../lib/promise":1,"./file_uploader":2,"./util":4}],4:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
var Util = {
    extend: (function (_extend) {
        function extend(_x, _x2) {
            return _extend.apply(this, arguments);
        }

        extend.toString = function () {
            return _extend.toString();
        };

        return extend;
    })(function (dest, source) {
        for (var k in source) {
            if (source.hasOwnProperty(k)) {
                var value = source[k];
                if (dest.hasOwnProperty(k) && typeof dest[k] === "object" && typeof value === "object") {

                    extend(dest[k], value);
                } else {
                    dest[k] = value;
                }
            }
        }

        return dest;
    })
};

exports["default"] = Util;
module.exports = exports["default"];

},{}]},{},[3])(3)
});


//# sourceMappingURL=build.js.map
(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.Cache = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
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

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var _libPromise = require("../lib/promise");

var _libPromise2 = _interopRequireDefault(_libPromise);

var _indexeddb = require("./indexeddb");

var _indexeddb2 = _interopRequireDefault(_indexeddb);

/* -------------------------------------------------------------------------- */

var Cache = {
  /**
   * set a cache item in indexeddb
   *
   * @param {String} key - a unique identifier for this blob
   * @param {Blob} blob - the blob of data to be inserted
   * @param {Integer} minutes_to_removal - time until removal from cache
   */
  set: function set(key, blob) {
    var minutes_to_removal = arguments[2] === undefined ? 60 : arguments[2];

    var now = Date.now();
    var millisecondsToRemoval = minutes_to_removal * 60 * 1000;

    _indexeddb2["default"].addLedgerItem(key, {
      timeInserted: now,
      removalDate: now + millisecondsToRemoval,
      blobId: key
    });

    _indexeddb2["default"].addBlobItem(key, blob);
  },

  /**
   * remove a cached item from indexeddb
   *
   * @param {String} key - a unique identifier for this blob
   */
  remove: function remove(key) {
    _indexeddb2["default"].removeBlobItem(key);
    _indexeddb2["default"].removeLedgerItem(key);
  },

  /**
   * update a cached item"s blob / redirects to Cache.set
   *
   * @param {String} key - a unique identifier for this blob
   * @param {Blob} blob - the blob of data to be inserted
   * @param {Integer} minutes_to_removal - time until removal from cache
   */
  update: function update(key, blob, minutes_to_removal) {
    return this.set.apply(this, arguments);
  },

  /**
   * retrieve an item from the cache
   *
   * @param {String} key - a unique identifier for this blob
   */
  get: function get(key) {
    var promise = _indexeddb2["default"].getBlobItem(key);

    return promise;
  },

  __error: function __error(err) {}
};

/* -------------------------------------------------------------------------- */

_indexeddb2["default"].db.then(function (db) {
  console.log("cache init");
});

/* -------------------------------------------------------------------------- */

exports["default"] = Cache;
module.exports = exports["default"];

},{"../lib/promise":1,"./indexeddb":3}],3:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var _libPromise = require("../lib/promise");

var _libPromise2 = _interopRequireDefault(_libPromise);

/* -------------------------------------------------------------------------- */

window.indexedDB = window.indexedDB || window.webkitIndexedDB || window.mozIndexedDB || window.OIndexedDB || window.msIndexedDB;

window.IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction || window.OIDBTransaction || window.msIDBTransaction;

var dbVersion = 1;
var request = indexedDB.open("indexdb_cache", dbVersion);

request.onsuccess = _onsuccess;
request.onupgradeneeded = _onupgradeneeded;

/* -------------------------------------------------------------------------- */

function _onsuccess(event) {
  var db = request.result;

  db.onerror = _onerror;

  if (db.setVersion) {
    if (db.version != dbVersion) {
      var setVersion = db.setVersion(dbVersion);

      setVersion.onsuccess = function () {
        _createObjectStore(db);
      };
    }
  } else {
    _initialize(db);
  }
}

function _onerror(err) {
  console.error("Database Error", err, err.stack);
}

function _onupgradeneeded(event) {
  _createObjectStore(event.target.result);
}

function _removeOldCacheItems(db) {
  var promise = new _libPromise2["default"]();
  var trans = db.transaction("ledger", IDBTransaction.READ_ONLY);
  var ledgerStore = trans.objectStore("ledger");
  var itemsToBeDeleted = [];
  var deletedItemsPromises = [];

  trans.oncomplete = function () {
    if (itemsToBeDeleted.length) {
      itemsToBeDeleted.forEach(function (item) {
        var ledgerPromise = IDB.removeLedgerItem(item.blobId);
        var blobPromise = IDB.removeBlobItem(item.blobId);

        deletedItemsPromises.push(ledgerPromise);
        deletedItemsPromises.push(blobPromise);
      });

      _libPromise2["default"].all(deletedItemsPromises).then(function () {
        promise.resolve();
      });
    } else {
      promise.resolve();
    }
  };

  var cursorRequest = ledgerStore.openCursor();

  cursorRequest.onerror = _onerror;

  cursorRequest.onsuccess = function (event) {
    var cursor = event.target.result;

    if (cursor) {
      var element = cursor.value;
      var removalDate = element.removalDate;

      if (removalDate < Date.now()) {
        itemsToBeDeleted.push(cursor.value);
      }

      cursor["continue"]();
    }
  };

  return promise;
}

function _initialize(db) {
  // sneaky set the _db without triggering promise saying were ready
  IDB._db = db;

  _removeOldCacheItems(db).then(function () {
    IDB.db = db;
  });
}

function _createObjectStore(db) {
  var blobStore = db.createObjectStore("blobs");
  var ledgerStore = db.createObjectStore("ledger");
}

/* -------------------------------------------------------------------------- */

var IDB = Object.defineProperties({
  _readyPromise: new _libPromise2["default"](),

  addLedgerItem: function addLedgerItem(key, params) {
    var promise = new _libPromise2["default"]();
    var transaction = this._db.transaction(["ledger"], "readwrite");

    var objectStore = transaction.objectStore("ledger");
    var request = objectStore.put(params, key);

    request.onsuccess = function () {
      promise.resolve(true);
    };

    request.onerror = function (err) {
      promise.reject(err);
    };

    return promise;
  },

  addBlobItem: function addBlobItem(key, blob) {
    var promise = new _libPromise2["default"]();
    var transaction = this._db.transaction(["blobs"], "readwrite");

    var objectStore = transaction.objectStore("blobs");
    var request = objectStore.put(blob, key);

    request.onsuccess = function () {
      promise.resolve(true);
    };

    request.onerror = function (err) {
      promise.reject(err);
    };

    return promise;
  },

  removeLedgerItem: function removeLedgerItem(key) {
    var promise = new _libPromise2["default"]();
    var transaction = this._db.transaction(["ledger"], "readwrite");

    var objectStore = transaction.objectStore("ledger");
    var request = objectStore["delete"](key);

    request.onsuccess = (function (promise) {
      return function () {
        promise.resolve(true);
      };
    })(promise);

    request.onerror = function (err) {
      promise.reject(err);
    };

    return promise;
  },

  removeBlobItem: function removeBlobItem(key) {
    var promise = new _libPromise2["default"]();
    var transaction = this._db.transaction(["blobs"], "readwrite");

    var objectStore = transaction.objectStore("blobs");
    var request = objectStore["delete"](key);

    request.onsuccess = (function (promise) {
      return function () {
        promise.resolve(true);
      };
    })(promise);

    request.onerror = function (err) {
      promise.reject(err);
    };

    return promise;
  },

  getBlobItem: function getBlobItem(key) {
    var promise = new _libPromise2["default"]();
    var transaction = this._db.transaction(["blobs"], IDBTransaction.READ);

    var objectStore = transaction.objectStore("blobs");
    var request = objectStore.get(key);

    request.onsuccess = function () {
      promise.resolve(request.result);
    };

    request.onerror = function (err) {
      promise.reject(err);
    };

    return promise;
  },

  getLedgerItem: function getLedgerItem(key) {
    var promise = new _libPromise2["default"]();
    var transaction = this._db.transaction(["ledger"], IDBTransaction.READ);

    var objectStore = transaction.objectStore("ledger");
    var request = objectStore.get(key);

    request.onsuccess = function () {
      promise.resolve(request.result);
    };

    request.onerror = function (err) {
      promise.reject(err);
    };

    return promise;
  }
}, {
  db: {
    get: function () {
      var _this = this;

      this._readyPromise = new _libPromise2["default"]();

      setTimeout(function (v) {
        if (_this._db) {
          _this._readyPromise.resolve(_this._db);
          _this._readyPromise = null;
        }
      });

      return this._readyPromise;
    },
    set: function (obj) {
      this._db = obj;

      if (this._readyPromise === null) return;

      this._readyPromise.resolve(this._db);
      this._readyPromise = null;
    },
    configurable: true,
    enumerable: true
  }
});

/* -------------------------------------------------------------------------- */

exports["default"] = IDB;
module.exports = exports["default"];

},{"../lib/promise":1}]},{},[2])(2)
});


//# sourceMappingURL=build.js.map
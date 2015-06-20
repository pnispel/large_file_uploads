import Promise from "../lib/promise";

/* -------------------------------------------------------------------------- */

window.indexedDB = window.indexedDB || window.webkitIndexedDB ||
                   window.mozIndexedDB || window.OIndexedDB ||
                   window.msIndexedDB;

window.IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction ||
                        window.OIDBTransaction || window.msIDBTransaction;

const dbVersion = 1;
const request = indexedDB.open("indexdb_cache", dbVersion);

request.onsuccess = _onsuccess;
request.onupgradeneeded = _onupgradeneeded;

/* -------------------------------------------------------------------------- */

function _onsuccess (event) {
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

function _onerror (err) {
  console.error("Database Error", err, err.stack);
}

function _onupgradeneeded (event) {
  _createObjectStore(event.target.result);
}

function _removeOldCacheItems (db) {
  var promise = new Promise();
  var trans = db.transaction("ledger", IDBTransaction.READ_ONLY);
  var ledgerStore = trans.objectStore("ledger");
  var itemsToBeDeleted = [];
  var deletedItemsPromises = [];

  trans.oncomplete = function () {
    if (itemsToBeDeleted.length) {
      itemsToBeDeleted.forEach(function (item) {
        let ledgerPromise = IDB.removeLedgerItem(item.blobId);
        let blobPromise = IDB.removeBlobItem(item.blobId);

        deletedItemsPromises.push(ledgerPromise);
        deletedItemsPromises.push(blobPromise);
      });

      Promise.all(deletedItemsPromises).then(function () {
        promise.resolve();
      });
    } else {
      promise.resolve();
    }
  };

  var cursorRequest = ledgerStore.openCursor();

  cursorRequest.onerror = _onerror;

  cursorRequest.onsuccess = function(event) {
    var cursor = event.target.result;

    if (cursor) {
      var element = cursor.value;
      var removalDate = element.removalDate;

      if (removalDate < Date.now()) {
        itemsToBeDeleted.push(cursor.value);
      }

      cursor.continue();
    }
  };

  return promise;
}

function _initialize (db) {
  // sneaky set the _db without triggering promise saying were ready
  IDB._db = db;

  _removeOldCacheItems(db).then(function () {
    IDB.db = db;
  });
}

function _createObjectStore (db) {
  let blobStore = db.createObjectStore("blobs");
  let ledgerStore = db.createObjectStore("ledger");
}

/* -------------------------------------------------------------------------- */

const IDB = {
  _readyPromise: new Promise(),

  get db () {
    this._readyPromise = new Promise();

    setTimeout(v => {
      if (this._db) {
        this._readyPromise.resolve(this._db);
        this._readyPromise = null;
      }
    });

    return this._readyPromise;
  },

  set db (obj) {
    this._db = obj;

    if (this._readyPromise === null) return;

    this._readyPromise.resolve(this._db);
    this._readyPromise = null;
  },

  addLedgerItem (key, params) {
    var promise = new Promise();
    var transaction = this._db.transaction(["ledger"],
        "readwrite");

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

  addBlobItem (key, blob) {
    var promise = new Promise();
    var transaction = this._db.transaction(["blobs"],
        "readwrite");

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

  removeLedgerItem (key) {
    var promise = new Promise();
    var transaction = this._db.transaction(["ledger"],
        "readwrite");

    var objectStore = transaction.objectStore("ledger");
    var request = objectStore.delete(key);

    request.onsuccess = (function (promise) {
      return function () {
        promise.resolve(true);
      }
    })(promise);

    request.onerror = function (err) {
      promise.reject(err);
    };

    return promise;
  },

  removeBlobItem (key) {
    var promise = new Promise();
    var transaction = this._db.transaction(["blobs"],
        "readwrite");

    var objectStore = transaction.objectStore("blobs");
    var request = objectStore.delete(key);

    request.onsuccess = (function (promise) {
      return function () {
        promise.resolve(true);
      }
    })(promise);

    request.onerror = function (err) {
      promise.reject(err);
    };

    return promise;
  },

  getBlobItem (key) {
    var promise = new Promise();
    var transaction = this._db.transaction(["blobs"],
        IDBTransaction.READ);

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

  getLedgerItem (key) {
    var promise = new Promise();
    var transaction = this._db.transaction(["ledger"],
        IDBTransaction.READ);

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
};

/* -------------------------------------------------------------------------- */

export default IDB;

import Promise from "../lib/promise";
import IDB from "./indexeddb";

/* -------------------------------------------------------------------------- */

const Cache = {
  /**
   * set a cache item in indexeddb
   *
   * @param {String} key - a unique identifier for this blob
   * @param {Blob} blob - the blob of data to be inserted
   * @param {Integer} minutes_to_removal - time until removal from cache
   */
  set (key, blob, minutes_to_removal=60) {
    let now = Date.now();
    let millisecondsToRemoval = minutes_to_removal * 60 * 1000;

    IDB.addLedgerItem(key, {
      timeInserted: now,
      removalDate: now + millisecondsToRemoval,
      blobId: key
    });

    IDB.addBlobItem(key, blob);
  },

  /**
   * remove a cached item from indexeddb
   *
   * @param {String} key - a unique identifier for this blob
   */
  remove (key) {
    IDB.removeBlobItem(key);
    IDB.removeLedgerItem(key);
  },

  /**
   * update a cached item"s blob / redirects to Cache.set
   *
   * @param {String} key - a unique identifier for this blob
   * @param {Blob} blob - the blob of data to be inserted
   * @param {Integer} minutes_to_removal - time until removal from cache
   */
  update (key, blob, minutes_to_removal) {
    return this.set.apply(this, arguments);
  },

  /**
   * retrieve an item from the cache
   *
   * @param {String} key - a unique identifier for this blob
   */
  get (key) {
    var promise = IDB.getBlobItem(key);

    return promise;
  },

  __error (err) {

  },
};

/* -------------------------------------------------------------------------- */

IDB.db.then(function (db) {
  console.log('cache init');
});

/* -------------------------------------------------------------------------- */

export default Cache;

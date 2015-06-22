import Promise from "../lib/promise";
import Util from "./util";

// source: http://creativejs.com/tutorials/advanced-uploading-techniques-part-1/

/* -------------------------------------------------------------------------- */

class FileUploader {
  constructor(file, options) {
    this.file = file;

    this.options = Util.extend({
      url: "/upload",
      chunk_size: (100 * 1024) // 100 KB
    }, options);

    this.file_size = file.size;

    this.range_start = 0;
    this.range_end = this.options.chunk_size;

    if ("mozSlice" in this.file) {
        this.slice_method = "mozSlice";
    }
    else if ("webkitSlice" in this.file) {
        this.slice_method = "webkitSlice";
    }
    else {
        this.slice_method = "slice";
    }

    this.upload_request = new XMLHttpRequest();
    this.upload_request.onload = this.__onChunkComplete.bind(this);

    this.is_paused = false;
    this.__upload();
  }

  __onUploadComplete () {
    console.log('upload complete');
  }

  __upload () {
    let chunk;

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

  __onChunkComplete () {
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
}

/* -------------------------------------------------------------------------- */

export default FileUploader

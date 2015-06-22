import Promise from "../lib/promise";
import FileUploader from "./file_uploader";
import Util from "./util";

/* -------------------------------------------------------------------------- */

const Uploader = {
  __inputs: {},
  __uploads: [],

  watch: function (fileInput, key) {
    let self = this;

    let handleFiles = (function (key) {
      return function () {
        let fileList = this.files;

        if (fileList.length) {
          self.__inputs[key] = fileList;
        }
      };
    })(key);

    this.__inputs[key] = [];

    fileInput.addEventListener("change", handleFiles, false);
  },

  remove: function (key) {

  },

  startUpload: function (key) {
    let files = this.__inputs[key];

    for (var i = 0; i < files.length; i++) {
      let file = files[i];

      this.__uploads.push(new FileUploader(file));
    }
  }
};

/* -------------------------------------------------------------------------- */

export default Uploader;

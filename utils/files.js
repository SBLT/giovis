const patterns = {
  images: /image-*/,
};

export function FileReaderByFormat(obj, formats) {
  return new Promise(function (resolve, reject) {
    const pattern = patterns[formats];
    let file;

    // Obj type
    const obj_is_a_file = obj instanceof File;
    const obj_is_an_event = obj?.target;

    if (obj_is_a_file) file = obj;
    else if (obj_is_an_event) file = obj.target?.files[0];
    else file = obj?.files[0]; // Obj is a component

    if (!file) reject({ code: "file-not-found", message: "File not found" });
    if (!formats) {
      reject({
        code: "formats-not-specified",
        message:
          "file.reader(obj, formats) \nNo mention of accepted file formats :(",
      });
    }
    if (!pattern) {
      reject({
        code: "pattern-not-found",
        message:
          "Please make sure that the formats indicated are on the patterns",
      });
    }
    if (!file.type.match(pattern)) {
      reject({
        code: "file-format-not-accepted",
        message: "The selected file format is not accepted",
      });
    }

    const fileReader = new FileReader();
    fileReader.readAsDataURL(file);
    fileReader.onload = function () {
      resolve({ file: file, url: fileReader.result });
    };
  });
}

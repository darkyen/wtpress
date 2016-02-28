import DZip from 'decompress-zip';
import Promise from 'bluebird';

DZip.prototype.extractFiles = function (files, options, results) {
    results = results || [];
    return Promise.all(files
        .filter(Boolean)
        .map((file, index) => this.extractFile(file, options)
          .then((result) => {
            this.emit('progress', index, files.length);
            return result;
          })
        ));
};

export default function unzip(archivePath, openedPath){
  return new Promise((resolve, reject) => {
    var unzipper = new DZip(archivePath);
    unzipper.on('error', reject);
    unzipper.on('extract', resolve);
    unzipper.extract({
      path: openedPath,
      strip: 1
    });
  });
}

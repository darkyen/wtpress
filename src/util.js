import rimraf from 'rimraf';
import Promise from 'bluebird';
import fs from 'fs';
import mkdirp from 'mkdirp';
const rimrafAsync  = Promise.promisify(rimraf);
const mkdirpAsync = Promise.promisify(mkdirp);
Promise.promisifyAll(fs);

export function pathExists(fp){
  var fn = typeof fs.access === 'function' ? fs.access : fs.stat;
	return new Promise(function (resolve) {
		fn(fp, function (err) {
			resolve(!err);
		});
	});
}

export {rimrafAsync};
export {mkdirpAsync};
export {fs};

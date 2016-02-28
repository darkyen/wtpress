import request from 'request';
import Promise from 'bluebird';
import fs from 'fs';

export default function download(fromUrl, toPath, token = ''){
  return new Promise((resolve, reject) => {
    request
      .get(fromUrl, {
        headers: {
          'User-Agent': 'WTPress'
        },
        'auth': {
          'bearer': token
        }
      })
      .on('error', reject)
      .on('response', function(response){
        const status = response.statusCode;
        if( status !== 200 ){
          reject('Request failed');
        }
      })
      .pipe(fs.createWriteStream(toPath, { flags: 'w+' }))
      .on('finish', e => resolve(toPath));
  });
}

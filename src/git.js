// Copyright Abhishek Hingnikar
// Allows you to use github api using
// your familiar git commands <3
import uuid from 'uuid';
import os from 'os';
import path from 'path';
import request from 'request-promise';
import download from './download';
import {fs} from './util';
import unzip from './unzip';

const API_URL = 'https://api.github.com';
const gh = request.defaults({
  baseUrl: API_URL,
  headers: {
    'Accepts': 'application/vnd.github.v3+json'
  }
})

export async function clone(repoPath, clonePath, token){
  const tempArchPath = path.join(os.tmpdir(), 'arch-' + uuid.v4() + '.zip');
  console.log("Cloned", tempArchPath);
  const url          = `${API_URL}/repos/${repoPath}/zipball/master`;
  await download(url, tempArchPath, token);
  await unzip(tempArchPath, clonePath);
  await fs.unlinkAsync(tempArchPath);
}

export async function commit(repoPath, files, token){
  const url = `${API_URL}/repos/${repoPath}/`;
}

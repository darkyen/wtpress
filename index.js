'use latest'; // thanks @geoff
import consolidate from 'consolidate';
import Promise from 'bluebird';
import Express from 'express';
import os from 'os';
import uuid from 'uuid';
import path from 'path';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import marked from 'marked';
import uniq from 'lodash/array/uniq';
import {fs, mkdirpAsync, rimrafAsync, pathExists} from './src/util';
import {clone} from './src/git';

dotenv.config();
const osTmp = os.tmpdir();
// As taught by benji
const noop = () => {};
const nextTick = () => Promise.try(noop);
const getTempDir = () => path.join(osTmp, uuid.v4());

const app = Express();

app.use(bodyParser.json());

// Provide a tempDir
app.use(async (req, res, next) => {
  const tempDir = getTempDir();
  req.tempDir   = tempDir;
  // req.on('end', e => rimrafAsync(tempDir));
  console.log("Got request");

  ['bundle', 'repo'].forEach((w)=> {
    req[`${w}Dir`] = path.join(tempDir, w);
  });
  const dirs = [req.tempDir, req.bundleDir, req.repoDir];
  await Promise.map(dirs, dir => fs.mkdirAsync(dir));
  console.log("Next");
  next();
});

async function buildArticle(engine, repoDir, article, blog){
  const articleSrc      = path.join(repoDir, blog.articlePath, article.src);
  const templateSrc     = path.join(repoDir, blog.templatePath, article.template);
  const content         = marked(await fs.readFileAsync(articleSrc, 'utf8'));
  const articleKeywords = uniq(
    article.keywords.split(','),
    blog.keywords.split(',')
  );
  const articleDesc     = article.desc || desc;
  const definition      = {
    desc    : article.desc || blog.desc,
    keywords: articleKeywords,
    articles: blog.articles,
    content : content,
  };
  return await consolidate[engine](templateSrc, definition);
}

async function buildAll(engine, bundleDir, repoDir){
  const blogJsonPath = path.join(repoDir, 'blog.json');

  if( !(await pathExists(blogJsonPath)) ){
    throw new Error('No blog.json');
  }

  const blog = JSON.parse(await fs.readFileAsync(blogJsonPath));
  if( !blog.title || !blog.keywords || !blog.desc || !blog.articles){
    throw new Error('blog.json must have title, keywords, desc, articles');
  }

  return await Promise.map(blog.articles, async (article) => {
    const buff       = await buildArticle(engine, repoDir, article, blog);
    const postDir = path.join(bundleDir, 'posts', article.url);
    await mkdirpAsync(postDir);
    const postFilePath = path.join(postDir, 'index.html');
    return fs.writeFileAsync(postFilePath, buff);
  });
}


if(true || process.env.DEBUG === true ){

  app.get('/test/:engine', async function(req, res){
    const {bundleDir, repoDir, query, params} = req;
    const {engine} = params;
    const {src} = query;
    console.log("Bundleing files", repoDir);
    try{
      await clone(src, repoDir, process.env.GHSECRET);
      // await buildAll(engine, bundleDir, src);
    }catch(e){
      return res.json({ status: 500, message: e.message, stack: e.stack });
    }
    res.json({
      status: 200,
      message: "Ok"
    });
  });

  app.listen(4000);

}else {
  // This fires on push, this engine
  // thing is actually here cause there
  // was no other way to configure it
  // except for a git push
  app.post('/build/:engine/', function(req, res){
    const {tempDir, body, params} = req;
    const {commits, repository, head_commit} = body;
    const {engine} = params;
    // removed - removed, updated - added + updated.
    // only render the things since changed.
    const changes = {removed: [], updated: []};
    commits.reduce((changed, commit) => {
      const {added, updated, removed} = commit;
      changed.removed.concat(removed);
      changed.updated.concat(updated, added);
      return changed;
    }, changes);

  });

  const WebTask = require('webtask-tools');
  module.exports = WebTask.fromExpress(app);
}

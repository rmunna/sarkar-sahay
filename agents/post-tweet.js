#!/usr/bin/env node
/**
 * post-tweet.js — Post a tweet for CitizenNest
 * 
 * Usage:
 *   node agents/post-tweet.js "Your tweet text here"
 *   node agents/post-tweet.js --update <slug>   (auto-generates tweet from update file)
 *   node agents/post-tweet.js --guide <slug>    (auto-generates tweet from guide file)
 */

const { TwitterApi } = require('twitter-api-v2');
const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

// Load env
const envPath = path.join(__dirname, '../../.twitter-keys.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  line = line.trim();
  if (!line || line.startsWith('#')) return;
  const [key, ...rest] = line.split('=');
  env[key.trim()] = rest.join('=').trim();
});

const client = new TwitterApi({
  appKey: env.TWITTER_CONSUMER_KEY,
  appSecret: env.TWITTER_CONSUMER_SECRET,
  accessToken: env.TWITTER_ACCESS_TOKEN,
  accessSecret: env.TWITTER_ACCESS_SECRET,
});

const SITE_URL = 'https://www.citizennest.com';

function generateUpdateTweet(slug) {
  const filePath = path.join(__dirname, '../content/updates', `${slug}.md`);
  if (!fs.existsSync(filePath)) {
    console.error(`Update file not found: ${filePath}`);
    process.exit(1);
  }
  const { data } = matter(fs.readFileSync(filePath, 'utf8'));
  const title = data.title || slug;
  const url = `${SITE_URL}/update/${slug}`;
  
  let tweet = `📢 ${title}\n\n`;
  if (data.vacancies) tweet += `📊 ${data.vacancies} vacancies\n`;
  if (data.lastDate) tweet += `📅 Last date: ${data.lastDate}\n`;
  tweet += `\n🔗 ${url}\n\n#SarkariNaukri #GovtJobs #CitizenNest`;
  
  return tweet.substring(0, 280);
}

function generateGuideTweet(slug) {
  const filePath = path.join(__dirname, '../content/guides', `${slug}.md`);
  if (!fs.existsSync(filePath)) {
    console.error(`Guide file not found: ${filePath}`);
    process.exit(1);
  }
  const { data } = matter(fs.readFileSync(filePath, 'utf8'));
  const title = data.title || slug;
  const url = `${SITE_URL}/guide/${slug}`;
  const desc = data.description || '';
  
  let tweet = `📋 ${title}\n\n${desc}\n\n🔗 ${url}\n\n#GovtServices #India #CitizenNest`;
  
  return tweet.substring(0, 280);
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.error('Usage: node post-tweet.js "text" | --update <slug> | --guide <slug>');
    process.exit(1);
  }
  
  let tweetText;
  
  if (args[0] === '--update' && args[1]) {
    tweetText = generateUpdateTweet(args[1]);
  } else if (args[0] === '--guide' && args[1]) {
    tweetText = generateGuideTweet(args[1]);
  } else {
    tweetText = args.join(' ');
  }
  
  console.log('Posting tweet:');
  console.log('---');
  console.log(tweetText);
  console.log('---');
  console.log(`Length: ${tweetText.length}/280`);
  
  try {
    const result = await client.v2.tweet(tweetText);
    console.log(`✅ Tweet posted! ID: ${result.data.id}`);
    console.log(`🔗 https://x.com/i/web/status/${result.data.id}`);
  } catch (err) {
    console.error('❌ Failed to post tweet:', err.message);
    if (err.data) console.error('Details:', JSON.stringify(err.data, null, 2));
    process.exit(1);
  }
}

main();

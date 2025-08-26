const puppeteer = require('puppeteer');
const assert = require('assert');

const SITE_URL = process.env.SITE_URL || 'http://localhost:3000';

describe('Footer blog link', function() {
  this.timeout(10000);
  it('should exist and return status 200/301', async () => {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto(SITE_URL, { waitUntil: 'domcontentloaded' });
    const blogHref = await page.$eval('footer a[href*="blog"]', a => a.href).catch(() => null);
    assert.ok(blogHref, 'Footer blog link missing');
    const res = await page.evaluate(async url => {
      const resp = await fetch(url, { method: 'HEAD', redirect: 'follow' });
      return { status: resp.status, url: resp.url };
    }, blogHref);
    assert.ok(res.status === 200 || res.status === 301 || res.status === 302, `Blog link not reachable: ${res.status}`);
    await browser.close();
  });
});
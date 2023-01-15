// puppeteer-extra is a drop-in replacement for puppeteer, 
// it augments the installed puppeteer with plugin functionality 
const puppeteer = require('puppeteer-extra') 
const { GetAccessToken, sendCard} = require('./api')
// add stealth plugin and use defaults (all evasion techniques) 
const StealthPlugin = require('puppeteer-extra-plugin-stealth') 
puppeteer.use(StealthPlugin()) 
 
const {executablePath} = require('puppeteer')
const querystring = require('querystring');
const { parsepage } = require('./helpers')
 
// puppeteer usage as normal 
puppeteer.launch({ headless: true, executablePath: executablePath(), args: [`--window-size=1900,1000`] }).then(async browser => { 
	const page = await browser.newPage() 
    await GetAccessToken(page);
	await page.goto('https://www.mediamarkt.es/')
    const [deny] = await page.$x('//*[@id="pwa-consent-layer-form"]/div[2]/button[1]')
    if (deny) {
        await deny.click();
    }
    let selector = '#mms-app-header-category-button';
    await page.evaluate((selector) => document.querySelector(selector).click(), selector);
    const a = await page.$x('/html/body/div[1]/div[2]/div/div/div/div/nav/div/ul[1]/li/a')
    const Infohref = await a[1].getProperty('href');
    const InfohrefTxt = await Infohref.jsonValue();
    await page.goto(InfohrefTxt)
    const a1 = await page.$x('//*[@id="main-content"]/div[1]/div[1]/div[2]/div[1]/div[1]/div/div/div[2]/a')
    const Porthref = await a1[0].getProperty('href');
    const PorthrefTxt = await Porthref.jsonValue();
    await page.goto(PorthrefTxt)

    const categ = await page.$x('/html/body/div[1]/div[3]/main/div[1]/div[1]/div/div[1]/div/section/div[2]/div/div/ul/li/a')

    const categhref = await categ[2].getProperty('href');
    const categhrefTxt = await categhref.jsonValue();

    const categhref1 = await categ[5].getProperty('href');
    const categhrefTxt1 = await categhref1.jsonValue();

    await page.goto(categhrefTxt)
    await parsepage(page);
    console.log("=====================");
    await page.goto(categhrefTxt1)
    await parsepage(page);
	await browser.close();
})

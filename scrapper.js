// puppeteer-extra is a drop-in replacement for puppeteer, 
// it augments the installed puppeteer with plugin functionality 
const puppeteer = require('puppeteer-extra') 
 
// add stealth plugin and use defaults (all evasion techniques) 
const StealthPlugin = require('puppeteer-extra-plugin-stealth') 
puppeteer.use(StealthPlugin()) 
 
const {executablePath} = require('puppeteer')
const querystring = require('querystring');

const n = 100;
access_token = "";
const body = {
    "username": "test4@mail.com",
    "password": "test"
}

const Token_Url = `http://localhost:5000/auth/login`;
const Post_Card = `http://localhost:5000/cards/createCard`;


async function parsepage (page, link) {
    let categ = await page.$$('#main-content > div.StyledPageContent-sc-1x4mhgt-0.kWcQCK > div.StyledGrid-fs0zc2-0.hnyHws > div > div.StyledCell-sc-1wk5bje-0.inOEaY > div.ProductContainer-hvvgwa-1.etmelA > div > div')
    const urls = []
    const availibilties = [];
    if (categ.length < n) {
        await Promise.all([
            page.click('#main-content > div.StyledPageContent-sc-1x4mhgt-0.kWcQCK > div.StyledGrid-fs0zc2-0.hnyHws > div > div.StyledCell-sc-1wk5bje-0.inOEaY > div > button'),
            page.waitForNavigation({waitUntil: 'networkidle0'}),
        ]);
        categ = await page.$$('#main-content > div.StyledPageContent-sc-1x4mhgt-0.kWcQCK > div.StyledGrid-fs0zc2-0.hnyHws > div > div.StyledCell-sc-1wk5bje-0.inOEaY > div.ProductContainer-hvvgwa-1.etmelA > div > div')
    }

    for (let i = 0; i < categ.length; i++) {
        // get url
        const url = await categ[i].$('div > a');
        const urljson = await url.getProperty('href');
        const texturl = await urljson.jsonValue();
        urls.push(texturl);
        // get availibilties
        let textavailibilty = "unavailable"
        const availibilty = await categ[i].$('.StyledAvailabilityHeadingWrapper-sc-901vi5-2 > span > span');
        if (availibilty) {
            const availibiltyjson = await availibilty.getProperty('innerText');
            textavailibilty = await availibiltyjson.jsonValue();
        }
        availibilties.push(textavailibilty);
    }

    for(let i = 0 ; i < urls.length ; i++) {
        console.log("i : ", i)
        await page.goto(urls[i]);
        const url = urls[i];
        const availability = availibilties[i];
        // get img url
        const [img] = await page.$x('/html/body/div/div/main/div/div/div/div/div/div/div/div/div/div/ul/li/div/picture/img');
        const jsonimgurl = await img.getProperty('src');
        const imageurl = await jsonimgurl.jsonValue();
        // get title
        const [title] = await page.$x('/html/body/div/div/main/div/div/div/div/div/h1');
        const jsontitle = await title.getProperty('innerText');
        const name = await jsontitle.jsonValue();
        // // get brand
        const [brandE] = await page.$x('/html/body/div/div/main/div/div/div/div/div/div/span/a/span');
        let brand = "no brand available"
        if (brand) {
            const jsonbrand = await brandE.getProperty('innerText');
            brand = await jsonbrand.jsonValue();
        }
        // // get price
        const [priceE] = await page.$$('.WholePrice-sc-1r6586o-7');
        const jsonprice = await priceE.getProperty('innerText');
        const price = await jsonprice.jsonValue();
        // get specifications
        const specifications = [];
        const rows = await page.$$('#features-content .StyledTable-sc-1lcy5op-0:first-child tbody tr')
        for (let index = 0; index < rows.length; index++) {
            const row = rows[index];
            const key = await row.$eval('td:nth-of-type(1)', element => element.textContent);
            const value = await row.$eval('td:nth-of-type(2)', element => element.textContent)
            specifications.push({key, value});
        }
        // get delivery
        const [delivery] = await page.$$('div.StyledAvailabilityHeadingWrapper-sc-901vi5-2 > span');
        const jsondelivery = await delivery.getProperty('innerText');
        const textdelivery = await jsondelivery.jsonValue();
        const A_D = textdelivery.split(" ");
        const d = A_D[1].split("/");
        const d1 = A_D[3].split("/");
        var dateObject = new Date(d[2] + '/' + d[1] + '/' + d[0]);
        var dateObject1 = new Date(d1[2] + '/' + d1[1] + '/' + d1[0]);

        const difference = dateObject1.getTime() - dateObject.getTime();
        const deliveryTime = Math.ceil(difference / (1000 * 3600 * 24));
        // console.log({url, imageurl, name, brand, price, specifications, availability, deliveryTime});
        await sendCard(page, {url, imageurl, name, brand, price, specifications, availability, deliveryTime})
    }
}

async function GetAccessToken(page) {
    await page.setRequestInterception(true);
    page.once('request', request => {
        request.continue({
            method: 'POST',
            postData: JSON.stringify(body),
            headers: {
                ...request.headers,
                'Content-Type': 'application/json'
            }
        });
    });
    const response = await page.goto(Token_Url);
    const responseBody = await response.json()
    access_token = responseBody.access_token;
    await page.setRequestInterception(false);
}

async function sendCard(page, card) {
    await page.setRequestInterception(true);
    page.once('request', request => {
        request.continue({
            method: 'POST',
            postData: JSON.stringify(card),
            headers: {
                ...request.headers,
                'Content-Type': 'application/json',
                'Authorization': `Bearer ` + access_token,
            }
        });
    });
    const response = await page.goto(Post_Card);
    const responseBody = await response.json()
    console.log(responseBody);
    // access_token = responseBody.access_token;
    await page.setRequestInterception(false);
}
 
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
    await parsepage(page, categhrefTxt);
    console.log("=====================");
    await page.goto(categhrefTxt1)
    await parsepage(page, categhrefTxt1);
	await browser.close();
})

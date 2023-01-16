
const {sendCard} = require('./api')

const {items} = require('./config')

async function getText (elem, prop) {
    const jsonelem = await elem.getProperty(prop);
    const elemvalue = await jsonelem.jsonValue();
    return elemvalue;
}

async function check_length(categ, page) {
    if (categ.length < items) {
        await Promise.all([
            page.click('#main-content > div.StyledPageContent-sc-1x4mhgt-0.kWcQCK > div.StyledGrid-fs0zc2-0.hnyHws > div > div.StyledCell-sc-1wk5bje-0.inOEaY > div > button'),
            page.waitForNavigation({waitUntil: 'networkidle0'}),
        ]);
        categ = await page.$$('#main-content > div.StyledPageContent-sc-1x4mhgt-0.kWcQCK > div.StyledGrid-fs0zc2-0.hnyHws > div > div.StyledCell-sc-1wk5bje-0.inOEaY > div.ProductContainer-hvvgwa-1.etmelA > div > div')
    }
    return categ;
}

async function fill_urls_and_av(categ, urls, availibilties) {
    for (let i = 0; i < categ.length; i++) {
        // get url
        const url = await categ[i].$('div > a');
        const texturl = await getText(url ,'href');
        urls.push(texturl);
        // get availibilties
        let textavailibilty = "unavailable"
        const availibilty = await categ[i].$('.StyledAvailabilityHeadingWrapper-sc-901vi5-2 > span > span');
        if (availibilty)
            textavailibilty = await getText(availibilty, 'innerText')
        availibilties.push(textavailibilty);
    }
    return [urls, availibilties];
}

async function fill_specifications(specifications, page) {
    const rows = await page.$$('#features-content .StyledTable-sc-1lcy5op-0:first-child tbody tr')
    for (let index = 0; index < rows.length; index++) {
        const row = rows[index];
        const key = await row.$eval('td:nth-of-type(1)', element => element.textContent);
        const value = await row.$eval('td:nth-of-type(2)', element => element.textContent)
        specifications.push({key, value});
    }
}

async function get_deliveryTime(textdelivery) {
    const A_D = textdelivery.split(" ");
    const d = A_D[1].split("/");
    const d1 = A_D[3].split("/");
    var dateObject = new Date(d[2] + '/' + d[1] + '/' + d[0]);
    var dateObject1 = new Date(d1[2] + '/' + d1[1] + '/' + d1[0]);

    const difference = dateObject1.getTime() - dateObject.getTime();
    return Math.ceil(difference / (1000 * 3600 * 24));
}

async function parsepage (page) {
    let categ = await page.$$('#main-content > div.StyledPageContent-sc-1x4mhgt-0.kWcQCK > div.StyledGrid-fs0zc2-0.hnyHws > div > div.StyledCell-sc-1wk5bje-0.inOEaY > div.ProductContainer-hvvgwa-1.etmelA > div > div')
    let urls = []
    let availibilties = [];

    categ = await check_length(categ, page);

    [urls, availibilties] = await fill_urls_and_av(categ, urls, availibilties);

    for(let i = 0 ; i < urls.length ; i++) {
        await page.goto(urls[i]);
        const url = urls[i];
        const availability = availibilties[i];
        // get img url
        const [img] = await page.$x('/html/body/div/div/main/div/div/div/div/div/div/div/div/div/div/ul/li/div/picture/img');
        const imageurl = await getText(img, 'src');
        // get title
        const [title] = await page.$x('/html/body/div/div/main/div/div/div/div/div/h1');
        const name = await getText(title, 'innerText');
        // // get brand
        const [brandE] = await page.$x('/html/body/div/div/main/div/div/div/div/div/div/span/a/span');
        let brand = "no brand available"
        if (brand)
            brand = await getText(brandE, 'innerText');
        // // get price
        const [priceE] = await page.$$('.WholePrice-sc-1r6586o-7');
        const price = await getText(priceE, 'innerText');
        // get specifications
        const specifications = [];
        await fill_specifications(specifications, page)
        // get delivery
        const [delivery] = await page.$$('div.StyledAvailabilityHeadingWrapper-sc-901vi5-2 > span');
        const textdelivery = await getText(delivery, 'innerText');
        const deliveryTime = await get_deliveryTime(textdelivery)
        await sendCard(page, {url, imageurl, name, brand, price, specifications, availability, deliveryTime})
    }
}

module.exports = { parsepage }
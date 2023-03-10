
const {body, Token_Url, Post_Card} = require('./config')

let access_token = "";

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
    // console.log(responseBody);
    await page.setRequestInterception(false);
}

module.exports = { GetAccessToken, sendCard}
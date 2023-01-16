const body = {
    "username": "test4@mail.com",
    "password": "test"
}

const Token_Url = `http://localhost:5000/auth/login`;
const Post_Card = `http://localhost:5000/cards/createCard`;


const items = 100;

module.exports = { body, Token_Url, Post_Card, items}
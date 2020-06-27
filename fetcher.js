const { parsed: { BASE_URL: base_url, API_KEY: api_key, SHOP: shop } } = require('dotenv').config();
const axios = require('axios');
const fs = require('fs');
const languages = ['fr', 'en'];

const formatOptions = options =>
    Object.entries(options).map(arr => arr.join('=')).join('&');

const get = (path, options = {}) =>
    axios.get(`${ base_url }/${ path }?${ formatOptions({ ...options, api_key }) }`);

const getListings = async language =>
    (await get(`shops/${ shop }/listings/active`, { limit: 1000, includes: 'MainImage', language }))
    .data.results
    .sort((lhs, rhs) => (rhs.shop_section_id - lhs.shop_section_id) || (rhs.creation_tsz - lhs.creation_tsz))
    .map(listing => ({
        title: listing.title,
        url: listing.url,
        price: listing.price,
        currency: listing.currency_code,
        quantity: listing.quantity,
        image: {
            url: listing.MainImage.url_570xN,
            full: listing.MainImage.url_fullxfull
        }
    }));

const writeObjToFile = (file, obj) =>
    new Promise((resolve, reject) =>
        fs.writeFile(file, JSON.stringify(obj), err =>
            err ? reject(err) : resolve()));

const getImgs = async dir =>
    (await Promise.all(
        (await fs.promises.readdir(dir))
        .map(async img => ({
            name: img,
            stats: await fs.promises.stat(`${dir}/${img}`)
        }))))
    .sort((lhs, rhs) => rhs.stats.ctimeMs - lhs.stats.ctimeMs)
    .map(({ name }) => name);


Promise.all(
    languages.map(async language => {
        const listings = getListings(language);
        const imgs = getImgs('public/img');
        const translations = require(`./${language}.json`);
        return writeObjToFile(`data-${language}.json`, {
            language,
            languages,
            listings: await listings,
            imgs: (await imgs),
            translations
        });
    })
).catch(console.error);

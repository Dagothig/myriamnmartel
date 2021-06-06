const { parsed: { BASE_URL: base_url, API_KEY: api_key, SHOP: shop } } = require('dotenv').config();
const axios = require('axios');
const fs = require('fs');
const languages = ['fr', 'en'];

const formatOptions = options =>
    Object.entries(options).map(arr => arr.join('=')).join('&');

const get = async (path, options = {}) => {
    try {
        return (await axios.get(`${ base_url }/${ path }?${ formatOptions({ ...options, api_key }) }`))
            .data.results;
    } catch (err) {
        console.error(err);
    }
};

const getListings = async language =>
    (await get(`shops/${ shop }/listings/active`, { limit: 1000, includes: 'MainImage', language }))
    .sort((lhs, rhs) => rhs.creation_tsz - lhs.creation_tsz)
    .map(listing => ({
        title: listing.title,
        url: listing.url,
        price: listing.price,
        currency: listing.currency_code,
        quantity: listing.quantity,
        section_id: listing.shop_section_id,
        image: {
            url: listing.MainImage.url_570xN,
            full: listing.MainImage.url_fullxfull
        }
    }));

const getSections = async language =>
    (await get(`/shops/${ shop }/sections`, { language }))
    .sort((lhs, rhs) => rhs.rank - lhs.rank)
    .map(section => ({
        id: section.shop_section_id,
        title: section.title
    }));

const writeObjToFile = (file, obj) =>
    new Promise((resolve, reject) =>
        fs.writeFile(file, JSON.stringify(obj), err =>
            err ? reject(err) : resolve()));

const getImgs = async dir =>
    (await fs.promises.readdir(dir))
    .sort()
    .reverse();

const getFavicons = async dir =>
    (await fs.promises.readdir(dir))
    .filter(f => f.includes("favicon-"));

const getCatalog = async language => Object.fromEntries(
    (await fs.promises.readFile(`./catalogue-site-${ language }.csv`, { encoding: "utf8" }))
    .split("\n")
    .map(line => line.split(","))
    .filter(([name]) => name)
    .map(([name, ...info]) => [name, info]));

Promise.all(
    languages.map(async language => {
        const $sections = getSections(language);
        const $listings = getListings(language);
        const $imgs = getImgs('public/img');
        const $favicons = getFavicons('public');
        const $catalog = getCatalog(language);
        const translations = require(`./${language}.json`);

        const [sections, listings, catalog] = await Promise.all([$sections, $listings, $catalog]);

        return writeObjToFile(`data-${language}.json`, {
            language,
            languages,
            listings: sections
                .map(section => ({
                    id: section.id,
                    title: section.title,
                    listings: listings.filter(listing => listing.section_id === section.id)
                }))
                .filter(section => section.listings.length),
            imgs: (await $imgs),
            favicons: (await $favicons),
            translations,
            catalog
        });
    })
).catch(console.error);

import axios, {AxiosError} from 'axios';
import {JSDOM} from "jsdom";
import {readFile} from 'fs/promises';

const URL = "https://www.immobiliare.it/vendita-case/roma/" +
    "?criterio=rilevanza" +
    "&prezzoMassimo=500000" +
    "&superficieMinima=140" +
    "&idMZona[]=10259" +
    "&idQuartiere[]=10962" +
    "&idQuartiere[]=12721";
const PAGE_QUERY_PARAM = "&pag="; // max 25 results per page


function fetchPages(url: string) {
    let tot_pages = 4; // TODO: calculate
    let fetches = [...Array(tot_pages).keys()].map(i => fetchPage(url, i + 1));
    return Promise.all(fetches);
}

function fetchPage(url: string, page_num: number = 1): Promise<string | undefined> {
    return axios
        .get(getUrl(url, page_num))
        .then(res => res.data)
        .catch((error: AxiosError) => {
            console.error(`There was an error with ${error.config.url}.`);
            console.error(error.toJSON());
        });
}

function getUrl(url: string, page_num: number) {
    return `${URL}${PAGE_QUERY_PARAM}${page_num}`;
}

function readPage(path: string): Promise<string> {
    return readFile(path, {encoding: "utf8"})
}

interface Listing {
    title: string;
    listingId: string; // numeric
    price: string;
    // TODO: handle non numeric prices (discounted)
    isPriceStarting?: boolean; // asta | multiple
    units?: number;
}

function toListing(e: Element): Listing {
    let hyperlink = e.querySelector("a.in-card__title");

    let title = hyperlink.getAttribute("title");

    let listingId = hyperlink.getAttribute("href").match(/\d+/)[0];

    let isPriceStarting = false;

    let priceString = e.querySelector(".in-feat__item--main").textContent.trim();
    if (priceString.toLowerCase().includes("da")) {
        let isPriceStarting = true;
        priceString = priceString.replace(/da/i, "").trim()
        priceString = priceString.replace(",00", "");
    }
    let price = priceString;

    let unitsString = e.querySelector("div.in-unitsSummaryList__more")?.textContent;
    let unitsMatch = unitsString?.match(/\d+/)[0];
    let units = unitsMatch ? parseInt(unitsMatch) : 1;
    return {
        title,
        listingId,
        price,
        isPriceStarting,
        units,
    }
}

function getListings(html: string): Listing[] {
    let {window} = new JSDOM(html);
    let listing_selector = ".in-realEstateResults__item"
    let res = window.document.querySelectorAll(listing_selector);
    return Array.from(res).map(e => toListing(e));
}

function getExpected(page: string) {
    let {document} = new JSDOM(page).window;
    let title = document.querySelector(".in-searchList__title").textContent;
    return title.match(/\d+/)[0];
}

async function fetchAndConvert() {
    let pages = await fetchPages(URL);
    let expectedNum = getExpected(pages[0]);
    let listings = pages.flatMap(page => getListings(page));
    let unitsSum = listings.map(l => l.units).reduce((acc, v) => acc + v, 0);
    console.log(`Listings (actual: ${listings.length}, units: ${unitsSum}, expected: ${expectedNum})`)
    return listings;
}

function checkDuplicates(listings: Listing[]) {
    let listingIdsSet = new Set(listings.map(l => l.listingId));
    if (listings.length != listingIdsSet.size) {
        console.log(`Duplicate listing ids found! (${listings.length} - ${listingIdsSet.size})`)
    }

    let counts = listings.map(l => l.title).reduce((acc, curr) => {
        return acc[curr] ? ++acc[curr] : acc[curr] = 1, acc
    }, new Map<string, number>())
    counts.forEach((cnt, title, _) => {
        if (cnt > 1) {
            // TODO: fix not printing
            console.log(`${cnt} occurrences: "${title}"`);
        }
    })

    let listingTitlesSet = new Set(listings.map(l => l.title));
    if (listings.length != listingTitlesSet.size) {
        console.log(`Duplicate listing titles found! (${listings.length} - ${listingTitlesSet.size})`)
    }
}

async function run(test: boolean = false): Promise<Listing[]> {
    if (test) {
        let page = await readPage("data/immobiliare-test.html");
        let listings = getListings(page);
        console.log(`Listings (${listings.length}`);
        return listings
    }

    let listings = await fetchAndConvert();
    checkDuplicates(listings);
    // listings.forEach(l => console.log(l.price));
    return listings;
}

run()

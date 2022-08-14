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

function fetchPage(url: string): Promise<string | undefined> {
    return axios
        .get(url)
        .then(res => res.data)
        .catch((error: AxiosError) => {
            console.error(`There was an error with ${error.config.url}.`);
            console.error(error.toJSON());
        });
}

function readPage(path: string): Promise<string> {
    return readFile(path, {encoding: "utf8"})
}

interface Listing {
    title?: string
    price: string
}

function toListing(e: Element): Listing {
    // ".in-card__title" > title or text
    // ".in-realEstateListCard__features--main" | ".in-feat__item--main" > text
    return {
        title: e.querySelector(".in-card__title").getAttribute("title"),
        price: e.querySelector(".in-feat__item--main").textContent.trim()
    }
}

function getListings(html: string): Listing[] {
    let {window} = new JSDOM(html);
    let listing_selector = ".in-realEstateResults__item"
    let res = window.document.querySelectorAll(listing_selector);
    let listings = Array.from(res).map(e => toListing(e));
    return listings;
}

// fetchPage(URL).then(r => getListings(r))
readPage("data/immobiliare-test.html").then(r => getListings(r)).then(d => console.log(d))
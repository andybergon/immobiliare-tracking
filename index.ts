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

function getListings(html: string) {
    let {window} = new JSDOM(html);
    let selector = ".in-realEstateListCard__features--main";
    let res = window.document.querySelectorAll(selector);
    let listings = Array.from(res).map(e => e.textContent).map(t => {
        price: t
    });
    return listings;
}

// fetchPage(URL).then(r => getListings(r))
readPage("data/immobiliare-test.html").then(r => getListings(r)).then(d => console.log(d))
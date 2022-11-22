// let axios = require('axios');
// let cheerio = require('cheerio');

const SUCCESS_CODE = 200;
const BASE_URL = 'https://readcomiconline.li'
const SEARCH_URL = BASE_URL + '/AdvanceSearch?comicName=';

async function updateSearch(search) {
    const results = await getResults(search);
    updateImg('search-result', results);
}



// search functions //
async function getResults(search){
    /**
     *  search and parse the searched title.
     * It returns list of dictionaries with the results info
     */
    let url = SEARCH_URL + search;
    const response = await axios.get(url)

    if (response.status !== SUCCESS_CODE) {
        return [];
    }
    const html = response.data;

    const parser = new DOMParser();
    const htmlDoc = parser.parseFromString(response.data, 'text/html');
    const resultList = [...htmlDoc.getElementsByClassName('item')];
    return resultList.map(res => parseResult(res, parser));

}

function parseResult(item, parser){
    /**
     * helper to getResults function.
     * parse a single result
     */
    let i = {};
    let inHTML = parser.parseFromString(item.title, 'text/html');
    i.alt = inHTML.getElementsByClassName('title')[0].textContent;
    i.description = inHTML.getElementsByClassName('description')[0].textContent;
    i.href = item.getElementsByTagName('a')[0].getAttribute('href');
    i.src = item.getElementsByTagName('img')[0].getAttribute('src');
    return i;
}

function modalOpenCloseSettings(){
    /**
     * Sets the beahviour of the comic info modal
     */
    modal.style.display = "block";
    var span = document.getElementsByClassName("close")[0];

    // When the user clicks on <span> (x), close the modal
    span.onclick = function() {
    modal.style.display = "none";
    }
    // When the user clicks anywhere outside of the modal, close it
    window.onclick = function(event) {
    if (event.target == modal) {
        modal.style.display = "none";
    }
         }
}


function createComicInfoElement(key, comicInfo){
    /**
     * Creates the html element which contains a comics information, to display on the comic info modal
     */
    let element = document.createElement('p');
    element.className = 'comic-info'
    let keyElement = document.createElement('a');
    keyElement.className = 'key-info';
    keyElement.textContent = key + ' ';
    let valueElement = document.createElement('a');
    valueElement.className = 'value-info';
    valueElement.textContent = comicInfo[key];
    element.appendChild(keyElement);
    element.appendChild(valueElement);
    return element;
}

function createComicSummary(comicInfo){
    /**
     * creates the summary html element
     */
    let element = document.createElement('p');
    element.className = 'comic-info'
    let keyElement = document.createElement('a');
    keyElement.className = 'key-info';
    keyElement.textContent = 'Summary:';
    let valueElement = document.createElement('p');
    valueElement.classList.add('value-info','comicInfo');
    valueElement.textContent = comicInfo['summary'];
    element.appendChild(keyElement);
    return [element, valueElement];

}


function tableColumnsHelper(x){
    /**
     * Helps to creates the issues Table header
     */
     const th = document.createElement("th");
     const text = document.createTextNode(x);
     th.appendChild(text);
     return th
}

function createIssuesTable(issues){
    /**
     * Creates the table with the issues of the comic for the comic info modal
     */
    const table = document.createElement('table');
    table.className = 'comic-info';
    const thead = table.createTHead();
    const hrow = thead.insertRow();
    const columns = ['#','Title', 'Release date'].map( x => tableColumnsHelper(x));
    hrow.append(...columns);
    for (key in issues) {
        // creates the rows 
        let row = table.insertRow();
        let idxCell = row.insertCell();
        let text = document.createTextNode(key);
        idxCell.appendChild(text);
        let titleCell = row.insertCell();
        let titleElement = document.createElement('a');
        titleElement.href = issues[key].href;
        titleElement.textContent = issues[key].title;
        titleCell.appendChild(titleElement);
        let dateCell = row.insertCell();
        let date =  document.createTextNode(issues[key].releaseDate);
        dateCell.appendChild(date);

    }
    return [table];
}



function createComicModalInfo(comicInfo){
    /**
     * creates array with element for the comic info modal
     */
    const order = ['Writer', 'Artist', 'Genres', 'Publisher', 'publication date'];
    const infoArr = order.map(x => createComicInfoElement(x + ':', comicInfo));
    const summary = createComicSummary(comicInfo);
    const table = createIssuesTable(comicInfo.issues)
    return infoArr.concat(summary).concat(table);
}


function clearModal(modalDoc) {
    /**
     * Clears the modal from the information of other elements
     */
    const p_list = modalDoc.getElementsByClassName("comic-info");
    [...p_list].map(x => x.remove())
}


function createImgElement(imgData){
    /**
     * Create the image element to display on the search result panel
     * @returns html element
     */

// inner function 
    async function setModal (){
        /**
         * the function which opens the modal with the comic information
         */
        document.getElementById("modal-title").textContent = imgData.alt
        const modalContent  = modal.getElementsByClassName('modal-content')[0]
        clearModal(modalContent);
        const comicInfo = await parseComicPage(imgData.href);
        console.log(comicInfo);
    
        const elemArr = createComicModalInfo(comicInfo);
        modalContent.append(...elemArr)
        modalOpenCloseSettings()
        return comicInfo;
    }
  // end of inner function 

    let element = document.createElement('a');
    element.onclick  =setModal ;
    element.className = 'cover-container'

    // create the title shown on the image
    let titleElement = document.createElement('h3');
    // element.href = BASE_URL + imgData.href;
    titleElement.className = 'title';
    titleElement.textContent = imgData.alt;



    let img = document.createElement('img');
    img.className = 'cover'
    img.src = imgData.src.startsWith('http') ? imgData.src : BASE_URL + imgData.src;
    img.alt = imgData.alt;
    element.appendChild(img);
    element.appendChild(titleElement);
    return element;
}


function updateImg(id,results){
    const node = document.getElementById(id);
    // remove old search result
     while (node.firstChild) {
    node.removeChild(node.lastChild);
  }
  const elementArr = results.map(createImgElement);
  node.append(...elementArr);
}

// end of search functions //


function parseComicIssues(htmlDoc){
    /**
     * Parse the table of comic issues from the html
     */
    const oTable = htmlDoc.getElementsByClassName('listing')[0];
    const rows = [...oTable.rows].slice(2);
    let issuesArr = {};
    for (let i = 0; i < rows.length; i++) {
        let curArr = {};
        let rowData = rows[i].getElementsByTagName('a')[0];
        curArr['title'] = rowData.title;
        curArr['href'] = rowData.href;
        curArr['releaseDate'] = rows[i].cells[1].textContent.trim()
        issuesArr[i] = curArr;
    }
    return issuesArr

}





function parseComicInfoHelper(p, infoDict){
    // console.log(p.textContent)
    const data = [...p.children].map(x => x.textContent);
    if (data.length === 1 && data[0].includes('Summary')){

        infoDict[data[0].replace(':','').toLowerCase()] = p.nextElementSibling.textContent;
    }else {
        infoDict[data[0]] = data.slice(1).join(' ');
    }
}


function parseComicInfo(htmlDoc){
    const infoArr = [...htmlDoc.getElementsByClassName('barContent')[0].getElementsByTagName('p')]
    const infoDict = {};
    infoArr.map(p => parseComicInfoHelper(p,infoDict));

    return infoDict;
}


async function parseComicPage(adress){
        let url =  BASE_URL + adress;
        const response = await axios.get(url)
        const html = response.data;
            if (response.status !== SUCCESS_CODE) {
        return [];
            }
        const parser = new DOMParser();
        const htmlDoc = parser.parseFromString(response.data, 'text/html');
        const info = parseComicInfo(htmlDoc)
        info.issues =  parseComicIssues(htmlDoc);
        return info;
}

const search = document.getElementById('search-input');

search.addEventListener("keypress", async function(event) {
    // If the user presses the "Enter" key on the keyboard
    if (event.key === "Enter") {
        await updateSearch(search.value);
    }
}
);


// Modal //

// Get the modal
var modal = document.getElementById("comicModal");


// Get the <span> element that closes the modal
var span = document.getElementsByClassName("close")[0];


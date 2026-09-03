// set marked js to include <br> on a single line break (github behavior)
marked.use({
    gfm: true,
    breaks: true
});

const mainContent = document.getElementById("main-content");
const searchContent = document.querySelector(".search");
const searchInput = searchContent.firstElementChild;
const btnTop = document.querySelector(".top");
const thoughtPrefix = "./content/thoughts/";
const pagePrefix = "./content/pages/";
const fullMonthName = [
    null,
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December"
];

async function getManifest () {
    const res = await fetch("./content/manifest.json");
    if (!res.ok) throw new Error("Failed fetching manifest");
    return await res.json();
}

// declare manifest globally
let manifest;

// fetch manifest for global var
async function init () {
    manifest = await getManifest();
    router();
}

async function getContent (filePath, type) {
    // cond ? true : false
    type === "thought" ?
        filePath = `${thoughtPrefix}${filePath}` :
        filePath = `${pagePrefix}${filePath}`

    const res = await fetch(filePath);
    if (!res.ok) throw new Error("Failed fetching content");
    return marked.parse(await res.text());
}

async function renderHome () {
    const page = manifest.find(page => page.slug === "home");
    const content = await getContent(page.fileName, "page");

    mainContent.innerHTML = content;

    // change this after updating current section
    renderLastUpdated("2026-08-29");

    // render section
    renderLatest(manifest);
    renderFeatured(manifest);
    renderBadges();

    adjustExtLinks(mainContent);

    // make footer visible AFTER all content loaded
    document.querySelector("footer").style.display = "block";

    scrollToTop();
}

function renderLastUpdated(oldDate) {
    const prefix = "※ Last updated:";
    let value;
    let suffix;

    const newSmall = document.createElement("small");

    const timeElapsed = new Date() - new Date(oldDate);

    const minute = 1000 * 60;
    const hour = minute * 60;
    const day = hour * 24;
    const week = day * 7;
    const month = day * 30;
    const year = day * 365;

    switch (true) {
        case timeElapsed < minute:
            newSmall.textContent = `${prefix} Just now`;
            break;
        case timeElapsed < hour:
            value = Math.floor(timeElapsed/minute);
            suffix = value === 1 ? "minute ago" : "minutes ago";
            newSmall.textContent = `${prefix} ${value} ${suffix}`;
            break;
        case timeElapsed < day:
            value = Math.floor(timeElapsed/hour);
            suffix = value === 1 ? "hour ago" : "hours ago";
            newSmall.textContent = `${prefix} ${value} ${suffix}`;
            break;
        case timeElapsed < week:
            value = Math.floor(timeElapsed/day);
            suffix = value === 1 ? "day ago" : "days ago";
            newSmall.textContent = `${prefix} ${value} ${suffix}`;
            break;
        case timeElapsed < month:
            value = Math.floor(timeElapsed/week);
            suffix = value === 1 ? "week ago" : "weeks ago";
            newSmall.textContent = `${prefix} ${value} ${suffix}`;
            break;
        case timeElapsed < year:
            value = Math.floor(timeElapsed/month);
            suffix = value === 1 ? "month ago" : "months ago";
            newSmall.textContent = `${prefix} ${value} ${suffix}`;
            break;
        default:
            value = Math.floor(timeElapsed/year);
            suffix = value === 1 ? "year ago" : "years ago";
            newSmall.textContent = `${prefix} ${value} ${suffix}`;
    }

    mainContent.append(newSmall);
}

function renderLatest () {
    // getting latest three
    const latestThoughts = manifest.slice(0, 3);

    const newSection = document.createElement("section");
    const newHeader = document.createElement("h4");
    const newUl = document.createElement("ul");

    newHeader.textContent = "Latest thoughts";
    newUl.classList.add("no-style-list");

    newSection.append(newHeader);
    newSection.append(newUl);

    latestThoughts.forEach(thought => {
        const newLi = document.createElement("li");
        newLi.innerHTML =
        `<a href="#${thought.slug}">${thought.title}</a>`
        newUl.append(newLi);
    });

    mainContent.append(newSection);
}

function renderFeatured () {
    const featuredThoughts = manifest.filter(page => page.metaTag.includes("featured"));

    const newSection = document.createElement("section");
    const newHeader = document.createElement("h4");
    const newUl = document.createElement("ul");

    newHeader.textContent = "Featured thoughts";
    newUl.classList.add("no-style-list");

    newSection.append(newHeader);
    newSection.append(newUl);

    featuredThoughts.forEach(thought => {
        const newLi = document.createElement("li");
        newLi.innerHTML =
        `<a href="#${thought.slug}">${thought.title}</a>`
        newUl.append(newLi);
    });

    mainContent.append(newSection);
}

function renderBadges () {
    const newSection = document.createElement("section");
    newSection.classList.add("badge-container");
    newSection.innerHTML =
        `
        <img class="big-badge" src="./assets/badges/by-human.svg" alt="Made by human badge" />
        <img src="./assets/badges/github-pages.svg" alt="GitHub pages badge" />
        <img src="./assets/badges/html.svg" alt="HTML badge" />
        <img src="./assets/badges/css.svg" alt="CSS badge" />
        <img src="./assets/badges/js.svg" alt="JavaScript badge" />
        <img src="./assets/badges/anime-blink.gif" alt="Anime blinking badge" />
        `;

    mainContent.append(newSection);
}

async function renderAbout () {
    const page = manifest.find(page => page.slug === "about");
    const content = await getContent(page.fileName, "page");
    
    mainContent.innerHTML = content;

    renderBadges();

    adjustExtLinks(mainContent);

    // make footer visible AFTER all content loaded
    document.querySelector("footer").style.display = "block";

    scrollToTop();
}

function renderArchives (manifest) {
    let currentYear;
    let currentMonth;
    let currentUl;

    mainContent.innerHTML = "";

    manifest = manifest.filter(thought => !thought.metaTag.includes("hidden"));

    if (manifest.length === 0) {
        const newBr = document.createElement("br");
        const newInfo = document.createElement("ul");
        newInfo.classList.add("hint", "no-style-list");
        newInfo.innerHTML = `
            <li>Try searching by:</li>
            <li>&emsp; <strong>title</strong>: "the actual reason you do things"</li>
            <li>&emsp; <strong>date posted</strong>: "july", "2026", "2026-07-25"</li>
        `;
        mainContent.append(newBr);
        mainContent.append(newInfo);
    } else {
        const newSmall = document.createElement("small");
        newSmall.classList.add("hint");
        newSmall.textContent =
        `${manifest.length} ${manifest.length > 1 ? "thoughts" : "thought"}`;
        mainContent.append(newSmall);
    }

    manifest.forEach(thought => {
        let currentThoughtYear = thought.posted.slice(0, 4);
        let currentThoughtMonth = Number(thought.posted.slice(5, 7));

        if (currentYear !== currentThoughtYear) {
            currentYear = currentThoughtYear;
            // resetting month if year changed
            currentMonth = null;
        }

        if (currentMonth !== currentThoughtMonth) {
            currentMonth = currentThoughtMonth;
            const newHeader = document.createElement("h4");
            newHeader.textContent = `${fullMonthName[currentMonth]}, ${currentYear}`;
            mainContent.append(newHeader);

            // create ul for this month
            currentUl = document.createElement("ul");
            currentUl.classList.add("no-style-list");
            mainContent.append(currentUl);
        }

        const newLi = document.createElement("li");
        newLi.innerHTML =
        `<div class="list-div">
        ${thought.posted.slice(-2)}
        <a href="#${thought.slug}">${thought.title}</a>
        </div>`;
        currentUl.append(newLi);
    });

    renderBadges();

    adjustExtLinks(mainContent);

    // make footer visible AFTER all content loaded
    document.querySelector("footer").style.display = "block";

    scrollToTop();
}

async function renderThought (page) {
    const content = await getContent(page.fileName, "thought");

    mainContent.innerHTML =
    `<h2>${page.title}</h2>
    <p><small>Posted on ${formatDate(page.posted)}</small></p>
    <br>
    ${content}`;

    renderBadges();

    adjustExtLinks(mainContent);

    // make footer visible AFTER all content loaded
    document.querySelector("footer").style.display = "block";

    scrollToTop();
}

function renderNotFound () {
    mainContent.innerHTML = 
    `<h2>Not found</h2>
    <br>
    <p>Page you're looking for isn't created.. at least <em>yet</em>.</p>`;

    renderBadges();

    adjustExtLinks(mainContent);

    // make footer visible AFTER all content loaded
    document.querySelector("footer").style.display = "block";

    scrollToTop();
}

function adjustExtLinks (container) {
    container.querySelectorAll("a").forEach(link => {
        if (link.getAttribute("href").startsWith("http")) {
            link.target = "_blank";
            link.rel = "noopener noreferrer";
        }
    })
}

function formatDate (dateStr) {
    // getting individual var from "2000-01-01" format
    const [year, month, day] = dateStr.split("-");

    return `
    ${fullMonthName[parseInt(month)]}
    ${parseInt(day)},
    ${year}
    `
}

function scrollToTop (behavior) {
    if (behavior === undefined) behavior = "instant";
    window.scrollTo({top: 0, behavior: behavior});
}

function toggleSearch (show) {
    searchContent.classList.toggle("search-visible", show);
}

async function router () {
    const slug = window.location.hash.replace("#", "");

    if (!slug) {
        toggleSearch(false);
        renderHome();
        return;
    } else if (slug === "about") {
        toggleSearch(false);
        renderAbout();
        return;
    } else if (slug === "archives") {
        toggleSearch(true);
        renderArchives(manifest);
        return;
    } else {
        const page = manifest.find(page => page.slug === slug);
        if (page) {
            toggleSearch(false);
            renderThought(page);
        } else {
            toggleSearch(false);
            renderNotFound();
        }
    }
}

searchInput.addEventListener("input", () => {
    const query = searchInput.value.trim().toLowerCase();
    const publicManifest = manifest.filter(thought => !thought.metaTag.includes("hidden"));
    
    const filteredManifest = publicManifest.filter(thought => 
        thought.posted.includes(query) ||
        formatDate(thought.posted).toLowerCase().includes(query) ||
        thought.title.toLowerCase().includes(query)
    );
    renderArchives(filteredManifest);
});

btnTop.addEventListener("click", () => scrollToTop("smooth"));

window.addEventListener("DOMContentLoaded", init);
window.addEventListener("hashchange", () => {
    router();
    searchInput.value = "";
});
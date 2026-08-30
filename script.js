// set marked js to include <br> on a single line break (github behavior)
marked.use({
    gfm: true,
    breaks: true
});

const mainContent = document.getElementById("main-content");
const topButton = document.querySelector(".top");
const hiddenPages = ["home", "about", "archives"];

async function getManifest () {
    const res = await fetch("./thoughts/thoughts.json");
    if (!res.ok) throw new Error("Failed fetching manifest");
    return await res.json();
}

async function getContent (filePath) {
    const res = await fetch(filePath);
    if (!res.ok) throw new Error("Failed fetching content");
    return marked.parse(await res.text());
}

async function renderHome (manifest) {
    const page = manifest.find(page => page.slug === "home");
    const content = await getContent(page.filePath);

    mainContent.innerHTML = content;

    // render sections
    renderLatest(manifest);
    renderFeatured(manifest);
    renderBadges();

    adjustExtLinks(mainContent);

    scrollToTop();
}

function renderLatest (manifest) {
    // getting latest three thoughts
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
        `<a href="#${thought.slug}">${slugToTitle(thought.slug)}</a>`
        newUl.append(newLi);
    });

    mainContent.append(newSection);
}

function renderFeatured (manifest) {
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
        `<a href="#${thought.slug}">${slugToTitle(thought.slug)}</a>`
        newUl.append(newLi);
    });

    mainContent.append(newSection);
}

function renderBadges () {
    const newSection = document.createElement("section");
    newSection.classList.add("badge-container");
    newSection.innerHTML =
        `
        <img class="classic-badge" src="./assets/badges/human-not-ai.svg" alt="Written by Human Not AI" />
        <img src="./assets/badges/github-pages.svg" alt="GitHub pages" />
        <img src="./assets/badges/html.svg" alt="HTML" />
        <img src="./assets/badges/css.svg" alt="CSS" />
        <img src="./assets/badges/js.svg" alt="JavaScript" />
        <img src="./assets/badges/anime-blink.gif" alt="Anime blinking" />
        `;
        
    mainContent.append(newSection);
}

async function renderAbout (manifest) {
    const page = manifest.find(page => page.slug === "about");
    const content = await getContent(page.filePath);
    
    mainContent.innerHTML = content;

    adjustExtLinks(mainContent);

    scrollToTop();
}

function renderArchives (manifest) {
    const monthName = [
        "",
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
    let currentYear;
    let currentMonth;
    // global var to refer to ul
    let currentUl;

    mainContent.innerHTML = "<h1>Archives</h1>";

    // only return slug that doesn't included in hiddenPages arr
    const pages = manifest.filter (page => !hiddenPages.includes(page.slug));

    pages.forEach(page => {
        let currentPageYear = page.posted.slice(0, 4);
        let currentPageMonth = Number(page.posted.slice(5, 7));

        if (currentYear !== currentPageYear) {
            currentYear = currentPageYear;
            // resetting month if year changed
            currentMonth = null;

            // create separate year heading
            // const newH3 = document.createElement("h3");
            // newH3.textContent = currentYear;
            // mainContent.append(newH3);
        }

        if (currentMonth !== currentPageMonth) {
            currentMonth = currentPageMonth;
            const newH5 = document.createElement("h5");
            newH5.textContent = `${monthName[currentMonth]}, ${currentYear}`;
            mainContent.append(newH5);

            // create ul for this month
            currentUl = document.createElement("ul");
            currentUl.classList.add("no-style-list");
            mainContent.append(currentUl);
        }

        const newLi = document.createElement("li");
        newLi.innerHTML =
        `<div class="list-div">
        ${page.posted.slice(-2)}
        <a href="#${page.slug}">${slugToTitle(page.slug)}</a>
        </div>`;
        currentUl.append(newLi);
    });

    scrollToTop();
}

async function renderThought (page) {
    const content = await getContent(page.filePath);

    mainContent.innerHTML =
    `<h1>${slugToTitle(page.slug)}</h1>
    <p class="author"><em>Posted on ${formatDate(page.posted)}</em></p>
    <br>
    ${content}`;

    adjustExtLinks(mainContent);

    scrollToTop();
}

function renderNotFound () {
    mainContent.innerHTML = 
    `<h1>Not found</h1>
    <p>Page you're looking for isn't created.. at least <em>yet</em>.</p>`;
}

function formatDate (string) {
    // getting individual var from "2026-01-01"
    const [year, month, day] = string.split("-");

    // create new date obj, month - 1 because js use 0 index month
    const date = new Date(year, month - 1, day);

    // returning new date format
    return new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric"
    }).format(date);
}

function slugToTitle (string) {
    /*
        replace - with space
        make first char with uppercase
        make standalone i into I (pronoun)
    */
    return string
        .replace(/-/g, " ")
        .replace(/^./, char => char.toUpperCase())
        .replace(/\bi\b/gi, "I");
}

function scrollToTop (behavior) {
    if (behavior === undefined) behavior = "instant";
    window.scrollTo({top: 0, behavior: behavior});
}

topButton.addEventListener("click", () => scrollToTop("smooth"));

function adjustExtLinks (container) {
    container.querySelectorAll("a").forEach(link => {
        if (link.getAttribute("href").startsWith("http")) {
            link.target = "_blank";
            link.rel = "noopener noreferrer";
        }
    })
}

async function router () {
    const manifest = await getManifest();
    const slug = window.location.hash.replace("#", "");

    if (!slug) {
        renderHome(manifest);
        return;
    } else if (slug === "about") {
        renderAbout(manifest);
        return;
    } else if (slug === "archives") {
        renderArchives(manifest);
        return;
    } else {
        const page = manifest.find(page => page.slug === slug);
        if (page) {
            renderThought(page);
        } else {
            renderNotFound();
        }
    }
}

window.addEventListener("DOMContentLoaded", router);
window.addEventListener("hashchange", router);
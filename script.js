const mainCont = document.getElementById("main-content");
const featuredCont = document.getElementById("featured");
const darkToggle = document.getElementById("dark-toggle");
const hiddenPages = ["about", "archives", "now"];

async function getManifest () {
    const res = await fetch("./thoughts/thoughts.json");
    if (!res.ok) throw new Error("Failed fetching manifest");
    return await res.json();
}

async function getContent (filePath) {
    const res = await fetch(filePath);
    if (!res.ok) throw new Error("Failed fetching content");
    return marked.parse(await res.text()).replaceAll("</p>", "</p><br>");
}

async function renderHome (manifest) {
    renderFeatured(manifest);
    const page = manifest[0];
    const content = await getContent(page.filePath);

    mainCont.innerHTML =
    `<h1>${page.title}</h1>
    <p class="author"><em>Posted on ${formatDate(page.posted)}</em></p>
    ${content}`;

    adjustExtLinks(mainCont);

    featuredCont.style.display = "block";

    scrollToTop();
}

async function renderAbout (manifest, slug) {
    const page = manifest.find(page => page.slug === slug);
    const content = await getContent(page.filePath);

    mainCont.innerHTML = content.replaceAll("<br>", "");

    if (slug === "now") {
        const spacer = document.createElement("br");
        const newP = document.createElement("p");
        newP.innerHTML = `<small>
            What is a
            <a href='https://nownownow.com/about'>/now page?</a>
        </small>`;
        mainCont.append(spacer, newP);
    }

    adjustExtLinks(mainCont);

    featuredCont.style.display = "none";

    scrollToTop();
}

function renderArchives (manifest) {
    let currentYear;
    mainCont.innerHTML = "<h1>Archives</h1>";

    // only return slug that doesn't included in hiddenPages arr
    const pages = manifest.filter (page => !hiddenPages.includes(page.slug));

    pages.forEach(page => {
        let currentPageYear = page.posted.slice(0, 4);
        if (currentYear !== currentPageYear) {
            currentYear = currentPageYear;
            const newH3 = document.createElement("h3");
            newH3.textContent = currentYear;
            mainCont.append(newH3);
        }

        const newP = document.createElement("p");
        newP.innerHTML =
        `${formatDate(page.posted)} - <a href="#${page.slug}">${page.title}</a>`;
        mainCont.append(newP);
    });

    featuredCont.style.display = "none";

    scrollToTop();
}

async function renderThought (page) {
    const content = await getContent(page.filePath);

    mainCont.innerHTML =
    `<h1>${page.title}</h1>
    <p class="author"><em>Posted on ${formatDate(page.posted)}</em></p>
    ${content}`;

    adjustExtLinks(mainCont);

    featuredCont.style.display = "none";

    scrollToTop();
}

function renderFeatured (manifest) {
    featuredCont.innerHTML = "";
    const featured = manifest.filter(page => page.metaTag === "featured");

    const newHeader = document.createElement("h3");
    newHeader.textContent = "Featured thoughts";
    featuredCont.append(newHeader);

    featured.forEach(page => {
        const newP = document.createElement("p");
        newP.innerHTML =
        `<a href="#${page.slug}">${page.title}</a>`
        featuredCont.append(newP);
    });
}

function renderNotFound () {
    mainCont.innerHTML = "<p>Page not created.. <em>yet</em>.</p>";

    featuredCont.style.display = "none";
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

function scrollToTop () {
    window.scrollTo({top: 0, behavior: "instant"});
}

darkToggle.addEventListener("click", (e) => {
    e.preventDefault();

    document.body.classList.toggle("latex-dark");

    if (darkToggle.innerHTML === "light/<b>dark</b>") {
        darkToggle.innerHTML = "<b>light</b>/dark";
    } else {
        darkToggle.innerHTML = "light/<b>dark</b>";
    }
})

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
        await renderHome(manifest);
        return;
    } else if (slug === "about" || slug === "now") {
        await renderAbout(manifest, slug);
        return;
    } else if (slug === "archives") {
        await renderArchives(manifest);
        return;
    } else {
        const page = manifest.find(page => page.slug === slug);
        if (page) {
            await renderThought(page);
        } else {
            renderNotFound();
        }
    }
}

window.addEventListener("DOMContentLoaded", router);
window.addEventListener("hashchange", router);
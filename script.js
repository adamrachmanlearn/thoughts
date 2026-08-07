const mainCont = document.getElementById("main-content");
const featuredCont = document.getElementById("featured");
const darkToggle = document.getElementById("dark-toggle");

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

async function renderAbout (manifest) {
    const page = manifest.find(page => page.slug === "about-me");
    const content = await getContent(page.filePath);

    mainCont.innerHTML = content.replaceAll("<br>", "");

    featuredCont.style.display = "none";

    scrollToTop();
}

async function renderThought (page) {
    const content = await getContent(page.filePath);

    mainCont.innerHTML =
    `<h1>${page.title}</h1>
    <p class="author"><em>Posted on ${formatDate(page.posted)}</em></p>
    ${content}
    <a href="#archives">More &rarr;</a>`;

    adjustExtLinks(mainCont);

    featuredCont.style.display = "none";

    scrollToTop();
}

function renderArchives (manifest) {
    mainCont.innerHTML = "<h1>Archives</h1>";

    const pages = manifest.filter (
        page => page.slug !== "about-me" && page.slug !== "archives"
    );

    pages.forEach(page => {
        const newP = document.createElement("p");
        newP.innerHTML =
        `${formatDate(page.posted)} - <a href="#${page.slug}">${page.title}</a>`;
        mainCont.append(newP);
    });

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
        `${formatDate(page.posted)} -
        <a href="#${page.slug}">${page.title}</a>`
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
        darkToggle.innerHTML = "<b>light</b>/dark"
    } else {
        darkToggle.innerHTML = "light/<b>dark</b>"
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
    } else if (slug === "about-me") {
        await renderAbout(manifest);
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
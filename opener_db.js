const { decoder, encoder } = require('tetris-fumen');

var data;
var categories;

const classMap = {
    "L": "l_mino",
    "J": "j_mino",
    "S": "s_mino",
    "Z": "z_mino",
    "I": "i_mino",
    "O": "o_mino",
    "T": "t_mino",
  };

  reverseMappingLetters = {
    "L": "J",
    "J": "L",
    "S": "Z",
    "Z": "S",
    "T": "T",
    "O": "O",
    "I": "I",
}

async function loadData() {
    await fetch("./data-3.json")
        .then((response) => response.json())
        .then((muh_data) => {
            data = muh_data;
        })
        .catch((error) => console.error("Error loading JSON file", error));

}

loadData().then( () => {
    document.getElementById("timestamp").innerHTML = data[0].timestamp;
    console.log(data[0].timestamp);

    const urlSearchParams = new URLSearchParams(window.location.search);

    index = urlSearchParams.get("i");
    query = urlSearchParams.get("q");
    query2 = urlSearchParams.get("q2");
    fumenQuery = urlSearchParams.get("f");
    fumenQuery2 = urlSearchParams.get("f2");
    if (index) {
        index = Number(index);
        if (Number.isInteger(index) && index >= 0 && index < data.length) {
            let opener = data[index];
            loadOpener(opener);
        }
    }
    else if (query) {
        document.getElementById('name search').value = query;
        searchOpenerByName();
    }
    else if (query2) {
        document.getElementById('name search levenshtein').value = query2;
        searchOpenerByNameLevenshtein();
    }
    else if (fumenQuery) {
        document.getElementById('fumen search').value = fumenQuery;
        searchOpenerByFumen();
    }
    else if (fumenQuery2) {
        document.getElementById('fumen search 2').value = fumenQuery2;
        searchOpenerByFumen2();
    }

    // grab all categories and then populate dropdown with all these options
    categories = {};
    // let primary_categories = new Set();
    // let secondary_categories = {}
    for (let [_, [category_primary, category_secondary]] of Object.entries(data[0].categories)) {
        // primary_categories.add(category_primary);
        // secondary_categories.add(category_secondary);
        if (category_primary in categories) {
            categories[category_primary].push(category_secondary);
        } else {
            categories[category_primary] = [];
        }
    }

    // console.log(primary_categories);

    let dropdown_category_primary = document.getElementById("category primary");
    let dropdown_category_secondary = document.getElementById("category secondary");

    for (let [primary, secondary] of Object.entries(categories)) {
        if (primary != "Sources") dropdown_category_primary.append(new Option(primary));
    }
    dropdown_category_secondary.append(new Option(""));
    for (let category of categories[dropdown_category_primary.value]) {
        dropdown_category_secondary.append(new Option(category));
    }
    
}
);



async function loadOpener(opener) {
    let container = document.getElementById('container');

    container.appendChild(document.createElement('hr'));
    container.appendChild(document.createElement('br'));

    console.log(opener);

    let temp = document.createElement('h1');
    temp.textContent = opener.name;
    container.appendChild(temp);

    keys = ['SEARCH', 'Sources', 'PC Chance', 'Dependencies', 'Cover', 'Notes', 'Fumen', 'Image', 'extra Notes'];

    for (let key of keys) {
        if (key in opener) {
            if (key == 'Image') {
                fumens = opener[key][0];
                temp = document.createElement('container');
                temp.setAttribute("name", "images")
                container.appendChild(temp);
                if (document.getElementById("mirror").checked) fumenrender(mirrorFumen(fumens), temp);
                else fumenrender(fumens, temp);
            }
            else {
                for (line of opener[key]) {
                    // find tetramino letters encoded in the form [0 width character] [Letter]
                    let tetramino_regex = /(?<=\u200b)[LJIOSZT]/g;
                    line = line.replace(tetramino_regex, (match) => {
                        if (document.getElementById("mirror").checked) match = reverseMappingLetters[match];
                        const className = classMap[match];
                        return `<span class='${className}'>${match}</span>`;
                    });
                    line = line.replace(/\u200b/g, "");

                    // add the HTML to the page
                    // temp = document.createElement("span");
                    // temp.innerHTML = line;
                    // container.appendChild(temp);
                    container.innerHTML += line;
                }
                
            }
        }
    }

    // special case for Contents
    if (opener.name == "Contents") {
        let ivan_doc = "https://docs.google.com/document/d/1rwI5Uww5AygrF3QSBm0o6hqTG1X8P2cRsJaBjYFMzDg/pub";
        let links = document.querySelectorAll('a');
        for (let link of links) {
            last_part = link.href.split("/").splice(-1)[0]; // all hashtag links should go to ivan doc instead
            if (last_part[0] == '#') link.href = ivan_doc + last_part;
        }
    }

    container.appendChild(document.createElement('br'));
    container.appendChild(document.createElement('br'));

    // for debugging purposes, let's also look for the index
    for(let i = 1; i < data.length; i++) {
        if (data[i].name == opener.name) console.log(i);
    }
}

async function loadRandomOpener() {
    let container = document.getElementById('container');
    while (container.firstChild) {
		container.removeChild(container.firstChild);
	}

    let randomOpener = data[Math.floor(Math.random()*data.length)];
    await loadOpener(randomOpener)
}

async function searchOpenerByNameLevenshtein() {
    let container = document.getElementById('container');
    while (container.firstChild) {
		container.removeChild(container.firstChild);
	}

    let query = document.getElementById('name search levenshtein').value.toLowerCase();

    let results = [];

    for(let i = 0; i < data.length; i++) {
        let opener = data[i];
        let name = opener.name.toLowerCase().split(' ');

        let min = 99999999999;
        for (let word of name) {
            temp = levenshteinDistance(query, word);
            if (temp < min) min = temp;
        }

        let result = {
            index: i,
            distance: min
        }

        results.push(result);
    }
    
    results.sort((a,b) => a.distance - b.distance);
    let lowestDistance = results[0].distance;
    console.log("lowest distance", lowestDistance);
    let lowestResults = results.filter((result) => result.distance === lowestDistance);

    for (let i = 0; i < Math.min(10,lowestResults.length); i++) {
        await loadOpener(data[results[i].index]);
    }

    // if (!container.firstChild) {
    //     console.log("Nothing found by that name in this database.")
    //     let temp = document.createElement('h1');
    //     temp.textContent = 'Nothing found by that name in this database.';
    //     container.appendChild(temp);
    // }

}

document.getElementById('name search levenshtein').addEventListener('keyup', (event) => {
    if (event.key === 'Enter') searchOpenerByNameLevenshtein();
})

async function searchOpenerByName() {
    let container = document.getElementById('container');
    while (container.firstChild) {
		container.removeChild(container.firstChild);
	}

    query = document.getElementById('name search').value.toLowerCase();

    for(let opener of data) {
        let name = opener.name.toLowerCase();

        if (name.includes(query)) { // just doing .includes() on a .toLowerCase()
            // maybe add fuzzier search later?
            await loadOpener(opener);
        }
    }

    if (!container.firstChild) {
        console.log("Nothing found by that name in this database.")
        let temp = document.createElement('h1');
        temp.textContent = 'Nothing found by that name in this database.';
        container.appendChild(temp);

    }

}

document.getElementById('name search').addEventListener('keyup', (event) => {
    if (event.key === 'Enter') searchOpenerByName();
})


async function searchOpenerByFumen() {
    let container = document.getElementById('container');
    while (container.firstChild) {
		container.removeChild(container.firstChild);
	}

    query = document.getElementById('fumen search').value;
    // sanitize fumen first
    try {
        decoder.decode(query)
    } catch (error) {
        console.log(error);
        let temp = document.createElement('h1');
        temp.textContent = 'Seems to be an invalid fumen.';
        container.appendChild(temp);
    }

    for(let opener of data) {
        if ("SEARCH" in opener) {
            for (line of opener["SEARCH"]) {
                let temp = document.createElement('p');
                temp.innerHTML = line;
                let fumen = temp.textContent;

                if (fumen.includes(query)) {
                    // just doing .includes()
                    // maybe add fuzzier search later?
                    await loadOpener(opener);
                }
            }
        }
    }

    if (!container.firstChild) {
        console.log("Nothing found with that fumen in this database.")
        let temp = document.createElement('h1');
        temp.textContent = 'Nothing found with that fumen in this database.';
        container.appendChild(temp);

    }

}

document.getElementById('fumen search').addEventListener('keyup', (event) => {
    if (event.key === 'Enter') searchOpenerByFumen();
})

async function searchOpenerByFumen2() {
    let container = document.getElementById('container');
    while (container.firstChild) {
		container.removeChild(container.firstChild);
	}

    query = document.getElementById('fumen search 2').value;
    // sanitize fumen first
    try {
        decoder.decode(query)
    } catch (error) {
        console.log(error);
        let temp = document.createElement('h1');
        temp.textContent = 'Seems to be an invalid fumen.';
        container.appendChild(temp);
    }

    query = greyout([query])[0]; // grey out input!!

    for(let opener of data) {
        if ("Image" in opener) { // search the fumens inside "image" section
            let greyedOutFumens = greyout(opener["Image"][0]); // grey them out too
            for (fumen of greyedOutFumens.concat(mirrorFumen(greyedOutFumens))) {  // check mirrors too
                if (fumen.includes(query)) {
                    // just doing .includes()
                    // maybe add fuzzier search later? Maybe remove all Ts to further increase chances of a match?
                    await loadOpener(opener);
                }
            }
        }
    }

    if (!container.firstChild) {
        console.log("Nothing found with that fumen in this database.")
        let temp = document.createElement('h1');
        temp.textContent = 'Nothing found with that fumen in this database.';
        container.appendChild(temp);

    }


}

document.getElementById('fumen search 2').addEventListener('keyup', (event) => {
    if (event.key === 'Enter') searchOpenerByFumen2();
})


async function searchOpenerByCategory() {
    let container = document.getElementById('container');
    while (container.firstChild) {
		container.removeChild(container.firstChild);
	}

    let category_primary = document.getElementById('category primary').value.toLowerCase();
    let category_secondary = document.getElementById('category secondary').value.toLowerCase();

    for(let opener of data) {
        let tag_primary = opener.tag_primary.toLowerCase();
        let tag_secondary = opener.tag_secondary.toLowerCase();

        if (tag_primary.includes(category_primary) && tag_secondary.includes(category_secondary)) { // just doing .includes() on a .toLowerCase()
            // maybe add fuzzier search later?
            await loadOpener(opener);
        }
    }

    if (!container.firstChild) {
        console.log("Nothing found with those categories in this database.")
        let temp = document.createElement('h1');
        temp.textContent = 'Nothing found with those categories in this database.';
        container.appendChild(temp);

    }
    

}

async function updateSecondaryDropdown() {
    let category_primary = document.getElementById('category primary').value;
    let secondary_options = categories[category_primary];
    // console.log(secondary_options);

    let dropdown_category_secondary = document.getElementById("category secondary");
    while (dropdown_category_secondary.options.length > 0) {                
        dropdown_category_secondary.remove(0);
    }
    dropdown_category_secondary.append(new Option(""));
    for (let category of categories[category_primary]) {
        dropdown_category_secondary.append(new Option(category));
    }
}

function mirror_mino_text() {
    const l_collection = [...document.getElementsByClassName("l_mino")];
    const j_collection = [...document.getElementsByClassName("j_mino")];
    const s_collection = [...document.getElementsByClassName("s_mino")];
    const z_collection = [...document.getElementsByClassName("z_mino")];
    for (let i = 0; i < l_collection.length; i++) {
        l_collection[i].innerHTML = 'J';
        l_collection[i].className = "j_mino";
    }
    for (let i = 0; i < j_collection.length; i++) {
        j_collection[i].innerHTML = 'L';
        j_collection[i].className = "l_mino";
    }
    for (let i = 0; i < s_collection.length; i++) {
        s_collection[i].innerHTML = 'Z';
        s_collection[i].className = "z_mino";
    }
    for (let i = 0; i < z_collection.length; i++) {
        z_collection[i].innerHTML = 'S';
        z_collection[i].className = "S_mino";
    }
}

function dynamic_image_mirror() {
    let image_containers = document.getElementsByName("images");
    for (let image_container of image_containers) {
        // within each image container
        let figures = image_container.getElementsByTagName("figure");
        let fumens = [];
        for (let figure of figures) {
            fumens.push(figure.getAttribute("fumen")); // grab all fumen codes
        }
        while (image_container.firstChild) {
            // remove all the images
            image_container.removeChild(image_container.firstChild);
        }
        fumenrender(mirrorFumen(fumens), image_container); // add in the mirrored images
    }
}

document.addEventListener('keyup', (event) => {
    const target = event.target;
    if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) {
        // The hotkey should not apply when typing in an input or textarea element
        return;
    }

    if (event.key == 'm') {
        document.getElementById('mirror').checked ^= true;
        dynamic_image_mirror();
        mirror_mino_text();
    }
});

document.getElementById('mirror').addEventListener('change', (e) => {
    dynamic_image_mirror();
    mirror_mino_text();
});

function levenshteinDistance(s, t) { // generated this function with chatGPT
    // Create a matrix with dimensions of s and t
    const matrix = Array(s.length + 1)
      .fill()
      .map(() => Array(t.length + 1).fill(0));
  
    // Fill the first row and column of the matrix
    for (let i = 0; i <= s.length; i++) {
      matrix[i][0] = i;
    }
    for (let j = 0; j <= t.length; j++) {
      matrix[0][j] = j;
    }
  
    // Fill in the rest of the matrix
    for (let i = 1; i <= s.length; i++) {
      for (let j = 1; j <= t.length; j++) {
        if (s[i - 1] === t[j - 1]) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] =
            1 +
            Math.min(
              matrix[i - 1][j],
              matrix[i][j - 1],
              matrix[i - 1][j - 1]
            );
        }
      }
    }
  
    // Return the Levenshtein distance (bottom right corner of matrix)
    return matrix[s.length][t.length];
  }
  
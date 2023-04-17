const { decoder, encoder } = require('tetris-fumen');

var data;
var categories;

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
    if (index) {
        index = Number(index);
        if (Number.isInteger(index) && index >= 0 && index < data.length) {
            let opener = data[index];
            loadOpener(opener);
        }
    }

    query = urlSearchParams.get("q");
    if (query) {
        document.getElementById('name search').value = query;
        searchOpenerByName();
    }

    fumenQuery = urlSearchParams.get("f");
    if (fumenQuery) {
        document.getElementById('fumen search').value = fumenQuery;
        searchOpenerByFumen();
    }

    fumenQuery2 = urlSearchParams.get("f2");
    if (fumenQuery2) {
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
                // console.log(fumens);
                if (document.getElementById("mirror").checked) fumenrender(mirrorFumen(fumens), container);
                else fumenrender(fumens, container);
            }
            else {
                for (line of opener[key]) {
                    temp = document.createElement("span");
                    temp.innerHTML = line;
                    container.appendChild(temp);
                }
                
            }
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
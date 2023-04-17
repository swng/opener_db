const { decoder, encoder } = require('tetris-fumen');

var data;

async function loadData() {
    await fetch("./data-2.json")
        .then((response) => response.json())
        .then((muh_data) => {
            data = muh_data;
        })
        .catch((error) => console.error("Error loading JSON file", error));

}

loadData().then( () => {
    document.getElementById("timestamp").innerHTML = data[0].timestamp;
    console.log(data[0].timestamp);
}
);



async function loadOpener(opener) {
    let container = document.getElementById('container');

    container.appendChild(document.createElement('hr'));

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
                fumenrender(fumens, container)
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
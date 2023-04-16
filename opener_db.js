const { decoder, encoder } = require('tetris-fumen');

var data;

async function loadData() {
    await fetch("./data.json")
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
            temp = document.createElement('span');
            temp.innerHTML = opener[key];
            container.appendChild(temp);
        }
    }

    // trying to make images load
    // var images = container.getElementsByTagName("img");
    // var loadedImages = 0;

    // for (var i = 0; i < images.length; i++) {
    //     images[i].addEventListener("load", function () {
    //         loadedImages++;
    //         if (loadedImages == images.length) {
    //             // All images have loaded
    //             // Do something
    //         }
    //     });
    // }
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
                    // just doing .includes() on a .toLowerCase()
                    // maybe add fuzzier search later?
                    await loadOpener(opener);
                }
            }
        }
    }

    if (!container.firstChild) {
        console.log("Nothing found by that name in this database.")
        let temp = document.createElement('h1');
        temp.textContent = 'Nothing found by that name in this database.';
        container.appendChild(temp);

    }

}

document.getElementById('fumen search').addEventListener('keyup', (event) => {
    if (event.key === 'Enter') searchOpenerByFumen();
})
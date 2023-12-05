const fileDropArea = document.getElementById('file-drop-area');
const fileInput = document.getElementById('file-input');
const chosenFile = document.getElementById('chosen-file');
const fileList = document.getElementById('file-list');
const filterType = document.getElementById('filter-type');
const filterSize = document.getElementById('filter-size');
const filterButton = document.getElementById('filter-button');


function connectDB(action, file=null){
    let openRequest = indexedDB.open("db2", 2);
    openRequest.onupgradeneeded = (event) => {
        let db2 = event.target.result;
        if (!db2.objectStoreNames.contains('newFiles')) {
            db2.createObjectStore('newFiles', { keyPath: 'id' });
        }
    };
    openRequest.onsuccess = (event) => {
        const database = event.target.result
        const transaction = database.transaction("newFiles", "readwrite");
        const newFiles = transaction.objectStore("newFiles");
        if(action === 'write'){
            const newFile = {
                id: new Date().getTime(),
                file
            };
            const request = newFiles.add(newFile);
            request.onsuccess = function () {
                console.log("Файл добавлен в хранилище", request.result);
                connectDB('getDB')
            };
            request.onerror = function () {
                console.log("Ошибка, файл не добавлен в хранилище", request.error);
            };
        } else if(action === 'getDB') {
            const request = newFiles.getAll();
            request.onsuccess = function () {
                console.log("Все файлы", request.result);
                updateFileList(request.result)

            };
            request.onerror = function () {
                console.log("Ошибка", request.error);
            };
        }
    };
    openRequest.onerror = (db2) => {
        console.error('Ошибка при открытии базы данных', db2.target.error);
    };
}






fileDropArea.addEventListener('dragover', e => {
    e.preventDefault();
    fileDropArea.classList.add('drag-over');
});

fileDropArea.addEventListener('dragleave', () => {
    fileDropArea.classList.remove('drag-over');
});

fileDropArea.addEventListener('drop', e => {
    e.preventDefault();
    fileDropArea.classList.remove('drag-over');
    const files = e.dataTransfer.files;
    // console.log(files, Object.values(files));
    Object.values(files).forEach(file => loadFile(file))
    // loadFile(files[0]);
});

fileInput.addEventListener('change', e => {
    const files = e.target.files;
    Object.values(files).forEach(file => loadFile(file))
});

filterButton.addEventListener('click', filterFileList)

function filterFileList() {
    const keys = Object.keys(localStorage)
    let sortedFile = Object.keys(localStorage)
    if (filterSize.value) {
        sortedFile = keys.filter(key => +filterSize.value >= +JSON.parse(localStorage.getItem(key)).size)
    }
    if (filterType.value) {
        sortedFile = sortedFile.filter(key => {
            const type = JSON.parse(localStorage.getItem(key)).name
            const typeOfFile = type.slice(type.lastIndexOf('.') + 1)
            return filterType.value === typeOfFile
        })
    }
    updateFileList(sortedFile)
}

function updateFileList(filesFromDB) {
    // <a href="data:${fileFromDB.file.type};base64,${fileFromDB.file.data}" download="someFileDownloaded-${fileFromDB.id}">download</a>
    let newFileList = `<ul>
        ${filesFromDB.map(fileFromDB => {
        return `<li>
            <p>Имя файла: ${fileFromDB.file.name}, Тип файла: ${fileFromDB.file.type}, Размер файла: ${fileFromDB.file.size} байт</p>
            <a href="${URL.createObjectURL(new Blob([fileFromDB.file], {type: 'application/octet-stream'}))}" download>download</a>

        </li>`
    })
        }
    </ul>`
    fileList.innerHTML = newFileList
}

function loadFile(file) {
    chosenFile.innerHTML = '';
    // console.log(file);
    const fileInfo = document.createElement('div');
    fileInfo.textContent = `Имя файла: ${file.name}, Тип файла: ${file.type}, Размер файла: ${file.size} байт`;
    chosenFile.appendChild(fileInfo);
    connectDB('write', file)
}

connectDB('getDB')
// Slot saatleri eşleştirmesi
const slotSaatleri = {
    1: "08:30",
    4: "11:30",
    7: "14:30",
    10: "17:30",
    13: "20:30"
};

// Excel dosyasını yükleme ve dersleri listeleme
document.getElementById('excel-file').addEventListener('change', function (e) {
    var file = e.target.files[0];
    if (!file) return;

    var reader = new FileReader();
    reader.onload = function (e) {
        var data = new Uint8Array(e.target.result);
        var workbook = XLSX.read(data, { type: 'array' });
        var sheet = workbook.Sheets[workbook.SheetNames[0]];
        var json = XLSX.utils.sheet_to_json(sheet);

        // Dersleri temizle
        document.getElementById('dersler').innerHTML = '';

        // Dersleri ekle
        json.forEach(function (row, index) {
            var ders = document.createElement('div');
            ders.className = 'ders';
            ders.draggable = true;
            ders.id = 'ders-' + index;
            ders.dataset.bolum = row.kod.substring(0, 4); // Bölüm (ilk 4 karakter)
            ders.dataset.sinif = row.kod.substring(4, 5); // Sınıf (5. karakter)
            ders.textContent = `${row['Ders Adı']} (${row['Ders Sorumlusu']}) - ${row['gün']} ${slotSaatleri[row['slot']]}`;
            ders.addEventListener('dragstart', drag);
            document.getElementById('dersler').appendChild(ders);
        });

        // Combobox'ları güncelle
        updateCombobox();
    };
    reader.readAsArrayBuffer(file);
});

// Combobox'ları güncelle
function updateCombobox() {
    var bolumler = new Set();
    document.querySelectorAll('.ders').forEach(function (ders) {
        bolumler.add(ders.dataset.bolum);
    });

    var bolumCombobox = document.getElementById('bolum-filtre');
    bolumCombobox.innerHTML = '<option value="all">Tüm Bölümler</option>'; // Varsayılan seçenek
    bolumler.forEach(function (bolum) {
        var option = document.createElement('option');
        option.value = bolum;
        option.textContent = bolum;
        bolumCombobox.appendChild(option);
    });

    // Combobox'lara event listener ekle
    bolumCombobox.addEventListener('change', filterDersler);
    document.getElementById('sinif-filtre').addEventListener('change', filterDersler);
}

// Dersleri filtreleme
function filterDersler() {
    var selectedBolum = document.getElementById('bolum-filtre').value;
    var selectedSinif = document.getElementById('sinif-filtre').value;
    var searchTerm = document.getElementById('search').value.toLowerCase();

    document.querySelectorAll('.ders').forEach(function (ders) {
        var bolum = ders.dataset.bolum; // örn: "bilp"
        var sinif = ders.dataset.sinif; // örn: "1" veya "2"
        var dersText = ders.textContent.toLowerCase();
        
        // Bölüm filtresi kontrolü
        var bolumFiltresi = selectedBolum === "all" || selectedBolum === bolum;
        
        // Sınıf filtresi kontrolü - seçili sınıf ile ders kodundaki sınıf numarası eşleşmeli
        var sinifFiltresi = selectedSinif === "all" || selectedSinif === sinif;
        
        // Arama filtresi
        var searchFiltresi = dersText.includes(searchTerm);

        // Tüm filtreler true ise dersi göster
        if (bolumFiltresi && sinifFiltresi && searchFiltresi) {
            ders.style.display = 'block';
        } else {
            ders.style.display = 'none';
        }
    });
}

// Ders arama
document.getElementById('search').addEventListener('input', function (e) {
    filterDersler();
});

// Sürükle-bırak fonksiyonları
function allowDrop(ev) {
    ev.preventDefault();
}

function drag(ev) {
    ev.dataTransfer.setData("text", ev.target.id);
}

function drop(ev) {
    ev.preventDefault();
    var data = ev.dataTransfer.getData("text");
    var ders = document.getElementById(data);

    if (ev.target.tagName === 'TD' && ev.target.children.length === 0) {
        var clonedDers = ders.cloneNode(true);
        clonedDers.id = 'cloned-' + data;
        ev.target.appendChild(clonedDers);
        ders.style.display = "none";
        addRemoveButton(clonedDers);
    }
}

// Kaldırma butonu ekleme
function addRemoveButton(ders) {
    var removeBtn = document.createElement("span");
    removeBtn.classList.add("remove-btn");
    removeBtn.textContent = "X";
    removeBtn.onclick = function () {
        var originalDers = document.getElementById(ders.id.replace('cloned-', ''));
        originalDers.style.display = "block";
        ders.remove();
    };
    ders.appendChild(removeBtn);
}

// Excel dosyası olarak kaydetme
document.getElementById("save-excel").addEventListener("click", function () {
    let table = document.querySelector("table");
    let rows = table.querySelectorAll("tbody tr");

    let data = [["Gün", "08:30 - 10:00", "11:30 - 13:00", "14:30 - 16:00", "17:30 - 19:00", "20:30 - 22:00"]];

    rows.forEach(row => {
        let rowData = [];
        let columns = row.querySelectorAll("td");
        rowData.push(columns[0].innerText); // Gün

        for (let i = 1; i < columns.length; i++) {
            rowData.push(columns[i].innerText || ""); // Ders bilgisi (varsa)
        }

        data.push(rowData);
    });

    let ws = XLSX.utils.aoa_to_sheet(data);
    let wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Ders Programı");

    XLSX.writeFile(wb, "DersProgramı.xlsx");
});

// Programı yükleme
function loadProgram() {
    var program = localStorage.getItem('dersProgrami');
    if (program) {
        document.querySelector('.haftalik-program table tbody').innerHTML = program;
        alert('Program yüklendi!');
    } else {
        alert('Kayıtlı program bulunamadı.');
    }
}

// Paylaşılabilir link oluşturma
function generateShareLink() {
    var program = JSON.stringify(document.querySelector('.haftalik-program table').innerHTML);
    var link = window.location.href + '?program=' + encodeURIComponent(program);
    alert('Paylaşılabilir link: ' + link);
}

// Derslere sürükleme özelliği ekleme
document.querySelectorAll('.ders').forEach(ders => {
    ders.addEventListener('dragstart', drag);
});

// Tablo hücrelerine bırakma özelliği ekleme
document.querySelectorAll('td').forEach(td => {
    td.addEventListener('drop', drop);
    td.addEventListener('dragover', allowDrop);
});
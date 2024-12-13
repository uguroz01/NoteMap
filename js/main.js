import { personIcon } from "./constants.js";
import { getIcon, getStatus } from "./helpers.js";
import { ui } from "./ui.js";

/*
Kullanıcının konum bilgisine erişmek için izin isteyeceğiz.Eğee izin vermezse bu konum bilgisine erişip ilgili konumu başlangıç noktası yapacağız.Eğer vermezse varsayılan bir konum belirle

*/

// Global değişkenler
var map;
let clickedCords;
let layer;
// ! Local den gelen veriyi js e çevir ama nesne yoksa boş bir dizi döndir
let notes = JSON.parse(localStorage.getItem("notes")) || [];
window.navigator.geolocation.getCurrentPosition(
  (e) => {
    loadMap([e.coords.latitude, e.coords.longitude], "Mevcut Konum");
  },
  (e) => {
    loadMap([39.921132, 32.861194], "Varsayılan Konum");
  }
);

function loadMap(currentPosition, msg) {
  //Harita kurulumu
  map = L.map("map", {
    zoomControl: false,
  }).setView(currentPosition, 10);

  // Haritanın ekrandan render edilmesini sağlar
  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution:
      '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  }).addTo(map);

  // Ekrana basılacak işaretlerin listelenebileceği bir katman oluştur...

  layer = L.layerGroup().addTo(map);

  // Zoom butonlarını ekranın sağ aşağıya taşı
  L.control
    .zoom({
      position: "bottomright",
    })
    .addTo(map);

  // İmleç Ekle
  L.marker(currentPosition, { icon: personIcon }).addTo(map).bindPopup(msg);

  // Haritaya tıklanma olyı gerçeşince
  map.on("click", onMapClick);

  // Haritaya notları render et
  renderMakers();
  renderNotes();
}

// ! harita tıklanma olayını izle ve tıklanılan noktanın koordinatlarına eriş

function onMapClick(e) {
  // Tıklanılma olayı

  clickedCords = [e.latlng.lat, e.latlng.lng];

  ui.aside.classList.add("add");
}

//  İptal butonu tıklanınca aside ı tekrar eski haline çeviren fonksiyon

ui.cancelBtn.addEventListener("click", () => {
  // aside a eklenen add clasını kaldır
  ui.aside.classList.remove("add");
});

// ! Formun gönderilme olayını izle ! //

ui.form.addEventListener("submit", (e) => {
  e.preventDefault();
  // Formun içerisindeki verilere eriştik
  const title = e.target[0].value;
  const date = e.target[1].value;
  const status = e.target[2].value;

  // Bir not objesi oluşturmak

  const newNote = {
    // 1970den itibaren geçen zamanın milisaniye cinsinden değerini aldık
    id: new Date().getTime(),
    title,
    date,
    status,
    coords: clickedCords,
  };

  //Notlar dizisine yeni notu ekle
  notes.unshift(newNote);
  // Localstorage ı güncelle
  localStorage.setItem("notes", JSON.stringify(notes));

  // Aside ı eski haline çevir
  ui.aside.classList.remove("add");

  // Formun içeriğini temizle
  e.target.reset();

  // Notları render et
  renderNotes();
  renderMakers();
});

function renderMakers() {
  // haritadaki diğer markerları temizle
  layer.clearLayers();
  // Notlar içindeki her bir öğe için bir işaretçi ekle
  notes.map((note) => {
    const icon = getIcon(note.status);
    // Her not için bir marker oluştur
    L.marker(note.coords, { icon }).addTo(layer).bindPopup(note.title);
  });
}

// ! Notları render eden fonksiyon

function renderNotes() {
  const noteCards = notes
    .map((note) => {
      // Tarih verisi istenilen formattav düzenlendi
      const date = new Date(note.date).toLocaleString("tr", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      });

      const status = getStatus(note.status);

      return `
      <li>
      <div>
        <p>${note.title}</p>
        <p>${date}</p>
      
        <p>${status}</p>
      </div>
      <div class="icons">
        <i data-id="${note.id}" class="bi bi-airplane-fill" id="fly"></i>
        <i data-id="${note.id}" class="bi bi-trash-fill" id="delete"></i>
      </div>

    </li>
    `;
    })
    .join("");
  // Oluşturulan kart eleanmlarını Html kısmına ekle
  ui.ul.innerHTML = noteCards;

  // Delete iconlarına tıklayınca silme işlemi yap
  document.querySelectorAll("li #delete").forEach((btn) => {
    btn.addEventListener("click", () => deleteNote(btn.dataset.id));
  });

  // Fly iconlarına tıklayınca o nota focusla
  document.querySelectorAll("li #fly").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.id;
      flyToLocation(id);
    });
  });
}
//!  silme ifonksiyonu
function deleteNote(id) {
  // Kullanıcıdan silme işlemi için onay al
  const res = confirm("Not silme işlemini onaylıyor musunuz ?");

  // console.log(res);

  if (res) {
    // id si bilinen elemanı notes dizisinden kaldır
    notes = notes.filter((note) => note.id !== parseInt(id));

    // lcoalStorage i güncelle
    localStorage.setItem("notes", JSON.stringify(notes));
    // güncel note ları render et
    renderNotes();
    // güncel iconları ları render et
    renderMakers();
  }
}

// ! Haritadaki ilgili nota hareket etmeyi sağlayan fonksiyon
function flyToLocation(id) {
  // id si bilinen eleamın notes dizisi içerisinden bul
  const note = notes.find((note) => note.id === parseInt(id));

  console.log(note);
  // Bulunan notun koordinatlarına uç
  map.flyTo(note.coords, 12);
}

// ! Arrow iconuna tıklanınca çalışacak fonksiyon

ui.arrow.addEventListener("click", () => {
  ui.aside.classList.toggle("hide");
});

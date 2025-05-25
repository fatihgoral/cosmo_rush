let animasyonID; 

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
canvas.style.display = "none"; 

let puan = 0, roketSayisi = 5, hak = 3; // Skor, roket sayısı, can sayısı gibi degiskenler
let ilerlemeHizi = 4.0; // hiz belirleme(nesneler icin)
let gemiGorunmez = false, bitisDurumu = false; // Gemi carpma durumunda anlık yok olmasi
let kareSayaci = 0; // Her kareyi sayar
let oncekiZaman = performance.now(); // FPS farkını hesabi icin kullandim

const solSinir = canvas.width * 0.2;
const sagSinir = canvas.width * 0.8;
const bolumGenisligi = (sagSinir - solSinir) / 3; // yon genislik ayari

const gemi = { // Oyuncunun gemisi nesnesş ve ozellikleri
  x: canvas.width / 2 - 25,
  y: canvas.height - 100,
  width: 50,
  height: 50,
  speedX: 6 // yan kısımlara kacis hızı
};

const gemiResmi = new Image(); // Gemi görseli eklemek icin kullandım assetten resim aldım
gemiResmi.src = "assets/img/player.png";

const arkaPlan = new Image(); // Arka plan görseli eklemek icin kullandım
arkaPlan.src = "assets/img/cosmo.jpg";

// Kapsül (zar) görselleri
const kapsulResimleri = [null, new Image(), new Image(), new Image()];
kapsulResimleri[1].src = "assets/img/dice1.png";
kapsulResimleri[2].src = "assets/img/dice2.png";
kapsulResimleri[3].src = "assets/img/dice3.png";

// asseten aldıgım ses dosyaları roket kapsul engel hepsinine se ekledim
const muzik = new Audio("assets/sounds/background.mp3");
const sesRoket = new Audio("assets/sounds/ates.mp3");
const sesKapsul = new Audio("assets/sounds/zar.mp3");
const sesEngel = new Audio("assets/sounds/engel.mp3");
muzik.loop = true; // Arka plan müziği sürekli çalsın

let muzikDurumu = false;
function muzikCal() {
  if (!muzikDurumu) {
    muzik.play().catch(() => {}); // muzigin bazen calmama veya taryıcı engellemesin diye ekledim
    muzikDurumu = true;
  }
}

let solaBasili = false, sagaBasili = false; 

// Tuş basıldığında yon ve a,d tuslari ile hareket ve f tusu ile mermi(roket) atma
// hem a, dtuslari hem de yer yon tuslari ile yapmak istedim
window.addEventListener("keydown", (e) => {
  if (e.key === "a" || e.key === "A" || e.key === "ArrowLeft") solaBasili = true;
  if (e.key === "d" || e.key === "D" || e.key === "ArrowRight") sagaBasili = true;
  if (e.key === "f" || e.key === "F") roketAt();
});

// Tuş basma islemi birakilinca gerceklesecek durumlar
// hem a,d tuslari hem de yon tusları ile yapmak istedim
window.addEventListener("keyup", (e) => {
  if (e.key === "a" || e.key === "A" || e.key === "ArrowLeft") solaBasili = false;
  if (e.key === "d" || e.key === "D" || e.key === "ArrowRight") sagaBasili = false;
});

// Ekrana tıklayınca roket fırlatmak icin sonradan eklendi
canvas.addEventListener("click", () => {
  canvas.focus();
  roketAt();
});

const engelListesi = [], kapsuller = [], roketler = [], yolCizgileri = []; // hareketli nesneler

function roketAt() { // Roket atmak icmek fonksiyon ve icinde renk hiz vs gibi degiskenler var
  if (roketSayisi > 0 && !bitisDurumu) {
    roketler.push({
      x: gemi.x + gemi.width / 2 - 5, // roketin apsis degeri
      y: gemi.y, // roketin ordinat degeri
      width: 10,
      height: 30,
      speed: 30, // roket gidisi belli olsun diye 30 sectim
      color: "#00ff00"
    });
    roketSayisi--;
    document.getElementById("ammo").textContent = roketSayisi;
    sesRoket.currentTime = 0;
    sesRoket.play(); // rokete de ses ekledim
  }
}

function temasVarMi(a, b) { // Nesneler carpisma durumu carpismalarin hepsi bulunuyor
  return a.x < b.x + b.width &&
         a.x + a.width > b.x &&
         a.y < b.y + b.height &&
         a.y + a.height > b.y;
}

function kapsulEkle() { // kapsul üretim fonksiyonu
  if (kapsuller.length < 5) {
    kapsuller.push({
      x: Math.random() * (sagSinir - solSinir - 40) + solSinir,
      y: -40, // oyun mekanigi geri yukarıdan girmeli
      width: 30,
      height: 30,
      value: Math.floor(Math.random() * 3) + 1  // 1 ile 3 arasini sahlamak icin randomu boyle kullandım
    });
  }
}

function engelUret() { // engel uretme fonksiyonu
  if (engelListesi.length < 12) {// engel sayisi kontolu icin kullandim
    const bolum = bolumGenisligi;
    const konum = Math.floor(Math.random() * 3);
    let genislik, x;
// sag sol orta serit icin farklı engel boyları tasarladım oyun mekanigi ve zorlugu acisindan
// bunu yapmamizin sebebi orta seridin dar tasarlanmıs olması 
    if (konum === 0) {
      genislik = bolum * 0.4;
      x = solSinir + (bolum - genislik) / 2;
    } else if (konum === 1) {
      genislik = bolum * 0.31;
      x = solSinir + bolum + (bolum - genislik) / 2;
    } else {
      genislik = bolum * 0.4;
      x = solSinir + 2 * bolum + (bolum - genislik) / 2;
    }

    engelListesi.push({ // listeye engel eklenmesi
      x: x,
      y: -20,
      width: genislik,
      height: 15,
      color: "#ff3c3c" // renk 
    });
  }
}

function seritCizgisiEkle() { // Yolda gitme hissiyatı eklemek icin seerit ekledim  kesikli olmasını istedim
  yolCizgileri.push({ x: canvas.width / 2 - 60, y: -40, width: 8, height: 30 });
  yolCizgileri.push({ x: canvas.width / 2 + 52, y: -40, width: 8, height: 30 });
}

function oyunuCiz(zaman) {
  const deltaTime = (zaman - oncekiZaman) / 16.67; // fps farkı ayarı icin
  oncekiZaman = zaman;

  ctx.clearRect(0, 0, canvas.width, canvas.height); // ekran clear islemi 
  ctx.drawImage(arkaPlan, 0, 0, canvas.width, canvas.height); // background cizme islemi

  ctx.fillStyle = "#00ffccaa";
  ctx.fillRect(solSinir, 0, 2, canvas.height);
  ctx.fillRect(sagSinir - 2, 0, 2, canvas.height);

  if (kareSayaci % 15 === 0) seritCizgisiEkle(); // 15 karede bir satir eklenmesi

  yolCizgileri.forEach((s, i) => {
    s.y += ilerlemeHizi * deltaTime; // seritlerin asagi dogru gitmesi
    ctx.fillStyle = "#cccccc99";
    ctx.fillRect(s.x, s.y, s.width, s.height);
    if (s.y > canvas.height) yolCizgileri.splice(i, 1); // ekrandan cıkanlari yok edilmesi
  });
// sag sol harekkete guncelleme islemleri
  if (solaBasili && gemi.x > solSinir) gemi.x -= gemi.speedX;
  if (sagaBasili && gemi.x + gemi.width < sagSinir) gemi.x += gemi.speedX;
  if (!gemiGorunmez) ctx.drawImage(gemiResmi, gemi.x, gemi.y, gemi.width, gemi.height); // gemi cizme islemi
// her 30 ve 45 karede sirasiyla kapsül ve engel üretmek
  if (kareSayaci % 30 === 0) kapsulEkle();
  if (kareSayaci % 45 === 0) engelUret();

  kapsuller.forEach((z, i) => {
    z.y += ilerlemeHizi * deltaTime;// oyun mekaniginden dolayı oyunu asagi kisma hareket ettirilmesi
    ctx.drawImage(kapsulResimleri[z.value], z.x, z.y, z.width, z.height);
    if (temasVarMi(gemi, z)) {
      ilerlemeHizi = 4.0 + z.value * 0.5;
      puan += z.value;
      kapsuller.splice(i, 1);
      sesKapsul.currentTime = 0;
      sesKapsul.play();
      document.getElementById("score").textContent = puan;
    }
    if (z.y > canvas.height) kapsuller.splice(i, 1); // asagiya inen kapslu yok et
  });

  engelListesi.forEach((e, i) => {
    e.y += ilerlemeHizi * deltaTime; // bu sefer de engeli asagi ind
    ctx.fillStyle = e.color;
    ctx.fillRect(e.x, e.y, e.width, e.height); // engel cizmek
    if (!gemiGorunmez && temasVarMi(gemi, e)) { // eger gemi engelle carpistiysa
      hak--;
      puan = 0; // skoru sıfırla oyun zor ve uzun olsun aynı zamanda anlamli olsun
      document.getElementById("hits").textContent = 3 - hak;
      document.getElementById("score").textContent = puan;
      engelListesi.splice(i, 1);
      sesEngel.currentTime = 0;
      sesEngel.play(); // ses ekleme kismi
      gemiGorunmez = true; // anlık kısa gemi gorumezligi icin
      setTimeout(() => { gemiGorunmez = false; }, 500);
      if (hak <= 0) { // can biterse ıyun kaybetme durumu
        kayipEkrani();
        return;
      }
    }
    if (e.y > canvas.height) engelListesi.splice(i, 1); // disair cikan engelleri silmek zorundayız 
  });
// roketin yukari dogru hareketi ve cizilmesi
  roketler.forEach((m, i) => {
    m.y -= m.speed * deltaTime;
    ctx.fillStyle = m.color;
    ctx.fillRect(m.x, m.y, m.width, m.height);
    if (m.y + m.height < 0) {
      roketler.splice(i, 1); // roketi silme islemi
      return;
    }
    engelListesi.forEach((e, j) => {
      if (temasVarMi(m, e)) { // roketin engele carpti ise
        puan += 3;
        document.getElementById("score").textContent = puan;
        engelListesi.splice(j, 1); // engeli silme islemi
        roketler.splice(i, 1); // roketi silme islmi
      }
    });
  });
// zaman gectikce yani roket hareket ettikce puan artmali ki oyunda ilerleminin mantıgı olsun
  if (kareSayaci % 100 === 0) {
    puan += 1;
    document.getElementById("score").textContent = puan;
  }
// 100 puana ulasan kazansin dedim
  if (puan >= 100 && !bitisDurumu) {
    zaferEkrani();
    return;
  }

  kareSayaci++;// yeni kare ve sonraki kare icin yazdım
  if (!bitisDurumu) animasyonID = requestAnimationFrame(oyunuCiz);
}

function zaferEkrani() { // Oyunu zafer ile tamamlnınca cıkacak kısım
  bitisDurumu = true;
  cancelAnimationFrame(animasyonID);// asagidakiler zafer ekrani ve buton icin yazildi
  document.getElementById("bitisBaslik").innerText = "🎉 Tebrikler, Galaktik Yarış Bitti!";
  document.getElementById("bitisAlt").innerText = `Skor: ${puan}`;
  document.getElementById("bitisEkrani").style.display = "block";
  const btn = document.getElementById("restartBtn");
  btn.style.display = "block";
  btn.style.top = `${canvas.offsetTop + canvas.height / 2 + 90}px`;
}

function kayipEkrani() { // Oyunu kaybedince gösterilen ekran
  bitisDurumu = true;
  cancelAnimationFrame(animasyonID);// asagıdakiler  bitirme ekranive butonu gostermek icin yazild
  document.getElementById("bitisBaslik").innerText = "💥 OYUN BİTTİ";
  document.getElementById("bitisAlt").innerText = "Tekrar oynamak için aşağıdaki butona bas";
  document.getElementById("bitisEkrani").style.display = "block";
  const btn = document.getElementById("restartBtn");
  btn.style.display = "block";
  btn.style.top = `${canvas.offsetTop + canvas.height / 2 + 90}px`;
}

function restartGame() { // Oyun sıfırlansın diye degiskenleri en bas durumuna getirme
  puan = 0;
  roketSayisi = 5;
  hak = 3;
  kareSayaci = 0;
  ilerlemeHizi = 4.0;
  gemiGorunmez = false;
  bitisDurumu = false;
  muzikDurumu = false;
// nesneleri temizlemek
  engelListesi.length = 0;
  kapsuller.length = 0;
  roketler.length = 0;
  yolCizgileri.length = 0;
 // gecis kisimlari icin
  document.getElementById("score").textContent = 0;
  document.getElementById("hits").textContent = 0;
  document.getElementById("ammo").textContent = 5;
  document.getElementById("startScreen").style.display = "none";
  document.getElementById("restartBtn").style.display = "none";
  document.getElementById("bitisEkrani").style.display = "none";
  canvas.style.display = "block";

  canvas.focus();
  oncekiZaman = performance.now(); // zamani sifirlamak icin 
  requestAnimationFrame(oyunuCiz); // oyunu baslatmak icin
}

// Dokunmatik islemler ve mobil telefonlarda uyum icin sonradan ekledim
// parmak kaydırma ve cekme islemleri yapildi
let dokunX = null;
canvas.addEventListener("touchstart", (e) => { dokunX = e.touches[0].clientX; });
canvas.addEventListener("touchmove", (e) => {
  if (!dokunX) return;
  let deltaX = e.touches[0].clientX - dokunX;
  if (deltaX > 40) { sagaBasili = true; solaBasili = false; } // saga gecmek icin
  else if (deltaX < -40) { solaBasili = true; sagaBasili = false; } // sola gecmek icin
});
canvas.addEventListener("touchend", () => { solaBasili = false; sagaBasili = false; });
canvas.addEventListener("touchstart", (e) => { if (e.touches.length === 1) roketAt(); });

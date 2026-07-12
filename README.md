# OKAN95 — Windows 2000 tarzı portfolyo

Statik, framework'süz bir "masaüstü" portfolyo sitesi. Sürükleyip bırakılabilir pencereler, Start menüsü, taskbar — GitHub Pages'te doğrudan yayınlanabilir.

## İçeriği doldurma

Her şey `index.html` içindeki `<template id="tpl-...">` bloklarında:

- `tpl-about` — Hakkımda metni
- `tpl-projects` + `js/script.js` içindeki `PROJECTS` — proje listesi ve detay şablonu (`tpl-project-detail`)
- `tpl-music` + `js/script.js` içindeki `TRACKS` — müzik listesi ve detay şablonu (`tpl-track-detail`, gerçek ses dosyası/embed için)
- `tpl-resume` — özgeçmiş metni / `assets/cv.pdf` linki
- `tpl-contact` — e-posta ve sosyal linkler
- `tpl-browser` — sosyal medya linkleri

İkon değiştirmek istersen `assets/icon-*.svg` dosyalarını düzenle ya da değiştir.

Yeni bir "uygulama" (pencere) eklemek için `js/script.js` içindeki `APPS` objesine bir kayıt ekle, `index.html`'e karşılık gelen masaüstü ikonunu ve `<template>` bloğunu ekle.

## Yerelde çalıştırma

Build adımı yok. Herhangi bir statik sunucuyla açman yeterli:

```bash
python3 -m http.server 8000
```

sonra `http://localhost:8000` adresine git.

## GitHub Pages ile yayınlama

1. Bu klasörü bir GitHub reposuna push'la.
2. Repo → Settings → Pages → Source: "Deploy from a branch", branch: `main`, klasör: `/ (root)`.
3. Birkaç dakika içinde `https://<kullanıcı-adı>.github.io/<repo-adı>/` adresinde yayında olur.

# 🤖 Moduláris AI Asszisztens SAAS

Egyetlen script belinkelésével működő intelligens weboldal asszisztens, amely Google Gemini API-val működik.

## ✨ Főbb funkciók

- **Egyszerű integráció**: Csak egy `<script>` tag belinkelése szükséges
- **Intelligens válaszok**: A Google Gemini API-val működő asszisztens ismeri a weboldal tartalmát
- **Interaktív navigáció**: Automatikus görgetés és elem kiemelés
- **Okos oldal feltérképezés**: Feltérképezi a weboldal struktúráját és tartalmát
- **Testreszabható viselkedés**: Személyiség, válaszstílus, nyelv beállítható
- **Modern UI**: Szép, reszponzív chat widget animációkkal
- **Analitika**: Részletes statisztikák a felhasználói interakciókról
- **Perzisztens memória**: A brain.json fájlban tárolja a tanultakat

## 🚀 Gyors kezdés

### 1. Integráció

Csak add hozzá ezt a sort a HTML fájlodhoz:

```html
<script src="script.js"></script>
```

### 2. API kulcs beállítása

Az első használatkor a rendszer automatikusan kéri a Google Gemini API kulcsot. 

Gemini API kulcs beszerzése:
1. Menj a [Google AI Studio](https://makersuite.google.com/app/apikey) oldalra
2. Hozz létre egy új API kulcsot
3. Másold be a kulcsot amikor a rendszer kéri

### 3. Testreszabás (opcionális)

Módosítsd a `brain.json` fájlt a saját igényeid szerint:

```json
{
  "config": {
    "behavior": {
      "personality": "Itt állítsd be az asszisztens személyiségét",
      "tone": "barátságos és professzionális",
      "language": "hu"
    },
    "features": {
      "autoScan": true,
      "deepScan": true,
      "cacheResults": true,
      "floatingWidget": true
    }
  }
}
```

## 🚀 Új funkciók (v1.1.0)

### ✨ Interaktív navigáció
- **Automatikus görgetés**: "Görgess az akciókhoz" típusú kérésekre
- **Vizuális kiemelés**: Elemek automatikus megjelölése highlight effektussal
- **Intelligens elem keresés**: Főcímek, ID-k, class-ok és szöveg alapján
- **Smooth görgetés**: Sima animációval történő oldal navigáció

### 🎯 Példa interakciók
```
Felhasználó: "Görgess le az akciókhoz"
AI: "Természetesen! Megmutatom az akciókat." + automatikus görgetés

Felhasználó: "Hol található a kapcsolat rész?"  
AI: "Itt a kapcsolat információk!" + görgetés + kiemelés

Felhasználó: "Mutasd meg a termékeket"
AI: "Íme a termékeink!" + navigáció a termék szekcióhoz
```

### 🔧 Fejlesztői funkciók
```javascript
// Új API metódusok
AIAssistant.scrollTo("selector");     // Manuális görgetés
AIAssistant.highlight("selector");    // Elem kiemelése
AIAssistant.navigate("url");          // Oldal navigáció
```

## 🔧 Programozói API

JavaScript-ből is elérheted a funkciókat:

```javascript
// Viselkedés módosítása
AIAssistant.updateBehavior({
    personality: "Vicces és barátságos vagyok",
    tone: "informális"
});

// API kulcs beállítása
AIAssistant.setAPIKey("your-gemini-api-key");

// Analitika lekérése
const stats = AIAssistant.getAnalytics();
console.log('Összes kérdés:', stats.totalQueries);
console.log('Népszerű kérdések:', stats.popularQuestions);

// Weboldal újrafeltérképezése
AIAssistant.rescan();

// Manuális görgetés elemhez
AIAssistant.scrollTo("selector");

// Elem kiemelése
AIAssistant.highlight("selector");
```

## 🎯 Interaktív navigációs funkciók

Az AI asszisztens most már képes:

### 🔄 Automatikus görgetés
- **"Görgess az akciókhoz"** → Automatikusan odagörgeti az oldalt
- **"Mutasd meg a kapcsolat részt"** → Megtalálja és odanavigál
- **"Vigyél a termékekhez"** → Simán görgeti az oldalt a kért részhez

### ✨ Vizuális kiemelés
- **"Jelöld ki az akciókat"** → Vizuálisan kiemeli az elemeket
- **"Mutasd hol vannak a kategóriák"** → Highlight effektussal jelzi
- **Automatikus 2-3 másodperces kiemelés** minden görgetésnél

### 🧭 Intelligens elem felismerés
- **Főcímek alapján**: "h1, h2, h3" elemek
- **ID és class alapján**: "akcio", "contact", "about" stb.
- **Szöveg tartalom alapján**: ":contains()" keresés
- **Navigációs linkek**: Menu és nav elemek

### 📍 Támogatott parancsok
```javascript
// Példa kérések:
"Görgess le az akciókhoz"
"Mutasd meg a népszerű kategóriákat" 
"Vigyél a támogatás részhez"
"Jelöld ki a termékeket"
"Hol található a kapcsolat?"

## 📊 Analitika

A rendszer automatikusan gyűjti és tárolja:

- Összes lekérdezés száma
- Népszerű kérdések listája
- Felhasználói elégedettség
- Weboldal térképezési eredmények
- Beszélgetés történet

## 🎨 UI Testreszabás

A chat widget teljes mértékben testreszabható CSS-sel. Az összes stílus inline módon van beépítve, de felülírható:

```css
.ai-chat-bubble {
    background: your-custom-gradient !important;
}

.ai-chat-window {
    width: 400px !important;
    height: 600px !important;
}
```

## 🔍 Weboldal térképezés és navigáció

A rendszer automatikusan:

1. **Elemzi az aktuális oldal tartalmát** - Főcímek, szekciók, linkek
2. **Megkeresi az összes belső linket** - Navigációs struktúra feltérképezése  
3. **Összegyűjti a fontos elemeket** - ID-k, class-ok, szöveg tartalom alapján
4. **Elmenti a navigációs elemeket** - Gyors elérés és görgetés céljából
5. **Cacheli az eredményeket** - Jobb teljesítmény és gyorsabb válaszok
6. **Interaktív görgetés** - Automatikus navigáció a kért elemekhez
7. **Vizuális kiemelés** - Elemek megjelölése highlight effektussal

## 🛡️ Adatvédelem

- Minden adat helyileg tárolódik (localStorage)
- Csak a szükséges információk mennek a Gemini API-hoz
- Nincs külső szerver kommunikáció a Google API-n kívül
- A beszélgetések csak a böngészőben maradnak

## 📱 Reszponzív design

- Mobil és desktop kompatibilis
- Touch-friendly vezérlők
- Automatikus méretezés
- Modern, hozzáférhető UI

## 🚀 Telepítés bármilyen weboldalra

1. Töltsd le a `script.js` és `brain.json` fájlokat
2. Helyezd őket a weboldal gyökérkönyvtárába
3. Add hozzá a script taget az HTML-hez
4. Kész! Az AI asszisztens automatikusan elindul

## 🔧 Testreszabási lehetőségek

### Személyiség beállítása

```javascript
AIAssistant.updateBehavior({
    personality: "Szakértő e-commerce asszisztens vagyok, aki segít a vásárlásban",
    tone: "segítőkész és türelmes",
    language: "hu"
});
```

### Funkciók be/kikapcsolása

```json
{
  "config": {
    "features": {
      "autoScan": true,        // Automatikus weboldal térképezés
      "deepScan": false,       // Mélyebb tartalom elemzés
      "cacheResults": true,    // Eredmények cachelése
      "floatingWidget": true   // Lebegő chat widget
    }
  }
}
```

## 🎯 Use case-ek

- **E-commerce oldalak**: Termékkeresés, vásárlási segítség, automatikus görgetés termékekhez
- **Céges weboldalak**: Gyakori kérdések, navigációs segítség, kapcsolat keresés
- **Dokumentációs oldalak**: Tartalom keresés, automatikus szekció navigáció
- **Portfolió oldalak**: Projekt információk, kapcsolatfelvétel, munka bemutatása
- **Oktatási oldalak**: Kurzus segítség, anyag magyarázat, fejezetek közötti navigáció
- **Szolgáltató oldalak**: Szolgáltatás keresés, árak megjelenítése, elérhetőség

## 🔄 Frissítések

A SAAS automatikusan frissíti magát amikor új funkciók érkeznek. A brain.json verziókövetése biztosítja a kompatibilitást.

## 📞 Támogatás

Ha bármilyen kérdésed van, írj a chat ablakba: 
- **"Hogyan működik ez a rendszer?"** - Részletes működés magyarázat
- **"Görgess az akciókhoz"** - Automatikus navigáció tesztelése  
- **"Mutasd meg a kapcsolat részt"** - Interaktív elem keresés
- **"Hol találom a termékeket?"** - Oldal navigációs segítség

Az AI asszisztens részletesen elmagyarázza és meg is mutatja!

---

**Készítette**: VNorman1
**Verzió**: 1.1.0 - Interaktív navigációval  
**Új funkciók**: Automatikus görgetés, elem kiemelés, intelligens navigáció

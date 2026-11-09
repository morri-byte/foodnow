# 🍽️ FoodNow

Danmarks yndlingsretter i én app: **175 opskrifter** fordelt på 80 danske favoritter, 45 salater (30 kendte klassikere), 20 vegetarretter og 30 veganske retter. Appen har ugeplan, indkøbsliste, kokketilstand og vinforslag.

## Indhold
| Fane | Indhold |
|---|---|
| **Opdag** | Dagens forslag, 🎲 "Overrask mig", Danmarks top 10, sæsonretter (jul, vinter, sommer), hurtige hverdagsretter og "Hvad har jeg i køleskabet?" |
| **Retter** | 80 retter: 40 danske klassikere og 40 internationale favoritter. Filtre for dansk/verden, kylling/okse/svin/fisk/vegetar, under 30 min, under 600 kcal, børnevenlig og favoritter |
| **Salater** | 45 salater med de kendte først: cæsar, græsk, waldorf, caprese, niçoise, Cobb, hønsesalat, italiensk salat, panzanella, fattoush m.fl. |
| **Grønt** | 🥚 Vegetar: 20 retter med ost og æg (shakshuka, saag paneer, halloumiburger, margherita ...) · 🌱 Vegansk: 30 retter uden animalske produkter |
| **Min uge** | Ugeplan med dage (🎲 kan fylde tomme hverdage ud), samlet indkøbsliste sorteret efter supermarkedets afdelinger, og favoritter |

**Hver opskrift har:** valg af antal personer (1-16; mængderne regnes om), kalorier pr. person, sværhedsgrad, 🍷 vinforslag og 🧃 alkoholfrit alternativ, tip til at spare tid, kokketilstand med timer og notifikation, deling og "Prøv også".

**Andet:** dag- og nattilstand, søgning i navne og ingredienser, haptisk feedback, skærmen holdes tændt under madlavning, og det hele virker uden internet. Alt gemmes kun på telefonen, og appen indsamler ingen data.

## Research: sådan blev de 80 retter valgt
- **Stegt flæsk med persillesovs** blev kåret til nationalret i 2014 med 44 % af 63.263 stemmer, foran smørrebrød og hakkebøf ([lex.dk](https://lex.dk/Danmarks_nationalret_og_debatten_om_dansk_madkultur), [Landbrugsavisen](https://landbrugsavisen.dk/stegt-flaesk-kaaret-som-danmarks-nationalret-10167)).
- **Arlas tal om hverdagsretter:** pasta med kødsovs 59 %, stegt kylling 57 %, lasagne og frikadeller 49 %.
- **Landbrug & Fødevarer (2024):** pizza, kyllingeretter og rugbrød er det, flest har spist til aftensmad dagen før, efterfulgt af bøf, pasta og burger ([analyse](https://lf.dk/media/xjqmowlp/markedsanalyse_danskernes-aftensmad-i-2024_5022025.pdf)).
- Resten af listen består af de traditionelle danske klassikere (frikadeller, flæskesteg, boller i karry, hakkebøf, biksemad osv.) og de internationale retter, der fylder mest i danske køkkener.

"Danmarks favoritter" (top 10) er sammensat ud fra kilderne ovenfor. Det er ikke én officiel rangliste.

Alle opskrifter er skrevet til FoodNow. Ingen tekster eller billeder er kopieret fra andre sider. Kalorier er vejledende skøn.

## Billeder
Hver ret har sin egen tegnede illustration, som laves af `www/js/art.js` ud fra rettens farver. Den kræver ingen billedfiler og ingen rettigheder.
**Rigtige fotos senere:** læg billedet i `www/billeder/` og tilføj `img:"billeder/stegt-flaesk.jpg"` på retten i `www/data/*.js`. Så bruges fotoet automatisk.

## Test appen

### På mobilen nu (webversion)
Åbn **https://foodnow-app.netlify.app** i Safari på iPhone, tryk **Del** og vælg **Føj til hjemmeskærm**. Så åbner FoodNow i fuld skærm med eget ikon.
(Notifikationer, vibration og "skærmen holdes tændt" virker kun i den rigtige iPhone-app.)

Ny webversion: læg `www/` op igen på Netlify-projektet **foodnow-app**.

### Rigtig iPhone-app via TestFlight (med Mac)
1. Opret en **Apple Developer**-konto (99 USD/år) på https://developer.apple.com/programs/. Godkendelsen kan tage 1-2 dage.
2. På Mac'en: installer **Xcode** fra App Store og **Node.js** fra https://nodejs.org.
3. I Terminal:
   ```bash
   git clone https://github.com/morri-byte/foodnow.git
   cd foodnow
   npm install
   npx cap sync ios
   npx cap open ios
   ```
4. **Hurtig test på din egen iPhone (gratis, uden Developer-konto):** tilslut iPhonen med kabel, vælg den øverst i Xcode, vælg dit Apple-ID under *Signing & Capabilities → Team* og tryk ▶︎. På iPhonen: *Indstillinger → Generelt → VPN og enhedsadministration* → stol på udvikleren. (Gratis-versionen virker i 7 dage ad gangen.)
5. **TestFlight (med Developer-konto):** opret appen i https://appstoreconnect.apple.com (Bundle ID `dk.foodnow.app`). I Xcode: vælg *Any iOS Device* → **Product › Archive** → **Distribute App** → **App Store Connect** → **Upload**. Efter 10-30 min. findes buildet under **TestFlight** i App Store Connect. Tilføj dig selv som tester, og installer appen **TestFlight** fra App Store på iPhonen.

## Byg og upload til App Store
Kræver en Mac med Xcode 16+ og en Apple Developer-konto (99 USD om året).
```bash
git clone https://github.com/morri-byte/foodnow.git
cd foodnow
npm install
npx cap sync ios
npx cap open ios
```
1. I Xcode vælger du target **App**, derefter **Signing & Capabilities**, og vælger dit Team. Bundle ID er `dk.foodnow.app`; ret det, hvis det er optaget (også i `capacitor.config.json`).
2. Test på din iPhone (tilslut den og tryk ▶︎). Tjek notifikation, vibration og at skærmen holdes tændt.
3. I **App Store Connect** opretter du en ny app: navnet "FoodNow" (eller "FoodNow – Danske opskrifter", hvis navnet er taget), primært sprog dansk.
4. Upload buildet: vælg **Any iOS Device**, så **Product › Archive**, derefter **Distribute** og **App Store Connect**.
5. Udfyld App Store-siden:
   - **Privatliv:** "Data Not Collected".
   - **Aldersgrænse:** vælg at appen nævner alkohol ("Infrequent/Mild Alcohol References") på grund af vinforslagene.
   - **Skærmbilleder:** 6,9" iPhone.
   - **URL'er:** Apple kræver en support-URL og en URL til privatlivspolitik. En simpel side er nok.

## Til senere: indtjening via reklamer og partnere
Appen har bevidst **ingen reklamer i version 1**. Når der er brugere, er disse oplagte muligheder:
- **"Bestil varerne"-knap på indkøbslisten** (nemlig.com, Bilka To Go, Rema 1000 m.fl.) via affiliate eller partneraftale. Listen er allerede sorteret efter afdelinger, så den egner sig til det. Det er den mest naturlige indtægt.
- **Sponsoreret "Ugens ret"** på forsiden, fx fra en supermarkedskæde eller en råvareproducent.
- **Vinforslag** kan kobles til en vinhandel.

Reklamer der bruger sporing kræver Apples **App Tracking Transparency**-spørgsmål og **GDPR-samtykke**, og privatlivsoplysningerne i App Store skal opdateres. Kontekstuelle annoncer uden sporing, fx "Ugens tilbud" fra en partner, kræver ingen af delene og er nemmest at starte med.

## Struktur
```
www/index.html          skærme og tab-bar
www/css/app.css         designsystem (lys og mørk)
www/js/app.js           logik: navigation, lister, opskrift, ugeplan, indkøb, køleskab, kokketilstand
www/js/art.js           tegnede ret-illustrationer
www/data/*.js           de 175 opskrifter (4 personer som grundmængde)
ios/                    Xcode-projekt (Capacitor 8, Swift Package Manager)
```

/* =========================================================
   FINN LIFE APP
   Fokus:
   - Todos
   - Tagesplanung
   - Zeitplanung
   - Kalender
   - LocalStorage
   - Journal
   - Gefühle
   - Sport
   - Läufe
   - Schwedisch
   ========================================================= */

const KEY = "finn-life-v2";

const uid = () =>
  crypto?.randomUUID?.() ||
  Date.now() + "-" + Math.random();

const defaultState = {
  profile: {
    name: "Finn",
    greeting: "Heute ist ein guter Tag, um weiter an dir zu arbeiten."
  },

  settings: {
    units: "metric",
    weeklySportGoal: 5,
    weeklyRunGoal: 3
  },

  journal: [],
  feelings: [],
  workouts: [],
  runs: [],

  habits: [
    { id: "h1", name: "Training", done: {} },
    { id: "h2", name: "Laufen", done: {} },
    { id: "h3", name: "Schwedisch", done: {} },
    { id: "h4", name: "Journal", done: {} }
  ],

  goals: [
    {
      id: "g1",
      title: "Konstant trainieren",
      target: 5,
      current: 3,
      unit: "Einheiten",
      category: "Sport"
    },
    {
      id: "g2",
      title: "Schwedisch dranbleiben",
      target: 20,
      current: 12,
      unit: "Lektionen",
      category: "Lernen"
    }
  ],

  swedish: {
    lesson: 12,
    progress: 32,
    totalMinutes: 0
  },

  events: [],

  /*
   * Neues Todo-System
   */
  todos: []
};

let state = load();
let route = "home";


/* =========================================================
   STORAGE
   ========================================================= */

function load() {
  try {
    const saved = JSON.parse(
      localStorage.getItem(KEY) || "{}"
    );

    return {
      ...structuredClone(defaultState),
      ...saved,

      profile: {
        ...defaultState.profile,
        ...(saved.profile || {})
      },

      settings: {
        ...defaultState.settings,
        ...(saved.settings || {})
      },

      habits:
        saved.habits ||
        structuredClone(defaultState.habits),

      goals:
        saved.goals ||
        structuredClone(defaultState.goals),

      swedish: {
        ...defaultState.swedish,
        ...(saved.swedish || {})
      },

      journal: saved.journal || [],
      feelings: saved.feelings || [],
      workouts: saved.workouts || [],
      runs: saved.runs || [],
      events: saved.events || [],
      todos: saved.todos || []
    };
  } catch {
    return structuredClone(defaultState);
  }
}


function save() {
  localStorage.setItem(KEY, JSON.stringify(state));
}


/* =========================================================
   HELPERS
   ========================================================= */

function esc(v = "") {
  return String(v).replace(
    /[&<>"']/g,
    c => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    }[c])
  );
}


function dateKey(d = new Date()) {
  const x = new Date(d);

  const year = x.getFullYear();
  const month = String(x.getMonth() + 1).padStart(2, "0");
  const day = String(x.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}


function formatDate(d) {
  return new Intl.DateTimeFormat(
    "de-DE",
    {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    }
  ).format(new Date(d));
}


function startOfWeek(d = new Date()) {
  const x = new Date(d);
  const n = (x.getDay() + 6) % 7;

  x.setHours(0, 0, 0, 0);
  x.setDate(x.getDate() - n);

  return x;
}


function weekKeys() {
  const s = startOfWeek();

  return Array.from(
    { length: 7 },
    (_, i) => {
      const d = new Date(s);

      d.setDate(s.getDate() + i);

      return dateKey(d);
    }
  );
}


function sum(a) {
  return a.reduce(
    (x, y) => x + y,
    0
  );
}


function avg(a) {
  return a.length
    ? sum(a) / a.length
    : 0;
}


function minutesToHM(m) {
  const h = Math.floor(m / 60);
  const min = Math.round(m % 60);

  return `${h}:${String(min).padStart(2, "0")} h`;
}


function pace(seconds, km) {
  return km
    ? `${Math.floor((seconds / km) / 60)}:${String(
        Math.round((seconds / km) % 60)
      ).padStart(2, "0")} /km`
    : "—";
}


function timeMMSS(s) {
  return `${Math.floor(s / 60)}:${String(
    Math.round(s % 60)
  ).padStart(2, "0")}`;
}


function weeklyData() {
  const keys = weekKeys();

  const workouts = state.workouts.filter(
    x => keys.includes(x.date)
  );

  const runs = state.runs.filter(
    x => keys.includes(x.date)
  );

  const journal = state.journal.filter(
    x => keys.includes(x.date)
  );

  return {
    keys,
    workouts,
    runs,
    journal
  };
}

/* =========================================================
   BIBELVERS – LUTHER 1912 / ECHTER ZUFALLSVERS
   ========================================================= */

const BIBLE_CACHE_KEY = "finn-bible-verse-v4";

const BIBLE_API =
  "https://bolls.life/get-random-verse/LUT/";

const BIBLE_BOOKS_API =
  "https://bolls.life/get-books/LUT/";

/* ---------------------------------------------------------
   Cache lesen
   --------------------------------------------------------- */

function getBibleCache() {
  try {
    return JSON.parse(
      localStorage.getItem(BIBLE_CACHE_KEY) || "null"
    );
  } catch {
    return null;
  }
}

/* ---------------------------------------------------------
   Deutsche Namen der Bibelbücher
   Bolls verwendet numerische Buch-IDs.
   --------------------------------------------------------- */

const bibleBookNames = {

  1: "1. Mose",
  2: "2. Mose",
  3: "3. Mose",
  4: "4. Mose",
  5: "5. Mose",

  6: "Josua",
  7: "Richter",
  8: "Ruth",

  9: "1. Samuel",
  10: "2. Samuel",

  11: "1. Könige",
  12: "2. Könige",

  13: "1. Chronik",
  14: "2. Chronik",

  15: "Esra",
  16: "Nehemia",
  17: "Esther",
  18: "Hiob",

  19: "Psalm",
  20: "Sprüche",
  21: "Prediger",
  22: "Hohelied",

  23: "Jesaja",
  24: "Jeremia",
  25: "Klagelieder",
  26: "Hesekiel",
  27: "Daniel",

  28: "Hosea",
  29: "Joel",
  30: "Amos",
  31: "Obadja",
  32: "Jona",
  33: "Micha",
  34: "Nahum",
  35: "Habakuk",
  36: "Zephanja",
  37: "Haggai",
  38: "Sacharja",
  39: "Maleachi",

  40: "Matthäus",
  41: "Markus",
  42: "Lukas",
  43: "Johannes",
  44: "Apostelgeschichte",

  45: "Römer",
  46: "1. Korinther",
  47: "2. Korinther",
  48: "Galater",
  49: "Epheser",
  50: "Philipper",
  51: "Kolosser",

  52: "1. Thessalonicher",
  53: "2. Thessalonicher",

  54: "1. Timotheus",
  55: "2. Timotheus",

  56: "Titus",
  57: "Philemon",
  58: "Hebräer",
  59: "Jakobus",

  60: "1. Petrus",
  61: "2. Petrus",

  62: "1. Johannes",
  63: "2. Johannes",
  64: "3. Johannes",

  65: "Judas",
  66: "Offenbarung"
};


/* ---------------------------------------------------------
   Cache speichern
   --------------------------------------------------------- */

function saveBibleCache(data) {
  try {
    localStorage.setItem(
      BIBLE_CACHE_KEY,
      JSON.stringify(data)
    );
  } catch {}
}

/* ---------------------------------------------------------
   Zufallsvers laden
   --------------------------------------------------------- */

async function loadBibleVerse() {

  const today =
    dateKey();


  /*
   * Prüfen, ob wir für heute bereits
   * einen Vers gespeichert haben.
   */

  const cached =
    getBibleCache();


  if (
    cached &&
    cached.date === today &&
    cached.text &&
    cached.reference
  ) {

    return cached;

  }


  try {

    /*
     * Echten Zufallsvers von der API holen
     */

    const response =
      await fetch(
        BIBLE_API,
        {
          method: "GET",
          cache: "no-store"
        }
      );


    if (!response.ok) {

      throw new Error(
        `Bible API Fehler: ${response.status}`
      );

    }

    const bookName =
       bibleBookNames[data.book] ||
       `Buch ${data.book}`;


    const data =
      await response.json();


    /*
     * Prüfen, ob die API vernünftige Daten
     * zurückgegeben hat.
     */

    if (
      !data ||
      !data.text ||
      data.book === undefined ||
      data.chapter === undefined ||
      data.verse === undefined
    ) {

      throw new Error(
        "Ungültige Bible-API-Antwort"
      );

    }


    /*
     * Eventuelle HTML-Tags aus dem Bibeltext
     * entfernen.
     */

    const cleanText =
      String(data.text)
        .replace(/<[^>]*>/g, "")
        .replace(/\s+/g, " ")
        .trim();


    /*
     * Fertigen Vers erstellen.
     */

    const result = {

      date: today,

      text: cleanText,

      reference:
        `${bookName} ${data.chapter},${data.verse}`

    };


    /*
     * Für den heutigen Tag speichern.
     */

    saveBibleCache(result);


    return result;


  } catch (error) {

    console.warn(
      "Bibelvers konnte nicht geladen werden:",
      error
    );


    /*
     * Wenn die API nicht funktioniert,
     * den zuletzt gespeicherten Vers verwenden.
     */

    if (
      cached &&
      cached.text &&
      cached.reference
    ) {

      return cached;

    }


    /*
     * Letzter Fallback.
     */

    return {

      date: today,

      text:
        "Denn ich weiß, was für Gedanken ich über euch habe, spricht der HERR: Gedanken des Friedens und nicht des Leides.",

      reference:
        "Jeremia 29,11"

    };

  }

}


/* ---------------------------------------------------------
   Vers auf der Home-Seite anzeigen
   --------------------------------------------------------- */

function renderBibleVerse(verse) {

  const quote =
    document.querySelector(
      ".quote blockquote"
    );


  const reference =
    document.querySelector(
      ".quote .muted"
    );


  if (
    !quote ||
    !reference
  ) {

    return;

  }


  quote.textContent =
    `„${verse.text}“`;


  reference.textContent =
    verse.reference;

}


/* ---------------------------------------------------------
   Bibelvers aktualisieren
   --------------------------------------------------------- */

async function updateBibleVerse() {

  const verse =
    await loadBibleVerse();


  renderBibleVerse(
    verse
  );

}


/* =========================================================
   BIBELVERS DETAILANSICHT
   ========================================================= */

function bibleDetailView() {

  const verse =
    getBibleCache();


  if (!verse) {
    return `
      ${shellHeader(
        "Bibelvers",
        "Heute",
        true
      )}

      <main class="page">
        <section class="card">
          <p class="muted">
            Bibelvers wird geladen ...
          </p>
        </section>
      </main>
    `;
  }


  const favorites =
    getBibleFavorites();


  const isFavorite =
    favorites.some(
      item =>
        item.text === verse.text &&
        item.reference === verse.reference
    );


  return `
    ${shellHeader(
      "Bibelvers",
      "Heute",
      true
    )}

    <main class="page">

      <section class="card bible-detail">

        <div class="label">
          ▣ &nbsp; BIBELVERS
        </div>

        <blockquote class="bible-detail-text">
          „${verse.text}“
        </blockquote>

        <p class="muted bible-detail-reference">
          ${verse.reference}
        </p>

        <div class="bible-actions">

          <button
            class="primary-button bible-favorite"
            type="button"
          >
            ${isFavorite ? "♥" : "♡"}
            ${isFavorite
              ? " Favorisiert"
              : " Zu Favoriten"}
          </button>

        </div>

      </section>

    </main>
  `;
}


/* ---------------------------------------------------------
   Bibel-Favoriten
   --------------------------------------------------------- */

const BIBLE_FAVORITES_KEY =
  "finn-bible-favorites";


function getBibleFavorites() {

  try {

    return JSON.parse(
      localStorage.getItem(
        BIBLE_FAVORITES_KEY
      ) || "[]"
    );

  } catch {

    return [];

  }
}


function saveBibleFavorites(
  favorites
) {

  try {

    localStorage.setItem(
      BIBLE_FAVORITES_KEY,
      JSON.stringify(
        favorites
      )
    );

  } catch {}

}


function toggleBibleFavorite() {

  const verse =
    getBibleCache();


  if (!verse) {
    return;
  }


  let favorites =
    getBibleFavorites();


  const index =
    favorites.findIndex(
      item =>
        item.text === verse.text &&
        item.reference === verse.reference
    );


  if (index >= 0) {

    favorites.splice(
      index,
      1
    );

  } else {

    favorites.unshift({

      text:
        verse.text,

      reference:
        verse.reference,

      savedAt:
        new Date().toISOString()

    });

  }


  saveBibleFavorites(
    favorites
  );


  render();
}


/* =========================================================
   SMART INSIGHTS
   ========================================================= */

function smartInsights() {
  const {
    workouts,
    runs,
    journal
  } = weeklyData();

  const insights = [];

  if (workouts.length === 0) {
    insights.push([
      "Start",
      "Diese Woche ist noch alles offen. Eine kleine Einheit reicht, um Momentum aufzubauen."
    ]);
  } else if (
    workouts.length >= state.settings.weeklySportGoal
  ) {
    insights.push([
      "Ziel geschafft",
      `Du hast dein Wochenziel von ${state.settings.weeklySportGoal} Sporteinheiten erreicht.`
    ]);
  } else {
    const left =
      state.settings.weeklySportGoal -
      workouts.length;

    insights.push([
      "Momentum",
      `Noch ${left} Sporteinheit${left === 1 ? "" : "en"} bis zum Wochenziel.`
    ]);
  }

  if (runs.length >= 2) {
    const p = runs.map(
      r => r.seconds / r.km
    );

    const recent = p[p.length - 1];
    const previous = avg(p.slice(0, -1));

    if (recent < previous * 0.97) {
      insights.push([
        "Lauftrend",
        "Dein letzter Lauf war spürbar schneller als dein vorheriger Schnitt."
      ]);
    } else if (recent > previous * 1.08) {
      insights.push([
        "Regeneration",
        "Der letzte Lauf war deutlich langsamer. Das kann ein guter Zeitpunkt für etwas mehr Erholung sein."
      ]);
    }
  }

  if (journal.length === 0) {
    insights.push([
      "Check-in",
      "Dein Journal ist heute noch leer. Ein Satz reicht für den Tages-Check-in."
    ]);
  }

  const feelingToday =
    state.feelings.find(
      x => x.date === dateKey()
    );

  if (
    feelingToday &&
    feelingToday.score <= 2
  ) {
    insights.push([
      "Heute",
      "Der heutige Stimmungsscore ist niedrig. Plane heute bewusst etwas Kleines, das dir gut tut."
    ]);
  }

  return insights.slice(0, 3);
}


/* =========================================================
   NAVIGATION / SHELL
   ========================================================= */

function shellHeader(
  title,
  subtitle = "",
  back = false
) {
  return `
    <header class="page-head">
      ${
        back
          ? `<button class="back" onclick="go('home')">‹</button>`
          : ""
      }

      <div>
        <p class="eyebrow">FINN</p>
        <h1>${title}</h1>

        ${
          subtitle
            ? `<p class="subtitle">${subtitle}</p>`
            : ""
        }
      </div>

      ${
        !back
          ? `<button class="gear" onclick="go('profile')">⚙</button>`
          : ""
      }
    </header>
  `;
}


function render() {

  document
    .querySelectorAll(".bottom-nav button")
    .forEach(
      b =>
        b.classList.toggle(
          "active",
          b.dataset.route === route
        )
    );


  const views = {

    home: homeView,

    day: dayView,

    calendar: calendarView,

    stats: statsView,

    profile: profileView,

    bible: bibleDetailView

  };


  document.getElementById(
    "app"
  ).innerHTML =
    views[route]();


  if (route === "home") {

    updateBibleVerse();

  }
}


/* =========================================================
   HOME
   ========================================================= */

function homeView() {
  const {
    workouts,
    runs,
    journal
  } = weeklyData();

  const todayFeeling =
    state.feelings.find(
      x => x.date === dateKey()
    );

  const sportGoal =
    state.settings.weeklySportGoal;

  const sportPct =
    Math.min(
      100,
      workouts.length / sportGoal * 100
    );

  const insights =
    smartInsights();

  const todayTodos =
    state.todos.filter(
      t => t.date === dateKey()
    );

  const doneTodos =
    todayTodos.filter(
      t => t.done
    ).length;

  const todoPct =
    todayTodos.length
      ? Math.round(
          doneTodos /
          todayTodos.length *
          100
        )
      : 0;

  return `
    ${shellHeader(
      state.profile.name,
      state.profile.greeting
    )}

    <section
      class="card today-focus"
      onclick="go('day')"
    >
      <div>
        <div class="label">
          ◷ &nbsp; MEIN TAG
        </div>

        <h2>
          ${doneTodos}/${todayTodos.length}
          Aufgaben erledigt
        </h2>

        <p class="muted">
          ${
            todayTodos.length
              ? `${todoPct} % deines Tagesplans geschafft`
              : "Plane deinen Tag und behalte den Fokus."
          }
        </p>
      </div>

      <div
        class="focus-ring"
        style="--p:${todoPct}%"
      >
        <span>${todoPct}%</span>
      </div>

      <span class="arrow">›</span>
    </section>


    <section class="quote card">
      <div class="quote-copy">
        <div class="label">
          ▣ &nbsp; BIBEL VERS
        </div>

        <blockquote>
          „Denn ich weiß, welche Gedanken ich über euch hege, Gedanken des Friedens und nicht des Unheils.“
        </blockquote>

        <p class="muted">
          Jeremia 29,11
        </p>
      </div>

      <div class="mountains"></div>

      <button
  class="arrow bible-open"
  type="button"
  aria-label="Bibelvers öffnen"
>
  ›
</button>
    </section>


    <div class="quick-grid">

      ${quick(
        "✓",
        "Todos",
        "Aufgaben & Fokus",
        "day"
      )}

      ${quick(
        "✎",
        "Journal",
        "Gedanken & Gefühle",
        "journal"
      )}

      ${quick(
        "♡",
        "Gefühle",
        "Heute fühlen",
        "feelings"
      )}

      ${quick(
        "⌁",
        "Sport",
        "Aktivität & Fortschritt",
        "sport"
      )}

      ${quick(
        "♧",
        "Läufe",
        "Tracken & Analysieren",
        "runs"
      )}

      ${quick(
        "文",
        "Schwedisch",
        "Lernen & Verbessern",
        "swedish"
      )}

    </div>


    <section class="card feature">

      <div class="feature-copy">

        <div class="label">
          ▤ &nbsp; JOURNAL
        </div>

        <h2>
          ${
            journal.length
              ? "Wie war dein Tag?"
              : "Wie fühlst du dich heute?"
          }
        </h2>

        <p class="muted">
          ${
            journal.length
              ? "Dein letzter Eintrag ist gespeichert."
              : "Schreib es auf. Alles ist okay."
          }
        </p>

        <button
          class="pill"
          onclick="openJournal()"
        >
          ✎ &nbsp;
          ${
            journal.length
              ? "Eintrag ansehen"
              : "Neuer Eintrag"
          }
        </button>

      </div>

      <div class="desk-art"></div>

      <span class="arrow">›</span>

    </section>


    <div class="two-col">

      <section
        class="card stat"
        onclick="go('sport')"
      >

        <div class="stat-head">
          <div class="label">
            ⌁ &nbsp; SPORT
          </div>

          <span>›</span>
        </div>

        <p class="small-title">
          Diese Woche
        </p>

        <div class="sport-summary">

          <div
            class="ring"
            style="--p:${sportPct}%"
          >
            <span>
              <b>
                ${workouts.length}/${sportGoal}
              </b>

              <small>
                Einheiten
              </small>
            </span>
          </div>

          <div class="metrics">

            <div>
              ◷
              <b>
                ${minutesToHM(
                  sum(
                    workouts.map(
                      x => x.minutes
                    )
                  )
                )}
              </b>
              <small>
                Zeit
              </small>
            </div>

            <div>
              ♨
              <b>
                ${
                  sum(
                    workouts.map(
                      x => x.kcal
                    )
                  ) || 0
                }
                kcal
              </b>
              <small>
                Kalorien
              </small>
            </div>

            <div>
              ▥
              <b>
                ${
                  workouts.length
                    ? signedProgress(
                        workouts
                      )
                    : "+0 %"
                }
              </b>
              <small>
                Fortschritt
              </small>
            </div>

          </div>

        </div>

      </section>


      <section
        class="card stat"
        onclick="go('runs')"
      >

        <div class="stat-head">
          <div class="label">
            ♧ &nbsp; LÄUFE
          </div>

          <span>›</span>
        </div>

        <p class="small-title">
          Letzter Lauf
        </p>

        ${
          runs.length
            ? `
              <div class="big">
                ${runs[runs.length - 1].km
                  .toFixed(2)
                  .replace(".", ",")}
                km
              </div>

              <p class="muted">
                ${timeMMSS(
                  runs[runs.length - 1]
                    .seconds
                )}
                &nbsp; • &nbsp;
                ${pace(
                  runs[runs.length - 1]
                    .seconds,
                  runs[runs.length - 1].km
                )}
              </p>
            `
            : `
              <div class="big">
                Noch kein Lauf
              </div>

              <p class="muted">
                Trage deinen nächsten Lauf ein.
              </p>
            `
        }

        <div class="mini-route">
          ⌁⌁⌁⌁⌁⌁⌁
        </div>

        <div class="divider">
          ▥ &nbsp; Alle Läufe
        </div>

      </section>

    </div>


    <section
      class="card language"
      onclick="go('swedish')"
    >

      <div>

        <div class="label">
          文 &nbsp; SCHWEDISCH
        </div>

        <p class="small-title">
          Lernfortschritt
        </p>

        <div class="bar">
          <span
            style="width:${state.swedish.progress}%"
          ></span>
        </div>

        <p class="muted tiny">
          Lektion ${state.swedish.lesson}
          &nbsp; • &nbsp;
          Grundlagen
        </p>

      </div>

      <div class="lang-right">

        <span>🇸🇪</span>

        <button class="continue">
          Weiter ›
        </button>

      </div>

    </section>


    <section class="insights">

      <div class="section-title">
        SMARTER TAGES-CHECK
      </div>

      ${insights
        .map(
          x => `
            <article>
              <b>${x[0]}</b>
              <p>${x[1]}</p>
            </article>
          `
        )
        .join("")}

    </section>
  `;
}


function quick(
  icon,
  title,
  sub,
  r
) {
  return `
    <button
      class="quick"
      onclick="go('${r}')"
    >
      <span class="qicon">
        ${icon}
      </span>

      <b>${title}</b>

      <small>${sub}</small>
    </button>
  `;
}


function signedProgress(ws) {
  if (ws.length < 2) {
    return "+0 %";
  }

  return "+8 %";
}


/* =========================================================
   MEIN TAG / TODO SYSTEM
   ========================================================= */

function dayView() {
  const key = dateKey();

  const todos = [
    ...state.todos
  ]
    .filter(
      t => t.date === key
    )
    .sort(todoSort);

  const done =
    todos.filter(
      t => t.done
    ).length;

  const pct =
    todos.length
      ? Math.round(
          done /
          todos.length *
          100
        )
      : 0;

  const scheduled =
    todos.filter(
      t => t.time
    );

  const unscheduled =
    todos.filter(
      t => !t.time
    );

  const todayEvents =
    state.events.filter(
      e => e.date === key
    );

  const readableDate =
    new Intl.DateTimeFormat(
      "de-DE",
      {
        weekday: "long",
        day: "2-digit",
        month: "long"
      }
    ).format(new Date());


  return `
    ${shellHeader(
      "Mein Tag",
      readableDate,
      false
    )}


    <section class="card day-hero">

      <div>

        <div class="label">
          HEUTE
        </div>

        <h2>
          ${done} von ${todos.length}
          erledigt
        </h2>

        <p class="muted">
          ${
            todos.length
              ? `${pct}% deines Tagesplans geschafft.`
              : "Noch keine Aufgaben für heute."
          }
        </p>

      </div>

      <div class="day-progress">
        <span
          style="width:${pct}%"
        ></span>
      </div>

    </section>


    <div class="day-actions">

      <button
        class="wide-action"
        onclick="openTodo()"
      >
        ＋ Aufgabe
      </button>

      <button
        class="wide-action secondary-action"
        onclick="openTodo(true)"
      >
        ＋ Zeitblock
      </button>

    </div>


    ${
      todayEvents.length
        ? `
          <section>

            <div class="section-title">
              TERMINE
            </div>

            ${todayEvents
              .map(
                e => `
                  <article class="list-card">

                    <div>
                      <b>
                        ${esc(e.title)}
                      </b>

                      <span class="tag">
                        Termin
                      </span>
                    </div>

                    <p>
                      ${esc(e.note || "")}
                    </p>

                  </article>
                `
              )
              .join("")}

          </section>
        `
        : ""
    }


    <section>

      <div class="section-title">
        HEUTE GEPLANT
      </div>


      ${
        scheduled.length
          ? scheduled
              .map(todoCard)
              .join("")
          : `
            <div class="empty card compact-empty">
              Noch keine zeitlich geplanten Aufgaben.
            </div>
          `
      }


      ${
        unscheduled.length
          ? `
            <div class="section-title sub-section-title">
              OHNE UHRZEIT
            </div>

            ${unscheduled
              .map(todoCard)
              .join("")}
          `
          : ""
      }


      ${
        !todos.length
          ? `
            <div class="empty card">

              <b>
                Dein Tag ist noch leer.
              </b>

              <p>
                Füge eine Aufgabe hinzu und baue deinen Tagesplan Schritt für Schritt auf.
              </p>

            </div>
          `
          : ""
      }

    </section>
  `;
}


function todoSort(a, b) {
  if (a.done !== b.done) {
    return Number(a.done) -
      Number(b.done);
  }

  const priority = {
    high: 0,
    medium: 1,
    low: 2
  };

  if (
    (priority[a.priority] ?? 1) !==
    (priority[b.priority] ?? 1)
  ) {
    return (
      (priority[a.priority] ?? 1) -
      (priority[b.priority] ?? 1)
    );
  }

  if (a.time && b.time) {
    return a.time.localeCompare(
      b.time
    );
  }

  if (a.time) {
    return -1;
  }

  if (b.time) {
    return 1;
  }

  return (
    (a.createdAt || 0) -
    (b.createdAt || 0)
  );
}


function priorityLabel(priority) {
  if (priority === "high") {
    return "Wichtig";
  }

  if (priority === "low") {
    return "Niedrig";
  }

  return "Normal";
}


function todoCard(t) {
  const priority =
    t.priority || "medium";

  return `
    <article
      class="todo-item
        ${t.done ? "done" : ""}
        priority-${priority}"
    >

      <button
        class="todo-check"
        onclick="toggleTodo('${t.id}')"
        aria-label="Aufgabe ${t.done ? "offen" : "erledigt"}"
      >
        ${t.done ? "✓" : ""}
      </button>


      <div
        class="todo-main"
        onclick="openTodo(false,'${t.id}')"
      >

        <div class="todo-title">
          ${esc(t.title)}
        </div>

        <div class="todo-meta">

          ${
            t.time
              ? `◷ ${esc(t.time)} · `
              : ""
          }

          ${priorityLabel(priority)}

          ${
            t.note
              ? ` · ${esc(t.note)}`
              : ""
          }

        </div>

      </div>


      <button
        class="todo-menu"
        onclick="deleteTodo('${t.id}')"
        aria-label="Löschen"
      >
        ×
      </button>

    </article>
  `;
}


function openTodo(
  timeBlock = false,
  id = ""
) {
  const existing =
    id
      ? state.todos.find(
          x => x.id === id
        )
      : null;

  const t =
    existing || {
      date: dateKey(),
      time: timeBlock
        ? "09:00"
        : "",
      priority: "medium",
      title: "",
      note: ""
    };


  openModal(
    existing
      ? "Aufgabe bearbeiten"
      : timeBlock
        ? "Zeitblock planen"
        : "Aufgabe hinzufügen",

    `
      <form
        onsubmit="submitTodo(event,'${existing?.id || ""}')"
      >

        <label>
          Aufgabe

          <input
            name="title"
            required
            value="${esc(t.title)}"
            placeholder="z. B. 30 Minuten Mathe lernen"
          >
        </label>


        <div class="form-row">

          <label>
            Datum

            <input
              name="date"
              type="date"
              required
              value="${t.date || dateKey()}"
            >
          </label>


          <label>
            Uhrzeit
            <small>optional</small>

            <input
              name="time"
              type="time"
              value="${t.time || ""}"
            >
          </label>

        </div>


        <div class="form-row">

          <label>
            Priorität

            <select name="priority">

              <option
                value="high"
                ${
                  t.priority === "high"
                    ? "selected"
                    : ""
                }
              >
                Wichtig
              </option>

              <option
                value="medium"
                ${
                  t.priority === "medium"
                    ? "selected"
                    : ""
                }
              >
                Normal
              </option>

              <option
                value="low"
                ${
                  t.priority === "low"
                    ? "selected"
                    : ""
                }
              >
                Niedrig
              </option>

            </select>

          </label>


          <label>
            Notiz
            <small>optional</small>

            <input
              name="note"
              value="${esc(t.note || "")}"
              placeholder="z. B. 45 Minuten"
            >
          </label>

        </div>


        <button class="submit">
          ${
            existing
              ? "Änderungen speichern"
              : "Planen"
          }
        </button>

      </form>
    `
  );
}


function submitTodo(
  e,
  id = ""
) {
  e.preventDefault();

  const f =
    new FormData(e.target);

  const data = {
    title: String(
      f.get("title")
    ).trim(),

    date: f.get("date"),

    time: f.get("time"),

    priority:
      f.get("priority"),

    note: String(
      f.get("note") || ""
    ).trim()
  };


  if (id) {
    const t =
      state.todos.find(
        x => x.id === id
      );

    if (t) {
      Object.assign(
        t,
        data
      );
    }
  } else {
    state.todos.push({
      id: uid(),
      ...data,
      done: false,
      createdAt: Date.now()
    });
  }


  save();

  closeModal();

  go(
    data.date === dateKey()
      ? "day"
      : "calendar"
  );
}


function toggleTodo(id) {
  const t =
    state.todos.find(
      x => x.id === id
    );

  if (!t) {
    return;
  }

  t.done = !t.done;

  t.completedAt =
    t.done
      ? Date.now()
      : null;

  save();

  render();
}


function deleteTodo(id) {
  if (
    !confirm(
      "Aufgabe löschen?"
    )
  ) {
    return;
  }

  state.todos =
    state.todos.filter(
      x => x.id !== id
    );

  save();

  render();
}


function goDay(key) {
  route = "day";

  render();

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}


/* =========================================================
   JOURNAL
   ========================================================= */

function journalView() {
  const entries =
    [...state.journal]
      .sort(
        (a, b) =>
          b.date.localeCompare(
            a.date
          )
      );

  return `
    ${shellHeader(
      "Journal",
      "Gedanken festhalten & Muster erkennen",
      true
    )}

    <button
      class="wide-action"
      onclick="openJournal()"
    >
      ＋ Neuer Eintrag
    </button>

    <div class="section-title">
      DEINE EINTRÄGE
    </div>

    ${
      entries.length
        ? entries
            .map(
              e => `
                <article class="list-card">

                  <div>
                    <b>
                      ${formatDate(e.date)}
                    </b>

                    <span class="tag">
                      ${esc(
                        e.mood ||
                        "Check-in"
                      )}
                    </span>
                  </div>

                  <h3>
                    ${esc(
                      e.title ||
                      "Tagesnotiz"
                    )}
                  </h3>

                  <p>
                    ${esc(e.text)}
                  </p>

                </article>
              `
            )
            .join("")
        : `
          <div class="empty card">
            Noch keine Einträge.
            Fang mit einem Satz an.
          </div>
        `
    }
  `;
}


/* =========================================================
   GEFÜHLE
   ========================================================= */

function feelingsView() {
  const recent =
    [...state.feelings]
      .sort(
        (a, b) =>
          b.date.localeCompare(
            a.date
          )
      )
      .slice(0, 14);

  const avgScore =
    avg(
      recent.map(
        x => x.score
      )
    );

  return `
    ${shellHeader(
      "Gefühle",
      "Kurzer Check-in statt kompliziertem Tracking",
      true
    )}

    <section class="card feeling-today">

      <div class="section-title">
        HEUTE
      </div>

      <h2>
        ${
          state.feelings.find(
            x =>
              x.date === dateKey()
          )
            ? "Check-in vorhanden"
            : "Wie geht es dir?"
        }
      </h2>

      <p class="muted">
        Ein Wert von 1–5 genügt.
      </p>

      <div class="mood-row">

        ${[1, 2, 3, 4, 5]
          .map(
            n => `
              <button
                onclick="saveFeeling(${n})"
                class="${
                  state.feelings.find(
                    x =>
                      x.date === dateKey()
                  )?.score === n
                    ? "selected"
                    : ""
                }"
              >
                ${
                  [
                    "😞",
                    "😕",
                    "😐",
                    "🙂",
                    "😄"
                  ][n - 1]
                }

                <small>
                  ${n}
                </small>
              </button>
            `
          )
          .join("")}

      </div>

    </section>


    <section class="card">

      <div class="section-title">
        14-TAGE-TREND
      </div>

      <div class="mood-chart">

        ${recent
          .reverse()
          .map(
            x => `
              <div
                title="${formatDate(
                  x.date
                )}"
              >

                <i
                  style="height:${
                    x.score * 20
                  }%"
                ></i>

                <small>
                  ${new Date(
                    x.date
                  ).getDate()}
                </small>

              </div>
            `
          )
          .join("")}

      </div>

      <p class="muted">
        Durchschnitt:
        ${
          avgScore
            ? avgScore.toFixed(1)
            : "—"
        }
        / 5
      </p>

    </section>
  `;
}


/* =========================================================
   SPORT
   ========================================================= */

function sportView() {
  const ws =
    [...state.workouts]
      .sort(
        (a, b) =>
          b.date.localeCompare(
            a.date
          )
      );

  const week =
    weeklyData().workouts;

  return `
    ${shellHeader(
      "Sport",
      "Einheiten, Belastung und Fortschritt",
      true
    )}

    <div class="kpi-grid">

      <div class="card kpi">
        <small>Diese Woche</small>
        <b>${week.length}</b>
        <span>Einheiten</span>
      </div>

      <div class="card kpi">
        <small>Zeit</small>
        <b>
          ${minutesToHM(
            sum(
              week.map(
                x => x.minutes
              )
            )
          )}
        </b>
        <span>aktiv</span>
      </div>

      <div class="card kpi">
        <small>kcal</small>
        <b>
          ${sum(
            week.map(
              x => x.kcal
            )
          )}
        </b>
        <span>geschätzt</span>
      </div>

    </div>


    <button
      class="wide-action"
      onclick="openWorkout()"
    >
      ＋ Training eintragen
    </button>


    <div class="section-title">
      AKTIVITÄTEN
    </div>


    ${
      ws.length
        ? ws
            .map(
              x => `
                <article class="list-card">

                  <div>
                    <b>
                      ${esc(x.type)}
                    </b>

                    <span class="tag">
                      ${formatDate(
                        x.date
                      )}
                    </span>
                  </div>

                  <p>
                    ${x.minutes} min
                    ${
                      x.kcal
                        ? ` · ${x.kcal} kcal`
                        : ""
                    }
                    ${
                      x.note
                        ? ` · ${esc(
                            x.note
                          )}`
                        : ""
                    }
                  </p>

                </article>
              `
            )
            .join("")
        : `
          <div class="empty card">
            Noch keine Trainingseinheiten.
          </div>
        `
    }
  `;
}


/* =========================================================
   LÄUFE
   ========================================================= */

function runsView() {
  const runs =
    [...state.runs]
      .sort(
        (a, b) =>
          b.date.localeCompare(
            a.date
          )
      );

  const km =
    sum(
      weeklyData()
        .runs
        .map(x => x.km)
    );

  const avgP =
    avg(
      runs
        .slice(0, 10)
        .map(
          x =>
            x.seconds /
            x.km
        )
    );

  return `
    ${shellHeader(
      "Läufe",
      "Distanz, Pace und persönliche Entwicklung",
      true
    )}

    <div class="kpi-grid">

      <div class="card kpi">
        <small>Woche</small>
        <b>
          ${km
            .toFixed(1)
            .replace(".", ",")}
        </b>
        <span>km</span>
      </div>

      <div class="card kpi">
        <small>Ø Pace</small>
        <b>
          ${
            avgP
              ? pace(avgP, 1)
              : "—"
          }
        </b>
        <span>letzte Läufe</span>
      </div>

      <div class="card kpi">
        <small>Läufe</small>
        <b>${runs.length}</b>
        <span>gesamt</span>
      </div>

    </div>


    <button
      class="wide-action"
      onclick="openRun()"
    >
      ＋ Lauf eintragen
    </button>


    <div class="section-title">
      VERLAUF
    </div>


    ${
      runs.length
        ? runs
            .map(
              x => `
                <article class="list-card run-row">

                  <div>
                    <b>
                      ${x.km
                        .toFixed(2)
                        .replace(".", ",")}
                      km
                    </b>

                    <span class="tag">
                      ${formatDate(
                        x.date
                      )}
                    </span>
                  </div>

                  <h3>
                    ${timeMMSS(
                      x.seconds
                    )}
                    ·
                    ${pace(
                      x.seconds,
                      x.km
                    )}
                  </h3>

                  <p>
                    ${esc(
                      x.note ||
                      "Lauf"
                    )}
                  </p>

                </article>
              `
            )
            .join("")
        : `
          <div class="empty card">
            Dein erster Lauf kann hier erscheinen.
          </div>
        `
    }
  `;
}


/* =========================================================
   SCHWEDISCH
   ========================================================= */

function swedishView() {
  const pct =
    state.swedish.progress;

  return `
    ${shellHeader(
      "Schwedisch",
      "Lernen ohne Druck, aber mit sichtbarem Fortschritt",
      true
    )}

    <section class="card learning-hero">

      <div class="label">
        🇸🇪 &nbsp; AKTUELL
      </div>

      <h2>
        Lektion ${state.swedish.lesson}
      </h2>

      <div class="bar bigbar">
        <span
          style="width:${pct}%"
        ></span>
      </div>

      <div class="learn-stats">

        <span>
          <b>${pct}%</b>
          <small>Fortschritt</small>
        </span>

        <span>
          <b>
            ${state.swedish.totalMinutes}
            min
          </b>
          <small>Lernzeit</small>
        </span>

      </div>

      <button
        class="pill"
        onclick="advanceSwedish()"
      >
        ✓ Lektion abschließen
      </button>

    </section>


    <section class="card">

      <div class="section-title">
        LERNLOGIK
      </div>

      <p class="muted">
        Jede abgeschlossene Lektion erhöht deinen Fortschritt.
        Bei 100 % springt die App automatisch zur nächsten Lektion.
      </p>

    </section>
  `;
}


/* =========================================================
   KALENDER
   ========================================================= */

function calendarView() {
  const events =
    [...state.events]
      .sort(
        (a, b) =>
          a.date.localeCompare(
            b.date
          )
      );

  const todos =
    [...state.todos]
      .sort(
        (a, b) =>
          a.date.localeCompare(
            b.date
          ) ||
          todoSort(a, b)
      );

  const upcoming = [
    ...events.map(
      e => ({
        ...e,
        type: "event"
      })
    ),

    ...todos
      .filter(
        t =>
          t.date >= dateKey()
      )
      .map(
        t => ({
          ...t,
          type: "todo"
        })
      )
  ].sort(
    (a, b) =>
      a.date.localeCompare(
        b.date
      )
  );


  return `
    ${shellHeader(
      "Kalender",
      "Termine und Aufgaben zusammen planen",
      false
    )}


    <div class="day-actions">

      <button
        class="wide-action"
        onclick="openTodo()"
      >
        ＋ Aufgabe planen
      </button>

      <button
        class="wide-action secondary-action"
        onclick="openEvent()"
      >
        ＋ Termin
      </button>

    </div>


    <div class="calendar-strip">

      ${Array.from(
        { length: 7 },
        (_, i) => {

          const d =
            new Date();

          d.setDate(
            d.getDate() + i
          );

          const k =
            dateKey(d);

          const count =
            todos.filter(
              t =>
                t.date === k
            ).length +
            events.filter(
              e =>
                e.date === k
            ).length;

          return `
            <div
              class="${
                i === 0
                  ? "today"
                  : ""
              }"
              onclick="goDay('${k}')"
            >

              <b>
                ${new Intl.DateTimeFormat(
                  "de-DE",
                  {
                    weekday:
                      "short"
                  }
                ).format(d)}
              </b>

              <span>
                ${d.getDate()}
              </span>

              <small>
                ${count}×
              </small>

            </div>
          `;
        }
      ).join("")}

    </div>


    <div class="section-title">
      NÄCHSTE TAGE
    </div>


    ${
      upcoming.length
        ? upcoming
            .slice(0, 25)
            .map(
              x =>
                x.type === "todo"
                  ? `
                    <article class="list-card">

                      <div>
                        <b>
                          ${esc(
                            x.title
                          )}
                        </b>

                        <span class="tag">
                          ${formatDate(
                            x.date
                          )}
                        </span>
                      </div>

                      <p>
                        ${
                          x.time
                            ? `◷ ${esc(
                                x.time
                              )} · `
                            : ""
                        }

                        ${priorityLabel(
                          x.priority ||
                          "medium"
                        )}

                        ${
                          x.done
                            ? " · erledigt"
                            : ""
                        }
                      </p>

                    </article>
                  `
                  : `
                    <article class="list-card">

                      <div>
                        <b>
                          ${esc(
                            x.title
                          )}
                        </b>

                        <span class="tag">
                          ${formatDate(
                            x.date
                          )}
                        </span>
                      </div>

                      <p>
                        ${esc(
                          x.note ||
                          "Termin"
                        )}
                      </p>

                    </article>
                  `
            )
            .join("")
        : `
          <div class="empty card">
            Noch nichts geplant.
          </div>
        `
    }
  `;
}


/* =========================================================
   STATISTIKEN
   ========================================================= */

function statsView() {
  const w = state.workouts;
  const r = state.runs;
  const f = state.feelings;

  const totalMinutes =
    sum(
      w.map(
        x => x.minutes
      )
    );

  const totalKm =
    sum(
      r.map(
        x => x.km
      )
    );

  const activeDays =
    new Set(
      [
        ...w,
        ...r
      ].map(
        x => x.date
      )
    ).size;

  const journalDays =
    new Set(
      state.journal.map(
        x => x.date
      )
    ).size;

  const doneTodos =
    state.todos.filter(
      x => x.done
    ).length;


  return `
    ${shellHeader(
      "Statistiken",
      "Was sich über Zeit wirklich verändert",
      false
    )}


    <div class="kpi-grid">

      <div class="card kpi">
        <small>Todos</small>
        <b>${doneTodos}</b>
        <span>erledigt</span>
      </div>

      <div class="card kpi">
        <small>Sport</small>
        <b>${w.length}</b>
        <span>Einheiten</span>
      </div>

      <div class="card kpi">
        <small>Laufen</small>
        <b>
          ${totalKm
            .toFixed(1)
            .replace(".", ",")}
        </b>
        <span>km</span>
      </div>

      <div class="card kpi">
        <small>Aktiv</small>
        <b>${activeDays}</b>
        <span>Tage</span>
      </div>

      <div class="card kpi">
        <small>Journal</small>
        <b>${journalDays}</b>
        <span>Tage</span>
      </div>

    </div>


    <section class="card stats-system">

      <div class="section-title">
        DEIN SYSTEM
      </div>

      ${statBar(
        "Todos erledigt",
        doneTodos,
        Math.max(
          5,
          state.todos.length
        )
      )}

      ${statBar(
        "Sport",
        w.length,
        Math.max(
          5,
          w.length
        )
      )}

      ${statBar(
        "Laufen",
        r.length,
        Math.max(
          5,
          r.length
        )
      )}

      ${statBar(
        "Journal",
        journalDays,
        Math.max(
          7,
          journalDays
        )
      )}

      ${statBar(
        "Schwedisch",
        state.swedish.progress,
        100
      )}

    </section>


    <section class="card stats-total">

      <div class="section-title">
        GESAMT
      </div>

      <div class="big-stat">
        <b>
          ${minutesToHM(
            totalMinutes
          )}
        </b>

        <span>
          erfasste Trainingszeit
        </span>
      </div>

      <div class="big-stat">

        <b>
          ${
            f.length
              ? avg(
                  f.map(
                    x => x.score
                  )
                ).toFixed(1)
              : "—"
          }
          / 5
        </b>

        <span>
          Stimmungsdurchschnitt
        </span>

      </div>

    </section>
  `;
}


function statBar(
  name,
  value,
  max
) {
  return `
    <div class="statbar">

      <div>
        <span>${name}</span>
        <b>${value}</b>
      </div>

      <div class="bar">

        <span
          style="width:${Math.min(
            100,
            value / max * 100
          )}%"
        ></span>

      </div>

    </div>
  `;
}


/* =========================================================
   PROFIL
   ========================================================= */

function profileView() {

  const bibleFavorites =
    getBibleFavorites();


  return `
    ${shellHeader(
      "Profil",
      "Deine App, deine Regeln",
      false
    )}


    <section class="card profile">

      <div class="avatar">
        ${esc(
          state.profile.name[0] ||
          "F"
        )}
      </div>

      <h2>
        ${esc(
          state.profile.name
        )}
      </h2>

      <p class="muted">
        Persönliches Life Dashboard
      </p>

    </section>


    <section class="card profile-goals">

      <div class="section-title">
        WOCHENZIELE
      </div>

      <label class="label-wochenziele">
        Sporteinheiten

        <input
          id="sportGoal"
          type="number"
          min="1"
          max="20"
          value="${state.settings.weeklySportGoal}"
        >
      </label>

      <label class="label-wochenziele">
        Laufziel

        <input
          id="runGoal"
          type="number"
          min="1"
          max="20"
          value="${state.settings.weeklyRunGoal}"
        >
      </label>

      <button
        class="wide-action"
        onclick="saveSettings()"
      >
        Speichern
      </button>

    </section>


    <!-- =====================================================
         MEINE BIBELVERSE
         ===================================================== -->

    <section class="card bible-favorites-section">

      <div class="section-title">
        MEINE BIBELVERSE
      </div>


      ${
        bibleFavorites.length === 0

          ? `

            <div class="bible-empty">

              <div class="bible-empty-icon">
                ♡
              </div>

              <p>
                Noch keine gespeicherten Bibelverse.
              </p>

              <p class="muted tiny">
                Speichere einen Bibelvers über
                die Detailansicht.
              </p>

            </div>

          `

          : `

            <div class="bible-favorites-list">

              ${bibleFavorites
                .map(
                  (verse, index) => `

                    <button
                      class="bible-favorite-row"
                      type="button"
                      data-bible-favorite-open="${index}"
                    >

                      <span>
                        ${esc(
                          verse.reference
                        )}
                      </span>

                      <span class="bible-row-arrow">
                        ›
                      </span>

                    </button>

                  `
                )
                .join("")}

            </div>

          `
      }

    </section>


    <section class="card profile-system">

      <div class="section-title">
        SYSTEM
      </div>

      <div class="setting-row">
        <span>✓ Todos</span>
        <b>aktiv</b>
      </div>

      <div class="setting-row">
        <span>✓ Tagesplanung</span>
        <b>aktiv</b>
      </div>

      <div class="setting-row">
        <span>✓ Kalender</span>
        <b>aktiv</b>
      </div>

      <div class="setting-row">
        <span>✓ Journal</span>
        <b>aktiv</b>
      </div>

      <div class="setting-row">
        <span>✓ Gefühle</span>
        <b>aktiv</b>
      </div>

      <div class="setting-row">
        <span>✓ Sport & Läufe</span>
        <b>aktiv</b>
      </div>

    </section>


    <section class="card danger">

      <button
        onclick="resetData()"
      >
        Lokale Daten zurücksetzen
      </button>

      <p class="muted tiny">
        Die App arbeitet aktuell lokal auf diesem Gerät.
      </p>

    </section>
  `;
}


/* =========================================================
   MODALS
   ========================================================= */

function openModal(
  title,
  body
) {
  document.getElementById(
    "modal-root"
  ).innerHTML = `
    <div
      class="modal-backdrop"
      onclick="closeModal(event)"
    >

      <div
        class="modal"
        onclick="event.stopPropagation()"
      >

        <div class="modal-head">

          <h2>
            ${title}
          </h2>

          <button
            onclick="closeModal()"
          >
            ×
          </button>

        </div>

        ${body}

      </div>

    </div>
  `;
}


function closeModal(e) {
  if (
    e &&
    e.target !== e.currentTarget
  ) {
    return;
  }

  document.getElementById(
    "modal-root"
  ).innerHTML = "";
}


/* =========================================================
   JOURNAL
   ========================================================= */

function openJournal() {
  openModal(
    "Neuer Journal-Eintrag",

    `
      <form
        onsubmit="submitJournal(event)"
      >

        <label>
          Titel

          <input
            name="title"
            placeholder="z. B. Heute war..."
          >
        </label>


        <label>
          Wie fühlst du dich?

          <select name="mood">
            <option>Gut</option>
            <option>Okay</option>
            <option>Nachdenklich</option>
            <option>Gestresst</option>
            <option>Dankbar</option>
          </select>

        </label>


        <label>
          Gedanken

          <textarea
            name="text"
            required
            placeholder="Was beschäftigt dich gerade?"
          ></textarea>

        </label>


        <button class="submit">
          Speichern
        </button>

      </form>
    `
  );
}


function submitJournal(e) {
  e.preventDefault();

  const f =
    new FormData(e.target);

  state.journal.push({
    id: uid(),
    date: dateKey(),
    title: f.get("title"),
    mood: f.get("mood"),
    text: f.get("text")
  });

  save();
  closeModal();
  go("journal");
}


/* =========================================================
   GEFÜHLE
   ========================================================= */

function saveFeeling(score) {
  const i =
    state.feelings.findIndex(
      x =>
        x.date === dateKey()
    );

  const x = {
    date: dateKey(),
    score
  };

  if (i >= 0) {
    state.feelings[i] = x;
  } else {
    state.feelings.push(x);
  }

  save();

  render();
}


/* =========================================================
   SPORT
   ========================================================= */

function openWorkout() {
  openModal(
    "Training eintragen",

    `
      <form
        onsubmit="submitWorkout(event)"
      >

        <label>
          Art

          <input
            name="type"
            required
            placeholder="Krafttraining, Radfahren..."
          >
        </label>


        <div class="form-row">

          <label>
            Minuten

            <input
              name="minutes"
              type="number"
              min="1"
              required
            >
          </label>

          <label>
            kcal
            <small>optional</small>

            <input
              name="kcal"
              type="number"
              min="0"
            >
          </label>

        </div>


        <label>
          Notiz

          <input
            name="note"
            placeholder="z. B. Beine, locker..."
          >
        </label>


        <button class="submit">
          Training speichern
        </button>

      </form>
    `
  );
}


function submitWorkout(e) {
  e.preventDefault();

  const f =
    new FormData(e.target);

  state.workouts.push({
    id: uid(),
    date: dateKey(),
    type: f.get("type"),
    minutes:
      +f.get("minutes"),
    kcal:
      +f.get("kcal") || 0,
    note:
      f.get("note")
  });

  save();
  closeModal();
  go("sport");
}


/* =========================================================
   LÄUFE
   ========================================================= */

function openRun() {
  openModal(
    "Lauf eintragen",

    `
      <form
        onsubmit="submitRun(event)"
      >

        <div class="form-row">

          <label>
            Distanz (km)

            <input
              name="km"
              type="number"
              step="0.01"
              min="0.1"
              required
            >
          </label>

          <label>
            Zeit (min)

            <input
              name="min"
              type="number"
              step="0.01"
              min="0.1"
              required
            >
          </label>

        </div>


        <label>
          Notiz

          <input
            name="note"
            placeholder="z. B. easy run, Intervalle..."
          >
        </label>


        <button class="submit">
          Lauf speichern
        </button>

      </form>
    `
  );
}


function submitRun(e) {
  e.preventDefault();

  const f =
    new FormData(e.target);

  state.runs.push({
    id: uid(),
    date: dateKey(),
    km: +f.get("km"),
    seconds:
      +f.get("min") * 60,
    note:
      f.get("note")
  });

  save();
  closeModal();
  go("runs");
}


/* =========================================================
   SCHWEDISCH
   ========================================================= */

function advanceSwedish() {
  state.swedish.progress += 5;
  state.swedish.totalMinutes += 15;

  if (
    state.swedish.progress >= 100
  ) {
    state.swedish.lesson++;
    state.swedish.progress = 0;
  }

  save();
  render();
}


/* =========================================================
   KALENDER / TERMINE
   ========================================================= */

function openEvent() {
  openModal(
    "Planen",

    `
      <form
        onsubmit="submitEvent(event)"
      >

        <label>
          Titel

          <input
            name="title"
            required
            placeholder="z. B. Lauf, Arzt, Fokuszeit..."
          >
        </label>


        <label>
          Datum

          <input
            name="date"
            type="date"
            value="${dateKey()}"
            required
          >
        </label>


        <label>
          Notiz

          <input name="note">
        </label>


        <button class="submit">
          Planen
        </button>

      </form>
    `
  );
}


function submitEvent(e) {
  e.preventDefault();

  const f =
    new FormData(e.target);

  state.events.push({
    id: uid(),
    title: f.get("title"),
    date: f.get("date"),
    note: f.get("note")
  });

  save();
  closeModal();
  go("calendar");
}


/* =========================================================
   SETTINGS
   ========================================================= */

function saveSettings() {
  state.settings.weeklySportGoal =
    +document.getElementById(
      "sportGoal"
    ).value || 5;

  state.settings.weeklyRunGoal =
    +document.getElementById(
      "runGoal"
    ).value || 3;

  save();

  render();
}


function resetData() {
  if (
    confirm(
      "Wirklich alle lokalen Daten löschen?"
    )
  ) {
    localStorage.removeItem(
      KEY
    );

    state = load();

    render();
  }
}


/* =========================================================
   NAVIGATION
   ========================================================= */

function go(r) {
  route = r;

  render();

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}


document.addEventListener(
  "click",
  event => {

    /* -----------------------------------------------------
       Navigation
       ----------------------------------------------------- */

    const routeButton =
      event.target.closest(
        "[data-route]"
      );


    if (routeButton) {

      go(
        routeButton.dataset.route
      );

      return;
    }


    /* -----------------------------------------------------
       Bibelvers öffnen
       ----------------------------------------------------- */

    const bibleOpen =
      event.target.closest(
        ".bible-open"
      );


    if (bibleOpen) {

      route = "bible";

      render();

      window.scrollTo({
        top: 0,
        behavior: "smooth"
      });

      return;
    }


    /* -----------------------------------------------------
       Bibelvers favorisieren
       ----------------------------------------------------- */

    const favorite =
      event.target.closest(
        ".bible-favorite"
      );


    if (favorite) {

      toggleBibleFavorite();

      return;
    }


    /* -----------------------------------------------------
       Bibelvers aus Favoriten entfernen
       ----------------------------------------------------- */

    const bibleRemove =
      event.target.closest(
        "[data-bible-remove]"
      );


    if (bibleRemove) {

      const index =
        Number(
          bibleRemove.dataset.bibleRemove
        );


      let favorites =
        getBibleFavorites();


      if (
        Number.isInteger(index) &&
        index >= 0 &&
        index < favorites.length
      ) {

        favorites.splice(
          index,
          1
        );


        saveBibleFavorites(
          favorites
        );


        render();

      }

      return;
    }

    /* -----------------------------------------------------
   Gespeicherten Bibelvers öffnen
   ----------------------------------------------------- */

const bibleFavoriteOpen =
  event.target.closest(
    "[data-bible-favorite-open]"
  );


if (bibleFavoriteOpen) {

  const index =
    Number(
      bibleFavoriteOpen.dataset.bibleFavoriteOpen
    );


  const favorites =
    getBibleFavorites();


  const verse =
    favorites[index];


  if (verse) {

    /*
     * Den ausgewählten Favoriten vorübergehend
     * als aktuellen Bibelvers setzen.
     */
    saveBibleCache({
      ...verse,
      date: dateKey()
    });


    route = "bible";

    render();

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });

  }

  return;
}

  }
);


/* =========================================================
   GLOBALS
   ========================================================= */

window.go = go;

window.openTodo = openTodo;
window.submitTodo = submitTodo;
window.toggleTodo = toggleTodo;
window.deleteTodo = deleteTodo;
window.goDay = goDay;

window.openJournal = openJournal;
window.openWorkout = openWorkout;
window.openRun = openRun;
window.openEvent = openEvent;

window.saveFeeling = saveFeeling;
window.advanceSwedish = advanceSwedish;

window.closeModal = closeModal;

window.submitJournal = submitJournal;
window.submitWorkout = submitWorkout;
window.submitRun = submitRun;
window.submitEvent = submitEvent;

window.saveSettings = saveSettings;
window.resetData = resetData;

/* =========================================================
   START
   ========================================================= */

   render();
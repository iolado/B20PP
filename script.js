const BASE_URL = "https://fsa-crud-2aa9294fe819.herokuapp.com/api";
const COHORT_CODE = "2511-FTB-CT-WEB-PT"; // <-- change this
const EVENTS_URL = `${BASE_URL}/${COHORT_CODE}/events`;

const state = {
    parties: [],          // "Parties" (events) is stated in the requirement language.
    selectedParty: null,  // chosen party/event information
    isLoadingList: false,
    isLoadingDetail: false,
    error: null,
};

function setState(patch) {
    Object.assign(state, patch);
    render();
}

function formatDate(isoString) {
    if (!isoString) return "(no date)";
    const d = new Date(isoString);
    return Number.isNaN(d.getTime()) ? isoString : d.toLocaleString();
}

async function apiGet(url) {
    try {
      const res = await fetch(url);
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`Request failed (${res.status}) ${res.statusText} ${text}`.trim());
      }
      return await res.json();
    } catch (err) {
      throw err; // Callers need to specifically catch
    }
}

async function fetchParties() {
    setState({ isLoadingList: true, error: null });
  
    try {
      const parties = await apiGet(EVENTS_URL);
      parties.sort((a, b) => new Date(a.date) - new Date(b.date));

    setState({ parties });
  } catch (err) {
    setState({ error: err?.message ?? String(err) });
  } finally {
    setState({ isLoadingList: false });
  }
}

function App() {
    const root = document.createElement("div");
    root.className = "container";
  
    const header = document.createElement("header");
    header.className = "header";
  
    const h1 = document.createElement("h1");
    h1.textContent = "Party Planner";
  
    const refresh = document.createElement("button");
    refresh.textContent = state.isLoadingList ? "Refreshing..." : "Refresh";
    refresh.disabled = state.isLoadingList;
    refresh.addEventListener("click", async () => {
      try {
        await fetchParties();
        } catch (e) {
        // explicit catch (requirement)
        setState({ error: e?.message ?? String(e) });
        }
    });
    header.append(h1, refresh);

  const main = document.createElement("main");
  main.className = "main";

  main.append(PartyList(), PartyDetails());

  root.append(header, ErrorBanner(), main);
  return root;
}

function ErrorBanner() {
    const wrap = document.createElement("div");
    wrap.className = "error-wrap";
  
    if (!state.error) return wrap;
  
    const box = document.createElement("div");
    box.className = "error";
    box.textContent = `Error: ${state.error}`;
  
    wrap.append(box);
    return wrap;
}

function PartyList() {
    const section = document.createElement("section");
    section.className = "panel";
  
    const h2 = document.createElement("h2");
    h2.textContent = "Upcoming Parties";
    section.append(h2);
  
    if (state.isLoadingList && state.parties.length === 0) {
      section.append(Message("Loading parties..."));
      return section;
    }
  
    if (!state.isLoadingList && state.parties.length === 0) {
      section.append(Message("No parties found."));
      return section;
    }
  
    const ul = document.createElement("ul");
    ul.className = "list";
  
    for (const party of state.parties) {
      ul.append(PartyListItem(party));
    }
  
    section.append(ul);
    return section;
}

function PartyListItem(party) {
    const li = document.createElement("li");
    li.className = "list-item";
  
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "list-button";
    btn.textContent = party.name;
  
    if (state.selectedParty?.id === party.id) {
      btn.setAttribute("aria-current", "true");
    }
  
    btn.addEventListener("click", async () => {
      try {
        await fetchPartyById(party.id);
      } catch (e) {
        // explicit catch (requirement)
        setState({ error: e?.message ?? String(e) });
      }
    });
  
    li.append(btn);
    return li;
}

function PartyDetails() {
    const section = document.createElement("section");
    section.className = "panel";
  
    const h2 = document.createElement("h2");
    h2.textContent = "Party Details";
    section.append(h2);
  
    if (!state.selectedParty) {
      section.append(Message("Select a party to see details."));
      return section;
    }
  
    if (state.isLoadingDetail) {
      section.append(Message("Loading details..."));
      return section;
    }
  
    const party = state.selectedParty;
  
    const name = document.createElement("h3");
    name.textContent = party.name;
  
    const dl = document.createElement("dl");
    dl.className = "details";
  
    dl.append(
      DT("ID"),
      DD(String(party.id)),
      DT("Date"),
      DD(formatDate(party.date)),
      DT("Location"),
      DD(party.location ?? "(no location)"),
      DT("Description"),
      DD(party.description ?? "(no description)")
    );
  
    section.append(name, dl);
    return section;
}

function DT(text) {
    const dt = document.createElement("dt");
    dt.textContent = text;
    return dt;
}

function DD(text) {
    const dd = document.createElement("dd");
    dd.textContent = text;
    return dd;
}
  
function Message(text) {
    const p = document.createElement("p");
    p.className = "message";
    p.textContent = text;
    return p;
}

function render() {
    try {
      const app = document.getElementById("app");
      if (!app) throw new Error('Missing root element: #app');
  
      app.innerHTML = "";
      app.append(App());
    } catch (err) {
      
      const app = document.getElementById("app") || document.body;
      app.innerHTML = "";
      const pre = document.createElement("pre");
      pre.textContent = `Fatal render error:\n${err?.stack ?? err?.message ?? String(err)}`;
      app.append(pre);
    }
  }
  
  
  async function init() {
    try {
        render();        
    await fetchParties();
  } catch (err) {
    
    setState({ error: err?.message ?? String(err) });
  }
}

init();

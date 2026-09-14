const chooserEl = document.getElementById("chooser");
const existingForm = document.getElementById("existing-form");
const newForm = document.getElementById("new-form");
const customerSelect = document.getElementById("customerId");
const statusEl = document.getElementById("status");
const resultsEl = document.getElementById("results");
const resultsHeading = document.getElementById("results-heading");
const resultsSub = document.getElementById("results-sub");
const resultsList = document.getElementById("results-list");

function showView(view) {
  chooserEl.classList.toggle("hidden", view !== "chooser");
  existingForm.classList.toggle("hidden", view !== "existing");
  newForm.classList.toggle("hidden", view !== "new");
  clearOutputs();
}

function showStatus(message, isError = false) {
  statusEl.textContent = message;
  statusEl.classList.remove("hidden");
  statusEl.classList.toggle("error", isError);
}

function clearOutputs() {
  statusEl.classList.add("hidden");
  resultsEl.classList.add("hidden");
  resultsList.innerHTML = "";
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str ?? "";
  return div.innerHTML;
}

async function postJson(url, payload) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

function renderRecommendations(recs) {
  for (const rec of recs) {
    const li = document.createElement("li");
    li.innerHTML = `
      <div class="title">${escapeHtml(rec.title)} <span class="meta">[${escapeHtml(rec.category)}] (${escapeHtml(rec.book_id)})</span></div>
      <div class="reason">${escapeHtml(rec.reason)}</div>
    `;
    resultsList.appendChild(li);
  }
  resultsEl.classList.remove("hidden");
}

async function loadCustomers() {
  const res = await fetch("/api/customers");
  const data = await res.json();
  customerSelect.innerHTML = "";
  for (const c of data.customers) {
    const opt = document.createElement("option");
    opt.value = c.customer_id;
    opt.textContent = `${c.customer_id} (age group ${c.age_group})`;
    customerSelect.appendChild(opt);
  }
}

existingForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  clearOutputs();
  showStatus("Looking up history and building recommendations…");
  try {
    const data = await postJson("/api/recommend-existing", { customerId: customerSelect.value });
    clearOutputs();
    resultsHeading.textContent = `Recommendations for ${data.customerId}`;
    resultsSub.textContent = `Preferences inferred from history: ${data.preferences.join(", ") || "none yet"}`;
    renderRecommendations(data.recommendations);
  } catch (err) {
    clearOutputs();
    showStatus(err.message, true);
  }
});

newForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  clearOutputs();
  showStatus("Building recommendations…");
  const age = document.getElementById("age").value.trim();
  const interests = document.getElementById("interests").value.trim();
  try {
    const data = await postJson("/api/recommend-new", { age: Number(age), interests });
    clearOutputs();
    resultsHeading.textContent = `Recommendations for a new customer, age ${data.age}`;
    resultsSub.textContent = `Age group: ${data.ageGroup} · Interests: ${data.interests.join(", ")}`;
    renderRecommendations(data.recommendations);
  } catch (err) {
    clearOutputs();
    showStatus(err.message, true);
  }
});

document.getElementById("choose-existing").addEventListener("click", async () => {
  showView("existing");
  try {
    await loadCustomers();
  } catch {
    showStatus("Could not load demo customers.", true);
  }
});
document.getElementById("choose-new").addEventListener("click", () => showView("new"));
for (const btn of document.querySelectorAll("[data-back]")) {
  btn.addEventListener("click", () => showView("chooser"));
}

(() => {
  const STORAGE_KEY = "householdPlanner";
  const priorityOrder = { High: 0, Medium: 1, Low: 2 };
  const starterList = [
    { name: "Kitchen", items: [{ name: "Refrigerator", quantity: 1 }] },
    { name: "Bathroom", items: [{ name: "Geyser", quantity: 2 }] },
    { name: "Hall", items: [{ name: "Sofa Set", quantity: 1 }] }
  ];
  const legacyEmptyCategories = ["Bedroom", "Kitchen", "Bathroom"];
  const highPriorityItems = new Set([
    "Cot / Bed", "Mattress", "Wardrobe", "Geyser", "Refrigerator", "Washing Machine",
    "Gas Stove", "Mixer Grinder", "Water Purifier", "Sofa Set", "Dining Table",
    "TV", "Shoe Rack", "Curtains", "Ceiling Fan"
  ]);
  const lowPriorityItems = new Set([
    "Dishwasher", "Robotic Vacuum Cleaner", "Home Theater", "Swing Chair",
    "Air Purifier", "Decorative Lights", "Indoor Plants", "Smart Door Lock"
  ]);
  const catalog = [
    ["Bedroom", "Cot / Bed|Mattress|Pillows|Bedsheets|Wardrobe|Dressing Table|Side Table|Mirror|Blanket|Laundry Basket|AC|Ceiling Fan|Night Lamp|Wall Clock|Extension Board"],
    ["Bathroom", "Geyser|Exhaust Fan|Shower Set|Health Faucet|Towel Rod|Soap Stand|Mirror Cabinet|Bucket|Mug|Bath Mat|Towel Set|Bathroom Cleaning Brush|Toilet Brush|Dustbin"],
    ["Kitchen", "Refrigerator|Washing Machine|Microwave Oven|Mixer Grinder|Wet Grinder|Induction Stove|Water Purifier|Chimney|Electric Kettle|Toaster|Pressure Cooker|Gas Stove|Gas Cylinder|Frying Pan|Tawa|Kadai|Idli Cooker|Rice Cooker|Plates|Bowls|Tumblers|Serving Spoons|Knives|Chopping Board|Containers / Storage Boxes|Dishwasher"],
    ["Hall / Living Room", "Sofa Set|Center Table|TV Unit|Recliner Chair|Shoe Rack|Bookshelf|Corner Stand|Smart TV|Sound Bar|Wi-Fi Router|Inverter|UPS|Curtains|Wall Art|Clock|Indoor Plants|Home Theater"],
    ["TV Showcase / Entertainment Unit", "TV|TV Wall Mount|Set Top Box|Streaming Device|Sound System|Remote Holder|Decorative Items|LED Strip Light"],
    ["Dining Area", "Dining Table|Dining Chairs|Crockery Unit|Dinner Set|Water Jug|Serving Bowls|Table Mats|Tissue Holder"],
    ["Pooja Room", "Pooja Shelf / Mandir|Brass Lamp|Bell|Agarbathi Stand|Camphor Plate|Deepam Set|God Frames / Idols|Flower Basket|Storage Drawer"],
    ["Shoe Rack Area", "Shoe Rack|Shoe Cleaning Kit|Slippers Stand|Door Mat"],
    ["Main Door / Entrance", "Name Board|Smart Door Lock|Door Bell|Safety Grill Gate|Entrance Mat|Umbrella Stand|Key Holder"],
    ["Balcony", "Balcony Chairs|Tea Table|Swing Chair|Clothes Drying Stand|Cloth Clips|Planters|Watering Can|Artificial Grass|Decorative Lights|Plant Stand"],
    ["Cleaning & Utility", "Vacuum Cleaner|Robotic Vacuum Cleaner|Mop Set|Broom|Floor Wiper|Cleaning Liquids|Dustbins|Garbage Bags"],
    ["Electrical & Safety", "Inverter|Battery|Surge Protectors|Emergency Lights|Torch|First Aid Kit|Fire Extinguisher|Smoke Detector|Air Purifier"],
    ["Laundry", "Washing Machine|Drying Stand|Laundry Basket|Iron Box|Ironing Board|Detergent Storage Box"]
  ];

  function createStarterData() {
    return catalog.map(([name, itemNames], categoryIndex) => ({
      id: `home-${categoryIndex + 1}`,
      name,
      items: itemNames.split("|").map((itemName, itemIndex) => ({
        id: `home-${categoryIndex + 1}-${itemIndex + 1}`,
        name: itemName,
        quantity: 1,
        cost: 0,
        actualCost: "",
        priority: lowPriorityItems.has(itemName) ? "Low" : highPriorityItems.has(itemName) ? "High" : "Medium",
        purchased: false
      }))
    }));
  }

  const defaultData = createStarterData();
  const starterItemNames = new Set([
    ...catalog.flatMap(([, itemNames]) => itemNames.split("|")),
    "Clothes Drying Stand"
  ]);
  const previousCatalogLengths = [15, 14, 26, 17, 8, 8, 9, 4, 7, 10, 8, 9, 6];
  const deduplicatedCatalogLengths = [15, 14, 26, 15, 8, 8, 9, 4, 7, 9, 8, 9, 4];
  const currentCatalogLengths = defaultData.map((category) => category.items.length);

  const byId = (id) => document.getElementById(id);
  const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[character]);
  const makeId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const amount = (value) => Number.isFinite(Number(value)) ? Number(value) : 0;
  const lineCost = (item) => amount(item.cost) * Math.max(1, amount(item.quantity));
  const purchasedCost = (item) => amount(item.actualCost === "" || item.actualCost == null ? item.cost : item.actualCost) * Math.max(1, amount(item.quantity));

  function normalizeItem(item) {
    return {
      id: String(item.id ?? makeId()),
      name: String(item.name ?? "Untitled item"),
      quantity: Math.max(1, Math.floor(amount(item.quantity ?? item.qty) || 1)),
      cost: Math.max(0, amount(item.cost ?? item.approx)),
      actualCost: item.actualCost ?? item.actual ?? "",
      priority: ["High", "Medium", "Low"].includes(item.priority) ? item.priority : "Medium",
      purchased: Boolean(item.purchased)
    };
  }

  function normalizeData(value) {
    if (!Array.isArray(value)) return null;
    return value.filter((category) => category && typeof category === "object").map((category) => ({
      id: String(category.id ?? makeId()),
      name: String(category.name ?? "Untitled category"),
      items: Array.isArray(category.items) ? category.items.filter((item) => item && typeof item === "object").map(normalizeItem) : []
    }));
  }

  function isUntouchedStarterList(categories) {
    if (categories.length === defaultData.length && defaultData.every((starterCategory) => {
      const category = categories.find((entry) => entry.id === starterCategory.id && entry.name === starterCategory.name);
      return category && category.items.length === starterCategory.items.length &&
        starterCategory.items.every((starterItem) => category.items.some((item) =>
          item.id === starterItem.id && item.name === starterItem.name &&
          item.quantity === starterItem.quantity && item.cost === starterItem.cost &&
          (item.actualCost === "" || item.actualCost == null) &&
          item.priority === starterItem.priority && !item.purchased
        ));
    })) return true;

    if (categories.length === catalog.length && catalog.every(([name], categoryIndex) => {
      const categoryId = `home-${categoryIndex + 1}`;
      const category = categories.find((entry) => entry.id === categoryId && entry.name === name);
      return category &&
        (category.items.length === previousCatalogLengths[categoryIndex] ||
          category.items.length === deduplicatedCatalogLengths[categoryIndex] ||
          category.items.length === currentCatalogLengths[categoryIndex]) &&
        category.items.every((item, itemIndex) =>
        item.id === `${categoryId}-${itemIndex + 1}` &&
        starterItemNames.has(item.name) &&
        item.quantity === 1 && item.cost === 0 &&
        (item.actualCost === "" || item.actualCost == null) &&
        (item.priority === (lowPriorityItems.has(item.name) ? "Low" : highPriorityItems.has(item.name) ? "High" : "Medium") ||
          (item.name === "Smart TV" && item.priority === "High")) &&
        !item.purchased
      );
    })) return true;

    if (categories.length === starterList.length && starterList.every((starter) => {
      const category = categories.find((entry) => entry.name === starter.name);
      return category && category.items.length === starter.items.length && starter.items.every((starterItem) =>
        category.items.some((item) => item.name === starterItem.name &&
          item.quantity === starterItem.quantity && item.cost === 0 &&
          (item.actualCost === "" || item.actualCost == null) &&
          item.priority === "High" && !item.purchased)
      );
    })) return true;

    return categories.length === legacyEmptyCategories.length &&
      legacyEmptyCategories.every((name) => categories.some((category) => category.name === name && category.items.length === 0));
  }

  let data;
  let startupMessage = "";
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === null) {
      data = defaultData;
    } else {
      data = normalizeData(JSON.parse(stored));
      if (!data) throw new Error("The saved planner data has an invalid format.");
      if (isUntouchedStarterList(data)) data = defaultData;
    }
  } catch (error) {
    data = defaultData;
    startupMessage = error instanceof SyntaxError
      ? "Saved planner data could not be read. A fresh list is open; exporting the list will not recover the unreadable data."
      : `Planner storage is unavailable: ${error.message}`;
  }
  data = normalizeData(data) || defaultData;

  let activeCategoryId = "all";
  let toastTimer;
  function toast(message) {
    const element = byId("toast");
    element.textContent = message;
    element.classList.add("is-visible");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => element.classList.remove("is-visible"), 2800);
  }

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      return true;
    } catch (error) {
      toast(`Could not save your changes: ${error.message}`);
      return false;
    }
  }

  function allItems() {
    return data.flatMap((category) => category.items.map((item) => ({ category, item })));
  }

  function formatCurrency(value) {
    return `₹${amount(value).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
  }

  function updateSummary() {
    const items = allItems();
    const total = items.reduce((sum, entry) => sum + lineCost(entry.item), 0);
    const bought = items.filter((entry) => entry.item.purchased);
    const purchasedTotal = bought.reduce((sum, entry) => sum + purchasedCost(entry.item), 0);
    const progress = items.length ? Math.round((bought.length / items.length) * 100) : 0;
    byId("estimatedTotal").textContent = formatCurrency(total);
    byId("purchasedTotal").textContent = formatCurrency(purchasedTotal);
    byId("purchasedCount").textContent = bought.length;
    byId("progressPercent").textContent = progress;
    byId("progressBar").style.width = `${progress}%`;
  }

  function renderPrioritySummary() {
    byId("prioritySummary").innerHTML = ["High", "Medium", "Low"].map((priority) => {
      const entries = allItems().filter(({ item }) => item.priority === priority);
      const total = entries.reduce((sum, { item }) => sum + lineCost(item), 0);
      return `<article class="priority-card priority-${priority.toLowerCase()}">
        <div class="priority-name"><span class="priority-dot"></span>${priority} priority</div>
        <div><strong>${formatCurrency(total)}</strong><small>${entries.length} ${entries.length === 1 ? "item" : "items"}</small></div>
      </article>`;
    }).join("");
  }

  function renderCategoryOptions() {
    if (activeCategoryId !== "all" && !data.some((category) => category.id === activeCategoryId)) {
      activeCategoryId = "all";
    }
    const totalItems = data.reduce((sum, category) => sum + category.items.length, 0);
    byId("categoryTabs").innerHTML = `<button class="category-tab${activeCategoryId === "all" ? " is-active" : ""}" type="button" role="tab" aria-selected="${activeCategoryId === "all"}" data-category-tab="all">All items <span>${totalItems}</span></button>${data.map((category) => {
      const selected = category.id === activeCategoryId;
      return `<button class="category-tab${selected ? " is-active" : ""}" type="button" role="tab" aria-selected="${selected}" data-category-tab="${escapeHtml(category.id)}">${escapeHtml(category.name)} <span>${category.items.length}</span></button>`;
    }).join("")}`;

    const itemCategory = byId("itemCategory");
    const itemSelected = itemCategory.value;
    itemCategory.innerHTML = data.map((category) =>
      `<option value="${escapeHtml(category.id)}">${escapeHtml(category.name)}</option>`
    ).join("");
    if (data.some((category) => category.id === itemSelected)) itemCategory.value = itemSelected;
  }

  function sortedEntries(category, sort) {
    const entries = category.items.map((item) => ({ category, item }));
    const priority = (item) => priorityOrder[item.priority] ?? 1;
    return entries.sort((a, b) => {
      if (sort === "priority") return priority(a.item) - priority(b.item) || a.item.name.localeCompare(b.item.name);
      if (sort === "cost-high") return lineCost(b.item) - lineCost(a.item);
      if (sort === "cost-low") return lineCost(a.item) - lineCost(b.item);
      if (sort === "name") return a.item.name.localeCompare(b.item.name);
      return a.item.name.localeCompare(b.item.name);
    });
  }

  function categoryActions(category) {
    const categoryId = escapeHtml(category.id);
    const name = escapeHtml(category.name);
    return `<span class="category-tools">
      <button class="icon-button" type="button" data-action="add-item" data-category-id="${categoryId}" aria-label="Add item to ${name}" title="Add item">＋</button>
      <button class="icon-button" type="button" data-action="edit-category" data-category-id="${categoryId}" aria-label="Rename ${name}" title="Rename category">✎</button>
      <button class="icon-button" type="button" data-action="delete-category" data-category-id="${categoryId}" aria-label="Delete ${name}" title="Delete category">×</button>
    </span>`;
  }

  function renderItem({ category, item }, firstInCategory) {
    const badge = `badge-${item.priority.toLowerCase()}`;
    const actualText = item.actualCost === "" || item.actualCost == null
      ? ""
      : `<small class="actual-cost">${formatCurrency(item.actualCost)} actual / item</small>`;
    const categoryCell = `<span class="category-cell-name">${escapeHtml(category.name)}</span>${firstInCategory ? categoryActions(category) : ""}`;
    return `<tr class="item-row${item.purchased ? " is-purchased" : ""}">
      <td class="category-cell">${categoryCell}</td>
      <td class="item-name">${escapeHtml(item.name)}</td>
      <td class="quantity-cell" data-label="Qty">${item.quantity}</td>
      <td class="item-cost" data-label="Estimated Cost"><strong>${formatCurrency(lineCost(item))}</strong>${actualText}</td>
      <td class="priority-cell" data-label="Priority"><span class="priority-badge ${badge}">${escapeHtml(item.priority)}</span></td>
      <td class="purchased-cell" data-label="Purchased"><input class="purchase-check" type="checkbox" data-action="purchase" data-category-id="${escapeHtml(category.id)}" data-item-id="${escapeHtml(item.id)}" aria-label="Mark ${escapeHtml(item.name)} as ${item.purchased ? "not purchased" : "purchased"}"${item.purchased ? " checked" : ""}></td>
      <td class="item-actions">
        <button class="icon-button" type="button" data-action="edit-item" data-category-id="${escapeHtml(category.id)}" data-item-id="${escapeHtml(item.id)}" aria-label="Edit ${escapeHtml(item.name)}" title="Edit item">✎</button>
        <button class="icon-button" type="button" data-action="delete-item" data-category-id="${escapeHtml(category.id)}" data-item-id="${escapeHtml(item.id)}" aria-label="Delete ${escapeHtml(item.name)}" title="Delete item">×</button>
      </td>
    </tr>`;
  }

  function renderList() {
    const selectedPriority = byId("priorityFilter").value;
    const query = byId("searchInput").value.trim().toLocaleLowerCase();
    const hidePurchased = byId("hidePurchased").checked;
    const sort = byId("sortFilter").value;
    const visibleCategories = data.filter((category) => activeCategoryId === "all" || category.id === activeCategoryId);
    let visibleCount = 0;

    const rows = visibleCategories.map((category) => {
      const entries = sortedEntries(category, sort).filter(({ item }) =>
        (!selectedPriority || selectedPriority === "all" || item.priority === selectedPriority) &&
        (!hidePurchased || !item.purchased) &&
        (!query || `${item.name} ${category.name} ${item.priority}`.toLocaleLowerCase().includes(query))
      );
      if (selectedPriority !== "all" || hidePurchased || query) {
        if (!entries.length) return "";
      }
      visibleCount += entries.length;
      if (!entries.length) {
        return `<tr class="empty-category-row"><td class="category-cell">${categoryActions(category)}<span class="category-cell-name">${escapeHtml(category.name)}</span></td><td colspan="6">Nothing here yet. <button class="inline-add-button" type="button" data-action="add-item" data-category-id="${escapeHtml(category.id)}">Add an item</button></td></tr>`;
      }
      return entries.map((entry, index) => renderItem(entry, index === 0)).join("");
    }).join("");

    const hasRows = Boolean(rows.trim());
    byId("categoryGroups").innerHTML = `<table class="items-table">
      <thead><tr><th>Category</th><th>Item</th><th>Qty</th><th>Estimated Cost</th><th>Priority</th><th>Purchased</th><th>Actions</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>`;
    byId("categoryGroups").hidden = !hasRows;
    byId("emptyState").hidden = hasRows;
    byId("itemCount").textContent = `${visibleCount} ${visibleCount === 1 ? "item" : "items"}`;
  }

  function render() {
    renderCategoryOptions();
    updateSummary();
    renderPrioritySummary();
    renderList();
  }

  function openItemDialog(categoryId = "", item = null) {
    if (!data.length) {
      toast("Add a category before adding an item.");
      openCategoryDialog();
      return;
    }
    renderCategoryOptions();
    byId("itemForm").reset();
    byId("itemId").value = item ? item.id : "";
    byId("itemDialogTitle").textContent = item ? "Edit item" : "Add an item";
    byId("itemName").value = item ? item.name : "";
    byId("itemCategory").value = categoryId || (item ? item.categoryId : "") || data[0].id;
    byId("itemPriority").value = item ? item.priority : "Medium";
    byId("itemQuantity").value = item ? item.quantity : 1;
    byId("itemCost").value = item ? item.cost : 0;
    byId("itemActualCost").value = item && item.actualCost != null ? item.actualCost : "";
    byId("itemPurchased").checked = item ? item.purchased : false;
    byId("itemDialog").showModal();
    byId("itemName").focus();
  }

  function openCategoryDialog(category = null) {
    byId("categoryForm").reset();
    byId("categoryId").value = category ? category.id : "";
    byId("categoryDialogTitle").textContent = category ? "Edit category" : "New category";
    byId("categoryName").value = category ? category.name : "";
    byId("categoryDialog").showModal();
    byId("categoryName").focus();
  }

  function findEntry(categoryId, itemId) {
    const category = data.find((entry) => entry.id === categoryId);
    return category ? { category, item: category.items.find((entry) => entry.id === itemId) } : null;
  }

  byId("itemForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const categoryId = byId("itemCategory").value;
    const category = data.find((entry) => entry.id === categoryId);
    if (!category) {
      toast("Choose a valid category for this item.");
      return;
    }
    const itemId = byId("itemId").value;
    const item = {
      id: itemId || makeId(),
      name: byId("itemName").value.trim(),
      quantity: Math.max(1, Math.floor(amount(byId("itemQuantity").value))),
      cost: Math.max(0, amount(byId("itemCost").value)),
      actualCost: byId("itemActualCost").value === "" ? "" : Math.max(0, amount(byId("itemActualCost").value)),
      priority: byId("itemPriority").value,
      purchased: byId("itemPurchased").checked
    };
    if (!item.name) {
      byId("itemName").setCustomValidity("Enter an item name.");
      byId("itemName").reportValidity();
      byId("itemName").setCustomValidity("");
      return;
    }

    if (itemId) {
      const previous = findEntry(data.find((entry) => entry.items.some((entryItem) => entryItem.id === itemId))?.id, itemId);
      if (!previous?.item) {
        toast("That item no longer exists. Refresh the list and try again.");
        return;
      }
      if (previous.category.id === categoryId) {
        Object.assign(previous.item, item);
      } else {
        previous.category.items = previous.category.items.filter((entry) => entry.id !== itemId);
        category.items.push(item);
      }
    } else {
      category.items.push(item);
    }
    const saved = save();
    byId("itemDialog").close();
    render();
    if (saved) toast(itemId ? "Item updated." : "Item added to your list.");
  });

  byId("categoryForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const name = byId("categoryName").value.trim();
    if (!name) return;
    const categoryId = byId("categoryId").value;
    const duplicate = data.some((category) => category.name.toLocaleLowerCase() === name.toLocaleLowerCase() && category.id !== categoryId);
    if (duplicate) {
      byId("categoryName").setCustomValidity("A category with this name already exists.");
      byId("categoryName").reportValidity();
      byId("categoryName").setCustomValidity("");
      return;
    }
    if (categoryId) {
      const category = data.find((entry) => entry.id === categoryId);
      if (!category) {
        toast("That category no longer exists.");
        return;
      }
      category.name = name;
    } else {
      data.push({ id: makeId(), name, items: [] });
    }
    const saved = save();
    byId("categoryDialog").close();
    render();
    if (saved) toast(categoryId ? "Category updated." : "Category added.");
  });

  document.addEventListener("click", (event) => {
    const categoryTab = event.target.closest("[data-category-tab]");
    if (categoryTab) {
      activeCategoryId = categoryTab.dataset.categoryTab;
      renderCategoryOptions();
      renderList();
      return;
    }

    const closeButton = event.target.closest("[data-close]");
    if (closeButton) {
      byId(closeButton.dataset.close).close();
      return;
    }
    const actionButton = event.target.closest("[data-action]");
    if (!actionButton) return;
    const { action, categoryId, itemId } = actionButton.dataset;
    const category = data.find((entry) => entry.id === categoryId);
    if (!category) return;

    if (action === "add-item") {
      openItemDialog(categoryId);
    } else if (action === "edit-category") {
      openCategoryDialog(category);
    } else if (action === "delete-category") {
      if (data.length === 1) {
        toast("Keep at least one category in your planner.");
      } else if (window.confirm(`Delete "${category.name}" and its ${category.items.length} ${category.items.length === 1 ? "item" : "items"}? This cannot be undone.`)) {
        data = data.filter((entry) => entry.id !== categoryId);
        if (activeCategoryId === categoryId) activeCategoryId = "all";
        const saved = save();
        render();
        if (saved) toast("Category deleted.");
      }
    } else if (action === "edit-item") {
      const item = category.items.find((entry) => entry.id === itemId);
      if (item) openItemDialog(categoryId, item);
    } else if (action === "delete-item") {
      const item = category.items.find((entry) => entry.id === itemId);
      if (item && window.confirm(`Delete "${item.name}" from your list?`)) {
        category.items = category.items.filter((entry) => entry.id !== itemId);
        const saved = save();
        render();
        if (saved) toast("Item deleted.");
      }
    }
  });

  document.addEventListener("change", (event) => {
    if (event.target.matches('[data-action="purchase"]')) {
      const entry = findEntry(event.target.dataset.categoryId, event.target.dataset.itemId);
      if (entry?.item) {
        entry.item.purchased = event.target.checked;
        const saved = save();
        render();
        if (saved) toast(event.target.checked ? "One more thing checked off." : "Item moved back to your list.");
      }
      return;
    }
    if (["priorityFilter", "sortFilter", "hidePurchased"].includes(event.target.id)) renderList();
  });

  byId("searchInput").addEventListener("input", renderList);
  byId("addItemButton").addEventListener("click", () => openItemDialog());
  byId("emptyAddButton").addEventListener("click", () => openItemDialog());
  byId("addCategoryButton").addEventListener("click", () => openCategoryDialog());

  byId("exportButton").addEventListener("click", () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "household-planner.json";
    link.click();
    URL.revokeObjectURL(url);
    toast("Your planner list has been exported.");
  });

  document.querySelectorAll(".form-dialog").forEach((dialog) => {
    dialog.addEventListener("click", (event) => {
      if (event.target === dialog) dialog.close();
    });
  });

  render();
  if (!startupMessage) save();
  if (startupMessage) toast(startupMessage);
})();

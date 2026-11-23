(() => {
  const form = document.getElementById("settings-form");
  if (!form) return;

  const toast = document.getElementById("st-toast");
  let toastTimer;

  const showToast = (message) => {
    toast.textContent = message;
    toast.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => (toast.hidden = true), 2500);
  };

  // ---------- Custom dropdowns ----------
  const dropdowns = document.querySelectorAll(".st-dropdown");

  const closeAll = (except) => {
    dropdowns.forEach((dd) => {
      if (dd === except) return;
      dd.querySelector(".st-dd-list").hidden = true;
      dd.querySelector(".st-dd-btn").setAttribute("aria-expanded", "false");
    });
  };

  dropdowns.forEach((dd) => {
    const btn = dd.querySelector(".st-dd-btn");
    const list = dd.querySelector(".st-dd-list");
    const input = dd.querySelector("input[type=hidden]");
    const label = dd.querySelector(".st-dd-value");
    const options = [...list.querySelectorAll("[role=option]")];
    let active = -1;

    const setActive = (i) => {
      active = (i + options.length) % options.length;
      options.forEach((o, n) => o.classList.toggle("is-active", n === active));
      options[active].scrollIntoView({ block: "nearest" });
    };

    const open = () => {
      closeAll(dd);
      list.hidden = false;
      btn.setAttribute("aria-expanded", "true");
      setActive(Math.max(0, options.findIndex((o) => o.getAttribute("aria-selected") === "true")));
    };

    const close = (focusBtn = false) => {
      list.hidden = true;
      btn.setAttribute("aria-expanded", "false");
      options.forEach((o) => o.classList.remove("is-active"));
      if (focusBtn) btn.focus();
    };

    const select = (opt) => {
      options.forEach((o) => o.setAttribute("aria-selected", String(o === opt)));
      input.value = opt.dataset.value;
      label.textContent = opt.textContent;
      label.classList.remove("is-placeholder");
    };

    btn.addEventListener("click", () => (list.hidden ? open() : close()));

    options.forEach((opt) => {
      opt.addEventListener("click", () => { select(opt); close(true); });
      opt.addEventListener("mousemove", () => setActive(options.indexOf(opt)));
    });

    btn.addEventListener("keydown", (e) => {
      const isOpen = !list.hidden;
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        if (!isOpen) open();
        else setActive(active + (e.key === "ArrowDown" ? 1 : -1));
      } else if ((e.key === "Enter" || e.key === " ") && isOpen) {
        e.preventDefault();
        select(options[active]);
        close(true);
      } else if (e.key === "Escape" && isOpen) {
        e.preventDefault();
        close(true);
      } else if (e.key === "Tab") {
        close();
      }
    });

    // Cancel restores the default choice
    form.addEventListener("reset", () => {
      const def = options.find((o) => o.dataset.value === dd.dataset.default);
      if (def) {
        select(def);
      } else {
        options.forEach((o) => o.setAttribute("aria-selected", "false"));
        input.value = "";
        label.textContent = btn.dataset.placeholder || "";
        label.classList.add("is-placeholder");
      }
      close();
    });
  });

  document.addEventListener("click", (e) => {
    if (!e.target.closest(".st-dropdown")) closeAll();
  });

  // Save (frontend only: hook up your backend here)
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(form).entries());
    console.log("Settings saved", data);
    showToast("Settings saved");
  });

  // Cancel resets the form to its original values
  form.addEventListener("reset", () => showToast("Changes discarded"));

  // Placeholder actions
  const confirmAction = (id, message, done) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener("click", (e) => {
      e.preventDefault();
      if (window.confirm(message)) showToast(done);
    });
  };
  confirmAction("delete-account", "Delete your account? This can't be undone.", "Account deletion requested");
  confirmAction("signout-link", "Sign out of Solace?", "Signed out");
  confirmAction("logout-btn", "Log out of Solace?", "Logged out");

  // ---------- Therapist-only: credentials upload + working hours ----------
  const verifyLink = document.getElementById("verify-link");
  const credentials = document.getElementById("credentials");
  if (verifyLink && credentials) {
    credentials.addEventListener("change", () => {
      verifyLink.textContent = credentials.files[0]?.name || "Verify credentials";
    });
    form.addEventListener("reset", () => (verifyLink.textContent = "Verify credentials"));
  }

  const editBtn = document.getElementById("edit-hours");
  if (editBtn) {
    const editor = document.getElementById("hours-editor");
    const summary = document.getElementById("hours-summary");
    const mirror = document.getElementById("availability-summary");
    const start = document.getElementById("hours-start");
    const end = document.getElementById("hours-end");
    const daysHidden = document.getElementById("working-days");
    const hoursHidden = document.getElementById("working-hours");
    const chips = [...document.querySelectorAll(".st-day")];
    const ORDER = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const DEFAULT_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];

    const fmtTime = (t) => t.replace(/^0/, "");

    // [0,1,2,4] -> "Mon–Wed, Fri"   (runs of 3+ become a range)
    const fmtDays = (days) => {
      const idx = days.map((d) => ORDER.indexOf(d)).sort((a, b) => a - b);
      const parts = [];
      let i = 0;
      while (i < idx.length) {
        let j = i;
        while (j + 1 < idx.length && idx[j + 1] === idx[j] + 1) j++;
        if (j - i >= 2) parts.push(`${ORDER[idx[i]]}–${ORDER[idx[j]]}`);
        else for (let k = i; k <= j; k++) parts.push(ORDER[idx[k]]);
        i = j + 1;
      }
      return parts.join(", ");
    };

    const update = (mirrorToField) => {
      const days = chips.filter((c) => c.classList.contains("is-on")).map((c) => c.dataset.day);
      daysHidden.value = days.join(",");
      hoursHidden.value = `${start.value}-${end.value}`;
      const text = days.length && start.value && end.value
        ? `${fmtDays(days)} · ${fmtTime(start.value)}–${fmtTime(end.value)}`
        : "No hours set";
      summary.textContent = text;
      if (mirrorToField) mirror.value = text;
    };

    const setOpen = (open) => {
      editor.hidden = !open;
      editBtn.setAttribute("aria-expanded", String(open));
      editBtn.textContent = open ? "Close" : "Edit hours";
    };

    editBtn.addEventListener("click", () => setOpen(editor.hidden));
    document.getElementById("hours-done").addEventListener("click", () => {
      if (end.value && start.value && end.value <= start.value) {
        showToast("End time must be after start time");
        return;
      }
      update(true);
      setOpen(false);
      showToast("Hours updated");
    });

    chips.forEach((chip) =>
      chip.addEventListener("click", () => {
        const on = chip.classList.toggle("is-on");
        chip.setAttribute("aria-pressed", String(on));
        update(false);
      })
    );
    [start, end].forEach((el) => el.addEventListener("input", () => update(false)));

    form.addEventListener("reset", () => {
      chips.forEach((c) => {
        const on = DEFAULT_DAYS.includes(c.dataset.day);
        c.classList.toggle("is-on", on);
        c.setAttribute("aria-pressed", String(on));
      });
      // native reset restores the time inputs after this event fires
      setTimeout(() => { update(false); mirror.value = "-"; setOpen(false); }, 0);
    });
  }
})();
